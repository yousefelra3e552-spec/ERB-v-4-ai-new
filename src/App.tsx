import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { FlashAlerts } from './components/FlashAlerts';
import { DashboardView } from './components/DashboardView';
import { WarehouseView } from './components/WarehouseView';
import { AccessoriesWarehouseView } from './components/AccessoriesWarehouseView';
import { ProductionWarehouseView } from './components/ProductionWarehouseView';
import { DesignView } from './components/DesignView';
import { ModelDetailsView } from './components/ModelDetailsView';
import { CuttingView } from './components/CuttingView';
import { CuttingDetailsView } from './components/CuttingDetailsView';
import { QCView } from './components/QCView';
import { QCDetailsView } from './components/QCDetailsView';
import { DispatchAssemblyView } from './components/DispatchAssemblyView';
import { SewingView } from './components/SewingView';
import { MasterModelTrackingView } from './components/MasterModelTrackingView';
import { SettingsView } from './components/SettingsView';
import { AuditLogsView } from './components/AuditLogsView';
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
    if (tab === 'warehouse') return hasPermission('fabric_warehouse');
    if (tab === 'accessories_warehouse') return hasPermission('accessories_warehouse');
    if (tab === 'production_warehouse') return hasPermission('production_warehouse');
    if (tab === 'design' || tab === 'model_details') return hasPermission('design');
    if (tab === 'cutting' || tab === 'cutting_details') return hasPermission('cutting');
    if (tab === 'printing' || tab === 'assembly') return hasPermission('printing') || hasPermission('reports');
    if (tab === 'qc' || tab === 'qc_details') return hasPermission('qc');
    if (tab === 'sewing') return hasPermission('sewing');
    if (tab === 'models_tracking') return hasPermission('models_tracking') || isSudoOrAdmin;
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

        {currentTab === 'warehouse' && <WarehouseView />}

        {currentTab === 'accessories_warehouse' && <AccessoriesWarehouseView />}

        {currentTab === 'production_warehouse' && <ProductionWarehouseView />}

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

        {currentTab === 'cutting' && (
          <CuttingView onOpenCuttingDetails={(id) => handleNavigate('cutting_details', id)} />
        )}

        {currentTab === 'cutting_details' && (
          <CuttingDetailsView
            modelId={selectedModelId}
            onBack={() => handleNavigate('cutting')}
            onFinishedToQC={() => handleNavigate('qc')}
          />
        )}

        {currentTab === 'qc' && <QCView />}

        {currentTab === 'qc_details' && (
          <QCDetailsView
            modelId={selectedModelId}
            onBack={() => handleNavigate('qc')}
            onFinishedApproval={() => handleNavigate('printing')}
          />
        )}

        {(currentTab === 'printing' || currentTab === 'assembly') && <DispatchAssemblyView />}

        {currentTab === 'sewing' && <SewingView />}

        {currentTab === 'models_tracking' && <MasterModelTrackingView />}

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
