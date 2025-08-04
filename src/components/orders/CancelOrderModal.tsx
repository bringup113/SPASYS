import React from 'react';

interface CancelOrderModalProps {
  isOpen: boolean;
  orderId: string | null;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  onConfirm: (orderId: string) => void;
  onCancel: () => void;
}

const CancelOrderModal = React.memo(function CancelOrderModal({
  isOpen,
  orderId,
  cancelReason,
  setCancelReason,
  onConfirm,
  onCancel
}: CancelOrderModalProps) {
  if (!isOpen || !orderId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-medium text-gray-900 mb-4">取消订单</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            取消原因 *
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="请输入取消原因"
            rows={3}
            required
          />
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => onConfirm(orderId)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            确认取消
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
});

export default CancelOrderModal; 