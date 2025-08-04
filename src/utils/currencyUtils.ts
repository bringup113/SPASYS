import { BusinessSettings } from '../types';

/**
 * 获取基础货币符号
 * @param businessSettings 业务设置
 * @returns 货币符号，默认为 '฿'
 */
export const getBaseCurrencySymbol = (businessSettings?: BusinessSettings): string => {
  return businessSettings?.baseCurrencySymbol || '฿';
};

/**
 * 格式化货币金额
 * @param amount 金额
 * @param businessSettings 业务设置
 * @param decimals 小数位数，默认为2
 * @returns 格式化后的货币字符串
 */
export const formatCurrency = (
  amount: number | undefined | null, 
  businessSettings?: BusinessSettings, 
  decimals: number = 2
): string => {
  if (amount === undefined || amount === null) {
    return `${getBaseCurrencySymbol(businessSettings)}0.00`;
  }
  const symbol = getBaseCurrencySymbol(businessSettings);
  return `${symbol}${amount.toFixed(decimals)}`;
};

/**
 * 获取基础货币名称
 * @param businessSettings 业务设置
 * @returns 货币名称，默认为 '泰铢'
 */
export const getBaseCurrencyName = (businessSettings?: BusinessSettings): string => {
  return businessSettings?.baseCurrencyName || '泰铢';
};

/**
 * 获取基础货币代码
 * @param businessSettings 业务设置
 * @returns 货币代码，默认为 'THB'
 */
export const getBaseCurrencyCode = (businessSettings?: BusinessSettings): string => {
  return businessSettings?.baseCurrencyCode || 'THB';
}; 