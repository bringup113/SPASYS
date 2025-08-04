-- 国家管理表 - 技师国籍信息管理
CREATE TABLE IF NOT EXISTS countries (
    id VARCHAR(50) PRIMARY KEY,                   -- 国家唯一标识符，格式：country-时间戳
    name VARCHAR(100) NOT NULL,                   -- 国家名称，如"中国"、"泰国"、"越南"、"菲律宾"
    remark TEXT,                                  -- 备注信息，如特殊要求、签证政策、语言要求等
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 记录创建时间，用于统计和审计
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 记录最后更新时间，用于数据同步
);

-- 创建更新时间触发器 - 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_countries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为国家表创建更新时间触发器
CREATE TRIGGER update_countries_updated_at
    BEFORE UPDATE ON countries
    FOR EACH ROW
    EXECUTE FUNCTION update_countries_updated_at();

-- 创建索引 - 优化查询性能
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name);        -- 按国家名称查询的索引
CREATE INDEX IF NOT EXISTS idx_countries_created_at ON countries(created_at); -- 按创建时间查询的索引 