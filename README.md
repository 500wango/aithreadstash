# AI ThreadStash

一个强大的AI对话管理工具，帮助用户捕获、组织和利用与AI的有价值互动。

## 🚀 功能特性

- ✅ 支持ChatGPT、Gemini、Claude和Perplexity对话捕获
- ✅ 多种导出格式（Markdown、JSON、PDF）
- ✅ Notion集成（Pro版功能）
- ✅ 用户认证系统（邮箱/密码、Google、GitHub）
- ✅ Stripe支付集成
- ✅ 响应式前端界面

## 📦 项目结构

```
aithreadstash-project/
├── backend/           # NestJS后端API
├── frontend-website/  # Next.js前端网站
├── browser-extension/ # 浏览器插件
└── README.md         # 项目说明文档
```

## 🛠️ 安装和运行

### 前置要求

- Node.js 18+
- PostgreSQL 12+
- Git

### 1. 克隆项目

```bash
git clone <repository-url>
cd aithreadstash-project
```

### 2. 后端设置

```bash
cd backend

# 安装依赖
npm install

# 创建数据库
createdb aithreadstash

# 配置环境变量
cp .env.example .env
# 编辑.env文件，填入数据库连接信息和API密钥

# 运行数据库迁移
npm run migration:run

# 启动开发服务器
npm run start:dev
```

### 3. 前端设置

```bash
cd frontend-website

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑.env.local文件，设置API地址

# 启动开发服务器
npm run dev
```

### 4. 浏览器插件

1. 打开Chrome浏览器，进入 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `browser-extension` 文件夹

## 🔧 环境变量配置

### 后端 (.env)

```env
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=aithreadstash

# JWT
JWT_SECRET=your_jwt_secret

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Notion
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# 加密
ENCRYPTION_KEY=your_encryption_key
```

### 前端 (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

## 🧪 测试

### 后端测试

```bash
cd backend
npm test              # 运行所有测试
npm run test:watch    # 监听模式运行测试
npm run test:cov      # 生成测试覆盖率报告
```

### 前端测试

```bash
cd frontend-website
npm test              # 运行所有测试
npm run test:watch    # 监听模式运行测试
```

## 📋 API文档

启动后端服务后，访问 `http://localhost:3002/api` 查看Swagger文档。

## 🚢 部署

### 生产环境部署

1. **构建后端**
   ```bash
   cd backend
   npm run build
   npm run start:prod
   ```

2. **构建前端**
   ```bash
   cd frontend-website
   npm run build
   npm run start
   ```

### Docker部署（可选）

```bash
# 构建镜像
docker build -t aithreadstash-backend ./backend
docker build -t aithreadstash-frontend ./frontend-website

# 运行容器
docker run -p 3002:3002 aithreadstash-backend
docker run -p 3000:3000 aithreadstash-frontend
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您遇到问题：

1. 查看 [问题追踪](https://github.com/your-username/aithreadstash/issues)
2. 创建新的issue
3. 发送邮件到 support@aithreadstash.app

## 🔗 相关链接

- [项目路线图](ROADMAP.md)
- [API文档](API.md)
- [贡献指南](CONTRIBUTING.md)