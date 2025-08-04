import { CompanyCommissionRule, OrderItem } from '../types';

/**
 * 佣金计算工具类
 * 统一处理技师、销售员、公司分成等所有佣金计算逻辑
 */
export class CommissionCalculator {
  /**
   * 计算销售员佣金
   * @param item 订单项目
   * @param salesperson 销售员信息
   * @param discountRate 折扣率
   * @returns 销售员佣金金额
   */
  static calculateSalespersonCommission(
    item: OrderItem,
    salesperson: any,
    discountRate: number = 1.0
  ): number {
    if (!salesperson) return 0;

    if (salesperson.commissionType === 'fixed') {
      // 固定抽成：每个项目固定金额
      return salesperson.commissionRate;
    } else if (salesperson.commissionType === 'percentage') {
      // 比例抽成：按项目价格比例，需要考虑折扣率
      return (item.price * salesperson.commissionRate / 100) * discountRate;
    }

    return 0;
  }

  /**
   * 计算单个项目的公司分成
   * @param item 订单项目
   * @param discountRate 折扣率
   * @param companyCommissionRule 公司分成方案
   * @returns 公司分成金额
   */
  static calculateItemCompanyCommission(
    item: OrderItem,
    discountRate: number,
    companyCommissionRule: CompanyCommissionRule
  ): number {
    if (companyCommissionRule.commissionType === 'none') {
      return 0;
    }

    // 计算项目实收金额
    const itemReceivedAmount = item.price * discountRate;

    if (companyCommissionRule.commissionType === 'revenue') {
      // 销售额抽成：项目实收金额 × 公司抽成比例
      return itemReceivedAmount * companyCommissionRule.commissionRate / 100;
    } else if (companyCommissionRule.commissionType === 'profit') {
      // 利润抽成：(项目实收金额 - 技师抽成 - 销售员抽成) × 公司抽成比例
      const itemProfit = itemReceivedAmount - (item.technicianCommission || 0) - (item.salespersonCommission || 0);
      return itemProfit * companyCommissionRule.commissionRate / 100;
    }

    return 0;
  }

  /**
   * 计算订单中所有项目的技师抽成总和
   * @param orderItems 订单项目列表
   * @returns 技师抽成总金额
   */
  static calculateTotalTechnicianCommission(orderItems: OrderItem[]): number {
    return orderItems.reduce((total, item) => total + (item.technicianCommission || 0), 0);
  }

  /**
   * 计算订单中所有项目的销售员抽成总和
   * @param orderItems 订单项目列表
   * @returns 销售员抽成总金额
   */
  static calculateTotalSalespersonCommission(orderItems: OrderItem[]): number {
    return orderItems.reduce((total, item) => total + (item.salespersonCommission || 0), 0);
  }

  /**
   * 计算订单中所有项目的公司分成总和（用于统计）
   * @param orderItems 订单项目列表
   * @param discountRate 折扣率
   * @param companyCommissionRules 公司分成方案列表
   * @returns 公司分成总金额
   */
  static calculateTotalCompanyCommission(
    orderItems: OrderItem[],
    discountRate: number,
    companyCommissionRules: CompanyCommissionRule[]
  ): number {
    let totalCompanyCommission = 0;

    for (const item of orderItems) {
      if (item.companyCommissionRuleId) {
        const rule = companyCommissionRules.find(r => r.id === item.companyCommissionRuleId);
        if (rule) {
          const itemCommission = this.calculateItemCompanyCommission(item, discountRate, rule);
          totalCompanyCommission += itemCommission;
        }
      }
    }

    return totalCompanyCommission;
  }

  /**
   * 计算订单利润
   * @param orderItems 订单项目列表
   * @param receivedAmount 实收金额
   * @param discountRate 折扣率
   * @param companyCommissionRules 公司分成方案列表
   * @returns 订单利润
   */
  static calculateOrderProfit(
    orderItems: OrderItem[],
    receivedAmount: number,
    discountRate: number,
    companyCommissionRules: CompanyCommissionRule[]
  ): number {
    const technicianCommission = this.calculateTotalTechnicianCommission(orderItems);
    const salespersonCommission = this.calculateTotalSalespersonCommission(orderItems);
    const companyCommission = this.calculateTotalCompanyCommission(orderItems, discountRate, companyCommissionRules);
    
    return receivedAmount - technicianCommission - salespersonCommission - companyCommission;
  }

  /**
   * 计算折扣率
   * @param receivedAmount 实收金额
   * @param totalAmount 总金额
   * @returns 折扣率
   */
  static calculateDiscountRate(receivedAmount: number, totalAmount: number): number {
    if (totalAmount === 0) return 1.0;
    return receivedAmount / totalAmount;
  }

  /**
   * 格式化金额显示
   * @param amount 金额
   * @param currency 货币符号
   * @returns 格式化后的金额字符串
   */
  static formatAmount(amount: number, currency: string = '¥'): string {
    return `${currency}${amount.toFixed(2)}`;
  }
} 