const { app, server, pool, redisClient } = require('./app');

const PORT = process.env.PORT || 3001;

// ==================== 启动前健康检查 ====================

async function startupHealthCheck() {
  console.log('🔍 启动前健康检查...');
  
  try {
    // 检查数据库连接
    console.log('📊 检查数据库连接...');
    const dbResult = await pool.query('SELECT version()');
    console.log('✅ 数据库连接成功:', {
      database: dbResult.rows[0].version.split(' ')[0],
      user: process.env.DB_USER || 'postgres',
      version: 'PostgreSQL'
    });
    
    // 检查Redis连接
    console.log('🔴 检查Redis连接...');
    await redisClient.ping();
    console.log('✅ Redis连接成功');
    
    // 检查应用状态数据
    console.log('📋 检查应用状态数据...');
    
    // 并行检查所有数据表
    const [
      roomsResult,
      categoriesResult,
      itemsResult,
      settingsResult,
      salespeopleResult,
      techniciansResult,
      ordersResult,
      rulesResult,
      countriesResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM rooms'),
      pool.query('SELECT COUNT(*) as count FROM service_categories'),
      pool.query('SELECT COUNT(*) as count FROM service_items'),
      pool.query('SELECT COUNT(*) as count FROM business_settings'),
      pool.query('SELECT COUNT(*) as count FROM salespeople'),
      pool.query('SELECT COUNT(*) as count FROM technicians'),
      pool.query('SELECT COUNT(*) as count FROM orders'),
      pool.query('SELECT COUNT(*) as count FROM company_commission_rules'),
      pool.query('SELECT COUNT(*) as count FROM countries')
    ]);
    
    console.log('✅ 应用状态数据正常:', {
      rooms: parseInt(roomsResult.rows[0].count),
      serviceCategories: parseInt(categoriesResult.rows[0].count),
      serviceItems: parseInt(itemsResult.rows[0].count),
      technicians: parseInt(techniciansResult.rows[0].count),
      salespeople: parseInt(salespeopleResult.rows[0].count),
      businessSettings: parseInt(settingsResult.rows[0].count),
      orders: parseInt(ordersResult.rows[0].count),
      companyCommissionRules: parseInt(rulesResult.rows[0].count),
      countries: parseInt(countriesResult.rows[0].count)
    });
    
    console.log('🎉 所有服务检查通过！');
    return true;
  } catch (error) {
    console.error('❌ 健康检查失败:', error);
    return false;
  }
}

// ==================== 服务器启动 ====================

async function startServer() {
  try {
    // 执行启动前健康检查
    const healthCheckPassed = await startupHealthCheck();
    
    if (!healthCheckPassed) {
      console.error('❌ 健康检查失败，服务器启动中止');
      process.exit(1);
    }
    
    // 启动WebSocket服务器
    server.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 服务器启动成功！');
      console.log('📍 API地址: http://localhost:' + PORT);
      console.log('🔌 WebSocket地址: ws://localhost:' + PORT);
      console.log('🔍 健康检查: http://localhost:' + PORT + '/api/health');
      console.log('📊 pgAdmin: http://localhost:5050 (admin@spa.com / admin)');
      console.log('');
      console.log('📋 可用的API端点:');
      console.log('- GET  /api/health - 健康检查');
      console.log('- GET  /api/app-state - 获取完整应用状态');
      console.log('- GET  /api/rooms - 获取房间列表');
      console.log('- POST /api/rooms - 创建房间');
      console.log('- PUT  /api/rooms/:id - 更新房间');
      console.log('- DELETE /api/rooms/:id - 删除房间');
      console.log('- GET  /api/service-categories - 获取服务分类列表');
      console.log('- POST /api/service-categories - 创建服务分类');
      console.log('- PUT  /api/service-categories/:id - 更新服务分类');
      console.log('- DELETE /api/service-categories/:id - 删除服务分类');
      console.log('- GET  /api/service-items - 获取服务项目列表');
      console.log('- POST /api/service-items - 创建服务项目');
      console.log('- PUT  /api/service-items/:id - 更新服务项目');
      console.log('- DELETE /api/service-items/:id - 删除服务项目');
      console.log('- GET  /api/technicians - 获取技师列表');
      console.log('- POST /api/technicians - 创建技师');
      console.log('- PUT  /api/technicians/:id - 更新技师');
      console.log('- DELETE /api/technicians/:id - 删除技师');
      console.log('- PATCH /api/technicians/:id/status - 更新技师状态');
      console.log('- PUT  /api/technicians/:id/services - 更新技师服务分配');
      console.log('- GET  /api/orders - 获取订单列表');
      console.log('- POST /api/orders - 创建订单');
      console.log('- PUT  /api/orders/:id - 更新订单');
      console.log('- DELETE /api/orders/:id - 删除订单');
      console.log('- PATCH /api/orders/:id/status - 更新订单状态');
      console.log('- GET  /api/salespeople - 获取销售员列表');
      console.log('- POST /api/salespeople - 创建销售员');
      console.log('- PUT  /api/salespeople/:id - 更新销售员');
      console.log('- DELETE /api/salespeople/:id - 删除销售员');
      console.log('- GET  /api/countries - 获取国家列表');
      console.log('- POST /api/countries - 创建国家');
      console.log('- PUT  /api/countries/:id - 更新国家');
      console.log('- DELETE /api/countries/:id - 删除国家');
      console.log('- GET  /api/company-commission-rules - 获取公司分成方案列表');
      console.log('- POST /api/company-commission-rules - 创建公司分成方案');
      console.log('- PUT  /api/company-commission-rules/:id - 更新公司分成方案');
      console.log('- DELETE /api/company-commission-rules/:id - 删除公司分成方案');
      console.log('- GET  /api/business-settings - 获取业务设置');
      console.log('- PUT  /api/business-settings - 更新业务设置');
      console.log('');
      console.log('🔌 WebSocket事件:');
      console.log('- data-update - 数据更新广播');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// ==================== 优雅关闭 ====================

process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    pool.end(() => {
      console.log('✅ 数据库连接已关闭');
      redisClient.quit(() => {
        console.log('✅ Redis连接已关闭');
        process.exit(0);
      });
    });
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    pool.end(() => {
      console.log('✅ 数据库连接已关闭');
      redisClient.quit(() => {
        console.log('✅ Redis连接已关闭');
        process.exit(0);
      });
    });
  });
});

// 启动服务器
startServer(); 