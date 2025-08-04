-- SPA系统数据库初始化脚本
-- 基础设置表结构 - 系统业务配置信息

-- 业务设置表 - 存储系统的基础配置信息
CREATE TABLE IF NOT EXISTS business_settings (
  id VARCHAR(50) PRIMARY KEY,                    -- 设置记录唯一标识符，通常只有一个记录
  business_hours JSONB NOT NULL,                 -- 营业时间配置，JSON格式存储，如{"monday": {"start": "09:00", "end": "22:00"}}
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Shanghai', -- 系统时区设置，影响时间显示和计算
  base_currency_name VARCHAR(50) NOT NULL DEFAULT '泰铢', -- 基础货币名称，用于显示和报表
  base_currency_code VARCHAR(10) NOT NULL DEFAULT 'THB', -- 基础货币代码，ISO标准，如THB、CNY、USD
  base_currency_symbol VARCHAR(10) NOT NULL DEFAULT '฿', -- 基础货币符号，用于价格显示
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间，用于审计
  updated_at TIMESTAMP DEFAULT NOW()             -- 记录最后更新时间，用于数据同步
);

-- 创建索引 - 优化查询性能
CREATE INDEX IF NOT EXISTS idx_business_settings_id ON business_settings(id);           -- 按ID查询的索引
CREATE INDEX IF NOT EXISTS idx_business_settings_updated_at ON business_settings(updated_at); -- 按更新时间查询的索引

-- 创建更新时间触发器 - 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_business_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为业务设置表创建更新时间触发器
CREATE TRIGGER update_business_settings_updated_at
  BEFORE UPDATE ON business_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_business_settings_updated_at(); 