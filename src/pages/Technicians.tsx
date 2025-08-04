import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Technician, ServiceAssignment } from '../types';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';
import Notification from '../components/Notification';

export default function Technicians() {
  const { state, addTechnician, updateTechnician, deleteTechnician } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingTechnician, setDeletingTechnician] = useState<Technician | null>(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' as 'success' | 'error' | 'warning' });
  
  // 显示通知
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000);
  };
  
  const [formData, setFormData] = useState({
    employeeId: '',
    countryId: '',
    hireDate: '',
    status: 'available' as 'available' | 'busy' | 'offline',
    services: [] as ServiceAssignment[]
  });

  const [newService, setNewService] = useState({
    serviceId: '',
    price: 0,
    commission: 0,
    companyCommissionRuleId: 'default-rule'
  });

  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [editingService, setEditingService] = useState({
    serviceId: '',
    price: 0,
    commission: 0,
    companyCommissionRuleId: 'default-rule'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查是否有未完成的订单
    if (editingId) {
      const hasUnfinishedOrders = state.orders?.some(order => 
        order.status === 'in_progress' && 
        order.items?.some(item => item.technicianId === editingId)
      );
      
      if (hasUnfinishedOrders) {
        setNotification({
          show: true,
          message: '该技师还有未完成订单，无法进行操作！',
          type: 'error'
        });
        return;
      }
    }
    
    try {
      if (editingId) {
        await updateTechnician(editingId, formData);
        setEditingId(null);
      } else {
        await addTechnician(formData);
      }
      setFormData({
        employeeId: '',
        countryId: '',
        hireDate: '',
        status: 'available' as 'available' | 'busy' | 'offline',
        services: []
      });
      setShowModal(false);
    } catch (error) {
      console.error('保存技师失败:', error);
      showNotification('保存技师失败，请重试', 'error');
    }
  };

  const handleEdit = (technician: Technician) => {
    setEditingId(technician.id);
    setFormData({
      employeeId: technician.employeeId,
      countryId: technician.countryId,
      hireDate: technician.hireDate,
      status: technician.status,
      services: technician.services
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      employeeId: '',
      countryId: '',
      hireDate: '',
      status: 'available' as 'available' | 'busy' | 'offline',
      services: []
    });
    setShowModal(true);
  };

  const handleCopy = (technician: Technician) => {
    setEditingId(null);
    setFormData({
      employeeId: '',
      countryId: technician.countryId,
      hireDate: technician.hireDate,
      status: technician.status,
      services: technician.services
    });
    setShowModal(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowModal(false);
    setFormData({
      employeeId: '',
      countryId: '',
      hireDate: '',
      status: 'available' as 'available' | 'busy' | 'offline',
      services: []
    });
  };

  const addServiceToTechnician = () => {
    if (newService.serviceId && newService.price > 0) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, { ...newService }]
      }));
      setNewService({ serviceId: '', price: 0, commission: 0, companyCommissionRuleId: 'default-rule' });
    }
  };

  const removeServiceFromTechnician = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const startEditService = (index: number, service: ServiceAssignment) => {
    setEditingServiceIndex(index);
    setEditingService({ 
      ...service, 
      companyCommissionRuleId: service.companyCommissionRuleId || 'default-rule' 
    });
  };

  const saveEditService = () => {
    if (editingServiceIndex !== null) {
      setFormData(prev => ({
        ...prev,
        services: prev.services.map((service, index) =>
          index === editingServiceIndex ? editingService : service
        )
      }));
      setEditingServiceIndex(null);
      setEditingService({ serviceId: '', price: 0, commission: 0, companyCommissionRuleId: 'default-rule' });
    }
  };

  const cancelEditService = () => {
    setEditingServiceIndex(null);
    setEditingService({ serviceId: '', price: 0, commission: 0, companyCommissionRuleId: 'default-rule' });
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) {
      return '未设置服务';
    }
    const service = state.serviceItems?.find(s => s.id === serviceId);
    if (!service) {
      console.log('🔍 调试服务信息:', {
        serviceId,
        serviceItemsCount: state.serviceItems?.length || 0,
        serviceItems: state.serviceItems?.map(s => ({ id: s.id, name: s.name }))
      });
    }
    return service ? service.name : '未知服务';
  };



  const getCountryName = (countryId: string) => {

    const country = state.countries?.find(c => c.id === countryId);
    return country ? country.name : '未知国家';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return '可用';
      case 'busy': return '忙碌';
      case 'offline': return '离线';
      default: return status;
    }
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
          <h1 className="text-3xl font-bold text-gray-900">技师管理</h1>
          <p className="mt-2 text-gray-600">管理技师信息和项目收费</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加技师
          </button>
        </div>
      </div>

      {/* 技师列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">技师列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  工号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  国籍
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  入职时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  服务项目
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.technicians.map((technician) => (
                <tr key={technician.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {technician.employeeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getCountryName(technician.countryId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {technician.hireDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(technician.status)}`}>
                      {getStatusText(technician.status)}
                    </span>
                  </td>


                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(technician)}
                        className="text-blue-600 hover:text-blue-900 px-2 py-1 text-sm rounded hover:bg-blue-50 transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleCopy(technician)}
                        className="text-green-600 hover:text-green-900 px-2 py-1 text-sm rounded hover:bg-green-50 transition-colors"
                      >
                        复制
                      </button>
                      <button
                        onClick={() => setDeletingTechnician(technician)}
                        className="text-red-600 hover:text-red-900 px-2 py-1 text-sm rounded hover:bg-red-50 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 添加/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto mx-4 transform transition-all duration-300 scale-100">
            {/* 模态框头部 */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-t-2xl px-8 py-6 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {editingId ? '编辑技师信息' : '添加新技师'}
                    </h3>
                    <p className="text-orange-100 text-sm mt-1">
                      {editingId ? '修改技师信息和项目设置' : '创建新的技师档案'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-white hover:text-orange-200 transition-colors duration-200 p-3 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* 模态框内容 */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
              {/* 基本信息 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-orange-600 font-bold text-sm">1</span>
                  </div>
                  基本信息
                </h4>
                <div className="space-y-6">
                  {/* 第一行：工号、国籍、入职时间、状态 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        工号 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:bg-gray-50"
                        required
                        placeholder="请输入唯一工号"
                      />
                      <p className="mt-1 text-xs text-gray-500">工号必须唯一，不可重复</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        国籍 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.countryId}
                        onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:bg-gray-50"
                        required
                      >
                        <option value="">请选择国家</option>
                        {state.countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        入职时间 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:bg-gray-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        状态
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="relative cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            value="available"
                            checked={formData.status === 'available'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'available' | 'busy' | 'offline' })}
                            className="sr-only"
                          />
                          <div className={`w-full p-2 text-center rounded-lg border-2 transition-all duration-200 ${
                            formData.status === 'available'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}>
                            <div className="text-xs font-medium">可用</div>
                          </div>
                        </label>
                        <label className="relative cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            value="busy"
                            checked={formData.status === 'busy'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'available' | 'busy' | 'offline' })}
                            className="sr-only"
                          />
                          <div className={`w-full p-2 text-center rounded-lg border-2 transition-all duration-200 ${
                            formData.status === 'busy'
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}>
                            <div className="text-xs font-medium">忙碌</div>
                          </div>
                        </label>
                        <label className="relative cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            value="offline"
                            checked={formData.status === 'offline'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'available' | 'busy' | 'offline' })}
                            className="sr-only"
                          />
                          <div className={`w-full p-2 text-center rounded-lg border-2 transition-all duration-200 ${
                            formData.status === 'offline'
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}>
                            <div className="text-xs font-medium">离线</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                  

                </div>
              </div>

              {/* 服务项目设置 */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  服务项目设置
                </h4>
                
                {/* 添加新服务项目 */}
                <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                  <h5 className="text-md font-semibold text-gray-800 mb-4">添加服务项目</h5>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">服务项目</label>
                      <select
                        value={newService.serviceId}
                        onChange={(e) => setNewService({ ...newService, serviceId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="">选择服务项目</option>
                        {state.serviceItems?.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">服务价格</label>
                      <input
                        type="number"
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">技师抽成</label>
                      <input
                        type="number"
                        value={newService.commission}
                        onChange={(e) => setNewService({ ...newService, commission: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">公司分成方案</label>
                      <select
                        value={newService.companyCommissionRuleId}
                        onChange={(e) => setNewService({ ...newService, companyCommissionRuleId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        {state.companyCommissionRules?.map((rule) => (
                          <option key={rule.id} value={rule.id}>
                            {rule.name} {rule.isDefault && '(默认)'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addServiceToTechnician}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                </div>

                {/* 已添加的服务项目列表 */}
                {formData.services.length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h5 className="text-md font-semibold text-gray-800 mb-4">已添加的项目</h5>
                    <div className="space-y-3">
                      {formData.services.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                          {editingServiceIndex === index ? (
                            // 编辑模式
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">服务项目</label>
                                  <select
                                    value={editingService.serviceId}
                                    onChange={(e) => setEditingService({ ...editingService, serviceId: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="">选择服务</option>
                                    {state.serviceItems?.map((item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">价格</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editingService.price}
                                    onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">抽成</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editingService.commission}
                                    onChange={(e) => setEditingService({ ...editingService, commission: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">分成方案</label>
                                  <select
                                    value={editingService.companyCommissionRuleId}
                                    onChange={(e) => setEditingService({ ...editingService, companyCommissionRuleId: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    {state.companyCommissionRules?.map((rule) => (
                                      <option key={rule.id} value={rule.id}>
                                        {rule.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2 mt-3">
                                <button
                                  type="button"
                                  onClick={saveEditService}
                                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                  保存
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditService}
                                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          ) : (
                            // 显示模式
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{getServiceName(service.serviceId)}</div>
                              <div className="text-sm text-gray-600">
                                价格: {formatCurrency(service.price, state)}
                                {service.commission > 0 && ` | 抽成: ${formatCurrency(service.commission, state)}`}
                                {service.companyCommissionRuleId && (
                                  <span className="ml-2">
                                    | 分成方案: {state.companyCommissionRules?.find(r => r.id === service.companyCommissionRuleId)?.name || '未知'}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex space-x-2 ml-4">
                            {editingServiceIndex !== index && (
                              <button
                                type="button"
                                onClick={() => startEditService(index, service)}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="编辑"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeServiceFromTechnician(index)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 操作按钮 */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-medium flex items-center shadow-lg hover:shadow-xl"
                >
                  <Check className="h-5 w-5 mr-2" />
                  {editingId ? '更新技师' : '添加技师'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deletingTechnician && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
            {/* 对话框头部 */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl px-6 py-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">确认删除</h3>
                  <p className="text-red-100 text-sm mt-1">此操作不可撤销</p>
                </div>
              </div>
            </div>
            
            {/* 对话框内容 */}
            <div className="px-6 py-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  确定要删除技师 <span className="font-semibold text-red-600">"{deletingTechnician.employeeId}"</span> 吗？
                </p>
                <p className="text-sm text-gray-500">
                  删除后将无法恢复，相关的服务分配信息也会被清除。
                </p>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeletingTechnician(null)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    // 检查是否有进行中的订单
                    const hasInProgressOrders = state.orders?.some(order => 
                      order.status === 'in_progress' && 
                      order.items?.some(item => item.technicianId === deletingTechnician.id)
                    );
                    
                    if (hasInProgressOrders) {
                      setNotification({
                        show: true,
                        message: '该技师还有进行中订单，无法删除',
                        type: 'error'
                      });
                      setDeletingTechnician(null);
                      return;
                    }
                    
                    deleteTechnician(deletingTechnician.id);
                    setDeletingTechnician(null);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 