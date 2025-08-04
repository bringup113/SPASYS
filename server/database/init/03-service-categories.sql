-- SPA系统数据库初始化脚本
-- 服务分类管理表结构 - 对服务项目进行分类管理

-- 创建服务分类表（匹配前端期望的字段）
CREATE TABLE IF NOT EXISTS service_categories (
  id VARCHAR(50) PRIMARY KEY,                    -- 分类唯一标识符，格式：category-时间戳
  name VARCHAR(100) NOT NULL,                    -- 分类名称，如"按摩"、"美容"、"护理"、"SPA"
  description TEXT,                              -- 分类描述信息，如分类说明、适用人群等
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间，用于统计和审计
  updated_at TIMESTAMP DEFAULT NOW()             -- 记录最后更新时间，用于数据同步
);

-- 创建索引 - 优化查询性能
CREATE INDEX IF NOT EXISTS idx_service_categories_name ON service_categories(name);        -- 按分类名称查询的索引
CREATE INDEX IF NOT EXISTS idx_service_categories_created_at ON service_categories(created_at); -- 按创建时间查询的索引

-- 创建更新时间触发器 - 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为服务分类表创建更新时间触发器
CREATE TRIGGER update_service_categories_updated_at 
    BEFORE UPDATE ON service_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_service_categories_updated_at(); 