param([string]$Python = 'python', [string]$NodePath = '')
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $taskRoot
$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'
New-Item -ItemType Directory -Path '.runtime/downloads' -Force | Out-Null
if (-not (Test-Path '.runtime/python/Scripts/python.exe')) {
  & $Python -m venv .runtime/python
  if ($LASTEXITCODE -ne 0) { throw 'Create a Python 3.12 virtual environment first.' }
}
& '.runtime/python/Scripts/python.exe' -m pip install --disable-pip-version-check --timeout 120 --retries 5 --progress-bar off torch==2.8.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/cpu
if ($LASTEXITCODE -ne 0) { throw 'PyTorch installation failed.' }
& '.runtime/python/Scripts/python.exe' -m pip install --disable-pip-version-check --timeout 120 --retries 5 --progress-bar off -r local/requirements.lock.txt
if ($LASTEXITCODE -ne 0) { throw 'Speech package installation failed.' }
if (-not (Test-Path '.runtime/ollama/ollama.exe')) {
  curl.exe -L --fail --silent --show-error -o '.runtime/downloads/ollama-windows-amd64.zip' 'https://github.com/ollama/ollama/releases/download/v0.35.0/ollama-windows-amd64.zip'
  if ($LASTEXITCODE -ne 0) { throw 'Ollama download failed.' }
  Expand-Archive -LiteralPath '.runtime/downloads/ollama-windows-amd64.zip' -DestinationPath '.runtime/ollama' -Force
}
. "$PSScriptRoot/start-local.ps1" -NodePath $NodePath -SetupMode
& $taskNode scripts/pull-local-model.mjs
if ($LASTEXITCODE -ne 0) { throw 'Local language model download failed.' }
& $taskNode --env-file=.env.local scripts/local-asr-check.mjs A
if ($LASTEXITCODE -ne 0) { throw 'Speech initialization failed. Check HF_TOKEN and model access.' }
& $taskNode scripts/record-local-models.mjs
if ($LASTEXITCODE -ne 0) { throw 'Model manifest creation failed.' }
Write-Output 'Local models ready. Open http://127.0.0.1:3000.'
