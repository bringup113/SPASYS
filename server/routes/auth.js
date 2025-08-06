const express = require('express');
const router = express.Router();

// 获取数据库连接池
const pool = global.pool;

// 登录API
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查询用户
    const result = await pool.query(
      'SELECT id, username, name, is_active FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: '账号已被禁用'
      });
    }

    // 更新最后登录时间
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // 返回用户信息（不包含密码）
    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 验证登录状态API
router.get('/check', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID'
      });
    }

    // 查询用户是否存在且激活
    const result = await pool.query(
      'SELECT id, username, name, is_active FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: '账号已被禁用'
      });
    }

    res.json({
      success: true,
      message: '登录状态有效',
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      }
    });

  } catch (error) {
    console.error('验证登录状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 