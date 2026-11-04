import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Scissors, 
  Printer, 
  Search, 
  CheckCircle, 
  Shirt, 
  X, 
  Layers,
  Truck,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Model, ModelAccessory, SewingDispatch } from '../types';

export const SewingView: React.FC = () => {
  const { 
    models, 
    modelAccessories, 
    sewingDispatches, 
    dispatchModelToSewing, 
    receiveModelFromSewing,
    logAction 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModelForPrint, setSelectedModelForPrint] = useState<Model | null>(null);

  // Modal State for Dispatching to Sewing Workshop
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [piecesCount, setPiecesCount] = useState<number>(0);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Models ready for sewing: status 'في قسم المكن'
  const readyModels = models.filter(
    (m) => !m.is_deleted && m.status === 'في قسم المكن'
  );

  const filteredDispatches = sewingDispatches.filter((disp) => {
    const m = models.find((mod) => mod.id === disp.model_id);
    const code = m?.model_code || '';
    const name = disp.workshop_name || '';
    const q = searchTerm.toLowerCase();
    return code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
  });

  const activeDispatches = filteredDispatches.filter(d => d.status !== 'تم الاستلام');
  const completedDispatches = filteredDispatches.filter(d => d.status === 'تم الاستلام');

  const openDispatchModal = (model: Model) => {
    setSelectedModelId(model.id);
    const count = model.count_after_print || model.total_cut_pieces || model.actual_cut_count || 100;
    setPiecesCount(count);
    setWorkshopName(model.sewing_workshop || '');
    
    // Default expected delivery date: 5 days from today
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    setExpectedDeliveryDate(futureDate.toISOString().split('T')[0]);
    setDispatchNotes('');
    setShowDispatchModal(true);
  };

  const handleSubmitDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModelId || !workshopName.trim() || piecesCount <= 0 || !expectedDeliveryDate) {
      alert('يرجى ملء جميع الحقول المطلوبة وتحديد اسم الورشة وتاريخ الاستلام المتوقع');
      return;
    }

    dispatchModelToSewing({
      modelId: selectedModelId,
      workshopName: workshopName.trim(),
      piecesCount: piecesCount,
      expectedDeliveryDate: expectedDeliveryDate,
      notes: dispatchNotes.trim()
    });

    setShowDispatchModal(false);
    setSelectedModelId('');
    setWorkshopName('');
    setPiecesCount(0);
    setExpectedDeliveryDate('');
    setDispatchNotes('');
  };

  const handleReceive = (dispatch: SewingDispatch) => {
    const m = models.find(mod => mod.id === dispatch.model_id);
    const code = m?.model_code || 'الموديل';
    if (confirm(`هل أنت متأكد من تسجيل استلام تشغيلة موديل (${code}) من ورشة (${dispatch.workshop_name}) ونقله مباشرة إلى الفرز والكنترول (العد بعد المكن)؟`)) {
      receiveModelFromSewing(dispatch.id, dispatch.model_id);
      logAction(
        'قسم المكن',
        `استلام تشغيلة خياطة موديل ${code} من ورشة ${dispatch.workshop_name} (${dispatch.pieces_count} قطعة)`
      );
    }
  };

  const getModelAccs = (modelId: string) => {
    return modelAccessories.filter((a: ModelAccessory) => a.model_id === modelId);
  };

  // Helper to compute date diff
  const getDateStatusBadge = (expectedDateStr?: string, status?: string) => {
    if (!expectedDateStr) return null;
    if (status === 'تم الاستلام') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          تم الاستلام بالفرز
        </span>
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(expectedDateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-red-100 text-red-700 border border-red-300 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          متأخر {Math.abs(diffDays)} يوم عن الموعد!
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          موعد الاستلام اليوم
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Calendar className="w-3 h-3 text-blue-600" />
          موعد الاستلام غداً
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
        <Calendar className="w-3 h-3 text-slate-400" />
        متبقي {diffDays} أيام ({expectedDateStr})
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-emerald-800 tracking-tight flex items-center gap-2">
            <Scissors className="w-8 h-8 text-emerald-600" />
            <span>قسم المكن وخطوط الخياطة (Sewing Section)</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            إرسال الموديلات لورش الخياطة الخارجية وخطوط الإنتاج، متابعة مواعيد الاستلام المستهدفة، وطباعة أوراق التيشرت والبنطلون المنفصلة.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الموديل أو اسم ورشة المكن..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-xs"
          />
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">جاهز للإرسال للمكن</p>
            <h3 className="text-2xl font-black text-emerald-900">{readyModels.length}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">موديل بانتظار تحديد الورشة</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">تشغيلات قيد الخياطة</p>
            <h3 className="text-2xl font-black text-indigo-900">{activeDispatches.length}</h3>
            <span className="text-[11px] text-indigo-600 font-semibold mt-1 inline-block">بالورش الخارجية والخطوط</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">إجمالي القطع بالمكن</p>
            <h3 className="text-2xl font-black text-slate-900">
              {activeDispatches.reduce((acc, d) => acc + d.pieces_count, 0).toLocaleString('ar-EG')}
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">قطعة قيد الخياطة</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Shirt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">المحطة التالية بعد الاستلام</p>
            <h3 className="text-lg font-black text-purple-800">العد بعد المكن</h3>
            <span className="text-[11px] text-purple-600 font-semibold mt-1 inline-block">الفرز والكنترول QC</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SECTION 1: Ready Models to Dispatch to Sewing */}
      <div className="bg-emerald-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-900 uppercase tracking-wide">
                الموديلات الجاهزة للمكن
              </span>
              <span className="text-emerald-200 text-xs">
                (واردة من فرز ما بعد الطباعة ومعتمدة)
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              اختر الموديل لإرساله إلى ورشة المكن / الخياطة وتسجيل ميعاد الاستلام
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {readyModels.length > 0 ? (
            readyModels.map((m) => {
              const count = m.count_after_print || m.total_cut_pieces || m.actual_cut_count || 0;
              return (
                <div
                  key={m.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/20 transition group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={m.image}
                      alt={m.model_code}
                      className="w-12 h-12 rounded-xl object-cover border border-white/30 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&auto=format&fit=crop&q=60';
                      }}
                    />
                    <div className="min-w-0 flex-grow">
                      <h4 className="font-black text-sm text-white truncate">{m.model_code}</h4>
                      <p className="text-[11px] text-emerald-200">
                        العدد الجاهز:{' '}
                        <strong className="text-white font-bold">{count.toLocaleString('ar-EG')} ق</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openDispatchModal(m)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>إرسال للورشة</span>
                    </button>
                    <button
                      onClick={() => setSelectedModelForPrint(m)}
                      className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition text-xs cursor-pointer"
                      title="معاينة وطباعة أوراق التشغيل"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="col-span-full text-emerald-200 text-xs py-4 text-center">
              لا توجد موديلات بانتظار الإرسال إلى ورش المكن حالياً. جميع الموديلات إما بالورش أو بمراحل أخرى.
            </p>
          )}
        </div>
      </div>

      {/* SECTION 2: Active Sewing Dispatches Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-700" />
            <h3 className="font-extrabold text-base text-slate-900">
              سجل تشغيلات وتسليمات ورش المكن والخياطة
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            إجمالي التشغيلات المسجلة: {sewingDispatches.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">الموديل وصورته</th>
                <th className="px-6 py-3.5">اسم ورشة المكن / الخياطة</th>
                <th className="px-6 py-3.5 text-center">القطع المرسلة</th>
                <th className="px-6 py-3.5 text-center">تاريخ الإرسال</th>
                <th className="px-6 py-3.5 text-center">تاريخ الاستلام المتوقع</th>
                <th className="px-6 py-3.5 text-center">الحالة والتنبيه</th>
                <th className="px-6 py-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDispatches.length > 0 ? (
                filteredDispatches.map((disp) => {
                  const m = models.find((model) => model.id === disp.model_id);

                  return (
                    <tr key={disp.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          {m && (
                            <img
                              src={m.image}
                              alt={m.model_code}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&auto=format&fit=crop&q=60';
                              }}
                            />
                          )}
                          <div>
                            <span className="block font-black text-slate-900">{m?.model_code || 'موديل'}</span>
                            <span className="text-[11px] text-slate-500">{m?.model_type || 'تيشرت وبنطلون'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-800">
                        <span className="text-emerald-900 text-sm font-black">{disp.workshop_name}</span>
                        {disp.notes && (
                          <span className="block text-[11px] text-slate-400 mt-0.5 max-w-xs truncate">
                            {disp.notes}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center font-black text-slate-900 text-sm">
                        {disp.pieces_count.toLocaleString('ar-EG')} ق
                      </td>

                      <td className="px-6 py-4 text-center text-slate-500 font-mono">
                        {disp.dispatched_at}
                      </td>

                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-800">
                        {disp.expected_delivery_date || '-'}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {getDateStatusBadge(disp.expected_delivery_date, disp.status)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {disp.status !== 'تم الاستلام' && (
                            <button
                              onClick={() => handleReceive(disp)}
                              className="px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>استلام للفرز</span>
                            </button>
                          )}

                          {m && (
                            <button
                              onClick={() => setSelectedModelForPrint(m)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition cursor-pointer"
                              title="طباعة ورقتي التشغيل (تيشرت / بنطلون)"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    لا توجد تشغيلات مسجلة تطابق البحث حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Dispatch Model to Sewing Workshop */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    إرسال الموديل إلى ورشة مكن / خياطة
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    تسجيل خروج التشغيلة وتحديد اسم الورشة وميعاد الاستلام المستهدف
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDispatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الموديل المراد إرساله *</label>
                <select
                  required
                  value={selectedModelId}
                  onChange={(e) => {
                    setSelectedModelId(e.target.value);
                    const m = models.find(mod => mod.id === e.target.value);
                    if (m) {
                      const count = m.count_after_print || m.total_cut_pieces || m.actual_cut_count || 100;
                      setPiecesCount(count);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-hidden font-bold"
                >
                  <option value="">-- اختر الموديل --</option>
                  {readyModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      موديل {m.model_code} ({m.model_type || 'ملابس'}) - جاهز: {m.count_after_print || m.total_cut_pieces || 0} قطعة
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  اسم ورشة المكن / خط الخياطة *
                </label>
                <input
                  type="text"
                  required
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  placeholder="مثال: ورشة الإخلاص للخياطة، خط مكن الأمل، ورشة المعلم حسام..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-hidden font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    عدد القطع المسلمة للورشة *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={piecesCount}
                    onChange={(e) => setPiecesCount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-center font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    تاريخ الاستلام المتوقع من الورشة *
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظات التشغيل والورشة</label>
                <textarea
                  rows={2}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="أي تعليمات خاصة بالخياطة، السرفلة، المقاسات، أو الإكسسوارات..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 cursor-pointer"
                >
                  تأكيد الإرسال للورشة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUAL PRINTABLE MODAL WITH STRICT PAGE BREAK AND MODEL PICTURE ON BOTH */}
      {selectedModelForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    ورقة تشغيل المكن المزدوجة: موديل {selectedModelForPrint.model_code}
                  </h3>
                  <p className="text-xs text-slate-500">
                    ورقتان منفصلتان تماماً عند الطباعة (صفحة مستقلة للتيشرت وصفحة مستقلة للبنطلون) مع صورة الموديل في كل ورقة.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الورقتين (صفحتين منفصلتين)</span>
                </button>
                <button
                  onClick={() => setSelectedModelForPrint(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* DUAL SHEETS CONTAINER */}
            <div className="overflow-y-auto flex-grow p-4 space-y-8 print-container">
              
              {/* PAGE 1: ورقة التيشرت */}
              <div className="border-2 border-dashed border-blue-400 rounded-3xl p-6 bg-white shadow-xs relative print-page-break print:p-0 print:border-none print:shadow-none print:m-0">
                {/* Header Badge */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-blue-200 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                      1
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-blue-950">
                        أمر تشغيل ورشة المكن — [ورقة التيشرت T-Shirt]
                      </h4>
                      <p className="text-xs text-slate-500">
                        نظام إدارة وتشغيل مصنع الملابس الجاهزة • خط خياطة التيشرت
                      </p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                    ورقة 1 من 2 (خاصة بخط التيشرت)
                  </span>
                </div>

                {/* Model Details & Picture Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  {/* Model Image - MANDATORY in Sheet 1 */}
                  <div className="md:col-span-1">
                    <div className="aspect-3/4 rounded-2xl overflow-hidden border-2 border-blue-200 bg-slate-100 shadow-xs relative">
                      <img
                        src={selectedModelForPrint.image}
                        alt={selectedModelForPrint.model_code}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=60';
                        }}
                      />
                      <span className="absolute bottom-2 start-2 end-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold text-center py-1 rounded-lg">
                        موديل: {selectedModelForPrint.model_code}
                      </span>
                    </div>
                  </div>

                  {/* Model Metadata Box */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100">
                        <span className="text-[11px] text-blue-700 font-bold block">كود الموديل</span>
                        <strong className="text-base font-black text-slate-900">{selectedModelForPrint.model_code}</strong>
                      </div>
                      <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100">
                        <span className="text-[11px] text-blue-700 font-bold block">نوع الموديل</span>
                        <strong className="text-base font-black text-slate-900">{selectedModelForPrint.model_type || 'تيشرت وبنطلون'}</strong>
                      </div>
                      <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100">
                        <span className="text-[11px] text-blue-700 font-bold block">إجمالي عدد القطع</span>
                        <strong className="text-base font-black text-blue-800">
                          {(selectedModelForPrint.count_after_print || selectedModelForPrint.total_cut_pieces || selectedModelForPrint.actual_cut_count || 0).toLocaleString('ar-EG')} قطعة
                        </strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <span className="text-[11px] text-slate-500 font-bold block">ورشة المكن المستلمة</span>
                        <strong className="text-sm font-black text-slate-800">{selectedModelForPrint.sewing_workshop || 'ورشة الخياطة المعتمدة'}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <span className="text-[11px] text-slate-500 font-bold block">تاريخ أمر التشغيل</span>
                        <strong className="text-sm font-black text-slate-800">{new Date().toLocaleDateString('ar-EG')}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <span className="text-[11px] text-slate-500 font-bold block">تاريخ الاستلام المستهدف</span>
                        <strong className="text-sm font-black text-emerald-700 font-mono">
                          {selectedModelForPrint.sewing_expected_date || 'حسب الاتفاق'}
                        </strong>
                      </div>
                    </div>

                    {/* Instructions & Notes for Shirt */}
                    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5">
                      <h5 className="text-xs font-black text-amber-900 mb-1 flex items-center gap-1.5">
                        <span>📌 تعليمات وملاحظات خياطة التيشرت:</span>
                      </h5>
                      <p className="text-xs text-slate-800 font-semibold whitespace-pre-wrap leading-relaxed">
                        {selectedModelForPrint.notes_shirt || 'الالتزام بمقاسات الصدر والأكتاف والخياطة المزدوجة وفقاً لعينة الاعتماد المرفقة.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shirt Accessories Table */}
                <div className="mb-6">
                  <h5 className="text-xs font-black text-slate-900 mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>جدول إكسسوارات ومستلزمات التيشرت (حسب الاستهلاك المحدد للقطعة):</span>
                  </h5>
                  <div className="border border-blue-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-blue-100/70 border-b border-blue-200 text-blue-950 font-bold">
                        <tr>
                          <th className="py-2.5 px-4">مسمى الإكسسوار</th>
                          <th className="py-2.5 px-4 text-center">الاستهلاك لكل قطعة</th>
                          <th className="py-2.5 px-4 text-center">إجمالي الكمية المصروفة</th>
                          <th className="py-2.5 px-4 text-center">ملاحظات التوريد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-50">
                        {(() => {
                          const shirtAccs = getModelAccs(selectedModelForPrint.id).filter(
                            (a: ModelAccessory) => a.target_type === 'shirt'
                          );
                          const totalTarget =
                            selectedModelForPrint.count_after_print ||
                            selectedModelForPrint.total_cut_pieces ||
                            selectedModelForPrint.actual_cut_count ||
                            0;

                          if (shirtAccs.length > 0) {
                            return shirtAccs.map((acc: ModelAccessory) => {
                              const totalAcc = (acc.piece_consumption || 1) * totalTarget;
                              return (
                                <tr key={acc.id} className="hover:bg-blue-50/40">
                                  <td className="py-2.5 px-4 font-bold text-slate-900">{acc.accessory_name}</td>
                                  <td className="py-2.5 px-4 text-center text-blue-700 font-bold">
                                    {acc.piece_consumption || 1} {acc.unit || 'ق'}
                                  </td>
                                  <td className="py-2.5 px-4 text-center font-black text-slate-900">
                                    {totalAcc.toLocaleString('ar-EG')} {acc.unit || 'ق'}
                                  </td>
                                  <td className="py-2.5 px-4 text-center text-slate-500">تم الصرف من مخزن الإكسسوارات</td>
                                </tr>
                              );
                            });
                          }
                          return (
                            <tr>
                              <td colSpan={4} className="py-3 px-4 text-center text-slate-400">
                                لا توجد إكسسوارات مسجلة خاصة بالتيشرت في بطاقة هذا الموديل.
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-6 border-t-2 border-slate-200 flex items-center justify-between text-xs text-slate-700 font-bold">
                  <div>مشرف خط التيشرت: ........................................</div>
                  <div>مستلم ورشة الخياطة: ........................................</div>
                  <div>توقيع مراقب الجودة: ........................................</div>
                </div>
              </div>

              {/* PAGE BREAK SEPARATOR VISIBLE ONLY IN EDIT / PREVIEW */}
              <div className="flex items-center justify-center gap-3 py-2 print:hidden text-slate-400 text-xs font-bold border-y border-dashed border-slate-300">
                <span>✂️ فاصل صفحة الطباعة (الصفحة التالية ستطبع في ورقة منفصلة تماماً Page Break)</span>
              </div>

              {/* PAGE 2: ورقة البنطلون */}
              <div className="border-2 border-dashed border-emerald-400 rounded-3xl p-6 bg-white shadow-xs relative print-page-break print:p-0 print:border-none print:shadow-none print:m-0">
                {/* Header Badge */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-emerald-200 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg">
                      2
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-emerald-950">
                        أمر تشغيل ورشة المكن — [ورقة البنطلون Pants]
                      </h4>
                      <p className="text-xs text-slate-500">
                        نظام إدارة وتشغيل مصنع الملابس الجاهزة • خط خياطة البنطلون
                      </p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ورقة 2 من 2 (خاصة بخط البنطلون)
                  </span>
                </div>

                {/* Model Details & Picture Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  {/* Model Image - MANDATORY in Sheet 2 */}
                  <div className="md:col-span-1">
                    <div className="aspect-3/4 rounded-2xl overflow-hidden border-2 border-emerald-200 bg-slate-100 shadow-xs relative">
                      <img
                        src={selectedModelForPrint.image}
                        alt={selectedModelForPrint.model_code}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=60';
                        }}
                      />
                      <span className="absolute bottom-2 start-2 end-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold text-center py-1 rounded-lg">
                        موديل: {selectedModelForPrint.model_code}
                      </span>
                    </div>
                  </div>

                  {/* Model Metadata Box */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
                        <span className="text-[11px] text-emerald-700 font-bold block">كود الموديل</span>
                        <strong className="text-base font-black text-slate-900">{selectedModelForPrint.model_code}</strong>
                      </div>
                      <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
                        <span className="text-[11px] text-emerald-700 font-bold block">نوع الموديل</span>
                        <strong className="text-base font-black text-slate-900">{selectedModelForPrint.model_type || 'تيشرت وبنطلون'}</strong>
                      </div>
                      <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
                        <span className="text-[11px] text-emerald-700 font-bold block">إجمالي عدد القطع</span>
                        <strong className="text-base font-black text-emerald-800">
                          {(selectedModelForPrint.count_after_print || selectedModelForPrint.total_cut_pieces || selectedModelForPrint.actual_cut_count || 0).toLocaleString('ar-EG')} قطعة
                        </strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <span className="text-[11px] text-slate-500 font-bold block">ورشة المكن المستلمة</span>
                        <strong className="text-sm font-black text-slate-800">{selectedModelForPrint.sewing_workshop || 'ورشة الخياطة المعتمدة'}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <span className="text-[11px] text-slate-500 font-bold block">تاريخ أمر التشغيل</span>
                        <strong className="text-sm font-black text-slate-800">{new Date().toLocaleDateString('ar-EG')}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <span className="text-[11px] text-slate-500 font-bold block">تاريخ الاستلام المستهدف</span>
                        <strong className="text-sm font-black text-emerald-700 font-mono">
                          {selectedModelForPrint.sewing_expected_date || 'حسب الاتفاق'}
                        </strong>
                      </div>
                    </div>

                    {/* Instructions & Notes for Pants */}
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5">
                      <h5 className="text-xs font-black text-emerald-900 mb-1 flex items-center gap-1.5">
                        <span>📌 تعليمات وملاحظات خياطة البنطلون:</span>
                      </h5>
                      <p className="text-xs text-slate-800 font-semibold whitespace-pre-wrap leading-relaxed">
                        {selectedModelForPrint.notes_pants || 'تركيب الاستك والجيوب وفقاً لعينة الاعتماد مع التأكيد على متانة حجر البنطلون.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pants Accessories Table */}
                <div className="mb-6">
                  <h5 className="text-xs font-black text-slate-900 mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>جدول إكسسوارات ومستلزمات البنطلون (حسب الاستهلاك المحدد للقطعة):</span>
                  </h5>
                  <div className="border border-emerald-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-emerald-100/70 border-b border-emerald-200 text-emerald-950 font-bold">
                        <tr>
                          <th className="py-2.5 px-4">مسمى الإكسسوار</th>
                          <th className="py-2.5 px-4 text-center">الاستهلاك لكل قطعة</th>
                          <th className="py-2.5 px-4 text-center">إجمالي الكمية المصروفة</th>
                          <th className="py-2.5 px-4 text-center">ملاحظات التوريد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50">
                        {(() => {
                          const pantsAccs = getModelAccs(selectedModelForPrint.id).filter(
                            (a: ModelAccessory) => a.target_type === 'pants'
                          );
                          const totalTarget =
                            selectedModelForPrint.count_after_print ||
                            selectedModelForPrint.total_cut_pieces ||
                            selectedModelForPrint.actual_cut_count ||
                            0;

                          if (pantsAccs.length > 0) {
                            return pantsAccs.map((acc: ModelAccessory) => {
                              const totalAcc = (acc.piece_consumption || 1) * totalTarget;
                              return (
                                <tr key={acc.id} className="hover:bg-emerald-50/40">
                                  <td className="py-2.5 px-4 font-bold text-slate-900">{acc.accessory_name}</td>
                                  <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">
                                    {acc.piece_consumption || 1} {acc.unit || 'ق'}
                                  </td>
                                  <td className="py-2.5 px-4 text-center font-black text-slate-900">
                                    {totalAcc.toLocaleString('ar-EG')} {acc.unit || 'ق'}
                                  </td>
                                  <td className="py-2.5 px-4 text-center text-slate-500">تم الصرف من مخزن الإكسسوارات</td>
                                </tr>
                              );
                            });
                          }
                          return (
                            <tr>
                              <td colSpan={4} className="py-3 px-4 text-center text-slate-400">
                                لا توجد إكسسوارات مسجلة خاصة بالبنطلون في بطاقة هذا الموديل.
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-6 border-t-2 border-slate-200 flex items-center justify-between text-xs text-slate-700 font-bold">
                  <div>مشرف خط البنطلون: ........................................</div>
                  <div>مستلم ورشة الخياطة: ........................................</div>
                  <div>توقيع مراقب الجودة: ........................................</div>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">
                ملاحظة: عند أمر الطباعة يضمن النظام خروج ورقة التيشرت أولاً ثم ورقة البنطلون في صفحة مستقلة.
              </span>
              <button
                onClick={() => setSelectedModelForPrint(null)}
                className="px-6 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
