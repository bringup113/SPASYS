import React from 'react';
import { HelpCircle, CheckCircle } from 'lucide-react';
import { Order, OrderStatus, BusinessSettings } from '../../types';
import { formatCurrency } from '../../utils/currencyUtils';

interface OrderRowProps {
  order: Order;
  businessSettings: BusinessSettings | undefined;
  getServiceName: (serviceId: string, serviceName?: string) => string;
  getRoomName: (roomId: string, roomName?: string) => string;
  getTechnicianDisplay: (technicianId?: string, technicianName?: string) => {
    text: string;
    isDeparted: boolean;
    tooltip: string;
  };
  getStatusColor: (status: OrderStatus) => string;
  getStatusText: (status: OrderStatus) => string;
  getStatusIcon: (status: OrderStatus) => any;
  onViewDetail: (order: Order) => void;
  onCancelOrder: (orderId: string) => void;
  onDeleteOrder: (order: Order) => void;
}

const OrderRow = React.memo(function OrderRow({
  order,
  businessSettings,
  getServiceName,
  getRoomName,
  getTechnicianDisplay,
  getStatusColor,
  getStatusText,
  getStatusIcon,
  onViewDetail,
  onCancelOrder,
  onDeleteOrder
}: OrderRowProps) {
  const StatusIcon = getStatusIcon(order.status);

  // 计算订单总金额
  const calculateOrderTotal = (order: Order) => {
    return order.totalAmount;
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-200">
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <button
          onClick={() => onViewDetail(order)}
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
              const serviceName = getServiceName(item.serviceId, item.serviceName);
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
        {formatCurrency(calculateOrderTotal(order), businessSettings)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
        {order.receivedAmount ? (
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">已收款</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(order.receivedAmount, businessSettings)}
            </span>
          </div>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {getStatusText(order.status)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
        <div className="flex space-x-2 justify-center">
          {/* 只对已完成或已取消的订单显示操作按钮 */}
          {(order.status === 'completed' || order.status === 'cancelled') && (
            <button
              onClick={() => onDeleteOrder(order)}
              className="text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-300 hover:bg-red-50 transition-colors"
              title="删除订单"
            >
              删除
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export default OrderRow; 