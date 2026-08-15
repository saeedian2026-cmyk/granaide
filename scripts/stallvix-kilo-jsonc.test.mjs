import assert from "node:assert/strict";
import test from "node:test";
import {
  JsoncParseError,
  assertNoMutableRuntimeExecutables,
  parseJsonc,
} from "./stallvix-kilo-jsonc.mjs";

test("JSONC parser keeps string contents that the old regex stripper would corrupt", () => {
  const source = `{ "x": ",}", "y": ",]" }`;
  const parsed = parseJsonc(source, { path: "hostile-string.jsonc" });
  assert.equal(parsed.x, ",}");
  assert.equal(parsed.y, ",]");

  const regexMangled = JSON.parse(
    source.replace(/^\s*\/\/.*$/gm, "").replace(/,\s*([}\]])/g, "$1"),
  );
  assert.notEqual(regexMangled.x, ",}");
  assert.notEqual(regexMangled.y, ",]");
});

test("JSONC parser accepts comments, trailing commas, BOM, and CRLF", () => {
  const source = `\uFEFF{\r\n  // full-line comment\r\n  "a": 1, // inline comment\r\n  "quoted": "foo\\" // not a comment",\r\n  "list": [\r\n    true,\r\n  ],\r\n}\r\n`;
  const parsed = parseJsonc(source, { path: "hostile-legal.jsonc" });
  assert.deepEqual(parsed, {
    a: 1,
    quoted: 'foo" // not a comment',
    list: [true],
  });
});

test("invalid JSONC fails closed with path and parse location, without dumping source", () => {
  const secret = "SUPER_SECRET_VALUE_SHOULD_NOT_LEAK";
  const source = `{ "token": "${secret}" invalid }`;
  try {
    parseJsonc(source, { path: "products/stallvix-kilo-pack/kilo.jsonc" });
    assert.fail("expected parse failure");
  } catch (error) {
    assert.equal(error instanceof JsoncParseError, true);
    assert.equal(error.path, "products/stallvix-kilo-pack/kilo.jsonc");
    assert.equal(typeof error.line, "number");
    assert.equal(typeof error.column, "number");
    assert.match(error.message, /kilo\.jsonc:\d+:\d+: JSONC parse error /);
    assert.equal(error.message.includes(secret), false);
    assert.equal(JSON.stringify(error).includes(secret), false);
  }
});

test("a fixture with unpinned npx MCP fails closed", () => {
  const fixture = parseJsonc(`{
    "mcp": {
      "context7": {
        "type": "local",
        "command": ["npx", "-y", "@upstash/context7-mcp"]
      }
    }
  }`);
  assert.throws(
    () => assertNoMutableRuntimeExecutables(fixture, { path: "fixture-unpinned.jsonc" }),
    /mutable runtime-executable/,
  );
});
