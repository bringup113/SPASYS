# SPA系统后端 - 统一服务管理

## 🎯 新的服务架构

现在所有数据库和缓存服务都通过Docker Compose统一管理，结构更清晰：

```
server/
├── docker-compose.yml          # 统一服务配置
├── database/
│   └── init/
│       └── 01-init.sql        # 数据库初始化脚本
├── manage.bat                  # Windows服务管理脚本
├── manage.sh                   # Linux/macOS服务管理脚本
└── index.js                    # API服务器
```

## 🚀 快速启动

### 1. 启动所有服务
```bash
# Windows
manage.bat start

# Linux/macOS
./manage.sh start
```

### 2. 检查服务状态
```bash
# Windows
manage.bat status

# Linux/macOS
./manage.sh status
```

### 3. 查看服务日志
```bash
# Windows
manage.bat logs

# Linux/macOS
./manage.sh logs
```

## 📊 服务访问地址

- **API服务器**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **pgAdmin**: http://localhost:5050 (admin@spa.com / admin)

## 🔧 服务管理命令

| 命令 | 说明 |
|------|------|
| `start` | 启动所有服务 |
| `stop` | 停止所有服务 |
| `restart` | 重启所有服务 |
| `logs` | 查看服务日志 |
| `status` | 查看服务状态 |
| `init` | 初始化数据库 |
| `clean` | 清理所有数据 |

## 🗄️ 数据库结构

### 应用状态表 (app_state)
```sql
CREATE TABLE app_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 缓存表 (cache)
```sql
CREATE TABLE cache (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB,
  expires_at TIMESTAMP
);
```

## 🔍 故障排除

### 1. 服务启动失败
```bash
# 检查Docker是否运行
docker --version

# 检查端口占用
netstat -an | findstr :3001
netstat -an | findstr :5432
netstat -an | findstr :6379
```

### 2. 数据库连接失败
```bash
# 检查PostgreSQL容器
docker exec spa-postgres psql -U postgres -d spa_system -c "SELECT 1;"
```

### 3. Redis连接失败
```bash
# 检查Redis容器
docker exec spa-redis redis-cli ping
```

## 📈 性能优化

### 缓存策略
- **应用状态缓存**: 5分钟
- **自动缓存清理**: 数据更新时自动清除
- **Redis存储**: 提升读取性能

### 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_app_state_updated_at ON app_state(updated_at);
CREATE INDEX idx_cache_expires_at ON cache(expires_at);

-- 定期清理过期缓存
DELETE FROM cache WHERE expires_at < NOW();
```

## 🎉 优势

### ✅ 统一管理
- 所有服务通过Docker Compose统一管理
- 一键启动/停止所有服务
- 自动数据持久化

### ✅ 开发友好
- 包含pgAdmin数据库管理界面
- 完整的日志查看功能
- 简化的管理脚本

### ✅ 生产就绪
- 数据持久化存储
- 服务自动重启
- 网络隔离

---

**注意**: 这个新架构完全保持了前端业务逻辑不变，只替换了数据存储层。 