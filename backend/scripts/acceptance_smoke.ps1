# Acceptance smoke test for auth and drive
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-JsonPost($url, $obj, $headers) {
  if ($null -ne $headers) {
    return Invoke-RestMethod -Method Post -Uri $url -Headers $headers -ContentType 'application/json' -Body ($obj | ConvertTo-Json)
  }
  else {
    return Invoke-RestMethod -Method Post -Uri $url -ContentType 'application/json' -Body ($obj | ConvertTo-Json)
  }
}

$base = Get-Date -Format 'yyyyMMddHHmmss'
$email = "tester+$base@example.com"
$password = "Passw0rd!$base"
$api = 'http://localhost:3007'

Write-Host "[1] Register $email"
$reg = Invoke-JsonPost "$api/auth/register" @{ email = $email; password = $password }
$access = $reg.accessToken
$refresh = $reg.refreshToken
if (-not $access) { throw 'No access token from register' }
Write-Host "Register OK. access len: $($access.Length)"

Write-Host "[2] /auth/me"
$headers = @{ Authorization = "Bearer $access" }
$me = Invoke-RestMethod -Method Get -Uri "$api/auth/me" -Headers $headers
$userId = $me.id
if (-not $userId) { throw 'No user id from /auth/me' }
Write-Host "/auth/me OK. userId: $userId"

Write-Host "[3] Login"
$login = Invoke-JsonPost "$api/auth/login" @{ email = $email; password = $password }
if (-not $login.accessToken) { throw 'Login failed' }
Write-Host "Login OK."

Write-Host "[4] Forgot password (dev returns token)"
$forgot = Invoke-JsonPost "$api/auth/forgot-password" @{ email = $email }
$token = $forgot.token
if (-not $token) { throw 'No reset token (expected in development)' }
Write-Host "Forgot OK. Token length: $($token.Length)"

Write-Host "[5] Verify token"
$verify = Invoke-RestMethod -Method Get -Uri ("$api/auth/reset-password/verify?token=" + [System.Web.HttpUtility]::UrlEncode($token))
if (-not $verify.valid) { $verify | ConvertTo-Json -Depth 5 | Write-Host; throw 'Verify failed' }
Write-Host "Verify OK."

Write-Host "[6] Reset password"
$newPassword = "N3wPass!$base"
$reset = Invoke-JsonPost "$api/auth/reset-password" @{ token = $token; newPassword = $newPassword }
Write-Host "Reset OK."

Write-Host "[7] Login with old password should fail"
$oldLoginFailed = $false
try {
  $null = Invoke-JsonPost "$api/auth/login" @{ email = $email; password = $password }
} catch {
  $oldLoginFailed = $true
}
if (-not $oldLoginFailed) { throw 'Old password still works' }
Write-Host "Old password rejected as expected."

Write-Host "[8] Login with new password"
$login2 = Invoke-JsonPost "$api/auth/login" @{ email = $email; password = $newPassword }
$access2 = $login2.accessToken
if (-not $access2) { throw 'New login failed' }
$headers2 = @{ Authorization = "Bearer $access2" }
Write-Host "New login OK."

Write-Host "[9] Drive mock-connect"
$mock = Invoke-JsonPost "$api/drive/mock-connect" @{ userId = $userId; folderName = 'AI ThreadStash Exports' }
if (-not $mock.success) { throw 'Mock connect failed' }
Write-Host "Mock connect OK."

Write-Host "[10] Drive status"
$status = Invoke-RestMethod -Method Get -Uri "$api/drive/status" -Headers $headers2
Write-Host ("Status: " + ($status | ConvertTo-Json -Depth 5))

Write-Host "[11] Drive folders"
$folders = Invoke-RestMethod -Method Get -Uri "$api/drive/folders" -Headers $headers2
Write-Host ("Folders: " + ($folders | ConvertTo-Json -Depth 5))

Write-Host "[12] Drive save"
$save = Invoke-JsonPost "$api/drive/save" @{ title = "Acceptance Test $base"; content = "Hello from acceptance test at $base"; summary = 'Test summary'; tags = 'tag1,tag2' } -headers $headers2
Write-Host ("Save: " + ($save | ConvertTo-Json -Depth 5))

Write-Host "ALL DONE."