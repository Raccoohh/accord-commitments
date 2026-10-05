param([string]$NodePath = '', [switch]$SetupMode)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $taskRoot
# Desktop terminals do not inherit Codex's bundled Node entry in PATH.
$taskNodeCandidates = @()
if ($NodePath) {
  $taskNodeCandidates += $NodePath
} else {
  $taskNodeCommand = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue
  if ($taskNodeCommand) { $taskNodeCandidates += $taskNodeCommand.Source }
  $taskNodeCandidates += Join-Path $taskRoot '.runtime/node/node.exe'
  if ($env:ProgramFiles) { $taskNodeCandidates += Join-Path $env:ProgramFiles 'nodejs/node.exe' }
  if ($env:USERPROFILE) { $taskNodeCandidates += Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' }
}
$taskNode = $null
foreach ($taskCandidate in $taskNodeCandidates) {
  if (-not (Test-Path -LiteralPath $taskCandidate -PathType Leaf)) { continue }
  try {
    $taskVersion = & $taskCandidate --version 2>$null
    if ($LASTEXITCODE -eq 0 -and $taskVersion -match '^v24\.') {
      $taskNode = (Resolve-Path -LiteralPath $taskCandidate).Path
      break
    }
  } catch { continue }
}
if (-not $taskNode) { throw 'Node.js 24 was not found. Install Node 24 or run this script with -NodePath "C:\path\to\node.exe".' }
Write-Output "Using Node.js: $taskNode"
$taskOllama = Join-Path $taskRoot '.runtime/ollama/ollama.exe'
if (-not (Test-Path -LiteralPath $taskOllama)) { throw 'Portable Ollama is missing. Complete local setup first.' }
# Native GPU DLL loading fails with non-ASCII paths on this tested Windows build.
# Use a project-specific junction; model files remain in the workspace.
$taskHasher = [Security.Cryptography.SHA256]::Create()
$taskHash = ([BitConverter]::ToString($taskHasher.ComputeHash([Text.Encoding]::UTF8.GetBytes($taskRoot)))).Replace('-','').Substring(0,12)
$taskHasher.Dispose()
$taskAlias = Join-Path ([IO.Path]::GetTempPath()) "accord-ollama-$taskHash"
$taskOllamaRoot = Join-Path $taskRoot '.runtime/ollama'
if (Test-Path -LiteralPath $taskAlias) {
  $taskExisting = Get-Item -LiteralPath $taskAlias
  if ($taskExisting.LinkType -ne 'Junction' -or $taskExisting.Target -ne $taskOllamaRoot) { throw 'Ollama alias already exists with a different target.' }
} else { New-Item -ItemType Junction -Path $taskAlias -Target $taskOllamaRoot | Out-Null }
$taskOllama = Join-Path $taskAlias 'ollama.exe'
$taskCuda = Join-Path $taskAlias 'lib/ollama/cuda_v12'
if (Test-Path -LiteralPath $taskCuda) { $env:PATH = "$taskCuda;$env:PATH" }
$env:OLLAMA_HOST = '127.0.0.1:11435'
$env:OLLAMA_MODELS = Join-Path $taskRoot '.runtime/ollama-models'
$env:OLLAMA_NO_CLOUD = '1'
$env:OLLAMA_NUM_PARALLEL = '1'
$env:OLLAMA_MAX_LOADED_MODELS = '1'
$env:OLLAMA_KEEP_ALIVE = '5m'
New-Item -ItemType Directory -Path '.runtime/logs' -Force | Out-Null
try { Invoke-RestMethod 'http://127.0.0.1:11435/api/version' -TimeoutSec 2 | Out-Null }
catch { Start-Process -FilePath $taskOllama -ArgumentList 'serve' -WorkingDirectory $taskAlias -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRoot '.runtime/logs/ollama.out.log') -RedirectStandardError (Join-Path $taskRoot '.runtime/logs/ollama.err.log') | Out-Null }
$taskReady = $false
for ($taskAttempt=0; $taskAttempt -lt 30; $taskAttempt++) {
  try { Invoke-RestMethod 'http://127.0.0.1:11435/api/version' -TimeoutSec 1 | Out-Null; $taskReady=$true; break }
  catch { Start-Sleep -Milliseconds 500 }
}
if (-not $taskReady) { throw 'Local Ollama did not start. See .runtime/logs/ollama.err.log.' }
try { Invoke-RestMethod 'http://127.0.0.1:3000/api/health' -TimeoutSec 2 | Out-Null; Write-Output 'An app server is already running on port 3000.' }
catch { Start-Process -FilePath $taskNode -ArgumentList '--env-file-if-exists=.env.local','src/server.mjs' -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput '.runtime/logs/app.out.log' -RedirectStandardError '.runtime/logs/app.err.log' | Out-Null }
$taskAppReady = $false
for ($taskAttempt=0; $taskAttempt -lt 30; $taskAttempt++) {
  try {
    $taskHealth = Invoke-RestMethod 'http://127.0.0.1:3000/api/health' -TimeoutSec 1
    if ($taskHealth.provider -eq 'local' -and ($SetupMode -or $taskHealth.ready)) { $taskAppReady=$true; break }
  } catch { }
  Start-Sleep -Milliseconds 500
}
if (-not $taskAppReady) { throw 'Local app is not ready. See .runtime/logs/app.err.log and check local model setup.' }
if ($SetupMode) { Write-Output 'Local services started. Complete model setup before using the app.' }
else { Write-Output 'Local workspace: http://127.0.0.1:3000' }
