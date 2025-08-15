import React, { useState, useEffect, useCallback } from 'react';
import { useServiceContext } from '../../context/ServiceContext';
import { useTechnicianContext } from '../../context/TechnicianContext';
import { useSettingsContext } from '../../context/SettingsContext';
import { AlertTriangle, Timer, CheckCircle } from 'lucide-react';
import { OrderItem } from '../../types';
import { formatCurrency } from '../../utils/currencyUtils';

interface RoomCardProps {
  room: any;
  onRoomClick: (room: any) => void;
  currentOrder?: any;
}

const RoomCard = React.memo(function RoomCard({ room, onRoomClick, currentOrder }: RoomCardProps) {
  const { serviceItems } = useServiceContext();
  const { technicians } = useTechnicianContext();
  const { businessSettings } = useSettingsContext();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isOverdue, setIsOverdue] = useState(false);

  const getServiceName = useCallback((serviceId: string, serviceName?: string) => {
    // 优先使用服务名称快照
    if (serviceName) {
      return serviceName;
    }
    
    // 如果快照不存在，则从当前服务列表中查找
    const service = serviceItems?.find((s: any) => s.id === serviceId);
    return service ? service.name : '未知服务';
  }, [serviceItems]);

  useEffect(() => {
    if (currentOrder && currentOrder.status === 'in_progress') {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const startTime = new Date(currentOrder.createdAt).getTime();
        const totalDuration = currentOrder.items.reduce((total: number, item: OrderItem) => {
          const service = serviceItems?.find((s: any) => s.id === item.serviceId);
          return total + (service?.duration || 0);
        }, 0);
        const endTime = startTime + (totalDuration * 60 * 1000);
        const remaining = endTime - now;
        
        if (remaining <= 0) {
          setIsOverdue(true);
          setTimeLeft(0);
        } else {
          setTimeLeft(Math.floor(remaining / 1000));
          setIsOverdue(false);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentOrder, serviceItems]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getStatusColor = useCallback(() => {
    if (room.status === 'available') return 'bg-green-100 border-green-300';
    if (room.status === 'occupied') return 'bg-orange-100 border-orange-300';
    if (room.status === 'maintenance') return 'bg-red-100 border-red-300';
    return 'bg-gray-100 border-gray-300';
  }, [room.status]);



  return (
    <div 
      className={`relative p-6 border-0 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${getStatusColor()}`}
      onClick={() => onRoomClick(room)}
      style={{
        background: room.status === 'available' 
          ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
          : room.status === 'occupied'
          ? 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)'
          : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)'
      }}
    >
      {/* 装饰性背景元素 */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
      </div>
      
      {/* 超时提醒 */}
      {isOverdue && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full p-2 shadow-lg">
          <AlertTriangle className="h-4 w-4" />
        </div>
      )}
      
      {/* 倒计时 */}
      {currentOrder && currentOrder.status === 'in_progress' && timeLeft > 0 && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full px-3 py-2 text-xs shadow-lg">
          <Timer className="h-3 w-3 inline mr-1" />
          {formatTime(timeLeft)}
        </div>
      )}
      
      {/* 收款状态标识 */}
      {currentOrder && currentOrder.receivedAmount && parseFloat(currentOrder.receivedAmount) > 0 && (
        <div className="absolute top-8 -right-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full px-3 py-2 text-xs shadow-lg">
          <CheckCircle className="h-3 w-3 inline mr-1" />
          已收款
        </div>
      )}

      <div className="relative z-10">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-80 rounded-full mb-3 shadow-sm">
            <h3 className="font-bold text-2xl text-gray-800">
              {room.name}
            </h3>
          </div>
          <div className="flex items-center justify-center space-x-2">
            {room.isTemporary && (
              <span className="inline-block bg-gradient-to-r from-purple-400 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                临时
              </span>
            )}
          </div>
        </div>
        
        {currentOrder && currentOrder.items && currentOrder.items.length > 0 && (
          <div className="space-y-3">
            <div className="space-y-3">
              {currentOrder.items.map((item: OrderItem, index: number) => {
                const technician = technicians?.find((t: any) => t.id === item.technicianId);
                
                return (
                  <div key={index} className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-50 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{getServiceName(item.serviceId, item.serviceName)}</span>
                      <span className="text-sm font-medium text-blue-600">{formatCurrency(item.price, businessSettings)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        技师: {technician?.employeeId || '未知技师'}
                      </span>
                      {item.technicianCommission > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          抽成: {formatCurrency(item.technicianCommission, businessSettings)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default RoomCard; 