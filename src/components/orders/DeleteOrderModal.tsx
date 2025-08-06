import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Order, BusinessSettings } from '../../types';
import { formatCurrency } from '../../utils/currencyUtils';

interface DeleteOrderModalProps {
  show: boolean;
  onClose: () => void;
  onConfirmDelete: (orderId: string) => void;
  deletingOrder: Order | null;
  businessSettings: BusinessSettings | undefined;
  getServiceName: (serviceId: string, serviceName?: string) => string;
  getRoomName: (roomId: string, roomName?: string) => string;
}

const DeleteOrderModal: React.FC<DeleteOrderModalProps> = ({
  show,
  onClose,
  onConfirmDelete,
  deletingOrder,
  businessSettings,
  getServiceName,
  getRoomName
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deletingOrder) return;
    
    setIsDeleting(true);
    try {
      await onConfirmDelete(deletingOrder.id);
      onClose();
    } catch (error) {
      console.error('删除订单失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!show || !deletingOrder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">删除订单</h3>
              <p className="text-sm text-gray-500">此操作不可撤销</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              您确定要删除以下订单吗？此操作将永久删除该订单及其所有相关数据。
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">订单号:</span>
                  <span className="text-sm text-gray-900">{deletingOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">房间:</span>
                  <span className="text-sm text-gray-900">
                    {getRoomName(deletingOrder.roomId, deletingOrder.roomName)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">客户:</span>
                  <span className="text-sm text-gray-900">
                    {deletingOrder.customerName || '散客'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">总金额:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(deletingOrder.totalAmount, businessSettings)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">状态:</span>
                  <span className="text-sm text-gray-900">
                    {deletingOrder.status === 'in_progress' ? '进行中' : 
                     deletingOrder.status === 'completed' ? '已完成' : 
                     deletingOrder.status === 'cancelled' ? '已取消' : '未知'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  确认删除
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteOrderModal; 