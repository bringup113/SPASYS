# SPA登记系统

一个现代化的SPA管理系统的单页应用，用于管理房间、服务分类、服务项目、技师、销售员和订单。支持实时WebSocket更新，多终端同步。

## 功能特性

### 🏠 房间管理
- 管理房间名称和状态（可用、使用中、维护中）
- 添加房间描述信息
- 实时状态更新
- 支持临时房间创建

### 📂 服务分类管理
- 创建和管理服务分类
- 用于组织和管理服务项目

### 🎯 服务项目管理
- 管理服务项目名称和时长
- 关联服务分类
- 不管理价格（价格由技师设置）

### 👨‍💼 技师管理
- 管理技师基本信息（工号、国籍、入职时间）
- 工号唯一，不可重复
- 为每个服务项目设置价格和技师抽成
- 支持复制技师配置（除工号外）
- 管理技师可提供的服务项目

### 👩‍💼 销售员管理
- 管理销售员信息
- 支持固定抽成和比例抽成两种模式
- 灵活设置抽成金额或比例

### 📋 订单管理
- 创建和管理订单
- 实时订单状态更新
- 支持多服务项目组合
- 自动计算总金额和抽成
- 倒计时功能

### 📊 报表系统
- 日报表和期间报表
- 销售数据统计
- 技师业绩分析

### 🔄 实时同步
- WebSocket实时数据更新
- 多终端数据同步
- 实时房间状态显示
- 实时订单信息更新

## 功能特性

### 🏠 房间管理
- 管理房间名称和状态（可用、使用中、维护中）
- 添加房间描述信息
- 实时状态更新

### 📂 服务分类管理
- 创建和管理服务分类
- 用于组织和管理服务项目

### 🎯 服务项目管理
- 管理服务项目名称和时长
- 关联服务分类
- 不管理价格（价格由技师设置）

### 👨‍💼 技师管理
- 管理技师基本信息（工号、国籍、入职时间）
- 工号唯一，不可重复
- 为每个服务项目设置价格和技师抽成
- 支持复制技师配置（除工号外）
- 管理技师可提供的服务项目

### 👩‍💼 销售员管理
- 管理销售员信息
- 支持固定抽成和比例抽成两种模式
- 灵活设置抽成金额或比例

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **路由**: React Router v6
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **状态管理**: React Context API
- **构建工具**: Vite

### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: PostgreSQL
- **缓存**: Redis
- **实时通信**: Socket.IO
- **容器化**: Docker

### 部署
- **容器编排**: Docker Compose
- **数据库**: PostgreSQL 14
- **缓存**: Redis 7

## 快速开始

### 🚀 一键部署（推荐）

#### 方法1：复制粘贴部署

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
      PGADMIN_DEFAULT_PASSWORD: admin123
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "8080:80"
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
```

6. **访问应用**
- 前端应用: http://localhost:5173
- 后端API: http://localhost:3001
- 数据库管理: http://localhost:5050 (admin@spa.com / admin)

#### 方法2：使用管理脚本

1. **下载管理脚本**
```bash
# Windows
curl -O https://raw.githubusercontent.com/bringup113/SPASYS/master/docker-manage.bat

# Linux/Mac
curl -O https://raw.githubusercontent.com/bringup113/SPASYS/master/docker-manage.sh
chmod +x docker-manage.sh
```

2. **启动服务**
```bash
# Windows
.\docker-manage.bat start

# Linux/Mac
./docker-manage.sh start
```

### 本地开发

1. **安装依赖**
```bash
# 前端依赖
npm install

# 后端依赖
cd server && npm install
```

2. **启动后端服务**
```bash
cd server
npm start
```

3. **启动前端开发服务器**
```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
├── src/                    # 前端源码
│   ├── components/         # 组件
│   │   ├── Layout.tsx     # 布局组件
│   │   └── Sidebar.tsx    # 侧边栏组件
│   ├── context/           # 状态管理
│   │   └── AppContext.tsx # 应用状态上下文
│   ├── hooks/             # 自定义Hook
│   │   └── useLocalStorage.ts
│   ├── pages/             # 页面组件
│   │   ├── Dashboard.tsx  # 仪表板
│   │   ├── Rooms.tsx      # 房间管理
│   │   ├── Orders.tsx     # 订单管理
│   │   ├── ServiceCategories.tsx
│   │   ├── ServiceItems.tsx
│   │   ├── Technicians.tsx
│   │   ├── Salespeople.tsx
│   │   ├── Currencies.tsx # 货币管理
│   │   ├── DailyReport.tsx # 日报表
│   │   ├── PeriodReport.tsx # 期间报表
│   │   └── Settings.tsx   # 系统设置
│   ├── services/          # API服务
│   │   ├── api.ts         # API客户端
│   │   └── websocket.ts   # WebSocket服务
│   ├── types/             # 类型定义
│   │   └── index.ts
│   ├── utils/             # 工具函数
│   │   ├── exportData.js
│   │   └── timeUtils.ts
│   ├── App.tsx            # 主应用组件
│   ├── main.tsx           # 应用入口
│   └── index.css          # 全局样式
├── server/                # 后端源码
│   ├── database/          # 数据库
│   │   └── init/          # 初始化脚本
│   ├── index.js           # 主服务器文件
│   ├── package.json       # 后端依赖
│   └── Dockerfile         # 后端Docker配置
├── docker-compose.yml     # Docker编排配置
├── Dockerfile.frontend    # 前端Docker配置
├── docker-manage.bat      # Windows管理脚本
├── docker-manage.sh       # Linux/Mac管理脚本
└── README.md              # 项目说明
```

## 数据模型

### 房间 (Room)
```typescript
interface Room {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  description?: string;
}
```

### 服务分类 (ServiceCategory)
```typescript
interface ServiceCategory {
  id: string;
  name: string;
}
```

### 服务项目 (ServiceItem)
```typescript
interface ServiceItem {
  id: string;
  name: string;
  duration: number;
  categoryId: string;
}
```

### 技师 (Technician)
```typescript
interface Technician {
  id: string;
  employeeId: string; // 唯一工号
  country: string;
  hireDate: string;
  services: ServiceAssignment[];
}

interface ServiceAssignment {
  serviceId: string;
  price: number;
  commission: number;
}
```

### 销售员 (Salesperson)
```typescript
interface Salesperson {
  id: string;
  name: string;
  commissionType: 'fixed' | 'percentage';
  commissionRate: number;
}
```



### 订单 (Order)
```typescript
interface Order {
  id: string;
  roomId: string;
  roomName: string;
  customerName?: string;
  customerPhone?: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  receivedAmount?: number;
  companyCommissionRuleId?: string;
  companyCommissionRuleName?: string;
  companyCommissionType?: string;
  companyCommissionRate?: number;
  companyCommissionAmount?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
}

interface OrderItem {
  serviceId: string;
  technicianId: string;
  technicianName: string;
  price: number;
  commission: number;
  salespersonId?: string;
  salespersonName?: string;
  salespersonCommission?: number;
}
```

## 使用说明

1. **房间管理**: 添加和管理SPA房间，设置房间状态
2. **服务分类**: 创建服务分类，用于组织服务项目
3. **服务项目**: 在分类下添加具体服务项目，设置服务时长
4. **技师管理**: 添加技师信息（工号唯一），为每个项目设置价格和抽成
5. **销售员管理**: 添加销售员，设置抽成方式

7. **订单管理**: 创建和管理订单，实时跟踪服务进度
8. **报表系统**: 查看日报表和期间报表，分析业务数据

## 数据持久化

系统使用PostgreSQL数据库进行数据持久化，所有数据存储在数据库中。Redis用于缓存和会话管理。

### 数据库初始化

系统包含完整的数据库初始化脚本，位于 `server/database/init/` 目录：

- `01-init.sql` - 房间表结构
- `02-rooms.sql` - 房间数据
- `02-service-categories.sql` - 服务分类
- `03-service-items.sql` - 服务项目

- `05-business-settings.sql` - 业务设置
- `06-salespeople.sql` - 销售员数据
- `07-technicians.sql` - 技师数据
- `08-orders.sql` - 订单表结构

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Docker管理

### 服务管理

```bash
# Windows
.\docker-manage.bat start    # 启动所有服务
.\docker-manage.bat stop     # 停止所有服务
.\docker-manage.bat restart  # 重启所有服务
.\docker-manage.bat logs     # 查看服务日志
.\docker-manage.bat status   # 查看服务状态
.\docker-manage.bat build    # 重新构建镜像
.\docker-manage.bat clean    # 清理所有数据

# Linux/Mac
./docker-manage.sh start     # 启动所有服务
./docker-manage.sh stop      # 停止所有服务
./docker-manage.sh restart   # 重启所有服务
./docker-manage.sh logs      # 查看服务日志
./docker-manage.sh status    # 查看服务状态
./docker-manage.sh build     # 重新构建镜像
./docker-manage.sh clean     # 清理所有数据
```

### 服务访问地址

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **pgAdmin**: http://localhost:8080 (admin@spa.com / admin123)

### pgAdmin数据库管理

pgAdmin是一个强大的PostgreSQL数据库管理工具，可以通过Web界面管理数据库：

1. **访问pgAdmin**: 打开浏览器访问 http://localhost:8080
2. **登录**: 使用邮箱 `admin@spa.com` 和密码 `admin123` 登录
3. **添加服务器连接**:
   - 右键点击 "Servers" → "Register" → "Server..."
   - 在 "General" 标签页中，输入名称：`SPA Database`
   - 在 "Connection" 标签页中，输入：
     - Host: `postgres` (容器内连接)
     - Port: `5432`
     - Username: `postgres`
     - Password: `password`
     - Database: `spa_system`
4. **管理数据库**: 连接后可以查看表结构、执行SQL查询、管理数据等

## 开发说明

### 添加新功能

1. 在 `src/types/index.ts` 中定义新的类型
2. 在 `src/context/AppContext.tsx` 中添加状态管理逻辑
3. 创建新的页面组件
4. 在 `src/App.tsx` 中添加路由
5. 在后端 `server/index.js` 中添加API接口
6. 在数据库初始化脚本中添加表结构

### 样式定制

系统使用Tailwind CSS，可以在 `src/index.css` 中添加自定义样式。

### WebSocket实时更新

系统使用Socket.IO实现实时数据同步。在添加新功能时，需要：

1. 在后端API中添加 `broadcastDataUpdate` 调用
2. 在前端 `AppContext.tsx` 中添加相应的事件处理

## 许可证

MIT License 