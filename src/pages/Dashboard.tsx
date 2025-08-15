import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOrderContext } from '../context/OrderContext';
import { useServiceContext } from '../context/ServiceContext';
import { useTechnicianContext } from '../context/TechnicianContext';
import { useRoomContext } from '../context/RoomContext';
import { useSettingsContext } from '../context/SettingsContext';
import { useSalespersonContext } from '../context/SalespersonContext';
import { Plus, Users } from 'lucide-react';
import { OrderStatus, OrderItem, HandoverStatus } from '../types';
import { CommissionCalculator } from '../utils/commissionUtils';
import Notification from '../components/Notification';
import { usePreventDoubleClick } from '../hooks/usePreventDoubleClick';
import { orderAPI } from '../services/api';
import { 
  RoomCard, 
  StatsCards, 
  ServiceManagementModal, 
  TemporaryRoomModal, 
  DeleteItemModal,
  HandoverModal
} from '../components/dashboard';

export default function Dashboard() {
  const { 
    orders, 
    addOrder, 
    updateOrder, 
    updateOrderStatus
  } = useOrderContext();
  const { 
    rooms, 
    updateRoom, 
    addTemporaryRoom,
    deleteRoom
  } = useRoomContext();
  const { 
    technicians, 
    updateTechnicianStatus
  } = useTechnicianContext();
  const { 
    serviceItems,
    serviceCategories
  } = useServiceContext();
  const { 
    businessSettings,
    companyCommissionRules 
  } = useSettingsContext();
  const { 
    salespeople 
  } = useSalespersonContext();
  
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [modalStep, setModalStep] = useState<'service' | 'technician'>('service');
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [showServiceManagementModal, setShowServiceManagementModal] = useState(false);
  const [showTemporaryRoomModal, setShowTemporaryRoomModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ index: number; item: OrderItem } | null>(null);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  
  // 交接班相关状态
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  
  // 通知状态
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'warning' });
  
  // 结账数据状态
  const [checkoutData, setCheckoutData] = useState({
    customerName: '',
    selectedSalespersonId: '',
    receivedAmount: ''
  });
  
  // 显示通知
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // 获取待交接的订单
  const getPendingHandoverOrders = useCallback(() => {
    const pendingOrders = orders?.filter(order => {
      // 获取所有未交接的订单（进行中和已完成），排除已取消的订单
      return order.status !== 'cancelled' && order.handoverStatus === 'pending';
    }) || [];
    return pendingOrders;
  }, [orders]);

  // 处理交接班按钮点击
  const handleHandoverClick = useCallback(() => {
    const pendingOrders = getPendingHandoverOrders();
    if (pendingOrders.length > 0) {
      setShowHandoverModal(true);
    } else {
      showNotification('没有待交接的订单', 'warning');
    }
  }, [getPendingHandoverOrders, showNotification]);

  // 交接班防重复点击Hook
  const handoverClickHook = usePreventDoubleClick({
    delay: 2000,
    onSuccess: () => {
      showNotification('交接班操作完成', 'success');
    },
    onError: (error) => {
      console.error('交接班失败:', error);
      showNotification('交接班失败，请重试', 'error');
    }
  });

  // 确认交接班
  const handleConfirmHandover = useCallback(async () => {
    await handoverClickHook.execute(async () => {
      const pendingOrders = getPendingHandoverOrders();
      
      // 批量更新订单的交接班状态
      for (const order of pendingOrders) {
        await updateOrder(order.id, {
          ...order,
          handoverStatus: 'handed_over' as HandoverStatus,
          handoverAt: new Date().toISOString()
        });
      }
      
      setShowHandoverModal(false);
    });
  }, [handoverClickHook, getPendingHandoverOrders, updateOrder]);

  // 检查并删除过期的临时房间
  const checkExpiredRooms = useCallback(() => {
    const now = new Date();
    rooms?.forEach(room => {
      if (room.isTemporary && room.expiresAt) {
        const expiresAt = new Date(room.expiresAt);
        if (now > expiresAt) {
          deleteRoom(room.id);
        }
      }
    });
  }, [rooms, deleteRoom]);

  useEffect(() => {
    checkExpiredRooms();
    const interval = setInterval(checkExpiredRooms, 60000); // 每分钟检查一次

    return () => clearInterval(interval);
  }, [checkExpiredRooms]);

  const handleRoomClick = useCallback(async (room: any) => {
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
      const roomOrder = orders?.find(order => 
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
  }, [orders, showNotification]);

  const getServiceName = useCallback((serviceId: string, serviceName?: string) => {
    // 优先使用服务名称快照
    if (serviceName) {
      return serviceName;
    }
    
    // 如果快照不存在，则从当前服务列表中查找
    const service = serviceItems?.find(s => s.id === serviceId);
    return service ? service.name : '未知服务';
  }, [serviceItems]);

  // 缓存技师名称映射
  const technicianNameMap = useMemo(() => {
    const map = new Map();
    technicians?.forEach(technician => {
      map.set(technician.id, technician.employeeId);
    });
    return map;
  }, [technicians]);

  const getTechnicianName = useCallback((technicianId: string) => {
    return technicianNameMap.get(technicianId) || '未知技师';
  }, [technicianNameMap]);

  // 重置结账状态的公共函数
  const resetCheckoutState = useCallback(() => {
    setCheckoutData({
      customerName: '',
      selectedSalespersonId: '',
      receivedAmount: ''
    });
  }, []);

  // 处理删除项目
  const handleDeleteItem = useCallback((index: number, item: OrderItem) => {
    setDeletingItem({ index, item });
    setShowDeleteItemModal(true);
  }, []);

  // 处理完成服务项目
  const handleCompleteServiceItem = useCallback(async (item: OrderItem) => {
    if (!currentOrder || !item.id) {
      showNotification('无法完成服务项目', 'error');
      return;
    }

    try {
      // 调用API完成服务项目
      await orderAPI.completeItem(currentOrder.id, item.id);
      
      // 更新技师状态为可用（确保状态同步）
      if (item.technicianId) {
        await updateTechnicianStatus(item.technicianId, 'available');
      }
      
      // 更新本地状态
      setCurrentOrder((prev: any) => {
        if (!prev) return prev;
        
        const updatedItems = prev.items.map((orderItem: OrderItem) => {
          if (orderItem.id === item.id) {
            return {
              ...orderItem,
              status: 'completed' as const,
              completedAt: new Date().toISOString()
            };
          }
          return orderItem;
        });

        // 检查是否所有项目都已完成
        const allCompleted = updatedItems.every((orderItem: OrderItem) => orderItem.status === 'completed');
        
        return {
          ...prev,
          items: updatedItems,
          status: allCompleted ? 'completed' : prev.status,
          completedAt: allCompleted ? new Date().toISOString() : prev.completedAt
        };
      });

      showNotification('服务项目完成成功', 'success');
    } catch (error) {
      console.error('完成服务项目失败:', error);
      showNotification('完成服务项目失败，请重试', 'error');
    }
  }, [currentOrder, showNotification, updateTechnicianStatus]);

  // 删除项目防重复点击Hook
  const deleteItemClickHook = usePreventDoubleClick({
    delay: 1500,
    onSuccess: () => {
      showNotification('项目删除成功', 'success');
    },
    onError: () => {
      showNotification('删除项目失败，请重试', 'error');
    }
  });

  // 确认删除项目
  const confirmDeleteItem = useCallback(async () => {
    if (!deletingItem || !currentOrder) return;

    await deleteItemClickHook.execute(async () => {
      const { index, item } = deletingItem;
      const updatedItems = currentOrder.items.filter((_: OrderItem, i: number) => i !== index);
      const newTotal = updatedItems.reduce((sum: number, item: OrderItem) => sum + item.price, 0);

      // 检查是否是最后一个项目
      const isLastItem = currentOrder.items.length === 1;

      if (isLastItem) {
        // 删除最后一个项目，取消整个订单
        await updateOrderStatus(currentOrder.id, 'cancelled');
        await updateRoom(currentOrder.roomId, { status: 'available' });
        setShowServiceManagementModal(false);
      } else {
        // 删除非最后一个项目，更新订单
        await updateOrder(currentOrder.id, {
          items: updatedItems,
          totalAmount: newTotal
        });
      }

      // 更新技师状态
      if (item.technicianId) {
        // 检查技师是否还有其他进行中的项目
        const hasOtherInProgressItems = orders?.some(o => 
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
    });
  }, [deleteItemClickHook, deletingItem, currentOrder, updateOrderStatus, updateRoom, updateOrder, orders, updateTechnicianStatus]);

  // 结账防重复点击Hook
  const checkoutClickHook = usePreventDoubleClick({
    delay: 2000,
    onSuccess: () => {
      showNotification('结账成功！', 'success');
    },
    onError: () => {
      console.error('结账失败');
      showNotification('结账失败，请重试', 'error');
    }
  });

  // 处理结账（仅结账，不完成服务）
  const handleCheckout = useCallback(async () => {
    if (!currentOrder) {
      showNotification('没有可结账的订单', 'error');
      return;
    }

    // 检查是否是临时订单
    if (currentOrder.id.startsWith('temp-')) {
      showNotification('请先添加至少一项服务后再结账', 'error');
      return;
    }

    await checkoutClickHook.execute(async () => {
      // 使用实收金额，如果没有输入则使用换算后的金额
      const receivedAmount = parseFloat(checkoutData.receivedAmount);

      // 更新订单项目，为每个项目分配销售员信息
      const salesperson = checkoutData.selectedSalespersonId ? salespeople?.find(s => s.id === checkoutData.selectedSalespersonId) : null;
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
        const companyCommissionRule = companyCommissionRules?.find(
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

      // 立即更新本地状态，以便在界面上立即显示已收款金额
      setCurrentOrder((prev: any) => prev ? {
        ...prev,
        receivedAmount: receivedAmount,
        customerName: checkoutData.customerName,
        items: updatedItems,
        notes: '已结账，服务进行中'
      } : null);

      // 更新结账数据，显示已收款的金额
      setCheckoutData((prev: any) => ({
        ...prev,
        receivedAmount: receivedAmount.toString()
      }));
    });
  }, [checkoutClickHook, currentOrder, checkoutData, salespeople, companyCommissionRules, updateOrder]);

  // 完成服务防重复点击Hook
  const completeServiceClickHook = usePreventDoubleClick({
    delay: 2000,
    onSuccess: () => {
      showNotification('服务完成成功！', 'success');
      setShowServiceManagementModal(false);
    },
    onError: () => {
      console.error('完成服务失败');
      showNotification('完成服务失败，请重试', 'error');
    }
  });

  // 处理仅完成服务
  const handleCompleteServiceOnly = useCallback(async () => {
    if (!currentOrder) {
      showNotification('没有可完成的订单', 'error');
      return;
    }

    // 检查是否是临时订单
    if (currentOrder.id.startsWith('temp-')) {
      showNotification('请先添加至少一项服务后再完成服务', 'error');
      return;
    }

    await completeServiceClickHook.execute(async () => {
      // 并行执行所有异步操作
      await Promise.all([
        // 更新订单状态为已完成
        updateOrder(currentOrder.id, {
          status: 'completed',
          completedAt: new Date().toISOString()
        }),
        // 处理房间状态
        (async () => {
          const room = rooms?.find(r => r.id === currentOrder.roomId);
          if (room?.isTemporary) {
            await deleteRoom(room.id);
          } else {
            await updateRoom(currentOrder.roomId, { status: 'available' });
          }
        })(),
        // 更新技师状态
        ...currentOrder.items.map((item: OrderItem) => item.technicianId ? updateTechnicianStatus(item.technicianId, 'available') : Promise.resolve())
      ]);
    });
  }, [completeServiceClickHook, currentOrder, updateOrder, rooms, deleteRoom, updateRoom, updateTechnicianStatus]);

  // 完成服务并结账防重复点击Hook
  const completeServiceAndCheckoutClickHook = usePreventDoubleClick({
    delay: 2500,
    onSuccess: () => {
      showNotification('服务完成并结账成功！', 'success');
      resetCheckoutState();
      setShowServiceManagementModal(false);
    },
    onError: () => {
      console.error('完成服务失败');
      showNotification('完成服务失败，请重试', 'error');
    }
  });

  // 处理完成服务并结账
  const handleCompleteServiceAndCheckout = useCallback(async () => {
    if (!currentOrder) {
      showNotification('没有可完成的订单', 'error');
      return;
    }

    // 检查是否是临时订单
    if (currentOrder.id.startsWith('temp-')) {
      showNotification('请先添加至少一项服务后再完成服务', 'error');
      return;
    }

    await completeServiceAndCheckoutClickHook.execute(async () => {
      // 使用实收金额，如果没有输入则使用换算后的金额
      const receivedAmount = parseFloat(checkoutData.receivedAmount);

      // 更新订单项目，为每个项目分配销售员信息
      const salesperson = checkoutData.selectedSalespersonId ? salespeople?.find(s => s.id === checkoutData.selectedSalespersonId) : null;
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
        const companyCommissionRule = companyCommissionRules?.find(
          rule => rule.id === item.companyCommissionRuleId
        );
        
        const itemCompanyCommission = companyCommissionRule ? 
          CommissionCalculator.calculateItemCompanyCommission(itemWithSalespersonCommission, discountRate, companyCommissionRule) : 0;

        return {
          ...item,
          salespersonId: checkoutData.selectedSalespersonId || null,
          salespersonName: salesperson?.name || null,
          salespersonCommission: itemCommission,
          companyCommissionAmount: itemCompanyCommission,
          status: 'completed', // 完成服务并结账时，所有服务项目状态都设为已完成
          completedAt: new Date().toISOString() // 设置完成时间
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
          const room = rooms?.find(r => r.id === currentOrder.roomId);
          if (room?.isTemporary) {
            await deleteRoom(room.id);
          } else {
            await updateRoom(currentOrder.roomId, { status: 'available' });
          }
        })(),
        // 更新技师状态
        ...currentOrder.items.map((item: OrderItem) => item.technicianId ? updateTechnicianStatus(item.technicianId, 'available') : Promise.resolve())
      ]);

      // 立即更新本地状态，以便在界面上立即显示已收款金额
      setCurrentOrder((prev: any) => prev ? {
        ...prev,
        receivedAmount: receivedAmount,
        customerName: checkoutData.customerName,
        items: updatedItems,
        status: 'completed',
        completedAt: new Date().toISOString()
      } : null);

      // 更新结账数据，显示已收款的金额
      setCheckoutData((prev: any) => ({
        ...prev,
        receivedAmount: receivedAmount.toString()
      }));
    });
  }, [completeServiceAndCheckoutClickHook, currentOrder, checkoutData, salespeople, companyCommissionRules, updateOrder, rooms, deleteRoom, updateRoom, updateTechnicianStatus, resetCheckoutState, setShowServiceManagementModal]);

  return (
    <div className="space-y-6">
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ show: false, message: '', type: 'success' })}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SPA管理系统</h1>
          <p className="mt-2 text-gray-600">实时监控房间状态和订单管理</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleHandoverClick}
            disabled={handoverClickHook.isLoading}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {handoverClickHook.isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Users className="h-5 w-5 mr-2" />
            )}
            {handoverClickHook.isLoading ? '交接中...' : '交接班'}
            {getPendingHandoverOrders().length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {getPendingHandoverOrders().length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowTemporaryRoomModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            新建临时房
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <StatsCards 
        rooms={rooms || []}
        technicians={technicians || []}
        orders={orders || []}
      />

      {/* 房间网格 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">房间状态</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {useMemo(() => rooms?.map((room) => {
            const currentOrder = orders?.find(order => 
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
          }), [rooms, orders, handleRoomClick])}
        </div>
      </div>

      {/* 服务管理模态框 */}
      <ServiceManagementModal
        show={showServiceManagementModal}
        onClose={() => setShowServiceManagementModal(false)}
        selectedRoom={selectedRoom}
        currentOrder={currentOrder}
        setCurrentOrder={setCurrentOrder}
        serviceItems={serviceItems || []}
        serviceCategories={serviceCategories || []}
        technicians={technicians || []}
        salespeople={salespeople || []}
        businessSettings={businessSettings}
        companyCommissionRules={companyCommissionRules || []}
        addOrder={addOrder}
        updateOrder={updateOrder}
        updateRoom={updateRoom}
        updateTechnicianStatus={updateTechnicianStatus}
        deleteRoom={deleteRoom}
        showNotification={showNotification}
        getServiceName={getServiceName}
        getTechnicianName={getTechnicianName}
        handleDeleteItem={handleDeleteItem}
        handleCompleteServiceItem={handleCompleteServiceItem}
        handleCheckout={handleCheckout}
        handleCompleteServiceOnly={handleCompleteServiceOnly}
        handleCompleteServiceAndCheckout={handleCompleteServiceAndCheckout}
        checkoutData={checkoutData}
        setCheckoutData={setCheckoutData}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
        modalStep={modalStep}
        setModalStep={setModalStep}
        isCheckoutMode={isCheckoutMode}
        setIsCheckoutMode={setIsCheckoutMode}
      />

      {/* 新建临时房间模态框 */}
      <TemporaryRoomModal
        show={showTemporaryRoomModal}
        onClose={() => setShowTemporaryRoomModal(false)}
        onConfirm={(roomName: string) => {
          addTemporaryRoom(roomName);
          setShowTemporaryRoomModal(false);
        }}
        existingRooms={rooms || []}
        showNotification={showNotification}
      />

      {/* 删除项目确认模态框 */}
      <DeleteItemModal
        show={showDeleteItemModal}
        onClose={() => {
          setShowDeleteItemModal(false);
          setDeletingItem(null);
        }}
        onConfirm={confirmDeleteItem}
        deletingItem={deletingItem}
        currentOrder={currentOrder}
        businessSettings={businessSettings}
        getServiceName={getServiceName}
      />

      {/* 交接班确认模态框 */}
      <HandoverModal
        show={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
        onConfirmHandover={handleConfirmHandover}
        pendingOrders={getPendingHandoverOrders()}
      />
    </div>
  );
} 