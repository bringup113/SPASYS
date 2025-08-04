-- SPA系统数据库初始化脚本
-- 技师管理表结构 - 技师基本信息和状态管理

-- 创建技师表（匹配前端期望的字段）
CREATE TABLE IF NOT EXISTS technicians (
  id VARCHAR(50) PRIMARY KEY,                    -- 技师唯一标识符，格式：tech-时间戳
  employee_id VARCHAR(50) NOT NULL UNIQUE,       -- 技师工号，唯一标识，如"T001"、"T002"
  country_id VARCHAR(50) NOT NULL,               -- 国籍ID，关联countries表，用于统计和管理
  hire_date DATE NOT NULL,                       -- 入职日期，用于计算工龄、福利和统计
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')), -- 技师状态：available(可用)、busy(忙碌)、offline(离线)
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间，用于统计和审计
  updated_at TIMESTAMP DEFAULT NOW(),            -- 记录最后更新时间，用于数据同步
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE RESTRICT -- 外键约束，防止删除有技师的国家
);

-- 创建技师服务分配表（存储技师的服务项目） - 技师可提供的服务项目及价格设置
CREATE TABLE IF NOT EXISTS technician_services (
  id SERIAL PRIMARY KEY,                         -- 自增主键
  technician_id VARCHAR(50) NOT NULL,            -- 技师ID，关联technicians表
  service_id VARCHAR(50) NOT NULL,               -- 服务项目ID，关联service_items表
  price DECIMAL(10,2) NOT NULL,                 -- 该技师提供此服务的价格，可能因技师等级不同而不同
  commission DECIMAL(10,2) NOT NULL DEFAULT 0,   -- 技师提成金额，从服务价格中扣除
  company_commission_rule_id VARCHAR(50) DEFAULT 'default-rule', -- 该技师此服务使用的公司分成方案ID，关联company_commission_rules表
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间，用于统计和审计
  updated_at TIMESTAMP DEFAULT NOW(),            -- 记录最后更新时间，用于数据同步
  FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE, -- 外键约束，技师删除时级联删除服务分配
  FOREIGN KEY (service_id) REFERENCES service_items(id) ON DELETE CASCADE, -- 外键约束，服务删除时级联删除分配记录
  FOREIGN KEY (company_commission_rule_id) REFERENCES company_commission_rules(id) ON DELETE RESTRICT, -- 外键约束，防止删除有技师使用的分成方案
  UNIQUE(technician_id, service_id)              -- 唯一约束，确保每个技师对每个服务项目只有一条记录
);

-- 创建索引 - 优化查询性能
CREATE INDEX IF NOT EXISTS idx_technicians_employee_id ON technicians(employee_id);     -- 按工号查询的索引
CREATE INDEX IF NOT EXISTS idx_technicians_status ON technicians(status);               -- 按状态查询的索引
CREATE INDEX IF NOT EXISTS idx_technicians_country_id ON technicians(country_id);       -- 按国籍查询的索引
CREATE INDEX IF NOT EXISTS idx_technicians_created_at ON technicians(created_at);       -- 按创建时间查询的索引

CREATE INDEX IF NOT EXISTS idx_technician_services_technician_id ON technician_services(technician_id); -- 按技师ID查询服务分配的索引
CREATE INDEX IF NOT EXISTS idx_technician_services_service_id ON technician_services(service_id);       -- 按服务ID查询分配的索引
CREATE INDEX IF NOT EXISTS idx_technician_services_company_commission_rule_id ON technician_services(company_commission_rule_id); -- 按公司分成方案查询的索引

-- 创建更新时间触发器 - 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_technicians_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为技师表创建更新时间触发器
CREATE TRIGGER update_technicians_updated_at 
    BEFORE UPDATE ON technicians 
    FOR EACH ROW 
    EXECUTE FUNCTION update_technicians_updated_at();

-- 为技师服务分配表创建更新时间触发器
CREATE OR REPLACE FUNCTION update_technician_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为技师服务分配表创建更新时间触发器
CREATE TRIGGER update_technician_services_updated_at 
    BEFORE UPDATE ON technician_services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_technician_services_updated_at(); 