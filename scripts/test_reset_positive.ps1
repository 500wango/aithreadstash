$ErrorActionPreference = 'Stop'

# Config
$baseUrl = 'http://localhost:3007'
$email = 'reset-' + [guid]::NewGuid().ToString('N') + '@example.com'
$oldPassword = 'ResetPass123!'
$newPassword = 'NewPass456!'

function Write-Section($text) {
  Write-Host ("==== $text ====")
}

# 1) Register
Write-Section "Registering $email"
$regBody = @{ email = $email; password = $oldPassword } | ConvertTo-Json
$reg = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/register" -ContentType 'application/json' -Body $regBody
if (-not $reg.accessToken) { throw "Register failed: no accessToken returned. Raw: $($reg | ConvertTo-Json -Depth 6)" }

# 2) Forgot password
Write-Section 'Requesting forgot-password token'
$forgotBody = @{ email = $email } | ConvertTo-Json
$forgot = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/forgot-password" -ContentType 'application/json' -Body $forgotBody
if (-not $forgot.token) { throw "Forgot-password did not return token (likely production mode). Raw: $($forgot | ConvertTo-Json -Depth 6)" }
$token = $forgot.token

# 3) Verify token
Write-Section 'Verifying reset token'
$verify = Invoke-RestMethod -Method Get -Uri ("$baseUrl/auth/reset-password/verify?token=" + [uri]::EscapeDataString($token))
if (-not $verify.valid) { throw "Token verification failed. Raw: $($verify | ConvertTo-Json -Depth 6)" }

# 4) Reset password
Write-Section 'Resetting password'
$resetBody = @{ token = $token; newPassword = $newPassword } | ConvertTo-Json
$reset = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/reset-password" -ContentType 'application/json' -Body $resetBody
if (-not $reset.accessToken) { throw "Reset password failed: no accessToken. Raw: $($reset | ConvertTo-Json -Depth 6)" }

# 5) Login with old password (should fail)
Write-Section 'Login with OLD password (expect fail)'
$oldLoginFailed = $false
try {
  $oldLoginBody = @{ email = $email; password = $oldPassword } | ConvertTo-Json
  $oldLogin = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType 'application/json' -Body $oldLoginBody -ErrorAction Stop
  # If we arrived here without error, that is a problem
  $oldLoginFailed = $false
} catch {
  $oldLoginFailed = $true
}
if (-not $oldLoginFailed) { throw 'Old password unexpectedly succeeded after reset.' }

# 6) Login with NEW password (should succeed)
Write-Section 'Login with NEW password (expect success)'
$newLoginBody = @{ email = $email; password = $newPassword } | ConvertTo-Json
$newLogin = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType 'application/json' -Body $newLoginBody
if (-not $newLogin.accessToken) { throw "New password login failed. Raw: $($newLogin | ConvertTo-Json -Depth 6)" }

# Output summary JSON
$summary = [PSCustomObject]@{
  email    = $email
  forgot   = $forgot
  verify   = $verify
  reset    = $reset
  newLogin = $newLogin
}
$summary | ConvertTo-Json -Depth 8