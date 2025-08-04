import React, { useState } from 'react';
import { useSettingsContext } from '../context/SettingsContext';
import { Settings as SettingsIcon, Clock, Globe, DollarSign } from 'lucide-react';
import Notification from '../components/Notification';

export default function Settings() {
  const { businessSettings, updateBusinessSettings } = useSettingsContext();
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'warning' });
  
  // 显示通知
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };
  
  // 默认设置，防止初始化时undefined
  const defaultSettings = {
    businessHours: {
      startTime: '00:00',
      endTime: '23:59',
      is24Hour: true,
      crossDay: false,
      newDayStartTime: '08:00'
    },
    timezone: 'Asia/Bangkok',
    baseCurrencyName: '泰铢',
    baseCurrencyCode: 'THB',
    baseCurrencySymbol: '฿'
  };

  const [formData, setFormData] = useState({
    businessHours: {
      startTime: businessSettings?.businessHours?.startTime || defaultSettings.businessHours.startTime,
      endTime: businessSettings?.businessHours?.endTime || defaultSettings.businessHours.endTime,
      is24Hour: businessSettings?.businessHours?.is24Hour || defaultSettings.businessHours.is24Hour,
      crossDay: businessSettings?.businessHours?.crossDay || defaultSettings.businessHours.crossDay,
      newDayStartTime: businessSettings?.businessHours?.newDayStartTime || defaultSettings.businessHours.newDayStartTime
    },
    timezone: businessSettings?.timezone || defaultSettings.timezone,
    baseCurrencyName: businessSettings?.baseCurrencyName || defaultSettings.baseCurrencyName,
    baseCurrencyCode: businessSettings?.baseCurrencyCode || defaultSettings.baseCurrencyCode,
    baseCurrencySymbol: businessSettings?.baseCurrencySymbol || defaultSettings.baseCurrencySymbol
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessSettings(formData);
    showNotification('设置已保存！', 'success');
  };

  const handle24HourChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        is24Hour: checked,
        startTime: checked ? '00:00' : prev.businessHours.startTime,
        endTime: checked ? '23:59' : prev.businessHours.endTime,
        newDayStartTime: checked ? '20:00' : prev.businessHours.newDayStartTime
      }
    }));
  };

  return (
    <div className="space-y-6">
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ show: false, message: '', type: 'success' })}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">基础设置</h1>
          <p className="mt-2 text-gray-600">配置营业时间、时区和本位币设置</p>
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <form onSubmit={handleSubmit} className="p-8">
          {/* 本位币设置 */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">本位币设置</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  货币名称
                </label>
                <input
                  type="text"
                  value={formData.baseCurrencyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseCurrencyName: e.target.value }))}
                  placeholder="例如：泰铢"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  货币代码
                </label>
                <input
                  type="text"
                  value={formData.baseCurrencyCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseCurrencyCode: e.target.value }))}
                  placeholder="例如：THB"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  货币符号
                </label>
                <input
                  type="text"
                  value={formData.baseCurrencySymbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseCurrencySymbol: e.target.value }))}
                  placeholder="例如：฿"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-green-800">本位币说明</span>
              </div>
              <p className="text-sm text-green-700">
                系统将使用 {formData.baseCurrencyName} ({formData.baseCurrencySymbol}) 作为唯一货币单位。
                所有金额计算和显示都将基于此货币，不再支持多货币管理。
              </p>
            </div>
          </div>

          {/* 营业时间设置 */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">营业时间设置</h3>
            </div>
            
            <div className="space-y-4">
              {/* 24小时营业 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is24Hour"
                  checked={formData.businessHours.is24Hour}
                  onChange={(e) => handle24HourChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is24Hour" className="ml-2 text-sm font-medium text-gray-700">
                  24小时营业
                </label>
              </div>

              {/* 营业时间 */}
              {!formData.businessHours.is24Hour && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      开始时间
                    </label>
                    <input
                      type="time"
                      value={formData.businessHours.startTime}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        businessHours: { ...prev.businessHours, startTime: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      结束时间
                    </label>
                    <input
                      type="time"
                      value={formData.businessHours.endTime}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        businessHours: { ...prev.businessHours, endTime: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="crossDay"
                        checked={formData.businessHours.crossDay}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          businessHours: { ...prev.businessHours, crossDay: e.target.checked }
                        }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="crossDay" className="ml-2 text-sm font-medium text-gray-700">
                        跨天营业
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 24小时营业时的新一天开始时间 */}
              {formData.businessHours.is24Hour && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-blue-800">24小时营业设置</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        新一天开始时间
                      </label>
                      <input
                        type="time"
                        value={formData.businessHours.newDayStartTime}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          businessHours: { ...prev.businessHours, newDayStartTime: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        用于统计和交接班，例如：20:00 表示晚上8点开始算新的一天
                      </p>
                    </div>
                    <div className="flex items-end">
                      <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 w-full">
                        <div className="text-xs font-medium text-blue-800 mb-1">当前设置说明</div>
                        <div className="text-xs text-blue-700">
                          营业时间：24小时<br/>
                          新一天开始：{formData.businessHours.newDayStartTime}<br/>
                          适用于：统计报表、交接班、日结算
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 时区设置 */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Globe className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">时区设置</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择时区
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
                <option value="Asia/Bangkok">泰国时间 (UTC+7)</option>
                <option value="UTC">UTC时间 (UTC+0)</option>
                <option value="America/New_York">纽约时间 (UTC-5)</option>
                <option value="Europe/London">伦敦时间 (UTC+0)</option>
              </select>
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              保存设置
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 