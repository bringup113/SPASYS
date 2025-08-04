@echo off
chcp 65001 >nul

echo 🚀 SPA系统服务管理
echo ==================

if "%1"=="start" (
    echo 📦 启动所有服务...
    docker-compose up -d
    echo ⏳ 等待服务启动...
    timeout /t 5 /nobreak >nul
    echo 🔍 检查服务状态...
    docker-compose ps
    echo ✅ 服务启动完成
    echo.
    echo 📊 服务访问地址:
    echo - API服务器: http://localhost:3001
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
    echo 🔍 数据库状态:
    docker exec spa-postgres psql -U postgres -d spa_system -c "SELECT 'Database is running' as status;"
    echo.
    echo 🔍 Redis状态:
    docker exec spa-redis redis-cli ping
    goto :eof
)

if "%1"=="init" (
    echo 🗄️ 初始化数据库...
    docker exec spa-postgres psql -U postgres -d spa_system -f /docker-entrypoint-initdb.d/01-init.sql
    echo ✅ 数据库初始化完成
    goto :eof
)

if "%1"=="clean" (
    echo 🧹 清理所有数据...
    docker-compose down -v
    echo ✅ 数据清理完成
    goto :eof
)

echo 使用方法: %0 {start^|stop^|restart^|logs^|status^|init^|clean}
echo.
echo 命令说明:
echo   start   - 启动所有服务
echo   stop    - 停止所有服务
echo   restart - 重启所有服务
echo   logs    - 查看服务日志
echo   status  - 查看服务状态
echo   init    - 初始化数据库
echo   clean   - 清理所有数据 