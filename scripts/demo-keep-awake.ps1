param([Parameter(Mandatory=$true)][int]$GatewayId)
# Temporary system-awake request; no persistent Windows power-plan changes.
Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class AccordAwake { [DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint flags); }'
try {
  while (Get-Process -Id $GatewayId -ErrorAction SilentlyContinue) {
    [AccordAwake]::SetThreadExecutionState([uint32]2147483649) | Out-Null
    Start-Sleep -Seconds 30
  }
} finally { [AccordAwake]::SetThreadExecutionState([uint32]2147483648) | Out-Null }
