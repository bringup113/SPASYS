-- SPA系统数据库初始化脚本
-- 订单管理表结构 - 客户订单的主要信息和详细项目

-- 创建订单表（匹配前端期望的字段）
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,                    -- 订单唯一标识符，格式：order-时间戳
  room_id VARCHAR(50),                           -- 房间ID，关联rooms表，可为NULL（房间删除后）
  room_name VARCHAR(100),                        -- 房间名称快照，即使房间被删除也能显示历史记录
  customer_name VARCHAR(100),                    -- 客户姓名，用于识别和联系
  customer_phone VARCHAR(20),                    -- 客户联系电话，用于后续服务和回访
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')), -- 订单状态：in_progress(进行中)、completed(已完成)、cancelled(已取消)
  handover_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (handover_status IN ('pending', 'handed_over', 'confirmed')), -- 交接班状态：pending(待交接)、handed_over(已交接)、confirmed(已确认)
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0, -- 订单总金额（消费金额），所有服务项目的价格总和
  received_amount DECIMAL(10,2),                 -- 实际收款金额，可能因折扣而小于total_amount
  discount_rate DECIMAL(5,4) DEFAULT 1.0000,    -- 折扣率（实收金额/消费金额），1.0表示无折扣，0.8表示8折
  created_at TIMESTAMP DEFAULT NOW(),            -- 订单创建时间，用于统计和报表
  updated_at TIMESTAMP DEFAULT NOW(),            -- 记录最后更新时间，用于数据同步
  completed_at TIMESTAMP,                        -- 订单完成时间，用于统计技师工作时间和客户满意度
  handover_at TIMESTAMP,                         -- 交接班时间，记录交接班操作的时间
  notes TEXT,                                    -- 订单备注信息，如特殊要求、客户反馈、服务记录等
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL -- 外键约束，房间删除时设为NULL
);

-- 创建订单项目表（存储订单的服务项目） - 订单中的具体服务项目详情
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,                         -- 自增主键
  order_id VARCHAR(50) NOT NULL,                 -- 所属订单ID，关联orders表
  service_id VARCHAR(50) NOT NULL,               -- 服务项目ID，关联service_items表
  service_name VARCHAR(100),                     -- 服务项目名称快照，即使服务被删除也能显示
  technician_id VARCHAR(50),                     -- 提供服务的技师ID，关联technicians表
  technician_name VARCHAR(100),                  -- 技师姓名快照，即使技师离职也能显示
  price DECIMAL(10,2) NOT NULL,                  -- 服务项目价格，可能因技师等级不同而不同
  technician_commission DECIMAL(10,2) NOT NULL DEFAULT 0, -- 技师提成金额快照，用于计算技师收入
  salesperson_id VARCHAR(50),                    -- 销售员ID，关联salespeople表，可能为NULL
  salesperson_name VARCHAR(100),                 -- 销售员姓名快照，用于提成计算
  salesperson_commission DECIMAL(10,2),          -- 销售员提成金额快照，用于财务统计
  company_commission_rule_id VARCHAR(50),        -- 该服务项目使用的公司分成方案ID，关联company_commission_rules表
  company_commission_rule_name VARCHAR(100),     -- 公司分成方案名称快照
  company_commission_type VARCHAR(20),           -- 公司抽成类型快照：none、revenue、profit
  company_commission_rate DECIMAL(5,2),          -- 公司抽成比例快照
  company_commission_amount DECIMAL(10,2),       -- 公司抽成金额快照（结账时计算）
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间，用于统计和审计
  updated_at TIMESTAMP DEFAULT NOW(),            -- 记录最后更新时间，用于数据同步
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, -- 外键约束，订单删除时级联删除项目
  FOREIGN KEY (service_id) REFERENCES service_items(id) ON DELETE SET NULL, -- 外键约束，服务删除时设为NULL
  FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE SET NULL, -- 外键约束，技师删除时设为NULL
  FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE SET NULL, -- 外键约束，销售员删除时设为NULL
  FOREIGN KEY (company_commission_rule_id) REFERENCES company_commission_rules(id) ON DELETE SET NULL -- 外键约束，分成方案删除时设为NULL
);

-- 创建索引 - 优化查询性能
CREATE INDEX IF NOT EXISTS idx_orders_room_id ON orders(room_id);           -- 按房间查询订单的索引
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);             -- 按状态查询订单的索引
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);     -- 按创建时间查询订单的索引

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);       -- 按订单查询项目的索引
CREATE INDEX IF NOT EXISTS idx_order_items_service_id ON order_items(service_id);   -- 按服务查询项目的索引
CREATE INDEX IF NOT EXISTS idx_order_items_technician_id ON order_items(technician_id); -- 按技师查询项目的索引

-- 创建更新时间触发器 - 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为订单表创建更新时间触发器
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_orders_updated_at();

-- 为订单项目表创建更新时间触发器
CREATE OR REPLACE FUNCTION update_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为订单项目表创建更新时间触发器
CREATE TRIGGER update_order_items_updated_at 
    BEFORE UPDATE ON order_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_order_items_updated_at(); 

-- 删除销售员相关字段 - 销售员信息已移至order_items表级别
ALTER TABLE orders DROP COLUMN IF EXISTS salesperson_id;
ALTER TABLE orders DROP COLUMN IF EXISTS salesperson_name;
ALTER TABLE orders DROP COLUMN IF EXISTS salesperson_commission;
ALTER TABLE orders DROP COLUMN IF EXISTS salesperson_commission_currency_id; 