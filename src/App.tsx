import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { FlashAlerts } from './components/FlashAlerts';
import { DashboardView } from './components/DashboardView';
import { WarehouseView } from './components/WarehouseView';
import { DesignView } from './components/DesignView';
import { ModelDetailsView } from './components/ModelDetailsView';
import { CuttingView } from './components/CuttingView';
import { CuttingDetailsView } from './components/CuttingDetailsView';
import { QCDetailsView } from './components/QCDetailsView';
import { ProductionControlView } from './components/ProductionControlView';
import { MasterModelTrackingView } from './components/MasterModelTrackingView';
import { SettingsView } from './components/SettingsView';
import { AuditLogsView } from './components/AuditLogsView';
import { ReportsView } from './components/ReportsView';
import { LoginModal } from './components/LoginModal';

export const App: React.FC = () => {
  const { currentUser, setCurrentUser, addFlashMessage, hasPermission } = useApp();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  const isSudoOrAdmin =
    currentUser?.username === 'sudo' ||
    currentUser?.is_sudo ||
    currentUser?.role === 'owner' ||
    currentUser?.role === 'مدير عام المصنع';

  const canAccessTab = (tab: string): boolean => {
    if (tab === 'dashboard') return true;
    if (
      tab === 'warehouse' ||
      tab === 'accessories_warehouse' ||
      tab === 'production_warehouse'
    ) {
      return (
        hasPermission('fabric_warehouse') ||
        hasPermission('accessories_warehouse') ||
        hasPermission('production_warehouse')
      );
    }
    if (tab === 'design' || tab === 'model_details') return hasPermission('design');
    if (tab === 'cutting' || tab === 'cutting_details') return hasPermission('cutting');
    if (
      tab === 'production_control' ||
      tab === 'printing' ||
      tab === 'assembly' ||
      tab === 'qc' ||
      tab === 'qc_details' ||
      tab === 'sewing'
    ) {
      return (
        hasPermission('printing') ||
        hasPermission('qc') ||
        hasPermission('sewing') ||
        hasPermission('reports')
      );
    }
    if (tab === 'models_tracking') return hasPermission('models_tracking') || isSudoOrAdmin;
    if (tab === 'reports') return hasPermission('reports') || isSudoOrAdmin;
    if (tab === 'settings' || tab === 'logs') return isSudoOrAdmin;
    return true;
  };

  // If user role changes and they lose permission for the current tab, send them to dashboard
  React.useEffect(() => {
    if (!canAccessTab(currentTab)) {
      setCurrentTab('dashboard');
    }
  }, [currentTab, currentUser]);

  if (!currentUser) {
    return (
      <LoginModal
        onSuccess={() => {
          setCurrentTab('dashboard');
          addFlashMessage('تم تسجيل الدخول بنجاح');
        }}
      />
    );
  }

  const handleNavigate = (tab: string, modelId?: string) => {
    if (!canAccessTab(tab)) {
      addFlashMessage('عفواً، ليس لديك صلاحية للوصول لهذا القسم', 'warning');
      return;
    }
    if (modelId) {
      setSelectedModelId(modelId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 flex flex-col antialiased">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => handleNavigate(tab)}
        onLogout={handleLogout}
      />

      <FlashAlerts />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView onNavigate={(tab, id) => handleNavigate(tab, id)} />
        )}

        {/* Warehouses Hub (Fabric, Accessories, Production) */}
        {(currentTab === 'warehouse' ||
          currentTab === 'accessories_warehouse' ||
          currentTab === 'production_warehouse') && <WarehouseView />}

        {/* Design View */}
        {currentTab === 'design' && (
          <DesignView onOpenModelDetails={(id) => handleNavigate('model_details', id)} />
        )}

        {currentTab === 'model_details' && (
          <ModelDetailsView
            modelId={selectedModelId}
            onBack={() => handleNavigate('design')}
            onGoToCutting={(id) => handleNavigate('cutting_details', id)}
          />
        )}

        {/* Cutting View */}
        {currentTab === 'cutting' && (
          <CuttingView onOpenCuttingDetails={(id) => handleNavigate('cutting_details', id)} />
        )}

        {currentTab === 'cutting_details' && (
          <CuttingDetailsView
            modelId={selectedModelId}
            onBack={() => handleNavigate('cutting')}
            onFinishedToQC={() => handleNavigate('production_control')}
          />
        )}

        {/* Production Control Hub (Printing, QC, Sewing) */}
        {currentTab === 'production_control' && <ProductionControlView />}

        {currentTab === 'printing' && <ProductionControlView initialSubTab="printing" />}
        {currentTab === 'assembly' && <ProductionControlView initialSubTab="printing" />}
        {currentTab === 'qc' && <ProductionControlView initialSubTab="qc" />}
        {currentTab === 'sewing' && <ProductionControlView initialSubTab="sewing" />}

        {currentTab === 'qc_details' && (
          <QCDetailsView
            modelId={selectedModelId}
            onBack={() => handleNavigate('production_control')}
            onFinishedApproval={() => handleNavigate('production_control')}
          />
        )}

        {/* Master Model Tracking */}
        {currentTab === 'models_tracking' && <MasterModelTrackingView />}

        {/* Reports & Analytics Section */}
        {currentTab === 'reports' && <ReportsView />}

        {/* Settings & Audit Logs */}
        {currentTab === 'settings' && (
          <SettingsView onOpenLogs={() => handleNavigate('logs')} />
        )}

        {currentTab === 'logs' && (
          <AuditLogsView onBack={() => handleNavigate('settings')} />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700">
            🏭 نظام إدارة المصنع المتكامل - مصانع الملابس الجاهزة (ERP v2.0)
          </p>
          <p className="text-slate-400">
            تم التطوير لدعم دورة الإنتاج الشاملة والصلاحيات المتقدمة © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};
