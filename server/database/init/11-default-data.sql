-- 默认数据插入脚本
-- 这个脚本在所有表结构创建完成后执行，插入必要的默认数据
-- 用于系统初始化时提供基础数据，确保系统可以正常运行

-- 插入默认公司分成方案 - 系统必须有一个默认方案供新技师使用
INSERT INTO company_commission_rules (id, name, commission_type, commission_rate, description, is_default) 
SELECT 'default-rule', '默认方案', 'profit', 20.00, '系统默认方案，不可删除', TRUE
WHERE NOT EXISTS (SELECT 1 FROM company_commission_rules WHERE id = 'default-rule');

-- 确保基础设置存在（如果不存在则插入） - 系统基础配置信息
INSERT INTO business_settings (id, business_hours, timezone, base_currency_name, base_currency_code, base_currency_symbol)
SELECT 'default-settings',
       '{"startTime": "00:00", "endTime": "23:59", "is24Hour": true, "crossDay": false, "newDayStartTime": "08:00"}'::jsonb, -- 24小时营业时间配置
       'Asia/Bangkok',                                                                                                          -- 泰国时区
       '泰铢',                                                                                                                   -- 基础货币名称
       'THB',                                                                                                                   -- 基础货币代码
       '฿'                                                                                                                      -- 基础货币符号
WHERE NOT EXISTS (SELECT 1 FROM business_settings WHERE id = 'default-settings');

-- 插入默认国家数据 - 常见的技师国籍，用于技师管理
INSERT INTO countries (id, name, remark) VALUES
('country-thailand', '泰国', '东南亚国家，本地技师'),
('country-vietnam', '越南', '东南亚国家，越南技师'),
('country-china', '中国', '东亚国家，中国技师')
ON CONFLICT (id) DO NOTHING;

-- 插入默认房间数据 - 基础房间配置，用于订单管理
INSERT INTO rooms (id, name, status, description) VALUES
('room-a', 'A', 'available', '房间A - 标准房间'),
('room-b', 'B', 'available', '房间B - 标准房间'),
('room-c', 'C', 'available', '房间C - 标准房间'),
('room-d', 'D', 'available', '房间D - 标准房间'),
('room-e', 'E', 'available', '房间E - 标准房间')
ON CONFLICT (id) DO NOTHING;

-- 插入默认服务分类数据 - 基础服务分类，用于服务项目管理
INSERT INTO service_categories (id, name) VALUES
('category-massage', '按摩'),     -- 按摩服务分类
('category-waterbed', '水床'),    -- 水床服务分类
('category-dragon', '抓龙筋')     -- 抓龙筋服务分类
ON CONFLICT (id) DO NOTHING;

-- 插入默认服务项目数据 - 基础服务项目，用于技师服务分配
INSERT INTO service_items (id, name, duration, category_id) VALUES
('service-massage-60', '按摩60分钟', 60, 'category-massage'),   -- 60分钟按摩服务
('service-massage-90', '按摩90分钟', 90, 'category-massage'),   -- 90分钟按摩服务
('service-waterbed-40', '水床40分钟', 40, 'category-waterbed'), -- 40分钟水床服务
('service-waterbed-90', '水床90分钟', 90, 'category-waterbed'), -- 90分钟水床服务
('service-dragon-60', '抓龙筋60分钟', 60, 'category-dragon'),   -- 60分钟抓龙筋服务
('service-dragon-90', '抓龙筋90分钟', 90, 'category-dragon')    -- 90分钟抓龙筋服务
ON CONFLICT (id) DO NOTHING;

-- 插入默认销售员数据 - 基础销售员信息，用于订单提成计算
INSERT INTO salespeople (id, name, commission_type, commission_rate) VALUES
('salesperson-afeng', '阿丰', 'percentage', 10.00), -- 阿丰，按百分比抽成10%
('salesperson-lucy', 'lucy', 'fixed', 300.00)      -- lucy，固定抽成300泰铢
ON CONFLICT (id) DO NOTHING; 