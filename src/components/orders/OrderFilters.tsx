import { Filter } from 'lucide-react';
import { Room, Technician, ServiceItem } from '../../types';

interface OrderFiltersProps {
  filters: {
    startDate: string;
    endDate: string;
    roomId: string;
    technicianId: string;
    serviceId: string;
    status: string;
  };
  setFilters: (filters: any) => void;
  resetFilters: () => void;
  rooms: Room[] | undefined;
  technicians: Technician[] | undefined;
  serviceItems: ServiceItem[] | undefined;
  filteredOrdersCount: number;
  totalOrdersCount: number;
}

export default function OrderFilters({
  filters,
  setFilters,
  resetFilters,
  rooms,
  technicians,
  serviceItems,
  filteredOrdersCount,
  totalOrdersCount
}: OrderFiltersProps) {
  return (
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
            {rooms?.map(room => (
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
            {technicians?.map(technician => (
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
            {serviceItems?.map(service => (
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
                <span className="text-sm font-bold">{filteredOrdersCount}</span>
              </div>
              <div>
                <p className="text-sm font-medium">筛选结果</p>
                <p className="text-xs opacity-90">
                  共找到 {filteredOrdersCount} 条记录
                  {totalOrdersCount > 0 && (
                    <span> (共 {totalOrdersCount} 条)</span>
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
  );
} 