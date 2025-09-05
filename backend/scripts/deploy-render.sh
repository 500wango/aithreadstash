#!/bin/bash
# 部署AI ThreadStash后端到Render平台的脚本

set -e

echo "===== 开始部署到Render平台 ====="

# 检查render-cli是否安装
if ! command -v render &> /dev/null; then
    echo "错误: render-cli未安装。请先安装render-cli。"
    echo "安装指南: https://render.com/docs/cli"
    exit 1
fi

# 检查是否登录render-cli
render whoami || {
    echo "请先登录render-cli"
    render login
}

# 检查render.yaml文件是否存在
if [ ! -f "../render.yaml" ]; then
    echo "错误: 未找到render.yaml文件"
    exit 1
fi

echo "===== 部署Blueprint ====="
render blueprint apply -f ../render.yaml

echo "===== 部署完成 ====="
echo "请访问Render仪表板查看部署状态: https://dashboard.render.com"
echo "部署完成后，请验证API健康检查: https://aithreadstash-api.onrender.com/health"