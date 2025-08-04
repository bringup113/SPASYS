-- SPA系统数据库初始化脚本
-- 公司分成方案管理表结构 - 公司对不同项目的抽成规则

-- 创建公司分成方案表
CREATE TABLE IF NOT EXISTS company_commission_rules (
  id VARCHAR(50) PRIMARY KEY,                    -- 方案唯一标识符，格式：rule-时间戳
  name VARCHAR(100) NOT NULL,                    -- 方案名称，如"标准方案"、"VIP方案"、"新技师方案"
  commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('none', 'revenue', 'profit')), -- 抽成类型：none(不抽成)、revenue(销售额抽成)、profit(利润抽成)
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0, -- 抽成比例，0-100之间的数值，如15.50表示15.5%
  description TEXT,                              -- 方案详细描述，如适用条件、特殊说明等
  is_default BOOLEAN DEFAULT FALSE,              -- 是否为默认方案，新技师默认使用此方案
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间，用于统计和审计
  updated_at TIMESTAMP DEFAULT NOW()             -- 记录最后更新时间，用于数据同步
);

-- 创建索引 - 优化查询性能
CREATE INDEX IF NOT EXISTS idx_company_commission_rules_name ON company_commission_rules(name);        -- 按方案名称查询的索引
CREATE INDEX IF NOT EXISTS idx_company_commission_rules_type ON company_commission_rules(commission_type); -- 按抽成类型查询的索引
CREATE INDEX IF NOT EXISTS idx_company_commission_rules_is_default ON company_commission_rules(is_default); -- 按默认方案查询的索引
CREATE INDEX IF NOT EXISTS idx_company_commission_rules_created_at ON company_commission_rules(created_at); -- 按创建时间查询的索引

-- 创建更新时间触发器 - 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为公司分成方案表创建更新时间触发器
CREATE TRIGGER update_company_commission_rules_updated_at 
    BEFORE UPDATE ON company_commission_rules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

 