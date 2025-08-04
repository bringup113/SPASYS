-- 房间管理表结构
-- 创建时间: 2025-08-03

-- 创建房间表 - 存储所有房间信息，包括临时房间和永久房间
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(50) PRIMARY KEY,                    -- 房间唯一标识符，格式：room-时间戳
  name VARCHAR(100) NOT NULL,                    -- 房间名称，如"VIP1"、"普通房1"、"临时房"
  status VARCHAR(20) NOT NULL DEFAULT 'available', -- 房间状态：available(可用)、occupied(占用)、maintenance(维护)
  description TEXT,                              -- 房间描述信息，如位置、设施、特殊要求等
  is_temporary BOOLEAN DEFAULT FALSE,            -- 是否为临时房间，临时房间会在服务完成后自动删除
  expires_at TIMESTAMP,                          -- 临时房间的过期时间，到期后自动清理
  created_at TIMESTAMP DEFAULT NOW(),            -- 记录创建时间，用于统计和审计
  updated_at TIMESTAMP DEFAULT NOW()             -- 记录最后更新时间，用于数据同步
);

-- 创建索引 - 优化查询性能
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);        -- 按状态查询房间的索引
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at); -- 按创建时间查询的索引

-- 创建更新时间触发器 - 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为房间表创建更新时间触发器
CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON rooms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 