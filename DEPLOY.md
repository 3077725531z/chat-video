# 部署指南

本应用可以部署到多个免费的Node.js托管平台。推荐使用 **Render**，因为它完全免费且支持WebSocket。

## 🚀 方式一：Render（推荐）

### 步骤 1: 准备代码

1. 确保代码已提交到 GitHub
2. 如果没有GitHub仓库，先创建一个：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <你的GitHub仓库地址>
   git push -u origin main
   ```

### 步骤 2: 部署到 Render

1. 访问 [Render](https://render.com)
2. 注册/登录账号（可以使用GitHub账号）
3. 点击 "New +" → "Web Service"
4. 连接你的GitHub仓库
5. 配置设置：
   - **Name**: `chat-video-app`（或你喜欢的名字）
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
6. 点击 "Create Web Service"
7. 等待部署完成（大约5-10分钟）

### 步骤 3: 获取访问地址

部署完成后，Render会提供一个URL，例如：
```
https://chat-video-app.onrender.com
```

### 步骤 4: 配置环境变量（可选）

在Render的Environment Variables中添加：
- `NODE_ENV`: `production`
- `PORT`: `10000`（Render自动设置，通常不需要手动设置）

### 注意事项

- Render免费版在15分钟无活动后会休眠，首次访问需要等待30秒左右唤醒
- 免费版每月有750小时运行时间
- 消息存储文件会在重启后保留（持久化存储）

---

## 🚂 方式二：Railway

### 步骤 1: 准备代码

同Render步骤1

### 步骤 2: 部署到Railway

1. 访问 [Railway](https://railway.app)
2. 注册/登录账号（可以使用GitHub账号）
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择你的仓库
6. Railway会自动检测并部署
7. 等待部署完成

### 步骤 3: 获取访问地址

部署完成后，Railway会提供一个URL，例如：
```
https://chat-video-app.up.railway.app
```

### 注意事项

- Railway免费版每月有$5的免费额度
- 部署速度较快
- 支持自定义域名

---

## ✈️ 方式三：Fly.io

### 步骤 1: 安装Fly CLI

```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# macOS/Linux
curl -L https://fly.io/install.sh | sh
```

### 步骤 2: 登录Fly.io

```bash
fly auth login
```

### 步骤 3: 初始化应用

```bash
fly launch
```

### 步骤 4: 部署

```bash
fly deploy
```

### 注意事项

- Fly.io免费版每月有3个共享CPU的VM
- 需要信用卡验证（但不会扣费）
- 部署速度较快

---

## 🌐 方式四：Glitch

### 步骤 1: 部署到Glitch

1. 访问 [Glitch](https://glitch.com)
2. 注册/登录账号
3. 点击 "New Project" → "Import from GitHub"
4. 输入你的GitHub仓库地址
5. Glitch会自动部署

### 步骤 2: 获取访问地址

Glitch会提供一个URL，例如：
```
https://your-app-name.glitch.me
```

### 注意事项

- Glitch完全免费
- 支持实时编辑
- 免费版在5分钟无活动后会休眠

---

## 🔧 通用配置

### 环境变量

可以在平台的环境变量设置中配置：

- `NODE_ENV`: `production`
- `PORT`: 端口（通常平台会自动设置）
- `CORS_ORIGIN`: CORS源（可选，默认允许所有）

### 本地测试生产环境

```bash
# 设置环境变量
export NODE_ENV=production
export PORT=3000

# 启动服务器
npm start
```

---

## 📱 移动端访问

部署完成后，你可以在手机上访问部署的URL：

1. 在手机浏览器中打开部署的URL
2. 输入昵称并加入聊天
3. 开始使用！

### HTTPS要求

- 所有部署平台都提供HTTPS
- 这是WebRTC的要求（摄像头/麦克风需要HTTPS）
- 本地开发可以使用 `localhost`，但生产环境必须使用HTTPS

---

## 🐛 故障排除

### 1. 部署失败

- 检查 `package.json` 中的依赖是否正确
- 确保 `start` 脚本正确
- 查看部署日志中的错误信息

### 2. WebSocket连接失败

- 确保平台支持WebSocket（Render、Railway、Fly.io都支持）
- 检查Socket.io的CORS配置
- 查看浏览器控制台的错误信息

### 3. 视频无法连接

- 确保使用HTTPS（生产环境）
- 检查STUN服务器是否可访问
- 查看浏览器控制台的WebRTC错误

### 4. 消息未保存

- 检查文件系统写入权限
- 某些平台可能不支持文件系统写入（需要使用数据库）
- 查看服务器日志

---

## 💡 推荐配置

对于生产环境，建议：

1. **使用Render**（最简单，完全免费）
2. **启用HTTPS**（所有平台都自动提供）
3. **配置自定义域名**（可选）
4. **定期备份消息**（如果需要）

---

## 📞 获取帮助

如果遇到问题：

1. 查看平台的文档
2. 检查服务器日志
3. 查看浏览器控制台错误
4. 参考项目的README.md

祝部署顺利！🎉

