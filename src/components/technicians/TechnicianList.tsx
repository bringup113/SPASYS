import React from 'react';
import { Technician } from '../../types';
import { Edit, Copy, Trash2 } from 'lucide-react';

interface TechnicianListProps {
  technicians: Technician[];
  countries: any[];
  onEdit: (technician: Technician) => void;
  onCopy: (technician: Technician) => void;
  onDelete: (technician: Technician) => void;
}

export default function TechnicianList({
  technicians,
  countries,
  onEdit,
  onCopy,
  onDelete
}: TechnicianListProps) {
  const getCountryName = (countryId: string) => {
    const country = countries?.find(c => c.id === countryId);
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
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {technicians.map((technician) => (
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
} 