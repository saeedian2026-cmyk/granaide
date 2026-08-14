$ErrorActionPreference = "Stop"

$repoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
  throw "Run this launcher from inside the installed StallVix Git worktree."
}

$env:XDG_DATA_HOME = Join-Path $repoRoot ".kilo-runtime-data"
& kilo @args
exit $LASTEXITCODE
