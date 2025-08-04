const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  database: 'spa_system',
  password: 'password',
  port: 5432,
});

async function initDatabase() {
  try {
    console.log('🗄️ 初始化数据库...');

    // 执行所有SQL初始化脚本（按依赖顺序）
    const sqlFiles = [
      '01-init.sql',
      '02-rooms.sql',
      '03-service-categories.sql',
      '04-service-items.sql',
      '05-business-settings.sql',
      '10-company-commission-rules.sql',
      '06-salespeople.sql',
      '07-technicians.sql',
      '08-orders.sql',
      '09-countries.sql',
      '11-default-data.sql'
    ];

    for (const file of sqlFiles) {
      try {
        console.log(`📄 执行 ${file}...`);
        const fs = require('fs');
        const path = require('path');
        const sqlPath = path.join(__dirname, 'database', 'init', file);

        if (fs.existsSync(sqlPath)) {
          const sqlContent = fs.readFileSync(sqlPath, 'utf8');

          // 执行整个SQL文件
          try {
            await pool.query(sqlContent);
          } catch (error) {
            // 只忽略特定的"已存在"错误，不忽略数据插入错误
            if (error.message.includes('already exists') && 
                (error.message.includes('trigger') || 
                 error.message.includes('index') || 
                 error.message.includes('table'))) {
              console.log(`⚠️ 跳过已存在的对象: ${error.message.split('\n')[0]}`);
            } else if (error.message.includes('duplicate key')) {
              console.log(`⚠️ 跳过重复数据: ${error.message.split('\n')[0]}`);
            } else {
              console.error(`❌ SQL执行错误: ${error.message}`);
              throw error;
            }
          }
          console.log(`✅ ${file} 执行成功`);
        } else {
          console.log(`⚠️ ${file} 文件不存在，跳过`);
        }
      } catch (error) {
        console.error(`❌ 执行 ${file} 失败:`, error.message);
        // 继续执行其他文件
      }
    }

    console.log('✅ 数据库初始化完成');

    // 验证数据
    const roomsResult = await pool.query('SELECT COUNT(*) as count FROM rooms');
    const businessSettingsResult = await pool.query('SELECT COUNT(*) as count FROM business_settings');
    const categoriesResult = await pool.query('SELECT COUNT(*) as count FROM service_categories');
    const companyCommissionRulesResult = await pool.query('SELECT COUNT(*) as count FROM company_commission_rules');
    const countriesResult = await pool.query('SELECT COUNT(*) as count FROM countries');
    console.log('📊 验证数据:', {
      rooms: parseInt(roomsResult.rows[0].count),
      businessSettings: parseInt(businessSettingsResult.rows[0].count),
      categories: parseInt(categoriesResult.rows[0].count),
      companyCommissionRules: parseInt(companyCommissionRulesResult.rows[0].count),
      countries: parseInt(countriesResult.rows[0].count)
    });

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  } finally {
    await pool.end();
  }
}

initDatabase(); 