@echo off
chcp 65001 >nul

echo 🧹 清理Docker数据...
echo ===================

echo 📦 停止所有容器...
docker-compose down

echo 🗑️ 删除数据卷...
docker volume rm spa_postgres_data 2>nul
docker volume rm spa_redis_data 2>nul
docker volume rm spa_pgadmin_data 2>nul

echo 🧹 清理未使用的资源...
docker system prune -f

echo ✅ 清理完成！
echo.
echo 🚀 现在可以重新启动服务:
echo docker-compose up -d
echo.
echo 或者使用管理脚本:
echo .\docker-manage.bat start 