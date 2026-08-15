import { createHash } from "node:crypto";
import { lstat, readdir, realpath } from "node:fs/promises";
import { join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const AUTH_LIKE = /(credential|token|cookie|secret|password|auth|\.pem$|\.key$|(^|\/)\.env(\.|$))/i;
const SESSION = /session/i;
const CACHE = /cache/i;
const TOOL_OUTPUT = /(^|\/)tool-output(\/|$)/i;

function toPosix(relPath) {
  return relPath.split(sep).join("/");
}

function sha256utf8(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function isInsideRoot(rootReal, candidateReal) {
  const norm = (value) => {
    const next = normalize(value);
    return process.platform === "win32" ? next.toLowerCase() : next;
  };
  const root = norm(rootReal);
  const candidate = norm(candidateReal);
  const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`;
  return candidate === root || candidate.startsWith(rootPrefix);
}

export function classifyRuntimePath(relPosix) {
  if (AUTH_LIKE.test(relPosix)) return "auth-like";
  if (TOOL_OUTPUT.test(relPosix)) return "tool-output";
  if (SESSION.test(relPosix)) return "session";
  if (CACHE.test(relPosix)) return "cache";
  return "unknown";
}

export function sanitizeRuntimePath(relPosix) {
  if (AUTH_LIKE.test(relPosix)) {
    return { path: "[REDACTED]", path_sha256: sha256utf8(relPosix) };
  }
  return { path: relPosix };
}

function traversalError(relHint) {
  const err = new Error("TRAVERSAL: path escapes runtime root");
  err.name = "RuntimeInventoryTraversalError";
  err.path = relHint;
  throw err;
}

async function walk(dirReal, rootReal, rows) {
  const entries = await readdir(dirReal, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dirReal, entry.name);
    const lst = await lstat(full);
    let targetReal;
    try {
      targetReal = await realpath(full);
    } catch {
      traversalError(toPosix(relative(rootReal, full)));
    }
    if (!isInsideRoot(rootReal, targetReal)) {
      traversalError(toPosix(relative(rootReal, full)));
    }

    if (lst.isDirectory() || (lst.isSymbolicLink() && (await lstat(targetReal)).isDirectory())) {
      await walk(targetReal, rootReal, rows);
      continue;
    }

    const relPosix = toPosix(relative(rootReal, targetReal));
    const sanitized = sanitizeRuntimePath(relPosix);
    const sizeStat = lst.isSymbolicLink() ? await lstat(targetReal) : lst;
    rows.push({
      ...sanitized,
      bytes: sizeStat.size,
      category: classifyRuntimePath(relPosix),
    });
  }
}

export async function inventoryRuntimeRoot(rootInput) {
  if (!rootInput) {
    throw new Error("runtime inventory requires an explicit --root (synthetic fixture or operator path)");
  }

  const rootReal = await realpath(resolve(rootInput));
  const rootStat = await lstat(rootReal);
  if (!rootStat.isDirectory()) {
    throw new Error("runtime inventory --root must be a directory");
  }

  const rows = [];
  await walk(rootReal, rootReal, rows);
  rows.sort((a, b) => String(a.path_sha256 || a.path).localeCompare(String(b.path_sha256 || b.path)));
  return rows;
}

function parseArgs(argv) {
  const args = { root: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--root") {
      args.root = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { root } = parseArgs(process.argv.slice(2));
  try {
    const rows = await inventoryRuntimeRoot(root);
    process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(error.name === "RuntimeInventoryTraversalError" ? 3 : 1);
  }
}
