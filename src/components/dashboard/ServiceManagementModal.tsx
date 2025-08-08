import React, { useCallback, useState, useMemo } from 'react';
import { 
  XCircle, 
  Package, 
  Plus, 
  CheckCircle, 
  CreditCard, 
  Trash2 
} from 'lucide-react';
import { OrderItem, OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/currencyUtils';
import { usePreventDoubleClick } from '../../hooks/usePreventDoubleClick';

interface ServiceManagementModalProps {
  show: boolean;
  onClose: () => void;
  selectedRoom: any;
  currentOrder: any;
  setCurrentOrder: (order: any) => void;
  serviceItems: any[];
  serviceCategories: any[];
  technicians: any[];
  salespeople: any[];
  businessSettings: any;
  companyCommissionRules: any[];
  addOrder: (order: any) => Promise<any>;
  updateOrder: (id: string, data: any) => void;
  updateRoom: (id: string, data: any) => void;
  updateTechnicianStatus: (id: string, status: any) => void;
  deleteRoom: (id: string) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  getServiceName: (serviceId: string, serviceNameSnapshot?: string) => string;
  getTechnicianName: (technicianId: string) => string;
  handleDeleteItem: (index: number, item: OrderItem) => void;
  handleCheckout: () => Promise<void>;
  handleCompleteServiceOnly: () => Promise<void>;
  handleCompleteServiceAndCheckout: () => Promise<void>;
  checkoutData: any;
  setCheckoutData: (data: any) => void;
  selectedService: any;
  setSelectedService: (service: any) => void;
  modalStep: 'service' | 'technician';
  setModalStep: (step: 'service' | 'technician') => void;
  isCheckoutMode: boolean;
  setIsCheckoutMode: (mode: boolean) => void;
}

const ServiceManagementModal = React.memo(function ServiceManagementModal({
  show,
  onClose,
  selectedRoom,
  currentOrder,
  setCurrentOrder,
  serviceItems,
  serviceCategories,
  technicians,
  salespeople,
  businessSettings,
  companyCommissionRules,
  addOrder,
  updateOrder,
  updateRoom,
  updateTechnicianStatus,
  showNotification,
  getServiceName,
  getTechnicianName,
  handleDeleteItem,
  handleCheckout,
  handleCompleteServiceAndCheckout,
  checkoutData,
  setCheckoutData,
  selectedService,
  setSelectedService,
  modalStep,
  setModalStep,
  isCheckoutMode,
  setIsCheckoutMode
}: ServiceManagementModalProps) {

  // 分类选择状态
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 完成并结账防重复点击Hook
  const finishAndCheckoutClickHook = usePreventDoubleClick({
    delay: 2000,
    onSuccess: () => {
      showNotification('订单创建成功', 'success');
    },
    onError: () => {
      console.error('创建订单失败');
      showNotification('创建订单失败，请重试', 'error');
    }
  });

  // 结账防重复点击Hook
  const checkoutClickHook = usePreventDoubleClick({
    delay: 1500,
    onSuccess: () => {
      showNotification('结账成功', 'success');
    },
    onError: () => {
      console.error('结账失败');
      showNotification('结账失败，请重试', 'error');
    }
  });

  // 根据选择的分类过滤服务项目
  const filteredServiceItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return serviceItems;
    }
    return serviceItems?.filter(service => service.categoryId === selectedCategory) || [];
  }, [serviceItems, selectedCategory]);

  // 处理技师选择
  const handleTechnicianSelect = useCallback(async (technician: any) => {
    const serviceAssignment = technician.services?.find((s: any) => s.serviceId === selectedService.id);
    if (!serviceAssignment) return;

    // 获取该技师此服务使用的公司分成方案
    const companyCommissionRule = companyCommissionRules?.find(
      (rule: any) => rule.id === serviceAssignment.companyCommissionRuleId
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
    
    const updatedItems = [...(currentOrder?.items || []), newItem];
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
  }, [selectedService, companyCommissionRules, currentOrder?.items, setCurrentOrder, setSelectedService, setModalStep]);

  // 处理完成并结账
  const handleFinishAndCheckout = useCallback(async () => {
    if (!currentOrder?.items || currentOrder?.items.length === 0) {
      showNotification('请先添加至少一项服务', 'error');
      return;
    }
    
    await finishAndCheckoutClickHook.execute(async () => {
      // 如果是临时订单，先创建真实订单
      if (currentOrder?.id?.startsWith('temp-')) {
        const newOrder = {
          roomId: currentOrder?.roomId,
          roomName: currentOrder?.roomName,
          customerName: currentOrder?.customerName,
          customerPhone: currentOrder?.customerPhone,
          status: 'in_progress' as OrderStatus,
          items: currentOrder?.items || [],
          totalAmount: currentOrder?.totalAmount || 0,
          notes: currentOrder?.notes
        };
        
        const createdOrder = await addOrder(newOrder);
        await updateRoom(currentOrder?.roomId, { status: 'occupied' });
        
        // 更新所有相关技师状态为忙碌
        await Promise.all(
          (currentOrder?.items || []).map((item: OrderItem) => 
            item.technicianId ? updateTechnicianStatus(item.technicianId, 'busy') : Promise.resolve()
          )
        );
        
        setCurrentOrder(createdOrder);
      } else {
        // 如果订单已存在，更新订单项目到数据库
        await updateOrder(currentOrder?.id, {
          items: currentOrder?.items || [],
          totalAmount: currentOrder?.totalAmount || 0
        });
        
        // 更新所有相关技师状态为忙碌
        await Promise.all(
          (currentOrder?.items || []).map((item: OrderItem) => 
            item.technicianId ? updateTechnicianStatus(item.technicianId, 'busy') : Promise.resolve()
          )
        );
      }
      
      // 重置选择状态（除了结账模式）
      setSelectedService(null);
      setModalStep('service');
      
      // 初始化结账数据
      setCheckoutData({
        customerName: currentOrder?.customerName || '',
        selectedSalespersonId: currentOrder?.items?.[0]?.salespersonId || '',
        receivedAmount: currentOrder?.receivedAmount ? currentOrder?.receivedAmount.toString() : currentOrder?.totalAmount?.toString() || '0'
      });
      setIsCheckoutMode(true);
    });
  }, [finishAndCheckoutClickHook, currentOrder, addOrder, updateRoom, updateOrder, updateTechnicianStatus, setCurrentOrder, setSelectedService, setModalStep, setCheckoutData, setIsCheckoutMode]);

  // 处理完成
  const handleFinish = useCallback(async () => {
    if (!currentOrder?.items || currentOrder?.items.length === 0) {
      showNotification('请先添加至少一项服务', 'error');
      return;
    }
    
    // 如果是临时订单，先创建真实订单
    if (currentOrder?.id?.startsWith('temp-')) {
      try {
        const newOrder = {
          roomId: currentOrder?.roomId,
          roomName: currentOrder?.roomName,
          customerName: currentOrder?.customerName,
          customerPhone: currentOrder?.customerPhone,
          status: 'in_progress' as OrderStatus,
          items: currentOrder?.items || [],
          totalAmount: currentOrder?.totalAmount || 0,
          notes: currentOrder?.notes
        };
        
        const createdOrder = await addOrder(newOrder);
        await updateRoom(currentOrder?.roomId, { status: 'occupied' });
        
        // 更新所有相关技师状态为忙碌
        await Promise.all(
          (currentOrder?.items || []).map((item: OrderItem) => 
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
        await updateOrder(currentOrder?.id, {
          items: currentOrder?.items || [],
          totalAmount: currentOrder?.totalAmount || 0
        });
        
        // 更新所有相关技师状态为忙碌
        await Promise.all(
          (currentOrder?.items || []).map((item: OrderItem) => 
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
    onClose();
  }, [currentOrder, addOrder, updateRoom, updateOrder, updateTechnicianStatus, showNotification, setCurrentOrder, setSelectedService, setModalStep, setIsCheckoutMode, onClose]);

  // 处理取消
  const handleCancel = useCallback(() => {
    // 重置所有选择状态
    setSelectedService(null);
    setModalStep('service');
    setIsCheckoutMode(false);
    
    // 如果是临时订单，直接关闭
    if (currentOrder?.id?.startsWith('temp-')) {
      setCurrentOrder(null);
    }
    
    onClose();
  }, [currentOrder, setSelectedService, setModalStep, setIsCheckoutMode, setCurrentOrder, onClose]);

  if (!show || !selectedRoom || !currentOrder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">{selectedRoom.name}</h3>
            </div>
            <button
              onClick={handleCancel}
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
                <span className="text-sm text-gray-600">共 {currentOrder?.items?.length || 0} 项</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {currentOrder?.items?.map((item: OrderItem, index: number) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <h5 className="font-semibold text-gray-900 text-lg">{getServiceName(item.serviceId, item.serviceName)}</h5>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">技师:</span>
                          <span className="ml-2 font-medium text-gray-700">{item.technicianName || (item.technicianId ? getTechnicianName(item.technicianId) : '未知技师')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">价格:</span>
                          <span className="ml-2 font-bold text-green-600">{formatCurrency(item.price, businessSettings)}</span>
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
              
              {(!currentOrder?.items || currentOrder?.items.length === 0) && (
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
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">总计</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(currentOrder?.totalAmount || 0, businessSettings)}
                </span>
              </div>
              
              {/* 收款状态显示 */}
              {currentOrder?.receivedAmount && parseFloat(currentOrder?.receivedAmount) > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">实收金额</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(currentOrder.receivedAmount, businessSettings)}
                    </span>
                  </div>
                </div>
              )}
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
                    
                    {/* 分类选择 */}
                    <div className="mb-4">
                      <div className="grid grid-cols-5 gap-2">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            selectedCategory === 'all'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          全部
                        </button>
                        {serviceCategories?.slice(0, 4).map((category) => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              selectedCategory === category.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {filteredServiceItems?.map((service) => {
                        // 计算该服务有多少个可用技师
                        const availableTechnicians = technicians?.filter(tech => 
                          tech.status === 'available' && 
                          tech.services?.some((s: any) => s.serviceId === service.id)
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
                      {technicians?.filter(tech => tech.status === 'available').map((technician) => {
                        const serviceAssignment = technician.services?.find((s: any) => s.serviceId === selectedService.id);
                        if (!serviceAssignment) return null;
                        
                        return (
                          <button
                            key={technician.id}
                            onClick={() => handleTechnicianSelect(technician)}
                            className="text-left p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900 text-lg group-hover:text-green-700 transition-colors">
                                  {technician.employeeId}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  💰 {formatCurrency(serviceAssignment.price, businessSettings)}
                                </div>
                                {serviceAssignment.commission > 0 && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    抽成: {formatCurrency(serviceAssignment.commission, businessSettings)}
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
                      onChange={(e) => setCheckoutData((prev: any) => ({ ...prev, customerName: e.target.value }))}
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
                      {formatCurrency(currentOrder?.totalAmount || 0, businessSettings)}
                    </div>
                  </div>

                  {/* 实收金额 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      !checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0 
                      ? 'text-red-600' 
                      : 'text-gray-700'
                    }`}>
                      实收金额 {(!checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0) && <span className="text-red-500">*</span>}
                    </label>
                    
                    {/* 已收款状态显示 */}
                    {currentOrder?.receivedAmount && parseFloat(currentOrder?.receivedAmount) > 0 && (
                      <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-green-700 text-sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span>当前订单已收款: {formatCurrency(currentOrder.receivedAmount, businessSettings)}</span>
                        </div>
                      </div>
                    )}
                    
                    <input
                      type="number"
                      value={checkoutData.receivedAmount}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        // 如果当前订单已收款，显示提示
                        if (currentOrder?.receivedAmount && parseFloat(currentOrder?.receivedAmount) > 0 && newValue !== currentOrder.receivedAmount.toString()) {
                          showNotification('当前订单已收款，再次输入将修改实收金额', 'warning');
                        }
                        setCheckoutData((prev: any) => ({ ...prev, receivedAmount: newValue }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        !checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder={currentOrder?.receivedAmount && parseFloat(currentOrder?.receivedAmount) > 0 ? "当前已收款，可修改实收金额" : "请输入实收金额"}
                      step="0.01"
                      min="0"
                    />
                    {(!checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0) && (
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
                      onChange={(e) => setCheckoutData((prev: any) => ({ ...prev, selectedSalespersonId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">选择销售员</option>
                      {salespeople?.map(salesperson => (
                        <option key={salesperson.id} value={salesperson.id}>
                          {salesperson.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 操作按钮 */}
                  <div className="pt-4">
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          console.log('🔍 结账按钮被点击');
                          if (!checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0) {
                            showNotification('请输入实收金额', 'error');
                            return;
                          }
                          checkoutClickHook.execute(() => handleCheckout());
                        }}
                        disabled={!checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0 || checkoutClickHook.isLoading}
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {checkoutClickHook.isLoading ? (
                          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <CreditCard className="h-5 w-5 mr-2" />
                        )}
                        {checkoutClickHook.isLoading ? '结账中...' : '仅结账'}
                      </button>
                      <button
                        onClick={() => {
                          console.log('🔍 完成服务并结账按钮被点击');
                          if (!checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0) {
                            showNotification('请输入实收金额', 'error');
                            return;
                          }
                          checkoutClickHook.execute(() => handleCompleteServiceAndCheckout());
                        }}
                        disabled={!checkoutData.receivedAmount || parseFloat(checkoutData.receivedAmount) === 0 || checkoutClickHook.isLoading}
                        className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {checkoutClickHook.isLoading ? (
                          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <CheckCircle className="h-5 w-5 mr-2" />
                        )}
                        {checkoutClickHook.isLoading ? '处理中...' : '完成服务并结账'}
                      </button>
                    </div>
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
                                  房间: {selectedRoom.name} | 客户: {currentOrder?.customerName || '散客'}
            </div>
            <div className="flex space-x-3">
              {/* 取消按钮 */}
              <button
                onClick={handleCancel}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              
              {/* 完成并结账按钮 */}
              <button
                onClick={handleFinishAndCheckout}
                disabled={finishAndCheckoutClickHook.isLoading}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {finishAndCheckoutClickHook.isLoading ? (
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {finishAndCheckoutClickHook.isLoading ? '处理中...' : '完成并结账'}
              </button>
              
              {/* 完成按钮 */}
              <button
                onClick={handleFinish}
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
  );
});

export default ServiceManagementModal; 