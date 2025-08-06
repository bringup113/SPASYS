-- 创建数据库表结构

-- 房间表 - 存储所有房间信息，包括临时房间和永久房间
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(50) PRIMARY KEY,                    -- 房间唯一标识符，格式：room-时间戳
  name VARCHAR(100) NOT NULL,                    -- 房间名称，如"VIP1"、"普通房1"
  status VARCHAR(20) NOT NULL DEFAULT 'available', -- 房间状态：available(可用)、occupied(占用)、maintenance(维护)
  description TEXT,                              -- 房间描述信息，如位置、设施等
  is_temporary BOOLEAN DEFAULT FALSE,            -- 是否为临时房间，临时房间会在服务完成后自动删除
  expires_at TIMESTAMP,                          -- 临时房间的过期时间，到期后自动清理
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间
  updated_at TIMESTAMP DEFAULT NOW()             -- 记录最后更新时间
);

-- 服务分类表 - 对服务项目进行分类管理
CREATE TABLE IF NOT EXISTS service_categories (
  id VARCHAR(50) PRIMARY KEY,                    -- 分类唯一标识符，格式：category-时间戳
  name VARCHAR(100) NOT NULL,                    -- 分类名称，如"按摩"、"美容"、"护理"
  description TEXT,                              -- 分类描述信息
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间
  updated_at TIMESTAMP DEFAULT NOW()             -- 记录最后更新时间
);

-- 服务项目表 - 具体的服务项目信息
CREATE TABLE IF NOT EXISTS service_items (
  id VARCHAR(50) PRIMARY KEY,                    -- 服务项目唯一标识符，格式：service-时间戳
  name VARCHAR(100) NOT NULL,                    -- 服务项目名称，如"全身按摩"、"面部护理"
  duration INTEGER NOT NULL DEFAULT 60,          -- 服务时长（分钟），用于计算技师工作时间和客户预约
  category_id VARCHAR(50) NOT NULL,              -- 所属分类ID，关联service_categories表
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间
  updated_at TIMESTAMP DEFAULT NOW(),            -- 记录最后更新时间
  FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
);

-- 销售员表 - 销售员信息和抽成设置
CREATE TABLE IF NOT EXISTS salespeople (
  id VARCHAR(50) PRIMARY KEY,                    -- 销售员唯一标识符，格式：sales-时间戳
  name VARCHAR(100) NOT NULL,                    -- 销售员姓名
  commission_type VARCHAR(20) NOT NULL DEFAULT 'fixed', -- 抽成类型：fixed(固定金额)、percentage(百分比)
  commission_rate DECIMAL(10,2) NOT NULL DEFAULT 0, -- 抽成金额或比例，根据commission_type确定含义
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间
  updated_at TIMESTAMP DEFAULT NOW()             -- 记录最后更新时间
);

-- 国家表 - 技师国籍信息
CREATE TABLE IF NOT EXISTS countries (
  id VARCHAR(50) PRIMARY KEY,                    -- 国家唯一标识符，格式：country-时间戳
  name VARCHAR(100) NOT NULL,                    -- 国家名称，如"中国"、"泰国"、"越南"
  remark TEXT,                                   -- 备注信息，如特殊要求或说明
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间
  updated_at TIMESTAMP DEFAULT NOW()             -- 记录最后更新时间
);

-- 公司分成方案表 - 公司对不同项目的抽成规则
CREATE TABLE IF NOT EXISTS company_commission_rules (
  id VARCHAR(50) PRIMARY KEY,                    -- 方案唯一标识符，格式：rule-时间戳
  name VARCHAR(100) NOT NULL,                    -- 方案名称，如"标准方案"、"VIP方案"
  commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('none', 'revenue', 'profit')), -- 抽成类型：none(不抽成)、revenue(销售额抽成)、profit(利润抽成)
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0, -- 抽成比例，0-100之间的数值
  description TEXT,                              -- 方案详细描述
  is_default BOOLEAN DEFAULT FALSE,              -- 是否为默认方案，新技师默认使用此方案
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间
  updated_at TIMESTAMP DEFAULT NOW()             -- 记录最后更新时间
);

-- 技师表 - 技师基本信息和状态
CREATE TABLE IF NOT EXISTS technicians (
  id VARCHAR(50) PRIMARY KEY,                    -- 技师唯一标识符，格式：tech-时间戳
  employee_id VARCHAR(50) NOT NULL UNIQUE,       -- 技师工号，唯一标识，如"T001"
  country_id VARCHAR(50) NOT NULL,               -- 国籍ID，关联countries表
  hire_date DATE NOT NULL,                       -- 入职日期，用于计算工龄和福利
  status VARCHAR(20) NOT NULL DEFAULT 'available', -- 技师状态：available(可用)、busy(忙碌)、off(休息)、resigned(离职)
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间
  updated_at TIMESTAMP DEFAULT NOW(),            -- 记录最后更新时间
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE RESTRICT
);

-- 技师服务分配表 - 技师可提供的服务项目及价格设置
CREATE TABLE IF NOT EXISTS technician_services (
  id SERIAL PRIMARY KEY,                         -- 自增主键
  technician_id VARCHAR(50) NOT NULL,            -- 技师ID，关联technicians表
  service_id VARCHAR(50) NOT NULL,               -- 服务项目ID，关联service_items表
  price DECIMAL(10,2) NOT NULL DEFAULT 0,        -- 该技师提供此服务的价格，可能因技师等级不同而不同
  commission DECIMAL(10,2) NOT NULL DEFAULT 0,   -- 技师提成金额，从服务价格中扣除
  company_commission_rule_id VARCHAR(50) DEFAULT 'default-rule', -- 该技师此服务使用的公司分成方案ID，关联company_commission_rules表
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间
  updated_at TIMESTAMP DEFAULT NOW(),            -- 记录最后更新时间
  FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES service_items(id) ON DELETE CASCADE,
  FOREIGN KEY (company_commission_rule_id) REFERENCES company_commission_rules(id) ON DELETE RESTRICT, -- 外键约束，防止删除有技师使用的分成方案
  UNIQUE(technician_id, service_id)              -- 确保每个技师对每个服务项目只有一条记录
);

-- 订单表 - 客户订单的主要信息
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,                    -- 订单唯一标识符，格式：order-时间戳
  room_id VARCHAR(50),                           -- 房间ID，关联rooms表，可为NULL（房间删除后）
  room_name VARCHAR(100),                        -- 房间名称快照，即使房间被删除也能显示历史记录
  customer_name VARCHAR(100),                    -- 客户姓名
  customer_phone VARCHAR(20),                    -- 客户联系电话
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- 订单状态：in_progress(进行中)、completed(已完成)、cancelled(已取消)
  handover_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (handover_status IN ('pending', 'handed_over', 'confirmed')), -- 交接班状态：pending(待交接)、handed_over(已交接)、confirmed(已确认)
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0, -- 订单总金额（消费金额）
  received_amount DECIMAL(10,2),                 -- 实际收款金额，可能因折扣而小于total_amount
  discount_rate DECIMAL(5,4) DEFAULT 1.0000,    -- 折扣率（实收金额/消费金额），1.0表示无折扣，0.8表示8折
  created_at TIMESTAMP DEFAULT NOW(),            -- 订单创建时间
  updated_at TIMESTAMP DEFAULT NOW(),            -- 记录最后更新时间
  completed_at TIMESTAMP,                        -- 订单完成时间，用于统计和报表
  handover_at TIMESTAMP,                         -- 交接班时间，记录交接班操作的时间
  notes TEXT,                                    -- 订单备注信息，如特殊要求、客户反馈等
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

-- 订单项目表 - 订单中的具体服务项目
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,                         -- 自增主键
  order_id VARCHAR(50) NOT NULL,                 -- 所属订单ID，关联orders表
  service_id VARCHAR(50) NOT NULL,               -- 服务项目ID，关联service_items表
  service_name VARCHAR(100),                     -- 服务项目名称快照，即使服务被删除也能显示
  technician_id VARCHAR(50),                     -- 提供服务的技师ID，关联technicians表
  technician_name VARCHAR(100),                  -- 技师姓名快照，即使技师离职也能显示
  price DECIMAL(10,2) NOT NULL,                  -- 服务项目价格
  technician_commission DECIMAL(10,2) NOT NULL DEFAULT 0, -- 技师提成金额快照，用于计算技师收入
  salesperson_id VARCHAR(50),                    -- 销售员ID，关联salespeople表，可能为NULL
  salesperson_name VARCHAR(100),                 -- 销售员姓名快照
  salesperson_commission DECIMAL(10,2),          -- 销售员提成金额快照
  company_commission_rule_id VARCHAR(50),        -- 该服务项目使用的公司分成方案ID，关联company_commission_rules表
  company_commission_rule_name VARCHAR(100),     -- 公司分成方案名称快照
  company_commission_type VARCHAR(20),           -- 公司抽成类型快照：none、revenue、profit
  company_commission_rate DECIMAL(5,2),          -- 公司抽成比例快照
  company_commission_amount DECIMAL(10,2),       -- 公司抽成金额快照（结账时计算）
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间
  updated_at TIMESTAMP DEFAULT NOW(),            -- 记录最后更新时间
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES service_items(id) ON DELETE SET NULL,
  FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE SET NULL,
  FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE SET NULL,
  FOREIGN KEY (company_commission_rule_id) REFERENCES company_commission_rules(id) ON DELETE SET NULL
);

-- 创建更新时间触发器函数 - 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表创建更新时间触发器 - 确保每次更新时自动更新updated_at字段
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_service_items_updated_at BEFORE UPDATE ON service_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_salespeople_updated_at BEFORE UPDATE ON salespeople FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_company_commission_rules_updated_at BEFORE UPDATE ON company_commission_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_technician_services_updated_at BEFORE UPDATE ON technician_services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 创建订单相关索引
CREATE INDEX IF NOT EXISTS idx_orders_room_id ON orders(room_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_handover_status ON orders(handover_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_service_id ON order_items(service_id);
CREATE INDEX IF NOT EXISTS idx_order_items_technician_id ON order_items(technician_id); 