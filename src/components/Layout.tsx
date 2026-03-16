import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, CalendarCheck, FileText, BarChart2, Settings, Shield, LogOut } from 'lucide-react';
import { cn } from '../utils';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const staffNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/tests', icon: FileText, label: 'Tests' },
    { to: '/reports', icon: BarChart2, label: 'Reports' },
  ];

  const parentNavItems = [
    { to: `/student/${user?.studentId}?tab=overview`, icon: Home, label: 'Dashboard', tab: 'overview' },
    { to: `/student/${user?.studentId}?tab=attendance`, icon: CalendarCheck, label: 'Attendance', tab: 'attendance' },
    { to: `/student/${user?.studentId}?tab=tests`, icon: FileText, label: 'Tests', tab: 'tests' },
  ];

  const navItems = role === 'admin' ? staffNavItems : parentNavItems;

  const isParentActive = (tab: string) => {
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab') || 'overview';
    return currentTab === tab && location.pathname.startsWith('/student/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold">Aspire Academics</h1>
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-xs bg-indigo-700 px-3 py-1.5 rounded-full">
            <Shield className="w-4 h-4 mr-1.5" />
            <span className="capitalize font-medium">{user?.name}</span>
          </div>
          {role === 'admin' && (
            <Link to="/settings" className="p-2 hover:bg-indigo-700 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </Link>
          )}
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-indigo-700 rounded-full transition-colors text-indigo-100 hover:text-white"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 shadow-lg z-10 pb-safe">
        {navItems.map((item: any) => {
          const isActive = role === 'parent' ? isParentActive(item.tab) : location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-colors",
                isActive ? "text-indigo-600 bg-indigo-50" : "text-gray-500 hover:text-indigo-500 hover:bg-gray-50"
              )}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
