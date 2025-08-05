import React, { useMemo, useState } from 'react';
import { Technician } from '../../types';

interface TechnicianListProps {
  technicians: Technician[];
  countries: any[];
  serviceItems: any[];
  companyCommissionRules: any[];
  onEdit: (technician: Technician) => void;
  onCopy: (technician: Technician) => void;
  onDelete: (technician: Technician) => void;
  onBatchDelete: (technicianIds: string[]) => void;
  onBatchUpdateStatus: (technicianIds: string[], status: string) => void;
  onBatchUpdateCommissionRule: (technicianIds: string[], ruleId: string) => void;
}

const TechnicianList = React.memo(function TechnicianList({
  technicians,
  countries,
  serviceItems,
  companyCommissionRules,
  onEdit,
  onCopy,
  onDelete,
  onBatchDelete,
  onBatchUpdateStatus,
  onBatchUpdateCommissionRule
}: TechnicianListProps) {
  const [selectedTechnicians, setSelectedTechnicians] = useState<Set<string>>(new Set());

  // 缓存国家名称映射
  const countryNameMap = useMemo(() => {
    const map = new Map();
    countries?.forEach(country => {
      map.set(country.id, country.name);
    });
    return map;
  }, [countries]);

  // 缓存服务名称映射
  const serviceNameMap = useMemo(() => {
    const map = new Map();
    serviceItems?.forEach(service => {
      map.set(service.id, service.name);
    });
    return map;
  }, [serviceItems]);

  // 缓存抽成方案名称映射
  const commissionRuleMap = useMemo(() => {
    const map = new Map();
    companyCommissionRules?.forEach(rule => {
      map.set(rule.id, rule.name);
    });
    return map;
  }, [companyCommissionRules]);

  const getCountryName = (countryId: string) => {
    return countryNameMap.get(countryId) || '未知国家';
  };

  const getServiceName = (serviceId: string) => {
    return serviceNameMap.get(serviceId) || '未知服务';
  };

  const getCommissionRuleName = (ruleId: string) => {
    return commissionRuleMap.get(ruleId) || '未知方案';
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

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTechnicians(new Set(technicians.map(t => t.id)));
    } else {
      setSelectedTechnicians(new Set());
    }
  };

  // 处理单个选择
  const handleSelectTechnician = (technicianId: string, checked: boolean) => {
    const newSelected = new Set(selectedTechnicians);
    if (checked) {
      newSelected.add(technicianId);
    } else {
      newSelected.delete(technicianId);
    }
    setSelectedTechnicians(newSelected);
  };

  // 批量操作处理函数
  const handleBatchDelete = () => {
    if (selectedTechnicians.size > 0) {
      onBatchDelete(Array.from(selectedTechnicians));
    }
  };

  const handleBatchUpdateStatus = (status: string) => {
    if (selectedTechnicians.size > 0) {
      onBatchUpdateStatus(Array.from(selectedTechnicians), status);
    }
  };

  const handleBatchUpdateCommissionRule = (ruleId: string) => {
    if (selectedTechnicians.size > 0) {
      onBatchUpdateCommissionRule(Array.from(selectedTechnicians), ruleId);
    }
  };

  // 缓存表格行数据
  const tableRows = useMemo(() => {
    return technicians
      .map((technician) => ({
        ...technician,
        countryName: getCountryName(technician.countryId),
        statusColor: getStatusColor(technician.status),
        statusText: getStatusText(technician.status)
      }))
      .sort((a, b) => {
        // 首先按国家名称排序
        const countryComparison = a.countryName.localeCompare(b.countryName);
        if (countryComparison !== 0) {
          return countryComparison;
        }
        // 如果国家相同，按创建时间排序（旧的在前）
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [technicians, countryNameMap]);

  const isAllSelected = technicians.length > 0 && selectedTechnicians.size === technicians.length;
  const isIndeterminate = selectedTechnicians.size > 0 && selectedTechnicians.size < technicians.length;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">技师列表</h3>
          {selectedTechnicians.size > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                已选择 {selectedTechnicians.size} 个技师
              </span>
              <div className="flex space-x-2">
                <select
                  onChange={(e) => handleBatchUpdateStatus(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">批量修改状态</option>
                  <option value="available">设为可用</option>
                  <option value="busy">设为忙碌</option>
                  <option value="offline">设为离线</option>
                </select>
                <select
                  onChange={(e) => handleBatchUpdateCommissionRule(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">批量修改分成方案</option>
                  {companyCommissionRules?.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  批量删除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                工号
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                国籍
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                入职时间
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                服务项目
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableRows.map((technician) => (
              <tr key={technician.id} className={selectedTechnicians.has(technician.id) ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={selectedTechnicians.has(technician.id)}
                    onChange={(e) => handleSelectTechnician(technician.id, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                  {technician.employeeId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {technician.countryName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {technician.hireDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${technician.statusColor}`}>
                    {technician.statusText}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 text-center">
                  {technician.services && technician.services.length > 0 ? (
                    <div className="space-y-1">
                      {technician.services.map((service, index) => (
                        <div key={index} className="text-xs">
                          {getServiceName(service.serviceId)} - {service.price}฿
                          {service.commission > 0 && ` (抽成: ${service.commission}฿)`}
                          {service.companyCommissionRuleId && ` | 分成: ${getCommissionRuleName(service.companyCommissionRuleId)}`}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">暂无服务项目</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => onEdit(technician)}
                      className="text-blue-600 hover:text-blue-900 px-2 py-1 text-sm rounded hover:bg-blue-50 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => onCopy(technician)}
                      className="text-green-600 hover:text-green-900 px-2 py-1 text-sm rounded hover:bg-green-50 transition-colors"
                    >
                      复制
                    </button>
                    <button
                      onClick={() => onDelete(technician)}
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
  );
});

export default TechnicianList; 