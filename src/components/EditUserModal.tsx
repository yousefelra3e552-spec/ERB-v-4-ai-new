import React, { useState } from 'react';
import { User, UserPermissions, PermissionLevel, CustomRole } from '../types';
import { useApp } from '../context/AppContext';
import { SYSTEM_SECTIONS } from './RoleManagementSection';
import {
  X,
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Check
} from 'lucide-react';

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (
    userId: string,
    permissions: UserPermissions,
    newPassword?: string,
    newRole?: string,
    roleId?: string
  ) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const { roles } = useApp();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(user.role_id || '');
  const [roleName, setRoleName] = useState<string>(user.role);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isSudoUser = user.username === 'sudo' || user.is_sudo;

  // Selected role object
  const currentRoleObj = roles.find((r) => r.id === selectedRoleId || r.name === roleName);

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    const matched = roles.find((r) => r.id === roleId);
    if (matched) {
      setRoleName(matched.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSudoUser) {
      // Sudo user only allows updating password if desired
      onSave(user.id, user.permissions, password || undefined, 'مدير عام المصنع', user.role_id);
      onClose();
      return;
    }

    onSave(
      user.id,
      user.permissions,
      password || undefined,
      roleName,
      selectedRoleId || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {user.real_name ? user.real_name[0] : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  تعديل صلاحيات: {user.real_name || user.username}
                </h3>
                {isSudoUser && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                    حساب Sudo محمي
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                اسم المستخدم: <span className="font-mono text-slate-700">@{user.username}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Password update section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              تغيير كلمة المرور (اترك الحقل فارغاً إذا كنت لا ترغب في التغيير)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة مرور جديدة..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Dynamic Role Selection */}
          {!isSudoUser ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                اختيار الصلاحية / الدور الوظيفي الديناميكي:
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="">-- اختر دوراً من الصلاحيات المتاحة --</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.description ? `(${r.description})` : ''}
                  </option>
                ))}
              </select>

              {/* Show preview of sections granted by the selected role */}
              {currentRoleObj && (
                <div className="mt-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>صلاحيات الدور "{currentRoleObj.name}":</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {SYSTEM_SECTIONS.map((sec) => {
                      const hasView = currentRoleObj.permissions[`${sec.key}_view` as keyof typeof currentRoleObj.permissions];
                      const hasEdit = currentRoleObj.permissions[`${sec.key}_edit` as keyof typeof currentRoleObj.permissions];

                      if (!hasView && !hasEdit) return null;

                      return (
                        <div
                          key={sec.key}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white border border-blue-200 text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <sec.icon className={`w-3.5 h-3.5 ${sec.color}`} />
                            <span>{sec.label}</span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              hasEdit
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {hasEdit ? 'تعديل كامل' : 'مشاهدة فقط'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">حساب الإدارة العليا (Sudo):</p>
                <p className="mt-0.5 text-amber-800">
                  يمتلك هذا الحساب تجاوزاً تلقائياً لكافة القيود والصلاحيات في جميع أقسام المصنّع، ولا يخضع لأي قيود أدوار.
                </p>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وتطبيق</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
