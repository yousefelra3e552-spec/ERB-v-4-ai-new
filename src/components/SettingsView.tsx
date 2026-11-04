import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Ruler,
  Building2,
  Users,
  ShieldCheck,
  Shield,
  Eye,
  Edit3,
  Lock,
  Plus,
  Trash2,
  Check,
  ShieldAlert,
  Sliders,
  History
} from 'lucide-react';
import { User } from '../types';
import { EditUserModal } from './EditUserModal';
import { RoleManagementSection } from './RoleManagementSection';

interface SettingsViewProps {
  onOpenLogs: () => void;
}

type SettingsTab = 'users' | 'roles' | 'sizes_suppliers' | 'logs';

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenLogs }) => {
  const {
    currentUser,
    roles,
    sizeDefs,
    suppliers,
    users,
    addSizeDef,
    addSupplier,
    addUser,
    deleteUser,
    toggleUserActive,
    updateUserPermissionsAndPassword
  } = useApp();

  const isSudo = currentUser?.username === 'sudo' || currentUser?.is_sudo;
  const isSuperUser = isSudo || currentUser?.role === 'owner' || currentUser?.role === 'مدير عام المصنع';

  const [activeTab, setActiveTab] = useState<SettingsTab>('users');

  // Size Form State
  const [sizeName, setSizeName] = useState('');
  const [sizeValues, setSizeValues] = useState('');

  // Supplier Form State
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');

  // User Form State
  const [realName, setRealName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');

  // User modal edit state
  const [selectedUserForModal, setSelectedUserForModal] = useState<User | null>(null);

  const handleAddSize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sizeName.trim() || !sizeValues.trim()) return;
    addSizeDef(sizeName.trim(), sizeValues.trim());
    setSizeName('');
    setSizeValues('');
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    addSupplier(supName.trim(), supPhone.trim());
    setSupName('');
    setSupPhone('');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!realName.trim() || !username.trim() || !password) return;

    const matchedRole = roles.find((r) => r.id === selectedRoleId);

    addUser({
      real_name: realName.trim(),
      username: username.trim(),
      password,
      role: matchedRole ? matchedRole.name : 'موظف تشغيل',
      role_id: selectedRoleId || undefined,
      is_active: true,
      permissions: {
        warehouse: matchedRole?.permissions.fabric_warehouse_edit ? 'edit' : matchedRole?.permissions.fabric_warehouse_view ? 'view' : undefined,
        design: matchedRole?.permissions.design_edit ? 'edit' : matchedRole?.permissions.design_view ? 'view' : undefined,
        cutting: matchedRole?.permissions.cutting_edit ? 'edit' : matchedRole?.permissions.cutting_view ? 'view' : undefined,
        qc: matchedRole?.permissions.qc_edit ? 'edit' : matchedRole?.permissions.qc_view ? 'view' : undefined
      }
    });

    setRealName('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>⚙️ إعدادات النظام والصلاحيات</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            إدارة الحسابات، الصلاحيات الديناميكية، فئات المقاسات، والموردين
          </p>
        </div>

        {/* Top Settings Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 flex-wrap">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>إدارة الموظفين</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 text-[10px] rounded-full">
              {users.length}
            </span>
          </button>

          {/* Sudo Only Tab: إدارة الصلاحيات */}
          {isSudo && (
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'roles'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 font-bold'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>إدارة الصلاحيات</span>
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full">
                Sudo
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('sizes_suppliers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sizes_suppliers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>المقاسات والموردين</span>
          </button>

          <button
            onClick={onOpenLogs}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition"
          >
            <History className="w-3.5 h-3.5" />
            <span>سجل التدقيق</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Roles Management (Strictly visible to Sudo) */}
      {activeTab === 'roles' && isSudo && (
        <RoleManagementSection />
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>إدارة حسابات الموظفين والصلاحيات</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                إنشاء وتعديل حسابات العاملين وتعيين الأدوار والصلاحيات المخصصة
              </p>
            </div>

            {isSudo && (
              <button
                onClick={() => setActiveTab('roles')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border border-indigo-200 transition"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>إدارة الصلاحيات الديناميكية →</span>
              </button>
            )}
          </div>

          {/* Add User Form (For Superuser / Sudo) */}
          {isSuperUser && (
            <form
              onSubmit={handleAddUser}
              className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4"
            >
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>إضافة مستخدم جديد</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم الموظف</label>
                  <input
                    type="text"
                    required
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="مثال: يوسف حسام"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم المستخدم</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    الدور والصلاحية المخصصة
                  </label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
                >
                  إنشاء حساب الموظف
                </button>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-center">
                <tr>
                  <th className="px-4 py-3 text-start">الاسم</th>
                  <th className="px-4 py-3">اسم المستخدم</th>
                  <th className="px-4 py-3">الدور / الصلاحية</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center">
                {users.map((u) => {
                  const isUserSudo = u.username === 'sudo' || u.is_sudo;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3.5 font-bold text-slate-900 text-start flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                          {u.real_name ? u.real_name[0] : 'U'}
                        </div>
                        <div>
                          <span>{u.real_name}</span>
                          {isUserSudo && (
                            <span className="ms-2 px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                              الإدارة العليا (Sudo)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 font-mono">@{u.username}</td>

                      <td className="px-4 py-3.5">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200">
                          {isUserSudo ? 'مدير عام كامل' : u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {u.is_active ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            نشط
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                            موقوف
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {isUserSudo ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>حساب محمي نهائياً</span>
                          </span>
                        ) : isSuperUser ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => toggleUserActive(u.id)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition border ${
                                u.is_active
                                  ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {u.is_active ? 'إيقاف' : 'تفعيل'}
                            </button>

                            <button
                              onClick={() => setSelectedUserForModal(u)}
                              className="px-3.5 py-1 rounded-full border border-blue-200 bg-blue-50/70 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs transition flex items-center gap-1"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>تعديل الصلاحيات</span>
                            </button>

                            <button
                              onClick={() => deleteUser(u.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="حذف حساب الموظف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Sizes & Suppliers */}
      {activeTab === 'sizes_suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Size Categories Definition */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-blue-600 mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                <span>📏 تعريف فئات المقاسات</span>
              </h3>

              {isSuperUser && (
                <form
                  onSubmit={handleAddSize}
                  className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200/60"
                >
                  <div>
                    <input
                      type="text"
                      required
                      value={sizeName}
                      onChange={(e) => setSizeName(e.target.value)}
                      placeholder="اسم الفئة (مثال: بيبي، وسط، شبابي، رجالي)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      value={sizeValues}
                      onChange={(e) => setSizeValues(e.target.value)}
                      placeholder="المقاسات (مثال: 2, 3, 4, 5 أو S, M, L, XL)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs"
                  >
                    إضافة الفئة
                  </button>
                </form>
              )}

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-center">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 text-start">الفئة</th>
                      <th className="px-4 py-2.5">المقاسات الداخلية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sizeDefs.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-extrabold text-slate-900 text-start">{s.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {s.values.split(',').map((val, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]"
                              >
                                {val.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2. Suppliers Management */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-emerald-600 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span>🏢 الموردين وشركات الغزل والإكسسوار</span>
              </h3>

              {isSuperUser && (
                <form
                  onSubmit={handleAddSupplier}
                  className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200/60"
                >
                  <div>
                    <input
                      type="text"
                      required
                      value={supName}
                      onChange={(e) => setSupName(e.target.value)}
                      placeholder="اسم المورد أو شركة الغزل أو مستودع الإكسسوار"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={supPhone}
                      onChange={(e) => setSupPhone(e.target.value)}
                      placeholder="رقم الهاتف للتواصل أو الواتساب"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs"
                  >
                    إضافة المورد
                  </button>
                </form>
              )}

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">اسم المورد</th>
                      <th className="px-4 py-2.5">رقم الهاتف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-extrabold text-slate-900">{sup.name}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono">{sup.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Edit User Permissions & Password Modal */}
      {selectedUserForModal && (
        <EditUserModal
          user={selectedUserForModal}
          onClose={() => setSelectedUserForModal(null)}
          onSave={(userId, permissions, newPassword, newRole, roleId) => {
            updateUserPermissionsAndPassword(userId, permissions, newPassword, newRole, roleId);
            setSelectedUserForModal(null);
          }}
        />
      )}
    </div>
  );
};
