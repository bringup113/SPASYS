import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ServiceCategory, ServiceItem, ServiceState } from '../types';
import { serviceCategoryAPI, serviceItemAPI } from '../services/api';
import { websocketService } from '../services/websocket';

interface ServiceContextType extends ServiceState {
  addServiceCategory: (category: Omit<ServiceCategory, 'id'>) => void;
  updateServiceCategory: (id: string, category: Partial<ServiceCategory>) => void;
  deleteServiceCategory: (id: string) => void;
  addServiceItem: (item: Omit<ServiceItem, 'id'>) => void;
  updateServiceItem: (id: string, item: Partial<ServiceItem>) => void;
  deleteServiceItem: (id: string) => void;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

const initialState: ServiceState = {
  serviceCategories: [],
  serviceItems: [],
  isLoading: false,
  error: null,
};

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ServiceState>(initialState);

  // 初始化时加载服务数据
  useEffect(() => {
    const loadServices = async () => {
      try {
        setState((prev: ServiceState) => ({ ...prev, isLoading: true, error: null }));
        const [serviceCategories, serviceItems] = await Promise.all([
          serviceCategoryAPI.getAll(),
          serviceItemAPI.getAll()
        ]);
        setState((prev: ServiceState) => ({ 
          ...prev, 
          serviceCategories, 
          serviceItems, 
          isLoading: false 
        }));
      } catch (error) {
        console.error('加载服务数据失败:', error);
        setState((prev: ServiceState) => ({ 
          ...prev, 
          isLoading: false, 
          error: '加载服务数据失败' 
        }));
      }
    };

    loadServices();
  }, []);

  // WebSocket监听服务更新
  useEffect(() => {
    const handleDataUpdate = (data: any) => {
      switch (data.type) {
        case 'service-category-created':
          setState((prev: ServiceState) => ({
            ...prev,
            serviceCategories: [...prev.serviceCategories, data.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'service-category-updated':
          setState((prev: ServiceState) => ({
            ...prev,
            serviceCategories: prev.serviceCategories.map((category: ServiceCategory) => 
              category.id === data.data.id ? data.data : category
            ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'service-category-deleted':
          setState((prev: ServiceState) => ({
            ...prev,
            serviceCategories: prev.serviceCategories.filter((category: ServiceCategory) => category.id !== data.data.id)
          }));
          break;
        case 'service-item-created':
          setState((prev: ServiceState) => ({
            ...prev,
            serviceItems: [...prev.serviceItems, data.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'service-item-updated':
          setState((prev: ServiceState) => ({
            ...prev,
            serviceItems: prev.serviceItems.map((item: ServiceItem) => 
              item.id === data.data.id ? data.data : item
            ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'service-item-deleted':
          setState((prev: ServiceState) => ({
            ...prev,
            serviceItems: prev.serviceItems.filter((item: ServiceItem) => item.id !== data.data.id)
          }));
          break;
      }
    };

    websocketService.on('data-update', handleDataUpdate);

    return () => {
      websocketService.off('data-update', handleDataUpdate);
    };
  }, []);

  const addServiceCategory = async (category: Omit<ServiceCategory, 'id'>) => {
    try {
      const createdCategory = await serviceCategoryAPI.create(category);
      setState((prev: ServiceState) => ({
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
      setState((prev: ServiceState) => ({
        ...prev,
        serviceCategories: prev.serviceCategories.map((cat: ServiceCategory) => 
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
      setState((prev: ServiceState) => ({
        ...prev,
        serviceCategories: prev.serviceCategories.filter((cat: ServiceCategory) => cat.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除服务分类失败:', error);
    }
  };

  const addServiceItem = async (item: Omit<ServiceItem, 'id'>) => {
    try {
      const createdItem = await serviceItemAPI.create(item);
      setState((prev: ServiceState) => ({
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
      setState((prev: ServiceState) => ({
        ...prev,
        serviceItems: prev.serviceItems.map((serviceItem: ServiceItem) => 
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
      setState((prev: ServiceState) => ({
        ...prev,
        serviceItems: prev.serviceItems.filter((item: ServiceItem) => item.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除服务项目失败:', error);
    }
  };

  const value: ServiceContextType = {
    ...state,
    addServiceCategory,
    updateServiceCategory,
    deleteServiceCategory,
    addServiceItem,
    updateServiceItem,
    deleteServiceItem,
  };

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServiceContext() {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServiceContext must be used within a ServiceProvider');
  }
  return context;
} 