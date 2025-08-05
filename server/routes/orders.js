const express = require('express');
const router = express.Router();

// 获取所有订单
router.get('/orders', async (req, res) => {
  try {
    const result = await global.pool.query(`
      SELECT o.*, 
             json_agg(
               json_build_object(
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
                 'companyCommissionAmount', oi.company_commission_amount
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
                 'companyCommissionAmount', oi.company_commission_amount
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
    
    // 生成订单号：当前日期+3位序号
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    
    // 获取当天的订单数量作为序号
    const today = `${year}${month}${day}`;
    const todayOrdersResult = await global.pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE',
      []
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
          total_amount, received_amount, discount_rate, handover_status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        orderId, roomId, roomName, customerName, customerPhone,
        totalAmount, receivedAmount, 1.0, 'pending', notes
      ]);
      
      // 创建订单项目（结账时才计算销售员提成）
      for (const item of items) {
        await client.query(`
          INSERT INTO order_items (
            order_id, service_id, service_name, technician_id, technician_name,
            price, technician_commission, salesperson_id, salesperson_name, salesperson_commission,
            company_commission_rule_id, company_commission_rule_name, company_commission_type, company_commission_rate,
            company_commission_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          orderId, item.serviceId, item.serviceName, item.technicianId, item.technicianName,
          item.price, item.technicianCommission, item.salespersonId, item.salespersonName, null,
          item.companyCommissionRuleId, item.companyCommissionRuleName, item.companyCommissionType, item.companyCommissionRate,
          item.companyCommissionAmount || 0
        ]);
      }
      
      await client.query('COMMIT');
      
      // 返回创建的订单
      const orderResult = await global.pool.query(`
        SELECT o.*, 
               json_agg(
                 json_build_object(
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
                   'companyCommissionAmount', oi.company_commission_amount
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
        items: order.items || [],
        totalAmount: parseFloat(order.total_amount),
        receivedAmount: order.received_amount ? parseFloat(order.received_amount) : undefined,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        completedAt: order.completed_at,
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
              company_commission_amount
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          `, [
            id, item.serviceId, item.serviceName, item.technicianId, item.technicianName,
            item.price, item.technicianCommission, item.salespersonId, item.salespersonName, item.salespersonCommission,
            item.companyCommissionRuleId, item.companyCommissionRuleName, item.companyCommissionType, item.companyCommissionRate,
            item.companyCommissionAmount || 0
          ]);
        }
      }
      
      await client.query('COMMIT');
      
      // 返回更新后的订单
      const orderResult = await global.pool.query(`
        SELECT o.*, 
               json_agg(
                 json_build_object(
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
                   'companyCommissionAmount', oi.company_commission_amount
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
                 'companyCommissionAmount', oi.company_commission_amount
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

// 结账API - 计算折扣率和销售员提成
router.post('/orders/:id/checkout', async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedAmount } = req.body;
    
    if (!receivedAmount) {
      return res.status(400).json({ error: '实收金额不能为空' });
    }
    
    // 检查订单是否存在
    const orderCheck = await global.pool.query('SELECT total_amount FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    const totalAmount = parseFloat(orderCheck.rows[0].total_amount);
    const discountRate = receivedAmount / totalAmount;
    
    // 开始事务
    const client = await global.pool.connect();
    try {
      await client.query('BEGIN');
      
      // 更新订单的实收金额和折扣率
      await client.query(
        'UPDATE orders SET received_amount = $1, discount_rate = $2, updated_at = NOW() WHERE id = $3',
        [receivedAmount, discountRate, id]
      );
      
      // 获取订单项目并重新计算销售员提成
      const orderItemsResult = await client.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [id]
      );
      
      for (const item of orderItemsResult.rows) {
        if (item.salesperson_id) {
          // 获取销售员信息
          const salespersonResult = await client.query(
            'SELECT commission_type, commission_rate FROM salespeople WHERE id = $1',
            [item.salesperson_id]
          );
          
          if (salespersonResult.rows.length > 0) {
            const salesperson = salespersonResult.rows[0];
            let salespersonCommission = 0;
            
            if (salesperson.commission_type === 'fixed') {
              // 固定提成
              salespersonCommission = parseFloat(salesperson.commission_rate);
            } else if (salesperson.commission_type === 'percentage') {
              // 比例提成需要乘以折扣率
              salespersonCommission = (item.price * parseFloat(salesperson.commission_rate) / 100) * discountRate;
            }
            
            // 获取销售员姓名
            const salespersonNameResult = await client.query(
              'SELECT name FROM salespeople WHERE id = $1',
              [item.salesperson_id]
            );
            const salespersonName = salespersonNameResult.rows.length > 0 ? salespersonNameResult.rows[0].name : null;
            
            // 更新订单项目的销售员提成和姓名快照
            await client.query(
              'UPDATE order_items SET salesperson_commission = $1, salesperson_name = $2 WHERE id = $3',
              [salespersonCommission, salespersonName, item.id]
            );
          }
        }
      }
      
      await client.query('COMMIT');
      
      // 返回更新后的完整订单信息
      const orderResult = await global.pool.query(`
        SELECT o.*, 
               json_agg(
                 json_build_object(
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
                   'companyCommissionAmount', oi.company_commission_amount
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
      
      // 广播订单结账事件
      global.broadcastDataUpdate('order-checkout', orderData);
      
      res.json(orderData);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('订单结账失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除订单
router.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await global.pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    // 广播订单删除事件
    global.broadcastDataUpdate('order-deleted', { id });
    
    res.json({ message: '订单删除成功' });
  } catch (error) {
    console.error('删除订单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
