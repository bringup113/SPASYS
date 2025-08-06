-- 默认数据插入脚本
-- 这个脚本在所有表结构创建完成后执行，插入必要的默认数据
-- 用于系统初始化时提供基础数据，确保系统可以正常运行

-- 插入默认公司分成方案 - 系统必须有一个默认方案供新技师使用
-- 只在表完全为空时插入，并设置不同的创建时间以确保排序稳定
INSERT INTO company_commission_rules (id, name, commission_type, commission_rate, description, is_default, created_at) 
SELECT 'default-rule', '默认方案', 'profit', 20.00, '系统默认方案，不可删除', TRUE, NOW() - INTERVAL '16 seconds'
WHERE NOT EXISTS (SELECT 1 FROM company_commission_rules);

-- 确保基础设置存在（如果不存在则插入） - 系统基础配置信息
-- 只在表完全为空时插入，并设置不同的创建时间以确保排序稳定
INSERT INTO business_settings (id, business_hours, timezone, base_currency_name, base_currency_code, base_currency_symbol, created_at)
SELECT 'default-settings',
       '{"startTime": "00:00", "endTime": "23:59", "is24Hour": true, "crossDay": false, "newDayStartTime": "08:00"}'::jsonb, -- 24小时营业时间配置
       'Asia/Bangkok',                                                                                                          -- 泰国时区
       '泰铢',                                                                                                                   -- 基础货币名称
       'THB',                                                                                                                   -- 基础货币代码
       '฿',                                                                                                                      -- 基础货币符号
       NOW() - INTERVAL '15 seconds'                                                                                            -- 创建时间
WHERE NOT EXISTS (SELECT 1 FROM business_settings);

-- 插入默认国家数据 - 常见的技师国籍，用于技师管理
-- 只在表完全为空时插入，并设置不同的创建时间以确保排序稳定
INSERT INTO countries (id, name, remark, created_at) 
SELECT 'country-thailand', '泰国', '东南亚国家，本地技师', NOW() - INTERVAL '14 seconds'
WHERE NOT EXISTS (SELECT 1 FROM countries)
UNION ALL
SELECT 'country-vietnam', '越南', '东南亚国家，越南技师', NOW() - INTERVAL '13 seconds'
WHERE NOT EXISTS (SELECT 1 FROM countries)
UNION ALL
SELECT 'country-china', '中国', '东亚国家，中国技师', NOW() - INTERVAL '12 seconds'
WHERE NOT EXISTS (SELECT 1 FROM countries);

-- 插入默认房间数据 - 基础房间配置，用于订单管理
-- 只在表完全为空时插入，并设置不同的创建时间以确保排序稳定
INSERT INTO rooms (id, name, status, description, created_at) 
SELECT 'room-a', 'A', 'available', '房间A - 标准房间', NOW()
WHERE NOT EXISTS (SELECT 1 FROM rooms)
UNION ALL
SELECT 'room-b', 'B', 'available', '房间B - 标准房间', NOW() + INTERVAL '1 second'
WHERE NOT EXISTS (SELECT 1 FROM rooms)
UNION ALL
SELECT 'room-c', 'C', 'available', '房间C - 标准房间', NOW() + INTERVAL '2 seconds'
WHERE NOT EXISTS (SELECT 1 FROM rooms)
UNION ALL
SELECT 'room-d', 'D', 'available', '房间D - 标准房间', NOW() + INTERVAL '3 seconds'
WHERE NOT EXISTS (SELECT 1 FROM rooms)
UNION ALL
SELECT 'room-e', 'E', 'available', '房间E - 标准房间', NOW() + INTERVAL '4 seconds'
WHERE NOT EXISTS (SELECT 1 FROM rooms);

-- 插入默认服务分类数据 - 基础服务分类，用于服务项目管理
-- 只在表完全为空时插入，并设置不同的创建时间以确保排序稳定
INSERT INTO service_categories (id, name, created_at) 
SELECT 'category-massage', '按摩', NOW() - INTERVAL '11 seconds'
WHERE NOT EXISTS (SELECT 1 FROM service_categories)
UNION ALL
SELECT 'category-waterbed', '水床', NOW() - INTERVAL '10 seconds'
WHERE NOT EXISTS (SELECT 1 FROM service_categories)
UNION ALL
SELECT 'category-dragon', '抓龙筋', NOW() - INTERVAL '9 seconds'
WHERE NOT EXISTS (SELECT 1 FROM service_categories);

-- 插入默认服务项目数据 - 基础服务项目，用于技师服务分配
-- 只在表完全为空时插入，并设置不同的创建时间以确保排序稳定
INSERT INTO service_items (id, name, duration, category_id, created_at) 
SELECT 'service-massage-60', '按摩60分钟', 60, 'category-massage', NOW() - INTERVAL '8 seconds'
WHERE NOT EXISTS (SELECT 1 FROM service_items)
UNION ALL
SELECT 'service-massage-90', '按摩90分钟', 90, 'category-massage', NOW() - INTERVAL '7 seconds'
WHERE NOT EXISTS (SELECT 1 FROM service_items)
UNION ALL
SELECT 'service-waterbed-40', '水床40分钟', 40, 'category-waterbed', NOW() - INTERVAL '6 seconds'
WHERE NOT EXISTS (SELECT 1 FROM service_items)
UNION ALL
SELECT 'service-waterbed-90', '水床90分钟', 90, 'category-waterbed', NOW() - INTERVAL '5 seconds'
WHERE NOT EXISTS (SELECT 1 FROM service_items)
UNION ALL
SELECT 'service-dragon-60', '抓龙筋60分钟', 60, 'category-dragon', NOW() - INTERVAL '4 seconds'
WHERE NOT EXISTS (SELECT 1 FROM service_items)
UNION ALL
SELECT 'service-dragon-90', '抓龙筋90分钟', 90, 'category-dragon', NOW() - INTERVAL '3 seconds'
WHERE NOT EXISTS (SELECT 1 FROM service_items);

-- 插入默认销售员数据 - 基础销售员信息，用于订单提成计算
-- 只在表完全为空时插入，并设置不同的创建时间以确保排序稳定
INSERT INTO salespeople (id, name, commission_type, commission_rate, created_at) 
SELECT 'salesperson-afeng', '阿丰', 'percentage', 10.00, NOW() - INTERVAL '2 seconds'
WHERE NOT EXISTS (SELECT 1 FROM salespeople)
UNION ALL
SELECT 'salesperson-lucy', 'lucy', 'fixed', 300.00, NOW() - INTERVAL '1 second'
WHERE NOT EXISTS (SELECT 1 FROM salespeople); 