$ErrorActionPreference = 'Stop'

# Generate unique test account
$email = 'positive-' + [guid]::NewGuid().ToString('N') + '@example.com'
$password = 'TestPassword123!'

# Helper to print section
function Write-Section($text) {
  Write-Host ('==== ' + $text + ' ====')
}

# Register
Write-Section "Registering $email"
$payload = @{ email = $email; password = $password } | ConvertTo-Json
$reg = Invoke-RestMethod -Method Post -Uri 'http://localhost:3007/auth/register' -ContentType 'application/json' -Body $payload

if (-not $reg.accessToken) { throw "Register failed: no accessToken returned. Raw: $($reg | ConvertTo-Json -Depth 6)" }

# /auth/me with access token
Write-Section 'Calling /auth/me'
$access = $reg.accessToken
$me = Invoke-RestMethod -Method Get -Uri 'http://localhost:3007/auth/me' -Headers @{ Authorization = "Bearer $access" }
if (-not $me.email) { throw "Auth me failed. Raw: $($me | ConvertTo-Json -Depth 6)" }

# Login with same credential
Write-Section 'Login with same credential'
$login = Invoke-RestMethod -Method Post -Uri 'http://localhost:3007/auth/login' -ContentType 'application/json' -Body $payload
if (-not $login.accessToken) { throw "Login failed: no accessToken returned. Raw: $($login | ConvertTo-Json -Depth 6)" }

# Output summary JSON
$summary = [PSCustomObject]@{
  email    = $email
  register = $reg
  me       = $me
  login    = $login
}
$summary | ConvertTo-Json -Depth 8