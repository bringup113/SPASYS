const express = require('express');
const router = express.Router();

// 获取所有技师
router.get('/technicians', async (req, res) => {
  try {
    const result = await global.pool.query(`
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
      GROUP BY t.id
      ORDER BY t.created_at ASC
    `);
    
    const technicians = result.rows.map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      countryId: row.country_id,
      hireDate: row.hire_date.toISOString().split('T')[0],
      status: row.status,
      services: row.services || []
    }));
    
    res.json(technicians);
  } catch (error) {
    console.error('获取技师列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取单个技师
router.get('/technicians/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await global.pool.query(`
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
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '技师不存在' });
    }
    
    const technician = result.rows[0];
    res.json({
      id: technician.id,
      employeeId: technician.employee_id,
      countryId: technician.country_id,
      hireDate: technician.hire_date.toISOString().split('T')[0],
      status: technician.status,
      services: technician.services || []
    });
  } catch (error) {
    console.error('获取技师详情失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建技师
router.post('/technicians', async (req, res) => {
  try {
    const { employeeId, countryId, hireDate, companyCommissionRuleId, services = [] } = req.body;
    
    console.log('🔍 后端收到技师创建请求:', {
      employeeId,
      countryId,
      hireDate,
      companyCommissionRuleId,
      services,
      servicesLength: services.length
    });
    
    if (!employeeId || !countryId || !hireDate) {
      return res.status(400).json({ error: '工号、国籍和入职时间不能为空' });
    }
    
    // 检查工号是否已存在
    const existingResult = await global.pool.query('SELECT id FROM technicians WHERE employee_id = $1', [employeeId]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: '工号已存在' });
    }
    
    const technicianId = `tech-${Date.now()}`;
    
    // 开始事务
    const client = await global.pool.connect();
    try {
      await client.query('BEGIN');
      
      // 创建技师
      const result = await client.query(
        'INSERT INTO technicians (id, employee_id, country_id, hire_date) VALUES ($1, $2, $3, $4) RETURNING *',
        [technicianId, employeeId, countryId, hireDate]
      );
      
      const technician = result.rows[0];
      
      // 添加服务项目
      if (services && services.length > 0) {
        for (const service of services) {
          await client.query(
            'INSERT INTO technician_services (technician_id, service_id, price, commission, company_commission_rule_id) VALUES ($1, $2, $3, $4, $5)',
            [technicianId, service.serviceId, service.price, service.commission, service.companyCommissionRuleId || 'default-rule']
          );
        }
      }
      
      await client.query('COMMIT');
      
      // 获取完整的技师数据（包括服务项目）
      const fullResult = await global.pool.query(`
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
      
      const technicianData = {
        id: fullResult.rows[0].id,
        employeeId: fullResult.rows[0].employee_id,
        countryId: fullResult.rows[0].country_id,
        hireDate: fullResult.rows[0].hire_date.toISOString().split('T')[0],
        status: fullResult.rows[0].status,
        services: fullResult.rows[0].services || []
      };
      
      // 广播技师创建事件
      global.broadcastDataUpdate('technician-created', technicianData);
      
      res.status(201).json(technicianData);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('创建技师失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新技师
router.put('/technicians/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, countryId, hireDate, companyCommissionRuleId, services = [] } = req.body;
    
    // 检查工号是否已被其他技师使用
    if (employeeId) {
      const existingResult = await global.pool.query('SELECT id FROM technicians WHERE employee_id = $1 AND id != $2', [employeeId, id]);
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: '工号已被其他技师使用' });
      }
    }
    
    // 开始事务
    const client = await global.pool.connect();
    try {
      await client.query('BEGIN');
      
      // 更新技师基本信息
      const result = await client.query(
        'UPDATE technicians SET employee_id = $1, country_id = $2, hire_date = $3, status = $4 WHERE id = $5 RETURNING *',
        [employeeId, countryId, hireDate, req.body.status || 'available', id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '技师不存在' });
      }
      
      // 删除现有服务项目
      await client.query('DELETE FROM technician_services WHERE technician_id = $1', [id]);
      
      // 添加新的服务项目
      if (services && services.length > 0) {
        for (const service of services) {
          await client.query(
            'INSERT INTO technician_services (technician_id, service_id, price, commission, company_commission_rule_id) VALUES ($1, $2, $3, $4, $5)',
            [id, service.serviceId, service.price, service.commission, service.companyCommissionRuleId || 'default-rule']
          );
        }
      }
      
      await client.query('COMMIT');
      
      // 获取完整的技师数据（包括服务项目）
      const fullResult = await global.pool.query(`
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
      `, [id]);
      
      const technicianData = {
        id: fullResult.rows[0].id,
        employeeId: fullResult.rows[0].employee_id,
        countryId: fullResult.rows[0].country_id,
        hireDate: fullResult.rows[0].hire_date.toISOString().split('T')[0],
        status: fullResult.rows[0].status,
        services: fullResult.rows[0].services || []
      };
      
      // 广播技师更新事件
      global.broadcastDataUpdate('technician-updated', technicianData);
      
      res.json(technicianData);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('更新技师失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除技师
router.delete('/technicians/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查技师是否有进行中的订单
    const inProgressOrderResult = await global.pool.query(`
      SELECT COUNT(*) as count 
      FROM order_items oi 
      JOIN orders o ON oi.order_id = o.id 
      WHERE oi.technician_id = $1 AND o.status = 'in_progress'
    `, [id]);
    
    if (parseInt(inProgressOrderResult.rows[0].count) > 0) {
      return res.status(400).json({ error: '技师还有进行中订单，无法删除' });
    }
    
    const result = await global.pool.query('DELETE FROM technicians WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '技师不存在' });
    }
    
    // 广播技师删除事件
    global.broadcastDataUpdate('technician-deleted', { id });
    
    res.json({ message: '技师删除成功' });
  } catch (error) {
    console.error('删除技师失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新技师状态
router.patch('/technicians/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['available', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }
    
    const result = await global.pool.query(
      'UPDATE technicians SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '技师不存在' });
    }
    
    // 获取完整的技师数据（包括服务项目）
    const fullResult = await global.pool.query(`
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
    `, [id]);
    
    const technicianData = {
      id: fullResult.rows[0].id,
      employeeId: fullResult.rows[0].employee_id,
      countryId: fullResult.rows[0].country_id,
      hireDate: fullResult.rows[0].hire_date.toISOString().split('T')[0],
      status: fullResult.rows[0].status,
      services: fullResult.rows[0].services || []
    };
    
    // 广播技师状态更新事件
    global.broadcastDataUpdate('technician-status-updated', technicianData);
    
    res.json(technicianData);
  } catch (error) {
    console.error('更新技师状态失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取技师服务分配
router.get('/technicians/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await global.pool.query(`
      SELECT ts.*, si.name as service_name, ccr.name as company_commission_rule_name, ccr.commission_type, ccr.commission_rate
      FROM technician_services ts
      LEFT JOIN service_items si ON ts.service_id = si.id
      LEFT JOIN company_commission_rules ccr ON ts.company_commission_rule_id = ccr.id
      WHERE ts.technician_id = $1
      ORDER BY ts.created_at ASC
    `, [id]);
    
    const services = result.rows.map(row => ({
      serviceId: row.service_id,
      serviceName: row.service_name,
      price: parseFloat(row.price),
      commission: parseFloat(row.commission),
      companyCommissionRuleId: row.company_commission_rule_id,
      companyCommissionRuleName: row.company_commission_rule_name,
      companyCommissionType: row.commission_type,
      companyCommissionRate: parseFloat(row.commission_rate)
    }));
    
    res.json(services);
  } catch (error) {
    console.error('获取技师服务分配失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新技师服务分配
router.put('/technicians/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const { services } = req.body;
    
    if (!Array.isArray(services)) {
      return res.status(400).json({ error: '服务分配必须是数组' });
    }
    
    // 开始事务
    const client = await global.pool.connect();
    try {
      await client.query('BEGIN');
      
      // 删除现有服务分配
      await client.query('DELETE FROM technician_services WHERE technician_id = $1', [id]);
      
      // 添加新的服务分配
      for (const service of services) {
        await client.query(`
          INSERT INTO technician_services (technician_id, service_id, price, commission, company_commission_rule_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [id, service.serviceId, service.price, service.commission, service.companyCommissionRuleId || 'default-rule']);
      }
      
      await client.query('COMMIT');
      
      // 返回更新后的服务分配
      const result = await global.pool.query(`
        SELECT ts.*, si.name as service_name, ccr.name as company_commission_rule_name, ccr.commission_type, ccr.commission_rate
        FROM technician_services ts
        LEFT JOIN service_items si ON ts.service_id = si.id
        LEFT JOIN company_commission_rules ccr ON ts.company_commission_rule_id = ccr.id
        WHERE ts.technician_id = $1
        ORDER BY ts.created_at ASC
      `, [id]);
      
      const updatedServices = result.rows.map(row => ({
        serviceId: row.service_id,
        serviceName: row.service_name,
        price: parseFloat(row.price),
        commission: parseFloat(row.commission),
        companyCommissionRuleId: row.company_commission_rule_id,
        companyCommissionRuleName: row.company_commission_rule_name,
        companyCommissionType: row.commission_type,
        companyCommissionRate: parseFloat(row.commission_rate)
      }));
      
      res.json(updatedServices);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('更新技师服务分配失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
