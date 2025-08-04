import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { AppState, Room, ServiceCategory, ServiceItem, Technician, Salesperson, Country, Order, OrderStatus, BusinessSettings, CompanyCommissionRule } from '../types';
import { roomAPI, serviceCategoryAPI, serviceItemAPI, countryAPI, salespersonAPI, technicianAPI, orderAPI, companyCommissionRuleAPI } from '../services/api';
import { websocketService } from '../services/websocket';

interface AppContextType {
  state: AppState;
  isLoading: boolean;
  isConnected: boolean;
  addRoom: (room: Omit<Room, 'id'>) => void;
  addTemporaryRoom: (name: string) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  addServiceCategory: (category: Omit<ServiceCategory, 'id'>) => void;
  updateServiceCategory: (id: string, category: Partial<ServiceCategory>) => void;
  deleteServiceCategory: (id: string) => void;
  addServiceItem: (item: Omit<ServiceItem, 'id'>) => void;
  updateServiceItem: (id: string, item: Partial<ServiceItem>) => void;
  deleteServiceItem: (id: string) => void;
  addTechnician: (technician: Omit<Technician, 'id'>) => void;
  updateTechnician: (id: string, technician: Partial<Technician>) => void;
  deleteTechnician: (id: string) => void;
  addSalesperson: (salesperson: Omit<Salesperson, 'id'>) => void;
  updateSalesperson: (id: string, salesperson: Partial<Salesperson>) => void;
  deleteSalesperson: (id: string) => void;

  addCountry: (country: Omit<Country, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCountry: (id: string, country: Partial<Country>) => void;
  deleteCountry: (id: string) => void;
  // 新增：订单管理
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  // 新增：技师状态管理
  updateTechnicianStatus: (id: string, status: Technician['status']) => void;
  // 新增：业务设置管理
  updateBusinessSettings: (settings: BusinessSettings) => void;
  // 新增：公司分成方案管理
  addCompanyCommissionRule: (rule: Omit<CompanyCommissionRule, 'id'>) => void;
  updateCompanyCommissionRule: (id: string, rule: Partial<CompanyCommissionRule>) => void;
  deleteCompanyCommissionRule: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  rooms: [],
  serviceCategories: [],
  serviceItems: [],
  technicians: [],
  salespeople: [],
  countries: [], // 新增：国家列表
  orders: [], // 新增：订单列表
  companyCommissionRules: [], // 新增：公司分成方案列表
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // 初始化时从API加载数据
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setIsLoading(true);
        setIsConnected(false);
        
        // 并行加载所有数据
        const [rooms, serviceCategories, serviceItems, countries, salespeople, technicians, orders, businessSettings, companyCommissionRules] = await Promise.all([
          roomAPI.getAll(),
          serviceCategoryAPI.getAll(),
          serviceItemAPI.getAll(),
          countryAPI.getAll(),
          salespersonAPI.getAll(),
          technicianAPI.getAll(),
          orderAPI.getAll(),
          fetch(`${window.location.origin.replace(':5173', ':3001')}/api/business-settings`)
            .then(res => res.ok ? res.json() : null),
          companyCommissionRuleAPI.getAll()
        ]);
        
        const initialState: AppState = {
          rooms,
          serviceCategories,
          serviceItems,
          technicians,
          salespeople,
          countries,
          businessSettings: businessSettings || undefined,
          orders,
          companyCommissionRules
        };
        
        setState(initialState);
        setIsConnected(true);
      } catch (error) {
        console.error('加载状态失败:', error);
        setIsConnected(false);
        // 设置空状态，避免显示错误数据
        setState(initialState);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialState();
  }, []);

  // WebSocket连接和事件处理
  useEffect(() => {
    // 连接WebSocket
    websocketService.connect();

    // 监听数据更新事件
    const handleDataUpdate = (data: any) => {
      // WebSocket只负责通知，不直接操作状态
      // 状态更新通过API响应处理，避免重复操作
      switch (data.type) {
        // 所有WebSocket事件只记录通知，不更新状态
        case 'room-created':
        case 'room-updated':
        case 'room-deleted':
        case 'service-category-created':
        case 'service-category-updated':
        case 'service-category-deleted':
        case 'service-item-created':
        case 'service-item-updated':
        case 'service-item-deleted':
        case 'technician-created':
        case 'technician-updated':
        case 'technician-deleted':
        case 'technician-status-updated':
        case 'salesperson-created':
        case 'salesperson-updated':
        case 'salesperson-deleted':
        case 'country-created':
        case 'country-updated':
        case 'country-deleted':
        case 'order-created':
        case 'order-updated':
        case 'order-deleted':
          // 静默处理，不输出调试信息
          break;
        case 'order-status-updated':
          setState(prev => ({
            ...prev,
            orders: prev.orders.map(order => 
              order.id === data.data.id ? data.data : order
            )
          }));
          break;
        
        // 基础设置事件 - 需要更新订单管理
        case 'business-settings-updated':
          setState(prev => ({
            ...prev,
            businessSettings: data.data
          }));
          break;
        
        // 公司分成方案管理事件 - 静默处理，不直接操作状态
        case 'company-commission-rule-created':
        case 'company-commission-rule-updated':
        case 'company-commission-rule-deleted':
          // 静默处理，不输出调试信息
          break;
        
        default:
          console.log('未处理的数据更新类型:', data.type);
      }
    };

    websocketService.on('data-update', handleDataUpdate);

    // 清理函数
    return () => {
      websocketService.off('data-update', handleDataUpdate);
      websocketService.disconnect();
    };
  }, []);


  const addRoom = async (room: Omit<Room, 'id'>) => {
    try {
      const createdRoom = await roomAPI.create(room);
      setState(prev => ({
        ...prev,
        rooms: [...prev.rooms, createdRoom]
      }));
    } catch (error) {
      console.error('❌ 创建房间失败:', error);
    }
  };

  const addTemporaryRoom = async (name: string) => {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24小时后过期
      const createdRoom = await roomAPI.create({
        name: name,
        status: 'available',
        description: '临时房间 - 完成服务后自动销毁',
        isTemporary: true,
        expiresAt: expiresAt
      });
      
      setState(prev => ({
        ...prev,
        rooms: [...prev.rooms, createdRoom]
      }));
    } catch (error) {
      console.error('❌ 创建临时房间失败:', error);
    }
  };

  const updateRoom = async (id: string, room: Partial<Room>) => {
    try {
      const updatedRoom = await roomAPI.update(id, room);
      setState(prev => ({
        ...prev,
        rooms: prev.rooms.map(room => 
          room.id === id ? updatedRoom : room
        )
      }));
    } catch (error) {
      console.error('❌ 更新房间失败:', error);
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      await roomAPI.delete(id);
      setState(prev => ({
        ...prev,
        rooms: prev.rooms.filter(room => room.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除房间失败:', error);
    }
  };

  const addServiceCategory = async (category: Omit<ServiceCategory, 'id'>) => {
    try {
      const createdCategory = await serviceCategoryAPI.create(category);
      setState(prev => ({
        ...prev,
        serviceCategories: [...prev.serviceCategories, createdCategory]
      }));
    } catch (error) {
      console.error('❌ 创建服务分类失败:', error);
    }
  };

  const updateServiceCategory = async (id: string, category: Partial<ServiceCategory>) => {
    try {
      const updatedCategory = await serviceCategoryAPI.update(id, category);
      setState(prev => ({
        ...prev,
        serviceCategories: prev.serviceCategories.map(cat => 
          cat.id === id ? updatedCategory : cat
        )
      }));
    } catch (error) {
      console.error('❌ 更新服务分类失败:', error);
    }
  };

  const deleteServiceCategory = async (id: string) => {
    try {
      await serviceCategoryAPI.delete(id);
      setState(prev => ({
        ...prev,
        serviceCategories: prev.serviceCategories.filter(cat => cat.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除服务分类失败:', error);
    }
  };

  const addServiceItem = async (item: Omit<ServiceItem, 'id'>) => {
    try {
      const createdItem = await serviceItemAPI.create(item);
      setState(prev => ({
        ...prev,
        serviceItems: [...prev.serviceItems, createdItem]
      }));
    } catch (error) {
      console.error('❌ 创建服务项目失败:', error);
    }
  };

  const updateServiceItem = async (id: string, item: Partial<ServiceItem>) => {
    try {
      const updatedItem = await serviceItemAPI.update(id, item);
      setState(prev => ({
        ...prev,
        serviceItems: prev.serviceItems.map(serviceItem => 
          serviceItem.id === id ? updatedItem : serviceItem
        )
      }));
    } catch (error) {
      console.error('❌ 更新服务项目失败:', error);
    }
  };

  const deleteServiceItem = async (id: string) => {
    try {
      await serviceItemAPI.delete(id);
      setState(prev => ({
        ...prev,
        serviceItems: prev.serviceItems.filter(item => item.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除服务项目失败:', error);
    }
  };

  const addTechnician = async (technician: Omit<Technician, 'id'>) => {
    try {
      const createdTechnician = await technicianAPI.create(technician);
      setState(prev => ({
        ...prev,
        technicians: [...prev.technicians, createdTechnician]
      }));
    } catch (error) {
      console.error('❌ 创建技师失败:', error);
    }
  };

  const updateTechnician = async (id: string, technician: Partial<Technician>) => {
    try {
      const updatedTechnician = await technicianAPI.update(id, technician);
      setState(prev => ({
        ...prev,
        technicians: prev.technicians.map(tech => 
          tech.id === id ? updatedTechnician : tech
        )
      }));
    } catch (error) {
      console.error('❌ 更新技师失败:', error);
      throw error;
    }
  };

  const deleteTechnician = async (id: string) => {
    try {
      await technicianAPI.delete(id);
      setState(prev => ({
        ...prev,
        technicians: prev.technicians.filter(tech => tech.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除技师失败:', error);
    }
  };

  const addSalesperson = async (salesperson: Omit<Salesperson, 'id'>) => {
    try {
      const createdSalesperson = await salespersonAPI.create(salesperson);
      setState(prev => ({
        ...prev,
        salespeople: [...prev.salespeople, createdSalesperson]
      }));
    } catch (error) {
      console.error('❌ 创建销售员失败:', error);
    }
  };

  const updateSalesperson = async (id: string, salesperson: Partial<Salesperson>) => {
    try {
      const updatedSalesperson = await salespersonAPI.update(id, salesperson);
      setState(prev => ({
        ...prev,
        salespeople: prev.salespeople.map(sales => 
          sales.id === id ? updatedSalesperson : sales
        )
      }));
    } catch (error) {
      console.error('❌ 更新销售员失败:', error);
    }
  };

  const deleteSalesperson = async (id: string) => {
    try {
      await salespersonAPI.delete(id);
      setState(prev => ({
        ...prev,
        salespeople: prev.salespeople.filter(sales => sales.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除销售员失败:', error);
    }
  };



  // 国家管理方法
  const addCountry = async (country: Omit<Country, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const createdCountry = await countryAPI.create(country);
      setState(prev => ({
        ...prev,
        countries: [...prev.countries, createdCountry]
      }));
    } catch (error) {
      console.error('❌ 创建国家失败:', error);
    }
  };

  const updateCountry = async (id: string, country: Partial<Country>) => {
    try {
      const updatedCountry = await countryAPI.update(id, country);
      setState(prev => ({
        ...prev,
        countries: prev.countries.map(c => 
          c.id === id ? updatedCountry : c
        )
      }));
    } catch (error) {
      console.error('❌ 更新国家失败:', error);
    }
  };

  const deleteCountry = async (id: string) => {
    try {
      await countryAPI.delete(id);
      setState(prev => ({
        ...prev,
        countries: prev.countries.filter(country => country.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除国家失败:', error);
    }
  };

  // 新增：订单管理方法
  const addOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // 订单号由后端生成，前端不传id
      const createdOrder = await orderAPI.create(order);
      setState(prev => ({
        ...prev,
        orders: [...prev.orders, createdOrder]
      }));
      return createdOrder;
    } catch (error) {
      console.error('❌ 创建订单失败:', error);
      throw error;
    }
  };

  const updateOrder = async (id: string, order: Partial<Order>) => {
    try {
      const updatedOrder = await orderAPI.update(id, order);
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => 
          o.id === id ? updatedOrder : o
        )
      }));
    } catch (error) {
      console.error('❌ 更新订单失败:', error);
      throw error;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await orderAPI.delete(id);
      setState(prev => ({
        ...prev,
        orders: prev.orders.filter(order => order.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除订单失败:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      const updatedOrder = await orderAPI.updateStatus(id, status);
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => 
          o.id === id ? updatedOrder : o
        )
      }));
    } catch (error) {
      console.error('❌ 更新订单状态失败:', error);
      throw error;
    }
  };

  // 新增：技师状态管理
  const updateTechnicianStatus = async (id: string, status: Technician['status']) => {
    try {
      const updatedTechnician = await technicianAPI.updateStatus(id, status);
      setState(prev => ({
        ...prev,
        technicians: prev.technicians.map(tech => 
          tech.id === id ? updatedTechnician : tech
        )
      }));
    } catch (error) {
      console.error('❌ 更新技师状态失败:', error);
      throw error;
    }
  };

  // 新增：业务设置管理
  const updateBusinessSettings = async (settings: BusinessSettings) => {
    try {
      const response = await fetch(`${window.location.origin.replace(':5173', ':3001')}/api/business-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedSettings = await response.json();
      setState(prev => ({
        ...prev,
        businessSettings: updatedSettings
      }));

    } catch (error) {
      console.error('❌ 更新业务设置失败:', error);
    }
  };

  // 新增：公司分成方案管理
  const addCompanyCommissionRule = async (rule: Omit<CompanyCommissionRule, 'id'>) => {
    try {
      const createdRule = await companyCommissionRuleAPI.create(rule);
      setState(prev => ({
        ...prev,
        companyCommissionRules: [...prev.companyCommissionRules, createdRule]
      }));
    } catch (error) {
      console.error('❌ 创建公司分成方案失败:', error);
      throw error;
    }
  };

  const updateCompanyCommissionRule = async (id: string, rule: Partial<CompanyCommissionRule>) => {
    try {
      const updatedRule = await companyCommissionRuleAPI.update(id, rule);
      setState(prev => ({
        ...prev,
        companyCommissionRules: prev.companyCommissionRules.map(r => 
          r.id === id ? updatedRule : r
        )
      }));
    } catch (error) {
      console.error('❌ 更新公司分成方案失败:', error);
      throw error;
    }
  };

  const deleteCompanyCommissionRule = async (id: string) => {
    try {
      await companyCommissionRuleAPI.delete(id);
      setState(prev => ({
        ...prev,
        companyCommissionRules: prev.companyCommissionRules.filter(r => r.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除公司分成方案失败:', error);
      throw error;
    }
  };

  const value: AppContextType = {
    state,
    isLoading,
    isConnected,
    addRoom,
    addTemporaryRoom,
    updateRoom,
    deleteRoom,
    addServiceCategory,
    updateServiceCategory,
    deleteServiceCategory,
    addServiceItem,
    updateServiceItem,
    deleteServiceItem,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    addSalesperson,
    updateSalesperson,
    deleteSalesperson,

    addCountry,
    updateCountry,
    deleteCountry,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    updateTechnicianStatus,
    updateBusinessSettings,
    addCompanyCommissionRule,
    updateCompanyCommissionRule,
    deleteCompanyCommissionRule,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 