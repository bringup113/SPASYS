import React, { useState, useMemo, useCallback } from 'react';
import { useOrderContext } from '../context/OrderContext';
import { useSettingsContext } from '../context/SettingsContext';
import { Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { getBusinessDateString, getBusinessDateStringForTime } from '../utils/timeUtils';
import { formatCurrency } from '../utils/currencyUtils';


export default function StatisticsReport() {
  const { orders } = useOrderContext();
  const { businessSettings } = useSettingsContext();
  
  // 使用 localStorage 持久化日期状态，避免页面切换时重置
  const [startDate, setStartDate] = useState(() => {
    const savedStartDate = localStorage.getItem('statisticsReportStartDate');
    if (savedStartDate) {
      return savedStartDate;
    }
    // 如果没有保存的日期，使用当前业务日期
    return getBusinessDateString(businessSettings);
  });

  const [endDate, setEndDate] = useState(() => {
    const savedEndDate = localStorage.getItem('statisticsReportEndDate');
    if (savedEndDate) {
      return savedEndDate;
    }
    // 如果没有保存的日期，使用当前业务日期
    return getBusinessDateString(businessSettings);
  });

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // 每页显示10条记录

  // 当日期变化时保存到 localStorage
  React.useEffect(() => {
    localStorage.setItem('statisticsReportStartDate', startDate);
  }, [startDate]);

  React.useEffect(() => {
    localStorage.setItem('statisticsReportEndDate', endDate);
  }, [endDate]);

  // 计算统计报表数据
  const statisticsReport = useMemo(() => {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // 包含结束日期

    const periodOrders = orders?.filter(order => {
      // 使用业务日期进行过滤，考虑经营时间和时区
      const orderBusinessDate = getBusinessDateStringForTime(new Date(order.createdAt), businessSettings);
      // 只统计已完成的订单
      return orderBusinessDate >= startDate && orderBusinessDate <= endDate && order.status === 'completed';
    }) || [];

    // 初始化统计数据
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalTechnicianCommission = 0;
    let totalSalespersonCommission = 0;
    let totalCompanyCommission = 0;
    const technicianStats: { [technicianId: string]: any } = {};
    const salespersonStats: { [salespersonId: string]: any } = {};

    periodOrders.forEach(order => {
      // 使用实收金额进行统计
      const receivedAmount = order.receivedAmount || 0;
      
      // 累计收入（使用实收金额）
      totalRevenue += receivedAmount;
      
      // 累计技师提成（直接从订单项目累加）
      order.items.forEach(item => {
        totalTechnicianCommission += item.technicianCommission;
      });

      // 累计销售员提成（直接从订单项目累加）
      order.items.forEach(item => {
        if (item.salespersonCommission) {
          totalSalespersonCommission += item.salespersonCommission;
        }
      });

      // 累计公司抽成（直接从订单项目累加）
      order.items.forEach(item => {
        totalCompanyCommission += (item.companyCommissionAmount || 0);
      });

      // 计算订单利润
      const orderTechnicianCommission = order.items.reduce((sum, item) => sum + item.technicianCommission, 0);
      const orderSalespersonCommission = order.items.reduce((sum, item) => sum + (item.salespersonCommission || 0), 0);
      const orderCompanyCommission = order.items.reduce((sum, item) => sum + (item.companyCommissionAmount || 0), 0);
      const orderProfit = receivedAmount - orderCompanyCommission - orderTechnicianCommission - orderSalespersonCommission;
      totalProfit += orderProfit;

      // 技师统计
      order.items.forEach(item => {
        const technicianId = item.technicianId || 'unknown';
        if (!technicianStats[technicianId]) {
          technicianStats[technicianId] = {
            technicianId: technicianId,
            technicianName: item.technicianName || '未知技师',
            orderCount: 0,
            totalRevenue: 0,
            totalCommission: 0
          };
        }

        technicianStats[technicianId].orderCount++;
        
        // 使用实收金额进行统计，按订单比例分配
        const orderTotalPrice = order.items.reduce((sum, orderItem) => sum + orderItem.price, 0);
        const itemRatio = orderTotalPrice > 0 ? item.price / orderTotalPrice : 1 / order.items.length;
        const allocatedRevenue = (order.receivedAmount || 0) * itemRatio;
        
        technicianStats[technicianId].totalRevenue += allocatedRevenue;
        technicianStats[technicianId].totalCommission += item.technicianCommission;
      });

      // 销售员统计（从项目级别汇总）
      const salespersonItemStats: { [salespersonId: string]: any } = {};
      
      order.items.forEach(item => {
        if (item.salespersonId && item.salespersonCommission) {
          const salespersonId = item.salespersonId;
          
          if (!salespersonStats[salespersonId]) {
            salespersonStats[salespersonId] = {
              salespersonId: salespersonId,
              salespersonName: item.salespersonName || '未知销售员',
              orderCount: 0,
              totalRevenue: 0,
              totalCommission: 0
            };
          }

          if (!salespersonItemStats[salespersonId]) {
            salespersonItemStats[salespersonId] = {
              totalRevenue: 0,
              totalCommission: 0
            };
          }

          // 直接使用项目价格作为营业额，不需要按比例分配
          salespersonItemStats[salespersonId].totalRevenue += item.price;
          salespersonItemStats[salespersonId].totalCommission += item.salespersonCommission;
        }
      });

      // 汇总销售员统计
      Object.keys(salespersonItemStats).forEach(salespersonId => {
        const salespersonStat = salespersonStats[salespersonId];
        const itemStats = salespersonItemStats[salespersonId];
        
        salespersonStat.orderCount++;
        salespersonStat.totalRevenue += itemStats.totalRevenue;
        salespersonStat.totalCommission += itemStats.totalCommission;
      });
    });

    // 计算利润统计数据（直接从原始数据源获取，只计算利润）
    const allProfitStats = periodOrders.map(order => {
      // 直接从订单项目获取数据
      const totalTechnicianCommission = order.items.reduce((sum, item) => sum + item.technicianCommission, 0);
      const totalSalespersonCommission = order.items.reduce((sum, item) => sum + (item.salespersonCommission || 0), 0);
      const companyCommissionAmount = order.items.reduce((sum, item) => sum + (item.companyCommissionAmount || 0), 0);
      const receivedAmount = order.receivedAmount || 0;
      
      // 利润 = 实收金额 - 公司抽成 - 技师抽成 - 销售员抽成
      const profit = receivedAmount - companyCommissionAmount - totalTechnicianCommission - totalSalespersonCommission;
      
      return {
        id: order.id,
        totalAmount: order.totalAmount,
        receivedAmount,
        companyCommissionAmount,
        totalTechnicianCommission,
        totalSalespersonCommission,
        profit
      };
    });

    // 分页处理
    const totalPages = Math.ceil(allProfitStats.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const profitStats = allProfitStats.slice(startIndex, endIndex);

    return {
      startDate,
      endDate,
      totalRevenue,
      totalProfit,
      totalTechnicianCommission,
      totalSalespersonCommission,
      totalCompanyCommission,
      orderCount: periodOrders.length,
      technicianStats: Object.values(technicianStats),
      salespersonStats: Object.values(salespersonStats),
      profitStats,
      pagination: {
        currentPage,
        totalPages,
        totalItems: allProfitStats.length,
        pageSize
      }
    };
  }, [startDate, endDate, currentPage, pageSize, orders, businessSettings]);

  // 优化事件处理函数
  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  }, []);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  }, []);

  const handleBackToToday = useCallback(() => {
    // 根据24小时营业逻辑计算当前业务日期
    const currentBusinessDate = getBusinessDateString(businessSettings);
    setStartDate(currentBusinessDate);
    setEndDate(currentBusinessDate);
  }, [businessSettings]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(statisticsReport.pagination.totalPages, prev + 1));
  }, [statisticsReport.pagination.totalPages]);

  // 优化重复的计算 - 使用所有筛选后的数据进行汇总，而不是当前页面的数据
  const profitStatsTotals = useMemo(() => {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const periodOrders = orders?.filter(order => {
      const orderBusinessDate = getBusinessDateStringForTime(new Date(order.createdAt), businessSettings);
      return orderBusinessDate >= startDate && orderBusinessDate <= endDate && order.status === 'completed';
    }) || [];

    if (periodOrders.length === 0) {
      return {
        totalAmount: 0,
        receivedAmount: 0,
        companyCommissionAmount: 0,
        totalTechnicianCommission: 0,
        totalSalespersonCommission: 0,
        totalProfit: 0
      };
    }
    
    // 计算所有筛选后订单的汇总数据
    const allOrdersTotals = periodOrders.reduce((totals, order) => {
      const totalTechnicianCommission = order.items.reduce((sum, item) => sum + item.technicianCommission, 0);
      const totalSalespersonCommission = order.items.reduce((sum, item) => sum + (item.salespersonCommission || 0), 0);
      const companyCommissionAmount = order.items.reduce((sum, item) => sum + (item.companyCommissionAmount || 0), 0);
      const receivedAmount = order.receivedAmount || 0;
      const profit = receivedAmount - companyCommissionAmount - totalTechnicianCommission - totalSalespersonCommission;
      
      return {
        totalAmount: totals.totalAmount + order.totalAmount,
        receivedAmount: totals.receivedAmount + receivedAmount,
        companyCommissionAmount: totals.companyCommissionAmount + companyCommissionAmount,
        totalTechnicianCommission: totals.totalTechnicianCommission + totalTechnicianCommission,
        totalSalespersonCommission: totals.totalSalespersonCommission + totalSalespersonCommission,
        totalProfit: totals.totalProfit + profit
      };
    }, {
      totalAmount: 0,
      receivedAmount: 0,
      companyCommissionAmount: 0,
      totalTechnicianCommission: 0,
      totalSalespersonCommission: 0,
      totalProfit: 0
    });
    
    return allOrdersTotals;
  }, [startDate, endDate, orders, businessSettings]);

  const technicianStatsTotals = useMemo(() => {
    return {
      totalOrderCount: statisticsReport.technicianStats.reduce((sum, tech) => sum + tech.orderCount, 0),
      totalRevenue: statisticsReport.technicianStats.reduce((sum, tech) => sum + tech.totalRevenue, 0),
      totalCommission: statisticsReport.technicianStats.reduce((sum, tech) => sum + tech.totalCommission, 0)
    };
  }, [statisticsReport.technicianStats]);

  const salespersonStatsTotals = useMemo(() => {
    return {
      totalOrderCount: statisticsReport.salespersonStats.reduce((sum, sales) => sum + sales.orderCount, 0),
      totalRevenue: statisticsReport.salespersonStats.reduce((sum, sales) => sum + sales.totalRevenue, 0),
      totalCommission: statisticsReport.salespersonStats.reduce((sum, sales) => sum + sales.totalCommission, 0)
    };
  }, [statisticsReport.salespersonStats]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">统计报表</h1>
          <p className="mt-2 text-gray-600">查看指定期间经营数据统计</p>
        </div>
        <div className="flex space-x-4">
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500 self-center">至</span>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleBackToToday}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Calendar className="h-4 w-4 mr-2" />
            回到今天
          </button>

        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {/* 订单数量 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">订单数量</p>
              <p className="text-2xl font-bold text-gray-900">{statisticsReport.orderCount}</p>
            </div>
          </div>
        </div>

        {/* 总收入 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总收入</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statisticsReport.totalRevenue, businessSettings)}
              </p>
            </div>
          </div>
        </div>

        {/* 技师总提成 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">技师总提成</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statisticsReport.totalTechnicianCommission, businessSettings)}
              </p>
            </div>
          </div>
        </div>

        {/* 销售员总提成 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">销售员总提成</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statisticsReport.totalSalespersonCommission, businessSettings)}
              </p>
            </div>
          </div>
        </div>

        {/* 公司总抽成 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">公司总抽成</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statisticsReport.totalCompanyCommission, businessSettings)}
              </p>
            </div>
          </div>
        </div>

        {/* 总利润 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总利润</p>
              <p className={`text-2xl font-bold ${statisticsReport.totalProfit < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatCurrency(statisticsReport.totalProfit, businessSettings)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 两列布局：利润统计 + 人员统计 */}
      <div className="grid grid-cols-7 gap-6">
        {/* 左侧：利润统计 - 占5份 */}
        <div className="col-span-5">
          <div className="bg-white rounded-lg shadow" style={{ height: '650px' }}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">利润统计</h3>
              {/* 分页控件 */}
              {statisticsReport.pagination && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={statisticsReport.pagination.currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-600">
                    {statisticsReport.pagination.currentPage} / {statisticsReport.pagination.totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={statisticsReport.pagination.currentPage === statisticsReport.pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col" style={{ height: 'calc(650px - 80px)' }}>
              {/* 固定表头 */}
              <div className="bg-gray-50">
                <table className="min-w-full" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '14.28%' }}>
                        订单号
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '14.28%' }}>
                        应收金额
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '14.28%' }}>
                        实收金额
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '14.28%' }}>
                        技师抽成
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '14.28%' }}>
                        销售员抽成
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '14.28%' }}>
                        公司抽成
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '14.28%' }}>
                        利润
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
              {/* 可滚动数据区域 */}
              <div className="overflow-y-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statisticsReport.profitStats?.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center" style={{ width: '14.28%' }}>
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '14.28%' }}>
                          {formatCurrency(order.totalAmount, businessSettings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '14.28%' }}>
                          {formatCurrency(order.receivedAmount || 0, businessSettings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '14.28%' }}>
                          {formatCurrency(order.totalTechnicianCommission, businessSettings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '14.28%' }}>
                          {formatCurrency(order.totalSalespersonCommission, businessSettings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '14.28%' }}>
                          {formatCurrency(order.companyCommissionAmount || 0, businessSettings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '14.28%' }}>
                          <span className={(order.profit || 0) < 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(order.profit || 0, businessSettings)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* 汇总行 - 固定在底部 */}
              {statisticsReport.profitStats && statisticsReport.profitStats.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                    <tbody className="bg-gray-50 divide-y divide-gray-200">
                      <tr className="font-semibold">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center" style={{ width: '14.28%' }}>
                          总计
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '14.28%' }}>
                          {formatCurrency(profitStatsTotals.totalAmount, businessSettings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '14.28%' }}>
                          {formatCurrency(profitStatsTotals.receivedAmount, businessSettings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '14.28%' }}>
                          {formatCurrency(profitStatsTotals.totalTechnicianCommission, businessSettings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '14.28%' }}>
                          {formatCurrency(profitStatsTotals.totalSalespersonCommission, businessSettings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '14.28%' }}>
                          {formatCurrency(profitStatsTotals.companyCommissionAmount, businessSettings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '14.28%' }}>
                          <span className={profitStatsTotals.totalProfit < 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(profitStatsTotals.totalProfit, businessSettings)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：人员统计 - 占2份 */}
        <div className="col-span-2 space-y-6">
          {/* 技师统计 */}
          <div className="bg-white rounded-lg shadow" style={{ height: 'calc((650px - 24px) / 2)' }}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">技师统计</h3>
            </div>
            <div className="flex flex-col" style={{ height: 'calc((650px - 24px) / 2 - 80px)' }}>
              {/* 固定表头 */}
              <div className="bg-gray-50">
                <table className="min-w-full" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                        技师姓名
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                        上钟数
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                        营业额
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                        抽成金额
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
              {/* 可滚动数据区域 */}
              <div className="overflow-y-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statisticsReport.technicianStats.map((tech) => (
                      <tr key={tech.technicianId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center" style={{ width: '25%' }}>
                          {tech.technicianName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '25%' }}>
                          {tech.orderCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '25%' }}>
                          {formatCurrency(tech.totalRevenue, businessSettings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '25%' }}>
                          {formatCurrency(tech.totalCommission, businessSettings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                              {/* 汇总行 - 固定在底部 */}
                {statisticsReport.technicianStats.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                      <tbody className="bg-gray-50 divide-y divide-gray-200">
                        <tr className="font-semibold">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center" style={{ width: '25%' }}>
                            总计
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '25%' }}>
                            {technicianStatsTotals.totalOrderCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '25%' }}>
                            {formatCurrency(technicianStatsTotals.totalRevenue, businessSettings)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '25%' }}>
                            {formatCurrency(technicianStatsTotals.totalCommission, businessSettings)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </div>

          {/* 销售员统计 */}
          {statisticsReport.salespersonStats.length > 0 && (
            <div className="bg-white rounded-lg shadow" style={{ height: 'calc((650px - 24px) / 2)' }}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">销售员统计</h3>
              </div>
                              <div className="flex flex-col" style={{ height: 'calc((650px - 24px) / 2 - 80px)' }}>
                  {/* 固定表头 */}
                  <div className="bg-gray-50">
                    <table className="min-w-full" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                            销售员姓名
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                            订单数
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                            营业额
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                            抽成金额
                          </th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  {/* 可滚动数据区域 */}
                  <div className="overflow-y-auto flex-1">
                    <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {statisticsReport.salespersonStats.map((sales) => (
                          <tr key={sales.salespersonId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center" style={{ width: '25%' }}>
                              {sales.salespersonName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '25%' }}>
                              {sales.orderCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '25%' }}>
                              {formatCurrency(sales.totalRevenue, businessSettings)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '25%' }}>
                              {formatCurrency(sales.totalCommission, businessSettings)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                {/* 汇总行 - 固定在底部 */}
                {statisticsReport.salespersonStats.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                      <tbody className="bg-gray-50 divide-y divide-gray-200">
                        <tr className="font-semibold">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center" style={{ width: '25%' }}>
                            总计
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '25%' }}>
                            {salespersonStatsTotals.totalOrderCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '25%' }}>
                            {formatCurrency(salespersonStatsTotals.totalRevenue, businessSettings)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" style={{ width: '25%' }}>
                            {formatCurrency(salespersonStatsTotals.totalCommission, businessSettings)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 