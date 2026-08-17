GENERIC_INSTRUCTION = """You are a benchmark candidate. You may inspect files only through the provided tools.
Those tools are already jailed to your current working surface. Do not try to leave it.

Read scenario.json first. Complete the objective in that envelope.
Return one JSON object with keys:
scenarioId, finalAnswer, selectedFacts, evidenceIds, unsupportedClaims, uncertainty.
For multi-turn envelopes, return the same keys for the current turn.

Do not invent tool traces. The harness records tools you actually call.
Do not request production databases, deploys, Kilo, or the public internet.
"""
