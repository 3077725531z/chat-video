#!/bin/bash

# 一键部署脚本
# 使用方法: bash deploy.sh

echo "🚀 开始部署聊天视频应用..."

# 检查是否已初始化Git
if [ ! -d ".git" ]; then
    echo "📦 初始化Git仓库..."
    git init
    git branch -M main
fi

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 发现未提交的更改，正在提交..."
    git add .
    git commit -m "准备部署: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# 显示Git远程仓库
echo "📡 当前Git远程仓库:"
git remote -v

echo ""
echo "✅ 代码已准备好！"
echo ""
echo "📋 下一步操作："
echo "1. 如果还没有GitHub仓库，请先创建："
echo "   https://github.com/new"
echo ""
echo "2. 如果已有GitHub仓库，执行："
echo "   git remote add origin https://github.com/你的用户名/chat-video-app.git"
echo "   git push -u origin main"
echo ""
echo "3. 然后访问 https://render.com 部署"
echo ""
echo "详细步骤请查看: 一键部署指南.md"

