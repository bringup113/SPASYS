// 存储适配器 - 模拟localStorage接口，但实际调用API
import { roomAPI, serviceCategoryAPI, serviceItemAPI, salespersonAPI, technicianAPI, orderAPI } from './api';

class StorageAdapter {
  private initialized = false;
  private cache: { [key: string]: any } = {};

  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('🔄 初始化存储适配器...');
      
      // 并行加载所有数据
      const [rooms, serviceCategories, serviceItems, salespeople, technicians, orders, businessSettings] = await Promise.all([
        roomAPI.getAll().catch(() => []),
        serviceCategoryAPI.getAll().catch(() => []),
        serviceItemAPI.getAll().catch(() => []),
        salespersonAPI.getAll().catch(() => []),
        technicianAPI.getAll().catch(() => []),
        orderAPI.getAll().catch(() => []),
        fetch(`${window.location.origin.replace(':5173', ':3001')}/api/business-settings`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      ]);
      
      // 缓存数据
      this.cache['rooms'] = rooms;
      this.cache['serviceCategories'] = serviceCategories;
      this.cache['serviceItems'] = serviceItems;
      this.cache['salespeople'] = salespeople;
      this.cache['technicians'] = technicians;
      this.cache['businessSettings'] = businessSettings;
      this.cache['orders'] = orders;
      
      this.initialized = true;
      console.log('✅ 存储适配器初始化成功');
    } catch (error) {
      console.error('❌ 初始化存储失败:', error);
      console.log('⚠️ 使用默认状态');
      
      // 设置默认状态
      this.cache = {
        rooms: [],
        serviceCategories: [],
        serviceItems: [],
        technicians: [],
        salespeople: [],
        orders: []
      };
      this.initialized = true;
    }
  }

  async getItem(key: string): Promise<string | null> {
    await this.initialize();
    
    try {
      const value = this.cache[key];
      return value ? JSON.stringify(value) : null;
    } catch (error) {
      console.error(`❌ 获取数据失败 (${key}):`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.initialize();
    
    try {
      const parsedValue = JSON.parse(value);
      this.cache[key] = parsedValue;
      
      // 根据key类型调用相应的API
      switch (key) {
        case 'rooms':
          // 房间数据由前端直接管理，这里只更新缓存
          break;
        case 'serviceCategories':
          // 服务分类数据由前端直接管理，这里只更新缓存
          break;
        default:
          // 其他数据暂时只更新缓存
          break;
      }
    } catch (error) {
      console.error(`❌ 设置数据失败 (${key}):`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    await this.initialize();
    
    try {
      delete this.cache[key];
    } catch (error) {
      console.error(`❌ 删除数据失败 (${key}):`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache = {};
      this.initialized = false;
      console.log('🗑️ 存储缓存已清空');
    } catch (error) {
      console.error('❌ 清空存储失败:', error);
    }
  }
}

// 创建单例实例
const storageAdapter = new StorageAdapter();

// 导出localStorage接口
export const localStorage = {
  getItem: (key: string) => storageAdapter.getItem(key),
  setItem: (key: string, value: string) => storageAdapter.setItem(key, value),
  removeItem: (key: string) => storageAdapter.removeItem(key),
  clear: () => storageAdapter.clear(),
}; 