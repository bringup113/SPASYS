import React, { useState } from 'react';
import { useSettingsContext } from '../context/SettingsContext';
import { CompanyCommissionRule } from '../types';
import { Plus, Edit, Trash2, Check, X, Shield } from 'lucide-react';
import Notification from '../components/Notification';

export default function CompanyCommissionRules() {
  const { companyCommissionRules, addCompanyCommissionRule, updateCompanyCommissionRule, deleteCompanyCommissionRule } = useSettingsContext();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingRule, setDeletingRule] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' as 'success' | 'error' | 'warning' });
  
  // 显示通知
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000);
  };
  const [formData, setFormData] = useState({
    name: '',
    commissionType: 'profit' as 'none' | 'revenue' | 'profit',
    commissionRate: 0,
    description: '',
    isDefault: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // 防止重复提交
    
    setIsSubmitting(true);
    
    try {
    if (editingId) {
        await updateCompanyCommissionRule(editingId, formData);
      setEditingId(null);
    } else {
        await addCompanyCommissionRule(formData);
    }
      
    setFormData({
      name: '',
      commissionType: 'profit',
      commissionRate: 0,
      description: '',
      isDefault: false
    });
    setShowModal(false);
    } catch (error) {
      console.error('提交失败:', error);
      showNotification('提交失败，请重试', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (rule: CompanyCommissionRule) => {
    setEditingId(rule.id);
    setFormData({
      name: rule.name,
      commissionType: rule.commissionType,
      commissionRate: rule.commissionRate,
      description: rule.description || '',
      isDefault: rule.isDefault
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      commissionType: 'profit',
      commissionRate: 0,
      description: '',
      isDefault: false
    });
    setShowModal(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowModal(false);
    setFormData({
      name: '',
      commissionType: 'profit',
      commissionRate: 0,
      description: '',
      isDefault: false
    });
  };

  const getCommissionTypeText = (type: string) => {
    switch (type) {
      case 'none': return '不抽成';
      case 'revenue': return '销售额抽成';
      case 'profit': return '利润抽成';
      default: return '未知';
    }
  };

  const getCommissionTypeColor = (type: string) => {
    switch (type) {
      case 'none': return 'bg-gray-100 text-gray-800';
      case 'revenue': return 'bg-blue-100 text-blue-800';
      case 'profit': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-gray-900">公司分成设置</h1>
          <p className="mt-2 text-gray-600">管理公司分成方案，设置不同项目的分成规则</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加分成方案
        </button>
      </div>

      {/* 方案列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">分成方案列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  方案名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  抽成模式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  抽成比例
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  备注
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companyCommissionRules?.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{rule.name}</span>
                      {rule.isDefault && (
                        <Shield className="h-4 w-4 text-orange-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCommissionTypeColor(rule.commissionType)}`}>
                      {getCommissionTypeText(rule.commissionType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.commissionType === 'none' ? '-' : `${rule.commissionRate}%`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {rule.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rule.isDefault ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        默认方案
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        自定义方案
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {!rule.isDefault && (
                        <button
                          onClick={() => setDeletingRule(rule)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-t-2xl px-8 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {editingId ? '编辑分成方案' : '添加新方案'}
                    </h3>
                    <p className="text-green-100 text-sm mt-1">
                      {editingId ? '修改分成方案信息' : '创建新的公司分成方案'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-white hover:text-green-200 transition-colors duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20"
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
                    方案名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    required
                    placeholder="请输入方案名称"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    抽成模式 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.commissionType}
                    onChange={(e) => setFormData({ ...formData, commissionType: e.target.value as 'none' | 'revenue' | 'profit' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    required
                  >
                    <option value="none">不抽成</option>
                    <option value="revenue">销售额抽成</option>
                    <option value="profit">利润抽成</option>
                  </select>
                </div>

                {formData.commissionType !== 'none' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      抽成比例 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                      required
                      placeholder="请输入抽成比例（0-100）"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    备注
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    rows={3}
                    placeholder="请输入备注信息"
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
                  disabled={isSubmitting}
                  className={`px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl transition-all duration-200 font-medium flex items-center shadow-lg hover:shadow-xl ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:from-green-700 hover:to-green-800'
                  }`}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isSubmitting ? '提交中...' : (editingId ? '更新方案' : '添加方案')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deletingRule && (
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
                  确定要删除分成方案 <span className="font-semibold text-red-600">"{deletingRule.name}"</span> 吗？
                </p>
                <p className="text-sm text-gray-500">
                  删除后将无法恢复。如果该方案有关联的技师，将无法删除。
                </p>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeletingRule(null)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    deleteCompanyCommissionRule(deletingRule.id);
                    setDeletingRule(null);
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