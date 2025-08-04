const express = require('express');
const router = express.Router();

// ==================== 销售员管理 ====================

// 获取所有销售员
router.get('/salespeople', async (req, res) => {
  try {
    const result = await global.pool.query('SELECT * FROM salespeople ORDER BY name');
    const salespeople = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      commissionType: row.commission_type,
      commissionRate: parseFloat(row.commission_rate),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(salespeople);
  } catch (error) {
    console.error('获取销售员列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建销售员
router.post('/salespeople', async (req, res) => {
  try {
    const { name, commissionType, commissionRate } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '销售员姓名不能为空' });
    }

    const result = await global.pool.query(
      'INSERT INTO salespeople (id, name, commission_type, commission_rate) VALUES ($1, $2, $3, $4) RETURNING *',
      [`sales-${Date.now()}`, name, commissionType || 'fixed', commissionRate || 0]
    );

    const salesperson = result.rows[0];
    const salespersonData = {
      id: salesperson.id,
      name: salesperson.name,
      commissionType: salesperson.commission_type,
      commissionRate: parseFloat(salesperson.commission_rate),
      createdAt: salesperson.created_at,
      updatedAt: salesperson.updated_at
    };
    
    // 广播销售员创建事件
    global.broadcastDataUpdate('salesperson-created', salespersonData);
    
    res.status(201).json(salespersonData);
  } catch (error) {
    console.error('创建销售员失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新销售员
router.put('/salespeople/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, commissionType, commissionRate } = req.body;

    const result = await global.pool.query(
      'UPDATE salespeople SET name = $1, commission_type = $2, commission_rate = $3 WHERE id = $4 RETURNING *',
      [name, commissionType, commissionRate, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '销售员不存在' });
    }

    const salesperson = result.rows[0];
    const salespersonData = {
      id: salesperson.id,
      name: salesperson.name,
      commissionType: salesperson.commission_type,
      commissionRate: parseFloat(salesperson.commission_rate),
      createdAt: salesperson.created_at,
      updatedAt: salesperson.updated_at
    };
    
    // 广播销售员更新事件
    global.broadcastDataUpdate('salesperson-updated', salespersonData);
    
    res.json(salespersonData);
  } catch (error) {
    console.error('更新销售员失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除销售员
router.delete('/salespeople/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查销售员是否有关联的订单
    const orderResult = await global.pool.query('SELECT COUNT(*) as count FROM order_items WHERE salesperson_id = $1', [id]);
    if (parseInt(orderResult.rows[0].count) > 0) {
      return res.status(400).json({ error: '销售员有关联的订单，无法删除' });
    }

    const result = await global.pool.query('DELETE FROM salespeople WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '销售员不存在' });
    }
    
    // 广播销售员删除事件
    global.broadcastDataUpdate('salesperson-deleted', { id });
    
    res.json({ message: '销售员删除成功' });
  } catch (error) {
    console.error('删除销售员失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 国家管理 ====================

// 获取所有国家
router.get('/countries', async (req, res) => {
  try {
    const result = await global.pool.query('SELECT * FROM countries ORDER BY name');
    const countries = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      remark: row.remark,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(countries);
  } catch (error) {
    console.error('获取国家列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建国家
router.post('/countries', async (req, res) => {
  try {
    const { name, remark } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '国家名称不能为空' });
    }

    const result = await global.pool.query(
      'INSERT INTO countries (id, name, remark) VALUES ($1, $2, $3) RETURNING *',
      [`country-${Date.now()}`, name, remark || null]
    );

    const country = result.rows[0];
    const countryData = {
      id: country.id,
      name: country.name,
      remark: country.remark,
      createdAt: country.created_at,
      updatedAt: country.updated_at
    };
    
    // 广播国家创建事件
    global.broadcastDataUpdate('country-created', countryData);
    
    res.status(201).json(countryData);
  } catch (error) {
    console.error('创建国家失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新国家
router.put('/countries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, remark } = req.body;

    const result = await global.pool.query(
      'UPDATE countries SET name = $1, remark = $2 WHERE id = $3 RETURNING *',
      [name, remark, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '国家不存在' });
    }

    const country = result.rows[0];
    const countryData = {
      id: country.id,
      name: country.name,
      remark: country.remark,
      createdAt: country.created_at,
      updatedAt: country.updated_at
    };
    
    // 广播国家更新事件
    global.broadcastDataUpdate('country-updated', countryData);
    
    res.json(countryData);
  } catch (error) {
    console.error('更新国家失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除国家
router.delete('/countries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查国家是否有关联的技师
    const technicianResult = await global.pool.query('SELECT COUNT(*) as count FROM technicians WHERE country_id = $1', [id]);
    if (parseInt(technicianResult.rows[0].count) > 0) {
      return res.status(400).json({ error: '国家有关联的技师，无法删除' });
    }

    const result = await global.pool.query('DELETE FROM countries WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '国家不存在' });
    }

    res.json({ message: '国家删除成功' });
  } catch (error) {
    console.error('删除国家失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 公司分成方案管理 ====================

// 获取所有公司分成方案
router.get('/company-commission-rules', async (req, res) => {
  try {
    const result = await global.pool.query('SELECT * FROM company_commission_rules ORDER BY name');
    const rules = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      commissionType: row.commission_type,
      commissionRate: parseFloat(row.commission_rate),
      description: row.description,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(rules);
  } catch (error) {
    console.error('获取公司分成方案失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建公司分成方案
router.post('/company-commission-rules', async (req, res) => {
  try {
    const { name, commissionType, commissionRate, description } = req.body;
    
    if (!name || !commissionType) {
      return res.status(400).json({ error: '方案名称和分成类型不能为空' });
    }

    const result = await global.pool.query(
      'INSERT INTO company_commission_rules (id, name, commission_type, commission_rate, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [`rule-${Date.now()}`, name, commissionType, commissionRate || 0, description || null]
    );

    const rule = result.rows[0];
    const ruleData = {
      id: rule.id,
      name: rule.name,
      commissionType: rule.commission_type,
      commissionRate: parseFloat(rule.commission_rate),
      description: rule.description,
      isDefault: rule.is_default,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at
    };
    
    // 广播公司分成方案创建事件
    global.broadcastDataUpdate('company-commission-rule-created', ruleData);
    
    res.status(201).json(ruleData);
  } catch (error) {
    console.error('创建公司分成方案失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新公司分成方案
router.put('/company-commission-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, commissionType, commissionRate, description } = req.body;

    const result = await global.pool.query(
      'UPDATE company_commission_rules SET name = $1, commission_type = $2, commission_rate = $3, description = $4 WHERE id = $5 RETURNING *',
      [name, commissionType, commissionRate, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '公司分成方案不存在' });
    }

    const rule = result.rows[0];
    const ruleData = {
      id: rule.id,
      name: rule.name,
      commissionType: rule.commission_type,
      commissionRate: parseFloat(rule.commission_rate),
      description: rule.description,
      isDefault: rule.is_default,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at
    };
    
    // 广播公司分成方案更新事件
    global.broadcastDataUpdate('company-commission-rule-updated', ruleData);
    
    res.json(ruleData);
  } catch (error) {
    console.error('更新公司分成方案失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除公司分成方案
router.delete('/company-commission-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查是否为默认方案
    const ruleResult = await global.pool.query('SELECT is_default FROM company_commission_rules WHERE id = $1', [id]);
    if (ruleResult.rows.length === 0) {
      return res.status(404).json({ error: '公司分成方案不存在' });
    }
    
    if (ruleResult.rows[0].is_default) {
      return res.status(400).json({ error: '默认方案不能删除' });
    }
    
    // 检查是否有关联的技师
    const technicianResult = await global.pool.query('SELECT COUNT(*) as count FROM technicians WHERE company_commission_rule_id = $1', [id]);
    if (parseInt(technicianResult.rows[0].count) > 0) {
      return res.status(400).json({ error: '方案有关联的技师，无法删除' });
    }

    const result = await global.pool.query('DELETE FROM company_commission_rules WHERE id = $1 RETURNING *', [id]);
    
    // 广播公司分成方案删除事件
    global.broadcastDataUpdate('company-commission-rule-deleted', { id });
    
    res.json({ message: '公司分成方案删除成功' });
  } catch (error) {
    console.error('删除公司分成方案失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 业务设置管理 ====================

// 获取业务设置
router.get('/business-settings', async (req, res) => {
  try {
    const result = await global.pool.query('SELECT * FROM business_settings WHERE id = \'default-settings\'');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '业务设置不存在' });
    }
    
    const settings = result.rows[0];
    res.json({
      businessHours: settings.business_hours,
      timezone: settings.timezone,
      baseCurrencyName: settings.base_currency_name,
      baseCurrencyCode: settings.base_currency_code,
      baseCurrencySymbol: settings.base_currency_symbol
    });
  } catch (error) {
    console.error('获取业务设置失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新业务设置
router.put('/business-settings', async (req, res) => {
  try {
    const { businessHours, timezone, baseCurrencyName, baseCurrencyCode, baseCurrencySymbol } = req.body;
    
    const result = await global.pool.query(`
      UPDATE business_settings SET 
        business_hours = $1, timezone = $2, 
        base_currency_name = $3, base_currency_code = $4, base_currency_symbol = $5
      WHERE id = 'default-settings' RETURNING *
    `, [businessHours, timezone, baseCurrencyName, baseCurrencyCode, baseCurrencySymbol]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '业务设置不存在' });
    }
    
    const settings = result.rows[0];
    const settingsData = {
      businessHours: settings.business_hours,
      timezone: settings.timezone,
      baseCurrencyName: settings.base_currency_name,
      baseCurrencyCode: settings.base_currency_code,
      baseCurrencySymbol: settings.base_currency_symbol
    };
    
    // 广播业务设置更新事件
    global.broadcastDataUpdate('business-settings-updated', settingsData);
    
    res.json(settingsData);
  } catch (error) {
    console.error('更新业务设置失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
