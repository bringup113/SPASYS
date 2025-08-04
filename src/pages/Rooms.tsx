import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Room } from '../types';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import Notification from '../components/Notification';

export default function Rooms() {
  const { state, addRoom, updateRoom, deleteRoom } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' as 'success' | 'error' | 'warning' });
  const [formData, setFormData] = useState({
    name: '',
    status: 'available' as 'available' | 'occupied' | 'maintenance',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查是否有未完成的订单
    if (editingId) {
      const room = state.rooms?.find(r => r.id === editingId);
      if (room) {
        const hasUnfinishedOrders = state.orders?.some(order => 
          order.roomId === editingId && order.status === 'in_progress'
        );
        
        if (hasUnfinishedOrders) {
          setNotification({
            show: true,
            message: '该房间还有未完成订单，无法进行操作！',
            type: 'error'
          });
          return;
        }
      }
    }
    
    if (editingId) {
      updateRoom(editingId, formData);
      setEditingId(null);
    } else {
      addRoom(formData);
    }
    setFormData({ name: '', status: 'available', description: '' });
    setShowModal(false);
  };

  const handleEdit = (room: Room) => {
    setEditingId(room.id);
    setFormData({
      name: room.name,
      status: room.status,
      description: room.description || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ name: '', status: 'available', description: '' });
    setShowModal(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowModal(false);
    setFormData({ name: '', status: 'available', description: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-orange-100 text-orange-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return '可用';
      case 'occupied': return '使用中';
      case 'maintenance': return '维护中';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ show: false, message: '', type: 'error' })}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">房间管理</h1>
          <p className="mt-2 text-gray-600">管理SPA房间信息</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加房间
        </button>
      </div>

      {/* 房间列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">房间列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  房间名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.rooms.map((room) => (
                <tr key={room.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {room.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(room.status)}`}>
                      {getStatusText(room.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {room.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(room)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingRoom(room)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 添加/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all duration-300 scale-100">
            {/* 模态框头部 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl px-8 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {editingId ? '编辑房间' : '添加新房间'}
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {editingId ? '修改房间信息' : '创建新的SPA房间'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-white hover:text-blue-200 transition-colors duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* 模态框内容 */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    房间名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    required
                    placeholder="请输入房间名称"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    房间状态
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="available"
                        checked={formData.status === 'available'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="sr-only"
                      />
                      <div className={`w-full p-3 text-center rounded-lg border-2 transition-all duration-200 ${
                        formData.status === 'available'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}>
                        <div className="text-sm font-medium">可用</div>
                      </div>
                    </label>
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="occupied"
                        checked={formData.status === 'occupied'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="sr-only"
                      />
                      <div className={`w-full p-3 text-center rounded-lg border-2 transition-all duration-200 ${
                        formData.status === 'occupied'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}>
                        <div className="text-sm font-medium">使用中</div>
                      </div>
                    </label>
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="maintenance"
                        checked={formData.status === 'maintenance'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="sr-only"
                      />
                      <div className={`w-full p-3 text-center rounded-lg border-2 transition-all duration-200 ${
                        formData.status === 'maintenance'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}>
                        <div className="text-sm font-medium">维护中</div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    房间描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                    rows={3}
                    placeholder="请输入房间描述（可选）"
                  />
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center shadow-lg hover:shadow-xl"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {editingId ? '更新房间' : '添加房间'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deletingRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
            {/* 对话框头部 */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl px-6 py-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">确认删除</h3>
                  <p className="text-red-100 text-sm mt-1">此操作不可撤销</p>
                </div>
              </div>
            </div>
            
            {/* 对话框内容 */}
            <div className="px-6 py-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  确定要删除房间 <span className="font-semibold text-red-600">"{deletingRoom.name}"</span> 吗？
                </p>
                <p className="text-sm text-gray-500">
                  删除后将无法恢复。如果房间有关联的订单，订单中的房间信息会保留但房间ID会变为空。
                </p>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeletingRoom(null)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    // 检查是否有进行中的订单
                    const hasInProgressOrders = state.orders?.some(order => 
                      order.roomId === deletingRoom.id && order.status === 'in_progress'
                    );
                    
                    if (hasInProgressOrders) {
                      setNotification({
                        show: true,
                        message: '该房间还有进行中订单，无法删除',
                        type: 'error'
                      });
                      setDeletingRoom(null);
                      return;
                    }
                    
                    deleteRoom(deletingRoom.id);
                    setDeletingRoom(null);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 