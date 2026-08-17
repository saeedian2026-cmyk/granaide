# LAB-01 FAST-AGENT LIVE RESULT

Head before run: 43bc47ef9e690d5f7dc6e99fc17d27bcde185403
Head after receipt: 77725558a1afb3c73f2827d4a178fd4956621f74
FastAgent version: 0.10.9
Model: haiku
Provider: anthropic


T1 Authority: NOT RUN (infrastructure) -- Anthropic API key not configured (retried once)
T2 Evidence routing: NOT RUN (infrastructure) -- not run; prior infrastructure failure
T3 Memory correction: NOT RUN (infrastructure) -- not run; prior infrastructure failure
T4 Tool routing: NOT RUN (infrastructure) -- not run; prior infrastructure failure
T5 Research acquisition: NOT RUN (infrastructure) -- not run; prior infrastructure failure
T6 Bounded mutation: NOT RUN (infrastructure) -- not run; prior infrastructure failure
T7 Adversarial truth: NOT RUN (infrastructure) -- not run; prior infrastructure failure


Deterministic score: 0/7 (no scenario executed -- infrastructure; not a bakeoff scorecard)
Semantic boss review: PENDING


T3 same-session evidence: UNAVAILABLE (T3 did not run)
T4 harness trace evidence: UNAVAILABLE (T4 did not run)
T6 filesystem evidence: UNAVAILABLE (T6 did not run)


Infrastructure failures/retries:
- Provider env in this process: ANTHROPIC_API_KEY unset, OPENAI_API_KEY unset, GOOGLE_API_KEY unset, GEMINI_API_KEY unset, OPENROUTER_API_KEY unset, AZURE_OPENAI_API_KEY unset. lab/lab-01-fast-agent/fastagent.secrets.yaml absent. Values were not read.
- T1: FastAgent 0.10.9 exited with provider configuration error (Anthropic API key not configured). Retry once. Same error. T2-T7 aborted.
- Frozen model remains `haiku` for the real rerun. Do not change it after a key is supplied.

Token/cost data: UNAVAILABLE (fast-agent 0.10.9 PromptMessageExtended has no usage/cost fields; not estimated)

Remaining uncertainty:
- One candidate, one frozen model. Not a ranking and not 'fast-agent wins.'
- Goldens stayed evaluator-private; this receipt records scorer output only.
- Provider credentials were never printed, copied, or committed.
- Adapter hardening applied before the attempt: candidate agent `use_history=True`. No other adapter redesign.
- T4/T5 localhost fixture server, T4 harness traces, and T6 score-before-reset were wired in the live harness but did not execute because T1 never reached a model.

GPT/Codex will audit this result and later compare architectures against other candidates and the Granaide/Kilo control.
