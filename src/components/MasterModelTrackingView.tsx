import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  GitCommit, 
  Search, 
  Printer, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Scissors, 
  Printer as PrintIcon, 
  X, 
  Calendar, 
  User, 
  ArrowRight,
  Sparkles,
  Shirt,
  Eye
} from 'lucide-react';
import { Model, ModelTimelineEvent } from '../types';

export const MasterModelTrackingView: React.FC = () => {
  const { models } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [activeModelForTimeline, setActiveModelForTimeline] = useState<Model | null>(null);
  const [showMasterPrintModal, setShowMasterPrintModal] = useState(false);

  const activeModels = models.filter((m) => !m.is_deleted);

  const filteredModels = activeModels.filter((model) => {
    const printHouse = model.print_house || model.print_house_name || '';
    const matchesSearch =
      model.model_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (model.model_type && model.model_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (model.cutter_name && model.cutter_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      printHouse.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedStatusFilter === 'all') return true;
    if (selectedStatusFilter === 'design') {
      return model.status === 'مرحلة التصميم' || model.status === 'تصميم';
    }
    if (selectedStatusFilter === 'cutting') {
      return model.status === 'جاري القص' || model.status === 'في القص';
    }
    if (selectedStatusFilter === 'printing') {
      return model.status === 'جاهز للمطبعة' || model.status === 'في المطبعة' || model.status === 'مرسل للمطبعة';
    }
    if (selectedStatusFilter === 'qc') {
      return (
        model.status === 'فرز وكنترول' ||
        model.status === 'فرز قبل الطباعة' ||
        model.status === 'العد قبل الطباعة' ||
        model.status === 'العد بعد الطباعة' ||
        model.status === 'العد بعد المكن'
      );
    }
    if (selectedStatusFilter === 'sewing') {
      return model.status === 'في قسم المكن';
    }
    if (selectedStatusFilter === 'completed') {
      return model.status === 'مكتمل الإنتاج' || model.status === 'مخزن الإنتاج التام';
    }
    return true;
  });

  const countDesign = activeModels.filter((m) => m.status === 'مرحلة التصميم' || m.status === 'تصميم').length;
  const countCutting = activeModels.filter((m) => m.status === 'جاري القص' || m.status === 'في القص').length;
  const countPrinting = activeModels.filter((m) => m.status === 'جاهز للمطبعة' || m.status === 'في المطبعة' || m.status === 'مرسل للمطبعة').length;
  const countSewing = activeModels.filter((m) => m.status === 'في قسم المكن').length;
  const countCompleted = activeModels.filter((m) => m.status === 'مكتمل الإنتاج' || m.status === 'مخزن الإنتاج التام').length;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'مرحلة التصميم':
      case 'تصميم':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'في القص':
      case 'جاري القص':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'فرز وكنترول':
      case 'فرز قبل الطباعة':
      case 'العد قبل الطباعة':
      case 'العد بعد الطباعة':
      case 'العد بعد المكن':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'في المطبعة':
      case 'جاهز للمطبعة':
      case 'مرسل للمطبعة':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'في قسم المكن':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'مكتمل الإنتاج':
      case 'مخزن الإنتاج التام':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <GitCommit className="w-8 h-8 text-blue-600" />
            <span>حركة وتفاصيل الموديلات (سجل التتبع الشامل)</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            متابعة شاملة لجميع موديلات المصنع وسجل انتقالها عبر الأقسام بالتاريخ والوقت والأعداد.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMasterPrintModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all hover:scale-102"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة كشف جرد الموديلات الشامل</span>
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500">إجمالي الموديلات</p>
          <h4 className="text-2xl font-black text-slate-900 mt-0.5">{activeModels.length}</h4>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-amber-700">مرحلة التصميم</p>
          <h4 className="text-2xl font-black text-amber-800 mt-0.5">{countDesign}</h4>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-blue-700">جاري القص</p>
          <h4 className="text-2xl font-black text-blue-800 mt-0.5">{countCutting}</h4>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-indigo-700">المطابع والتطريز</p>
          <h4 className="text-2xl font-black text-indigo-800 mt-0.5">{countPrinting}</h4>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700">قسم المكن</p>
          <h4 className="text-2xl font-black text-emerald-800 mt-0.5">{countSewing}</h4>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-teal-700">مكتمل الإنتاج</p>
          <h4 className="text-2xl font-black text-teal-800 mt-0.5">{countCompleted}</h4>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'design', label: 'التصميم' },
            { id: 'cutting', label: 'القص' },
            { id: 'printing', label: 'المطابع' },
            { id: 'qc', label: 'الفرز' },
            { id: 'sewing', label: 'المكن' },
            { id: 'completed', label: 'المكتمل' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedStatusFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedStatusFilter === pill.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الموديل، المقصدار، المطبعة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Models Table View */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3.5 px-4">الموديل والصورة</th>
                <th className="py-3.5 px-3">النوع</th>
                <th className="py-3.5 px-3">المرحلة الحالية</th>
                <th className="py-3.5 px-3 text-center">المستهدف للقص</th>
                <th className="py-3.5 px-3 text-center">المقصوص فعلياً</th>
                <th className="py-3.5 px-3 text-center">بعد الطباعة</th>
                <th className="py-3.5 px-3 text-center">بعد المكن</th>
                <th className="py-3.5 px-3">المقصدار / المطبعة</th>
                <th className="py-3.5 px-4 text-center">سجل الحركة والتايم لاين</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredModels.length > 0 ? (
                filteredModels.map((model) => {
                  const cutPieces = model.total_cut_pieces || model.actual_cut_count || 0;
                  const printHouse = model.print_house || model.print_house_name || '';

                  return (
                    <tr key={model.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/80">
                            {model.image ? (
                              <img
                                src={model.image}
                                alt={model.model_code}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Shirt className="w-5 h-5 opacity-40" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block text-sm">
                              {model.model_code}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {model.created_at ? new Date(model.created_at).toLocaleDateString('ar-EG') : '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {model.model_type || '-'}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block ${getStatusBadgeColor(model.status)}`}>
                          {model.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {(model.target_cut_quantity || 0).toLocaleString('ar-EG')}
                      </td>

                      <td className="py-3 px-3 text-center font-extrabold text-blue-700">
                        {cutPieces > 0 ? cutPieces.toLocaleString('ar-EG') : '-'}
                      </td>

                      <td className="py-3 px-3 text-center font-extrabold text-indigo-700">
                        {model.count_after_print ? model.count_after_print.toLocaleString('ar-EG') : '-'}
                      </td>

                      <td className="py-3 px-3 text-center font-extrabold text-emerald-700">
                        {model.count_after_sewing ? model.count_after_sewing.toLocaleString('ar-EG') : '-'}
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-medium">
                        <div>{model.cutter_name ? `✂️ ${model.cutter_name}` : ''}</div>
                        <div>{printHouse ? `🎨 ${printHouse}` : ''}</div>
                        {!model.cutter_name && !printHouse && <span className="text-slate-400">-</span>}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setActiveModelForTimeline(model)}
                          className="px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200/80 transition flex items-center justify-center gap-1.5 mx-auto"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>سجل الحركة ({model.timeline?.length || 1})</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-slate-600 text-sm">لا توجد موديلات مطابقة للبحث أو التصفية</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TIMELINE DRAWER / MODAL */}
      {activeModelForTimeline && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <GitCommit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    السجل الزمني لموديل: {activeModelForTimeline.model_code}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeColor(activeModelForTimeline.status)}`}>
                      {activeModelForTimeline.status}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      النوع: {activeModelForTimeline.model_type || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveModelForTimeline(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 mt-4 text-xs">
              <div>
                <span className="text-slate-500 block">المستهدف للقص:</span>
                <strong className="text-slate-900 text-sm font-black">
                  {(activeModelForTimeline.target_cut_quantity || 0).toLocaleString('ar-EG')} ق
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">المقصوص فعلياً:</span>
                <strong className="text-blue-700 text-sm font-black">
                  {(activeModelForTimeline.total_cut_pieces || activeModelForTimeline.actual_cut_count || 0).toLocaleString('ar-EG')} ق
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">المقصدار:</span>
                <strong className="text-slate-800 text-xs font-bold">
                  {activeModelForTimeline.cutter_name || 'غير محدد'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">المطبعة:</span>
                <strong className="text-slate-800 text-xs font-bold">
                  {activeModelForTimeline.print_house || activeModelForTimeline.print_house_name || 'غير محدد'}
                </strong>
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="overflow-y-auto flex-grow py-4 px-2 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>محطات انتقال الموديل عبر خط الإنتاج:</span>
              </h4>

              <div className="relative border-s-2 border-blue-200 ms-4 space-y-6">
                {(activeModelForTimeline.timeline && activeModelForTimeline.timeline.length > 0) ? (
                  activeModelForTimeline.timeline.map((event: ModelTimelineEvent, idx: number) => {
                    const eventText = event.notes || event.description || event.title;
                    const eventUser = event.user || event.user_name;

                    return (
                      <div key={idx} className="relative ps-6 group">
                        {/* Node Bullet */}
                        <div className="absolute -start-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white border-2 border-blue-200" />
                        
                        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <span className="font-black text-slate-900 text-xs">
                              {event.stage || event.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(event.timestamp).toLocaleString('ar-EG')}
                            </span>
                          </div>

                          {eventText && (
                            <p className="text-xs text-slate-600 font-medium mt-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                              {eventText}
                            </p>
                          )}

                          {eventUser && (
                            <div className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>المسؤول: {eventUser}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="relative ps-6">
                    <div className="absolute -start-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white" />
                    <div className="bg-white rounded-2xl p-3 border border-slate-200/80 text-xs text-slate-600 font-semibold">
                      تم إنشاء الموديل وإدخاله إلى النظام.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModelForTimeline(null)}
                className="px-6 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER PRINT INVENTORY MODAL */}
      {showMasterPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    كشف جرد الموديلات الشامل
                  </h3>
                  <p className="text-xs text-slate-500">
                    كشف تفصيلي بجميع الموديلات ومواقعها الحالية في خط الإنتاج
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية</span>
                </button>
                <button
                  onClick={() => setShowMasterPrintModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="overflow-y-auto flex-grow p-4 print:p-0">
              <div className="text-center mb-6 border-b border-slate-300 pb-4">
                <h1 className="text-xl font-black text-slate-900">مصنع الملابس الجاهزة - نظام إدارة الإنتاج</h1>
                <h2 className="text-base font-bold text-blue-800 mt-1">كشف جرد وتتبع حركة الموديلات الشامل</h2>
                <div className="text-xs text-slate-500 mt-1 flex justify-center gap-6">
                  <span>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</span>
                  <span>إجمالي الموديلات: {filteredModels.length}</span>
                </div>
              </div>

              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">كود الموديل</th>
                    <th className="py-2.5 px-3">النوع</th>
                    <th className="py-2.5 px-3">الموقع / الحالة الحالية</th>
                    <th className="py-2.5 px-3 text-center">المستهدف للقص</th>
                    <th className="py-2.5 px-3 text-center">المقصوص فعلياً</th>
                    <th className="py-2.5 px-3 text-center">بعد الطباعة</th>
                    <th className="py-2.5 px-3 text-center">بعد المكن</th>
                    <th className="py-2.5 px-3">المسؤول / الجهة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredModels.map((m, idx) => {
                    const cutCount = m.total_cut_pieces || m.actual_cut_count || 0;
                    const printHouse = m.print_house || m.print_house_name || '';

                    return (
                      <tr key={m.id}>
                        <td className="py-2 px-3 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-black text-slate-900">{m.model_code}</td>
                        <td className="py-2 px-3 text-slate-700">{m.model_type || '-'}</td>
                        <td className="py-2 px-3 font-bold text-blue-800">{m.status}</td>
                        <td className="py-2 px-3 text-center text-slate-600">{(m.target_cut_quantity || 0).toLocaleString('ar-EG')}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-900">{cutCount.toLocaleString('ar-EG')}</td>
                        <td className="py-2 px-3 text-center text-slate-700">{m.count_after_print ? m.count_after_print.toLocaleString('ar-EG') : '-'}</td>
                        <td className="py-2 px-3 text-center text-slate-700">{m.count_after_sewing ? m.count_after_sewing.toLocaleString('ar-EG') : '-'}</td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          {m.cutter_name ? `مقصدار: ${m.cutter_name} ` : ''}
                          {printHouse ? `مطبعة: ${printHouse}` : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-8 pt-6 border-t border-slate-300 flex justify-between items-center text-xs text-slate-600 font-bold px-4">
                <div>مسؤول المتابعة والمراقبة: .......................................</div>
                <div>مدير العمليات والتشغيل: .......................................</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowMasterPrintModal(false)}
                className="px-6 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
