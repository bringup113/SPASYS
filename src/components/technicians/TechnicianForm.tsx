import React from 'react';

interface TechnicianFormData {
  employeeId: string;
  countryId: string;
  hireDate: string;
  status: 'available' | 'busy' | 'offline';
}

interface TechnicianFormProps {
  formData: TechnicianFormData;
  countries: any[];
  onChange: (data: TechnicianFormData) => void;
}

export default function TechnicianForm({
  formData,
  countries,
  onChange
}: TechnicianFormProps) {
  const handleChange = (field: keyof TechnicianFormData, value: string | 'available' | 'busy' | 'offline') => {
    onChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
          <span className="text-orange-600 font-bold text-sm">1</span>
        </div>
        基本信息
      </h4>
      <div className="space-y-6">
        {/* 第一行：工号、国籍、入职时间、状态 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              工号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) => handleChange('employeeId', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:bg-gray-50"
              required
              placeholder="请输入唯一工号"
            />
            <p className="mt-1 text-xs text-gray-500">工号必须唯一，不可重复</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              国籍 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.countryId}
              onChange={(e) => handleChange('countryId', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:bg-gray-50"
              required
            >
              <option value="">请选择国家</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              入职时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.hireDate}
              onChange={(e) => handleChange('hireDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:bg-gray-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              状态
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="available"
                  checked={formData.status === 'available'}
                  onChange={(e) => handleChange('status', e.target.value as 'available' | 'busy' | 'offline')}
                  className="sr-only"
                />
                <div className={`w-full p-2 text-center rounded-lg border-2 transition-all duration-200 ${
                  formData.status === 'available'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}>
                  <div className="text-xs font-medium">可用</div>
                </div>
              </label>
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="busy"
                  checked={formData.status === 'busy'}
                  onChange={(e) => handleChange('status', e.target.value as 'available' | 'busy' | 'offline')}
                  className="sr-only"
                />
                <div className={`w-full p-2 text-center rounded-lg border-2 transition-all duration-200 ${
                  formData.status === 'busy'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}>
                  <div className="text-xs font-medium">忙碌</div>
                </div>
              </label>
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="offline"
                  checked={formData.status === 'offline'}
                  onChange={(e) => handleChange('status', e.target.value as 'available' | 'busy' | 'offline')}
                  className="sr-only"
                />
                <div className={`w-full p-2 text-center rounded-lg border-2 transition-all duration-200 ${
                  formData.status === 'offline'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}>
                  <div className="text-xs font-medium">离线</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 