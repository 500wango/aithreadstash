# AI ThreadStash - Render 部署指南

本指南详细说明如何将 AI ThreadStash 的后端和数据库部署到 Render 平台。

## 目录

1. [前提条件](#前提条件)
2. [部署流程概述](#部署流程概述)
3. [数据库部署](#数据库部署)
4. [后端 API 部署](#后端-api-部署)
5. [环境变量配置](#环境变量配置)
6. [部署验证](#部署验证)
7. [前端配置](#前端配置)
8. [故障排除](#故障排除)

## 前提条件

- [Render](https://render.com) 账户
- GitHub 仓库（包含 AI ThreadStash 项目代码）
- 已准备好的环境变量（参考 `.env.production`）

## 部署流程概述

Render 部署使用项目根目录下的 `render.yaml` 文件进行配置，该文件定义了：

- PostgreSQL 数据库服务
- 后端 API 服务
- 所有必要的环境变量
- 健康检查路径
- 构建和启动命令

### 部署方式

可以通过以下两种方式部署：

1. **使用 Render Dashboard**：通过 Web 界面直接部署
2. **使用部署脚本**：使用提供的自动化脚本部署
   - Linux/macOS: `./backend/scripts/deploy-render.sh`
   - Windows: `./backend/scripts/deploy-render.ps1`

## 数据库部署

### 方式一：使用 Render Dashboard

1. 登录 [Render Dashboard](https://dashboard.render.com/)
2. 点击 **New +** 按钮，选择 **Blueprint**
3. 连接包含 AI ThreadStash 代码的 GitHub 仓库
4. Render 将自动检测 `render.yaml` 文件并提示创建定义的服务
5. 确认创建 PostgreSQL 数据库服务 `aithreadstash-db`
6. 数据库创建完成后，记录连接信息（在环境变量中自动配置）

### 方式二：使用部署脚本

1. 安装 [Render CLI](https://render.com/docs/cli)
   ```bash
   # 使用npm安装
   npm install -g @render/cli
   ```

2. 登录 Render CLI
   ```bash
   render login
   ```

3. 运行部署脚本
   - Linux/macOS:
     ```bash
     cd backend/scripts
     chmod +x deploy-render.sh
     ./deploy-render.sh
     ```
   - Windows:
     ```powershell
     cd backend/scripts
     ./deploy-render.ps1
     ```

4. 脚本将自动部署数据库和后端服务

## 后端 API 部署

### 方式一：使用 Render Dashboard

1. 在同一个 Blueprint 部署流程中，确认创建 Web 服务 `aithreadstash-api`
2. Render 将自动执行以下步骤：
   - 从 GitHub 仓库拉取代码
   - 运行构建命令 `npm ci && npm run build`
   - 设置环境变量（部分需要手动配置）
   - 启动服务 `npm run start:render`（该命令会先运行数据库迁移，然后启动应用）
   - 配置健康检查路径 `/health`

### 方式二：使用部署脚本

如果使用上述部署脚本（`deploy-render.sh` 或 `deploy-render.ps1`），后端 API 服务将与数据库一起自动部署。脚本会：

1. 使用 `render.yaml` 中的配置创建或更新服务
2. 自动设置基本环境变量
3. 部署完成后显示验证链接

## 环境变量配置

以下环境变量需要在 Render Dashboard 中手动配置（标记为 `sync: false` 的变量）：

- `JWT_SECRET`：JWT 认证密钥
- `ENCRYPTION_KEY`：数据加密密钥
- `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`：GitHub OAuth 配置
- `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`：Google OAuth 配置
- `STRIPE_SECRET_KEY` 和 `STRIPE_WEBHOOK_SECRET`：Stripe 支付配置
- `NOTION_CLIENT_ID` 和 `NOTION_CLIENT_SECRET`：Notion 集成配置

配置步骤：

1. 在 Render Dashboard 中选择已部署的 `aithreadstash-api` 服务
2. 点击 **Environment** 选项卡
3. 添加或编辑上述环境变量
4. 点击 **Save Changes** 并重新部署服务

## 部署验证

1. 部署完成后，访问 API 健康检查端点：
   ```
   https://aithreadstash-api.onrender.com/health
   ```

2. 预期响应：
   ```json
   {
     "status": "ok",
     "timestamp": "2025-01-01T00:00:00.000Z",
     "uptime": 3600,
     "environment": "production",
     "database": "connected",
     "version": "1.0.0"
   }
   ```

## 前端配置

前端部署需要更新 API URL 配置：

1. 在 Vercel 或其他前端托管平台的环境变量中，设置：
   ```
   NEXT_PUBLIC_API_URL=https://aithreadstash-api.onrender.com
   ```

2. 如果使用 Vercel，可以在 Vercel Dashboard 中配置环境变量，或更新 `vercel.json` 中的 `env` 部分：
   ```json
   "env": {
     "NEXT_PUBLIC_API_URL": "https://aithreadstash-api.onrender.com"
   }
   ```

## 故障排除

### 数据库连接问题

- 检查 `DATABASE_URL` 环境变量是否正确配置
- 确认数据库服务是否正常运行
- 查看 Render 日志中的数据库连接错误

### 应用启动失败

- 检查构建日志是否有编译错误
- 确认所有必要的环境变量已正确设置
- 检查启动命令是否正确

### 健康检查失败

- 确认应用是否成功启动
- 检查健康检查路径是否正确配置
- 查看应用日志中的错误信息

---

如需更多帮助，请参考 [Render 文档](https://render.com/docs) 或联系开发团队。