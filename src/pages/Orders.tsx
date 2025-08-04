import { useState, useCallback, useMemo } from 'react';
import { useOrderContext } from '../context/OrderContext';
import { useServiceContext } from '../context/ServiceContext';
import { useTechnicianContext } from '../context/TechnicianContext';
import { useRoomContext } from '../context/RoomContext';
import { useSettingsContext } from '../context/SettingsContext';
import { Order } from '../types';
import { Filter } from 'lucide-react';
import Notification from '../components/Notification';

// 导入子组件
import OrderStats from '../components/orders/OrderStats';
import OrderFilters from '../components/orders/OrderFilters';
import OrderTable from '../components/orders/OrderTable';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import CancelOrderModal from '../components/orders/CancelOrderModal';

// 导入工具函数
import { 
  getServiceName, 
  getTechnicianDisplay, 
  getRoomName, 
  getStatusColor, 
  getStatusText, 
  getStatusIcon 
} from '../components/orders/orderUtils';

export default function OrdersRefactored() {
  const { orders, updateOrderStatus, updateOrder } = useOrderContext();
  const { serviceItems } = useServiceContext();
  const { technicians } = useTechnicianContext();
  const { rooms } = useRoomContext();
  const { businessSettings, companyCommissionRules } = useSettingsContext();
  
  // 状态管理
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' as 'success' | 'error' | 'warning' });
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // 筛选状态
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    roomId: '',
    technicianId: '',
    serviceId: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // 显示通知
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000);
  }, []);

  // 工具函数包装器
  const getServiceNameWrapper = useCallback((serviceId: string, serviceName?: string) => {
    return getServiceName(serviceId, serviceItems, serviceName);
  }, [serviceItems]);

  const getTechnicianDisplayWrapper = useCallback((technicianId?: string, technicianName?: string) => {
    return getTechnicianDisplay(technicianId, technicianName, technicians);
  }, [technicians]);

  const getRoomNameWrapper = useCallback((roomId: string, roomName?: string) => {
    return getRoomName(roomId, roomName, rooms);
  }, [rooms]);

  // 取消订单处理
  const handleCancelOrder = useCallback((orderId: string) => {
    if (!cancelReason.trim()) {
      showNotification('请输入取消原因', 'error');
      return;
    }
    
    // 更新订单状态为已取消
    updateOrderStatus(orderId, 'cancelled');
    
    // 更新订单备注，记录取消原因
    const order = orders?.find(o => o.id === orderId);
    if (order) {
      const updatedNotes = order.notes ? `${order.notes}\n取消原因: ${cancelReason}` : `取消原因: ${cancelReason}`;
      updateOrder(orderId, {
        notes: updatedNotes,
        items: order.items  // 传递完整的订单项目数据，避免清空快照
      });
    }
    
    setCancellingOrderId(null);
    setCancelReason('');
    showNotification('订单已取消', 'success');
  }, [cancelReason, updateOrderStatus, orders, updateOrder, showNotification]);

  // 查看订单详情
  const handleViewDetail = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetailModal(true);
  }, []);

  // 筛选订单
  const filteredOrders = useMemo(() => {
    return orders?.filter(order => {
      // 日期筛选
      if (filters.startDate && new Date(order.createdAt) < new Date(filters.startDate)) {
        return false;
      }
      if (filters.endDate && new Date(order.createdAt) > new Date(filters.endDate + 'T23:59:59')) {
        return false;
      }
      
      // 房间筛选
      if (filters.roomId && order.roomId !== filters.roomId) {
        return false;
      }
      
      // 技师筛选
      if (filters.technicianId && !order.items.some(item => item.technicianId === filters.technicianId)) {
        return false;
      }
      
      // 服务项目筛选
      if (filters.serviceId && !order.items.some(item => item.serviceId === filters.serviceId)) {
        return false;
      }
      
      // 状态筛选
      if (filters.status && order.status !== filters.status) {
        return false;
      }
      
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
  }, [orders, filters]);

  // 重置筛选
  const resetFilters = useCallback(() => {
    setFilters({
      startDate: '',
      endDate: '',
      roomId: '',
      technicianId: '',
      serviceId: '',
      status: ''
    });
    setCurrentPage(1);
  }, []);

  // 分页计算
  const totalOrders = useMemo(() => filteredOrders.length, [filteredOrders]);
  const totalPages = useMemo(() => Math.ceil(totalOrders / pageSize), [totalOrders, pageSize]);
  const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);
  const endIndex = useMemo(() => startIndex + pageSize, [startIndex, pageSize]);
  const currentOrders = useMemo(() => filteredOrders.slice(startIndex, endIndex), [filteredOrders, startIndex, endIndex]);

  // 处理页码变化
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // 处理页面大小变化
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ show: false, message: '', type: 'error' })}
      />
      
      {/* 页面标题和筛选按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">订单管理</h1>
          <p className="mt-2 text-gray-600">查看和管理SPA订单</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? '隐藏筛选' : '显示筛选'}
        </button>
      </div>

      {/* 订单统计 */}
      <OrderStats orders={orders} />

      {/* 筛选面板 */}
      {showFilters && (
        <OrderFilters
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
          rooms={rooms}
          technicians={technicians}
          serviceItems={serviceItems}
          filteredOrdersCount={filteredOrders.length}
          totalOrdersCount={orders?.length || 0}
        />
      )}

      {/* 取消订单模态框 */}
      <CancelOrderModal
        isOpen={!!cancellingOrderId}
        orderId={cancellingOrderId}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        onConfirm={handleCancelOrder}
        onCancel={() => {
          setCancellingOrderId(null);
          setCancelReason('');
        }}
      />

      {/* 订单详情模态框 */}
      <OrderDetailModal
        show={showOrderDetailModal}
        order={selectedOrder}
        businessSettings={businessSettings}
        companyCommissionRules={companyCommissionRules}
        onClose={() => {
          setShowOrderDetailModal(false);
          setSelectedOrder(null);
        }}
        getServiceName={getServiceNameWrapper}
        getRoomName={getRoomNameWrapper}
        getTechnicianDisplay={getTechnicianDisplayWrapper}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
      />

      {/* 订单表格 */}
      <OrderTable
        currentOrders={currentOrders}
        businessSettings={businessSettings}
        getServiceName={getServiceNameWrapper}
        getRoomName={getRoomNameWrapper}
        getTechnicianDisplay={getTechnicianDisplayWrapper}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        getStatusIcon={getStatusIcon}
        onViewDetail={handleViewDetail}
        onCancelOrder={setCancellingOrderId}
        currentPage={currentPage}
        pageSize={pageSize}
        totalOrders={totalOrders}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
} 