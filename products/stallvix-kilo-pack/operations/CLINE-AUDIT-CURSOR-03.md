# Cline Security Review — CURSOR-03 Headless Proof Harness

**Reviewed by:** Cline  
**Date:** 2026-08-10  
**Packet:** CURSOR-03 — Build Headless Proof Harness  
**Purpose:** Identify security concerns and implementation risks

## Security Concerns

### 1. Credential Exposure in Captured Output

**Requirement:** "Redact obvious secret-like values from captured environment/output where feasible; do not dump full environment variables"

**Concerns:**
- **Environment variable leakage** — Harness may capture `process.env` which contains secrets.
- **Command-line arguments** — Kilo invocation may include API keys or tokens.
- **Stdout/stderr contamination** — Agent output may accidentally log secrets.
- **Session tokens** — Kilo session IDs or auth tokens in output.
- **File paths** — Paths may contain usernames or sensitive directory names.

**Mitigation Strategies:**
```javascript
// Redaction patterns (case-insensitive):
const secretPatterns = [
  /sk-[a-zA-Z0-9]{32,}/g,           // OpenAI-style keys
  /pk-[a-zA-Z0-9]{32,}/g,           // Public keys
  /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g, // Bearer tokens
  /password["\s:=]+[^\s"']+/gi,       // Password fields
  /api[_-]?key["\s:=]+[^\s"']+/gi,   // API keys
  /secret["\s:=]+[^\s"']+/gi,         // Secret fields
  /token["\s:=]+[^\s"']+/gi,         // Token fields
  /service[_-]?role["\s:=]+[^\s"']+/gi // Service role keys
];

// Path redaction:
- Replace user home directory with `~`
- Replace machine-specific paths with generic placeholders
- Remove username from Windows paths: `C:\Users\user\` → `C:\Users\~\`

// Environment variable filtering:
const safeEnvVars = [
  'PATH', 'NODE_ENV', 'CI', 'GITHUB_ACTIONS'
];
// Only capture safeEnvVars, never dump full process.env
```

**Implementation Requirements:**
- Apply redaction before writing to evidence bundle
- Log redaction count (e.g., "Redacted 3 secret patterns")
- Provide `--no-redact` flag for debugging (never use in production)
- Store raw output only in encrypted form if needed for audit

### 2. Command Injection via Workspace Path

**Requirement:** "Capture before/after workspace facts outside the agent"

**Concerns:**
- **Path traversal** — Malicious workspace path like `../../../etc/passwd`
- **Command injection** — Workspace path with shell metacharacters
- **Symbolic link attacks** — Workspace symlink to sensitive directories
- **UNC paths** — Windows network paths may access unauthorized shares

**Mitigation:**
```javascript
// Path validation:
function validateWorkspacePath(path) {
  // Resolve to absolute path
  const absolute = path.resolve(path);
  
  // Check for path traversal
  if (path.includes('..')) {
    throw new Error('Path traversal not allowed');
  }
  
  // Verify path exists and is directory
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) {
    throw new Error('Invalid workspace path');
  }
  
  // Check for symlinks (optional, may break legitimate use)
  // const stats = fs.lstatSync(absolute);
  // if (stats.isSymbolicLink()) {
  //   throw new Error('Symlink workspaces not allowed');
  // }
  
  return absolute;
}

// Git command execution (use child_process.execFile, not exec):
const { execFile } = require('child_process');
execFile('git', ['status', '--short'], { cwd: workspace }, (error, stdout) => {
  // execFile prevents shell injection
});
```

### 3. Kilo Installation/Authentication Risks

**Requirement:** "The harness may require Kilo to already be installed/authenticated. If absent, fail clearly with KILO_NOT_AVAILABLE; do not install it silently."

**Concerns:**
- **Silent installation** — Harness might be tricked into installing malicious Kilo
- **Credential theft** — Harness could extract Kilo auth tokens
- **Version confusion** — Wrong Kilo version installed
- **Path hijacking** — Malicious `kilo` binary in PATH

**Mitigation:**
```javascript
// Check for Kilo without installing:
function checkKiloAvailable() {
  try {
    const result = execSync('kilo --version', { encoding: 'utf-8' });
    return { available: true, version: result.trim() };
  } catch (error) {
    return { available: false, error: 'KILO_NOT_AVAILABLE' };
  }
}

// Never attempt installation
// Fail with clear error if Kilo not found
```

**Additional Safeguards:**
- Document required Kilo version in harness config
- Verify Kilo binary signature if possible (future enhancement)
- Allow user to specify Kilo binary path explicitly
- Log which Kilo binary is being used (full path)

### 4. Evidence Bundle Tampering

**Requirement:** "Generate an evidence bundle under the product proof area"

**Concerns:**
- **Bundle injection** — Attacker could modify evidence bundle after generation
- **Missing evidence** — Critical facts omitted from bundle
- **False evidence** — Harness could be tricked into generating fake receipts
- **Bundle size** — Large bundles may be impractical to review

**Mitigation:**
```javascript
// Evidence bundle structure:
{
  "bundle_id": "uuid",
  "timestamp": "ISO-8601",
  "harness_version": "semver",
  "kilo_version": "from runtime",
  "workspace": {
    "path": "sanitized",
    "branch": "from git",
    "baseline_head": "SHA",
    "final_head": "SHA",
    "dirty_paths": ["list"]
  },
  "runtime": {
    "agent": "stallvix-investigator",
    "session_id": "if available",
    "exit_code": "number",
    "duration_ms": "number"
  },
  "output": {
    "stdout": "redacted",
    "stderr": "redacted",
    "events": "if available"
  },
  "redaction_log": {
    "patterns_applied": 3,
    "redacted_count": 150
  }
}

// Bundle integrity (optional):
- Generate SHA-256 hash of bundle
- Sign bundle if private key available (future)
- Store bundle in read-only location after generation
```

### 5. Timeout and Resource Exhaustion

**Requirement:** "Timeout/failure must produce a non-zero harness result with a useful error"

**Concerns:**
- **Infinite loops** — Agent could hang indefinitely
- **Memory exhaustion** — Large output could exhaust memory
- **Disk exhaustion** — Evidence bundle could fill disk
- **CPU exhaustion** — Intensive computation could hang system

**Mitigation:**
```javascript
// Timeout configuration:
const HARNESS_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const OUTPUT_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
const BUNDLE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB

// Timeout implementation:
const { spawn } = require('child_process');
const kiloProcess = spawn('kilo', args);

const timeout = setTimeout(() => {
  kiloProcess.kill('SIGTERM');
  throw new Error('Harness timeout: Kilo did not complete within 5 minutes');
}, HARNESS_TIMEOUT);

kiloProcess.on('exit', () => clearTimeout(timeout));

// Output size limiting:
let totalOutput = 0;
kiloProcess.stdout.on('data', (chunk) => {
  totalOutput += chunk.length;
  if (totalOutput > OUTPUT_SIZE_LIMIT) {
    kiloProcess.kill('SIGTERM');
    throw new Error('Output size limit exceeded');
  }
});
```

### 6. Concurrent Execution Risks

**Concerns:**
- **Race conditions** — Multiple harness runs could interfere
- **Workspace mutation** — Concurrent runs could modify same workspace
- **Evidence collision** — Multiple bundles could overwrite each other
- **Session confusion** — Kilo sessions could mix between runs

**Mitigation:**
```javascript
// Use unique bundle IDs:
const bundleId = crypto.randomUUID();
const bundlePath = path.join(proofDir, `proof-${bundleId}.json`);

// Workspace locking (optional):
- Create .lock file in workspace before run
- Fail if lock exists (or wait with timeout)
- Remove lock after completion (even on error)

// Session isolation:
- Generate unique session ID for each run
- Pass session ID to Kilo if supported
- Never reuse sessions between harness runs
```

### 7. Network Exposure

**Concerns:**
- **Kilo network calls** — Agent might make unauthorized network requests
- **Data exfiltration** — Harness could be tricked into sending data externally
- **Dependency updates** — Harness dependencies might call home
- **Telemetry** — Kilo or harness might send telemetry

**Mitigation:**
```javascript
// Network monitoring (if feasible):
- Use network namespace or container to isolate network
- Log all network connections made during run
- Provide `--offline` flag to block network access
- Document expected network behavior (if any)

// Dependency security:
- Pin all dependency versions exactly
- Run `npm audit` before deployment
- Use `--offline` npm install if possible
- Consider vendoring critical dependencies
```

### 8. Privilege Escalation

**Concerns:**
- **Git operations** — Harness might execute git with elevated privileges
- **File system writes** — Evidence bundle writes could be abused
- **Process execution** — Harness could be tricked into running arbitrary commands
- **Workspace access** — Harness might access files outside workspace

**Mitigation:**
```javascript
// Principle of least privilege:
- Run harness with normal user permissions only
- Never require sudo/administrator privileges
- Explicitly allowlist file system write locations
- Validate all file paths before writing

// Git command restrictions:
const allowedGitCommands = [
  ['status', '--short'],
  ['rev-parse', 'HEAD'],
  ['branch', '--show-current'],
  ['diff', '--name-only']
];
// Reject any git command not in allowlist
```

## Implementation Security Checklist

### Before Implementation
- [ ] Document all external commands harness will execute
- [ ] Define allowlist of safe environment variables
- [ ] Specify timeout and resource limits
- [ ] Design evidence bundle structure with integrity checks
- [ ] Plan redaction strategy for all output types

### During Implementation
- [ ] Use `execFile` instead of `exec` for all subprocess calls
- [ ] Validate and sanitize all user inputs (workspace path, agent name)
- [ ] Apply redaction before any data persistence
- [ ] Implement timeout for all external processes
- [ ] Add size limits for all captured data
- [ ] Never silently install dependencies or tools
- [ ] Log all security-relevant events (redactions, timeouts, failures)

### After Implementation
- [ ] Test with malicious workspace paths (traversal, symlinks)
- [ ] Test with secrets in output (verify redaction)
- [ ] Test with hanging processes (verify timeout)
- [ ] Test with oversized output (verify size limits)
- [ ] Run security audit on dependencies (`npm audit`)
- [ ] Review code for injection vulnerabilities
- [ ] Document security assumptions and limitations

## Recommended Security Architecture

```
User Input (workspace, agent, prompt)
    ↓
Input Validation (path traversal, injection checks)
    ↓
Pre-Run Checks (Kilo available, workspace valid)
    ↓
Git Facts Capture (before: branch, HEAD, dirty)
    ↓
Kilo Execution (timeout, size limits, monitoring)
    ↓
Output Capture (stdout, stderr, events)
    ↓
Redaction (secret patterns, paths, env vars)
    ↓
Git Facts Capture (after: HEAD, changed paths)
    ↓
Bundle Assembly (structure, integrity check)
    ↓
Bundle Write (allowlisted location, unique ID)
    ↓
Cleanup (temp files, locks, processes)
```

## Failure Mode Handling

### Expected Failures (Non-Zero Exit)
- Kilo not installed → Exit code 1, message: "KILO_NOT_AVAILABLE"
- Invalid workspace → Exit code 2, message: "INVALID_WORKSPACE"
- Timeout → Exit code 3, message: "HARNESS_TIMEOUT"
- Size limit → Exit code 4, message: "OUTPUT_SIZE_LIMIT"
- Redaction failure → Exit code 5, message: "REDACTION_ERROR"

### Unexpected Failures
- Uncaught exception → Exit code 99, stack trace logged
- Signal termination → Exit code 98, cleanup attempted
- Unknown error → Exit code 97, error details logged

### Security Failures
- Path traversal detected → Exit code 10, immediate halt
- Command injection detected → Exit code 11, immediate halt
- Secret leakage detected → Exit code 12, bundle deleted
- Privilege escalation detected → Exit code 13, immediate halt

## Testing Strategy

### Security Tests
1. **Path traversal test** — Try workspace with `../../../etc`
2. **Secret redaction test** — Inject fake secrets in output
3. **Timeout test** — Simulate hanging Kilo process
4. **Size limit test** — Generate oversized output
5. **Injection test** — Try shell metacharacters in inputs
6. **Concurrent test** — Run multiple harness instances
7. **Network test** — Verify no unexpected network calls

### Integration Tests
1. **Valid run** — Normal KILO-01 test with real Kilo
2. **Missing Kilo** — Run without Kilo installed
3. **Invalid workspace** — Use non-existent directory
4. **Git failure** — Run in non-git directory
5. **Permission error** — Try writing to read-only location

## Conclusion

CURSOR-03 harness has significant security considerations due to:
- External process execution (Kilo, Git)
- User input handling (workspace paths, prompts)
- Output capture and persistence (evidence bundles)
- Potential for credential exposure

**Critical security requirements:**
1. Never silently install Kilo or dependencies
2. Validate all user inputs before use
3. Apply comprehensive redaction to all output
4. Implement strict timeout and resource limits
5. Use `execFile` instead of `exec` for subprocess calls
6. Generate unique, tamper-evident evidence bundles
7. Fail clearly and loudly on any security violation

**Recommended implementation order:**
1. Input validation and path sanitization
2. Safe subprocess execution with timeouts
3. Output capture with size limits
4. Redaction system
5. Evidence bundle generation
6. Security testing and audit

The harness should be treated as a security-sensitive component and undergo thorough review before deployment.
