import React, { useState, useMemo, useCallback } from 'react';
import { ServiceAssignment } from '../../types';
import { Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

interface ServiceAssignmentFormProps {
  services: ServiceAssignment[];
  serviceItems: any[];
  companyCommissionRules: any[];
  businessSettings: any;
  onServicesChange: (services: ServiceAssignment[]) => void;
}

const ServiceAssignmentForm = React.memo(function ServiceAssignmentForm({
  services,
  serviceItems,
  companyCommissionRules,
  businessSettings,
  onServicesChange
}: ServiceAssignmentFormProps) {
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

  const addServiceToTechnician = useCallback(() => {
    if (newService.serviceId && newService.price > 0) {
      onServicesChange([...services, { ...newService }]);
      setNewService({ serviceId: '', price: 0, commission: 0, companyCommissionRuleId: 'default-rule' });
    }
  }, [newService, services, onServicesChange]);

  const removeServiceFromTechnician = useCallback((index: number) => {
    onServicesChange(services.filter((_, i) => i !== index));
  }, [services, onServicesChange]);

  const startEditService = useCallback((index: number, service: ServiceAssignment) => {
    setEditingServiceIndex(index);
    setEditingService({ 
      ...service, 
      companyCommissionRuleId: service.companyCommissionRuleId || 'default-rule' 
    });
  }, []);

  const saveEditService = useCallback(() => {
    if (editingServiceIndex !== null) {
      const updatedServices = services.map((service, index) =>
        index === editingServiceIndex ? editingService : service
      );
      onServicesChange(updatedServices);
      setEditingServiceIndex(null);
      setEditingService({ serviceId: '', price: 0, commission: 0, companyCommissionRuleId: 'default-rule' });
    }
  }, [editingServiceIndex, editingService, services, onServicesChange]);

  const cancelEditService = useCallback(() => {
    setEditingServiceIndex(null);
    setEditingService({ serviceId: '', price: 0, commission: 0, companyCommissionRuleId: 'default-rule' });
  }, []);

  // 缓存服务名称映射
  const serviceNameMap = useMemo(() => {
    const map = new Map();
    serviceItems?.forEach(service => {
      map.set(service.id, service.name);
    });
    return map;
  }, [serviceItems]);

  const getServiceName = useCallback((serviceId: string | null) => {
    if (!serviceId) {
      return '未设置服务';
    }
    return serviceNameMap.get(serviceId) || '未知服务';
  }, [serviceNameMap]);

  return (
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
              {serviceItems?.map((service) => (
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
              {companyCommissionRules?.map((rule) => (
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
      {services.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h5 className="text-md font-semibold text-gray-800 mb-4">已添加的项目</h5>
          <div className="space-y-3">
            {services.map((service, index) => (
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
                          {serviceItems?.map((item) => (
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
                          {companyCommissionRules?.map((rule) => (
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
                      价格: {formatCurrency(service.price, businessSettings)}
                      {service.commission > 0 && ` | 抽成: ${formatCurrency(service.commission, businessSettings)}`}
                      {service.companyCommissionRuleId && (
                        <span className="ml-2">
                          | 分成方案: {companyCommissionRules?.find(r => r.id === service.companyCommissionRuleId)?.name || '未知'}
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
  );
});

export default ServiceAssignmentForm; 