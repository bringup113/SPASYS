// 数据导出工具 - 从localStorage导出数据

/**
 * 导出localStorage数据到JSON文件
 */
export function exportLocalStorageData() {
  try {
    // 获取localStorage数据
    const appState = localStorage.getItem('spa-app-state');
    
    if (!appState) {
      throw new Error('没有找到应用数据');
    }
    
    const data = JSON.parse(appState);
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spa-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理URL
    URL.revokeObjectURL(url);
    
    console.log('数据导出成功');
    return true;
  } catch (error) {
    console.error('数据导出失败:', error);
    return false;
  }
}

/**
 * 验证导出的数据结构
 */
export function validateExportedData(data) {
  const requiredFields = [
    'rooms',
    'serviceCategories', 
    'serviceItems',
    'technicians',
    'salespeople',
    'currencies',
    'orders'
  ];
  
  const validation = {
    isValid: true,
    errors: [],
    stats: {}
  };
  
  // 检查必需字段
  for (const field of requiredFields) {
    if (!(field in data)) {
      validation.errors.push(`缺少必需字段: ${field}`);
      validation.isValid = false;
    } else if (!Array.isArray(data[field])) {
      validation.errors.push(`字段 ${field} 不是数组`);
      validation.isValid = false;
    } else {
      validation.stats[field] = data[field].length;
    }
  }
  
  return validation;
}

/**
 * 显示数据统计信息
 */
export function showDataStats(data) {
  const stats = {
    rooms: data.rooms?.length || 0,
    serviceCategories: data.serviceCategories?.length || 0,
    serviceItems: data.serviceItems?.length || 0,
    technicians: data.technicians?.length || 0,
    salespeople: data.salespeople?.length || 0,
    currencies: data.currencies?.length || 0,
    orders: data.orders?.length || 0
  };
  
  console.log('📊 数据统计:');
  console.log(`- 房间: ${stats.rooms} 个`);
  console.log(`- 服务分类: ${stats.serviceCategories} 个`);
  console.log(`- 服务项目: ${stats.serviceItems} 个`);
  console.log(`- 技师: ${stats.technicians} 个`);
  console.log(`- 销售员: ${stats.salespeople} 个`);
  console.log(`- 货币: ${stats.currencies} 个`);
  console.log(`- 订单: ${stats.orders} 个`);
  
  return stats;
}

/**
 * 完整的导出流程
 */
export async function exportDataWithValidation() {
  try {
    console.log('🔄 开始导出数据...');
    
    // 导出数据
    const success = exportLocalStorageData();
    
    if (!success) {
      throw new Error('导出失败');
    }
    
    // 获取数据用于验证
    const appState = localStorage.getItem('spa-app-state');
    const data = JSON.parse(appState);
    
    // 验证数据
    const validation = validateExportedData(data);
    
    if (!validation.isValid) {
      console.warn('⚠️ 数据验证警告:');
      validation.errors.forEach(error => console.warn(`- ${error}`));
    }
    
    // 显示统计信息
    showDataStats(data);
    
    console.log('✅ 数据导出完成');
    console.log('📁 文件已下载到浏览器默认下载目录');
    console.log('');
    console.log('📋 下一步操作:');
    console.log('1. 将下载的JSON文件复制到server目录');
    console.log('2. 运行迁移脚本: node migrate.js <文件名>');
    console.log('3. 启动后端API服务器');
    
    return {
      success: true,
      validation,
      stats: validation.stats
    };
    
  } catch (error) {
    console.error('❌ 导出失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 在浏览器控制台中使用的便捷函数
 */
if (typeof window !== 'undefined') {
  window.exportSPAData = exportDataWithValidation;
  window.exportLocalStorageData = exportLocalStorageData;
  window.validateExportedData = validateExportedData;
  window.showDataStats = showDataStats;
  
  console.log('📦 数据导出工具已加载');
  console.log('使用方法:');
  console.log('- exportSPAData() - 完整导出流程');
  console.log('- exportLocalStorageData() - 仅导出数据');
  console.log('- showDataStats(data) - 显示数据统计');
} 