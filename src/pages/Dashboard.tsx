import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Building2, 
  Package, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  AlertTriangle,
  Play,
  Timer,
  CreditCard,
  Trash2
} from 'lucide-react';
import { OrderStatus, OrderItem } from '../types';
import { formatCurrency } from '../utils/currencyUtils';
import { CommissionCalculator } from '../utils/commissionUtils';
import Notification from '../components/Notification';

interface RoomCardProps {
  room: any;
  onRoomClick: (room: any) => void;
  currentOrder?: any;
}

function RoomCard({ room, onRoomClick, currentOrder }: RoomCardProps) {
  const { state } = useAppContext();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isOverdue, setIsOverdue] = useState(false);

  const getServiceName = (serviceId: string) => {
    const service = state.serviceItems?.find((s: any) => s.id === serviceId);
    return service ? service.name : '未知服务';
  };



  useEffect(() => {
    if (currentOrder && currentOrder.status === 'in_progress') {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const startTime = new Date(currentOrder.updatedAt).getTime();
        const totalDuration = currentOrder.items.reduce((total: number, item: OrderItem) => {
          const service = state.serviceItems?.find((s: any) => s.id === item.serviceId);
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
  }, [currentOrder, state.serviceItems]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (room.status === 'available') return 'bg-green-100 border-green-300';
    if (room.status === 'occupied') return 'bg-orange-100 border-orange-300';
    if (room.status === 'maintenance') return 'bg-red-100 border-red-300';
    return 'bg-gray-100 border-gray-300';
  };

  const getStatusText = () => {
    if (room.status === 'available') return '可用';
    if (room.status === 'occupied') return '使用中';
    if (room.status === 'maintenance') return '维护中';
    return room.status;
  };

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

      <div className="relative z-10">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-80 rounded-full mb-3 shadow-sm">
            <h3 className="font-bold text-2xl text-gray-800">
              {room.name}
            </h3>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <p className="text-sm font-medium text-gray-700">{getStatusText()}</p>
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
                const technician = state.technicians?.find((t: any) => t.id === item.technicianId);
                
                return (
                  <div key={index} className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-50 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{getServiceName(item.serviceId)}</span>
                      <span className="text-sm font-medium text-blue-600">{formatCurrency(item.price, state)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        技师: {technician?.employeeId || '未知技师'}
                      </span>
                      {item.technicianCommission > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          抽成: {formatCurrency(item.technicianCommission, state)}
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
}

export default function Dashboard() {
  const { 
    state, 
    addOrder, 
    updateOrder, 
    updateOrderStatus,
    updateRoom, 
    updateTechnicianStatus,
    addTemporaryRoom,
    deleteRoom
  } = useAppContext();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [modalStep, setModalStep] = useState<'service' | 'technician'>('service');
  const [showServiceManagementModal, setShowServiceManagementModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [checkoutData, setCheckoutData] = useState({
    customerName: '',
    selectedSalespersonId: '',
    receivedAmount: ''
  });

  const [showTemporaryRoomModal, setShowTemporaryRoomModal] = useState(false);
  const [temporaryRoomName, setTemporaryRoomName] = useState('');
  const [deletingItem, setDeletingItem] = useState<{ index: number; item: OrderItem } | null>(null);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  
  // 通知状态
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'warning' });
  
  // 显示通知
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // 监听状态变化
  useEffect(() => {
    // 状态更新完成，无需强制刷新
  }, [state.rooms, state.orders, state.technicians]);

  // 监听当前订单变化，确保左侧列表实时更新
  useEffect(() => {
    if (currentOrder) {
      // 状态更新完成，无需强制刷新
    }
  }, [state.orders, currentOrder]);

  // 检查并删除过期的临时房间
  useEffect(() => {
    const checkExpiredRooms = () => {
      const now = new Date();
      state.rooms?.forEach(room => {
        if (room.isTemporary && room.expiresAt) {
          const expiresAt = new Date(room.expiresAt);
          if (now > expiresAt) {
            deleteRoom(room.id);
          }
        }
      });
    };

    checkExpiredRooms();
    const interval = setInterval(checkExpiredRooms, 60000); // 每分钟检查一次

    return () => clearInterval(interval);
  }, [state.rooms, deleteRoom]);

  const stats = [
    {
      name: '房间总数',
      value: state.rooms?.length || 0,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: '可用房间',
      value: state.rooms?.filter(room => room.status === 'available').length || 0,
      icon: Building2,
      color: 'bg-green-500',
    },
    {
      name: '可用技师',
      value: state.technicians?.filter(tech => tech.status === 'available').length || 0,
      icon: Users,
      color: 'bg-orange-500',
    },
    {
      name: '进行中订单',
      value: state.orders?.filter(order => order.status === 'in_progress').length || 0,
      icon: Clock,
      color: 'bg-purple-500',
    },
  ];

  const handleRoomClick = async (room: any) => {
    if (room.status === 'available') {
      // 创建临时订单对象（不保存到数据库）
      const tempOrder = {
        id: `temp-${Date.now()}`, // 临时ID
        roomId: room.id,
        roomName: room.name,
        customerName: '散客',
        customerPhone: '',
        status: 'in_progress' as OrderStatus,
        items: [],
        totalAmount: 0,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 重置所有选择状态
      setSelectedService(null);
      setModalStep('service');
      setIsCheckoutMode(false);
      
      // 设置当前订单并显示服务管理模态框
      setSelectedRoom(room);
      setCurrentOrder(tempOrder);
      setShowServiceManagementModal(true);
    } else if (room.status === 'occupied') {
      // 查找该房间的进行中订单
      const roomOrder = state.orders?.find(order => 
        order.roomId === room.id && order.status === 'in_progress'
      );
      
      if (roomOrder) {
        // 重置所有选择状态
        setSelectedService(null);
        setModalStep('service');
        setIsCheckoutMode(false);
        
        setSelectedRoom(room);
        setCurrentOrder(roomOrder);
        setShowServiceManagementModal(true);
      } else {
        showNotification('未找到该房间的订单信息', 'error');
      }
    }
  };





  const getServiceName = (serviceId: string) => {
    const service = state.serviceItems?.find(s => s.id === serviceId);
    return service ? service.name : '未知服务';
  };

  const getTechnicianName = (technicianId: string) => {
    const technician = state.technicians?.find(t => t.id === technicianId);
    return technician ? technician.employeeId : '未知技师';
  };

  const getCountryName = (countryId: string) => {
    const country = state.countries?.find(c => c.id === countryId);
    return country ? country.name : '未知国家';
  };









  // 重置结账状态的公共函数
  const resetCheckoutState = () => {
    setIsCheckoutMode(false);
    setCurrentOrder(null);
    setCheckoutData({
      customerName: '',
      selectedSalespersonId: '',
      receivedAmount: ''
    });
    setShowServiceManagementModal(false);
  };

  // 处理结账（仅结账，不完成服务）
  const handleCheckout = async () => {
    if (!currentOrder) {
      showNotification('没有可结账的订单', 'error');
      return;
    }

    // 检查是否是临时订单
    if (currentOrder.id.startsWith('temp-')) {
      showNotification('请先添加至少一项服务后再结账', 'error');
      return;
    }

    try {
      // 使用实收金额，如果没有输入则使用换算后的金额
      const receivedAmount = parseFloat(checkoutData.receivedAmount) || currentOrder.totalAmount;

      // 更新订单项目，为每个项目分配销售员信息
      const salesperson = checkoutData.selectedSalespersonId ? state.salespeople?.find(s => s.id === checkoutData.selectedSalespersonId) : null;
      const discountRate = CommissionCalculator.calculateDiscountRate(receivedAmount, currentOrder.totalAmount);
      
      const updatedItems = currentOrder.items.map((item: any) => {
        // 1. 先计算销售员抽成
        const itemCommission = CommissionCalculator.calculateSalespersonCommission(
          item,
          salesperson,
          discountRate
        );
        
        // 2. 创建包含销售员提成的对象，用于计算公司分成
        const itemWithSalespersonCommission = {
          ...item,
          salespersonCommission: itemCommission
        };
        
        // 3. 再计算公司抽成（基于减去销售员提成后的利润）
        const companyCommissionRule = state.companyCommissionRules?.find(
          rule => rule.id === item.companyCommissionRuleId
        );
        
        const itemCompanyCommission = companyCommissionRule ? 
          CommissionCalculator.calculateItemCompanyCommission(itemWithSalespersonCommission, discountRate, companyCommissionRule) : 0;

        return {
          ...item,
          salespersonId: checkoutData.selectedSalespersonId || null,
          salespersonName: salesperson?.name || null,
          salespersonCommission: itemCommission,
          companyCommissionAmount: itemCompanyCommission
        };
      });

      await updateOrder(currentOrder.id, {
        customerName: checkoutData.customerName,
        receivedAmount: receivedAmount,
        items: updatedItems,
        notes: '已结账，服务进行中'
      });

      showNotification('结账成功！', 'success');
      resetCheckoutState();
    } catch (error) {
      console.error('结账失败:', error);
      showNotification('结账失败，请重试', 'error');
    }
  };

  // 处理完成服务并结账
  // 仅完成服务（已结账的情况下）
  const handleCompleteServiceOnly = async () => {
    console.log('🔍 仅完成服务函数被调用');
    if (!currentOrder) {
      showNotification('没有可完成的订单', 'error');
      return;
    }

    // 检查是否是临时订单
    if (currentOrder.id.startsWith('temp-')) {
      showNotification('请先添加至少一项服务后再完成服务', 'error');
      return;
    }

    try {
      // 并行执行所有异步操作
      await Promise.all([
        // 更新订单状态为已完成
        updateOrder(currentOrder.id, {
          status: 'completed',
          completedAt: new Date().toISOString()
        }),
        // 处理房间状态
        (async () => {
          const room = state.rooms?.find(r => r.id === currentOrder.roomId);
          if (room?.isTemporary) {
            await deleteRoom(room.id);
          } else {
            await updateRoom(currentOrder.roomId, { status: 'available' });
          }
        })(),
        // 更新技师状态
        ...currentOrder.items.map((item: OrderItem) => item.technicianId ? updateTechnicianStatus(item.technicianId, 'available') : Promise.resolve())
      ]);

      showNotification('服务完成成功！', 'success');
      resetCheckoutState();
    } catch (error) {
      console.error('完成服务失败:', error);
      showNotification('完成服务失败，请重试', 'error');
    }
  };
  

  // 处理完成服务并结账
  // 处理删除项目
  const handleDeleteItem = (index: number, item: OrderItem) => {
    setDeletingItem({ index, item });
    setShowDeleteItemModal(true);
  };

  // 确认删除项目
  const confirmDeleteItem = async () => {
    if (!deletingItem || !currentOrder) return;

    const { index, item } = deletingItem;
    const updatedItems = currentOrder.items.filter((_: OrderItem, i: number) => i !== index);
    const newTotal = updatedItems.reduce((sum: number, item: OrderItem) => sum + item.price, 0);

    // 检查是否是最后一个项目
    const isLastItem = currentOrder.items.length === 1;

    try {
      if (isLastItem) {
        // 删除最后一个项目，取消整个订单
        await updateOrderStatus(currentOrder.id, 'cancelled');
        await updateRoom(currentOrder.roomId, { status: 'available' });
        showNotification('已删除最后一个项目，订单已取消', 'success');
        setShowServiceManagementModal(false);
      } else {
        // 删除非最后一个项目，更新订单
        await updateOrder(currentOrder.id, {
          items: updatedItems,
          totalAmount: newTotal
        });
        showNotification('项目删除成功', 'success');
      }

      // 更新技师状态
      if (item.technicianId) {
        // 检查技师是否还有其他进行中的项目
        const hasOtherInProgressItems = state.orders?.some(o => 
          o.status === 'in_progress' && 
          o.id !== currentOrder.id &&
          o.items.some(i => i.technicianId === item.technicianId)
        );

        if (!hasOtherInProgressItems) {
          // 如果没有其他进行中的项目，设为可用
          await updateTechnicianStatus(item.technicianId, 'available');
        }
      }

      // 立即更新本地状态以确保UI响应
      setCurrentOrder((prev: any) => prev ? {
        ...prev,
        items: updatedItems,
        totalAmount: newTotal
      } : null);

      setShowDeleteItemModal(false);
      setDeletingItem(null);
    } catch (error) {
      showNotification('删除项目失败，请重试', 'error');
    }
  };

  const handleCompleteServiceAndCheckout = async () => {
    console.log('🔍 完成服务并结账函数被调用');
    if (!currentOrder) {
      showNotification('没有可完成的订单', 'error');
      return;
    }

    // 检查是否是临时订单
    if (currentOrder.id.startsWith('temp-')) {
      showNotification('请先添加至少一项服务后再完成服务', 'error');
      return;
    }

    try {
      // 使用实收金额，如果没有输入则使用换算后的金额
      const receivedAmount = parseFloat(checkoutData.receivedAmount) || currentOrder.totalAmount;

      // 更新订单项目，为每个项目分配销售员信息
      const salesperson = checkoutData.selectedSalespersonId ? state.salespeople?.find(s => s.id === checkoutData.selectedSalespersonId) : null;
      const discountRate = CommissionCalculator.calculateDiscountRate(receivedAmount, currentOrder.totalAmount);
      
      const updatedItems = currentOrder.items.map((item: any) => {
        // 1. 先计算销售员抽成
        const itemCommission = CommissionCalculator.calculateSalespersonCommission(
          item,
          salesperson,
          discountRate
        );
        
        // 2. 创建包含销售员提成的对象，用于计算公司分成
        const itemWithSalespersonCommission = {
          ...item,
          salespersonCommission: itemCommission
        };
        
        // 3. 再计算公司抽成（基于减去销售员提成后的利润）
        const companyCommissionRule = state.companyCommissionRules?.find(
          rule => rule.id === item.companyCommissionRuleId
        );
        
        const itemCompanyCommission = companyCommissionRule ? 
          CommissionCalculator.calculateItemCompanyCommission(itemWithSalespersonCommission, discountRate, companyCommissionRule) : 0;

        return {
          ...item,
          salespersonId: checkoutData.selectedSalespersonId || null,
          salespersonName: salesperson?.name || null,
          salespersonCommission: itemCommission,
          companyCommissionAmount: itemCompanyCommission
        };
      });



      // 并行执行所有异步操作
      await Promise.all([
        // 更新订单信息
        updateOrder(currentOrder.id, {
          customerName: checkoutData.customerName,
          receivedAmount: receivedAmount,
          items: updatedItems,
          status: 'completed',
          completedAt: new Date().toISOString()
        }),
        // 处理房间状态
        (async () => {
          const room = state.rooms?.find(r => r.id === currentOrder.roomId);
          if (room?.isTemporary) {
            await deleteRoom(room.id);
          } else {
            await updateRoom(currentOrder.roomId, { status: 'available' });
          }
        })(),
        // 更新技师状态
        ...currentOrder.items.map((item: OrderItem) => item.technicianId ? updateTechnicianStatus(item.technicianId, 'available') : Promise.resolve())
      ]);

      showNotification('服务完成并结账成功！', 'success');
      resetCheckoutState();
    } catch (error) {
      console.error('完成服务失败:', error);
      showNotification('完成服务失败，请重试', 'error');
    }
  };





  return (
    <div className="space-y-6">
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ show: false, message: '', type: 'success' })}
      />

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">桌台管理</h1>
          <p className="mt-2 text-gray-600">SPA房间状态和订单管理</p>
        </div>
        <button
          onClick={() => {
            setShowTemporaryRoomModal(true);
            setTemporaryRoomName('');
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          新建临时房
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 房间网格 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">房间状态</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {state.rooms?.map((room) => {
            const currentOrder = state.orders?.find(order => 
              order.roomId === room.id && order.status === 'in_progress'
            );
            
            return (
              <RoomCard
                key={room.id}
                room={room}
                onRoomClick={handleRoomClick}
                currentOrder={currentOrder}
              />
            );
          })}
        </div>
      </div>

            {/* 服务管理模态框 */}
      {showServiceManagementModal && selectedRoom && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
            {/* 头部 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">{selectedRoom.name}</h3>
                </div>
                <button
                  onClick={() => setShowServiceManagementModal(false)}
                  className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex h-[calc(95vh-200px)]">
              {/* 左侧：当前服务列表 */}
              <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-semibold text-gray-900">当前服务</h4>
                  <div className="bg-white px-4 py-2 rounded-full shadow-sm">
                    <span className="text-sm text-gray-600">共 {currentOrder.items.length} 项</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {currentOrder.items.map((item: OrderItem, index: number) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                            <h5 className="font-semibold text-gray-900 text-lg">{getServiceName(item.serviceId)}</h5>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">技师:</span>
                              <span className="ml-2 font-medium text-gray-700">{item.technicianName || (item.technicianId ? getTechnicianName(item.technicianId) : '未知技师')}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">价格:</span>
                              <span className="ml-2 font-bold text-green-600">{formatCurrency(item.price, state)}</span>
                            </div>
                          </div>
                        </div>
                                                 <button
                           onClick={() => handleDeleteItem(index, item)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                          title="移除服务"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {currentOrder.items.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">暂无服务项目</p>
                    </div>
                  )}
                </div>
                
                {/* 总计 */}
                <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">总计</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(currentOrder.totalAmount, state)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 右侧：添加新服务或结账 */}
              <div className="w-1/2 bg-white p-6 overflow-y-auto">
                {!isCheckoutMode ? (
                  // 添加服务模式
                  <>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-semibold text-gray-900">添加服务</h4>
                  {selectedService && (
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      已选择: {selectedService.name}
                    </div>
                  )}
                </div>
                
                {/* 服务选择 */}
                {!selectedService || modalStep === 'service' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      选择服务项目
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {state.serviceItems?.map((service) => {
                        // 计算该服务有多少个可用技师
                        const availableTechnicians = state.technicians?.filter(tech => 
                          tech.status === 'available' && 
                          tech.services?.some(s => s.serviceId === service.id)
                        ) || [];
                        
                        const technicianCount = availableTechnicians.length;
                        const isDisabled = technicianCount === 0;
                        
                        return (
                          <button
                            key={service.id}
                            onClick={() => {
                              if (!isDisabled) {
                                setSelectedService(service);
                                setModalStep('technician');
                              }
                            }}
                            disabled={isDisabled}
                            className={`text-left p-4 rounded-xl border-2 transition-all duration-200 group ${
                              isDisabled 
                                ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60' 
                                : 'bg-gray-50 border-transparent hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className={`font-semibold text-lg transition-colors ${
                                  isDisabled ? 'text-gray-500' : 'text-gray-900 group-hover:text-blue-700'
                                }`}>
                                  {service.name}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  ⏱️ {service.duration}分钟
                                </div>
                                <div className={`text-sm mt-1 ${
                                  isDisabled ? 'text-red-500' : 'text-green-600'
                                }`}>
                                  {isDisabled ? '❌ 暂无可用技师' : `👥 ${technicianCount}个技师可用`}
                                </div>
                              </div>
                              <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                                isDisabled ? 'text-gray-400' : 'text-blue-600'
                              }`}>
                                <Plus className="h-5 w-5" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* 技师选择 */
                  <div>
                    <div className="flex items-center mb-4">
                      <button
                        onClick={() => {
                          setSelectedService(null);
                          setModalStep('service');
                        }}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        ← 返回选择服务
                      </button>
                    </div>
                    
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      选择技师
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {state.technicians?.filter(tech => tech.status === 'available').map((technician) => {
                        const serviceAssignment = technician.services?.find(s => s.serviceId === selectedService.id);
                        if (!serviceAssignment) return null;
                        
                        return (
                          <button
                            key={technician.id}
                            onClick={async () => {
                              // 获取该技师此服务使用的公司分成方案
                              const companyCommissionRule = state.companyCommissionRules?.find(
                                rule => rule.id === serviceAssignment.companyCommissionRuleId
                              );
                              
                              const newItem: OrderItem = {
                                serviceId: selectedService.id,
                                serviceName: selectedService.name,
                                technicianId: technician.id,
                                technicianName: technician.employeeId,
                                price: serviceAssignment.price,
                                technicianCommission: serviceAssignment.commission,
                                companyCommissionRuleId: serviceAssignment.companyCommissionRuleId,
                                companyCommissionRuleName: companyCommissionRule?.name,
                                companyCommissionType: companyCommissionRule?.commissionType,
                                companyCommissionRate: companyCommissionRule?.commissionRate
                              };
                              
                              const updatedItems = [...currentOrder.items, newItem];
                              const newTotal = updatedItems.reduce((sum: number, item: OrderItem) => sum + item.price, 0);
                              
                              
                              // 直接更新本地状态
                              setCurrentOrder((prev: any) => prev ? {
                                ...prev,
                                items: updatedItems,
                                totalAmount: newTotal
                              } : null);
                              
                              // 重置选择状态
                              setSelectedService(null);
                              setModalStep('service');
                            }}
                            className="text-left p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900 text-lg group-hover:text-green-700 transition-colors">
                                  {technician.employeeId}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  💰 {formatCurrency(serviceAssignment.price, state)}
                                </div>
                                {serviceAssignment.commission > 0 && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    抽成: {formatCurrency(serviceAssignment.commission, state)}
                                  </div>
                                )}
                              </div>
                              <div className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="h-5 w-5" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                  </>
                ) : (
                  // 结账模式
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-semibold text-gray-900">结账</h4>
                      <button
                        onClick={() => setIsCheckoutMode(false)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ← 返回添加服务
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {/* 客户信息 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          客户姓名
                        </label>
                        <input
                          type="text"
                          value={checkoutData.customerName}
                          onChange={(e) => setCheckoutData(prev => ({ ...prev, customerName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="请输入客户姓名（可选）"
                        />
                      </div>

                      {/* 消费金额 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          消费金额
                        </label>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(currentOrder.totalAmount, state)}
                        </div>
                      </div>

                      {/* 实收金额 */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          currentOrder.receivedAmount && parseFloat(currentOrder.receivedAmount) > 0
                            ? 'text-gray-500'
                            : !checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0 
                            ? 'text-red-600' 
                            : 'text-gray-700'
                        }`}>
                          实收金额 {(!checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0) && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="number"
                          value={checkoutData.receivedAmount}
                          onChange={(e) => setCheckoutData(prev => ({ ...prev, receivedAmount: e.target.value }))}
                          readOnly={currentOrder.receivedAmount && parseFloat(currentOrder.receivedAmount) > 0}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            currentOrder.receivedAmount && parseFloat(currentOrder.receivedAmount) > 0
                              ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                              : !checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                          placeholder={currentOrder.receivedAmount && parseFloat(currentOrder.receivedAmount) > 0 ? "已结账，不可修改" : "请输入实收金额"}
                          step="0.01"
                          min="0"
                        />
                        {(!checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0) && 
                         !(currentOrder.receivedAmount && parseFloat(currentOrder.receivedAmount) > 0) && (
                          <p className="text-red-500 text-sm mt-1">请输入实收金额</p>
                        )}
                      </div>

                      {/* 销售员选择 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          销售员
                        </label>
                        <select
                          value={checkoutData.selectedSalespersonId}
                          onChange={(e) => setCheckoutData(prev => ({ ...prev, selectedSalespersonId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">选择销售员</option>
                          {state.salespeople?.map(salesperson => (
                            <option key={salesperson.id} value={salesperson.id}>
                              {salesperson.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 操作按钮 */}
                      <div className="pt-4">
                        {currentOrder.receivedAmount && parseFloat(currentOrder.receivedAmount) > 0 ? (
                          // 已付款，只显示完成服务按钮
                          <button
                            onClick={() => {
                              console.log('🔍 完成服务按钮被点击');
                              handleCompleteServiceOnly();
                            }}
                            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            完成服务
                          </button>
                        ) : (
                          // 未付款，显示结账按钮
                          <div className="space-y-3">
                            <button
                              onClick={() => {
                                console.log('🔍 结账按钮被点击');
                                if (!checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0) {
                                  showNotification('请输入实收金额', 'error');
                                  return;
                                }
                                handleCheckout();
                              }}
                              disabled={!checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0}
                              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              <CreditCard className="h-5 w-5 mr-2" />
                              仅结账
                            </button>
                            <button
                              onClick={() => {
                                console.log('🔍 完成服务并结账按钮被点击');
                                if (!checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0) {
                                  showNotification('请输入实收金额', 'error');
                                  return;
                                }
                                handleCompleteServiceAndCheckout();
                              }}
                              disabled={!checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0}
                              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              <CheckCircle className="h-5 w-5 mr-2" />
                              完成服务并结账
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 底部操作按钮 */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  房间: {selectedRoom.name} | 客户: {currentOrder.customerName || '散客'}
                </div>
                <div className="flex space-x-3">
                  {/* 取消按钮 */}
                  <button
                    onClick={() => {
                      // 重置所有选择状态
                      setSelectedService(null);
                      setModalStep('service');
                      setIsCheckoutMode(false);
                      
                      // 如果是临时订单，直接关闭
                      if (currentOrder.id.startsWith('temp-')) {
                        setShowServiceManagementModal(false);
                        setCurrentOrder(null);
                      } else {
                        setShowServiceManagementModal(false);
                      }
                    }}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  
                  {/* 完成并结账按钮 */}
                  <button
                    onClick={async () => {
                      if (currentOrder.items.length === 0) {
                        showNotification('请先添加至少一项服务', 'error');
                        return;
                      }
                      
                      // 如果是临时订单，先创建真实订单
                      if (currentOrder.id.startsWith('temp-')) {
                        try {
                          const newOrder = {
                            roomId: currentOrder.roomId,
                            roomName: currentOrder.roomName,
                            customerName: currentOrder.customerName,
                            customerPhone: currentOrder.customerPhone,
                            status: 'in_progress' as OrderStatus,
                            items: currentOrder.items,
                            totalAmount: currentOrder.totalAmount,
                            notes: currentOrder.notes
                          };
                          
                          const createdOrder = await addOrder(newOrder);
                          await updateRoom(currentOrder.roomId, { status: 'occupied' });
                          
                          // 更新所有相关技师状态为忙碌
                          await Promise.all(
                            currentOrder.items.map((item: OrderItem) => 
                              item.technicianId ? updateTechnicianStatus(item.technicianId, 'busy') : Promise.resolve()
                            )
                          );
                          
                          setCurrentOrder(createdOrder);
                        } catch (error) {
                          console.error('创建订单失败:', error);
                          showNotification('创建订单失败，请重试', 'error');
                          return;
                        }
                                              } else {
                          // 如果订单已存在，更新订单项目到数据库
                          try {
                            await updateOrder(currentOrder.id, {
                              items: currentOrder.items,
                              totalAmount: currentOrder.totalAmount
                            });
                            
                            // 更新所有相关技师状态为忙碌
                            await Promise.all(
                              currentOrder.items.map((item: OrderItem) => 
                                item.technicianId ? updateTechnicianStatus(item.technicianId, 'busy') : Promise.resolve()
                              )
                            );
                          } catch (error) {
                            console.error('更新订单失败:', error);
                            showNotification('更新订单失败，请重试', 'error');
                            return;
                          }
                        }
                        
                        // 重置选择状态（除了结账模式）
                      setSelectedService(null);
                      setModalStep('service');
                      
                      // 初始化结账数据
                      setCheckoutData({
                        customerName: currentOrder.customerName || '',
                        selectedSalespersonId: currentOrder.items[0]?.salespersonId || '',
                        receivedAmount: currentOrder.receivedAmount ? currentOrder.receivedAmount.toString() : currentOrder.totalAmount.toString()
                      });
                      setIsCheckoutMode(true);
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center shadow-lg"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    完成并结账
                  </button>
                  
                  {/* 完成按钮 */}
                  <button
                    onClick={async () => {
                      if (currentOrder.items.length === 0) {
                        showNotification('请先添加至少一项服务', 'error');
                        return;
                      }
                      
                      // 如果是临时订单，先创建真实订单
                      if (currentOrder.id.startsWith('temp-')) {
                        try {
                          const newOrder = {
                            roomId: currentOrder.roomId,
                            roomName: currentOrder.roomName,
                            customerName: currentOrder.customerName,
                            customerPhone: currentOrder.customerPhone,
                            status: 'in_progress' as OrderStatus,
                            items: currentOrder.items,
                            totalAmount: currentOrder.totalAmount,
                            notes: currentOrder.notes
                          };
                          
                          const createdOrder = await addOrder(newOrder);
                          await updateRoom(currentOrder.roomId, { status: 'occupied' });
                          
                          // 更新所有相关技师状态为忙碌
                          await Promise.all(
                            currentOrder.items.map((item: OrderItem) => 
                              item.technicianId ? updateTechnicianStatus(item.technicianId, 'busy') : Promise.resolve()
                            )
                          );
                          
                          setCurrentOrder(createdOrder);
                        } catch (error) {
                          console.error('创建订单失败:', error);
                          showNotification('创建订单失败，请重试', 'error');
                          return;
                        }
                                              } else {
                          // 如果订单已存在，更新订单项目到数据库
                          try {
                            await updateOrder(currentOrder.id, {
                              items: currentOrder.items,
                              totalAmount: currentOrder.totalAmount
                            });
                            
                            // 更新所有相关技师状态为忙碌
                            await Promise.all(
                              currentOrder.items.map((item: OrderItem) => 
                                item.technicianId ? updateTechnicianStatus(item.technicianId, 'busy') : Promise.resolve()
                              )
                            );
                          } catch (error) {
                            console.error('更新订单失败:', error);
                            showNotification('更新订单失败，请重试', 'error');
                            return;
                          }
                        }
                        
                        // 重置所有选择状态并关闭模态框
                      setSelectedService(null);
                      setModalStep('service');
                      setIsCheckoutMode(false);
                      setShowServiceManagementModal(false);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    完成
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* 新建临时房间模态框 */}
      {showTemporaryRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Plus className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">新建临时房间</h3>
                  <p className="text-gray-600">请输入临时房间名称</p>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  房间名称
                </label>
                <input
                  type="text"
                  value={temporaryRoomName}
                  onChange={(e) => setTemporaryRoomName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (temporaryRoomName.trim()) {
                        // 检查房间名称是否已存在
                        const existingRoom = state.rooms?.find(room => room.name === temporaryRoomName.trim());
                        if (existingRoom) {
                          showNotification('房间名称已存在，请使用其他名称', 'error');
                          return;
                        }
                        
                        addTemporaryRoom(temporaryRoomName.trim());
                        setShowTemporaryRoomModal(false);
                        setTemporaryRoomName('');
                      } else {
                        showNotification('请输入房间名称', 'error');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="请输入房间名称，如：VIP1、按摩房等"
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowTemporaryRoomModal(false);
                    setTemporaryRoomName('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (temporaryRoomName.trim()) {
                      // 检查房间名称是否已存在
                      const existingRoom = state.rooms?.find(room => room.name === temporaryRoomName.trim());
                                              if (existingRoom) {
                          showNotification('房间名称已存在，请使用其他名称', 'error');
                          return;
                        }
                      
                                              addTemporaryRoom(temporaryRoomName.trim());
                        setShowTemporaryRoomModal(false);
                        setTemporaryRoomName('');
                                          } else {
                        showNotification('请输入房间名称', 'error');
                      }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除项目确认模态框 */}
      {showDeleteItemModal && deletingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">确认删除服务项目</h3>
                  <p className="text-gray-600">
                    {currentOrder && currentOrder.items.length === 1 
                      ? '这是订单中的最后一个服务项目' 
                      : '您确定要删除以下服务项目吗？'
                    }
                  </p>
                </div>
              </div>
              
              {/* 项目信息 */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">服务:</span>
                    <span className="font-medium">{getServiceName(deletingItem.item.serviceId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">技师:</span>
                    <span className="font-medium">{deletingItem.item.technicianName || '未知技师'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">价格:</span>
                    <span className="font-bold text-green-600">{formatCurrency(deletingItem.item.price, state)}</span>
                  </div>
                </div>
              </div>

              {/* 警告信息 */}
              {currentOrder && currentOrder.items.length === 1 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-red-600 text-sm font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="text-red-800 font-semibold mb-1">⚠️ 警告：这是订单中的最后一个服务项目！</h4>
                      <p className="text-red-700 text-sm">
                        删除后将：
                      </p>
                      <ul className="text-red-700 text-sm mt-2 space-y-1">
                        <li>• 取消整个订单</li>
                        <li>• 释放房间状态</li>
                        <li>• 释放技师状态</li>
                        <li>• 订单状态将变为"已取消"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 非最后一个项目的提示 */}
              {currentOrder && currentOrder.items.length > 1 && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">i</span>
                    </div>
                    <div>
                      <p className="text-blue-800 text-sm">
                        删除后，该技师将变为可用状态（如果没有其他进行中的项目）。
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteItemModal(false);
                    setDeletingItem(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmDeleteItem}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {currentOrder && currentOrder.items.length === 1 
                    ? '确认删除并取消订单' 
                    : '确认删除'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 