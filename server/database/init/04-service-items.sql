-- SPA系统数据库初始化脚本
-- 服务项目管理表结构 - 具体的服务项目信息

-- 创建服务项目表（匹配前端期望的字段）
CREATE TABLE IF NOT EXISTS service_items (
  id VARCHAR(50) PRIMARY KEY,                    -- 服务项目唯一标识符，格式：service-时间戳
  name VARCHAR(100) NOT NULL,                    -- 服务项目名称，如"全身按摩"、"面部护理"、"足疗"
  duration INTEGER NOT NULL,                     -- 服务时长（分钟），用于计算技师工作时间和客户预约
  category_id VARCHAR(50) NOT NULL,              -- 所属分类ID，关联service_categories表
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间，用于统计和审计
  updated_at TIMESTAMP DEFAULT NOW(),            -- 记录最后更新时间，用于数据同步
  
  -- 外键约束 - 确保服务项目必须属于某个分类
  CONSTRAINT fk_service_items_category 
    FOREIGN KEY (category_id) 
    REFERENCES service_categories(id) 
    ON DELETE CASCADE
);

-- 创建索引 - 优化查询性能
CREATE INDEX IF NOT EXISTS idx_service_items_name ON service_items(name);              -- 按服务名称查询的索引
CREATE INDEX IF NOT EXISTS idx_service_items_category_id ON service_items(category_id); -- 按分类查询的索引
CREATE INDEX IF NOT EXISTS idx_service_items_duration ON service_items(duration);      -- 按服务时长查询的索引
CREATE INDEX IF NOT EXISTS idx_service_items_created_at ON service_items(created_at);  -- 按创建时间查询的索引

-- 创建更新时间触发器 - 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_service_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为服务项目表创建更新时间触发器
CREATE TRIGGER update_service_items_updated_at 
    BEFORE UPDATE ON service_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_service_items_updated_at(); 