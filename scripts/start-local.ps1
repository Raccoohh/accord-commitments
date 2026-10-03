$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $taskRoot
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
catch { Start-Process -FilePath (Get-Command node).Source -ArgumentList '--env-file-if-exists=.env.local','src/server.mjs' -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput '.runtime/logs/app.out.log' -RedirectStandardError '.runtime/logs/app.err.log' | Out-Null }
Write-Output 'Local workspace: http://127.0.0.1:3000'
