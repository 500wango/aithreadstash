# Debug decode JWT and call /auth/me
$ErrorActionPreference = 'Stop'

function Invoke-JsonPost($url, $obj) {
  return Invoke-RestMethod -Method Post -Uri $url -ContentType 'application/json' -Body ($obj | ConvertTo-Json)
}

function Decode-JwtPayload([string]$jwt) {
  $parts = $jwt.Split('.')
  if ($parts.Length -lt 2) { throw 'Invalid JWT' }
  $p = $parts[1].Replace('-', '+').Replace('_', '/')
  switch ($p.Length % 4) { 0 { } 2 { $p += '==' } 3 { $p += '=' } default { throw 'Invalid base64url' } }
  $bytes = [Convert]::FromBase64String($p)
  return [Text.Encoding]::UTF8.GetString($bytes)
}

$api = 'http://localhost:3007'
$base = Get-Date -Format 'yyyyMMddHHmmss'
$email = "dbg+$base@example.com"
$password = "Passw0rd!$base"

Write-Host "Register $email"
$reg = Invoke-JsonPost "$api/auth/register" @{ email = $email; password = $password }
$access = $reg.accessToken
if (-not $access) { throw 'No access token from register' }

Write-Host "Access token length: $($access.Length)"
$payloadJson = Decode-JwtPayload $access
Write-Host "Payload: $payloadJson"

$headers = @{ Authorization = "Bearer $access" }

Write-Host "GET /auth/me"
try {
  $me = Invoke-RestMethod -Method Get -Uri "$api/auth/me" -Headers $headers
  Write-Host ("ME: " + ($me | ConvertTo-Json -Depth 5))
} catch {
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    Write-Host ("ME error: " + $_.ErrorDetails.Message)
  } else {
    Write-Host ("ME error: " + $_)
  }
  throw
}