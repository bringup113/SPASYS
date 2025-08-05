// 房间类型
export interface Room {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  description?: string;
  isTemporary?: boolean; // 是否为临时房间
  expiresAt?: string; // 临时房间过期时间
}

// 技师状态类型
export type TechnicianStatus = 'available' | 'busy' | 'offline';

// 公司分成方案类型
export interface CompanyCommissionRule {
  id: string;
  name: string;
  commissionType: 'none' | 'revenue' | 'profit';
  commissionRate: number;
  description?: string;
  isDefault: boolean;
}

// 技师类型
export interface Technician {
  id: string;
  employeeId: string; // 唯一工号
  countryId: string; // 国家ID
  countryName?: string; // 国家名称（用于显示）
  hireDate: string;
  status: TechnicianStatus; // 新增：技师状态
  services: ServiceAssignment[];
}

// 服务分类类型
export interface ServiceCategory {
  id: string;
  name: string;
}

// 服务项目类型
export interface ServiceItem {
  id: string;
  name: string;
  duration: number; // 分钟
  categoryId: string;
}

// 技师服务分配类型
export interface ServiceAssignment {
  serviceId: string;
  price: number;
  commission: number;
  companyCommissionRuleId?: string; // 该技师此服务使用的公司分成方案ID
}

// 订单状态类型
export type OrderStatus = 'in_progress' | 'completed' | 'cancelled';

// 交接班状态类型
export type HandoverStatus = 'pending' | 'handed_over' | 'confirmed';

// 订单项目类型
export interface OrderItem {
  serviceId: string;
  serviceName?: string; // 服务项目名称（保存时的快照）
  technicianId?: string; // 技师ID（可选）
  technicianName?: string; // 技师姓名（保存时的快照）
  price: number;
  technicianCommission: number; // 技师提成（保存时的快照）
  salespersonId?: string; // 销售员ID
  salespersonName?: string; // 销售员姓名（保存时的快照）
  salespersonCommission?: number; // 销售员抽成（保存时的快照）
  companyCommissionRuleId?: string; // 该服务项目使用的公司分成方案ID
  companyCommissionRuleName?: string; // 公司分成方案名称快照
  companyCommissionType?: string; // 公司抽成类型快照
  companyCommissionRate?: number; // 公司抽成比例快照
  companyCommissionAmount?: number; // 公司抽成金额（结账时计算）
}

// 订单类型
export interface Order {
  id: string;
  roomId: string;
  roomName?: string; // 房间名称（保存时的快照）
  customerName?: string;
  customerPhone?: string;
  status: OrderStatus;
  handoverStatus: HandoverStatus; // 交接班状态
  items: OrderItem[];
  totalAmount: number;
  receivedAmount?: number; // 实收金额
  discountRate?: number; // 折扣率（实收金额/消费金额）
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  handoverAt?: string; // 交接班时间
  notes?: string;
}

// 销售员类型
export interface Salesperson {
  id: string;
  name: string;
  commissionType: 'fixed' | 'percentage';
  commissionRate: number; // 固定金额或百分比
}

// 国家类型
export interface Country {
  id: string;
  name: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// 业务时间类型
export interface BusinessHours {
  startTime: string;
  endTime: string;
  is24Hour: boolean;
  crossDay: boolean;
  newDayStartTime?: string; // 24小时营业时，新一天的开始时间（如 "20:00"）
}

// 业务设置类型
export interface BusinessSettings {
  businessHours: BusinessHours;
  timezone: string;
  baseCurrencyName: string;
  baseCurrencyCode: string;
  baseCurrencySymbol: string;
}

// 应用状态类型
export interface AppState {
  rooms: Room[];
  serviceCategories: ServiceCategory[];
  serviceItems: ServiceItem[];
  technicians: Technician[];
  salespeople: Salesperson[];
  countries: Country[]; // 新增：国家列表
  orders: Order[]; // 新增：订单列表
  companyCommissionRules: CompanyCommissionRule[]; // 新增：公司分成方案列表
  businessSettings?: BusinessSettings; // 业务设置
}

// 房间状态类型
export interface RoomState {
  rooms: Room[];
  isLoading: boolean;
  error: string | null;
}

// 服务状态类型
export interface ServiceState {
  serviceCategories: ServiceCategory[];
  serviceItems: ServiceItem[];
  isLoading: boolean;
  error: string | null;
}

// 技师状态类型
export interface TechnicianState {
  technicians: Technician[];
  isLoading: boolean;
  error: string | null;
}

// 销售员状态类型
export interface SalespersonState {
  salespeople: Salesperson[];
  isLoading: boolean;
  error: string | null;
}

// 订单状态类型
export interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}

// 设置状态类型
export interface SettingsState {
  countries: Country[];
  companyCommissionRules: CompanyCommissionRule[];
  businessSettings?: BusinessSettings;
  isLoading: boolean;
  error: string | null;
}

// 连接状态类型
export interface ConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
} 