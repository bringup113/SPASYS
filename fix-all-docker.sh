#!/bin/bash

echo "正在修复所有Docker构建问题..."

echo ""
echo "========================================"
echo "1. 停止并删除现有容器"
echo "========================================"
docker stop spa-frontend spa-backend 2>/dev/null
docker rm spa-frontend spa-backend 2>/dev/null

echo ""
echo "========================================"
echo "2. 删除现有镜像"
echo "========================================"
docker rmi spa-frontend spa-backend 2>/dev/null

echo ""
echo "========================================"
echo "3. 清理Docker缓存"
echo "========================================"
docker system prune -f

echo ""
echo "========================================"
echo "4. 重新构建后端镜像"
echo "========================================"
docker build -f Dockerfile.backend -t spa-backend .

echo ""
echo "========================================"
echo "5. 重新构建前端镜像"
echo "========================================"
docker build -f Dockerfile.frontend.github -t spa-frontend .

echo ""
echo "========================================"
echo "6. 启动后端容器"
echo "========================================"
docker run -d --name spa-backend -p 3001:3001 --network spa-network spa-backend

echo ""
echo "========================================"
echo "7. 启动前端容器"
echo "========================================"
docker run -d --name spa-frontend -p 5173:5173 --network spa-network spa-frontend

echo ""
echo "========================================"
echo "8. 检查容器状态"
echo "========================================"
docker ps | grep "spa-"

echo ""
echo "========================================"
echo "修复完成！"
echo "========================================"
echo "后端地址: http://localhost:3001"
echo "前端地址: http://localhost:5173"
echo ""
echo "检查日志:"
echo "docker logs spa-backend"
echo "docker logs spa-frontend"
