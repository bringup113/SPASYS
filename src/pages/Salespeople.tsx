import React, { useState } from 'react';
import { useSalespersonContext } from '../context/SalespersonContext';
import { useSettingsContext } from '../context/SettingsContext';
import { Salesperson } from '../types';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { getBaseCurrencySymbol, formatCurrency } from '../utils/currencyUtils';

export default function Salespeople() {
  const { salespeople, addSalesperson, updateSalesperson, deleteSalesperson } = useSalespersonContext();
  const { businessSettings } = useSettingsContext();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingSalesperson, setDeletingSalesperson] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    commissionType: 'percentage' as 'fixed' | 'percentage',
    commissionRate: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSalesperson(editingId, formData);
      setEditingId(null);
    } else {
      addSalesperson(formData);
    }
    setFormData({ name: '', commissionType: 'percentage', commissionRate: 0 });
    setShowModal(false);
  };

  const handleEdit = (salesperson: Salesperson) => {
    setEditingId(salesperson.id);
    setFormData({
      name: salesperson.name,
      commissionType: salesperson.commissionType,
      commissionRate: salesperson.commissionRate
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ name: '', commissionType: 'percentage', commissionRate: 0 });
    setShowModal(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowModal(false);
    setFormData({ name: '', commissionType: 'percentage', commissionRate: 0 });
  };



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">销售员管理</h1>
          <p className="mt-2 text-gray-600">管理销售员信息和抽成设置</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加销售员
        </button>
      </div>

      {/* 销售员列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">销售员列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  姓名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  抽成类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  抽成设置
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salespeople.map((salesperson) => (
                <tr key={salesperson.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {salesperson.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {salesperson.commissionType === 'fixed' ? '固定抽成' : '比例抽成'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {salesperson.commissionType === 'fixed' 
                      ? formatCurrency(salesperson.commissionRate, businessSettings)
                      : `${salesperson.commissionRate}%`
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(salesperson)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingSalesperson(salesperson)}
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
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl px-8 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {editingId ? '编辑销售员' : '添加新销售员'}
                    </h3>
                    <p className="text-indigo-100 text-sm mt-1">
                      {editingId ? '修改销售员信息' : '创建新的销售员档案'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-white hover:text-indigo-200 transition-colors duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20"
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
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    required
                    placeholder="请输入销售员姓名"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    抽成类型
                  </label>
                  <select
                    value={formData.commissionType}
                    onChange={(e) => setFormData({ ...formData, commissionType: e.target.value as 'fixed' | 'percentage' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  >
                    <option value="fixed">固定抽成</option>
                    <option value="percentage">比例抽成</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {formData.commissionType === 'fixed' ? '固定抽成金额' : '抽成比例'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step={formData.commissionType === 'percentage' ? '0.01' : '0.01'}
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 hover:bg-white pr-12"
                      required
                      placeholder={formData.commissionType === 'fixed' ? '0.00' : '0.00'}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm font-medium">
                        {formData.commissionType === 'percentage' ? '%' : getBaseCurrencySymbol(businessSettings)}
                      </span>
                    </div>
                  </div>
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
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-medium flex items-center shadow-lg hover:shadow-xl"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {editingId ? '更新销售员' : '添加销售员'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deletingSalesperson && (
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
                  确定要删除销售员 <span className="font-semibold text-red-600">"{deletingSalesperson.name}"</span> 吗？
                </p>
                <p className="text-sm text-gray-500">
                  删除后将无法恢复。如果该销售员有关联的订单，订单中的销售员信息会保留但销售员ID会变为空。
                </p>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeletingSalesperson(null)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    deleteSalesperson(deletingSalesperson.id);
                    setDeletingSalesperson(null);
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