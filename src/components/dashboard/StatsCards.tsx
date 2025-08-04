import React, { useMemo } from 'react';
import { Building2, Users, Clock } from 'lucide-react';

interface StatsCardsProps {
  rooms: any[];
  technicians: any[];
  orders: any[];
}

const StatsCards = React.memo(function StatsCards({ rooms, technicians, orders }: StatsCardsProps) {
  const stats = useMemo(() => [
    {
      name: '房间总数',
      value: rooms?.length || 0,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: '可用房间',
      value: rooms?.filter(room => room.status === 'available').length || 0,
      icon: Building2,
      color: 'bg-green-500',
    },
    {
      name: '可用技师',
      value: technicians?.filter(tech => tech.status === 'available').length || 0,
      icon: Users,
      color: 'bg-orange-500',
    },
    {
      name: '进行中订单',
      value: orders?.filter(order => order.status === 'in_progress').length || 0,
      icon: Clock,
      color: 'bg-purple-500',
    },
  ], [rooms, technicians, orders]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default StatsCards; 