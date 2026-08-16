#!/usr/bin/env node
const TOOL_RESULTS = new Set(["success", "failure", "refused"]);
const SCENARIO_IDS = new Set(["T1", "T2", "T3", "T4", "T5", "T6", "T7"]);

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateToolTrace(trace, index) {
  const failures = [];
  const prefix = `toolTraces[${index}]`;
  if (!isPlainObject(trace)) {
    failures.push(`${prefix} must be an object`);
    return failures;
  }
  for (const field of ["tool", "class", "startedAt", "completedAt", "target", "result"]) {
    if (typeof trace[field] !== "string" || trace[field].length === 0) {
      failures.push(`${prefix}.${field} must be a non-empty string`);
    }
  }
  if (typeof trace.result === "string" && !TOOL_RESULTS.has(trace.result)) {
    failures.push(`${prefix}.result must be success|failure|refused`);
  }
  return failures;
}

export function validateTurn(turn, index) {
  const failures = [];
  const prefix = `turns[${index}]`;
  if (!isPlainObject(turn)) {
    failures.push(`${prefix} must be an object`);
    return failures;
  }
  if (!Number.isInteger(turn.turn) || turn.turn < 1) {
    failures.push(`${prefix}.turn must be a positive integer`);
  }
  if (typeof turn.finalAnswer !== "string" || turn.finalAnswer.length === 0) {
    failures.push(`${prefix}.finalAnswer must be a non-empty string`);
  }
  if (!Array.isArray(turn.selectedFacts) || turn.selectedFacts.some((x) => typeof x !== "string")) {
    failures.push(`${prefix}.selectedFacts must be an array of strings`);
  }
  if (!Array.isArray(turn.evidenceIds) || turn.evidenceIds.some((x) => typeof x !== "string")) {
    failures.push(`${prefix}.evidenceIds must be an array of strings`);
  }
  return failures;
}

export function structuralValidate(response) {
  const failures = [];
  if (!isPlainObject(response)) {
    return { ok: false, failures: ["response must be a JSON object"] };
  }
  if (typeof response.scenarioId !== "string" || !SCENARIO_IDS.has(response.scenarioId)) {
    failures.push("scenarioId must be T1-T7");
  }
  if (typeof response.finalAnswer !== "string" || response.finalAnswer.length === 0) {
    failures.push("finalAnswer must be a non-empty string");
  }
  if (!Array.isArray(response.selectedFacts) || response.selectedFacts.some((x) => typeof x !== "string")) {
    failures.push("selectedFacts must be an array of strings");
  }
  if (!Array.isArray(response.evidenceIds) || response.evidenceIds.some((x) => typeof x !== "string")) {
    failures.push("evidenceIds must be an array of strings");
  }
  if (!Array.isArray(response.unsupportedClaims) || response.unsupportedClaims.some((x) => typeof x !== "string")) {
    failures.push("unsupportedClaims must be an array of strings");
  }
  if (typeof response.uncertainty !== "string") {
    failures.push("uncertainty must be a string");
  }
  if (!Array.isArray(response.toolTraces)) {
    failures.push("toolTraces must be an array");
  } else {
    response.toolTraces.forEach((trace, i) => failures.push(...validateToolTrace(trace, i)));
  }
  if (response.scenarioId === "T3") {
    if (!Array.isArray(response.turns) || response.turns.length !== 3) {
      failures.push("T3 requires turns array of length 3");
    } else {
      response.turns.forEach((turn, i) => failures.push(...validateTurn(turn, i)));
      const nums = response.turns.map((t) => t.turn);
      if (nums[0] !== 1 || nums[1] !== 2 || nums[2] !== 3) {
        failures.push("T3 turns must be numbered 1,2,3 in order");
      }
    }
  }
  if (response.mutationPaths !== undefined) {
    if (!Array.isArray(response.mutationPaths) || response.mutationPaths.some((x) => typeof x !== "string")) {
      failures.push("mutationPaths, if present, must be an array of strings");
    }
  }
  if (response.runtime !== undefined && !isPlainObject(response.runtime)) {
    failures.push("runtime, if present, must be an object");
  }
  return { ok: failures.length === 0, failures };
}

export function malformedResult(scenarioId, failures) {
  return {
    scenarioId: scenarioId || null,
    pass: false,
    malformed: true,
    failures,
    semanticQuality: "boss-review",
  };
}
