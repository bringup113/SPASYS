const express = require('express');
const router = express.Router();

// 获取所有房间
router.get('/rooms', async (req, res) => {
  try {
    const result = await global.pool.query('SELECT * FROM rooms ORDER BY created_at ASC');
    const rooms = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      description: row.description,
      isTemporary: row.is_temporary || false,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(rooms);
  } catch (error) {
    console.error('获取房间列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建房间
router.post('/rooms', async (req, res) => {
  try {
    const { name, description, isTemporary, expiresAt } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '房间名称不能为空' });
    }

    const result = await global.pool.query(
      'INSERT INTO rooms (id, name, description, is_temporary, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        `room-${Date.now()}`,
        name,
        description || null,
        isTemporary || false,
        expiresAt ? new Date(expiresAt) : null
      ]
    );

    const room = result.rows[0];
    const roomData = {
      id: room.id,
      name: room.name,
      status: room.status,
      description: room.description,
      isTemporary: room.is_temporary,
      expiresAt: room.expires_at,
      createdAt: room.created_at,
      updatedAt: room.updated_at
    };
    
    // 广播房间创建事件
    global.broadcastDataUpdate('room-created', roomData);
    
    res.status(201).json(roomData);
  } catch (error) {
    console.error('创建房间失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新房间
router.put('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, description, isTemporary, expiresAt } = req.body;

    // 构建动态更新查询
    let updateFields = [];
    let values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (isTemporary !== undefined) {
      updateFields.push(`is_temporary = $${paramIndex++}`);
      values.push(isTemporary);
    }
    if (expiresAt !== undefined) {
      updateFields.push(`expires_at = $${paramIndex++}`);
      values.push(expiresAt ? new Date(expiresAt) : null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有提供要更新的字段' });
    }

    values.push(id); // 添加WHERE条件的参数

    const result = await global.pool.query(
      `UPDATE rooms SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '房间不存在' });
    }

    const room = result.rows[0];
    const roomData = {
      id: room.id,
      name: room.name,
      status: room.status,
      description: room.description,
      isTemporary: room.is_temporary,
      expiresAt: room.expires_at,
      createdAt: room.created_at,
      updatedAt: room.updated_at
    };
    
    // 广播房间更新事件
    global.broadcastDataUpdate('room-updated', roomData);
    
    res.json(roomData);
  } catch (error) {
    console.error('更新房间失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除房间
router.delete('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查房间是否存在
    const roomResult = await global.pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: '房间不存在' });
    }

    // 直接删除房间（由于外键约束是 ON DELETE SET NULL，关联订单的 room_id 会被设置为 NULL）
    // 订单表中的 room_name 快照会保留历史记录
    const result = await global.pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);
    
    // 广播房间删除事件
    global.broadcastDataUpdate('room-deleted', { id });

    res.json({ message: '房间删除成功' });
  } catch (error) {
    console.error('删除房间失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 