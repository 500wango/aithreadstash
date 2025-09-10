$ErrorActionPreference = 'Stop'

function Write-Section($text) {
  Write-Host ("==== " + $text + " ====")
}

# 1) Register + Login using existing script
Write-Section "Auth: Register/Login"
$summaryJson = & (Join-Path $PSScriptRoot 'test_login_positive.ps1')
$summary = $summaryJson | ConvertFrom-Json
$access = $summary.register.accessToken
if (-not $access) { throw "No access token from register" }
$headers = @{ Authorization = "Bearer $access" }

# 2) Drive status before connect
Write-Section 'Drive: Status (before)'
$statusBefore = Invoke-RestMethod -Method Get -Uri 'http://localhost:3007/drive/status' -Headers $headers
$statusBefore | ConvertTo-Json -Depth 5 | Write-Host

# 3) Drive connect (dev mock)
Write-Section 'Drive: Connect (dev mock)'
$connectPayload = @{ accessToken = 'mock-access-token'; folderId = 'mock_drive_folder_1'; folderName = 'AI ThreadStash Exports' } | ConvertTo-Json
$connectRes = Invoke-RestMethod -Method Post -Uri 'http://localhost:3007/drive/connect' -Headers $headers -ContentType 'application/json' -Body $connectPayload
$connectRes | ConvertTo-Json -Depth 5 | Write-Host

# 4) Drive status after connect
Write-Section 'Drive: Status (after)'
$statusAfter = Invoke-RestMethod -Method Get -Uri 'http://localhost:3007/drive/status' -Headers $headers
$statusAfter | ConvertTo-Json -Depth 5 | Write-Host

# 5) Drive list folders (dev mock)
Write-Section 'Drive: Folders'
$folders = Invoke-RestMethod -Method Get -Uri 'http://localhost:3007/drive/folders' -Headers $headers
$folders | ConvertTo-Json -Depth 5 | Write-Host

# 6) Drive save document (dev mock)
Write-Section 'Drive: Save'
$savePayload = @{ title = 'Hello World Doc'; content = 'This is a test content from script.'; summary = 'Short summary'; tags = 'test,script' } | ConvertTo-Json
$save = Invoke-RestMethod -Method Post -Uri 'http://localhost:3007/drive/save' -Headers $headers -ContentType 'application/json' -Body $savePayload
$save | ConvertTo-Json -Depth 5 | Write-Host

# 7) Output final summary
[PSCustomObject]@{
  accessToken  = $access
  statusBefore = $statusBefore
  connect      = $connectRes
  statusAfter  = $statusAfter
  folders      = $folders
  save         = $save
} | ConvertTo-Json -Depth 8