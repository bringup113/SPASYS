-- 查询订单基本信息
SELECT 
    id, 
    total_amount, 
    received_amount, 
    status,
    created_at
FROM orders 
WHERE id = '20250804155635001';

-- 查询订单项目详细信息
SELECT 
    oi.order_id,
    oi.service_id,
    oi.service_name,
    oi.price,
    oi.technician_id,
    oi.technician_name,
    oi.technician_commission,
    oi.salesperson_id,
    oi.salesperson_name,
    oi.salesperson_commission,
    oi.company_commission_amount,
    oi.company_commission_rule_id
FROM order_items oi 
WHERE oi.order_id = '20250804155635001';

-- 查询所有订单的ID
SELECT id FROM orders ORDER BY created_at DESC LIMIT 10;

-- 查询所有订单项目
SELECT 
    order_id,
    service_name,
    price,
    technician_commission,
    salesperson_commission,
    company_commission_amount
FROM order_items 
ORDER BY created_at DESC 
LIMIT 10; 