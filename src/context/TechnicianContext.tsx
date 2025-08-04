import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { Technician, TechnicianStatus, TechnicianState } from '../types';
import { technicianAPI } from '../services/api';
import { websocketService } from '../services/websocket';

interface TechnicianContextType extends TechnicianState {
  addTechnician: (technician: Omit<Technician, 'id'>) => void;
  updateTechnician: (id: string, technician: Partial<Technician>) => void;
  deleteTechnician: (id: string) => void;
  updateTechnicianStatus: (id: string, status: TechnicianStatus) => void;
}

const TechnicianContext = createContext<TechnicianContextType | undefined>(undefined);

const initialState: TechnicianState = {
  technicians: [],
  isLoading: false,
  error: null,
};

export function TechnicianProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TechnicianState>(initialState);

  // 初始化时加载技师数据
  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        setState((prev: TechnicianState) => ({ ...prev, isLoading: true, error: null }));
        const technicians = await technicianAPI.getAll();
        setState((prev: TechnicianState) => ({ ...prev, technicians, isLoading: false }));
      } catch (error) {
        console.error('加载技师失败:', error);
        setState((prev: TechnicianState) => ({ 
          ...prev, 
          isLoading: false, 
          error: '加载技师失败' 
        }));
      }
    };

    loadTechnicians();
  }, []);

  // WebSocket监听技师更新
  useEffect(() => {
    const handleDataUpdate = (data: any) => {
      switch (data.type) {
        case 'technician-created':
          setState((prev: TechnicianState) => ({
            ...prev,
            technicians: [...prev.technicians, data.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'technician-updated':
          setState((prev: TechnicianState) => ({
            ...prev,
            technicians: prev.technicians.map((technician: Technician) => 
              technician.id === data.data.id ? data.data : technician
            ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'technician-deleted':
          setState((prev: TechnicianState) => ({
            ...prev,
            technicians: prev.technicians.filter((technician: Technician) => technician.id !== data.data.id)
          }));
          break;
        case 'technician-status-updated':
          setState((prev: TechnicianState) => ({
            ...prev,
            technicians: prev.technicians.map((technician: Technician) => 
              technician.id === data.data.id ? data.data : technician
            ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
      }
    };

    websocketService.on('data-update', handleDataUpdate);

    return () => {
      websocketService.off('data-update', handleDataUpdate);
    };
  }, []);

  const addTechnician = useCallback(async (technician: Omit<Technician, 'id'>) => {
    try {
      const createdTechnician = await technicianAPI.create(technician);
      setState((prev: TechnicianState) => ({
        ...prev,
        technicians: [...prev.technicians, createdTechnician]
      }));
    } catch (error) {
      console.error('❌ 创建技师失败:', error);
    }
  }, []);

  const updateTechnician = useCallback(async (id: string, technician: Partial<Technician>) => {
    try {
      const updatedTechnician = await technicianAPI.update(id, technician);
      setState((prev: TechnicianState) => ({
        ...prev,
        technicians: prev.technicians.map((tech: Technician) => 
          tech.id === id ? updatedTechnician : tech
        )
      }));
    } catch (error) {
      console.error('❌ 更新技师失败:', error);
      throw error;
    }
  }, []);

  const deleteTechnician = useCallback(async (id: string) => {
    try {
      await technicianAPI.delete(id);
      setState((prev: TechnicianState) => ({
        ...prev,
        technicians: prev.technicians.filter((tech: Technician) => tech.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除技师失败:', error);
      throw error; // 抛出错误，让调用者处理
    }
  }, []);

  const updateTechnicianStatus = useCallback(async (id: string, status: TechnicianStatus) => {
    try {
      const updatedTechnician = await technicianAPI.updateStatus(id, status);
      setState((prev: TechnicianState) => ({
        ...prev,
        technicians: prev.technicians.map((tech: Technician) => 
          tech.id === id ? updatedTechnician : tech
        )
      }));
    } catch (error) {
      console.error('❌ 更新技师状态失败:', error);
      throw error;
    }
  }, []);

  const value: TechnicianContextType = useMemo(() => ({
    ...state,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    updateTechnicianStatus,
  }), [state, addTechnician, updateTechnician, deleteTechnician, updateTechnicianStatus]);

  return (
    <TechnicianContext.Provider value={value}>
      {children}
    </TechnicianContext.Provider>
  );
}

export function useTechnicianContext() {
  const context = useContext(TechnicianContext);
  if (context === undefined) {
    throw new Error('useTechnicianContext must be used within a TechnicianProvider');
  }
  return context;
} 