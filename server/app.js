const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const redis = require('redis');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

// 创建Express应用
const app = express();
const server = http.createServer(app);

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  
  // 记录请求开始
  console.log(`📥 ${req.method} ${req.url}`, {
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });
  
  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusIcon = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';
    
    console.log(`${statusIcon} ${req.method} ${req.url} - ${status} (${duration}ms)`);
  });
  
  next();
});

// 数据库连接
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'spa_system',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Redis连接
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().catch(console.error);

// 将pool和redisClient暴露给路由模块
global.pool = pool;
global.redisClient = redisClient;

// 导入路由模块
const authRouter = require('./routes/auth');
const roomsRouter = require('./routes/rooms');
const servicesRouter = require('./routes/services');
const techniciansRouter = require('./routes/technicians');
const ordersRouter = require('./routes/orders');
const managementRouter = require('./routes/management');

// 注册路由
app.use('/api/auth', authRouter);
app.use('/api', roomsRouter);
app.use('/api', servicesRouter);
app.use('/api', techniciansRouter);
app.use('/api', ordersRouter);
app.use('/api', managementRouter);

// ==================== 健康检查API ====================

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    // 检查数据库连接
    const dbResult = await pool.query('SELECT NOW()');
    const dbStatus = dbResult.rows[0] ? 'connected' : 'disconnected';
    
    // 检查Redis连接
    const redisStatus = redisClient.isReady ? 'connected' : 'disconnected';
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// 获取完整应用状态的API
app.get('/api/app-state', async (req, res) => {
  try {
    // 并行获取所有数据
    const [
      roomsResult,
      serviceCategoriesResult,
      serviceItemsResult,
      techniciansResult,
      salespeopleResult,
      countriesResult,
      ordersResult,
      companyCommissionRulesResult,
      businessSettingsResult
    ] = await Promise.all([
      global.pool.query('SELECT * FROM rooms ORDER BY created_at ASC'),
      global.pool.query('SELECT * FROM service_categories ORDER BY created_at ASC'),
      global.pool.query('SELECT * FROM service_items ORDER BY created_at ASC'),
      global.pool.query('SELECT * FROM technicians ORDER BY created_at ASC'),
      global.pool.query('SELECT * FROM salespeople ORDER BY created_at ASC'),
      global.pool.query('SELECT * FROM countries ORDER BY created_at ASC'),
      global.pool.query(`
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
        ORDER BY o.created_at ASC
      `),
              global.pool.query('SELECT * FROM company_commission_rules ORDER BY created_at ASC'),
      global.pool.query('SELECT * FROM business_settings WHERE id = \'default-settings\'')
    ]);

    // 处理技师数据（包含服务分配）
    const technicianServicesResult = await global.pool.query(`
      SELECT ts.technician_id, ts.service_id, ts.price, ts.commission,
             si.name as service_name
      FROM technician_services ts
      LEFT JOIN service_items si ON ts.service_id = si.id
      ORDER BY ts.technician_id, ts.created_at ASC
    `);

    const servicesByTechnician = {};
    technicianServicesResult.rows.forEach(row => {
      if (!servicesByTechnician[row.technician_id]) {
        servicesByTechnician[row.technician_id] = [];
      }
      servicesByTechnician[row.technician_id].push({
        serviceId: row.service_id,
        serviceName: row.service_name,
        price: parseFloat(row.price),
        commission: parseFloat(row.commission)
      });
    });

    // 订单数据现在已经在ordersResult中包含了items

    // 构建响应数据
    const appState = {
      rooms: roomsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        status: row.status,
        description: row.description,
        isTemporary: row.is_temporary || false,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      serviceCategories: serviceCategoriesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      serviceItems: serviceItemsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        duration: row.duration,
        categoryId: row.category_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      technicians: techniciansResult.rows.map(row => ({
        id: row.id,
        employeeId: row.employee_id,
        countryId: row.country_id,
        hireDate: row.hire_date.toISOString().split('T')[0],
        status: row.status,
        services: servicesByTechnician[row.id] || [],
        companyCommissionRuleId: row.company_commission_rule_id || 'default-rule'
      })),
      salespeople: salespeopleResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        commissionType: row.commission_type,
        commissionRate: parseFloat(row.commission_rate),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      countries: countriesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        remark: row.remark,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      orders: ordersResult.rows.map(row => ({
        id: row.id,
        roomId: row.room_id,
        roomName: row.room_name,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        status: row.status,
        items: row.items || [],
        totalAmount: parseFloat(row.total_amount),
        receivedAmount: row.received_amount ? parseFloat(row.received_amount) : undefined,
        discountRate: row.discount_rate ? parseFloat(row.discount_rate) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
        notes: row.notes
      })),
      companyCommissionRules: companyCommissionRulesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        commissionType: row.commission_type,
        commissionRate: parseFloat(row.commission_rate),
        description: row.description,
        isDefault: row.is_default,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      businessSettings: businessSettingsResult.rows.length > 0 ? {
        businessHours: businessSettingsResult.rows[0].business_hours,
        timezone: businessSettingsResult.rows[0].timezone,
        baseCurrencyName: businessSettingsResult.rows[0].base_currency_name,
        baseCurrencyCode: businessSettingsResult.rows[0].base_currency_code,
        baseCurrencySymbol: businessSettingsResult.rows[0].base_currency_symbol
      } : undefined
    };

    res.json(appState);
  } catch (error) {
    console.error('获取应用状态失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// WebSocket设置
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// WebSocket连接处理
io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);

  socket.on('disconnect', () => {
    console.log('客户端断开连接:', socket.id);
  });
});

// 广播数据更新
function broadcastDataUpdate(type, data) {
  io.emit('data-update', { 
    type, 
    data,
    timestamp: new Date().toISOString()
  });
}

// 将广播函数暴露给路由模块
global.broadcastDataUpdate = broadcastDataUpdate;

// 错误处理中间件
app.use((error, req, res, next) => {
  // 记录详细的错误信息
  console.error('❌ 服务器错误:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });
  
  // 如果是数据库外键约束错误，提供更友好的错误信息
  if (error.code === '23503') {
    console.error('🔗 外键约束错误:', {
      detail: error.detail,
      table: error.table,
      constraint: error.constraint,
      hint: error.hint
    });
    return res.status(400).json({ 
      error: '数据关联错误，请检查相关数据是否存在',
      details: error.detail 
    });
  }
  
  // 如果是唯一约束错误
  if (error.code === '23505') {
    console.error('🔒 唯一约束错误:', {
      detail: error.detail,
      table: error.table,
      constraint: error.constraint
    });
    return res.status(400).json({ 
      error: '数据已存在，请检查输入信息',
      details: error.detail 
    });
  }
  
  // 其他数据库错误
  if (error.code && error.code.startsWith('23')) {
    console.error('🗄️ 数据库错误:', {
      code: error.code,
      message: error.message,
      detail: error.detail
    });
    return res.status(400).json({ 
      error: '数据库操作失败',
      details: error.message 
    });
  }
  
  res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

module.exports = { app, server, pool, redisClient }; 