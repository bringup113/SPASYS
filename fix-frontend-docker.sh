#!/bin/bash

echo "正在修复前端Docker构建问题..."

echo ""
echo "1. 停止并删除现有的前端容器..."
docker stop spa-frontend 2>/dev/null
docker rm spa-frontend 2>/dev/null

echo ""
echo "2. 删除前端镜像..."
docker rmi spa-frontend 2>/dev/null

echo ""
echo "3. 清理Docker缓存..."
docker system prune -f

echo ""
echo "4. 重新构建前端镜像..."
docker build -f Dockerfile.frontend.github -t spa-frontend .

echo ""
echo "5. 启动前端容器..."
docker run -d --name spa-frontend -p 5173:5173 --network spa-network spa-frontend

echo ""
echo "6. 检查容器状态..."
docker ps | grep spa-frontend

echo ""
echo "修复完成！请检查前端服务是否正常运行。"
echo "前端地址: http://localhost:5173"
