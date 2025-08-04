import React, { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';

interface TemporaryRoomModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (roomName: string) => void;
  existingRooms: any[];
  showNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const TemporaryRoomModal = React.memo(function TemporaryRoomModal({ 
  show, 
  onClose, 
  onConfirm, 
  existingRooms, 
  showNotification 
}: TemporaryRoomModalProps) {
  const [temporaryRoomName, setTemporaryRoomName] = useState('');

  const handleConfirm = useCallback(() => {
    if (temporaryRoomName.trim()) {
      // 检查房间名称是否已存在
      const existingRoom = existingRooms?.find(room => room.name === temporaryRoomName.trim());
      if (existingRoom) {
        showNotification('房间名称已存在，请使用其他名称', 'error');
        return;
      }
      
      onConfirm(temporaryRoomName.trim());
      setTemporaryRoomName('');
    } else {
      showNotification('请输入房间名称', 'error');
    }
  }, [temporaryRoomName, existingRooms, showNotification, onConfirm]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  }, [handleConfirm]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <Plus className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">新建临时房间</h3>
              <p className="text-gray-600">请输入临时房间名称</p>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              房间名称
            </label>
            <input
              type="text"
              value={temporaryRoomName}
              onChange={(e) => setTemporaryRoomName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="请输入房间名称，如：VIP1、按摩房等"
              autoFocus
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => {
                onClose();
                setTemporaryRoomName('');
              }}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TemporaryRoomModal; 