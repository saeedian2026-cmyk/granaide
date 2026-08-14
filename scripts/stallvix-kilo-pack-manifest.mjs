import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const packUrl = new URL("../products/stallvix-kilo-pack/", import.meta.url);

export const payloadPaths = [
  "kilo.jsonc",
  "AGENTS.md",
  "run-stallvix-kilo.ps1",
  "skills/stallvix-authority/SKILL.md",
  "skills/stallvix-receipt/SKILL.md",
  "skills/stallvix-safe-change/SKILL.md",
];

export function normalizeText(value) {
  return value.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

export function hashNormalizedText(value) {
  return createHash("sha256").update(normalizeText(value), "utf8").digest("hex");
}

export async function createManifest() {
  const files = {};
  for (const path of payloadPaths) {
    files[path] = hashNormalizedText(await readFile(new URL(path, packUrl), "utf8"));
  }

  return {
    schema_version: 1,
    product: "granaide-stallvix-kilo-pack",
    product_version: "0.1.0",
    algorithm: "sha256",
    normalization: "UTF-8; strip BOM; CRLF/CR to LF",
    files,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.stdout.write(`${JSON.stringify(await createManifest(), null, 2)}\n`);
}
