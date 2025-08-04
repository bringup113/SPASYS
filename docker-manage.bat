@echo off
chcp 65001 >nul

echo 🚀 SPA系统Docker管理
echo ====================

if "%1"=="start" (
    echo 📦 启动所有服务...
    docker-compose up -d
    echo ⏳ 等待服务启动...
    timeout /t 10 /nobreak >nul
    echo 🔍 检查服务状态...
    docker-compose ps
    echo ✅ 服务启动完成
    echo.
    echo 📊 服务访问地址:
    echo - 前端应用: http://localhost:5173
    echo - 后端API: http://localhost:3001
    echo - PostgreSQL: localhost:5432
    echo - Redis: localhost:6379
    echo - pgAdmin: http://localhost:5050 ^(admin@spa.com / admin^)
    goto :eof
)

if "%1"=="stop" (
    echo 🛑 停止所有服务...
    docker-compose down
    echo ✅ 服务已停止
    goto :eof
)

if "%1"=="restart" (
    echo 🔄 重启所有服务...
    docker-compose down
    docker-compose up -d
    echo ✅ 服务重启完成
    goto :eof
)

if "%1"=="logs" (
    echo 📋 查看服务日志...
    docker-compose logs -f
    goto :eof
)

if "%1"=="status" (
    echo 📊 服务状态...
    docker-compose ps
    echo.
    echo 🔍 后端健康检查:
    curl -s http://localhost:3001/api/health
    goto :eof
)

if "%1"=="build" (
    echo 🔨 重新构建镜像...
    docker-compose build --no-cache
    echo ✅ 镜像构建完成
    goto :eof
)

if "%1"=="clean" (
    echo 🧹 清理所有数据...
    docker-compose down -v
    docker system prune -f
    echo ✅ 数据清理完成
    goto :eof
)

echo 使用方法: %0 {start^|stop^|restart^|logs^|status^|build^|clean}
echo.
echo 命令说明:
echo   start   - 启动所有服务
echo   stop    - 停止所有服务
echo   restart - 重启所有服务
echo   logs    - 查看服务日志
echo   status  - 查看服务状态
echo   build   - 重新构建镜像
echo   clean   - 清理所有数据 