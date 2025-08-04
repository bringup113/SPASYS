import React from 'react';
import { Order, BusinessSettings } from '../../types';
import OrderRow from './OrderRow';

interface OrderTableProps {
  currentOrders: Order[];
  businessSettings: BusinessSettings | undefined;
  getServiceName: (serviceId: string) => string;
  getRoomName: (roomId: string, roomName?: string) => string;
  getTechnicianDisplay: (technicianId?: string, technicianName?: string) => {
    text: string;
    isDeparted: boolean;
    tooltip: string;
  };
  getStatusColor: (status: any) => string;
  getStatusText: (status: any) => string;
  getStatusIcon: (status: any) => any;
  onViewDetail: (order: Order) => void;
  onCancelOrder: (orderId: string) => void;
  // 分页相关
  currentPage: number;
  pageSize: number;
  totalOrders: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const OrderTable = React.memo(function OrderTable({
  currentOrders,
  businessSettings,
  getServiceName,
  getRoomName,
  getTechnicianDisplay,
  getStatusColor,
  getStatusText,
  getStatusIcon,
  onViewDetail,
  onCancelOrder,
  currentPage,
  pageSize,
  totalOrders,
  totalPages,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange
}: OrderTableProps) {
  return (
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
            {currentOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                businessSettings={businessSettings}
                getServiceName={getServiceName}
                getRoomName={getRoomName}
                getTechnicianDisplay={getTechnicianDisplay}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                getStatusIcon={getStatusIcon}
                onViewDetail={onViewDetail}
                onCancelOrder={onCancelOrder}
              />
            ))}
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
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
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
                        onPageChange(page);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
                <span className="text-sm text-gray-600">页</span>
              </div>
              
              <button
                onClick={() => onPageChange(currentPage - 1)}
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
                    onClick={() => onPageChange(pageNum)}
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
                onClick={() => onPageChange(currentPage + 1)}
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
  );
});

export default OrderTable; 