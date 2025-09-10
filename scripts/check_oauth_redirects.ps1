$ErrorActionPreference = 'Stop'

function Get-RedirectLocationViaCurl($url) {
  $tmp = New-TemporaryFile
  try {
    $null = & curl.exe -s -D $tmp -o NUL $url
    $headers = Get-Content -Path $tmp -Raw
    foreach ($line in $headers -split "`r?`n") {
      if ($line -match '^Location:\s*(.+)$') {
        return $Matches[1].Trim()
      }
    }
    return $null
  } finally {
    Remove-Item -Path $tmp -ErrorAction SilentlyContinue
  }
}

$google = Get-RedirectLocationViaCurl 'http://localhost:3007/auth/google'
$github = Get-RedirectLocationViaCurl 'http://localhost:3007/auth/github'

[PSCustomObject]@{
  google = $google
  github = $github
} | ConvertTo-Json -Depth 3