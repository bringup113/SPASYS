-- 用户表 - 用于系统登录认证
-- 创建时间：2024年
-- 描述：存储系统用户账号信息，支持明文密码存储便于数据库直接修改

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- 明文存储密码
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- 插入默认管理员账号
-- 用户名：admin，密码：admin123
INSERT INTO users (id, username, password, name, created_at) 
SELECT 'admin-user', 'whspa', 'spa123123', '系统管理员', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- 添加注释
COMMENT ON TABLE users IS '系统用户表，存储登录账号信息';
COMMENT ON COLUMN users.id IS '用户唯一标识';
COMMENT ON COLUMN users.username IS '登录用户名';
COMMENT ON COLUMN users.password IS '登录密码（明文存储）';
COMMENT ON COLUMN users.name IS '用户显示名称';
COMMENT ON COLUMN users.is_active IS '账号是否激活';
COMMENT ON COLUMN users.last_login IS '最后登录时间';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间'; 