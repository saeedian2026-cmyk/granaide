#!/usr/bin/env node
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { arenaRoot, posixRel, sha256File } from "./lib.mjs";

export function mutationRepoRoot() {
  return path.join(arenaRoot(), "fixtures", "mutation-repo");
}

export function sealedPath() {
  return path.join(arenaRoot(), "evaluator", "private", "t6-sealed.json");
}

export function walkMutationEntries(root) {
  const out = [];
  function rec(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = lstatSync(full);
      const rel = posixRel(root, full);
      out.push({ full, rel, st, name });
      if (st.isDirectory() && !st.isSymbolicLink()) rec(full);
    }
  }
  rec(root);
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

export function snapshotMutationRepo(root = mutationRepoRoot()) {
  const files = {};
  const symlinks = [];
  const hidden = [];
  const directories = [];
  for (const entry of walkMutationEntries(root)) {
    if (entry.name.startsWith(".") && entry.name !== ".") hidden.push(entry.rel);
    if (entry.st.isSymbolicLink()) {
      symlinks.push(entry.rel);
      continue;
    }
    if (entry.st.isDirectory()) {
      directories.push(entry.rel);
      continue;
    }
    files[entry.rel] = {
      sha256: sha256File(entry.full),
      bytes: entry.st.size,
    };
  }
  return { files, symlinks, hidden, directories };
}

export function observeDelta(baseline, observed, root = mutationRepoRoot()) {
  const modified = [];
  const created = [];
  const deleted = [];
  const renamed = [];
  const unexpected = [];
  const baselineFiles = baseline.files || {};
  const observedFiles = observed.files || {};
  const baseHashes = new Map();
  for (const [rel, meta] of Object.entries(baselineFiles)) {
    if (!baseHashes.has(meta.sha256)) baseHashes.set(meta.sha256, []);
    baseHashes.get(meta.sha256).push(rel);
  }
  for (const rel of Object.keys(baselineFiles)) {
    if (!observedFiles[rel]) deleted.push(rel);
    else if (observedFiles[rel].sha256 !== baselineFiles[rel].sha256) modified.push(rel);
  }
  for (const rel of Object.keys(observedFiles)) {
    if (!baselineFiles[rel]) {
      created.push(rel);
      const match = baseHashes.get(observedFiles[rel].sha256);
      if (match && match.some((p) => deleted.includes(p))) renamed.push(rel);
    }
  }
  const traversal = [];
  for (const rel of [...Object.keys(observedFiles), ...(observed.symlinks || [])]) {
    const resolved = path.resolve(root, rel);
    const relToRoot = path.relative(path.resolve(root), resolved);
    if (relToRoot.startsWith("..") || path.isAbsolute(relToRoot) || rel.split("/").includes("..")) {
      traversal.push(rel);
    }
  }
  if ((observed.hidden || []).length) unexpected.push(...observed.hidden.map((p) => `hidden:${p}`));
  if ((observed.symlinks || []).length) unexpected.push(...observed.symlinks.map((p) => `symlink:${p}`));
  return {
    modified,
    created,
    deleted,
    renamed,
    symlinks: observed.symlinks || [],
    hidden: observed.hidden || [],
    traversal,
    unexpected,
  };
}

export function writeSealedFromDisk() {
  const root = mutationRepoRoot();
  const files = {};
  for (const entry of walkMutationEntries(root)) {
    if (entry.st.isSymbolicLink() || entry.st.isDirectory()) continue;
    const normalized = Buffer.from(readFileSync(entry.full, "utf8").replace(/\r\n/g, "\n"), "utf8");
    writeFileSync(entry.full, normalized);
    files[entry.rel] = normalized.toString("base64");
  }
  const sealed = { version: 1, encoding: "base64", files };
  mkdirSync(path.dirname(sealedPath()), { recursive: true });
  writeFileSync(sealedPath(), `${JSON.stringify(sealed, null, 2)}\n`, "utf8");
  return sealed;
}

export function readSealedFiles() {
  const sealed = JSON.parse(readFileSync(sealedPath(), "utf8"));
  if (sealed && sealed.files && sealed.encoding === "base64") {
    const out = {};
    for (const [rel, b64] of Object.entries(sealed.files)) {
      out[rel] = Buffer.from(b64, "base64");
    }
    return out;
  }
  const out = {};
  for (const [rel, contents] of Object.entries(sealed)) {
    if (rel === "version" || rel === "encoding" || rel === "files") continue;
    out[rel] = Buffer.from(String(contents).replace(/\r\n/g, "\n"), "utf8");
  }
  return out;
}

export function resetMutationRepo() {
  const root = mutationRepoRoot();
  const files = readSealedFiles();
  for (const entry of walkMutationEntries(root)) {
    if (entry.st.isSymbolicLink()) rmSync(entry.full, { force: true });
  }
  for (const entry of walkMutationEntries(root).reverse()) {
    const expected = Object.prototype.hasOwnProperty.call(files, entry.rel);
    if (!expected && !entry.st.isDirectory()) rmSync(entry.full, { force: true });
    if (!expected && entry.st.isDirectory()) {
      const still = walkMutationEntries(entry.full);
      if (still.length === 0) rmSync(entry.full, { recursive: true, force: true });
    }
  }
  for (const [rel, buf] of Object.entries(files)) {
    const full = path.join(root, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, buf);
  }
}

export function createForbiddenSymlink(rel, target) {
  const full = path.join(mutationRepoRoot(), rel);
  symlinkSync(target, full);
}
