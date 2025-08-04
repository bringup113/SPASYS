import React, { useMemo } from 'react';
import { X, Eye } from 'lucide-react';
import { Order, OrderStatus, BusinessSettings } from '../../types';
import { formatTime } from '../../utils/timeUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import { CommissionCalculator } from '../../utils/commissionUtils';

interface OrderDetailModalProps {
  isOpen: boolean;
  order: Order | null;
  businessSettings: BusinessSettings | undefined;
  companyCommissionRules: any[] | undefined;
  onClose: () => void;
  getServiceName: (serviceId: string) => string;
  getRoomName: (roomId: string, roomName?: string) => string;
  getStatusColor: (status: OrderStatus) => string;
  getStatusText: (status: OrderStatus) => string;
}

const OrderDetailModal = React.memo(function OrderDetailModal({
  isOpen,
  order,
  businessSettings,
  companyCommissionRules,
  onClose,
  getServiceName,
  getRoomName,
  getStatusColor,
  getStatusText
}: OrderDetailModalProps) {
  if (!isOpen || !order) return null;

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
      companyCommissionRules || []
    );
  };

  return (
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
                <p className="text-blue-100 mt-1">订单号: {order.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
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
                    <span className="font-medium">{getRoomName(order.roomId, order.roomName)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">客户:</span>
                    <span className="font-medium">{order.customerName || '散客'}</span>
                  </div>
                  {order.items.some(item => item.salespersonName) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">销售员:</span>
                      <span className="font-medium">
                        {Array.from(new Set(order.items
                          .filter(item => item.salespersonName)
                          .map(item => item.salespersonName)
                        )).join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">状态:</span>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">创建时间:</span>
                    <span className="font-medium">{formatTime(new Date(order.createdAt), businessSettings)}</span>
                  </div>
                  {order.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">完成时间:</span>
                      <span className="font-medium">{formatTime(new Date(order.completedAt), businessSettings)}</span>
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
                    <span className="font-medium">{formatCurrency(calculateOrderTotal(order), businessSettings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">实收金额:</span>
                    <span className="font-medium">{order.receivedAmount ? formatCurrency(order.receivedAmount, businessSettings) : '未设置'}</span>
                  </div>
                  {calculateTechnicianCommission(order) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">技师总抽成:</span>
                      <span className="font-medium">
                        {formatCurrency(calculateTechnicianCommission(order), businessSettings)}
                      </span>
                    </div>
                  )}
                  {calculateSalespersonCommission(order) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">销售员抽成:</span>
                      <span className="font-medium">
                        {formatCurrency(calculateSalespersonCommission(order), businessSettings)}
                      </span>
                    </div>
                  )}
                  {calculateCompanyCommission(order) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">公司分成:</span>
                      <span className="font-medium">
                        {formatCurrency(calculateCompanyCommission(order), businessSettings)}
                      </span>
                    </div>
                  )}
                  {order.receivedAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">订单利润:</span>
                      <span className="font-medium">
                        {formatCurrency(calculateOrderProfit(order), businessSettings)}
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
                  {order.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900">{getServiceName(item.serviceId)}</span>
                        <span className="text-sm text-gray-600">{formatCurrency(item.price, businessSettings)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>技师: {item.technicianName || '未知技师'}</div>
                        {item.technicianCommission > 0 && (
                          <div>抽成: {formatCurrency(item.technicianCommission, businessSettings)}</div>
                        )}
                        {item.salespersonName && (
                          <div>销售员: {item.salespersonName}</div>
                        )}
                        {typeof item.salespersonCommission === 'number' && item.salespersonCommission > 0 && (
                          <div>销售员抽成: {formatCurrency(item.salespersonCommission, businessSettings)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 备注信息 */}
              {order.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">备注</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default OrderDetailModal; 