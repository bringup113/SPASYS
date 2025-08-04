import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Order, OrderStatus, OrderState } from '../types';
import { orderAPI } from '../services/api';
import { websocketService } from '../services/websocket';

interface OrderContextType extends OrderState {
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const initialState: OrderState = {
  orders: [],
  isLoading: false,
  error: null,
};

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OrderState>(initialState);

  // 初始化时加载订单数据
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setState((prev: OrderState) => ({ ...prev, isLoading: true, error: null }));
        const orders = await orderAPI.getAll();
        setState((prev: OrderState) => ({ ...prev, orders, isLoading: false }));
      } catch (error) {
        console.error('加载订单失败:', error);
        setState((prev: OrderState) => ({ 
          ...prev, 
          isLoading: false, 
          error: '加载订单失败' 
        }));
      }
    };

    loadOrders();
  }, []);

  // WebSocket监听订单更新
  useEffect(() => {
    const handleDataUpdate = (data: any) => {
      switch (data.type) {
        case 'order-created':
          setState((prev: OrderState) => ({
            ...prev,
            orders: [...prev.orders, data.data]
          }));
          break;
        case 'order-updated':
          setState((prev: OrderState) => ({
            ...prev,
            orders: prev.orders.map((order: Order) => 
              order.id === data.data.id ? data.data : order
            )
          }));
          break;
        case 'order-deleted':
          setState((prev: OrderState) => ({
            ...prev,
            orders: prev.orders.filter((order: Order) => order.id !== data.data.id)
          }));
          break;
        case 'order-status-updated':
          setState((prev: OrderState) => ({
            ...prev,
            orders: prev.orders.map((order: Order) => 
              order.id === data.data.id ? data.data : order
            )
          }));
          break;
      }
    };

    websocketService.on('data-update', handleDataUpdate);

    return () => {
      websocketService.off('data-update', handleDataUpdate);
    };
  }, []);

  const addOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const createdOrder = await orderAPI.create(order);
      setState((prev: OrderState) => ({
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
      setState((prev: OrderState) => ({
        ...prev,
        orders: prev.orders.map((o: Order) => 
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
      setState((prev: OrderState) => ({
        ...prev,
        orders: prev.orders.filter((order: Order) => order.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除订单失败:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      const updatedOrder = await orderAPI.updateStatus(id, status);
      setState((prev: OrderState) => ({
        ...prev,
        orders: prev.orders.map((o: Order) => 
          o.id === id ? updatedOrder : o
        )
      }));
    } catch (error) {
      console.error('❌ 更新订单状态失败:', error);
      throw error;
    }
  };

  const value: OrderContextType = {
    ...state,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderContext() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
} 