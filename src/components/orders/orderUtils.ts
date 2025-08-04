import { OrderStatus } from '../../types';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

// 获取服务名称
export const getServiceName = (serviceId: string, serviceItems: any[] | undefined) => {
  const service = serviceItems?.find(s => s.id === serviceId);
  return service ? service.name : '未知服务';
};

// 获取技师显示信息
export const getTechnicianDisplay = (
  technicianId: string | undefined, 
  technicianName: string | undefined, 
  technicians: any[] | undefined
) => {
  // 优先使用订单中保存的技师工号快照
  if (technicianName) {
    // 检查技师是否还存在
    const technician = technicianId ? technicians?.find(t => t.id === technicianId) : null;
    
    if (technician) {
      // 技师存在，正常显示
      return {
        text: technicianName,
        isDeparted: false,
        tooltip: ''
      };
    } else {
      // 技师不存在，显示红色标识
      return {
        text: technicianName,
        isDeparted: true,
        tooltip: '该技师已离职'
      };
    }
  } else {
    // 没有技师信息
    return {
      text: '未知技师',
      isDeparted: true,
      tooltip: '该技师已离职'
    };
  }
};

// 获取房间名称
export const getRoomName = (roomId: string, roomName: string | undefined, rooms: any[] | undefined) => {
  // 优先使用订单中保存的房间名称快照
  if (roomName) {
    return roomName;
  }
  // 如果快照不存在，则从当前房间列表中查找
  const room = rooms?.find(r => r.id === roomId);
  return room ? room.name : '未知房间';
};

// 获取状态颜色
export const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// 获取状态文本
export const getStatusText = (status: OrderStatus) => {
  switch (status) {
    case 'in_progress': return '进行中';
    case 'completed': return '已完成';
    case 'cancelled': return '已取消';
    default: return status;
  }
};

// 获取状态图标
export const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'in_progress': return AlertCircle;
    case 'completed': return CheckCircle;
    case 'cancelled': return XCircle;
    default: return AlertCircle;
  }
}; 