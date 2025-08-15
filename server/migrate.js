const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 数据迁移脚本 - 从localStorage迁移到PostgreSQL

// 数据库连接配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'spa_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function migrateDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('开始数据库迁移...');
    
    // 检查order_items表是否存在status字段
    const checkStatusColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' AND column_name = 'status'
    `);
    
    if (checkStatusColumn.rows.length === 0) {
      console.log('添加status字段...');
      await client.query(`
        ALTER TABLE order_items 
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'in_progress' 
        CHECK (status IN ('pending', 'in_progress', 'completed'))
      `);
      console.log('status字段添加成功');
    } else {
      console.log('status字段已存在');
    }
    
    // 检查order_items表是否存在completed_at字段
    const checkCompletedAtColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' AND column_name = 'completed_at'
    `);
    
    if (checkCompletedAtColumn.rows.length === 0) {
      console.log('添加completed_at字段...');
      await client.query(`
        ALTER TABLE order_items 
        ADD COLUMN completed_at TIMESTAMP
      `);
      console.log('completed_at字段添加成功');
    } else {
      console.log('completed_at字段已存在');
    }
    
    // 更新现有订单项目的状态
    console.log('更新现有订单项目状态...');
    await client.query(`
      UPDATE order_items 
      SET status = 'in_progress' 
      WHERE status IS NULL OR status = ''
    `);
    
    console.log('数据库迁移完成！');
    
  } catch (error) {
    console.error('数据库迁移失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 读取localStorage数据（从浏览器导出的JSON文件）
function readLocalStorageData(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取localStorage数据失败:', error);
    return null;
  }
}

// 验证数据结构
function validateData(data) {
  const requiredFields = ['rooms', 'serviceCategories', 'serviceItems', 'technicians', 'salespeople', 'currencies', 'orders'];
  
  for (const field of requiredFields) {
    if (!Array.isArray(data[field])) {
      console.warn(`警告: ${field} 不是数组或不存在`);
      data[field] = [];
    }
  }
  
  return data;
}

// 生成迁移SQL
function generateMigrationSQL(data) {
  const validatedData = validateData(data);
  
  const sql = `
-- 数据迁移脚本
-- 从localStorage迁移到PostgreSQL

-- 清空现有数据
DELETE FROM app_state WHERE id = 1;

-- 插入迁移的数据
INSERT INTO app_state (id, data, updated_at) VALUES (
  1, 
  '${JSON.stringify(validatedData).replace(/'/g, "''")}',
  NOW()
);

-- 验证数据
SELECT 
  id,
  jsonb_array_length(data->'rooms') as rooms_count,
  jsonb_array_length(data->'serviceCategories') as categories_count,
  jsonb_array_length(data->'serviceItems') as items_count,
  jsonb_array_length(data->'technicians') as technicians_count,
  jsonb_array_length(data->'salespeople') as salespeople_count,
  jsonb_array_length(data->'currencies') as currencies_count,
  jsonb_array_length(data->'orders') as orders_count,
  updated_at
FROM app_state WHERE id = 1;
`;

  return sql;
}

// 生成API调用脚本
function generateAPICalls(data) {
  const validatedData = validateData(data);
  const apiCalls = [];
  
  // 房间数据
  validatedData.rooms.forEach(room => {
    apiCalls.push({
      method: 'POST',
      url: '/api/rooms',
      data: room
    });
  });
  
  // 服务分类数据
  validatedData.serviceCategories.forEach(category => {
    apiCalls.push({
      method: 'POST',
      url: '/api/service-categories',
      data: category
    });
  });
  
  // 服务项目数据
  validatedData.serviceItems.forEach(item => {
    apiCalls.push({
      method: 'POST',
      url: '/api/service-items',
      data: item
    });
  });
  
  // 技师数据
  validatedData.technicians.forEach(technician => {
    apiCalls.push({
      method: 'POST',
      url: '/api/technicians',
      data: technician
    });
  });
  
  // 销售员数据
  validatedData.salespeople.forEach(salesperson => {
    apiCalls.push({
      method: 'POST',
      url: '/api/salespeople',
      data: salesperson
    });
  });
  
  // 货币数据
  validatedData.currencies.forEach(currency => {
    apiCalls.push({
      method: 'POST',
      url: '/api/currencies',
      data: currency
    });
  });
  
  // 订单数据
  validatedData.orders.forEach(order => {
    apiCalls.push({
      method: 'POST',
      url: '/api/orders',
      data: order
    });
  });
  
  return apiCalls;
}

// 生成JavaScript迁移脚本
function generateJSMigrationScript(apiCalls) {
  const script = `
// 自动生成的迁移脚本
// 使用方法: node migrate-data.js

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

async function migrateData() {
  const apiCalls = ${JSON.stringify(apiCalls, null, 2)};
  
  console.log('开始数据迁移...');
  console.log(\`总共需要迁移 \${apiCalls.length} 条数据\`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < apiCalls.length; i++) {
    const call = apiCalls[i];
    
    try {
      const response = await fetch(\`\${API_BASE_URL}\${call.url}\`, {
        method: call.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(call.data),
      });
      
      if (response.ok) {
        successCount++;
        console.log(\`✓ 成功迁移 \${call.url} (\${i + 1}/\${apiCalls.length})\`);
      } else {
        errorCount++;
        console.error(\`✗ 失败 \${call.url}: \${response.status}\`);
      }
    } catch (error) {
      errorCount++;
      console.error(\`✗ 错误 \${call.url}: \${error.message}\`);
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\\n迁移完成!');
  console.log(\`成功: \${successCount}\`);
  console.log(\`失败: \${errorCount}\`);
}

// 运行迁移
migrateData().catch(console.error);
`;

  return script;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方法: node migrate.js <localStorage数据文件路径>');
    console.log('示例: node migrate.js ../localStorage-data.json');
    return;
  }
  
  const filePath = args[0];
  
  console.log('开始数据迁移...');
  console.log(`读取文件: ${filePath}`);
  
  // 读取数据
  const data = readLocalStorageData(filePath);
  if (!data) {
    console.error('无法读取数据文件');
    return;
  }
  
  console.log('数据读取成功，验证结构...');
  
  // 验证数据
  const validatedData = validateData(data);
  console.log('数据验证完成');
  console.log(`- 房间: ${validatedData.rooms.length} 个`);
  console.log(`- 服务分类: ${validatedData.serviceCategories.length} 个`);
  console.log(`- 服务项目: ${validatedData.serviceItems.length} 个`);
  console.log(`- 技师: ${validatedData.technicians.length} 个`);
  console.log(`- 销售员: ${validatedData.salespeople.length} 个`);
  console.log(`- 货币: ${validatedData.currencies.length} 个`);
  console.log(`- 订单: ${validatedData.orders.length} 个`);
  
  // 生成SQL脚本
  const sql = generateMigrationSQL(validatedData);
  fs.writeFileSync('migration.sql', sql);
  console.log('SQL脚本已生成: migration.sql');
  
  // 生成API调用脚本
  const apiCalls = generateAPICalls(validatedData);
  const jsScript = generateJSMigrationScript(apiCalls);
  fs.writeFileSync('migrate-data.js', jsScript);
  console.log('JavaScript迁移脚本已生成: migrate-data.js');
  
  console.log('\n迁移选项:');
  console.log('1. 直接执行SQL: psql -U postgres -d spa_system -f migration.sql');
  console.log('2. 使用API迁移: node migrate-data.js');
  console.log('\n建议使用API迁移方式，因为它会保持数据完整性。');
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  readLocalStorageData,
  validateData,
  generateMigrationSQL,
  generateAPICalls,
  generateJSMigrationScript,
  migrateDatabase
}; 