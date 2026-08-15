import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import {
  createManifest,
  hashNormalizedText,
} from "./stallvix-kilo-pack-manifest.mjs";
import {
  assertNoMutableRuntimeExecutables,
  parseJsonc,
} from "./stallvix-kilo-jsonc.mjs";

const configUrl = new URL(
  "../products/stallvix-kilo-pack/kilo.jsonc",
  import.meta.url,
);
const packUrl = new URL(
  "../products/stallvix-kilo-pack/pack.json",
  import.meta.url,
);
const execFileAsync = promisify(execFile);

async function readPackConfig() {
  const source = await readFile(configUrl, "utf8");
  const config = parseJsonc(source, {
    path: "products/stallvix-kilo-pack/kilo.jsonc",
  });
  assertNoMutableRuntimeExecutables(config, {
    path: "products/stallvix-kilo-pack/kilo.jsonc",
  });
  return config;
}

async function readProductDescriptor() {
  return JSON.parse(await readFile(packUrl, "utf8"));
}

// STATIC REGRESSION HELPER ONLY — not Kilo 7.4.20 effective-permission proof.
// Kilo Agent Permissions docs: `*` spans nested path text. This helper copies
// that contract for source-lock regression. Gate C must still prove the same
// paths through Kilo-generated/effective policy after consumer re-lock.
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
  assert.equal(investigator.permission.write, "deny");
  assert.equal(investigator.permission.apply_patch, "deny");
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
    // DS-01/F4 regression: Kilo `*` spans path separators, so denied patterns must
    // hold at 2- and 3-level depth too (kept as regression, not a claimed bypass).
    "a/b/credentials.json",
    "a/b/c/credentials.json",
    "a/b/server.pem",
    "a/b/c/server.pem",
    "a/b/private.key",
    "a/b/c/private.key",
    "a/b/.env",
    "a/b/.env.production",
    "config/.env.local",
  ]) {
    assert.equal(resolvePermission(read, path), "deny", path);
  }

  for (const path of [".env.example", "config/.env.example"]) {
    assert.equal(resolvePermission(read, path), "allow", path);
  }
});

test("DS-01/F3: the worktree-local Kilo runtime root is opaque to every agent", async () => {
  const config = await readPackConfig();

  for (const agentName of ["stallvix-investigator", "stallvix-implementer"]) {
    const agent = config.agent[agentName];
    assert.equal(
      resolvePermission(agent.permission.read, ".kilo-runtime-data/anything.json"),
      "deny",
      `${agentName} read runtime root`,
    );
    assert.equal(
      resolvePermission(agent.permission.read, ".kilo-runtime-data/tool-output/x.txt"),
      "deny",
      `${agentName} read nested runtime output`,
    );
    assert.equal(
      resolvePermission(agent.permission.glob, ".kilo-runtime-data/anything.json"),
      "deny",
      `${agentName} glob runtime root`,
    );
  }

  assert.equal(
    resolvePermission(config.permission.read, ".kilo-runtime-data/anything.json"),
    "deny",
    "base read runtime root",
  );

  const implementerEdit = config.agent["stallvix-implementer"].permission;
  for (const tool of ["edit", "write", "apply_patch"]) {
    assert.equal(
      resolvePermission(implementerEdit[tool], ".kilo-runtime-data/tool-output/x.txt"),
      "deny",
      `implementer ${tool} runtime root`,
    );
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
    // DS-01/F7 narrowing: compound/prefixed commands must not inherit an allow/ask
    // decision by prefix accident; the resolver treats them as exact strings.
    "npm run lint && rm -rf .",
    "npm run lint; git status",
    "npm run lint | cat",
    "cmd /c npm run lint",
    'powershell -Command "npm run lint"',
    "cd . && npm run lint",
  ]) {
    assert.equal(resolvePermission(bash, command), "deny", command);
  }
});

test("DS-01/P1: the implementer base policy has no unconditional src/docs edit allow", async () => {
  const config = await readPackConfig();
  const edit = config.agent["stallvix-implementer"].permission.edit;
  const editRules = typeof edit === "string" ? {} : edit;

  assert.equal(editRules["*"], "ask");
  assert.notEqual(editRules["src/**"], "allow");
  assert.notEqual(editRules["docs/**"], "allow");
  assert.equal(resolvePermission(edit, "src/components/App.tsx"), "ask");
  assert.equal(resolvePermission(edit, "docs/README.md"), "ask");
});

test("DS-01/P2: authority/evidence paths are explicit edit hard-denies", async () => {
  const config = await readPackConfig();
  const edit = config.agent["stallvix-implementer"].permission.edit;

  for (const path of [
    "SPEC.md",
    "SCOPE.md",
    "BACKLOG.md",
    "AGENTS.md",
    "CLAUDE.md",
    "AGENTS.granaide-kilo.md",
    "docs/agent-work/packets/SVX-ANY-01.md",
    "docs/agent-work/packets/sub/SVX-ANY-01.md",
    "docs/audit/SVX-AUDIT-01.md",
    ".kilo/kilo.jsonc",
    ".kilo/skills/stallvix-authority/SKILL.md",
    ".kilo-runtime-data/kilo/session.json",
    "supabase/migrations/001.sql",
    "wrangler.toml",
    ".env",
    "src/.env.local",
    "a/b/credentials.json",
    "a/b/c/credentials.json",
    "a/b/server.pem",
    "a/b/c/server.pem",
    "a/b/private.key",
    "a/b/c/private.key",
    "a/b/.env.production",
  ]) {
    assert.equal(resolvePermission(edit, path), "deny", path);
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

test("the launcher is bound to the worktree where it is installed", async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "granaide-kilo-launcher-"));
  const installedRoot = join(fixtureRoot, "installed");
  const otherRoot = join(fixtureRoot, "other");
  const binRoot = join(fixtureRoot, "bin");
  const resultPath = join(fixtureRoot, "result.json");

  try {
    await Promise.all([
      execFileAsync("git", ["init", installedRoot]),
      execFileAsync("git", ["init", otherRoot]),
    ]);
    await mkdir(binRoot, { recursive: true });
    await copyFile(
      new URL(
        "../products/stallvix-kilo-pack/run-stallvix-kilo.ps1",
        import.meta.url,
      ),
      join(installedRoot, "run-stallvix-kilo.ps1"),
    );
    await writeFile(
      join(binRoot, "kilo.ps1"),
      [
        "$payload = [ordered]@{",
        "  cwd = (Get-Location).Path",
        "  xdg = $env:XDG_DATA_HOME",
        "  argv = @($args)",
        "}",
        "$payload | ConvertTo-Json -Compress | Set-Content -LiteralPath $env:GRANAIDE_LAUNCH_RESULT",
      ].join("\n"),
      "utf8",
    );

    const env = {
      ...process.env,
      GRANAIDE_LAUNCH_RESULT: resultPath,
      PATH: `${binRoot};${process.env.PATH}`,
    };
    await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-File", join(installedRoot, "run-stallvix-kilo.ps1"), "agent", "list"],
      { cwd: installedRoot, env },
    );
    const result = JSON.parse(await readFile(resultPath, "utf8"));
    assert.equal(result.cwd.toLowerCase(), installedRoot.toLowerCase());
    assert.equal(
      result.xdg.toLowerCase(),
      join(installedRoot, ".kilo-runtime-data").toLowerCase(),
    );
    assert.deepEqual(result.argv, ["agent", "list"]);

    await assert.rejects(
      execFileAsync(
        "powershell.exe",
        ["-NoProfile", "-File", join(installedRoot, "run-stallvix-kilo.ps1"), "agent", "list"],
        { cwd: otherRoot, env },
      ),
      /worktree root/i,
    );
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

const STALLVIX_CONSUMER_BASH_ASK = [
  "npm run typecheck",
  "npm run lint",
  "npm test",
  "git status --short",
  "git diff --check",
];

const AUTHORITY_WRITE_PROBES = [
  "SPEC.md",
  "docs/agent-work/packets/SVX-ANY-01.md",
  "docs/audit/SVX-AUDIT-01.md",
  ".kilo-runtime-data/kilo/session.json",
];

test("DS-02/S1: candidate payload has no Context7 MCP and no npx runtime-executable", async () => {
  const config = await readPackConfig();
  const serialized = JSON.stringify(config);

  assert.equal(config.mcp, undefined);
  assert.equal(serialized.includes("context7"), false);
  assert.equal(serialized.includes("@upstash/context7-mcp"), false);
  assert.equal(serialized.includes("npx"), false);
  assert.equal(config.agent["stallvix-implementer"].prompt.includes("Context7"), false);
});

test("DS-02/S2A: write and apply_patch fail-closed with the same authority denies as edit", async () => {
  const config = await readPackConfig();
  const implementer = config.agent["stallvix-implementer"].permission;

  assert.deepEqual(implementer.write, implementer.edit);
  assert.deepEqual(implementer.apply_patch, implementer.edit);

  for (const tool of ["edit", "write", "apply_patch"]) {
    for (const path of AUTHORITY_WRITE_PROBES) {
      assert.equal(
        resolvePermission(implementer[tool], path),
        "deny",
        `${tool} ${path}`,
      );
    }
  }
});

test("DS-02: homemade matcher is a static nested-path regression helper, not Kilo runtime proof", () => {
  assert.equal(matchesKiloPattern("*/credentials.json", "a/b/c/credentials.json"), true);
  assert.equal(matchesKiloPattern("*.pem", "a/b/c/server.pem"), true);
  assert.equal(matchesKiloPattern("docs/audit/**", "docs/audit/SVX-AUDIT-01.md"), true);
});

test("DS-02: bash allowlist is the StallVix consumer contract, not invented Granaide scripts", async () => {
  const config = await readPackConfig();
  const bash = config.agent["stallvix-implementer"].permission.bash;
  const sourcePkg = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );

  assert.deepEqual(
    Object.entries(bash)
      .filter(([, action]) => action === "ask")
      .map(([command]) => command)
      .sort(),
    [...STALLVIX_CONSUMER_BASH_ASK].sort(),
  );
  assert.equal(sourcePkg.scripts.typecheck, undefined);
  assert.equal(sourcePkg.scripts.test, undefined);
  assert.equal(typeof sourcePkg.scripts["test:stallvix-kilo-pack"], "string");
});
