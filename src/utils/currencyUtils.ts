import { AppState } from '../types';

/**
 * 获取基础货币符号
 * @param state 应用状态
 * @returns 货币符号，默认为 '¥'
 */
export const getBaseCurrencySymbol = (state: AppState): string => {
  return state.businessSettings?.baseCurrencySymbol || '¥';
};

/**
 * 格式化货币金额
 * @param amount 金额
 * @param state 应用状态
 * @param decimals 小数位数，默认为2
 * @returns 格式化后的货币字符串
 */
export const formatCurrency = (
  amount: number | undefined | null, 
  state: AppState, 
  decimals: number = 2
): string => {
  if (amount === undefined || amount === null) {
    return `${getBaseCurrencySymbol(state)}0.00`;
  }
  const symbol = getBaseCurrencySymbol(state);
  return `${symbol}${amount.toFixed(decimals)}`;
};

/**
 * 获取基础货币名称
 * @param state 应用状态
 * @returns 货币名称，默认为 '人民币'
 */
export const getBaseCurrencyName = (state: AppState): string => {
  return state.businessSettings?.baseCurrencyName || '人民币';
};

/**
 * 获取基础货币代码
 * @param state 应用状态
 * @returns 货币代码，默认为 'CNY'
 */
export const getBaseCurrencyCode = (state: AppState): string => {
  return state.businessSettings?.baseCurrencyCode || 'CNY';
}; 