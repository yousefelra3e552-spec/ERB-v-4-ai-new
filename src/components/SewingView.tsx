import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Scissors, 
  Printer, 
  Search, 
  CheckCircle, 
  Shirt, 
  X, 
  Layers
} from 'lucide-react';
import { Model, ModelAccessory } from '../types';

export const SewingView: React.FC = () => {
  const { models, modelAccessories, finishSewingToQC } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModelForPrint, setSelectedModelForPrint] = useState<Model | null>(null);

  // Models in Sewing section are those that passed after-print QC
  const sewingModels = models.filter(
    (m) => !m.is_deleted && m.status === 'في قسم المكن'
  ).filter((m) => 
    m.model_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.model_type && m.model_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSewingPieces = sewingModels.reduce(
    (sum, m) => sum + (m.count_after_print || m.total_cut_pieces || m.actual_cut_count || 0),
    0
  );

  const handleFinishSewing = (modelId: string) => {
    if (confirm('هل أنت متأكد من إنهاء مرحلة الخياطة وتحويل الموديل إلى قسم الفرز والكنترول (العد بعد المكن)؟')) {
      finishSewingToQC(modelId);
    }
  };

  const getModelAccs = (modelId: string) => {
    return modelAccessories.filter((a: ModelAccessory) => a.model_id === modelId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-emerald-800 tracking-tight flex items-center gap-2">
            <Scissors className="w-8 h-8 text-emerald-600" />
            <span>قسم المكن (خطوط الخياطة والتشغيل)</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            الموديلات الواردة من قسم المطابع بعد اعتماد عدها في الفرز، جاهزة للتشغيل وتوزيع أوراق التيشرت والبنطلون.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الموديل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-xs"
          />
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">الموديلات قيد التشغيل</p>
            <h3 className="text-2xl font-black text-emerald-900">{sewingModels.length}</h3>
            <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">موديل على خطوط الإنتاج</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">إجمالي القطع الجاري خياطتها</p>
            <h3 className="text-2xl font-black text-slate-900">{totalSewingPieces.toLocaleString('ar-EG')}</h3>
            <span className="text-xs text-slate-500 font-semibold mt-1 inline-block">قطعة معدودة بعد الطباعة</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Shirt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">الوجهة بعد إنهاء الخياطة</p>
            <h3 className="text-lg font-black text-purple-800">العد بعد المكن</h3>
            <span className="text-xs text-purple-600 font-semibold mt-1 inline-block">قسم الفرز والكنترول</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid of Models in Sewing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sewingModels.length > 0 ? (
          sewingModels.map((model) => {
            const actualCount = model.count_after_print || model.total_cut_pieces || model.actual_cut_count || 0;
            const targetCut = model.target_cut_quantity || 0;
            const modelAccs = getModelAccs(model.id);
            const shirtAccCount = modelAccs.filter((a: ModelAccessory) => a.target_type === 'shirt').length;
            const pantsAccCount = modelAccs.filter((a: ModelAccessory) => a.target_type === 'pants').length;

            return (
              <div
                key={model.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                <div className="h-56 w-full overflow-hidden bg-slate-100 relative">
                  {model.image ? (
                    <img
                      src={model.image}
                      alt={model.model_code}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Shirt className="w-12 h-12 opacity-40" />
                    </div>
                  )}

                  <span className="absolute top-3 end-3 px-3 py-1 rounded-full text-xs font-bold bg-emerald-700 text-white shadow-xs">
                    على خط المكن
                  </span>

                  {(model.print_house || model.print_house_name) && (
                    <span className="absolute bottom-3 start-3 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white">
                      مستلم من مطبعة: {model.print_house || model.print_house_name}
                    </span>
                  )}
                </div>

                <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-black text-slate-900">
                        موديل: {model.model_code}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg font-bold">
                        {model.model_type || 'تيشرت وبنطلون'}
                      </span>
                    </div>

                    {/* Count Details Box */}
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-900 font-semibold">العدد الفعلي بعد الطباعة:</span>
                        <strong className="text-emerald-800 text-base font-black">
                          {actualCount.toLocaleString('ar-EG')} قطعة
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>العدد المستهدف الأصلي:</span>
                        <span className="font-bold text-slate-800">{targetCut.toLocaleString('ar-EG')} قطعة</span>
                      </div>
                      <div className="pt-1 border-t border-emerald-200/50 flex justify-between items-center text-[11px] text-emerald-800 font-semibold">
                        <span>إكسسوارات تيشرت: {shirtAccCount}</span>
                        <span>إكسسوارات بنطلون: {pantsAccCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Dual Printable Sheet Trigger */}
                    <button
                      onClick={() => setSelectedModelForPrint(model)}
                      className="w-full py-2.5 px-4 rounded-full bg-slate-100 hover:bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200/80 hover:border-emerald-400 transition flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-emerald-600" />
                      <span>طباعة ورقة العمل المزدوجة (تيشرت / بنطلون)</span>
                    </button>

                    {/* Finish & Advance to QC Button */}
                    <button
                      onClick={() => handleFinishSewing(model.id)}
                      className="w-full py-2.5 px-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>إنهاء الخياطة والتحويل للعد بعد المكن</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 text-slate-400">
            <Scissors className="w-12 h-12 mx-auto mb-2 text-emerald-300" />
            <p className="font-bold text-slate-700 text-base">لا توجد موديلات في قسم المكن حالياً</p>
            <p className="text-xs text-slate-400 mt-1">
              الموديلات تصل هنا تلقائياً بمجرد إتمام عدها في الفرز بعد استلامها من المطابع.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: Dual Printable Sheet (ورقة التيشرت + ورقة البنطلون) */}
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
                    ورقة عمل تفصيلية مستقلة لكل من خط التيشرت وخط البنطلون مع الإكسسوارات والملاحظات
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة ورقتي التشغيل</span>
                </button>
                <button
                  onClick={() => setSelectedModelForPrint(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dual Sheet Layout Preview & Print Area */}
            <div className="overflow-y-auto flex-grow p-4 space-y-6">
              {/* Header Info Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
                <div>
                  <span className="text-slate-500">كود الموديل: </span>
                  <span className="text-base text-slate-900 font-black">{selectedModelForPrint.model_code}</span>
                </div>
                <div>
                  <span className="text-slate-500">نوع الموديل: </span>
                  <span className="text-slate-800">{selectedModelForPrint.model_type || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">العدد الفعلي المطلوب تشغيله: </span>
                  <span className="text-emerald-700 font-black text-sm">
                    {(selectedModelForPrint.count_after_print || selectedModelForPrint.total_cut_pieces || selectedModelForPrint.actual_cut_count || 0).toLocaleString('ar-EG')} قطعة
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">تاريخ أمر التشغيل: </span>
                  <span className="text-slate-800">{new Date().toLocaleDateString('ar-EG')}</span>
                </div>
              </div>

              {/* Side-by-Side Dual Sheets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PAGE 1: ورقة التيشرت */}
                <div className="border-2 border-dashed border-blue-300 rounded-3xl p-5 bg-blue-50/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b-2 border-blue-200 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                          1
                        </div>
                        <h4 className="text-base font-black text-blue-900">
                          ورقة تشغيل التيشرت (T-Shirt)
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        خط التيشرت
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Model info snippet */}
                      <div className="bg-white rounded-2xl p-3 border border-blue-100 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">الموديل:</span>
                          <span className="font-bold text-slate-900">{selectedModelForPrint.model_code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">العدد المطلوب:</span>
                          <span className="font-black text-blue-700">
                            {(selectedModelForPrint.count_after_print || selectedModelForPrint.total_cut_pieces || selectedModelForPrint.actual_cut_count || 0).toLocaleString('ar-EG')} قطعة
                          </span>
                        </div>
                      </div>

                      {/* Shirt Notes */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <span>📌 تعليمات وملاحظات تشغيل التيشرت:</span>
                        </h5>
                        <div className="p-3 bg-white rounded-2xl border border-blue-100 text-xs text-slate-800 font-semibold min-h-[70px] whitespace-pre-wrap">
                          {selectedModelForPrint.notes_shirt || 'لا توجد ملاحظات خاصة بالتيشرت.'}
                        </div>
                      </div>

                      {/* Shirt Accessories & Piece Consumption */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 mb-1.5">
                          🧵 إكسسوارات التيشرت والاستهلاك للقطعة:
                        </h5>
                        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-blue-50/70 border-b border-blue-100 text-blue-900 font-bold">
                              <tr>
                                <th className="py-2 px-3">الصنف</th>
                                <th className="py-2 px-3 text-center">استهلاك القطعة</th>
                                <th className="py-2 px-3 text-center">الكمية الإجمالية</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                              {(() => {
                                const shirtAccs = getModelAccs(selectedModelForPrint.id).filter((a: ModelAccessory) => a.target_type === 'shirt');
                                const totalTarget = (selectedModelForPrint.count_after_print || selectedModelForPrint.total_cut_pieces || selectedModelForPrint.actual_cut_count || 0);
                                if (shirtAccs.length > 0) {
                                  return shirtAccs.map((acc: ModelAccessory) => {
                                    const totalAcc = ((acc.piece_consumption || 1) * totalTarget);
                                    return (
                                      <tr key={acc.id}>
                                        <td className="py-2 px-3 font-bold text-slate-800">{acc.accessory_name}</td>
                                        <td className="py-2 px-3 text-center text-blue-700 font-bold">{acc.piece_consumption || 1} {acc.unit || 'ق'}</td>
                                        <td className="py-2 px-3 text-center font-extrabold text-slate-900">{totalAcc.toLocaleString('ar-EG')} {acc.unit || 'ق'}</td>
                                      </tr>
                                    );
                                  });
                                }
                                return (
                                  <tr>
                                    <td colSpan={3} className="py-3 px-3 text-center text-slate-400">
                                      لا توجد إكسسوارات محددة للتيشرت
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signature */}
                  <div className="mt-8 pt-4 border-t border-blue-200/60 flex justify-between text-[11px] text-slate-600 font-bold">
                    <span>مشرف خط التيشرت: ........................</span>
                    <span>التوقيع: ........................</span>
                  </div>
                </div>

                {/* PAGE 2: ورقة البنطلون */}
                <div className="border-2 border-dashed border-emerald-300 rounded-3xl p-5 bg-emerald-50/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b-2 border-emerald-200 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                          2
                        </div>
                        <h4 className="text-base font-black text-emerald-900">
                          ورقة تشغيل البنطلون (Pants)
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        خط البنطلون
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Model info snippet */}
                      <div className="bg-white rounded-2xl p-3 border border-emerald-100 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">الموديل:</span>
                          <span className="font-bold text-slate-900">{selectedModelForPrint.model_code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">العدد المطلوب:</span>
                          <span className="font-black text-emerald-700">
                            {(selectedModelForPrint.count_after_print || selectedModelForPrint.total_cut_pieces || selectedModelForPrint.actual_cut_count || 0).toLocaleString('ar-EG')} قطعة
                          </span>
                        </div>
                      </div>

                      {/* Pants Notes */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <span>📌 تعليمات وملاحظات تشغيل البنطلون:</span>
                        </h5>
                        <div className="p-3 bg-white rounded-2xl border border-emerald-100 text-xs text-slate-800 font-semibold min-h-[70px] whitespace-pre-wrap">
                          {selectedModelForPrint.notes_pants || 'لا توجد ملاحظات خاصة بالبنطلون.'}
                        </div>
                      </div>

                      {/* Pants Accessories & Piece Consumption */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 mb-1.5">
                          🧵 إكسسوارات البنطلون والاستهلاك للقطعة:
                        </h5>
                        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-emerald-50/70 border-b border-emerald-100 text-emerald-900 font-bold">
                              <tr>
                                <th className="py-2 px-3">الصنف</th>
                                <th className="py-2 px-3 text-center">استهلاك القطعة</th>
                                <th className="py-2 px-3 text-center">الكمية الإجمالية</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                              {(() => {
                                const pantsAccs = getModelAccs(selectedModelForPrint.id).filter((a: ModelAccessory) => a.target_type === 'pants');
                                const totalTarget = (selectedModelForPrint.count_after_print || selectedModelForPrint.total_cut_pieces || selectedModelForPrint.actual_cut_count || 0);
                                if (pantsAccs.length > 0) {
                                  return pantsAccs.map((acc: ModelAccessory) => {
                                    const totalAcc = ((acc.piece_consumption || 1) * totalTarget);
                                    return (
                                      <tr key={acc.id}>
                                        <td className="py-2 px-3 font-bold text-slate-800">{acc.accessory_name}</td>
                                        <td className="py-2 px-3 text-center text-emerald-700 font-bold">{acc.piece_consumption || 1} {acc.unit || 'ق'}</td>
                                        <td className="py-2 px-3 text-center font-extrabold text-slate-900">{totalAcc.toLocaleString('ar-EG')} {acc.unit || 'ق'}</td>
                                      </tr>
                                    );
                                  });
                                }
                                return (
                                  <tr>
                                    <td colSpan={3} className="py-3 px-3 text-center text-slate-400">
                                      لا توجد إكسسوارات محددة للبنطلون
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signature */}
                  <div className="mt-8 pt-4 border-t border-emerald-200/60 flex justify-between text-[11px] text-slate-600 font-bold">
                    <span>مشرف خط البنطلون: ........................</span>
                    <span>التوقيع: ........................</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedModelForPrint(null)}
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
