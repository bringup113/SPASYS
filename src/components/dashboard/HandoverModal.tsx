import React, { useState } from 'react';
import { Order } from '../../types';
import { X, AlertTriangle, CheckCircle, Clock, DollarSign, MapPin } from 'lucide-react';

interface HandoverModalProps {
  show: boolean;
  pendingOrders: Order[];
  onClose: () => void;
  onConfirmHandover: () => void;
}

const HandoverModal = React.memo(function HandoverModal({
  show,
  pendingOrders,
  onClose,
  onConfirmHandover
}: HandoverModalProps) {
  const [isHandingOver, setIsHandingOver] = useState(false);

  if (!show) return null;

  // 获取订单状态显示
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'in_progress':
        return { text: '进行中', color: 'bg-blue-100 text-blue-800', icon: Clock };
      case 'completed':
        return { text: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'cancelled':
        return { text: '已取消', color: 'bg-red-100 text-red-800', icon: X };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto mx-4 transform transition-all duration-300 scale-100">
        {/* 模态框头部 */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-t-2xl px-8 py-6 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  交接班确认
                </h3>
                <p className="text-orange-100 text-sm mt-1">
                  请确认以下{pendingOrders.length} 个未交接的订单信息
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-orange-200 transition-colors duration-200 p-3 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* 模态框内容 */}
        <div className="px-8 py-6">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">所有订单已交接完成</h3>
              <p className="text-gray-600">没有需要交接的订单，可以安全交班。</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">
                    发现 {pendingOrders.length} 个未交接的订单
                  </span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  请仔细核对以下订单信息，确认无误后点击"确认交接"按钮。
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingOrders.map((order) => {
                  const statusInfo = getStatusDisplay(order.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                      {/* 订单头部信息 */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="font-bold text-lg text-gray-900">
                              {order.roomName || '未知房间'}
                            </span>
                            {order.customerName && (
                              <span className="text-sm text-gray-500 ml-2">
                                ({order.customerName})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>订单: {order.id}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.text}
                            </span>
                          </div>
                        </div>
                        
                        {/* 金额信息 */}
                        <div className="text-right">
                          <div className="flex items-center mb-1">
                            <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                            <span className="font-bold text-lg text-green-600">
                              {order.totalAmount}฿
                            </span>
                          </div>
                          {order.receivedAmount && order.receivedAmount > 0 && (
                            <div className="text-sm text-green-600">
                              已收款: {order.receivedAmount}฿
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 服务项目列表 */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700 flex items-center">
                          <span className="mr-2">服务项目:</span>
                          <span className="text-gray-500">({order.items.length}项)</span>
                        </h5>
                        {order.items.map((item, index) => (
                          <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {item.serviceName || '未知服务'}
                                </div>
                                {item.technicianName && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    技师: {item.technicianName}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">
                                  {item.price}฿
                                </div>
                                {item.technicianCommission > 0 && (
                                  <div className="text-xs text-gray-500">
                                    抽成: {item.technicianCommission}฿
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 备注信息 */}
                      {order.notes && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                          <div className="text-sm text-yellow-800">
                            <span className="font-medium">备注:</span> {order.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (isHandingOver) return;
                    setIsHandingOver(true);
                    try {
                      await onConfirmHandover();
                    } finally {
                      setIsHandingOver(false);
                    }
                  }}
                  disabled={isHandingOver}
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-medium flex items-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isHandingOver ? (
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2" />
                  )}
                  {isHandingOver ? '交接中...' : `确认交接 (${pendingOrders.length}个订单)`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default HandoverModal; 