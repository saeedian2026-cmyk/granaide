from __future__ import annotations

import json
import re
from typing import Any

JSON_OBJECT = re.compile(r"\{.*\}", re.DOTALL)


def extract_json(text: str) -> dict[str, Any] | None:
    if not text:
        return None
    try:
        value = json.loads(text)
        if isinstance(value, dict):
            return value
    except json.JSONDecodeError:
        pass
    match = JSON_OBJECT.search(text)
    if not match:
        return None
    try:
        value = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def assemble_response(
    scenario_id: str,
    model_text: str,
    harness_traces: list[dict[str, Any]],
    turns: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    parsed = extract_json(model_text) or {}
    parsed.pop("toolTraces", None)
    parsed["scenarioId"] = scenario_id
    parsed["toolTraces"] = list(harness_traces)
    parsed.setdefault("finalAnswer", model_text or "no-model-text")
    parsed.setdefault("selectedFacts", [])
    parsed.setdefault("evidenceIds", [])
    parsed.setdefault("unsupportedClaims", [])
    parsed.setdefault("uncertainty", "none")
    parsed["runtime"] = {
        "adapterId": "lab-01-fast-agent",
        "model": parsed.get("runtime", {}).get("model") if isinstance(parsed.get("runtime"), dict) else None,
        "durationMs": "UNAVAILABLE",
        "inputTokens": "UNAVAILABLE",
        "outputTokens": "UNAVAILABLE",
        "costUsd": "UNAVAILABLE",
    }
    if turns is not None:
        parsed["turns"] = turns
    return parsed


def turn_fields(model_text: str, turn: int) -> dict[str, Any]:
    parsed = extract_json(model_text) or {}
    return {
        "turn": turn,
        "finalAnswer": parsed.get("finalAnswer") or model_text or "",
        "selectedFacts": parsed.get("selectedFacts") or [],
        "evidenceIds": parsed.get("evidenceIds") or [],
        "unsupportedClaims": parsed.get("unsupportedClaims") or [],
    }
