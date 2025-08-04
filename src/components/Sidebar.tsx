import { useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  UserCheck, 
  ShoppingCart, 
  Building2, 
  Settings, 
  BarChart3, 
  MapPin,
  Shield,
  FileText,
  ChevronDown
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: Home, label: '仪表板' },
  { path: '/orders', icon: ShoppingCart, label: '订单管理' },
  { path: '/technicians', icon: UserCheck, label: '技师管理' },
  { path: '/statistics-report', icon: BarChart3, label: '统计报表' },
  { 
    path: '/system', 
    icon: Settings, 
    label: '系统设置',
    children: [
      { path: '/countries', icon: MapPin, label: '国家管理' },
      { path: '/rooms', icon: Building2, label: '房间管理' },
      { path: '/service-categories', icon: FileText, label: '服务分类' },
      { path: '/service-items', icon: FileText, label: '服务项目' },
      { path: '/salespeople', icon: Users, label: '销售员管理' },
      { path: '/settings', icon: Settings, label: '基础设置' },
      { path: '/company-commission-rules', icon: Shield, label: '公司分成设置' }
    ]
  }
];

export default function Sidebar() {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = useCallback((path: string) => {
    setExpandedMenus(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  }, []);

  const renderMenuItem = useCallback((item: any, level: number = 0) => {
    const isExpanded = expandedMenus.includes(item.path);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.path}>
        {hasChildren ? (
          // 有子菜单的项目使用button，不进行导航
          <button
            onClick={() => toggleMenu(item.path)}
            className={`flex items-center w-full px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${
              level > 0 ? 'pl-12' : ''
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
            <ChevronDown 
              className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            />
          </button>
        ) : (
          // 没有子菜单的项目使用NavLink进行导航
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${
                isActive ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
              } ${level > 0 ? 'pl-12' : ''}`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        )}
        
        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children.map((child: any) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedMenus, toggleMenu]);

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">SPA管理系统</h1>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    </div>
  );
} 