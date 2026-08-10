# Cline Audit — CURSOR-02 Pack Verifier

**Audited by:** Cline  
**Date:** 2026-08-10  
**Packet:** CURSOR-02 — Build Deterministic Agent Pack Verifier  
**Purpose:** Identify edge cases and security concerns before implementation

## Edge Case Analysis

### 1. JSONC Parsing Edge Cases

**Requirement:** "pack config parses successfully using a robust JSONC-capable approach"

**Edge Cases to Consider:**
- **Trailing commas** — JSONC allows them, JSON doesn't. Parser must handle both.
- **Comments** — Both `//` and `/* */` styles. Must strip without breaking strings.
- **String escapes** — JSONC strings may contain escaped quotes that look like comments.
- **Unicode** — Non-ASCII characters in comments or strings.
- **Empty files** — Should FAIL, not silently succeed.
- **Malformed JSONC** — Should fail with clear error, not crash.

**Recommendation:** Use a maintained JSONC parser (e.g., `jsonc-parser` npm package) rather than regex stripping. Regex-based comment stripping is fragile and can break string literals.

### 2. Permission Rule Ordering Detection

**Requirement:** "permission rule ordering does not obviously end in a catch-all that weakens those denies"

**Edge Cases:**
- **Multiple catch-alls** — What if there are multiple `*` patterns at different positions?
- **Nested policies** — If Kilo supports nested permission structures, ordering may be complex.
- **Agent-specific vs global policies** — Need to check both agent-level and global rule ordering.
- **Pattern overlap** — Patterns like `src/**` and `src/components/**` — which wins?
- **Case sensitivity** — Pattern matching may be case-sensitive on some platforms.

**Detection Logic:**
```javascript
// For each agent's permission policy:
// 1. Find all rules with pattern "*"
// 2. If any "*" rule exists, verify it's NOT the last rule
// 3. Verify hard-deny rules (migration, deploy, env, secrets) come AFTER any "*"
// 4. Warn if ordering is ambiguous
```

### 3. Safe Default Agent Detection

**Requirement:** "the investigator/read-only agent is the declared safe default"

**Edge Cases:**
- **Missing default_agent** — What if `default_agent` field doesn't exist?
- **Invalid agent name** — Default points to non-existent agent.
- **Subagent vs primary** — Investigator configured as subagent instead of primary.
- **Multiple defaults** — What if config has conflicting default declarations?
- **Case sensitivity** — Agent names may be case-sensitive.

**Detection Logic:**
```javascript
// 1. Check default_agent field exists
// 2. Verify default_agent matches investigator agent name exactly
// 3. Verify investigator agent exists in agents object
// 4. Verify investigator mode is "primary" (not subagent)
// 5. Verify investigator has edit: deny and bash: deny
```

### 4. Hard-Deny Path Verification

**Requirement:** "implementer has named hard-deny edit paths for migration/deploy/env/secrets"

**Edge Cases:**
- **Path variations** — `supabase/migrations/**` vs `supabase/migrations/*` vs `supabase/migrations`
- **Windows paths** — Backslashes vs forward slashes in patterns.
- **Case sensitivity** — `.env` vs `.ENV` vs `.Env` on Windows.
- **Glob patterns** — `**/.env*` vs `*.env` — different scopes.
- **Action types** — Must be `deny`, not `ask` or `allow`.

**Detection Logic:**
```javascript
// Required hard-deny patterns (adapt to actual Kilo syntax):
const requiredDenies = [
  'supabase/migrations/**',
  '.env*',
  '*.env',
  '**/.env*',
  '**/.env.*',
  '**/*.pem',
  '**/*.key',
  'credentials.json',
  '**/credentials.json'
];

// For implementer agent:
// 1. Check each required pattern has an explicit deny rule
// 2. Verify action is "deny", not "ask"
// 3. Verify deny comes AFTER any catch-all allow
```

### 5. Secret Detection in Committed Files

**Requirement:** "no committed file in the pack matches obvious secret-file names or contains obvious secret-key markers"

**Edge Cases:**
- **False positives** — Files named `test.env` or `example.credentials.json` for testing.
- **Binary files** — Can't scan binary files for secret markers.
- **Large files** — Scanning entire repo may be slow.
- **Obfuscated secrets** — Base64-encoded secrets won't match obvious patterns.
- **Documentation** — Docs may contain example secrets for illustration.

**Detection Logic:**
```javascript
// Obvious secret file patterns:
const secretFilePatterns = [
  '.env',
  '.env.local',
  '.env.production',
  'credentials.json',
  'secrets.json',
  'api-keys.json',
  '*.pem',
  '*.key',
  'id_rsa',
  'id_ed25519'
];

// Secret key markers (case-insensitive):
const secretMarkers = [
  'sk-',
  'pk-',
  'api_key',
  'apikey',
  'secret_key',
  'secretkey',
  'service_role',
  'password',
  'token'
];

// 1. Check filenames against secretFilePatterns
// 2. Scan file contents for secretMarkers (skip binary files)
// 3. Allow whitelist for test/example files
```

**Recommendation:** Add a `verifier-whitelist.json` for legitimate test files to avoid false positives.

### 6. Test A False PASS Detection

**Requirement:** "Test A exists and does not mark real Kilo enforcement PASS without a real Kilo receipt"

**Edge Cases:**
- **Missing receipt** — Test A claims PASS but no receipt file exists.
- **Stale receipt** — Receipt exists but predates config changes.
- **Receipt format** — Receipt may be in different formats (JSON, Markdown).
- **Cursor stand-in** — Test A may have been run with Cursor instead of Kilo.
- **Partial PASS** — Some probes passed, others failed — should still be FAIL.

**Detection Logic:**
```javascript
// 1. Check PROOF-TEST-A.md exists
// 2. Parse Test A for PASS/FAIL claims
// 3. Check for receipt file in proof/ directory
// 4. Verify receipt mentions real Kilo runtime (not Cursor)
// 5. Verify receipt date is newer than config file
// 6. If Test A claims PASS but receipt missing or stale → FAIL
```

### 7. Skills Existence Check

**Requirement:** "required skills exist: stallvix-authority, stallvix-receipt, stallvix-safe-change"

**Edge Cases:**
- **Skill path variations** — Skills may be in different directories.
- **Skill file extensions** — `.md`, `.js`, `.json` — need flexible matching.
- **Case sensitivity** — Skill names may be case-sensitive.
- **Empty skills** — Skill file exists but is empty or malformed.

**Detection Logic:**
```javascript
const requiredSkills = [
  'stallvix-authority',
  'stallvix-receipt',
  'stallvix-safe-change'
];

// 1. Check skills/ directory exists
// 2. For each required skill, check for matching file/directory
// 3. Verify skill file is not empty
// 4. Optional: Parse skill.md for basic structure
```

### 8. Pack Metadata Reportability

**Requirement:** "pack version/name metadata is reportable so future Agent Pack #002 can use the same verifier contract"

**Edge Cases:**
- **Missing metadata** — No version or name fields in config.
- **Non-standard format** — Version may be semver, date, or custom.
- **Multiple metadata sources** — Version in config vs README vs package.json.
- **Validation** — Should we validate version format?

**Detection Logic:**
```javascript
// 1. Check for version/name fields in kilo.jsonc
// 2. If missing, check README.md for version info
// 3. Report whatever metadata is found (don't fail if missing)
// 4. For Agent Pack #002, standardize on semver in config
```

## Security Concerns

### 1. Secret Leakage in Output

**Requirement:** "no secret values are printed"

**Concerns:**
- Verifier may print file contents during secret detection.
- Error messages may include file paths with secrets.
- Debug output may expose sensitive config details.

**Mitigation:**
- Never print full file contents in verifier output.
- Redact secret values from error messages.
- Use `--verbose` flag for detailed output (disabled by default).
- Sanitize paths before printing (remove user home directory).

### 2. Dependency Security

**Concerns:**
- Adding JSONC parser dependency introduces supply chain risk.
- Verifier script may be executed with elevated permissions.

**Mitigation:**
- Use well-maintained, popular packages (check npm audit).
- Pin dependency versions exactly.
- Consider using Node.js built-in JSON parsing with comment stripping if feasible.
- Run verifier with minimal permissions.

### 3. Path Traversal

**Concerns:**
- Malicious pack may use `../` to escape pack directory.
- Verifier may be tricked into scanning outside intended paths.

**Mitigation:**
- Resolve all paths to absolute before processing.
- Verify resolved paths are within pack directory.
- Reject paths containing `..` segments.

### 4. Code Execution

**Concerns:**
- If verifier supports custom validation scripts, could execute arbitrary code.

**Mitigation:**
- No custom validation scripts in v0.
- If added later, require explicit opt-in flag.
- Run in sandboxed environment if possible.

## Recommendations for Implementation

### High Priority
1. **Use maintained JSONC parser** — Don't regex-strip comments.
2. **Implement secret detection whitelist** — Avoid false positives on test files.
3. **Add path traversal protection** — Resolve and validate all paths.
4. **Sanitize all output** — Never print secret values or full file contents.

### Medium Priority
1. **Add `--verbose` flag** — Separate debug output from normal output.
2. **Support JSON output mode** — Easier for CI integration.
3. **Add config schema validation** — Catch structural issues early.
4. **Implement caching** — Speed up repeated verifications.

### Low Priority
1. **Add custom validation hooks** — For future extensibility.
2. **Support multiple pack formats** — If Granaide supports other runtimes.
3. **Generate coverage report** — Show which checks passed/failed.

## Test Cases for Verifier

### Valid Pack Should Pass
- Hardened Agent 001 pack with CURSOR-01D fixes.
- All required files present.
- Safe default agent configured correctly.
- Hard-deny rules in correct order.

### Invalid Packs Should Fail
1. **Missing default_agent** — No default specified.
2. **Wrong default** — Implementer set as default instead of investigator.
3. **Catch-all last** — `*` pattern at end weakens hard denies.
4. **Missing hard-deny** — No deny rule for `.env*`.
5. **Secret file present** — `.env` file in committed pack.
6. **Missing skills** — `stallvix-receipt` skill missing.
7. **False Test A PASS** — Test A claims PASS but no receipt.
8. **Malformed JSONC** — Syntax error in config.

### Edge Cases to Test
1. **Empty config file** — Should FAIL.
2. **Comments in strings** — Should parse correctly.
3. **Windows paths** — Should handle backslashes.
4. **Case variations** — `.ENV` vs `.env`.
5. **Nested permissions** — Should check all levels.
6. **Large pack** — Should complete in reasonable time.

## Conclusion

CURSOR-02 verifier requirements are well-specified, but implementation needs careful attention to:
- JSONC parsing robustness
- Permission rule ordering detection
- Secret detection with whitelist support
- Output sanitization
- Path traversal protection

The verifier should be implemented as a focused script with comprehensive test coverage, not a full framework. Start with the 11 required checks, add edge case handling, then extend based on Agent Pack #002 needs.
