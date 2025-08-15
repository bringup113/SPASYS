const express = require('express');
const router = express.Router();

// 获取所有订单
router.get('/orders', async (req, res) => {
  try {
    const result = await global.pool.query(`
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'serviceId', oi.service_id,
                 'serviceName', oi.service_name,
                 'technicianId', oi.technician_id,
                 'technicianName', oi.technician_name,
                 'price', oi.price,
                 'technicianCommission', oi.technician_commission,
                 'salespersonId', oi.salesperson_id,
                 'salespersonName', oi.salesperson_name,
                 'salespersonCommission', oi.salesperson_commission,
                 'companyCommissionRuleId', oi.company_commission_rule_id,
                 'companyCommissionRuleName', oi.company_commission_rule_name,
                 'companyCommissionType', oi.company_commission_type,
                 'companyCommissionRate', oi.company_commission_rate,
                 'companyCommissionAmount', oi.company_commission_amount,
                 'status', oi.status,
                 'completedAt', oi.completed_at
               ) ORDER BY oi.id
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    
    const orders = result.rows.map(row => ({
      id: row.id,
      roomId: row.room_id,
      roomName: row.room_name,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      status: row.status,
      handoverStatus: row.handover_status,
      items: row.items || [],
      totalAmount: parseFloat(row.total_amount),
      receivedAmount: row.received_amount ? parseFloat(row.received_amount) : undefined,
      discountRate: row.discount_rate ? parseFloat(row.discount_rate) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
      handoverAt: row.handover_at,
      notes: row.notes
    }));
    
    res.json(orders);
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取单个订单
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await global.pool.query(`
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'serviceId', oi.service_id,
                 'serviceName', oi.service_name,
                 'technicianId', oi.technician_id,
                 'technicianName', oi.technician_name,
                 'price', oi.price,
                 'technicianCommission', oi.technician_commission,
                 'salespersonId', oi.salesperson_id,
                 'salespersonName', oi.salesperson_name,
                 'salespersonCommission', oi.salesperson_commission,
                 'companyCommissionRuleId', oi.company_commission_rule_id,
                 'companyCommissionRuleName', oi.company_commission_rule_name,
                 'companyCommissionType', oi.company_commission_type,
                 'companyCommissionRate', oi.company_commission_rate,
                 'companyCommissionAmount', oi.company_commission_amount,
                 'status', oi.status,
                 'completedAt', oi.completed_at
               ) ORDER BY oi.id
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    const order = result.rows[0];
    res.json({
      id: order.id,
      roomId: order.room_id,
      roomName: order.room_name,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      status: order.status,
      handoverStatus: order.handover_status,
      items: order.items || [],
      totalAmount: parseFloat(order.total_amount),
      receivedAmount: order.received_amount ? parseFloat(order.received_amount) : undefined,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      completedAt: order.completed_at,
      handoverAt: order.handover_at,
      notes: order.notes
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建订单
router.post('/orders', async (req, res) => {
  try {
    const {
      roomId,
      roomName,
      customerName,
      customerPhone,
      items,
      totalAmount,
      receivedAmount,
      notes
    } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ error: '房间ID不能为空' });
    }
    
    // 生成订单号：根据业务设置时区生成时间 + 业务日订单序号
    // 1. 获取业务设置
    const businessSettingsResult = await global.pool.query(
      'SELECT timezone, business_hours FROM business_settings WHERE id = $1',
      ['default-settings']
    );

    const timezone = businessSettingsResult.rows[0]?.timezone || 'Asia/Shanghai';
    const businessHours = businessSettingsResult.rows[0]?.business_hours || {};
    const newDayStartTime = businessHours.newDayStartTime || '08:00';

    // 2. 根据时区获取当前时间
    const now = new Date();
    
    // 根据基础设置中的时区转换时间
    // 这里需要根据实际设置的时区来计算偏移量
    // 暂时使用简单的时区映射，实际应该使用更准确的时区库
    let timezoneOffset = 0;
    
    if (timezone === 'Asia/Shanghai') {
      timezoneOffset = 8 * 60 * 60 * 1000; // UTC+8
    } else if (timezone === 'Asia/Bangkok') {
      timezoneOffset = 7 * 60 * 60 * 1000; // UTC+7
    } else if (timezone === 'UTC') {
      timezoneOffset = 0; // UTC
    } else if (timezone === 'America/New_York') {
      timezoneOffset = -5 * 60 * 60 * 1000; // UTC-5
    } else if (timezone === 'Europe/London') {
      timezoneOffset = 0; // UTC
    }
    
    const localTime = new Date(now.getTime() + timezoneOffset);

    // 3. 计算业务日
    const [startHour, startMinute] = newDayStartTime.split(':').map(Number);
    const currentHour = localTime.getHours();
    const currentMinute = localTime.getMinutes();

    let businessDate;
    if (currentHour > startHour || (currentHour === startHour && currentMinute >= startMinute)) {
      // 业务日 = 今天
      businessDate = new Date(localTime);
    } else {
      // 业务日 = 昨天
      businessDate = new Date(localTime);
      businessDate.setDate(businessDate.getDate() - 1);
    }

    // 4. 生成时间部分（使用转换后的本地时间）
    const year = localTime.getUTCFullYear().toString();
    const month = (localTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = localTime.getUTCDate().toString().padStart(2, '0');
    const hour = localTime.getUTCHours().toString().padStart(2, '0');
    const minute = localTime.getUTCMinutes().toString().padStart(2, '0');
    const second = localTime.getUTCSeconds().toString().padStart(2, '0');

    // 5. 查询业务日期间的所有订单数量（包含所有状态）
    const businessDateStr = businessDate.toISOString().split('T')[0];
    const todayOrdersResult = await global.pool.query(
      `SELECT COUNT(*) as count FROM orders 
       WHERE DATE(created_at) = $1`,
      [businessDateStr]
    );
    const todayCount = parseInt(todayOrdersResult.rows[0].count);
    const sequence = (todayCount + 1).toString().padStart(3, '0');

    const orderId = `${year}${month}${day}${hour}${minute}${second}${sequence}`;
    
    // 开始事务
    const client = await global.pool.connect();
    try {
      await client.query('BEGIN');
      
      // 创建订单（结账时才有折扣率，创建时默认为1.0，交接班状态默认为pending）
      await client.query(`
        INSERT INTO orders (
          id, room_id, room_name, customer_name, customer_phone, 
          status, total_amount, received_amount, discount_rate, handover_status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        orderId, roomId, roomName, customerName, customerPhone,
        'in_progress', totalAmount, receivedAmount, 1.0, 'pending', notes
      ]);
      
      // 创建订单项目（结账时才计算销售员提成）
      for (const item of items) {
        await client.query(`
          INSERT INTO order_items (
            order_id, service_id, service_name, technician_id, technician_name,
            price, technician_commission, salesperson_id, salesperson_name, salesperson_commission,
            company_commission_rule_id, company_commission_rule_name, company_commission_type, company_commission_rate,
            company_commission_amount, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          orderId, item.serviceId, item.serviceName, item.technicianId, item.technicianName,
          item.price, item.technicianCommission, item.salespersonId, item.salespersonName, null,
          item.companyCommissionRuleId, item.companyCommissionRuleName, item.companyCommissionType, item.companyCommissionRate,
          item.companyCommissionAmount || 0, 'in_progress'
        ]);
      }
      
      await client.query('COMMIT');
      
      // 返回创建的订单
      const orderResult = await global.pool.query(`
        SELECT o.*, 
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'serviceId', oi.service_id,
                   'serviceName', oi.service_name,
                   'technicianId', oi.technician_id,
                   'technicianName', oi.technician_name,
                   'price', oi.price,
                   'technicianCommission', oi.technician_commission,
                   'salespersonId', oi.salesperson_id,
                   'salespersonName', oi.salesperson_name,
                   'salespersonCommission', oi.salesperson_commission,
                   'companyCommissionRuleId', oi.company_commission_rule_id,
                   'companyCommissionRuleName', oi.company_commission_rule_name,
                   'companyCommissionType', oi.company_commission_type,
                   'companyCommissionRate', oi.company_commission_rate,
                   'companyCommissionAmount', oi.company_commission_amount,
                   'status', oi.status,
                   'completedAt', oi.completed_at
                 ) ORDER BY oi.id
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id
      `, [orderId]);
      
      const order = orderResult.rows[0];
      const orderData = {
        id: order.id,
        roomId: order.room_id,
        roomName: order.room_name,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        status: order.status,
        handoverStatus: order.handover_status,
        items: order.items || [],
        totalAmount: parseFloat(order.total_amount),
        receivedAmount: order.received_amount ? parseFloat(order.received_amount) : undefined,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        completedAt: order.completed_at,
        handoverAt: order.handover_at,
        notes: order.notes
      };
      
      // 广播订单创建事件
      global.broadcastDataUpdate('order-created', orderData);
      
      res.json(orderData);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新订单
router.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      roomId,
      roomName,
      customerName,
      customerPhone,
      status,
      handoverStatus,
      handoverAt,
      totalAmount,
      receivedAmount,
      items,
      notes,
      completedAt
    } = req.body;
    
    // 开始事务
    const client = await global.pool.connect();
    try {
      await client.query('BEGIN');
      
      // 构建动态更新查询
      let updateFields = [];
      let values = [];
      let paramIndex = 1;

      if (roomId !== undefined) {
        updateFields.push(`room_id = $${paramIndex++}`);
        values.push(roomId);
      }
      if (roomName !== undefined) {
        updateFields.push(`room_name = $${paramIndex++}`);
        values.push(roomName);
      }
      if (customerName !== undefined) {
        updateFields.push(`customer_name = $${paramIndex++}`);
        values.push(customerName);
      }
      if (customerPhone !== undefined) {
        updateFields.push(`customer_phone = $${paramIndex++}`);
        values.push(customerPhone);
      }
      if (status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (handoverStatus !== undefined) {
        updateFields.push(`handover_status = $${paramIndex++}`);
        values.push(handoverStatus);
      }
      if (handoverAt !== undefined) {
        updateFields.push(`handover_at = $${paramIndex++}`);
        values.push(handoverAt);
      }
      if (totalAmount !== undefined) {
        updateFields.push(`total_amount = $${paramIndex++}`);
        values.push(totalAmount);
      }
      if (receivedAmount !== undefined) {
        updateFields.push(`received_amount = $${paramIndex++}`);
        values.push(receivedAmount);
      }

      if (notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(notes);
      }
      if (completedAt !== undefined) {
        updateFields.push(`completed_at = $${paramIndex++}`);
        values.push(completedAt);
      }

      if (updateFields.length > 0) {
        values.push(id); // 添加WHERE条件的参数
        await client.query(
          `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }
      
      // 删除现有订单项目
      await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
      
      // 重新创建订单项目
      if (items && items.length > 0) {
        for (const item of items) {
          await client.query(`
            INSERT INTO order_items (
              order_id, service_id, service_name, technician_id, technician_name,
              price, technician_commission, salesperson_id, salesperson_name, salesperson_commission,
              company_commission_rule_id, company_commission_rule_name, company_commission_type, company_commission_rate,
              company_commission_amount, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          `, [
            id, item.serviceId, item.serviceName, item.technicianId, item.technicianName,
            item.price, item.technicianCommission, item.salespersonId, item.salespersonName, item.salespersonCommission,
            item.companyCommissionRuleId, item.companyCommissionRuleName, item.companyCommissionType, item.companyCommissionRate,
            item.companyCommissionAmount || 0, item.status || 'in_progress'
          ]);
        }
      }
      
      await client.query('COMMIT');
      
      // 返回更新后的订单
      const orderResult = await global.pool.query(`
        SELECT o.*, 
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'serviceId', oi.service_id,
                   'serviceName', oi.service_name,
                   'technicianId', oi.technician_id,
                   'technicianName', oi.technician_name,
                   'price', oi.price,
                   'technicianCommission', oi.technician_commission,
                   'salespersonId', oi.salesperson_id,
                   'salespersonName', oi.salesperson_name,
                   'salespersonCommission', oi.salesperson_commission,
                   'companyCommissionRuleId', oi.company_commission_rule_id,
                   'companyCommissionRuleName', oi.company_commission_rule_name,
                   'companyCommissionType', oi.company_commission_type,
                   'companyCommissionRate', oi.company_commission_rate,
                   'companyCommissionAmount', oi.company_commission_amount,
                   'status', oi.status,
                   'completedAt', oi.completed_at
                 ) ORDER BY oi.id
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id
      `, [id]);
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: '订单不存在' });
      }
      
      const order = orderResult.rows[0];
      const orderData = {
        id: order.id,
        roomId: order.room_id,
        roomName: order.room_name,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        status: order.status,
        handoverStatus: order.handover_status,
        items: order.items || [],
        totalAmount: parseFloat(order.total_amount),
        receivedAmount: order.received_amount ? parseFloat(order.received_amount) : undefined,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        completedAt: order.completed_at,
        handoverAt: order.handover_at,
        notes: order.notes
      };
      
      // 广播订单更新事件
      global.broadcastDataUpdate('order-updated', orderData);
      
      res.json(orderData);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('更新订单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新订单状态
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: '状态不能为空' });
    }
    
    // 检查订单是否存在
    const orderCheck = await global.pool.query('SELECT id FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    // 更新订单状态
    const result = await global.pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    // 获取更新后的完整订单信息
    const orderResult = await global.pool.query(`
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'serviceId', oi.service_id,
                 'serviceName', oi.service_name,
                 'technicianId', oi.technician_id,
                 'technicianName', oi.technician_name,
                 'price', oi.price,
                 'technicianCommission', oi.technician_commission,
                 'salespersonId', oi.salesperson_id,
                 'salespersonName', oi.salesperson_name,
                 'salespersonCommission', oi.salesperson_commission,
                 'companyCommissionRuleId', oi.company_commission_rule_id,
                 'companyCommissionRuleName', oi.company_commission_rule_name,
                 'companyCommissionType', oi.company_commission_type,
                 'companyCommissionRate', oi.company_commission_rate,
                 'companyCommissionAmount', oi.company_commission_amount,
                 'status', oi.status,
                 'completedAt', oi.completed_at
               ) ORDER BY oi.id
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);
    
    const order = orderResult.rows[0];
    const orderData = {
      id: order.id,
      roomId: order.room_id,
      roomName: order.room_name,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      status: order.status,
      handoverStatus: order.handover_status,
      items: order.items || [],
      totalAmount: parseFloat(order.total_amount),
      receivedAmount: order.received_amount ? parseFloat(order.received_amount) : undefined,
      discountRate: order.discount_rate ? parseFloat(order.discount_rate) : undefined,
      companyCommissionRuleId: order.company_commission_rule_id,
      companyCommissionRuleName: order.company_commission_rule_name,
      companyCommissionType: order.company_commission_type,
      companyCommissionRate: order.company_commission_rate ? parseFloat(order.company_commission_rate) : undefined,
      companyCommissionAmount: order.company_commission_amount ? parseFloat(order.company_commission_amount) : undefined,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      completedAt: order.completed_at,
      notes: order.notes
    };
    
    // 广播订单状态更新事件
    global.broadcastDataUpdate('order-status-updated', orderData);
    
    res.json(orderData);
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.status(500).json({ error: error.message });
  }
});



// 删除订单
router.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 开始事务
    const client = await global.pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. 获取订单信息，包括房间ID和技师信息
      const orderResult = await client.query(`
        SELECT o.*, 
               json_agg(
                 json_build_object(
                   'technicianId', oi.technician_id,
                   'status', oi.status
                 ) ORDER BY oi.id
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id
      `, [id]);
      
      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: '订单不存在' });
      }
      
      const order = orderResult.rows[0];
      const roomId = order.room_id;
      const items = order.items || [];
      
      // 2. 释放技师资源（将技师状态设为available）
      const technicianIds = items
        .map(item => item.technicianId)
        .filter(id => id) // 过滤掉null值
        .filter((id, index, arr) => arr.indexOf(id) === index); // 去重
      
      for (const technicianId of technicianIds) {
        // 检查该技师是否还有其他进行中的订单
        const otherOrdersResult = await client.query(`
          SELECT COUNT(*) as count 
          FROM orders o 
          JOIN order_items oi ON o.id = oi.order_id 
          WHERE oi.technician_id = $1 
          AND o.id != $2 
          AND o.status = 'in_progress'
        `, [technicianId, id]);
        
        const otherOrdersCount = parseInt(otherOrdersResult.rows[0].count);
        
        // 如果没有其他进行中的订单，则将技师状态设为available
        if (otherOrdersCount === 0) {
          await client.query(
            'UPDATE technicians SET status = $1 WHERE id = $2',
            ['available', technicianId]
          );
          
                      // 广播技师状态更新
            const technicianResult = await client.query(`
              SELECT t.*, 
                     COALESCE(
                       json_agg(
                         CASE 
                           WHEN ts.service_id IS NOT NULL THEN
                             json_build_object(
                               'serviceId', ts.service_id,
                               'price', ts.price,
                               'commission', ts.commission,
                               'companyCommissionRuleId', ts.company_commission_rule_id,
                               'companyCommissionRuleName', ccr.name,
                               'companyCommissionType', ccr.commission_type,
                               'companyCommissionRate', ccr.commission_rate
                             )
                           ELSE NULL
                         END
                       ) FILTER (WHERE ts.service_id IS NOT NULL),
                       '[]'::json
                     ) as services
              FROM technicians t
              LEFT JOIN technician_services ts ON t.id = ts.technician_id
              LEFT JOIN company_commission_rules ccr ON ts.company_commission_rule_id = ccr.id
              WHERE t.id = $1
              GROUP BY t.id
            `, [technicianId]);
            if (technicianResult.rows.length > 0) {
              const technicianData = {
                id: technicianResult.rows[0].id,
                employeeId: technicianResult.rows[0].employee_id,
                countryId: technicianResult.rows[0].country_id,
                hireDate: technicianResult.rows[0].hire_date,
                status: technicianResult.rows[0].status,
                services: technicianResult.rows[0].services || [],
                createdAt: technicianResult.rows[0].created_at,
                updatedAt: technicianResult.rows[0].updated_at
              };
              global.broadcastDataUpdate('technician-status-updated', technicianData);
            }
        }
      }
      
      // 3. 释放房间资源（将房间状态设为available）
      if (roomId) {
        // 检查该房间是否还有其他进行中的订单
        const otherRoomOrdersResult = await client.query(`
          SELECT COUNT(*) as count 
          FROM orders 
          WHERE room_id = $1 
          AND id != $2 
          AND status = 'in_progress'
        `, [roomId, id]);
        
        const otherRoomOrdersCount = parseInt(otherRoomOrdersResult.rows[0].count);
        
        // 如果没有其他进行中的订单，则将房间状态设为available
        if (otherRoomOrdersCount === 0) {
          await client.query(
            'UPDATE rooms SET status = $1 WHERE id = $2',
            ['available', roomId]
          );
          
                      // 广播房间状态更新
            const roomResult = await client.query(
              'SELECT * FROM rooms WHERE id = $1',
              [roomId]
            );
            if (roomResult.rows.length > 0) {
              const roomData = {
                id: roomResult.rows[0].id,
                name: roomResult.rows[0].name,
                status: roomResult.rows[0].status,
                description: roomResult.rows[0].description,
                isTemporary: roomResult.rows[0].is_temporary,
                expiresAt: roomResult.rows[0].expires_at,
                createdAt: roomResult.rows[0].created_at,
                updatedAt: roomResult.rows[0].updated_at
              };
              global.broadcastDataUpdate('room-updated', roomData);
            }
        }
      }
      
      // 4. 删除订单（会级联删除order_items）
      await client.query('DELETE FROM orders WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      
      // 广播订单删除事件
      global.broadcastDataUpdate('order-deleted', { id });
      
      res.json({ message: '订单删除成功' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('删除订单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 完成单个服务项目
router.patch('/orders/:orderId/items/:itemId/complete', async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    
    // 开始事务
    const client = await global.pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. 获取要完成的服务项目信息，包括技师ID
      const itemResult = await client.query(`
        SELECT technician_id FROM order_items 
        WHERE id = $1 AND order_id = $2
      `, [itemId, orderId]);
      
      if (itemResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: '服务项目不存在' });
      }
      
      const technicianId = itemResult.rows[0].technician_id;
      
      // 2. 更新服务项目状态为已完成
      const updateItemResult = await client.query(`
        UPDATE order_items 
        SET status = 'completed', completed_at = NOW() 
        WHERE id = $1 AND order_id = $2
        RETURNING *
      `, [itemId, orderId]);
      
      // 3. 检查订单是否所有项目都已完成
      const checkOrderResult = await client.query(`
        SELECT COUNT(*) as total, 
               COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM order_items 
        WHERE order_id = $1
      `, [orderId]);
      
      const { total, completed } = checkOrderResult.rows[0];
      
      // 4. 如果所有项目都完成，更新订单状态
      if (parseInt(total) === parseInt(completed)) {
        await client.query(`
          UPDATE orders 
          SET status = 'completed', completed_at = NOW() 
          WHERE id = $1
        `, [orderId]);
      }
      
      // 5. 直接释放技师状态为可用
      if (technicianId) {
        console.log(`技师 ${technicianId} 服务完成，准备更新状态为 available`);
        
        // 先查询技师当前状态
        const currentStatusResult = await client.query(
          'SELECT status FROM technicians WHERE id = $1',
          [technicianId]
        );
        
        if (currentStatusResult.rows.length > 0) {
          const currentStatus = currentStatusResult.rows[0].status;
          console.log(`技师 ${technicianId} 当前状态: ${currentStatus}`);
        }
        
        // 更新技师状态
        const updateResult = await client.query(
          'UPDATE technicians SET status = $1 WHERE id = $2 RETURNING *',
          ['available', technicianId]
        );
        
        if (updateResult.rows.length > 0) {
          console.log(`技师 ${technicianId} 状态更新成功，新状态: ${updateResult.rows[0].status}`);
        } else {
          console.log(`技师 ${technicianId} 状态更新失败，没有返回结果`);
        }
        
        // 广播技师状态更新
        const technicianResult = await client.query(`
          SELECT t.*, 
                 COALESCE(
                   json_agg(
                     CASE 
                       WHEN ts.service_id IS NOT NULL THEN
                         json_build_object(
                           'serviceId', ts.service_id,
                           'price', ts.price,
                           'commission', ts.commission,
                           'companyCommissionRuleId', ts.company_commission_rule_id,
                           'companyCommissionRuleName', ccr.name,
                           'companyCommissionType', ccr.commission_type,
                           'companyCommissionRate', ccr.commission_rate
                         )
                       ELSE NULL
                     END
                   ) FILTER (WHERE ts.service_id IS NOT NULL),
                   '[]'::json
                 ) as services
          FROM technicians t
          LEFT JOIN technician_services ts ON t.id = ts.technician_id
          LEFT JOIN company_commission_rules ccr ON ts.company_commission_rule_id = ccr.id
          WHERE t.id = $1
          GROUP BY t.id
        `, [technicianId]);
        
        if (technicianResult.rows.length > 0) {
          const technicianData = {
            id: technicianResult.rows[0].id,
            employeeId: technicianResult.rows[0].employee_id,
            countryId: technicianResult.rows[0].country_id,
            hireDate: technicianResult.rows[0].hire_date,
            status: technicianResult.rows[0].status,
            services: technicianResult.rows[0].services || [],
            createdAt: technicianResult.rows[0].created_at,
            updatedAt: technicianResult.rows[0].updated_at
          };
          global.broadcastDataUpdate('technician-status-updated', technicianData);
          console.log(`技师 ${technicianId} 状态更新广播已发送，广播状态: ${technicianData.status}`);
        } else {
          console.log(`技师 ${technicianId} 查询失败，无法发送广播`);
        }
      }
      
      // 6. 获取更新后的订单信息
      const orderResult = await client.query(`
        SELECT o.*, 
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'serviceId', oi.service_id,
                   'serviceName', oi.service_name,
                   'technicianId', oi.technician_id,
                   'technicianName', oi.technician_name,
                   'price', oi.price,
                   'technicianCommission', oi.technician_commission,
                   'salespersonId', oi.salesperson_id,
                   'salespersonName', oi.salesperson_name,
                   'salespersonCommission', oi.salesperson_commission,
                   'companyCommissionRuleId', oi.company_commission_rule_id,
                   'companyCommissionRuleName', oi.company_commission_rule_name,
                   'companyCommissionType', oi.company_commission_type,
                   'companyCommissionRate', oi.company_commission_rate,
                   'companyCommissionAmount', oi.company_commission_amount,
                   'status', oi.status,
                   'completedAt', oi.completed_at
                 ) ORDER BY oi.id
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id
      `, [orderId]);
      
      if (orderResult.rows.length > 0) {
        const order = orderResult.rows[0];
        const orderData = {
          id: order.id,
          roomId: order.room_id,
          roomName: order.room_name,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          status: order.status,
          handoverStatus: order.handover_status,
          items: order.items || [],
          totalAmount: parseFloat(order.total_amount),
          receivedAmount: order.received_amount ? parseFloat(order.received_amount) : undefined,
          discountRate: order.discount_rate ? parseFloat(order.discount_rate) : undefined,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          completedAt: order.completed_at,
          handoverAt: order.handover_at,
          notes: order.notes
        };
        
        // 广播订单更新事件
        global.broadcastDataUpdate('order-updated', orderData);
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        message: '服务项目完成成功',
        orderId,
        itemId,
        status: 'completed'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('完成服务项目失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
