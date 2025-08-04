# SPA管理系统 - 一键部署

## 🚀 快速部署

### 方法1：使用Docker Compose（推荐）

1. **创建部署目录**
```bash
mkdir spa-system
cd spa-system
```

2. **创建docker-compose.yml文件**
```yaml
version: '3.8'

services:
  # PostgreSQL数据库
  postgres:
    image: postgres:14-alpine
    container_name: spa-postgres
    environment:
      POSTGRES_DB: spa_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database-init:/docker-entrypoint-initdb.d
    networks:
      - spa-network
    restart: unless-stopped
    platform: linux/amd64

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: spa-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - spa-network
    restart: unless-stopped

  # 数据库初始化脚本下载器
  db-init:
    image: alpine:latest
    container_name: spa-db-init
    command: >
      sh -c "
        apk add --no-cache git &&
        git clone https://github.com/bringup113/SPASYS.git /tmp/spa &&
        cp -r /tmp/spa/server/database/init/* /database-init/ &&
        rm -rf /tmp/spa
      "
    volumes:
      - ./database-init:/database-init
    networks:
      - spa-network

  # 后端API服务器
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: spa-backend
    environment:
      - DB_USER=postgres
      - DB_HOST=postgres
      - DB_NAME=spa_system
      - DB_PASSWORD=password
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379
      - PORT=3001
    ports:
      - "3001:3001"
    networks:
      - spa-network
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    platform: linux/amd64

  # 前端应用
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: spa-frontend
    environment:
      - VITE_API_URL=/api
    ports:
      - "5173:5173"
    networks:
      - spa-network
    depends_on:
      - backend
    restart: unless-stopped
    platform: linux/amd64

  # pgAdmin (可选，用于数据库管理)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: spa-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@spa.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - spa-network
    depends_on:
      - postgres
    restart: unless-stopped
    platform: linux/amd64

volumes:
  postgres_data:
  redis_data:
  pgadmin_data:

networks:
  spa-network:
    driver: bridge
```

3. **创建Dockerfile.backend文件**
```dockerfile
FROM --platform=linux/amd64 node:18-alpine

# 安装git
RUN apk add --no-cache git

# 设置工作目录
WORKDIR /app

# 从GitHub克隆代码并复制后端文件
RUN git clone https://github.com/bringup113/SPASYS.git /tmp/spa && \
    cp -r /tmp/spa/server/* . && \
    rm -rf /tmp/spa

# 安装依赖
RUN npm install --only=production

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"]
```

4. **创建Dockerfile.frontend文件**
```dockerfile
FROM --platform=linux/amd64 node:18-alpine

# 安装git
RUN apk add --no-cache git

# 设置工作目录
WORKDIR /app

# 从GitHub克隆代码
RUN git clone https://github.com/bringup113/SPASYS.git .

# 安装依赖
RUN npm install

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 5173

# 启动命令
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

5. **启动服务**
```bash
# 创建数据库初始化目录
mkdir database-init

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 方法2：一键脚本部署

1. **下载部署脚本**
```bash
# Windows
curl -O https://raw.githubusercontent.com/bringup113/SPASYS/master/docker-manage.bat

# Linux/Mac
curl -O https://raw.githubusercontent.com/bringup113/SPASYS/master/docker-manage.sh
chmod +x docker-manage.sh
```

2. **执行部署**
```bash
# Windows
.\docker-manage.bat start

# Linux/Mac
./docker-manage.sh start
```

## 📊 服务访问地址

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **pgAdmin**: http://localhost:5050 (admin@spa.com / admin)

## 🔧 管理命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps

# 重新构建
docker-compose build --no-cache

# 清理数据
docker-compose down -v
docker system prune -f
```

## 📝 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少2GB可用内存
- 至少5GB可用磁盘空间

## 🆘 常见问题

### 1. 端口被占用
如果端口被占用，可以修改docker-compose.yml中的端口映射：
```yaml
ports:
  - "8080:5173"  # 前端
  - "8081:3001"  # 后端
  - "8082:5432"  # 数据库
```

### 2. 构建失败
```bash
# 清理缓存重新构建
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

### 3. 数据库连接失败
```bash
# 检查数据库状态
docker-compose logs postgres

# 重新初始化数据库
docker-compose down -v
docker-compose up -d
```

## 🎉 部署完成

部署完成后，访问 http://localhost:5173 即可使用SPA管理系统！

系统功能包括：
- 🏠 房间管理
- 📋 订单管理
- 👨‍💼 技师管理
- 👩‍💼 销售员管理

- 📊 报表系统
- 🔄 实时同步 