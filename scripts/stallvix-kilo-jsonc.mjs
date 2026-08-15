import { parse, printParseErrorCode } from "jsonc-parser";

const BOM = "\uFEFF";

function offsetToLineCol(source, offset) {
  let line = 1;
  let column = 1;
  const end = Math.max(0, Math.min(offset, source.length));
  for (let i = 0; i < end; i += 1) {
    if (source[i] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

export class JsoncParseError extends Error {
  constructor({ path, line, column, code }) {
    super(`${path}:${line}:${column}: JSONC parse error ${code}`);
    this.name = "JsoncParseError";
    this.path = path;
    this.line = line;
    this.column = column;
    this.code = code;
  }
}

/**
 * Deterministic JSONC parse path for the StallVix Kilo pack verifier.
 * BOM is dropped as a Unicode signature only. String contents are not rewritten.
 * Invalid input fails closed with path + location class — never dump source.
 */
export function parseJsonc(text, { path = "<jsonc>" } = {}) {
  if (typeof text !== "string") {
    throw new TypeError(`${path}: JSONC source must be a string`);
  }

  const source = text.startsWith(BOM) ? text.slice(1) : text;
  const errors = [];
  const value = parse(source, errors, {
    allowTrailingComma: true,
    disallowComments: false,
    allowEmptyContent: false,
  });

  if (errors.length > 0) {
    const first = errors[0];
    const loc = offsetToLineCol(source, first.offset);
    throw new JsoncParseError({
      path,
      line: loc.line,
      column: loc.column,
      code: printParseErrorCode(first.error),
    });
  }

  return value;
}

function isNpxBinary(token) {
  return token === "npx" || token === "npx.cmd" || token === "npx.exe";
}

function packageLooksUnpinned(pkg) {
  const body = pkg.startsWith("@") ? pkg.slice(1) : pkg;
  return !body.includes("@");
}

/**
 * Candidate v0.1 rejects registry-resolved executables with no integrity pin.
 * Any `npx` / `npx -y <unpinned>` MCP command is a finding.
 */
export function findMutableRuntimeExecutables(value, acc = []) {
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    if (isNpxBinary(value[0])) {
      const pkg = value.slice(1).find((arg) => typeof arg === "string" && !arg.startsWith("-"));
      acc.push({
        command: value,
        reason: pkg && !packageLooksUnpinned(pkg)
          ? "npx executes a registry package without an integrity-verifiable artifact"
          : "unpinned npx runtime-executable",
      });
    }
  } else if (value && typeof value === "object") {
    for (const nested of Object.values(value)) {
      findMutableRuntimeExecutables(nested, acc);
    }
  }
  return acc;
}

export function assertNoMutableRuntimeExecutables(value, { path = "<jsonc>" } = {}) {
  const findings = findMutableRuntimeExecutables(value);
  if (findings.length > 0) {
    const err = new Error(
      `${path}: mutable runtime-executable MCP/package source is not allowed in candidate v0.1`,
    );
    err.name = "MutableRuntimeExecutableError";
    err.path = path;
    err.findings = findings.map((item) => item.reason);
    throw err;
  }
}
