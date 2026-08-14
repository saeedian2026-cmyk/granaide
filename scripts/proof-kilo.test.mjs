#!/usr/bin/env node
/**
 * CURSOR-03 harness proofs: --help, KILO_NOT_AVAILABLE, mock fixture parse.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseKiloJsonEvents, runProof } from "./proof-kilo.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "proof-kilo.mjs");
const packDir = path.join(root, "products", "stallvix-kilo-pack");
const promptFile = path.join(packDir, "PROOF-TEST-A.md");

// H1 — help without kilo
{
  const r = spawnSync(process.execPath, [script, "--help"], {
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Headless Kilo proof harness/);
  assert.match(r.stdout, /--workspace/);
  console.log("H1 --help OK");
}

// H2 — missing kilo fails loud
{
  const tmpWs = fs.mkdtempSync(path.join(os.tmpdir(), "proof-ws-"));
  // minimal git repo so git facts work
  spawnSync("git", ["init"], { cwd: tmpWs, encoding: "utf8", windowsHide: true });
  spawnSync("git", ["config", "user.email", "test@example.com"], {
    cwd: tmpWs,
    encoding: "utf8",
    windowsHide: true,
  });
  spawnSync("git", ["config", "user.name", "test"], {
    cwd: tmpWs,
    encoding: "utf8",
    windowsHide: true,
  });
  fs.writeFileSync(path.join(tmpWs, "README.md"), "tmp\n");
  spawnSync("git", ["add", "."], { cwd: tmpWs, encoding: "utf8", windowsHide: true });
  spawnSync("git", ["commit", "-m", "init"], {
    cwd: tmpWs,
    encoding: "utf8",
    windowsHide: true,
  });

  const r = spawnSync(
    process.execPath,
    [
      script,
      "--workspace",
      tmpWs,
      "--agent",
      "stallvix-investigator",
      "--prompt-file",
      promptFile,
      "--pack-dir",
      packDir,
      "--kilo-bin",
      path.join(tmpWs, "definitely-missing-kilo.exe"),
    ],
    { encoding: "utf8", windowsHide: true },
  );
  assert.equal(r.status, 2, `expected exit 2, got ${r.status}: ${r.stdout}\n${r.stderr}`);
  assert.match(`${r.stdout}\n${r.stderr}`, /KILO_NOT_AVAILABLE/);
  console.log("H2 KILO_NOT_AVAILABLE OK");
  fs.rmSync(tmpWs, { recursive: true, force: true });
}

// H3 — mock fixture capture
{
  const tmpWs = fs.mkdtempSync(path.join(os.tmpdir(), "proof-mock-"));
  spawnSync("git", ["init"], { cwd: tmpWs, encoding: "utf8", windowsHide: true });
  spawnSync("git", ["config", "user.email", "test@example.com"], {
    cwd: tmpWs,
    encoding: "utf8",
    windowsHide: true,
  });
  spawnSync("git", ["config", "user.name", "test"], {
    cwd: tmpWs,
    encoding: "utf8",
    windowsHide: true,
  });
  fs.writeFileSync(path.join(tmpWs, "README.md"), "tmp\n");
  spawnSync("git", ["add", "."], { cwd: tmpWs, encoding: "utf8", windowsHide: true });
  spawnSync("git", ["commit", "-m", "init"], {
    cwd: tmpWs,
    encoding: "utf8",
    windowsHide: true,
  });

  const fixture = path.join(tmpWs, "events.jsonl");
  fs.writeFileSync(
    fixture,
    [
      JSON.stringify({ type: "session", sessionID: "sess-mock-001" }),
      JSON.stringify({ type: "message", role: "assistant", text: "hello" }),
      JSON.stringify({ type: "result", exit: 0 }),
    ].join("\n") + "\n",
    "utf8",
  );

  const result = runProof({
    workspace: tmpWs,
    agent: "stallvix-investigator",
    promptFile,
    packDir,
    timeoutMs: 5000,
    format: "json",
    mockFixture: fixture,
    kiloBin: null,
    dryGitOnly: false,
  });
  assert.equal(result.ok, true, result.error);
  assert.equal(result.bundle.runtime.sessionId, "sess-mock-001");
  assert.ok(result.bundle.git.before.head);
  assert.ok(fs.existsSync(result.paths.jsonPath));
  assert.ok(fs.existsSync(result.paths.mdPath));
  console.log("H3 mock fixture OK");

  // cleanup harness artifacts from this test
  fs.rmSync(result.paths.jsonPath, { force: true });
  fs.rmSync(result.paths.mdPath, { force: true });
  fs.rmSync(tmpWs, { recursive: true, force: true });
}

// parse helper
{
  const { sessionId, events } = parseKiloJsonEvents(
    '{"sessionID":"abc"}\nnot-json\n{"type":"x"}\n',
  );
  assert.equal(sessionId, "abc");
  assert.equal(events.length, 3);
  console.log("parseKiloJsonEvents OK");
}

console.log("CURSOR-03 harness proofs OK");
