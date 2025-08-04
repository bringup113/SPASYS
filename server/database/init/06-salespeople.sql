-- SPA系统数据库初始化脚本
-- 销售员管理表结构 - 销售员信息和抽成设置

-- 创建销售员表（匹配前端期望的字段）
CREATE TABLE IF NOT EXISTS salespeople (
  id VARCHAR(50) PRIMARY KEY,                    -- 销售员唯一标识符，格式：sales-时间戳
  name VARCHAR(100) NOT NULL,                    -- 销售员姓名，用于显示和识别
  commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('fixed', 'percentage')), -- 抽成类型：fixed(固定金额)、percentage(百分比)
  commission_rate DECIMAL(10,2) NOT NULL,        -- 抽成金额或比例，根据commission_type确定含义
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间，用于统计和审计
  updated_at TIMESTAMP DEFAULT NOW()             -- 记录最后更新时间，用于数据同步
);

-- 创建索引 - 优化查询性能
CREATE INDEX IF NOT EXISTS idx_salespeople_name ON salespeople(name);                    -- 按销售员姓名查询的索引
CREATE INDEX IF NOT EXISTS idx_salespeople_commission_type ON salespeople(commission_type); -- 按抽成类型查询的索引
CREATE INDEX IF NOT EXISTS idx_salespeople_created_at ON salespeople(created_at);        -- 按创建时间查询的索引

-- 创建更新时间触发器 - 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_salespeople_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为销售员表创建更新时间触发器
CREATE TRIGGER update_salespeople_updated_at 
    BEFORE UPDATE ON salespeople 
    FOR EACH ROW 
    EXECUTE FUNCTION update_salespeople_updated_at(); 