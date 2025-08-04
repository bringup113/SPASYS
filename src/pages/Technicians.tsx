import React, { useState, useCallback, useMemo } from 'react';
import { useTechnicianContext } from '../context/TechnicianContext';
import { useServiceContext } from '../context/ServiceContext';
import { useSettingsContext } from '../context/SettingsContext';
import { useOrderContext } from '../context/OrderContext';
import { Technician, ServiceAssignment } from '../types';
import { Plus } from 'lucide-react';
import Notification from '../components/Notification';
import {
  TechnicianList,
  TechnicianModal,
  DeleteTechnicianModal
} from '../components/technicians';

export default function TechniciansNew() {
  const { technicians, addTechnician, updateTechnician, deleteTechnician } = useTechnicianContext();
  const { serviceItems } = useServiceContext();
  const { countries, companyCommissionRules, businessSettings } = useSettingsContext();
  const { orders } = useOrderContext();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingTechnician, setDeletingTechnician] = useState<Technician | null>(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' as 'success' | 'error' | 'warning' });
  
  // 显示通知
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000);
  }, []);
  
  const [formData, setFormData] = useState({
    employeeId: '',
    countryId: '',
    hireDate: '',
    status: 'available' as 'available' | 'busy' | 'offline',
    services: [] as ServiceAssignment[]
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查是否有未完成的订单
    if (editingId) {
      const hasUnfinishedOrders = orders?.some(order => 
        order.status === 'in_progress' && 
        order.items?.some(item => item.technicianId === editingId)
      );
      
      if (hasUnfinishedOrders) {
        setNotification({
          show: true,
          message: '该技师还有未完成订单，无法进行操作！',
          type: 'error'
        });
        return;
      }
    }
    
    try {
      if (editingId) {
        await updateTechnician(editingId, formData);
        setEditingId(null);
      } else {
        await addTechnician(formData);
      }
      setFormData({
        employeeId: '',
        countryId: '',
        hireDate: '',
        status: 'available' as 'available' | 'busy' | 'offline',
        services: []
      });
      setShowModal(false);
    } catch (error) {
      console.error('保存技师失败:', error);
      showNotification('保存技师失败，请重试', 'error');
    }
  }, [editingId, orders, updateTechnician, addTechnician, formData, showNotification]);

  const handleEdit = useCallback((technician: Technician) => {
    setEditingId(technician.id);
    setFormData({
      employeeId: technician.employeeId,
      countryId: technician.countryId,
      hireDate: technician.hireDate,
      status: technician.status,
      services: technician.services
    });
    setShowModal(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingId(null);
    setFormData({
      employeeId: '',
      countryId: '',
      hireDate: '',
      status: 'available' as 'available' | 'busy' | 'offline',
      services: []
    });
    setShowModal(true);
  }, []);

  const handleCopy = useCallback((technician: Technician) => {
    setEditingId(null);
    setFormData({
      employeeId: '',
      countryId: technician.countryId,
      hireDate: technician.hireDate,
      status: technician.status,
      services: technician.services
    });
    setShowModal(true);
  }, []);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setShowModal(false);
    setFormData({
      employeeId: '',
      countryId: '',
      hireDate: '',
      status: 'available' as 'available' | 'busy' | 'offline',
      services: []
    });
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deletingTechnician) return;
    
    // 检查是否有进行中的订单
    const hasInProgressOrders = orders?.some(order => 
      order.status === 'in_progress' && 
      order.items?.some(item => item.technicianId === deletingTechnician.id)
    );
    
    if (hasInProgressOrders) {
      setNotification({
        show: true,
        message: '该技师还有进行中订单，无法删除',
        type: 'error'
      });
      setDeletingTechnician(null);
      return;
    }
    
    try {
      await deleteTechnician(deletingTechnician.id);
      setDeletingTechnician(null);
      showNotification('技师删除成功', 'success');
    } catch (error: any) {
      console.error('删除技师失败:', error);
      let errorMessage = '删除技师失败，请重试';
      
      // 根据错误类型显示不同的消息
      if (error.message?.includes('400')) {
        errorMessage = '该技师还有进行中订单，无法删除';
      } else if (error.message?.includes('404')) {
        errorMessage = '技师不存在或已被删除';
      } else if (error.message?.includes('403')) {
        errorMessage = '没有权限删除该技师';
      }
      
      setNotification({
        show: true,
        message: errorMessage,
        type: 'error'
      });
      setDeletingTechnician(null);
    }
  }, [deletingTechnician, orders, deleteTechnician, showNotification]);

  // 缓存通知关闭函数
  const handleNotificationClose = useCallback(() => {
    setNotification({ show: false, message: '', type: 'error' });
  }, []);

  // 缓存删除技师设置函数
  const handleSetDeletingTechnician = useCallback((technician: Technician) => {
    setDeletingTechnician(technician);
  }, []);

  // 缓存删除技师关闭函数
  const handleDeleteModalClose = useCallback(() => {
    setDeletingTechnician(null);
  }, []);

  return (
    <div className="space-y-6">
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={handleNotificationClose}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">技师管理</h1>
          <p className="mt-2 text-gray-600">管理技师信息和项目收费</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加技师
          </button>
        </div>
      </div>

      {/* 技师列表 */}
      <TechnicianList
        technicians={technicians}
        countries={countries}
        onEdit={handleEdit}
        onCopy={handleCopy}
        onDelete={handleSetDeletingTechnician}
      />

      {/* 添加/编辑模态框 */}
      <TechnicianModal
        show={showModal}
        editingId={editingId}
        formData={formData}
        countries={countries}
        serviceItems={serviceItems}
        companyCommissionRules={companyCommissionRules}
        businessSettings={businessSettings}
        onClose={handleCancel}
        onSubmit={handleSubmit}
        onFormDataChange={setFormData}
      />

      {/* 删除确认对话框 */}
      <DeleteTechnicianModal
        technician={deletingTechnician}
        onClose={handleDeleteModalClose}
        onConfirm={handleDelete}
      />
    </div>
  );
} 