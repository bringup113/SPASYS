import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Salesperson, SalespersonState } from '../types';
import { salespersonAPI } from '../services/api';
import { websocketService } from '../services/websocket';

interface SalespersonContextType extends SalespersonState {
  addSalesperson: (salesperson: Omit<Salesperson, 'id'>) => void;
  updateSalesperson: (id: string, salesperson: Partial<Salesperson>) => void;
  deleteSalesperson: (id: string) => void;
}

const SalespersonContext = createContext<SalespersonContextType | undefined>(undefined);

const initialState: SalespersonState = {
  salespeople: [],
  isLoading: false,
  error: null,
};

export function SalespersonProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SalespersonState>(initialState);

  // 初始化时加载销售员数据
  useEffect(() => {
    const loadSalespeople = async () => {
      try {
        setState((prev: SalespersonState) => ({ ...prev, isLoading: true, error: null }));
        const salespeople = await salespersonAPI.getAll();
        setState((prev: SalespersonState) => ({ ...prev, salespeople, isLoading: false }));
      } catch (error) {
        console.error('加载销售员失败:', error);
        setState((prev: SalespersonState) => ({ 
          ...prev, 
          isLoading: false, 
          error: '加载销售员失败' 
        }));
      }
    };

    loadSalespeople();
  }, []);

  // WebSocket监听销售员更新
  useEffect(() => {
    const handleDataUpdate = (data: any) => {
      switch (data.type) {
        case 'salesperson-created':
          setState((prev: SalespersonState) => ({
            ...prev,
            salespeople: [...prev.salespeople, data.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'salesperson-updated':
          setState((prev: SalespersonState) => ({
            ...prev,
            salespeople: prev.salespeople.map((salesperson: Salesperson) => 
              salesperson.id === data.data.id ? data.data : salesperson
            ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'salesperson-deleted':
          setState((prev: SalespersonState) => ({
            ...prev,
            salespeople: prev.salespeople.filter((salesperson: Salesperson) => salesperson.id !== data.data.id)
          }));
          break;
      }
    };

    websocketService.on('data-update', handleDataUpdate);

    return () => {
      websocketService.off('data-update', handleDataUpdate);
    };
  }, []);

  const addSalesperson = async (salesperson: Omit<Salesperson, 'id'>) => {
    try {
      const createdSalesperson = await salespersonAPI.create(salesperson);
      setState((prev: SalespersonState) => ({
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
      setState((prev: SalespersonState) => ({
        ...prev,
        salespeople: prev.salespeople.map((sales: Salesperson) => 
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
      setState((prev: SalespersonState) => ({
        ...prev,
        salespeople: prev.salespeople.filter((sales: Salesperson) => sales.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除销售员失败:', error);
    }
  };

  const value: SalespersonContextType = {
    ...state,
    addSalesperson,
    updateSalesperson,
    deleteSalesperson,
  };

  return (
    <SalespersonContext.Provider value={value}>
      {children}
    </SalespersonContext.Provider>
  );
}

export function useSalespersonContext() {
  const context = useContext(SalespersonContext);
  if (context === undefined) {
    throw new Error('useSalespersonContext must be used within a SalespersonProvider');
  }
  return context;
} 