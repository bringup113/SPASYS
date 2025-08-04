import React from 'react';
import { Plus, X, Check } from 'lucide-react';
import { ServiceAssignment } from '../../types';
import TechnicianForm from './TechnicianForm';
import ServiceAssignmentForm from './ServiceAssignmentForm';

interface TechnicianFormData {
  employeeId: string;
  countryId: string;
  hireDate: string;
  status: 'available' | 'busy' | 'offline';
  services: ServiceAssignment[];
}

interface TechnicianModalProps {
  show: boolean;
  editingId: string | null;
  formData: TechnicianFormData;
  countries: any[];
  serviceItems: any[];
  companyCommissionRules: any[];
  businessSettings: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: TechnicianFormData) => void;
}

export default function TechnicianModal({
  show,
  editingId,
  formData,
  countries,
  serviceItems,
  companyCommissionRules,
  businessSettings,
  onClose,
  onSubmit,
  onFormDataChange
}: TechnicianModalProps) {
  if (!show) return null;

  const handleFormDataChange = (field: keyof TechnicianFormData, value: any) => {
    if (field === 'services') {
      onFormDataChange({
        ...formData,
        services: value
      });
    } else {
      onFormDataChange({
        ...formData,
        [field]: value
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto mx-4 transform transition-all duration-300 scale-100">
        {/* 模态框头部 */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-t-2xl px-8 py-6 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {editingId ? '编辑技师信息' : '添加新技师'}
                </h3>
                <p className="text-orange-100 text-sm mt-1">
                  {editingId ? '修改技师信息和项目设置' : '创建新的技师档案'}
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
        <form onSubmit={onSubmit} className="px-8 py-6 space-y-8">
          {/* 基本信息 */}
          <TechnicianForm
            formData={{
              employeeId: formData.employeeId,
              countryId: formData.countryId,
              hireDate: formData.hireDate,
              status: formData.status
            }}
            countries={countries}
            onChange={(data) => {
              onFormDataChange({
                ...formData,
                ...data
              });
            }}
          />

          {/* 服务项目设置 */}
          <ServiceAssignmentForm
            services={formData.services}
            serviceItems={serviceItems}
            companyCommissionRules={companyCommissionRules}
            businessSettings={businessSettings}
            onServicesChange={(services) => handleFormDataChange('services', services)}
          />
          
          {/* 操作按钮 */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-medium flex items-center shadow-lg hover:shadow-xl"
            >
              <Check className="h-5 w-5 mr-2" />
              {editingId ? '更新技师' : '添加技师'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 