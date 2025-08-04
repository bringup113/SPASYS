import { BusinessSettings } from '../types';

// 获取当前时间（基于配置的时区）
export function getCurrentTime(businessSettings?: BusinessSettings): Date {
  if (!businessSettings || !businessSettings.timezone) {
    return new Date();
  }
  
  // 直接返回当前时间，让调用方处理时区转换
  return new Date();
}

// 获取当前日期字符串（基于配置的时区）
export function getCurrentDateString(businessSettings?: BusinessSettings): string {
  const currentTime = getCurrentTime(businessSettings);
  return currentTime.toISOString().split('T')[0];
}

// 获取业务日期字符串（考虑24小时营业的新一天开始时间）
export function getBusinessDateString(businessSettings?: BusinessSettings): string {
  if (!businessSettings || !businessSettings.timezone) {
    return new Date().toISOString().split('T')[0];
  }
  
  // 使用 getBusinessDateStringForTime 来处理24小时营业逻辑
  return getBusinessDateStringForTime(new Date(), businessSettings);
}

// 根据指定时间获取业务日期字符串
export function getBusinessDateStringForTime(time: Date, businessSettings?: BusinessSettings): string {
  if (!businessSettings || !businessSettings.businessHours) {
    // 如果没有业务设置，使用指定时区的日期
    if (businessSettings?.timezone) {
      const year = time.toLocaleString('en-US', { 
        timeZone: businessSettings.timezone,
        year: 'numeric'
      });
      const month = time.toLocaleString('en-US', { 
        timeZone: businessSettings.timezone,
        month: '2-digit'
      });
      const day = time.toLocaleString('en-US', { 
        timeZone: businessSettings.timezone,
        day: '2-digit'
      });
      return `${year}-${month}-${day}`;
    }
    return time.toISOString().split('T')[0];
  }
  
  const { businessHours } = businessSettings;
  
  // 获取指定时区的日期
  let timezoneDate: Date;
  if (businessSettings.timezone) {
    const year = time.toLocaleString('en-US', { 
      timeZone: businessSettings.timezone,
      year: 'numeric'
    });
    const month = time.toLocaleString('en-US', { 
      timeZone: businessSettings.timezone,
      month: '2-digit'
    });
    const day = time.toLocaleString('en-US', { 
      timeZone: businessSettings.timezone,
      day: '2-digit'
    });
    const hour = time.toLocaleString('en-US', { 
      timeZone: businessSettings.timezone,
      hour: '2-digit',
      hour12: false
    });
    const minute = time.toLocaleString('en-US', { 
      timeZone: businessSettings.timezone,
      minute: '2-digit'
    });
    
    // 确保分钟是两位数
    const paddedMinute = minute.padStart(2, '0');
    
    // 创建指定时区的日期对象，使用更安全的方法
    const dateString = `${year}-${month}-${day}T${hour}:${paddedMinute}:00`;
    timezoneDate = new Date(dateString);
    
    // 如果创建的日期无效，回退到原始时间
    if (isNaN(timezoneDate.getTime())) {
      console.warn(`无法解析时区日期: ${dateString}，使用原始时间`);
      timezoneDate = time;
    }
  } else {
    timezoneDate = time;
  }
  
  // 如果不是24小时营业，直接返回时区日期
  if (!businessHours.is24Hour || !businessHours.newDayStartTime) {
    const year = timezoneDate.getFullYear();
    const month = (timezoneDate.getMonth() + 1).toString().padStart(2, '0');
    const day = timezoneDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // 24小时营业时，根据新一天开始时间计算业务日期
  const [newDayHour, newDayMinute] = businessHours.newDayStartTime.split(':').map(Number);
  const currentHour = timezoneDate.getHours();
  const currentMinute = timezoneDate.getMinutes();
  
  // 如果当前时间在新一天开始时间之前，业务日期是昨天
  if (currentHour < newDayHour || (currentHour === newDayHour && currentMinute < newDayMinute)) {
    const yesterday = new Date(timezoneDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
    const day = yesterday.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // 否则业务日期是今天
  const year = timezoneDate.getFullYear();
  const month = (timezoneDate.getMonth() + 1).toString().padStart(2, '0');
  const day = timezoneDate.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 将UTC时间转换为指定时区的Date对象
export function convertToTimezone(utcTime: string, businessSettings?: BusinessSettings): Date {
  const date = new Date(utcTime);
  const offset = getTimezoneOffset(businessSettings);
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (offset * 3600000));
}

// 将UTC时间转换为指定时区的日期字符串
export function convertToTimezoneDateString(utcTime: string, businessSettings?: BusinessSettings): string {
  const timezoneDate = convertToTimezone(utcTime, businessSettings);
  return timezoneDate.toISOString().split('T')[0];
}

// 检查时间是否在营业时间内
export function isWithinBusinessHours(time: Date, businessSettings?: BusinessSettings): boolean {
  if (!businessSettings || !businessSettings.businessHours) {
    return true; // 如果没有设置，默认允许
  }
  
  const { businessHours } = businessSettings;
  
  if (businessHours.is24Hour) {
    return true;
  }

  const hour = time.getHours();
  const minute = time.getMinutes();
  const currentTime = hour * 60 + minute;

  const [startHour, startMinute] = businessHours.startTime.split(':').map(Number);
  const [endHour, endMinute] = businessHours.endTime.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  if (businessHours.crossDay) {
    // 跨天营业：结束时间小于开始时间
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    // 同天营业：结束时间大于开始时间
    return currentTime >= startTime && currentTime <= endTime;
  }
}

// 格式化时间显示
export function formatTime(time: Date, businessSettings?: BusinessSettings): string {
  if (!businessSettings || !businessSettings.timezone) {
    return time.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return time.toLocaleString('zh-CN', {
    timeZone: businessSettings.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 获取时区偏移量（小时）
export function getTimezoneOffset(businessSettings?: BusinessSettings): number {
  if (!businessSettings || !businessSettings.timezone) {
    return 0; // 默认返回0偏移量
  }
  
  const timezone = businessSettings.timezone;
  
  // 预定义的时区偏移量
  const timezoneOffsets: { [key: string]: number } = {
    'Asia/Shanghai': 8,      // 北京时间
    'Asia/Bangkok': 7,       // 泰国时间
    'UTC': 0,                // UTC时间
    'America/New_York': -5,  // 纽约时间
    'Europe/London': 0,      // 伦敦时间
  };

  return timezoneOffsets[timezone] || 0;
}

 