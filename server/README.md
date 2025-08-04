# SPA系统后端API

## 功能特性

- ✅ **完全兼容前端** - 保持所有字段名称和函数名称不变
- ✅ **PostgreSQL数据库** - 数据持久化存储
- ✅ **Redis缓存** - 提升响应速度
- ✅ **RESTful API** - 标准化的API接口

## 安装和运行

### 1. 安装依赖
```bash
cd server
npm install
```

### 2. 配置环境变量
```bash
cp env.example .env
# 编辑 .env 文件，设置数据库和Redis连接信息
```

### 3. 设置数据库
```bash
# 安装PostgreSQL
# 运行数据库初始化脚本
psql -U postgres -f database.sql
```

### 4. 启动Redis
```bash
# 安装并启动Redis服务器
redis-server
```

### 5. 启动API服务器
```bash
npm run dev
```

服务器将在 http://localhost:3001 启动

## API接口

### 应用状态
- `GET /api/app-state` - 获取完整应用状态
- `PUT /api/app-state` - 更新完整应用状态

### 房间管理
- `GET /api/rooms` - 获取所有房间
- `POST /api/rooms` - 创建房间
- `PUT /api/rooms/:id` - 更新房间
- `DELETE /api/rooms/:id` - 删除房间

### 服务分类
- `GET /api/service-categories` - 获取所有服务分类
- `POST /api/service-categories` - 创建服务分类
- `PUT /api/service-categories/:id` - 更新服务分类
- `DELETE /api/service-categories/:id` - 删除服务分类

### 服务项目
- `GET /api/service-items` - 获取所有服务项目
- `POST /api/service-items` - 创建服务项目
- `PUT /api/service-items/:id` - 更新服务项目
- `DELETE /api/service-items/:id` - 删除服务项目

### 技师管理
- `GET /api/technicians` - 获取所有技师
- `POST /api/technicians` - 创建技师
- `PUT /api/technicians/:id` - 更新技师
- `DELETE /api/technicians/:id` - 删除技师
- `PATCH /api/technicians/:id/status` - 更新技师状态

### 销售员管理
- `GET /api/salespeople` - 获取所有销售员
- `POST /api/salespeople` - 创建销售员
- `PUT /api/salespeople/:id` - 更新销售员
- `DELETE /api/salespeople/:id` - 删除销售员



### 订单管理
- `GET /api/orders` - 获取所有订单
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id` - 更新订单
- `DELETE /api/orders/:id` - 删除订单
- `PATCH /api/orders/:id/status` - 更新订单状态

### 业务设置
- `GET /api/business-settings` - 获取业务设置
- `PUT /api/business-settings` - 更新业务设置

### 健康检查
- `GET /api/health` - 服务器健康状态

## 缓存策略

- **应用状态缓存**: 5分钟
- **自动缓存清理**: 数据更新时自动清除相关缓存
- **Redis存储**: 提升读取性能

## 数据迁移

从localStorage迁移到PostgreSQL：

1. 导出localStorage数据
2. 通过API接口导入数据
3. 验证数据完整性

## 部署

### 生产环境
```bash
npm start
```

### Docker部署（可选）
```bash
docker build -t spa-backend .
docker run -p 3001:3001 spa-backend
```

## 监控

- 健康检查端点: `/api/health`
- 日志记录: 控制台输出
- 错误处理: 标准HTTP状态码 