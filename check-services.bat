@echo off
chcp 65001 >nul

echo 🔍 检查服务状态...
echo ===================

echo 📊 Docker容器状态:
docker-compose ps

echo.
echo 🔍 端口占用检查:
netstat -an | findstr :3001
netstat -an | findstr :5173
netstat -an | findstr :5432
netstat -an | findstr :6379

echo.
echo 📋 后端日志:
docker-compose logs backend --tail=20

echo.
echo 📋 数据库日志:
docker-compose logs postgres --tail=10

echo.
echo 🔍 健康检查:
curl -s http://localhost:3001/api/health || echo "后端API未响应"

echo.
echo 📊 服务访问地址:
echo - 前端: http://localhost:5173
echo - 后端: http://localhost:3001
echo - 数据库: localhost:5432
echo - Redis: localhost:6379
echo - pgAdmin: http://localhost:5050 