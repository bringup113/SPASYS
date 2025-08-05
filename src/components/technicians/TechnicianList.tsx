import React, { useMemo } from 'react';
import { Technician } from '../../types';

interface TechnicianListProps {
  technicians: Technician[];
  countries: any[];
  serviceItems: any[];
  companyCommissionRules: any[];
  onEdit: (technician: Technician) => void;
  onCopy: (technician: Technician) => void;
  onDelete: (technician: Technician) => void;
}

const TechnicianList = React.memo(function TechnicianList({
  technicians,
  countries,
  serviceItems,
  companyCommissionRules,
  onEdit,
  onCopy,
  onDelete
}: TechnicianListProps) {
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

  // 缓存表格行数据
  const tableRows = useMemo(() => {
    return technicians.map((technician) => ({
      ...technician,
      countryName: getCountryName(technician.countryId),
      statusColor: getStatusColor(technician.status),
      statusText: getStatusText(technician.status)
    }));
  }, [technicians, countryNameMap]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">技师列表</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
              <tr key={technician.id}>
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
                    <div className="space-y-2">
                      {technician.services.map((service, index) => (
                        <div key={index} className="text-xs border border-gray-200 rounded p-2 bg-gray-50">
                          <div className="font-medium text-gray-900">{getServiceName(service.serviceId)}</div>
                          <div className="text-gray-600">
                            价格: {service.price}฿
                            {service.commission > 0 && ` | 抽成: ${service.commission}฿`}
                          </div>
                          {service.companyCommissionRuleId && (
                            <div className="text-gray-500">
                              分成方案: {getCommissionRuleName(service.companyCommissionRuleId)}
                            </div>
                          )}
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