import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ConnectionState } from '../types';
import { websocketService } from '../services/websocket';

interface ConnectionContextType extends ConnectionState {
  reconnect: () => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

const initialState: ConnectionState = {
  isConnected: false,
  isLoading: true,
  error: null,
};

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConnectionState>(initialState);

  // 初始化连接状态
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setState((prev: ConnectionState) => ({ ...prev, isLoading: true, error: null }));
        
        // 检查API连接
        const response = await fetch(`${window.location.origin.replace(':5173', ':3001')}/api/health`);
        if (response.ok) {
          // API健康检查成功，等待2秒确保服务器完全启动
          setTimeout(() => {
            setState((prev: ConnectionState) => ({ 
              ...prev, 
              isConnected: true, 
              isLoading: false 
            }));
          }, 2000);
        } else {
          throw new Error('API连接失败');
        }
      } catch (error) {
        console.error('连接检查失败:', error);
        setState((prev: ConnectionState) => ({ 
          ...prev, 
          isConnected: false, 
          isLoading: false, 
          error: '连接服务器失败' 
        }));
      }
    };

    checkConnection();
  }, []);

  // WebSocket连接状态监听
  useEffect(() => {
    const handleConnectionChange = (connected: boolean) => {
      setState((prev: ConnectionState) => ({
        ...prev,
        isConnected: connected,
        error: connected ? null : 'WebSocket连接断开'
      }));
    };

    // 使用新的连接状态监听
    websocketService.onConnectionChange(handleConnectionChange);

    return () => {
      websocketService.offConnectionChange(handleConnectionChange);
    };
  }, []);

  const reconnect = async () => {
    try {
      setState((prev: ConnectionState) => ({ ...prev, isLoading: true, error: null }));
      
      // 重新连接WebSocket
      websocketService.connect();
      
      // 检查API连接
      const response = await fetch(`${window.location.origin.replace(':5173', ':3001')}/api/health`);
      if (response.ok) {
        // API健康检查成功，等待2秒确保服务器完全启动
        setTimeout(() => {
          setState((prev: ConnectionState) => ({ 
            ...prev, 
            isConnected: true, 
            isLoading: false 
          }));
        }, 2000);
      } else {
        throw new Error('API连接失败');
      }
    } catch (error) {
      console.error('重新连接失败:', error);
      setState((prev: ConnectionState) => ({ 
        ...prev, 
        isConnected: false, 
        isLoading: false, 
        error: '重新连接失败' 
      }));
    }
  };

  const value: ConnectionContextType = {
    ...state,
    reconnect,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnectionContext() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnectionContext must be used within a ConnectionProvider');
  }
  return context;
} 