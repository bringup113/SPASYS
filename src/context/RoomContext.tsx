import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Room, RoomState } from '../types';
import { roomAPI } from '../services/api';
import { websocketService } from '../services/websocket';

interface RoomContextType extends RoomState {
  addRoom: (room: Omit<Room, 'id'>) => void;
  addTemporaryRoom: (name: string) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

const initialState: RoomState = {
  rooms: [],
  isLoading: false,
  error: null,
};

export function RoomProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RoomState>(initialState);

  // 初始化时加载房间数据
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setState((prev: RoomState) => ({ ...prev, isLoading: true, error: null }));
        const rooms = await roomAPI.getAll();
        setState((prev: RoomState) => ({ ...prev, rooms, isLoading: false }));
      } catch (error) {
        console.error('加载房间失败:', error);
        setState((prev: RoomState) => ({ 
          ...prev, 
          isLoading: false, 
          error: '加载房间失败' 
        }));
      }
    };

    loadRooms();
  }, []);

  // WebSocket监听房间更新
  useEffect(() => {
    const handleDataUpdate = (data: any) => {
      switch (data.type) {
        case 'room-created':
          setState((prev: RoomState) => ({
            ...prev,
            rooms: [...prev.rooms, data.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'room-updated':
          setState((prev: RoomState) => ({
            ...prev,
            rooms: prev.rooms.map((room: Room) => 
              room.id === data.data.id ? data.data : room
            ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'room-deleted':
          setState((prev: RoomState) => ({
            ...prev,
            rooms: prev.rooms.filter((room: Room) => room.id !== data.data.id)
          }));
          break;
      }
    };

    websocketService.on('data-update', handleDataUpdate);

    return () => {
      websocketService.off('data-update', handleDataUpdate);
    };
  }, []);

  const addRoom = async (room: Omit<Room, 'id'>) => {
    try {
      const createdRoom = await roomAPI.create(room);
      setState((prev: RoomState) => ({
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
      
      setState((prev: RoomState) => ({
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
      setState((prev: RoomState) => ({
        ...prev,
        rooms: prev.rooms.map((room: Room) => 
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
      setState((prev: RoomState) => ({
        ...prev,
        rooms: prev.rooms.filter((room: Room) => room.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除房间失败:', error);
    }
  };

  const value: RoomContextType = {
    ...state,
    addRoom,
    addTemporaryRoom,
    updateRoom,
    deleteRoom,
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
} 