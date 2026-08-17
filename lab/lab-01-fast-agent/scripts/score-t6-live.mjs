#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resetMutationRepo } from "../../agent-bakeoff-v2/scripts/observe-fs.mjs";
import { runT6Evaluation } from "../../agent-bakeoff-v2/scripts/run-t6-evaluation.mjs";

const lab01Root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runDir = process.argv[2];
const model = process.argv[3] || "haiku";
if (!runDir) {
  console.error("usage: node scripts/score-t6-live.mjs <runDir> <model>");
  process.exit(2);
}
mkdirSync(runDir, { recursive: true });
const assembledPath = path.join(runDir, "assembled.json");
const holder = {};

try {
  const { result } = await runT6Evaluation({
    response: holder,
    apply: async () => {
      const spawned = spawnSync(
        "uv",
        ["run", "python", "-m", "lab01.live_exec", "--scenario", "T6", "--out", runDir, "--model", model],
        { cwd: lab01Root, stdio: "inherit", shell: true },
      );
      if (spawned.status !== 0) {
        throw new Error(`T6 candidate process exit ${spawned.status}`);
      }
      if (!existsSync(assembledPath)) {
        throw new Error("T6 candidate did not write assembled.json");
      }
      Object.assign(holder, JSON.parse(readFileSync(assembledPath, "utf8")));
    },
    receiptDir: path.join(runDir, "t6-pipeline-receipt"),
  });
  writeFileSync(path.join(runDir, "score.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, pass: result.pass, t6Pipeline: result.t6Pipeline }));
} catch (error) {
  try {
    resetMutationRepo();
  } catch {
    // still surface the original candidate/pipeline error
  }
  throw error;
}
