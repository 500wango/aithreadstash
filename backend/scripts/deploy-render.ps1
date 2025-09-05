# 部署AI ThreadStash后端到Render平台的PowerShell脚本

$ErrorActionPreference = "Stop"

Write-Host "===== 开始部署到Render平台 =====" -ForegroundColor Green

# 检查render-cli是否安装
try {
    $renderVersion = render --version
    Write-Host "检测到render-cli: $renderVersion" -ForegroundColor Green
}
catch {
    Write-Host "错误: render-cli未安装。请先安装render-cli。" -ForegroundColor Red
    Write-Host "安装指南: https://render.com/docs/cli" -ForegroundColor Yellow
    exit 1
}

# 检查是否登录render-cli
try {
    render whoami | Out-Null
    Write-Host "已登录render-cli" -ForegroundColor Green
}
catch {
    Write-Host "请先登录render-cli" -ForegroundColor Yellow
    render login
}

# 检查render.yaml文件是否存在
$renderYamlPath = "$PSScriptRoot\..\..\render.yaml"
if (-not (Test-Path $renderYamlPath)) {
    Write-Host "错误: 未找到render.yaml文件" -ForegroundColor Red
    exit 1
}

Write-Host "===== 部署Blueprint =====" -ForegroundColor Green
render blueprint apply -f $renderYamlPath

Write-Host "===== 部署完成 =====" -ForegroundColor Green
Write-Host "请访问Render仪表板查看部署状态: https://dashboard.render.com" -ForegroundColor Cyan
Write-Host "部署完成后，请验证API健康检查: https://aithreadstash-api.onrender.com/health" -ForegroundColor Cyan