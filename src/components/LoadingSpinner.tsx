import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ message = '正在连接服务器...', size = 'medium' }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mb-4`}></div>
        <p className="text-gray-700 text-center">{message}</p>
        <p className="text-gray-500 text-sm mt-2">请稍候，服务器正在启动...</p>
      </div>
    </div>
  );
} 