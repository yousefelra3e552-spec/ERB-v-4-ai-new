import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Package,
  Palette,
  Scissors,
  Activity,
  GitCommit,
  Settings,
  LogOut,
  UserCheck,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onLogout }) => {
  const { currentUser, users, setCurrentUser, hasPermission } = useApp();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSudo = currentUser?.username === 'sudo' || currentUser?.is_sudo;

  // Exact 7 navigation items as requested
  const allNavItems = [
    { 
      id: 'dashboard', 
      label: 'الرئيسية', 
      icon: LayoutDashboard, 
      color: 'text-slate-700', 
      isVisible: true 
    },
    {
      id: 'warehouse',
      label: 'قسم المخازن',
      icon: Package,
      color: 'text-blue-600',
      isVisible:
        hasPermission('fabric_warehouse') ||
        hasPermission('accessories_warehouse') ||
        hasPermission('production_warehouse')
    },
    {
      id: 'design',
      label: 'التصميم',
      icon: Palette,
      color: 'text-slate-800',
      isVisible: hasPermission('design')
    },
    {
      id: 'cutting',
      label: 'القص',
      icon: Scissors,
      color: 'text-rose-600',
      isVisible: hasPermission('cutting')
    },
    {
      id: 'production_control',
      label: 'الـ production control (مطابع، مكن)',
      icon: Activity,
      color: 'text-indigo-600',
      isVisible:
        hasPermission('printing') ||
        hasPermission('qc') ||
        hasPermission('sewing') ||
        hasPermission('reports')
    },
    {
      id: 'models_tracking',
      label: 'حركة الموديلات',
      icon: GitCommit,
      color: 'text-cyan-600',
      isVisible: hasPermission('models_tracking') || isSudo || currentUser?.role === 'owner'
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: Settings,
      color: 'text-slate-600',
      isVisible: isSudo || currentUser?.role === 'owner' || currentUser?.role === 'مدير عام المصنع'
    }
  ];

  const navItems = allNavItems.filter((item) => item.isVisible);

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  const isTabActive = (itemId: string) => {
    if (currentTab === itemId) return true;
    if (
      itemId === 'warehouse' &&
      (currentTab === 'warehouse' ||
        currentTab === 'accessories_warehouse' ||
        currentTab === 'production_warehouse')
    ) {
      return true;
    }
    if (
      itemId === 'design' &&
      (currentTab === 'design' || currentTab === 'model_details')
    ) {
      return true;
    }
    if (
      itemId === 'cutting' &&
      (currentTab === 'cutting' || currentTab === 'cutting_details')
    ) {
      return true;
    }
    if (
      itemId === 'production_control' &&
      (currentTab === 'production_control' ||
        currentTab === 'printing' ||
        currentTab === 'assembly' ||
        currentTab === 'qc' ||
        currentTab === 'qc_details' ||
        currentTab === 'sewing')
    ) {
      return true;
    }
    if (itemId === 'models_tracking' && currentTab === 'models_tracking') {
      return true;
    }
    if (
      itemId === 'settings' &&
      (currentTab === 'settings' || currentTab === 'logs')
    ) {
      return true;
    }
    return false;
  };

  return (
    <nav className="no-print bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-2 font-black text-lg text-slate-900 hover:opacity-90 transition group shrink-0"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🏭</span>
              <span className="tracking-tight hidden sm:inline">نظام إدارة المصنع</span>
              <span className="sm:hidden font-black">ERP</span>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isTabActive(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100/90'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Profile & Quick Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition text-xs text-slate-800 font-semibold"
                title="تغيير المستخدم لاختبار الصلاحيات"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {currentUser?.real_name ? currentUser.real_name[0] : 'U'}
                </div>
                <div className="hidden md:flex flex-col text-start">
                  <span className="text-xs font-bold leading-tight line-clamp-1 max-w-[120px]">
                    {currentUser?.real_name || currentUser?.username}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {currentUser?.username === 'sudo' || currentUser?.is_sudo
                      ? 'الإدارة العليا (Sudo)'
                      : currentUser?.role || 'موظف تشغيل'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {/* Switch User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute start-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-400">تبديل حساب المستخدم (تجربة الصلاحيات)</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-start px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                          currentUser?.id === u.id ? 'bg-blue-50/70 font-bold text-blue-900' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className={`w-4 h-4 ${currentUser?.id === u.id ? 'text-blue-600' : 'text-slate-400'}`} />
                          <div>
                            <p className="font-semibold">{u.real_name}</p>
                            <p className="text-[10px] text-slate-400">@{u.username} • {u.role}</p>
                          </div>
                        </div>
                        {currentUser?.id === u.id && (
                          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            الحالي
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 text-xs text-rose-600 hover:bg-rose-50 font-bold py-2 rounded-xl transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج من النظام</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition shadow-xs"
              title="خروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isTabActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};
