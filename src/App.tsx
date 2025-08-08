
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import { AuthProvider } from './context/AuthContext';
import { useConnectionContext } from './context/ConnectionContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import ServiceCategories from './pages/ServiceCategories';
import ServiceItems from './pages/ServiceItems';
import Technicians from './pages/Technicians';
import Orders from './pages/Orders';
import Salespeople from './pages/Salespeople';
import Countries from './pages/Countries';
import CompanyCommissionRules from './pages/CompanyCommissionRules';
import Settings from './pages/Settings';
import StatisticsReport from './pages/DailyReport';

function AppContent() {
  const { isLoading, isConnected } = useConnectionContext();

  // 如果正在加载，显示加载动画
  if (isLoading) {
    return <LoadingSpinner message="正在连接服务器..." />;
  }

  // 如果连接失败，显示重连提示
  if (!isConnected) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">连接服务器失败</h3>
          <p className="text-gray-600 text-center mb-4">
            无法连接到后端服务器，请检查服务器是否已启动
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="technicians" element={<Technicians />} />
          <Route path="reports" element={<Dashboard />} />
          <Route path="system" element={<Dashboard />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="service-categories" element={<ServiceCategories />} />
          <Route path="service-items" element={<ServiceItems />} />
          <Route path="salespeople" element={<Salespeople />} />
          <Route path="countries" element={<Countries />} />
          <Route path="company-commission-rules" element={<CompanyCommissionRules />} />
          <Route path="settings" element={<Settings />} />
          <Route path="statistics-report" element={<StatisticsReport />} />
          {/* 404重定向到仪表板 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
    <AppProvider>
      <AppContent />
    </AppProvider>
    </AuthProvider>
  );
}

export default App; 