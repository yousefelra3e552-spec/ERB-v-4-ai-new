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
  X,
  Bell,
  AlertCircle,
  Clock,
  Calendar,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { InternalMessagingModal } from './InternalMessagingModal';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onLogout }) => {
  const { 
    currentUser, 
    users, 
    setCurrentUser, 
    hasPermission, 
    appNotifications, 
    unreadNotificationsCount, 
    markNotificationRead,
    unreadMessagesCount
  } = useApp();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
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

          {/* Notifications & User Profile */}
          <div className="flex items-center gap-2">
            {/* Internal Messaging Icon Button */}
            <button
              type="button"
              onClick={() => {
                setMessagesModalOpen(true);
                setNotificationsOpen(false);
                setUserDropdownOpen(false);
              }}
              className={`relative p-2 rounded-full border transition cursor-pointer ${
                unreadMessagesCount > 0
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80'
              }`}
              title="المراسلات والمحادثات الداخلية بين المستخدمين"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Bell Icon & Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserDropdownOpen(false);
                }}
                className={`relative p-2 rounded-full border transition cursor-pointer ${
                  unreadNotificationsCount > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80'
                }`}
                title="تنبيهات وإشعارات مواعيد الاستلام (المطابع وورش المكن)"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Window */}
              {notificationsOpen && (
                <div className="absolute start-0 sm:start-auto sm:end-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-rose-600" />
                      <h4 className="font-black text-xs text-slate-900">
                        إشعارات مواعيد الاستلام والمتابعة
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {appNotifications.length} إشعار
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                    {appNotifications.length > 0 ? (
                      appNotifications.map((notif) => {
                        const isOverdue = notif.urgency === 'overdue';
                        const isToday = notif.urgency === 'today';

                        return (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markNotificationRead(notif.id);
                              setCurrentTab('production_control');
                              setNotificationsOpen(false);
                            }}
                            className={`p-3 rounded-2xl transition cursor-pointer text-xs flex flex-col gap-1 border ${
                              isOverdue
                                ? 'bg-rose-50/80 border-rose-300 text-rose-950 hover:bg-rose-100'
                                : isToday
                                ? 'bg-amber-50/80 border-amber-300 text-amber-950 hover:bg-amber-100'
                                : 'bg-blue-50/60 border-blue-200 text-blue-950 hover:bg-blue-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-black text-[10px] ${
                                  isOverdue
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : isToday
                                    ? 'bg-amber-500 text-slate-900'
                                    : 'bg-blue-600 text-white'
                                }`}
                              >
                                {isOverdue && <AlertCircle className="w-3 h-3" />}
                                {isToday && <Clock className="w-3 h-3" />}
                                {!isOverdue && !isToday && <Calendar className="w-3 h-3" />}
                                <span>{notif.title}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                موديل {notif.model_code}
                              </span>
                            </div>

                            <p className="font-bold text-slate-800 text-[11px] leading-relaxed">
                              {notif.message}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                              <span>الموقع: {notif.source_name}</span>
                              <span className="font-mono font-bold">تاريخ الاستلام: {notif.expected_date}</span>
                            </div>

                            {isOverdue && (
                              <p className="text-[10px] text-rose-700 font-extrabold bg-rose-100/80 px-2 py-0.5 rounded-lg mt-0.5">
                                ⚠️ تنبيه متأخر: يظل هذا التنبيه نشطاً حتى تسجيل الاستلام بالفرز والكنترول.
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-500" />
                        <p className="font-bold text-xs text-slate-700">لا توجد تنبيهات متأخرة أو عاجلة حالياً</p>
                        <p className="text-[10px] text-slate-400">جميع تسليمات المطابع وورش المكن منتظمة</p>
                      </div>
                    )}
                  </div>

                  <div className="px-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setCurrentTab('production_control');
                        setNotificationsOpen(false);
                      }}
                      className="text-[11px] font-bold text-indigo-700 hover:underline"
                    >
                      فتح شاشة متابعة وتشغيل الإنتاج &larr;
                    </button>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Quick Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition text-xs text-slate-800 font-semibold cursor-pointer"
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

      {/* Internal Direct Messaging Modal */}
      <InternalMessagingModal
        isOpen={messagesModalOpen}
        onClose={() => setMessagesModalOpen(false)}
      />
    </nav>
  );
};
