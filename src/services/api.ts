// API服务层 - 替换localStorage的数据操作
import { buildApiUrl } from '../config/api';

const getApiUrl = (endpoint: string) => {
  return buildApiUrl(endpoint);
};

// 通用API请求函数
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(endpoint);
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // 添加超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`API请求错误 (${endpoint}):`, error);
    throw error;
  }
}

// 获取完整应用状态
export async function getAppState() {
  return apiRequest<AppState>('/app-state');
}

// 更新完整应用状态
export async function updateAppState(state: AppState) {
  return apiRequest<AppState>('/app-state', {
    method: 'PUT',
    body: JSON.stringify(state),
  });
}

// 房间相关API
export const roomAPI = {
  getAll: () => apiRequest<Room[]>('/rooms'),
  create: (room: Omit<Room, 'id'>) => apiRequest<Room>('/rooms', {
    method: 'POST',
    body: JSON.stringify(room),
  }),
  update: (id: string, room: Partial<Room>) => apiRequest<Room>(`/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(room),
  }),
  delete: (id: string) => apiRequest<void>(`/rooms/${id}`, {
    method: 'DELETE',
  }),
};

// 服务分类相关API
export const serviceCategoryAPI = {
  getAll: () => apiRequest<ServiceCategory[]>('/service-categories'),
  create: (category: Omit<ServiceCategory, 'id'>) => apiRequest<ServiceCategory>('/service-categories', {
    method: 'POST',
    body: JSON.stringify(category),
  }),
  update: (id: string, category: Partial<ServiceCategory>) => apiRequest<ServiceCategory>(`/service-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  }),
  delete: (id: string) => apiRequest<void>(`/service-categories/${id}`, {
    method: 'DELETE',
  }),
};

// 服务项目相关API
export const serviceItemAPI = {
  getAll: () => apiRequest<ServiceItem[]>('/service-items'),
  create: (item: Omit<ServiceItem, 'id'>) => apiRequest<ServiceItem>('/service-items', {
    method: 'POST',
    body: JSON.stringify(item),
  }),
  update: (id: string, item: Partial<ServiceItem>) => apiRequest<ServiceItem>(`/service-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  }),
  delete: (id: string) => apiRequest<void>(`/service-items/${id}`, {
    method: 'DELETE',
  }),
};

// 技师相关API
export const technicianAPI = {
  getAll: () => apiRequest<Technician[]>('/technicians'),
  create: (technician: Omit<Technician, 'id' | 'createdAt' | 'updatedAt'>) => apiRequest<Technician>('/technicians', {
    method: 'POST',
    body: JSON.stringify(technician),
  }),
  update: (id: string, technician: Partial<Technician>) => apiRequest<Technician>(`/technicians/${id}`, {
    method: 'PUT',
    body: JSON.stringify(technician),
  }),
  delete: (id: string) => apiRequest<void>(`/technicians/${id}`, {
    method: 'DELETE',
  }),
  updateStatus: (id: string, status: TechnicianStatus) => apiRequest<Technician>(`/technicians/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
};

// 销售员相关API
export const salespersonAPI = {
  getAll: () => apiRequest<Salesperson[]>('/salespeople'),
  create: (salesperson: Omit<Salesperson, 'id'>) => apiRequest<Salesperson>('/salespeople', {
    method: 'POST',
    body: JSON.stringify(salesperson),
  }),
  update: (id: string, salesperson: Partial<Salesperson>) => apiRequest<Salesperson>(`/salespeople/${id}`, {
    method: 'PUT',
    body: JSON.stringify(salesperson),
  }),
  delete: (id: string) => apiRequest<void>(`/salespeople/${id}`, {
    method: 'DELETE',
  }),
};

// 国家相关API
export const countryAPI = {
  getAll: () => apiRequest<Country[]>('/countries'),
  create: (country: Omit<Country, 'id' | 'createdAt' | 'updatedAt'>) => apiRequest<Country>('/countries', {
    method: 'POST',
    body: JSON.stringify(country),
  }),
  update: (id: string, country: Partial<Country>) => apiRequest<Country>(`/countries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(country),
  }),
  delete: (id: string) => apiRequest<void>(`/countries/${id}`, {
    method: 'DELETE',
  }),
};

// 订单相关API
export const orderAPI = {
  getAll: () => apiRequest<Order[]>('/orders'),
  create: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => apiRequest<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  }),
  update: (id: string, order: Partial<Order>) => apiRequest<Order>(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(order),
  }),
  delete: (id: string) => apiRequest<void>(`/orders/${id}`, {
    method: 'DELETE',
  }),
  updateStatus: (id: string, status: OrderStatus) => apiRequest<Order>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  completeItem: (orderId: string, itemId: string) => apiRequest<{ message: string; orderId: string; itemId: string; status: string }>(`/orders/${orderId}/items/${itemId}/complete`, {
    method: 'PATCH',
  }),
};

// 业务设置相关API
export const businessSettingsAPI = {
  get: () => apiRequest<BusinessSettings>('/business-settings'),
  update: (settings: BusinessSettings) => apiRequest<BusinessSettings>('/business-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
};

// 公司分成方案相关API
export const companyCommissionRuleAPI = {
  getAll: () => apiRequest<CompanyCommissionRule[]>('/company-commission-rules'),
  create: (rule: Omit<CompanyCommissionRule, 'id'>) => apiRequest<CompanyCommissionRule>('/company-commission-rules', {
    method: 'POST',
    body: JSON.stringify(rule),
  }),
  update: (id: string, rule: Partial<CompanyCommissionRule>) => apiRequest<CompanyCommissionRule>(`/company-commission-rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(rule),
  }),
  delete: (id: string) => apiRequest<void>(`/company-commission-rules/${id}`, {
    method: 'DELETE',
  }),
};

// 导入类型定义
import { AppState, Room, ServiceCategory, ServiceItem, Technician, TechnicianStatus, Salesperson, Country, Order, OrderStatus, BusinessSettings, CompanyCommissionRule } from '../types'; 