$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskDirectory = Join-Path $taskRoot '.runtime/demo'
$taskExe = Join-Path $taskDirectory 'ngrok.exe'
if (-not (Test-Path -LiteralPath $taskExe)) { throw 'Install the official signed ngrok.exe at .runtime/demo/ngrok.exe; see docs/REVIEWER-DEMO.md.' }
# Read only the named credential. Never evaluate a dotenv file as PowerShell.
$taskToken = $env:NGROK_AUTHTOKEN
$taskEnvPath = Join-Path $taskRoot '.env.local'
if (Test-Path -LiteralPath $taskEnvPath) {
  foreach ($taskLine in [IO.File]::ReadAllLines($taskEnvPath)) {
    if ($taskLine -match '^\s*NGROK_AUTHTOKEN\s*=\s*(.*?)\s*$') {
      $taskToken = $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
}
if (-not $taskToken -or $taskToken -notmatch '^[A-Za-z0-9_-]{20,200}$') { throw 'Add your ngrok Authtoken as NGROK_AUTHTOKEN in ignored .env.local. Never paste it into chat. Existing demo was not stopped.' }
$taskConfigPath = Join-Path $taskDirectory 'ngrok.yml'
# Credentials stay out of process arguments. No request bodies are captured locally.
$taskYaml = "version: 3`nagent:`n  authtoken: '$taskToken'`n  web_addr: 127.0.0.1:4041`n  console_ui: false`n  inspect_db_size: 0`n  remote_management: false`n  update_check: false`n  heartbeat_interval: 10s`n  heartbeat_tolerance: 15s`n"
[IO.File]::WriteAllText($taskConfigPath, $taskYaml, (New-Object Text.UTF8Encoding $false))
$taskValidation = & $taskExe config check --config $taskConfigPath 2>&1
if ($LASTEXITCODE -ne 0) { throw 'ngrok configuration check failed. No credential or raw diagnostic was printed.' }
$taskToken = $null
$taskYaml = $null
