import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const configUrl = new URL(
  "../products/stallvix-kilo-pack/kilo.jsonc",
  import.meta.url,
);

async function readPackConfig() {
  const source = await readFile(configUrl, "utf8");
  const withoutCommentLines = source.replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(withoutCommentLines.replace(/,\s*([}\]])/g, "$1"));
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
  assert.equal(read["*.env"], "deny");
  assert.equal(read["**/.env"], "deny");
  assert.equal(read["**/credentials.json"], "deny");
  assert.equal(read["**/*.pem"], "deny");
  assert.equal(read["**/*.key"], "deny");
  assert.equal(read["*.env.example"], "allow");
  assert.equal(read["**/.env.example"], "allow");
});
