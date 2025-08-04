import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import { Eye, CheckCircle, XCircle, AlertCircle, X, Filter, HelpCircle } from 'lucide-react';
import { formatTime } from '../utils/timeUtils';
import { formatCurrency } from '../utils/currencyUtils';
import { CommissionCalculator } from '../utils/commissionUtils';
import Notification from '../components/Notification';

export default function Orders() {
  const { state, updateOrderStatus, updateOrder } = useAppContext();
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' as 'success' | 'error' | 'warning' });
  
  // 显示通知
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000);
  };
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 每页显示数量，可调整
  
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

  const getServiceName = (serviceId: string) => {
    const service = state.serviceItems?.find(s => s.id === serviceId);
    return service ? service.name : '未知服务';
  };



  const getTechnicianDisplay = (technicianId?: string, technicianName?: string) => {
    // 优先使用订单中保存的技师工号快照
    if (technicianName) {
      // 检查技师是否还存在
      const technician = technicianId ? state.technicians?.find(t => t.id === technicianId) : null;
      
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



  const getRoomName = (roomId: string, roomName?: string) => {
    // 优先使用订单中保存的房间名称快照
    if (roomName) {
      return roomName;
    }
    // 如果快照不存在，则从当前房间列表中查找
    const room = state.rooms?.find(r => r.id === roomId);
    return room ? room.name : '未知房间';
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'in_progress': return AlertCircle;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return AlertCircle;
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (!cancelReason.trim()) {
      showNotification('请输入取消原因', 'error');
      return;
    }
    
    // 更新订单状态为已取消
    updateOrderStatus(orderId, 'cancelled');
    
    // 更新订单备注，记录取消原因
    const order = state.orders?.find(o => o.id === orderId);
    if (order) {
      const updatedNotes = order.notes ? `${order.notes}\n取消原因: ${cancelReason}` : `取消原因: ${cancelReason}`;
      updateOrder(orderId, {
        notes: updatedNotes
      });
    }
    
    setCancellingOrderId(null);
    setCancelReason('');
  };

  // 计算订单总金额
  // 计算订单总金额
  const calculateOrderTotal = (order: Order) => {
    return order.totalAmount;
  };

  // 计算技师总抽成
  const calculateTechnicianCommission = (order: Order) => {
    return CommissionCalculator.calculateTotalTechnicianCommission(order.items);
  };

  // 计算销售员总抽成
  const calculateSalespersonCommission = (order: Order) => {
    return CommissionCalculator.calculateTotalSalespersonCommission(order.items);
  };

  // 计算公司总分成
  const calculateCompanyCommission = (order: Order) => {
    // 直接使用数据库中保存的公司分成金额，而不是重新计算
    return order.items.reduce((sum, item) => {
      return sum + (item.companyCommissionAmount || 0);
    }, 0);
  };

  // 计算订单利润
  const calculateOrderProfit = (order: Order) => {
    const receivedAmount = order.receivedAmount || order.totalAmount;
    const discountRate = CommissionCalculator.calculateDiscountRate(receivedAmount, order.totalAmount);
    
    return CommissionCalculator.calculateOrderProfit(
      order.items,
      receivedAmount,
      discountRate,
      state.companyCommissionRules || []
    );
  };

  // 筛选订单
  const filteredOrders = state.orders?.filter(order => {
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

  // 重置筛选
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      roomId: '',
      technicianId: '',
      serviceId: '',
      status: ''
    });
    setCurrentPage(1);
  };

  // 分页计算
  const totalOrders = filteredOrders.length;
  const totalPages = Math.ceil(totalOrders / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理页面大小变化
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // 重置到第一页
  };

  return (
    <div className="space-y-6">
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ show: false, message: '', type: 'error' })}
      />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl shadow-md">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-700">进行中</p>
                <p className="text-3xl font-bold text-orange-800">
                  {state.orders?.filter(order => order.status === 'in_progress').length || 0}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="w-12 h-12 bg-orange-200 bg-opacity-50 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold text-sm">进行</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-400 to-green-500 rounded-xl shadow-md">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-700">已完成</p>
                <p className="text-3xl font-bold text-green-800">
                  {state.orders?.filter(order => order.status === 'completed').length || 0}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="w-12 h-12 bg-green-200 bg-opacity-50 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold text-sm">完成</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-lg p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-red-400 to-red-500 rounded-xl shadow-md">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-700">已取消</p>
                <p className="text-3xl font-bold text-red-800">
                  {state.orders?.filter(order => order.status === 'cancelled').length || 0}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="w-12 h-12 bg-red-200 bg-opacity-50 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-semibold text-sm">取消</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-200">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg mr-3">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">筛选条件</h3>
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all duration-200 shadow-md"
            >
              重置筛选
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 日期范围 */}
            <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-50 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">开始日期</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-50 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">结束日期</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            
            {/* 房间筛选 */}
            <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-50 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">房间</label>
              <select
                value={filters.roomId}
                onChange={(e) => setFilters({ ...filters, roomId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">全部房间</option>
                {state.rooms?.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </div>
            
            {/* 技师筛选 */}
            <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-50 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">技师工号</label>
              <select
                value={filters.technicianId}
                onChange={(e) => setFilters({ ...filters, technicianId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">全部技师</option>
                {state.technicians?.map(technician => (
                  <option key={technician.id} value={technician.id}>{technician.employeeId}</option>
                ))}
              </select>
            </div>
            
            {/* 服务项目筛选 */}
            <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-50 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">服务项目</label>
              <select
                value={filters.serviceId}
                onChange={(e) => setFilters({ ...filters, serviceId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">全部服务</option>
                {state.serviceItems?.map(service => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </div>
            
            {/* 状态筛选 */}
            <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-50 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">订单状态</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">全部状态</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
          
          {/* 筛选结果统计 */}
          <div className="mt-6 pt-6 border-t border-blue-200">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold">{filteredOrders.length}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">筛选结果</p>
                    <p className="text-xs opacity-90">
                      共找到 {filteredOrders.length} 条记录
                      {state.orders && state.orders.length > 0 && (
                        <span> (共 {state.orders.length} 条)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">结果</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 取消订单模态框 */}
      {cancellingOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">取消订单</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                取消原因 *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="请输入取消原因"
                rows={3}
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleCancelOrder(cancellingOrderId)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                确认取消
              </button>
              <button
                onClick={() => {
                  setCancellingOrderId(null);
                  setCancelReason('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 订单详情模态框 */}
      {showOrderDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-3">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">订单详情</h3>
                    <p className="text-blue-100 mt-1">订单号: {selectedOrder.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowOrderDetailModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">基本信息</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">房间:</span>
                        <span className="font-medium">{getRoomName(selectedOrder.roomId, selectedOrder.roomName)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">客户:</span>
                        <span className="font-medium">{selectedOrder.customerName || '散客'}</span>
                      </div>
                      {selectedOrder.items.some(item => item.salespersonName) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">销售员:</span>
                          <span className="font-medium">
                            {Array.from(new Set(selectedOrder.items
                              .filter(item => item.salespersonName)
                              .map(item => item.salespersonName)
                            )).join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">状态:</span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">创建时间:</span>
                        <span className="font-medium">{formatTime(new Date(selectedOrder.createdAt), state.businessSettings)}</span>
                      </div>
                      {selectedOrder.completedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">完成时间:</span>
                          <span className="font-medium">{formatTime(new Date(selectedOrder.completedAt), state.businessSettings)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 金额信息 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">金额信息</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">总金额:</span>
                        <span className="font-medium">{formatCurrency(calculateOrderTotal(selectedOrder), state)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">实收金额:</span>
                        <span className="font-medium">{selectedOrder.receivedAmount ? formatCurrency(selectedOrder.receivedAmount, state) : '未设置'}</span>
                      </div>
                      {calculateTechnicianCommission(selectedOrder) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">技师总抽成:</span>
                          <span className="font-medium">
                            {formatCurrency(calculateTechnicianCommission(selectedOrder), state)}
                          </span>
                        </div>
                      )}
                      {calculateSalespersonCommission(selectedOrder) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">销售员抽成:</span>
                          <span className="font-medium">
                            {formatCurrency(calculateSalespersonCommission(selectedOrder), state)}
                          </span>
                        </div>
                      )}
                      {calculateCompanyCommission(selectedOrder) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">公司分成:</span>
                          <span className="font-medium">
                            {formatCurrency(calculateCompanyCommission(selectedOrder), state)}
                          </span>
                        </div>
                      )}
                      {selectedOrder.receivedAmount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">订单利润:</span>
                          <span className="font-medium">
                            {formatCurrency(calculateOrderProfit(selectedOrder), state)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 服务详情 */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">服务详情</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-gray-900">{getServiceName(item.serviceId)}</span>
                            <span className="text-sm text-gray-600">{formatCurrency(item.price, state)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>技师: {item.technicianName || '未知技师'}</div>
                            {item.technicianCommission > 0 && (
                              <div>抽成: {formatCurrency(item.technicianCommission, state)}</div>
                            )}
                            {item.salespersonName && (
                              <div>销售员: {item.salespersonName}</div>
                            )}
                            {typeof item.salespersonCommission === 'number' && item.salespersonCommission > 0 && (
                              <div>销售员抽成: {formatCurrency(item.salespersonCommission, state)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 备注信息 */}
                  {selectedOrder.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">备注</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 订单列表 */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">订单列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  订单号
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  房间
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  技师工号
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客户
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  服务项目
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  总金额
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  实收金额
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        {order.id}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {getRoomName(order.roomId, order.roomName)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {order.items.length > 0 ? (
                        <div className="space-y-1">
                          {Array.from(new Set(order.items.map(item => item.technicianName))).map((technicianName, index) => {
                            const item = order.items.find(item => item.technicianName === technicianName);
                            const technicianDisplay = getTechnicianDisplay(item?.technicianId, technicianName);
                            return (
                              <div key={index} className="flex items-center justify-center space-x-1">
                                <span className={technicianDisplay.isDeparted ? 'text-red-600' : ''}>
                                  {technicianDisplay.text}
                                </span>
                                {technicianDisplay.isDeparted && (
                                  <div 
                                    className="relative"
                                    title={technicianDisplay.tooltip}
                                  >
                                    <HelpCircle 
                                      className="h-4 w-4 text-red-500 cursor-help" 
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {order.customerName || '散客'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-center">
                      <div className="space-y-1">
                        {(() => {
                          // 统计相同服务的数量
                          const serviceCounts = new Map<string, number>();
                          order.items.forEach(item => {
                            const serviceName = getServiceName(item.serviceId);
                            serviceCounts.set(serviceName, (serviceCounts.get(serviceName) || 0) + 1);
                          });
                          
                          // 显示合并后的服务项目
                          return Array.from(serviceCounts.entries()).map(([serviceName, count], index) => (
                            <div key={index} className="text-gray-700">
                              {serviceName}{count > 1 && <span className="text-blue-600 font-medium"> ×{count}</span>}
                            </div>
                          ));
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                      {formatCurrency(calculateOrderTotal(order), state)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                      {order.receivedAmount ? formatCurrency(order.receivedAmount, state) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex space-x-2 justify-center">
                        {order.status !== 'cancelled' && (
                          <button
                            onClick={() => setCancellingOrderId(order.id)}
                            className="text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-300 hover:bg-red-50 transition-colors"
                            title="取消订单"
                          >
                            取消
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* 分页组件 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                显示第 {startIndex + 1} 到 {Math.min(endIndex, totalOrders)} 条，共 {totalOrders} 条记录
              </div>
              
              {/* 每页显示数量选择器 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">每页显示:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5条</option>
                  <option value={10}>10条</option>
                  <option value={20}>20条</option>
                  <option value={50}>50条</option>
                  <option value={100}>100条</option>
                </select>
              </div>
            </div>
            
            {/* 分页导航 */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                {/* 快速跳转 */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">跳转到:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="页码"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const page = parseInt(e.currentTarget.value);
                        if (page >= 1 && page <= totalPages) {
                          handlePageChange(page);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <span className="text-sm text-gray-600">页</span>
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                
                {/* 页码按钮 */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 