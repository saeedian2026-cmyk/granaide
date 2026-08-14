$ErrorActionPreference = "Stop"

$launcherRoot = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$repoRootOutput = & git -C $launcherRoot rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repoRootOutput)) {
  throw "Install this launcher at the StallVix Git worktree root."
}

$repoRoot = (Resolve-Path -LiteralPath $repoRootOutput.Trim()).Path
if (-not [string]::Equals($repoRoot, $launcherRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Install this launcher at the StallVix Git worktree root."
}

$callerRoot = (Resolve-Path -LiteralPath (Get-Location).Path).Path
if (-not [string]::Equals($callerRoot, $repoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Run this launcher from the installed StallVix Git worktree root."
}

$env:XDG_DATA_HOME = Join-Path $repoRoot ".kilo-runtime-data"
& kilo @args
exit $LASTEXITCODE
