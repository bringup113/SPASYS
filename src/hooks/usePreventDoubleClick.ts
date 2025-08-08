import { useState, useCallback } from 'react';

interface UsePreventDoubleClickOptions {
  delay?: number; // 防重复点击的延迟时间（毫秒）
  onSuccess?: () => void; // 成功后的回调
  onError?: (error: any) => void; // 错误后的回调
}

export const usePreventDoubleClick = (options: UsePreventDoubleClickOptions = {}) => {
  const { delay = 1000, onSuccess, onError } = options;
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (asyncFunction: () => Promise<any>) => {
    if (isLoading) {
      return; // 如果正在加载，直接返回，防止重复执行
    }

    setIsLoading(true);
    
    try {
      const result = await asyncFunction();
      onSuccess?.();
      return result;
    } catch (error) {
      onError?.(error);
      throw error;
    } finally {
      // 延迟重置状态，防止快速重复点击
      setTimeout(() => {
        setIsLoading(false);
      }, delay);
    }
  }, [isLoading, delay, onSuccess, onError]);

  return {
    isLoading,
    execute
  };
};
