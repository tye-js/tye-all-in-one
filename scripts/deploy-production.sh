#!/bin/bash

# 生产环境部署脚本
set -e

echo "🚀 开始生产环境部署..."

# 检查环境文件
if [ ! -f ".env" ]; then
    echo "❌ .env 文件不存在，请先创建"
    exit 1
fi

# 检查 Google 凭证文件
if [ ! -f "google-credentials.json" ]; then
    echo "⚠️  google-credentials.json 不存在，TTS 功能将不可用"
fi

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose -f docker-compose.prod.yml down

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker-compose -f docker-compose.prod.yml pull

# 启动服务
echo "🔄 启动服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 运行数据库迁移
echo "🗄️  运行数据库迁移..."
docker-compose -f docker-compose.prod.yml exec -T app npm run db:push

# 检查服务状态
echo "✅ 检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

echo "🎉 部署完成！"
echo "📱 应用地址: https://yourdomain.com"
echo "🔧 管理后台: https://yourdomain.com/admin"