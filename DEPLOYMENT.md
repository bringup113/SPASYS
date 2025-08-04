# SPA系统 PostgreSQL 迁移部署指南

## 🎯 迁移目标

将SPA系统从localStorage迁移到PostgreSQL数据库，**保持前端业务逻辑完全不变**。

## 📋 迁移步骤

### 第一步：导出现有数据

1. **启动前端应用**
```bash
npm run dev
```

2. **打开浏览器控制台**
```javascript
// 在浏览器控制台中执行
exportSPAData()
```

3. **下载数据文件**
- 数据文件将自动下载到浏览器默认下载目录
- 文件名格式：`spa-data-YYYY-MM-DD-HH-MM-SS.json`

### 第二步：设置后端环境

1. **安装PostgreSQL**
```bash
# Windows: 下载安装包
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib
```

2. **安装Redis**
```bash
# Windows: 下载安装包
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server
```

3. **启动服务**
```bash
# 启动PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql  # macOS

# 启动Redis
redis-server
```

### 第三步：部署后端API

1. **进入server目录**
```bash
cd server
```

2. **运行部署脚本**
```bash
# Linux/macOS
chmod +x deploy.sh
./deploy.sh

# Windows
npm install
```

3. **配置环境变量**
```bash
cp env.example .env
# 编辑 .env 文件，设置数据库连接信息
```

4. **初始化数据库**
```bash
psql -U postgres -f database.sql
```

5. **启动API服务器**
```bash
npm run dev
```

### 第四步：数据迁移

1. **复制数据文件到server目录**
```bash
cp ~/Downloads/spa-data-*.json server/
```

2. **运行迁移脚本**
```bash
cd server
node migrate.js spa-data-*.json
```

3. **执行迁移**
```bash
# 方式1: 使用API迁移（推荐）
node migrate-data.js

# 方式2: 直接SQL迁移
psql -U postgres -d spa_system -f migration.sql
```

### 第五步：验证迁移

1. **检查API健康状态**
```bash
curl http://localhost:3001/api/health
```

2. **验证数据完整性**
```bash
curl http://localhost:3001/api/app-state
```

3. **测试前端连接**
- 修改前端API地址（如果需要）
- 测试所有功能是否正常

## 🔧 配置说明

### 环境变量配置

```bash
# .env 文件
DB_USER=postgres
DB_HOST=localhost
DB_NAME=spa_system
DB_PASSWORD=your_password
DB_PORT=5432
REDIS_URL=redis://localhost:6379
PORT=3001
```

### 数据库结构

```sql
-- 应用状态表
CREATE TABLE app_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 缓存表
CREATE TABLE cache (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB,
  expires_at TIMESTAMP
);
```

## 🚀 性能优化

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

## 🔍 故障排除

### 常见问题

1. **数据库连接失败**
```bash
# 检查PostgreSQL服务状态
sudo service postgresql status

# 检查连接
psql -U postgres -h localhost
```

2. **Redis连接失败**
```bash
# 检查Redis服务状态
redis-cli ping

# 启动Redis
redis-server
```

3. **API服务器启动失败**
```bash
# 检查端口占用
lsof -i :3001

# 检查日志
npm run dev
```

4. **数据迁移失败**
```bash
# 检查数据文件格式
cat spa-data-*.json | jq .

# 重新运行迁移
node migrate.js spa-data-*.json
```

### 日志查看

```bash
# API服务器日志
npm run dev

# 数据库日志
tail -f /var/log/postgresql/postgresql-*.log

# Redis日志
tail -f /var/log/redis/redis-server.log
```

## 📊 监控和维护

### 健康检查

```bash
# API健康状态
curl http://localhost:3001/api/health

# 数据库连接
psql -U postgres -d spa_system -c "SELECT COUNT(*) FROM app_state;"

# Redis连接
redis-cli ping
```

### 数据备份

```bash
# 备份数据库
pg_dump -U postgres spa_system > backup.sql

# 恢复数据库
psql -U postgres spa_system < backup.sql
```

### 性能监控

```bash
# 查看API响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/app-state

# 查看数据库性能
psql -U postgres -d spa_system -c "SELECT * FROM pg_stat_activity;"
```

## ✅ 迁移完成检查清单

- [ ] 前端数据成功导出
- [ ] PostgreSQL数据库安装并运行
- [ ] Redis缓存服务安装并运行
- [ ] 后端API服务器启动成功
- [ ] 数据迁移完成
- [ ] 前端功能测试通过
- [ ] 性能测试通过
- [ ] 备份策略配置完成

## 🎉 迁移完成

恭喜！您的SPA系统已成功迁移到PostgreSQL数据库。

### 系统特性

- ✅ **数据持久化** - 数据安全存储在PostgreSQL中
- ✅ **高性能缓存** - Redis提供快速响应
- ✅ **业务逻辑不变** - 前端完全兼容
- ✅ **可扩展架构** - 支持未来功能扩展

### 下一步建议

1. **监控系统性能**
2. **定期数据备份**
3. **添加用户认证**
4. **实现数据审计**
5. **优化查询性能**

---

**注意**: 在整个迁移过程中，前端的所有业务逻辑、函数名称、字段名称都保持不变，确保系统的稳定性和兼容性。 