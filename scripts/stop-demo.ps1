$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskStatePath = Join-Path $taskRoot '.runtime/demo/state.json'
if (-not (Test-Path -LiteralPath $taskStatePath)) { Write-Output 'No managed reviewer demo to stop.'; return }
$taskState = Get-Content -Raw -LiteralPath $taskStatePath | ConvertFrom-Json
foreach ($taskRole in @('tunnel','gateway','awake')) {
  $taskId = $taskState.$taskRole
  if (-not $taskId) { continue }
  $taskProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $taskId"
  if (-not $taskProcess) { continue }
  $taskExpected = switch ($taskRole) { 'tunnel' { $taskState.tunnelPath }; 'gateway' { Join-Path $taskRoot 'src\demo-gateway.mjs' }; 'awake' { Join-Path $taskRoot 'scripts\demo-keep-awake.ps1' } }
  if (-not $taskExpected) { throw 'Missing managed process identity; refusing to stop it.' }
  if (-not $taskProcess.CommandLine -or -not $taskProcess.CommandLine.Contains($taskExpected)) { throw "Process identity changed for $taskRole; refusing to stop it." }
  if ($taskRole -eq 'tunnel' -and $taskState.provider -eq 'localhost' -and (-not $taskProcess.CommandLine.Contains('80:127.0.0.1:3100') -or -not $taskProcess.CommandLine.Contains((Join-Path $taskRoot '.runtime\demo\known_hosts')))) { throw 'SSH process does not belong to this demo; refusing to stop it.' }
  Stop-Process -Id $taskId
}
Remove-Item -LiteralPath $taskStatePath
Write-Output 'Reviewer demo stopped. The local app is still available on port 3000.'
