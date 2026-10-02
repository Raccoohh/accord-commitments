param([string]$CasesPath = 'fixtures/cases.json')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$taskRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $taskRoot
$cases = (Get-Content -LiteralPath $CasesPath -Raw | ConvertFrom-Json).cases
$parts = Join-Path $taskRoot 'fixtures/.parts'
New-Item -ItemType Directory -Path $parts -Force | Out-Null
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$speaker.Rate = 0
try {
  foreach ($case in $cases) {
    if ($case.baseCase) {
      $turns = @($cases | Where-Object id -eq $case.baseCase | Select-Object -ExpandProperty turns | ForEach-Object { [pscustomobject]@{speaker=$_.speaker;text=$_.text} })
      $turns[$case.replaceTurn.index].text = $case.replaceTurn.text
    } else { $turns = $case.turns }
    $manifest = @()
    for ($i=0; $i -lt $turns.Count; $i++) {
      $turn = $turns[$i]
      $voice = if ($turn.speaker -eq 'Alex') { 'Microsoft David Desktop' } else { 'Microsoft Zira Desktop' }
      $speaker.SelectVoice($voice)
      $path = Join-Path $parts ($case.id + '-' + $i + '.wav')
      $speaker.SetOutputToWaveFile($path,$format)
      $speaker.Speak($turn.text)
      $speaker.SetOutputToNull()
      $manifest += [pscustomobject]@{speaker=$turn.speaker;text=$turn.text;voice=$voice;path=$path}
    }
    ConvertTo-Json -InputObject @($manifest) -Depth 5 | Set-Content -LiteralPath (Join-Path $parts ($case.id + '.json')) -Encoding UTF8
  }
} finally { $speaker.Dispose() }
node scripts/assemble-audio.mjs $CasesPath
if ($LASTEXITCODE -ne 0) { throw 'Audio assembly failed.' }
