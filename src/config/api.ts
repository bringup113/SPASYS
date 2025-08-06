// API配置文件
// 支持开发环境和生产环境的不同配置

// 获取当前域名和端口
const getCurrentOrigin = () => {
  return window.location.origin;
};

// 获取API基础URL
export const getApiBaseUrl = () => {
  // 开发环境：使用当前域名，但端口改为3001
  if (import.meta.env.DEV) {
    const currentOrigin = getCurrentOrigin();
    // 如果是localhost:5173，改为localhost:3001
    if (currentOrigin.includes('localhost:5173')) {
      return 'http://localhost:3001';
    }
    // 如果是其他端口，保持相同域名但端口改为3001
    const url = new URL(currentOrigin);
    return `${url.protocol}//${url.hostname}:3001`;
  }
  
  // 生产环境：使用相对路径，让浏览器自动处理
  return '';
};

// 构建完整的API URL
export const buildApiUrl = (endpoint: string) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api${endpoint}`;
}; 