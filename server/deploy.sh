#!/bin/bash

# SPA系统后端部署脚本

echo "🚀 开始部署SPA系统后端..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装"
    exit 1
fi

echo "✅ npm版本: $(npm --version)"

# 检查PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL未安装或不在PATH中"
    echo "请手动安装PostgreSQL: https://www.postgresql.org/download/"
    echo "或者使用Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres"
fi

# 检查Redis
if ! command -v redis-server &> /dev/null; then
    echo "⚠️  Redis未安装或不在PATH中"
    echo "请手动安装Redis: https://redis.io/download"
    echo "或者使用Docker: docker run --name redis -p 6379:6379 -d redis"
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cp env.example .env
    echo "请编辑 .env 文件，设置数据库和Redis连接信息"
fi

# 创建数据库（如果不存在）
echo "🗄️  设置数据库..."
if command -v psql &> /dev/null; then
    # 尝试创建数据库
    psql -U postgres -c "CREATE DATABASE spa_system;" 2>/dev/null || echo "数据库可能已存在"
    
    # 运行数据库初始化脚本
    if [ -f database.sql ]; then
        echo "📊 初始化数据库表..."
        psql -U postgres -d spa_system -f database.sql
    fi
else
    echo "⚠️  请手动创建数据库和表"
    echo "1. 安装PostgreSQL"
    echo "2. 创建数据库: CREATE DATABASE spa_system;"
    echo "3. 运行初始化脚本: psql -U postgres -d spa_system -f database.sql"
fi

# 检查Redis连接
echo "🔍 检查Redis连接..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis连接正常"
    else
        echo "⚠️  Redis未运行，请启动Redis服务器"
        echo "命令: redis-server"
    fi
else
    echo "⚠️  请确保Redis服务器正在运行"
fi

# 启动服务器
echo "🚀 启动API服务器..."
echo "服务器将在 http://localhost:3001 启动"
echo "健康检查: http://localhost:3001/api/health"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev 