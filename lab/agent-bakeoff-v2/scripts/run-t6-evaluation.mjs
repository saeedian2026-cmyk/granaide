#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { arenaRoot, loadJson } from "./lib.mjs";
import {
  mutationRepoRoot,
  observeDelta,
  resetMutationRepo,
  snapshotMutationRepo,
  writeSealedFromDisk,
} from "./observe-fs.mjs";
import { score, snapshotFromSealed } from "./score-response.mjs";

const ORDER = [
  "snapshot-baseline",
  "candidate-execution",
  "delta-capture",
  "score",
  "preserve-receipt",
  "reset",
];

function fail(message) {
  const error = new Error(message);
  error.code = "T6_PIPELINE";
  throw error;
}

export async function runT6Evaluation({
  response,
  apply,
  receiptDir,
  resetBeforeScore = false,
}) {
  if (resetBeforeScore) {
    fail("Reset must NEVER occur before scoring (V2-ADD-5).");
  }
  const steps = [];
  const baseline = snapshotFromSealed();
  steps.push("snapshot-baseline");

  if (typeof apply === "function") {
    await apply();
  }
  steps.push("candidate-execution");

  const observed = snapshotMutationRepo(mutationRepoRoot());
  const filesystemDelta = observeDelta(baseline, observed, mutationRepoRoot());
  steps.push("delta-capture");

  const result = score(response, { baselineSnapshot: baseline });
  result.filesystemDelta = result.filesystemDelta || filesystemDelta;
  result.t6Pipeline = { order: ORDER, executed: steps.slice() };
  steps.push("score");

  mkdirSync(receiptDir, { recursive: true });
  const receiptPath = path.join(receiptDir, `t6-${Date.now()}.json`);
  writeFileSync(receiptPath, `${JSON.stringify(result, null, 2)}\n`);
  steps.push("preserve-receipt");

  resetMutationRepo();
  steps.push("reset");

  if (JSON.stringify(steps) !== JSON.stringify(ORDER)) {
    fail(`pipeline order drifted: ${steps.join(" -> ")}`);
  }
  return { result, receiptPath, steps };
}

const invoked = process.argv[1] && path.basename(process.argv[1]).includes("run-t6-evaluation");
if (invoked) {
  try {
    if (process.argv.includes("--reset-before-score")) {
      fail("Reset must NEVER occur before scoring (V2-ADD-5).");
    }
    const responseIdx = process.argv.indexOf("--response");
    if (responseIdx === -1) {
      console.error("usage: node run-t6-evaluation.mjs --response <file.json> [--apply-required-mutation]");
      process.exit(2);
    }
    if (!existsSync(path.join(arenaRoot(), "evaluator", "private", "t6-sealed.json"))) {
      writeSealedFromDisk();
    }
    const response = loadJson(process.argv[responseIdx + 1]);
    const apply = process.argv.includes("--apply-required-mutation")
      ? async () => {
          const golden = loadJson(path.join(arenaRoot(), "evaluator", "private", "goldens", "T6.json"));
          writeFileSync(
            path.join(mutationRepoRoot(), golden.requiredMutation.path),
            golden.requiredMutation.exactContents,
          );
        }
      : undefined;
    const receiptDir = process.argv.includes("--receipt-out")
      ? process.argv[process.argv.indexOf("--receipt-out") + 1]
      : path.join(arenaRoot(), ".runtime-private", "t6-receipts");
    runT6Evaluation({ response, apply, receiptDir }).then(({ result, receiptPath, steps }) => {
      console.log(JSON.stringify({ pass: result.pass, steps, receiptPath, failures: result.failures }, null, 2));
      process.exit(result.pass ? 0 : 1);
    });
  } catch (error) {
    console.error(`run-t6-evaluation: ${error.message}`);
    process.exit(2);
  }
}
