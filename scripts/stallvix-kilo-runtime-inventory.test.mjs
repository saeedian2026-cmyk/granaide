import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  classifyRuntimePath,
  inventoryRuntimeRoot,
  isInsideRoot,
  sanitizeRuntimePath,
} from "./stallvix-kilo-runtime-inventory.mjs";

test("inventory helper classifies and redacts without emitting contents", () => {
  assert.equal(classifyRuntimePath("tool-output/run.txt"), "tool-output");
  assert.equal(classifyRuntimePath("kilo/session.json"), "session");
  assert.equal(classifyRuntimePath("cache/models.bin"), "cache");
  assert.equal(classifyRuntimePath("notes.txt"), "unknown");
  assert.equal(classifyRuntimePath("secrets/credentials.json"), "auth-like");

  const redacted = sanitizeRuntimePath("secrets/credentials.json");
  assert.equal(redacted.path, "[REDACTED]");
  assert.equal(redacted.path_sha256.length, 64);
  assert.equal(JSON.stringify(redacted).includes("credentials"), false);
});

test("isInsideRoot rejects escaped real paths", () => {
  assert.equal(isInsideRoot("/repo/.kilo-runtime-data", "/repo/.kilo-runtime-data/tool-output"), true);
  assert.equal(isInsideRoot("/repo/.kilo-runtime-data", "/repo/.kilo-runtime-data"), true);
  assert.equal(isInsideRoot("/repo/.kilo-runtime-data", "/tmp/escaped"), false);
  assert.equal(isInsideRoot("/repo/.kilo-runtime-data", "/repo/.kilo-runtime-data-evil"), false);
});

test("inventory walks a synthetic fixture and never emits file contents", async () => {
  const root = await mkdtemp(join(tmpdir(), "svx-kilo-inventory-"));
  try {
    await mkdir(join(root, "tool-output"), { recursive: true });
    await writeFile(join(root, "tool-output", "ok.txt"), "HELLO_SHOULD_NOT_APPEAR\n", "utf8");
    await writeFile(join(root, "credentials.json"), "FAKE_TOKEN_NOT_FOR_OUTPUT\n", "utf8");

    const rows = await inventoryRuntimeRoot(root);
    assert.equal(rows.length, 2);

    const tool = rows.find((row) => row.category === "tool-output");
    const auth = rows.find((row) => row.category === "auth-like");
    assert.ok(tool);
    assert.ok(auth);
    assert.equal(tool.path, "tool-output/ok.txt");
    assert.equal(auth.path, "[REDACTED]");
    assert.equal(typeof tool.bytes, "number");
    assert.equal(tool.sha256.length, 64);
    assert.equal(JSON.stringify(rows).includes("HELLO_SHOULD_NOT_APPEAR"), false);
    assert.equal(JSON.stringify(rows).includes("FAKE_TOKEN_NOT_FOR_OUTPUT"), false);
    assert.equal(JSON.stringify(rows).includes("credentials.json"), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("inventory rejects symlink/reparse traversal that escapes the runtime root", async (t) => {
  const fixture = await mkdtemp(join(tmpdir(), "svx-kilo-inventory-in-"));
  const outside = await mkdtemp(join(tmpdir(), "svx-kilo-inventory-out-"));
  try {
    await writeFile(join(outside, "secret.txt"), "OUTSIDE\n", "utf8");
    try {
      await symlink(outside, join(fixture, "escaped"), "dir");
    } catch (error) {
      t.skip(`symlink unavailable on this workstation: ${error.code || error.message}`);
      return;
    }

    await assert.rejects(
      inventoryRuntimeRoot(fixture),
      /TRAVERSAL/,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
