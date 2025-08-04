import { Trash2 } from 'lucide-react';
import { OrderItem } from '../../types';
import { formatCurrency } from '../../utils/currencyUtils';

interface DeleteItemModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deletingItem: { index: number; item: OrderItem } | null;
  currentOrder: any;
  businessSettings: any;
  getServiceName: (serviceId: string) => string;
}

export default function DeleteItemModal({ 
  show, 
  onClose, 
  onConfirm, 
  deletingItem, 
  currentOrder, 
  businessSettings, 
  getServiceName 
}: DeleteItemModalProps) {
  if (!show || !deletingItem) return null;

  const { index, item } = deletingItem;
  const isLastItem = currentOrder && currentOrder.items.length === 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">确认删除服务项目</h3>
              <p className="text-gray-600">
                {isLastItem 
                  ? '这是订单中的最后一个服务项目' 
                  : '您确定要删除以下服务项目吗？'
                }
              </p>
            </div>
          </div>
          
          {/* 项目信息 */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">服务:</span>
                <span className="font-medium">{getServiceName(item.serviceId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">技师:</span>
                <span className="font-medium">{item.technicianName || '未知技师'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">价格:</span>
                <span className="font-bold text-green-600">{formatCurrency(item.price, businessSettings)}</span>
              </div>
            </div>
          </div>

          {/* 警告信息 */}
          {isLastItem && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-red-600 text-sm font-bold">!</span>
                </div>
                <div>
                  <h4 className="text-red-800 font-semibold mb-1">⚠️ 警告：这是订单中的最后一个服务项目！</h4>
                  <p className="text-red-700 text-sm">
                    删除后将：
                  </p>
                  <ul className="text-red-700 text-sm mt-2 space-y-1">
                    <li>• 取消整个订单</li>
                    <li>• 释放房间状态</li>
                    <li>• 释放技师状态</li>
                    <li>• 订单状态将变为"已取消"</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 非最后一个项目的提示 */}
          {!isLastItem && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">i</span>
                </div>
                <div>
                  <p className="text-blue-800 text-sm">
                    删除后，该技师将变为可用状态（如果没有其他进行中的项目）。
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {isLastItem 
                ? '确认删除并取消订单' 
                : '确认删除'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 