import React from 'react';
import { Order } from '../../types';
import { X, AlertTriangle } from 'lucide-react';

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
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 transform transition-all duration-300 scale-100">
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
                  请确认以下未交接的订单信息
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
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
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

              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          订单 {order.id}
                        </h4>
                        <p className="text-sm text-gray-600">
                          房间: {order.roomName || '未知房间'}
                        </p>
                        {order.customerName && (
                          <p className="text-sm text-gray-600">
                            客户: {order.customerName}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          进行中
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          总金额: {order.totalAmount}฿
                        </p>
                        {order.receivedAmount && (
                          <p className="text-sm text-green-600">
                            已收款: {order.receivedAmount}฿
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">服务项目:</h5>
                      {order.items.map((item, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-white rounded p-2">
                          <div className="flex justify-between">
                            <span>{item.serviceName || '未知服务'}</span>
                            <span>{item.price}฿</span>
                          </div>
                          {item.technicianName && (
                            <div className="text-xs text-gray-500 mt-1">
                              技师: {item.technicianName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                        <span className="font-medium">备注:</span> {order.notes}
                      </div>
                    )}
                  </div>
                ))}
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
                  onClick={onConfirmHandover}
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-medium flex items-center shadow-lg hover:shadow-xl"
                >
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  确认交接
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