#!/bin/bash

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 本地部署函数
deploy_local() {
    print_status "开始本地部署..."
    
    # 检查环境文件
    if [ ! -f ".env" ]; then
        print_status "创建环境文件..."
        cp .env.example .env
        print_status "请编辑 .env 文件配置你的环境变量"
    fi
    
    # 停止现有服务
    print_status "停止现有服务..."
    docker-compose -f docker-compose.local.yml down 2>/dev/null || true
    
    # 构建并启动服务（本地构建，不推送）
    print_status "构建应用镜像..."
    docker-compose -f docker-compose.local.yml build --no-cache app
    
    print_status "启动所有服务..."
    docker-compose -f docker-compose.local.yml up -d
    
    # 等待服务启动
    print_status "等待服务启动..."
    sleep 30
    
    # 运行数据库迁移
    print_status "运行数据库迁移..."
    docker-compose -f docker-compose.local.yml exec -T app npm run db:push
    
    # 检查服务状态
    print_status "检查服务状态..."
    docker-compose -f docker-compose.local.yml ps
    
    print_success "本地部署完成！"
    print_success "应用地址: https://liveonchain.com"
    print_success "本地访问: http://localhost:3000"
}

# 清理函数
cleanup() {
    print_status "清理 Docker 资源..."
    
    # 停止服务
    docker-compose -f docker-compose.local.yml down
    
    # 清理未使用的镜像（保留基础镜像）
    docker image prune -f
    
    # 显示剩余镜像
    print_status "当前 Docker 镜像："
    docker images
}

case "$1" in
    "deploy")
        deploy_local
        ;;
    "stop")
        print_status "停止所有服务..."
        docker-compose -f docker-compose.local.yml down
        ;;
    "restart")
        print_status "重启服务..."
        docker-compose -f docker-compose.local.yml restart
        ;;
    "logs")
        docker-compose -f docker-compose.local.yml logs -f
        ;;
    "cleanup")
        cleanup
        ;;
    "status")
        docker-compose -f docker-compose.local.yml ps
        ;;
    *)
        echo "用法: $0 {deploy|stop|restart|logs|cleanup|status}"
        echo ""
        echo "  deploy  - 本地构建并部署"
        echo "  stop    - 停止所有服务"
        echo "  restart - 重启服务"
        echo "  logs    - 查看日志"
        echo "  cleanup - 清理资源"
        echo "  status  - 查看状态"
        ;;
esac
