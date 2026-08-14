import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createManifest,
  hashNormalizedText,
} from "./stallvix-kilo-pack-manifest.mjs";

const configUrl = new URL(
  "../products/stallvix-kilo-pack/kilo.jsonc",
  import.meta.url,
);
const packUrl = new URL(
  "../products/stallvix-kilo-pack/pack.json",
  import.meta.url,
);

async function readPackConfig() {
  const source = await readFile(configUrl, "utf8");
  const withoutCommentLines = source.replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(withoutCommentLines.replace(/,\s*([}\]])/g, "$1"));
}

async function readProductDescriptor() {
  return JSON.parse(await readFile(packUrl, "utf8"));
}

function matchesKiloPattern(pattern, value) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replaceAll("*", ".*")}$`).test(value);
}

function resolvePermission(rules, value) {
  if (typeof rules === "string") return rules;

  let decision;
  for (const [pattern, permission] of Object.entries(rules)) {
    if (matchesKiloPattern(pattern, value)) decision = permission;
  }
  return decision;
}

test("the default StallVix agent is a primary read-only investigator", async () => {
  const config = await readPackConfig();
  const investigator = config.agent["stallvix-investigator"];

  assert.equal(config.default_agent, "stallvix-investigator");
  assert.equal(investigator.mode, "primary");
  assert.equal(investigator.permission.edit, "deny");
  assert.equal(investigator.permission.bash, "deny");
  assert.equal(investigator.permission.grep, "deny");
  assert.equal(investigator.permission.external_directory, "deny");
  assert.equal(investigator.permission.task, "deny");
});

test("the investigator cannot read common secret-bearing files", async () => {
  const config = await readPackConfig();
  const read = config.agent["stallvix-investigator"].permission.read;

  assert.equal(read["*"], "allow");
  for (const path of [
    ".env",
    ".env.local",
    "config/.env",
    "credentials.json",
    "config/credentials.json",
    "server.pem",
    "certs/server.pem",
    "private.key",
    "certs/private.key",
  ]) {
    assert.equal(resolvePermission(read, path), "deny", path);
  }

  for (const path of [".env.example", "config/.env.example"]) {
    assert.equal(resolvePermission(read, path), "allow", path);
  }
});

test("the opt-in implementer cannot search across denied descendants", async () => {
  const config = await readPackConfig();
  const implementer = config.agent["stallvix-implementer"];

  assert.equal(implementer.permission.grep, "deny");
  assert.equal(implementer.permission.external_directory, "deny");
  assert.equal(implementer.permission.task, "deny");
});

test("the implementer shell is default-deny with a narrow verification allowlist", async () => {
  const config = await readPackConfig();
  const bash = config.agent["stallvix-implementer"].permission.bash;

  for (const command of [
    "npm run typecheck",
    "npm run lint",
    "npm test",
    "git status --short",
    "git diff --check",
  ]) {
    assert.equal(resolvePermission(bash, command), "ask", command);
  }

  for (const command of [
    "git push origin main",
    "git -C . push origin main",
    "cmd /c git push origin main",
    'powershell -Command "git push origin main"',
    "npx --yes wrangler deploy",
    "supabase functions deploy api",
    "npm run deploy",
    "Get-Content .env",
  ]) {
    assert.equal(resolvePermission(bash, command), "deny", command);
  }
});

test("the implementer cannot edit root or nested sensitive files", async () => {
  const config = await readPackConfig();
  const edit = config.agent["stallvix-implementer"].permission.edit;

  for (const path of [
    ".env",
    "src/.env.local",
    "credentials.json",
    "docs/credentials.json",
    "server.pem",
    "src/server.pem",
    "private.key",
    "docs/private.key",
    "supabase/migrations/001.sql",
    "wrangler.toml",
  ]) {
    assert.equal(resolvePermission(edit, path), "deny", path);
  }
});

test("the committed source manifest matches normalized payload bytes", async () => {
  const manifestUrl = new URL(
    "../products/stallvix-kilo-pack/PAYLOAD-MANIFEST.json",
    import.meta.url,
  );
  const committed = JSON.parse(await readFile(manifestUrl, "utf8"));

  assert.deepEqual(committed, await createManifest());
  assert.equal(
    hashNormalizedText("line one\r\nline two\r\n"),
    hashNormalizedText("line one\nline two\n"),
  );
});

test("the product descriptor maps every locked payload file to its consumer path", async () => {
  const descriptor = await readProductDescriptor();
  const manifestUrl = new URL(
    "../products/stallvix-kilo-pack/PAYLOAD-MANIFEST.json",
    import.meta.url,
  );
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));

  assert.equal(descriptor.schema_version, 1);
  assert.equal(descriptor.product_id, manifest.product);
  assert.equal(descriptor.version, manifest.product_version);
  assert.equal(descriptor.status, "candidate");
  assert.equal(descriptor.default_agent, "stallvix-investigator");
  assert.equal(descriptor.tested_kilo_version, "7.4.20");
  assert.equal(descriptor.payload_manifest, "PAYLOAD-MANIFEST.json");
  assert.equal(descriptor.license, "UNSPECIFIED");

  const mappedSources = Object.keys(descriptor.install_map).sort();
  assert.deepEqual(mappedSources, Object.keys(manifest.files).sort());
  assert.equal(descriptor.install_map["kilo.jsonc"], ".kilo/kilo.jsonc");
  assert.equal(
    descriptor.install_map["run-stallvix-kilo.ps1"],
    "run-stallvix-kilo.ps1",
  );
});
