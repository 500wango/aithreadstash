# 🚀 AI ThreadStash 部署操作指南

## 第一步：GitHub仓库准备

### 1. 初始化Git仓库（如果尚未初始化）
```bash
cd H:\aithreadstash-project
git init
git add .
git commit -m "Initial commit: AI ThreadStash project"
```

### 2. 创建GitHub仓库并关联
```bash
# 在GitHub上创建新仓库：aithreadstash
git remote add origin https://github.com/你的用户名/aithreadstash.git
git branch -M main
```

## 第二步：配置GitHub Secrets（关键步骤）

在GitHub仓库设置中配置以下Secrets：

### 必需配置的Secrets：
1. **`VPS_HOST`** - VPS服务器IP或域名
2. **`VPS_SSH_KEY`** - SSH私钥（用于服务器连接）
3. **`JWT_SECRET`** - 强密码用于JWT令牌
4. **`ENCRYPTION_KEY`** - 加密密钥

### 可选配置的Secrets（根据需求）：
5. `STRIPE_SECRET_KEY` - Stripe支付密钥
6. `GITHUB_CLIENT_ID` - GitHub OAuth客户端ID
7. `GITHUB_CLIENT_SECRET` - GitHub OAuth客户端密钥
8. `GOOGLE_CLIENT_ID` - Google OAuth客户端ID
9. `GOOGLE_CLIENT_SECRET` - Google OAuth客户端密钥

## 第三步：首次推送代码到GitHub

```bash
# 推送代码到GitHub
git push -u origin main

# 验证推送成功
git status
git log --oneline -5
```

## 第四步：生产环境服务器准备

### 1. 服务器基础配置
```bash
# 登录到你的VPS服务器
ssh michael@你的服务器IP

# 安装必要软件
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm postgresql nginx certbot

# 配置Node.js版本管理（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 安装PM2
npm install -g pm2
```

### 2. 数据库配置
```bash
# 创建生产数据库
sudo -u postgres createdb aithreadstash_prod
sudo -u postgres createuser aithreadstash_user --createdb --login

# 设置数据库密码
sudo -u postgres psql -c "ALTER USER aithreadstash_user WITH PASSWORD '强密码';"
```

### 3. 项目目录准备
```bash
# 创建项目目录
sudo mkdir -p /srv/aithreadstash
sudo chown michael:michael /srv/aithreadstash
```

## 第五步：触发自动部署

### 方法1：推送代码触发（推荐）
```bash
# 在本地进行代码修改后
git add .
git commit -m "部署准备: 配置生产环境"
git push origin main
```

### 方法2：手动触发工作流
1. 访问GitHub仓库 → Actions
2. 选择 "Deploy to VPS" 工作流
3. 点击 "Run workflow" 手动触发

## 第六步：验证部署状态

### 1. 检查GitHub Actions状态
- 查看CI Pipeline是否通过
- 确认Deploy Pipeline执行成功

### 2. 服务器端验证
```bash
# 登录服务器检查服务状态
ssh michael@你的服务器IP
pm2 status

# 检查应用日志
pm2 logs aithreadstash-api
pm2 logs aithreadstash-web

# 验证服务运行
curl http://localhost:3007/health
curl http://localhost:3000
```

### 3. 域名和SSL配置
```bash
# 配置Nginx（参考DEPLOYMENT.md）
sudo nano /etc/nginx/sites-available/aithreadstash

# 获取SSL证书
sudo certbot certonly --standalone -d aithreadstash.com -d www.aithreadstash.com
sudo certbot certonly --standalone -d api.aithreadstash.com

# 重启Nginx
sudo systemctl restart nginx
```

## 第七步：最终验证

### 1. 功能测试
- 访问 https://aithreadstash.com
- 测试注册/登录功能
- 验证API端点 https://api.aithreadstash.com/health
- 测试浏览器扩展与后端的通信
- 验证数据库连接和数据持久化

### 2. 监控设置
```bash
# 设置PM2开机自启
pm2 startup
pm2 save

# 配置日志轮转（可选）
sudo nano /etc/logrotate.d/pm2
```

## 第八步：GitHub Secrets 配置指南

### 必需配置的Secrets：

1. **PRODUCTION_HOST**
   - 值：您的服务器IP地址（如 `123.45.67.89`）或域名（如 `example.com`）

2. **SSH_USERNAME**
   - 值：SSH登录用户名（通常是 `root` 或您的用户名）

3. **SSH_PRIVATE_KEY**
   - 值：SSH私钥内容（完整的私钥，包括 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`）

### 配置步骤：

1. 登录GitHub，进入您的仓库 `https://github.com/500wango/aithreadstash`
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. 依次添加上述三个Secrets

### 生成SSH密钥对（如果还没有）：

```bash
# 在本地生成新的SSH密钥对
ssh-keygen -t rsa -b 4096 -C "aithreadstash-deployment" -f ~/.ssh/aithreadstash_deploy_key

# 将公钥添加到服务器的 ~/.ssh/authorized_keys
cat ~/.ssh/aithreadstash_deploy_key.pub | ssh your_username@your_server_ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# 将私钥内容复制到GitHub Secret SSH_PRIVATE_KEY
cat ~/.ssh/aithreadstash_deploy_key
```

## 第九步：服务器初始化

在服务器上运行以下命令进行初始化：

```bash
# 下载并执行服务器设置脚本
curl -o server-setup.sh https://raw.githubusercontent.com/500wango/aithreadstash/clean-main/scripts/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

## 第十步：Nginx 配置

创建Nginx配置文件：

```bash
sudo nano /etc/nginx/sites-available/aithreadstash
```

使用DEPLOYMENT.md中的配置模板，替换您的域名。

## 第十一步：SSL证书配置

```bash
# 安装SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续订
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 第十二步：触发自动部署

配置完成后，向 clean-main 分支推送代码即可自动触发部署：

```bash
git push origin clean-main
```

## 📋 部署检查清单

- [ ] GitHub Secrets配置完成
- [ ] 代码成功推送到GitHub
- [ ] CI Pipeline测试通过
- [ ] Deploy Pipeline执行成功
- [ ] 服务器PM2服务正常运行
- [ ] 数据库连接正常
- [ ] 域名解析正确
- [ ] SSL证书配置完成
- [ ] 前端和后端服务可访问

## ⚠️ 注意事项

1. **首次部署**：可能需要手动在服务器上运行一次部署脚本
2. **环境变量**：确保服务器上的环境变量与GitHub Secrets一致
3. **数据库迁移**：首次部署会自动运行数据库迁移
4. **监控**：建议设置Uptime Robot或其他监控服务
5. **备份**：配置数据库定期备份策略

## 📁 相关文件

- `.github/workflows/ci.yml` - CI/CD流水线配置
- `.github/workflows/deploy.yml` - 后端部署配置
- `.github/workflows/deploy-frontend.yml` - 前端部署配置
- `DEPLOYMENT.md` - 详细部署文档
- `backend/ecosystem.config.js` - 后端PM2配置
- `frontend-website/ecosystem.config.js` - 前端PM2配置

## 🆘 故障排除

1. **部署失败**：检查GitHub Actions日志获取详细错误信息
2. **服务器连接问题**：验证SSH密钥和服务器网络配置
3. **数据库连接失败**：检查数据库服务和连接字符串
4. **服务启动失败**：查看PM2日志定位问题

---

*最后更新: $(date)*