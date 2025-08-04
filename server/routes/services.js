const express = require('express');
const router = express.Router();

// 获取所有服务分类
router.get('/service-categories', async (req, res) => {
  try {
    const result = await global.pool.query('SELECT * FROM service_categories ORDER BY created_at ASC');
    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(categories);
  } catch (error) {
    console.error('获取服务分类失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建服务分类
router.post('/service-categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '分类名称不能为空' });
    }

    const result = await global.pool.query(
      'INSERT INTO service_categories (id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [`category-${Date.now()}`, name, description || null]
    );

    const category = result.rows[0];
    const categoryData = {
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.created_at,
      updatedAt: category.updated_at
    };
    
    // 广播服务分类创建事件
    global.broadcastDataUpdate('service-category-created', categoryData);
    
    res.status(201).json(categoryData);
  } catch (error) {
    console.error('创建服务分类失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新服务分类
router.put('/service-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const result = await global.pool.query(
      'UPDATE service_categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '服务分类不存在' });
    }

    const category = result.rows[0];
    const categoryData = {
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.created_at,
      updatedAt: category.updated_at
    };
    
    // 广播服务分类更新事件
    global.broadcastDataUpdate('service-category-updated', categoryData);
    
    res.json(categoryData);
  } catch (error) {
    console.error('更新服务分类失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除服务分类
router.delete('/service-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查分类是否有关联的服务项目
    const serviceResult = await global.pool.query('SELECT COUNT(*) as count FROM service_items WHERE category_id = $1', [id]);
    if (parseInt(serviceResult.rows[0].count) > 0) {
      return res.status(400).json({ error: '分类有关联的服务项目，无法删除' });
    }

    const result = await global.pool.query('DELETE FROM service_categories WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '服务分类不存在' });
    }
    
    // 广播服务分类删除事件
    global.broadcastDataUpdate('service-category-deleted', { id });
    
    res.json({ message: '服务分类删除成功' });
  } catch (error) {
    console.error('删除服务分类失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取所有服务项目
router.get('/service-items', async (req, res) => {
  try {
    const result = await global.pool.query(`
      SELECT si.*, sc.name as category_name 
      FROM service_items si 
      LEFT JOIN service_categories sc ON si.category_id = sc.id 
      ORDER BY si.created_at ASC
    `);
    const items = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      duration: row.duration,
      categoryId: row.category_id,
      categoryName: row.category_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(items);
  } catch (error) {
    console.error('获取服务项目失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建服务项目
router.post('/service-items', async (req, res) => {
  try {
    const { name, duration, categoryId } = req.body;
    
    if (!name || !categoryId) {
      return res.status(400).json({ error: '服务名称和分类不能为空' });
    }

    const result = await global.pool.query(
      'INSERT INTO service_items (id, name, duration, category_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [`service-${Date.now()}`, name, duration || 60, categoryId]
    );

    const item = result.rows[0];
    const itemData = {
      id: item.id,
      name: item.name,
      duration: item.duration,
      categoryId: item.category_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
    
    // 广播服务项目创建事件
    global.broadcastDataUpdate('service-item-created', itemData);
    
    res.status(201).json(itemData);
  } catch (error) {
    console.error('创建服务项目失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新服务项目
router.put('/service-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration, categoryId } = req.body;

    const result = await global.pool.query(
      'UPDATE service_items SET name = $1, duration = $2, category_id = $3 WHERE id = $4 RETURNING *',
      [name, duration, categoryId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '服务项目不存在' });
    }

    const item = result.rows[0];
    const itemData = {
      id: item.id,
      name: item.name,
      duration: item.duration,
      categoryId: item.category_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
    
    // 广播服务项目更新事件
    global.broadcastDataUpdate('service-item-updated', itemData);
    
    res.json(itemData);
  } catch (error) {
    console.error('更新服务项目失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除服务项目
router.delete('/service-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查服务项目是否有关联的订单
    const orderResult = await global.pool.query('SELECT COUNT(*) as count FROM order_items WHERE service_id = $1', [id]);
    if (parseInt(orderResult.rows[0].count) > 0) {
      return res.status(400).json({ error: '服务项目有关联的订单，无法删除' });
    }

    const result = await global.pool.query('DELETE FROM service_items WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '服务项目不存在' });
    }
    
    // 广播服务项目删除事件
    global.broadcastDataUpdate('service-item-deleted', { id });
    
    res.json({ message: '服务项目删除成功' });
  } catch (error) {
    console.error('删除服务项目失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
