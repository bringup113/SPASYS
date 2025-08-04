import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Technician } from '../../types';

interface DeleteTechnicianModalProps {
  technician: Technician | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function DeleteTechnicianModal({
  technician,
  onClose,
  onConfirm
}: DeleteTechnicianModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!technician) return null;
  
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
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
              确定要删除技师 <span className="font-semibold text-red-600">"{technician.employeeId}"</span> 吗？
            </p>
            <p className="text-sm text-gray-500">
              删除后将无法恢复，相关的服务分配信息也会被清除。
            </p>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 