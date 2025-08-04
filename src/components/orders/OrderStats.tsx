import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Order } from '../../types';

interface OrderStatsProps {
  orders: Order[] | undefined;
}

const OrderStats = React.memo(function OrderStats({ orders }: OrderStatsProps) {
  const stats = useMemo(() => {
    const inProgressCount = orders?.filter(order => order.status === 'in_progress').length || 0;
    const completedCount = orders?.filter(order => order.status === 'completed').length || 0;
    const cancelledCount = orders?.filter(order => order.status === 'cancelled').length || 0;
    
    return { inProgressCount, completedCount, cancelledCount };
  }, [orders]);

  const { inProgressCount, completedCount, cancelledCount } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg p-6 border border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl shadow-md">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-700">进行中</p>
              <p className="text-3xl font-bold text-orange-800">{inProgressCount}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-12 h-12 bg-orange-200 bg-opacity-50 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-semibold text-sm">进行</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-green-400 to-green-500 rounded-xl shadow-md">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-700">已完成</p>
              <p className="text-3xl font-bold text-green-800">{completedCount}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-12 h-12 bg-green-200 bg-opacity-50 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">完成</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-lg p-6 border border-red-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-red-400 to-red-500 rounded-xl shadow-md">
              <XCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-700">已取消</p>
              <p className="text-3xl font-bold text-red-800">{cancelledCount}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-12 h-12 bg-red-200 bg-opacity-50 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-semibold text-sm">取消</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default OrderStats; 