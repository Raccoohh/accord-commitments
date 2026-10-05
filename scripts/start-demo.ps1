param([string]$NodePath = '', [ValidateSet('auto','ngrok','localhost','cloudflare')][string]$Provider = 'auto')
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $taskRoot
$taskDirectory = Join-Path $taskRoot '.runtime/demo'
New-Item -ItemType Directory -Path $taskDirectory -Force | Out-Null
if ($Provider -eq 'auto') {
  if (Test-Path -LiteralPath (Join-Path $taskDirectory 'ngrok.yml')) { $Provider = 'ngrok' }
  else { $Provider = 'localhost' }
}
if ($Provider -eq 'ngrok') {
  & "$PSScriptRoot/prepare-ngrok.ps1"
  $taskTunnelExe = Join-Path $taskDirectory 'ngrok.exe'
}
elseif ($Provider -eq 'cloudflare') { $taskTunnelExe = Join-Path $taskDirectory 'cloudflared.exe' }
else { $taskTunnelExe = (Get-Command ssh.exe -CommandType Application).Source }
if (-not (Test-Path -LiteralPath $taskTunnelExe)) { throw 'Tunnel client is missing; see docs/REVIEWER-DEMO.md.' }
. "$PSScriptRoot/start-local.ps1" -NodePath $NodePath
$taskStatePath = Join-Path $taskDirectory 'state.json'
if (Test-Path -LiteralPath $taskStatePath) {
  $taskPrevious = Get-Content -Raw -LiteralPath $taskStatePath | ConvertFrom-Json
  $taskExisting = Get-CimInstance Win32_Process -Filter "ProcessId = $($taskPrevious.tunnel)"
  $taskExistingGateway = Get-CimInstance Win32_Process -Filter "ProcessId = $($taskPrevious.gateway)"
  if ($taskPrevious.provider -eq $Provider -and $taskExisting -and $taskExistingGateway -and $taskExisting.CommandLine.Contains($taskTunnelExe) -and $taskExistingGateway.CommandLine.Contains((Join-Path $taskRoot 'src\demo-gateway.mjs'))) {
    $taskStillReachable=$false
    try {
      $taskSavedConfig=Get-Content -Raw -LiteralPath (Join-Path $taskDirectory 'config.json') | ConvertFrom-Json
      $taskSavedAuth='Basic '+[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($taskSavedConfig.username+':'+$taskSavedConfig.password))
      $taskRemoteHealth=Invoke-RestMethod ($taskPrevious.url+'/api/health') -Headers @{Authorization=$taskSavedAuth;'ngrok-skip-browser-warning'='1'} -TimeoutSec 10
      $taskStillReachable=$taskRemoteHealth.ready -and $taskRemoteHealth.provider -eq 'local'
    } catch { }
    if($taskStillReachable){
      Write-Output "Reviewer demo already running and reachable: $($taskPrevious.url)"
      Write-Output 'Credentials are in delivery/demo-access.txt. Do not commit that file.'
      return
    }
  }
  & "$PSScriptRoot/stop-demo.ps1"
}
$taskConfigPath = Join-Path $taskDirectory 'config.json'
if (Test-Path -LiteralPath $taskConfigPath) { $taskConfig = Get-Content -Raw -LiteralPath $taskConfigPath | ConvertFrom-Json }
else {
  $taskRandom = New-Object byte[] 24
  $taskRng = [Security.Cryptography.RandomNumberGenerator]::Create()
  $taskRng.GetBytes($taskRandom); $taskRng.Dispose()
  $taskConfig = [pscustomobject]@{username='reviewer';password=([Convert]::ToBase64String($taskRandom)).TrimEnd('=').Replace('+','-').Replace('/','_');publicOrigin=$null}
}
$taskConfig.publicOrigin = $null
$taskConfig | ConvertTo-Json | Set-Content -LiteralPath $taskConfigPath -Encoding utf8
$taskGatewayFile = Join-Path $taskRoot 'src\demo-gateway.mjs'
$taskGateway = Start-Process -FilePath $taskNode -ArgumentList ('"'+$taskGatewayFile+'"') -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskDirectory 'gateway.out.log') -RedirectStandardError (Join-Path $taskDirectory 'gateway.err.log')
$taskState = [ordered]@{gateway=$taskGateway.Id;tunnel=0;tunnelPath=$taskTunnelExe;provider=$Provider;awake=0;url=$null}
$taskState | ConvertTo-Json | Set-Content -LiteralPath $taskStatePath -Encoding utf8
try {
  $taskAuth = 'Basic '+[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($taskConfig.username+':'+$taskConfig.password))
  $taskGatewayReady = $false
  for ($taskAttempt=0;$taskAttempt -lt 20;$taskAttempt++) {
    try { $taskHealth=Invoke-RestMethod 'http://127.0.0.1:3100/api/health' -Headers @{Authorization=$taskAuth} -TimeoutSec 2; if($taskHealth.ready){$taskGatewayReady=$true;break} } catch { }
    Start-Sleep -Milliseconds 500
  }
  if (-not $taskGatewayReady) { throw 'Reviewer gateway did not become ready.' }
  if ($Provider -eq 'ngrok') { $taskArguments=@('http','http://127.0.0.1:3100','--config',('"'+(Join-Path $taskDirectory 'ngrok.yml')+'"'),'--inspect=false','--log=stdout','--log-format=json','--log-level=warn') }
  elseif ($Provider -eq 'cloudflare') { $taskArguments=@('tunnel','--no-autoupdate','--url','http://127.0.0.1:3100','--protocol','http2') }
  else { $taskArguments=@('-T','-o','BatchMode=yes','-o','ConnectTimeout=15','-o','ExitOnForwardFailure=yes','-o','ServerAliveInterval=30','-o','ServerAliveCountMax=3','-o','StrictHostKeyChecking=accept-new','-o',('"UserKnownHostsFile='+(Join-Path $taskDirectory 'known_hosts')+'"'),'-o','IdentitiesOnly=yes','-o','IdentityFile=none','-R','80:127.0.0.1:3100','nokey@localhost.run','--','--output','json') }
  $taskTunnel = Start-Process -FilePath $taskTunnelExe -ArgumentList $taskArguments -WorkingDirectory $taskDirectory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskDirectory 'tunnel.out.log') -RedirectStandardError (Join-Path $taskDirectory 'tunnel.err.log')
  $taskState.tunnel=$taskTunnel.Id
  $taskState | ConvertTo-Json | Set-Content -LiteralPath $taskStatePath -Encoding utf8
  $taskUrl=$null
  for($taskAttempt=0;$taskAttempt -lt 90;$taskAttempt++) {
    if ($Provider -eq 'ngrok') {
      try {
        $taskEndpoints = Invoke-RestMethod 'http://127.0.0.1:4041/api/tunnels' -TimeoutSec 2
        $taskEndpoint = $taskEndpoints.tunnels | Where-Object { $_.config.addr -eq 'http://127.0.0.1:3100' -and $_.public_url -match '^https://[a-z0-9-]+\.(ngrok-free\.app|ngrok-free\.dev|ngrok\.app|ngrok\.dev|ngrok\.io)$' } | Select-Object -First 1
        if ($taskEndpoint) { $taskUrl = $taskEndpoint.public_url; break }
      } catch { }
    }
    $taskLog=(Get-Content -LiteralPath (Join-Path $taskDirectory 'tunnel.err.log') -Raw -ErrorAction SilentlyContinue)+(Get-Content -LiteralPath (Join-Path $taskDirectory 'tunnel.out.log') -Raw -ErrorAction SilentlyContinue)
    if($taskLog -match 'https://(?!api\.)[a-z0-9-]+\.trycloudflare\.com') {$taskUrl=$Matches[0];break}
    if($Provider -eq 'localhost' -and $taskLog -match 'https://(?!admin\.)[a-z0-9-]+\.(?:lhr\.life|localhost\.run)') {$taskUrl=$Matches[0];break}
    if($taskTunnel.HasExited){throw 'Tunnel exited; see .runtime/demo/tunnel.err.log.'}
    Start-Sleep -Milliseconds 500
  }
  if(-not $taskUrl){throw 'No reviewer URL was returned; see .runtime/demo/tunnel.err.log.'}
  $taskConfig.publicOrigin=$taskUrl
  $taskConfig | ConvertTo-Json | Set-Content -LiteralPath $taskConfigPath -Encoding utf8
  $taskState.url=$taskUrl
  $taskAwakeFile=Join-Path $taskRoot 'scripts\demo-keep-awake.ps1'
  $taskAwake=Start-Process -FilePath "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$taskAwakeFile+'"'),'-GatewayId',$taskGateway.Id -WindowStyle Hidden -PassThru
  $taskState.awake=$taskAwake.Id
  $taskState | ConvertTo-Json | Set-Content -LiteralPath $taskStatePath -Encoding utf8
  New-Item -ItemType Directory -Path (Join-Path $taskRoot 'delivery') -Force | Out-Null
  $taskAvailability = 'The host computer must remain powered on and connected. Free tunnel URLs are temporary and may change.'
  if ($Provider -eq 'ngrok') { $taskAvailability = 'This is the account-assigned ngrok dev domain. The computer must stay powered on and connected. Free plan quotas apply. If ngrok displays a notice, click Visit Site, then enter the credentials. After a reboot, run scripts/start-demo.ps1 again.' }
  @("Accord reviewer demo", "URL: $taskUrl", "Username: $($taskConfig.username)", "Password: $($taskConfig.password)", '', 'Share this access note privately through the submission form. Do not add it to GitHub.', $taskAvailability, 'Use fictional/shareable recordings. Uploads pass through the tunnel provider to the host computer for local inference.') | Set-Content -LiteralPath (Join-Path $taskRoot 'delivery/demo-access.txt') -Encoding utf8
  Write-Output "Reviewer URL: $taskUrl"
  Write-Output 'Credentials: delivery/demo-access.txt (excluded from Git). External access still needs verification.'
} catch {
  & "$PSScriptRoot/stop-demo.ps1"
  throw
}
