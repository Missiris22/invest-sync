import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import RoomManager from './components/RoomManager';
import HoldingsManager from './components/HoldingsManager';
import MarketAnalysis from './components/MarketAnalysis';
import { LayoutDashboard, LineChart, LogOut, Menu } from 'lucide-react';

// --- Dashboard Component (The Index Route) ---
const Dashboard: React.FC = () => {
  const { currentRoom } = useApp();
  // Logic: If in room, holdings first then room info. If not, room creation first.
  if (currentRoom) {
    return (
      <div className="space-y-8 animate-fade-in">
        <HoldingsManager />
        <RoomManager />
      </div>
    );
  } else {
    return (
      <div className="space-y-8 animate-fade-in">
        <RoomManager />
        <HoldingsManager />
      </div>
    );
  }
};

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { currentUser } = useApp();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// --- Layout Component (Sidebar + Outlet) ---
const Layout: React.FC = () => {
  const { currentUser, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ path, icon: Icon, label }: { path: string, icon: any, label: string }) => {
    const isActive = location.pathname === path;
    return (
      <button
        onClick={() => {
          navigate(path);
          setMobileMenuOpen(false);
        }}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition font-medium ${
          isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon size={20} />
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col md:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-6 fixed h-full z-20">
        <div className="mb-10 flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-blue-500/20 shadow-lg">I</div>
           <h1 className="text-2xl font-bold text-white tracking-tight">InvestSync</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavItem path="/" icon={LayoutDashboard} label="概览" />
          <NavItem path="/analysis" icon={LineChart} label="AI 市场情报" />
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
               {currentUser?.name.substring(0,2).toUpperCase()}
             </div>
             <div>
               <p className="text-sm font-bold text-white truncate w-28">{currentUser?.name}</p>
               <p className="text-xs text-slate-500">在线</p>
             </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 text-slate-500 hover:text-red-400 text-sm transition"
          >
            <LogOut size={16} /> 退出登录
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2">
           <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white text-sm">I</div>
           <h1 className="text-lg font-bold text-white">InvestSync</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 p-1">
          <Menu />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/95 backdrop-blur-md z-40 p-6 animate-fade-in">
          <div className="flex justify-end mb-8">
            <button onClick={() => setMobileMenuOpen(false)} className="text-white p-2 rounded-full bg-slate-800">关闭</button>
          </div>
          <nav className="space-y-4">
            <NavItem path="/" icon={LayoutDashboard} label="概览" />
            <NavItem path="/analysis" icon={LineChart} label="AI 市场情报" />
            <div className="h-px bg-slate-800 my-4"></div>
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 font-medium">
              <LogOut size={20} /> 退出登录
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto pb-20">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// --- Main App Component with Routing ---
const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="analysis" element={<MarketAnalysis />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;