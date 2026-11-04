import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CustomRole, RolePermissions, SystemSectionKey } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Boxes,
  Palette,
  Scissors,
  Search,
  FileSpreadsheet,
  Printer,
  Shirt,
  Compass,
  Coins,
  MessageCircle,
  Eye,
  Edit3
} from 'lucide-react';

export const SYSTEM_SECTIONS: {
  key: SystemSectionKey;
  label: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
}[] = [
  {
    key: 'fabric_warehouse',
    label: 'مخزن قماش',
    description: 'عرض أصناف وألوان الأقمشة وحركات الإضافة والصرف وتنبيهات النواقص',
    icon: Layers,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  {
    key: 'accessories_warehouse',
    label: 'مخزن إكسسوارات',
    description: 'أصناف وموديلات الإكسسوارات (بادج، لعبة، ورد، دانتيل) والحد الأدنى للطلب',
    icon: Sparkles,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200'
  },
  {
    key: 'production_warehouse',
    label: 'مخزن إنتاج',
    description: 'مخزن الإنتاج التام والموديلات الجاهزة للتسليم والتوزيع',
    icon: Boxes,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200'
  },
  {
    key: 'design',
    label: 'قسم التصميم',
    description: 'إضافة الموديلات الجديدة وتلوينها وسحب الخامات والإكسسوارات والماركر',
    icon: Palette,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200'
  },
  {
    key: 'cutting',
    label: 'قسم القص',
    description: 'استلام أوامر القص وتسجيل الراقات والفرش والأوزان ونقلها للجودة',
    icon: Scissors,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 border-rose-200'
  },
  {
    key: 'qc',
    label: 'الفرز والكنترول',
    description: 'العد والفرز في مراحله الـ 3 (قبل الطباعة، بعد الطباعة، بعد المكن)',
    icon: Search,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200'
  },
  {
    key: 'printing',
    label: 'المطابع والتطريز',
    description: 'إرسال واستلام شحنات المطابع الخارجية وتتبع حالات التشغيل',
    icon: Printer,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-200'
  },
  {
    key: 'sewing',
    label: 'قسم المكن',
    description: 'تشغيل الموديلات بعد عد الطباعة وطباعة بطاقات التشغيل المزدوجة',
    icon: Shirt,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200'
  },
  {
    key: 'models_tracking',
    label: 'حركة الموديلات',
    description: 'شاشة مركزية شاملة لكافة الموديلات والبحث وتتبع خط الإنتاج الزمني',
    icon: Compass,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 border-cyan-200'
  },
  {
    key: 'reports',
    label: 'طباعة التقارير',
    description: 'تصدير كشوفات الإكسل وسجلات التدقيق والجرد الإجمالي',
    icon: FileSpreadsheet,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 border-slate-200'
  }
];

const DEFAULT_PERMISSIONS: RolePermissions = {
  fabric_warehouse_view: false,
  fabric_warehouse_edit: false,
  accessories_warehouse_view: false,
  accessories_warehouse_edit: false,
  production_warehouse_view: false,
  production_warehouse_edit: false,
  design_view: false,
  design_edit: false,
  cutting_view: false,
  cutting_edit: false,
  qc_view: false,
  qc_edit: false,
  printing_view: false,
  printing_edit: false,
  sewing_view: false,
  sewing_edit: false,
  models_tracking_view: false,
  models_tracking_edit: false,
  reports_view: false,
  reports_edit: false,

  // Financial & Sensitive Checkboxes
  view_fabric_prices: false,
  edit_fabric_prices: false,
  view_accessory_prices: false,
  edit_accessory_prices: false,
  view_printing_costs: false,
  edit_printing_costs: false,
  send_whatsapp_requests: false
};

export const RoleManagementSection: React.FC = () => {
  const { roles, users, addRole, updateRole, deleteRole, currentUser } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);

  // Form states
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [permissions, setPermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS);

  // Only Sudo can access this
  if (currentUser?.username !== 'sudo' && !currentUser?.is_sudo) {
    return (
      <div className="p-8 text-center bg-rose-50 rounded-3xl border border-rose-200">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-rose-900">منطقة محظورة</h3>
        <p className="text-sm text-rose-700 mt-1">
          قسم "إدارة الصلاحيات" مخصص حصرياً لحساب الإدارة العليا (Sudo).
        </p>
      </div>
    );
  }

  const openAddModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setPermissions({ ...DEFAULT_PERMISSIONS });
    setModalOpen(true);
  };

  const openEditModal = (role: CustomRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setPermissions({
      ...DEFAULT_PERMISSIONS,
      ...role.permissions
    });
    setModalOpen(true);
  };

  const handleToggle = (section: SystemSectionKey, type: 'view' | 'edit') => {
    const viewKey = `${section}_view` as keyof RolePermissions;
    const editKey = `${section}_edit` as keyof RolePermissions;

    setPermissions((prev) => {
      const next = { ...prev };
      if (type === 'view') {
        const newVal = !next[viewKey];
        (next as any)[viewKey] = newVal;
        if (!newVal) {
          (next as any)[editKey] = false;
        }
      } else {
        const newVal = !next[editKey];
        (next as any)[editKey] = newVal;
        if (newVal) {
          (next as any)[viewKey] = true;
        }
      }
      return next;
    });
  };

  const handleToggleFinancial = (key: keyof RolePermissions) => {
    setPermissions((prev) => {
      const next = { ...prev };
      const currentVal = Boolean(next[key]);
      (next as any)[key] = !currentVal;

      // Auto enable view when edit is enabled
      if (!currentVal && key === 'edit_fabric_prices') next.view_fabric_prices = true;
      if (!currentVal && key === 'edit_accessory_prices') next.view_accessory_prices = true;
      if (!currentVal && key === 'edit_printing_costs') next.view_printing_costs = true;

      // Auto disable edit when view is disabled
      if (currentVal && key === 'view_fabric_prices') next.edit_fabric_prices = false;
      if (currentVal && key === 'view_accessory_prices') next.edit_accessory_prices = false;
      if (currentVal && key === 'view_printing_costs') next.edit_printing_costs = false;

      return next;
    });
  };

  const applyPreset = (preset: 'all_full' | 'all_view' | 'warehouse_only' | 'production_only') => {
    setPermissions((prev) => {
      const next = { ...prev };
      if (preset === 'all_full') {
        SYSTEM_SECTIONS.forEach((s) => {
          (next as any)[`${s.key}_view`] = true;
          (next as any)[`${s.key}_edit`] = true;
        });
        next.view_fabric_prices = true;
        next.edit_fabric_prices = true;
        next.view_accessory_prices = true;
        next.edit_accessory_prices = true;
        next.view_printing_costs = true;
        next.edit_printing_costs = true;
        next.send_whatsapp_requests = true;
      } else if (preset === 'all_view') {
        SYSTEM_SECTIONS.forEach((s) => {
          (next as any)[`${s.key}_view`] = true;
          (next as any)[`${s.key}_edit`] = false;
        });
        next.view_fabric_prices = false;
        next.edit_fabric_prices = false;
        next.view_accessory_prices = false;
        next.edit_accessory_prices = false;
        next.view_printing_costs = false;
        next.edit_printing_costs = false;
        next.send_whatsapp_requests = false;
      } else if (preset === 'warehouse_only') {
        SYSTEM_SECTIONS.forEach((s) => {
          const isWh = s.key.includes('warehouse');
          (next as any)[`${s.key}_view`] = isWh;
          (next as any)[`${s.key}_edit`] = isWh;
        });
        next.send_whatsapp_requests = true;
      } else if (preset === 'production_only') {
        SYSTEM_SECTIONS.forEach((s) => {
          const isProd = ['design', 'cutting', 'qc', 'printing', 'sewing', 'models_tracking', 'reports'].includes(s.key);
          (next as any)[`${s.key}_view`] = isProd;
          (next as any)[`${s.key}_edit`] = isProd;
        });
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    if (editingRole) {
      updateRole(editingRole.id, {
        name: roleName.trim(),
        description: roleDescription.trim(),
        permissions
      });
    } else {
      addRole({
        name: roleName.trim(),
        description: roleDescription.trim(),
        permissions
      });
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              إدارة الصلاحيات والأدوار الديناميكية (Dynamic Roles)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            نظام صلاحيات مرن بالكامل عبر حساب Sudo: تحديد صلاحيات الأقسام بدقة، والتحكم في إظهار الأسعار والتكاليف وأزرار الواتساب.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة دور وظيفي جديد</span>
        </button>
      </div>

      {/* Roles Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((role) => {
          const userCount = users.filter((u) => u.role_id === role.id || u.role === role.name).length;
          const allowedSectionsCount = SYSTEM_SECTIONS.filter(
            (s) => role.permissions[`${s.key}_view` as keyof RolePermissions]
          ).length;

          const hasFinancial =
            role.permissions.view_fabric_prices ||
            role.permissions.view_accessory_prices ||
            role.permissions.view_printing_costs;

          return (
            <div
              key={role.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {role.name[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 leading-tight">
                        {role.name}
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {userCount} موظف مرتبط
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                    <button
                      onClick={() => openEditModal(role)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="تعديل الصلاحيات"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف الدور الوظيفي "${role.name}"؟`)) {
                          deleteRole(role.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="حذف الدور"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-4">
                  {role.description || 'لا يوجد وصف محدد لهذا الدور'}
                </p>

                {/* Badges for active sections */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>الأقسام المصرح بها:</span>
                    <span className="text-blue-600">
                      {allowedSectionsCount} من {SYSTEM_SECTIONS.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                    {SYSTEM_SECTIONS.map((sec) => {
                      const canView = role.permissions[`${sec.key}_view` as keyof RolePermissions];
                      const canEdit = role.permissions[`${sec.key}_edit` as keyof RolePermissions];
                      if (!canView) return null;

                      return (
                        <span
                          key={sec.key}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            canEdit
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {sec.label} {canEdit ? '✍️' : '👁️'}
                        </span>
                      );
                    })}
                  </div>

                  {/* Financial & WhatsApp Indicator Flags */}
                  <div className="pt-2 flex flex-wrap gap-1 text-[10px] font-semibold">
                    {hasFinancial && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Coins className="w-3 h-3 text-amber-600" />
                        صلاحيات مالية
                      </span>
                    )}
                    {role.permissions.send_whatsapp_requests && (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        طلبات واتساب
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Role Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {editingRole ? `تعديل صلاحيات دور: ${editingRole.name}` : 'إنشاء دور وظيفي ديناميكي جديد'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    حدد الصلاحيات الإدارية والمالية بدقة لهذا الدور الوظيفي.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم الدور الوظيفي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="مثال: مسؤول المخازن والمشتريات"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    وصف مختصر للدور والمهام
                  </label>
                  <input
                    type="text"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="مثال: إدارة المخزون وطلب النواقص ومتابعة الجرد"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-600">تطبيق نمط صلاحيات سريع:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('all_full')}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 shadow-2xs"
                  >
                    تحديد الكل (كامل + مالي)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('warehouse_only')}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    مخازن فقط
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('production_only')}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    خطوط إنتاج وتشغيل
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('all_view')}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    مشاهدة فقط (بدون تعديل)
                  </button>
                </div>
              </div>

              {/* SECTION 1: System Modules (View / Edit Grid) */}
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  <span>صلاحيات الأقسام الرئيسية ({SYSTEM_SECTIONS.length} أقسام):</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SYSTEM_SECTIONS.map((sec) => {
                    const viewKey = `${sec.key}_view` as keyof RolePermissions;
                    const editKey = `${sec.key}_edit` as keyof RolePermissions;
                    const canView = Boolean(permissions[viewKey]);
                    const canEdit = Boolean(permissions[editKey]);
                    const Icon = sec.icon;

                    return (
                      <div
                        key={sec.key}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          canView ? 'bg-white border-slate-300 shadow-2xs' : 'bg-slate-50/70 border-slate-200 opacity-70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl ${sec.bgColor} ${sec.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                                {sec.label}
                              </span>
                              <span className="text-[10px] text-slate-500 line-clamp-1">
                                {sec.description}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Toggles */}
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                          {/* View Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggle(sec.key, 'view')}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold transition border ${
                              canView
                                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>رؤية ومشاهدة</span>
                          </button>

                          {/* Edit Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggle(sec.key, 'edit')}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold transition border ${
                              canEdit
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل وحفظ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Fine-grained Financial & WhatsApp Permissions (CRITICAL USER REQUIREMENT) */}
              <div className="bg-amber-50/60 rounded-3xl p-5 border border-amber-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-amber-950">
                        الصلاحيات المالية والتواصل الحساس (Financial & WhatsApp)
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        من يمتلك هذه الخيارات فقط هو من تظهر له خانات الأسعار والتكلفة وأزرار طلبات الواتساب في النظام.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Fabric Prices */}
                  <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 cursor-pointer transition shadow-2xs">
                    <input
                      type="checkbox"
                      checked={permissions.view_fabric_prices}
                      onChange={() => handleToggleFinancial('view_fabric_prices')}
                      className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
                    />
                    <div className="text-start">
                      <span className="font-bold text-xs text-slate-900 block">رؤية أسعار القماش</span>
                      <span className="text-[10px] text-slate-500">إظهار أسعار الكيلو/التوب في مخزن الأقمشة</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 cursor-pointer transition shadow-2xs">
                    <input
                      type="checkbox"
                      checked={permissions.edit_fabric_prices}
                      onChange={() => handleToggleFinancial('edit_fabric_prices')}
                      className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
                    />
                    <div className="text-start">
                      <span className="font-bold text-xs text-slate-900 block">تعديل أسعار القماش</span>
                      <span className="text-[10px] text-slate-500">السماح بتحديث سعر الوحدة لألوان الأقمشة</span>
                    </div>
                  </label>

                  {/* Accessory Prices */}
                  <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 cursor-pointer transition shadow-2xs">
                    <input
                      type="checkbox"
                      checked={permissions.view_accessory_prices}
                      onChange={() => handleToggleFinancial('view_accessory_prices')}
                      className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
                    />
                    <div className="text-start">
                      <span className="font-bold text-xs text-slate-900 block">رؤية أسعار الإكسسوارات</span>
                      <span className="text-[10px] text-slate-500">إظهار سعر القطعة في مخزن الإكسسوارات والمستلزمات</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 cursor-pointer transition shadow-2xs">
                    <input
                      type="checkbox"
                      checked={permissions.edit_accessory_prices}
                      onChange={() => handleToggleFinancial('edit_accessory_prices')}
                      className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
                    />
                    <div className="text-start">
                      <span className="font-bold text-xs text-slate-900 block">تعديل أسعار الإكسسوارات</span>
                      <span className="text-[10px] text-slate-500">السماح بتحديث وتعديل أسعار أصناف الإكسسوارات</span>
                    </div>
                  </label>

                  {/* Printing Costs */}
                  <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 cursor-pointer transition shadow-2xs">
                    <input
                      type="checkbox"
                      checked={permissions.view_printing_costs}
                      onChange={() => handleToggleFinancial('view_printing_costs')}
                      className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
                    />
                    <div className="text-start">
                      <span className="font-bold text-xs text-slate-900 block">رؤية تكاليف المطابع</span>
                      <span className="text-[10px] text-slate-500">إظهار تكلفة تشغيل وطباعة القطعة والإجمالي</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 cursor-pointer transition shadow-2xs">
                    <input
                      type="checkbox"
                      checked={permissions.edit_printing_costs}
                      onChange={() => handleToggleFinancial('edit_printing_costs')}
                      className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
                    />
                    <div className="text-start">
                      <span className="font-bold text-xs text-slate-900 block">تعديل تكاليف المطابع</span>
                      <span className="text-[10px] text-slate-500">السماح بتسجيل وتعديل تكلفة التشغيل للمطابع</span>
                    </div>
                  </label>

                  {/* WhatsApp Orders Permission */}
                  <label className="sm:col-span-2 flex items-center gap-3 p-3 bg-emerald-50/80 rounded-2xl border border-emerald-300 hover:border-emerald-500 cursor-pointer transition shadow-2xs">
                    <input
                      type="checkbox"
                      checked={permissions.send_whatsapp_requests}
                      onChange={() => handleToggleFinancial('send_whatsapp_requests')}
                      className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                    />
                    <div className="text-start">
                      <span className="font-black text-xs text-emerald-950 block flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        إرسال طلبات النواقص عبر الواتساب (WhatsApp Direct Ordering)
                      </span>
                      <span className="text-[11px] text-emerald-800">
                        إظهار أزرار التواصل المباشر وإرسال طلبات النواقص للموردين عبر الواتساب في مخازن الأقمشة والإكسسوارات.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRole ? 'حفظ التعديلات' : 'إنشاء الدور'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
