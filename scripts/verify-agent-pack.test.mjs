#!/usr/bin/env node
/**
 * CURSOR-02 proof: valid pack PASS + two deliberate FAIL mutations.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyAgentPack } from "./verify-agent-pack.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packDir = path.join(root, "products", "stallvix-kilo-pack");

function copyPack(dest) {
  fs.cpSync(packDir, dest, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}node_modules${path.sep}`),
  });
}

function mutateJsonc(file, mutator) {
  let text = fs.readFileSync(file, "utf8");
  text = mutator(text);
  fs.writeFileSync(file, text, "utf8");
}

function failId(report, id) {
  const row = report.results.find((r) => r.id === id);
  assert.ok(row, `missing check ${id}`);
  assert.equal(row.ok, false, `expected FAIL ${id}, got PASS — ${row.detail}`);
}

// V1 — valid pack
{
  const report = verifyAgentPack(packDir);
  assert.equal(report.failed, 0, formatFails(report));
  console.log("V1 valid-pack PASS");
}

// V3 — safe default flipped to implementer
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pack-bad-default-"));
  copyPack(tmp);
  mutateJsonc(path.join(tmp, "kilo.jsonc"), (t) =>
    t.replace(
      '"default_agent": "stallvix-investigator"',
      '"default_agent": "stallvix-implementer"',
    ),
  );
  const report = verifyAgentPack(tmp);
  assert.ok(report.failed > 0, "expected non-zero failures");
  failId(report, "agent.default_safe");
  console.log("V3 broken-default FAIL agent.default_safe");
  fs.rmSync(tmp, { recursive: true, force: true });
}

// V2 — investigator edit deny removed
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pack-bad-edit-"));
  copyPack(tmp);
  mutateJsonc(path.join(tmp, "kilo.jsonc"), (t) =>
    t.replace(
      // first investigator block edit deny
      /("stallvix-investigator"[\s\S]*?"edit": )("deny")/,
      '$1"ask"',
    ),
  );
  const report = verifyAgentPack(tmp);
  assert.ok(report.failed > 0, "expected non-zero failures");
  failId(report, "investigator.edit_deny");
  console.log("V2 broken-edit-deny FAIL investigator.edit_deny");
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("CURSOR-02 verifier proofs OK");

function formatFails(report) {
  return report.results
    .filter((r) => !r.ok)
    .map((r) => `${r.id}: ${r.detail}`)
    .join("; ");
}
