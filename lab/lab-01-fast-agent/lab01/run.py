from __future__ import annotations

import os
from collections.abc import Callable

from fast_agent import FastAgent

from lab01.assemble import assemble_response, turn_fields
from lab01.instruction import GENERIC_INSTRUCTION
from lab01.paths import LAB01_ROOT
from lab01.prepare import activate_surface, reset_control, set_current_root
from lab01.traces import read_traces, reset_traces

CONFIG = str(LAB01_ROOT / "fastagent.config.yaml")


def _make_app(model: str) -> FastAgent:
    return FastAgent(
        "LAB-01",
        config_path=CONFIG,
        parse_cli_args=False,
        quiet=True,
        workspace=LAB01_ROOT,
    )


async def run_scenario(
    scenario_id: str,
    model: str | None = None,
    send: Callable | None = None,
) -> dict:
    """Run one scenario through a single FastAgent session.

    T3 keeps that same session across three filesystem slices.
    toolTraces always come from the harness, never from model JSON.
    """
    chosen = model or os.environ.get("FAST_AGENT_MODEL") or "passthrough"
    reset_control()
    reset_traces()

    fast = _make_app(chosen)

    @fast.agent(
        name="candidate",
        instruction=GENERIC_INSTRUCTION,
        servers=["arena_surface"],
        model=chosen,
    )
    async def _agent() -> None:
        return None

    turns_out = []
    model_text = ""
    async with fast.run() as agent:
        session = agent.candidate
        if scenario_id == "T3":
            for turn in (1, 2, 3):
                surface = activate_surface("T3", turn)
                envelope = (surface / "scenario.json").read_text(encoding="utf-8")
                prompt = (
                    f"This is turn {turn} of 3. Your filesystem has been replaced with this turn's surface.\n"
                    f"Envelope:\n{envelope}\n"
                    "Return JSON for this turn."
                )
                if send:
                    reply = await send(session, prompt, turn, surface)
                else:
                    reply = await session.send(prompt)
                text = str(reply)
                model_text = text
                turns_out.append(turn_fields(text, turn))
            history = _history_text(session)
            response = assemble_response("T3", model_text, read_traces(), turns=turns_out)
            response["runtime"]["sessionContinuity"] = {
                "sameAgent": True,
                "userTurns": history.count("turn ") and 3 or _user_message_count(session),
            }
            return response

        surface = activate_surface(scenario_id)
        envelope = (surface / "scenario.json").read_text(encoding="utf-8")
        prompt = f"Envelope:\n{envelope}\nReturn JSON for this scenario."
        if send:
            reply = await send(session, prompt, None, surface)
        else:
            reply = await session.send(prompt)
        return assemble_response(scenario_id, str(reply), read_traces())


def _user_message_count(session) -> int:
    history = getattr(session, "message_history", None)
    if history is None:
        llm = getattr(session, "_llm", None) or getattr(session, "llm", None)
        history = getattr(llm, "history", None) if llm is not None else None
    if history is None:
        return 0
    messages = history if isinstance(history, list) else getattr(history, "messages", history)
    try:
        return len(list(messages))
    except TypeError:
        return 0


def _history_text(session) -> str:
    return str(getattr(session, "message_history", "") or "")
