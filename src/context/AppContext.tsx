import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  AuditLog,
  SizeDef,
  Supplier,
  Fabric,
  FabricColor,
  FabricTransaction,
  DesignModel,
  ModelRequirement,
  ModelAccessory,
  CuttingRecord,
  QCRecord,
  QCStageType,
  PrintDispatch,
  DispatchStatus,
  CustomRole,
  SystemSectionKey,
  RolePermissions,
  AccessoryType,
  AccessoryItem,
  AccessoryTransaction,
  AccessoryUnit,
  AccessoryUsageType,
  ModelTimelineEvent,
  SewingDispatch,
  AppNotification,
  InternalMessage
} from '../types';

interface FlashMessage {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  text: string;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  roles: CustomRole[];
  auditLogs: AuditLog[];
  sizeDefs: SizeDef[];
  suppliers: Supplier[];
  fabrics: Fabric[];
  fabricColors: FabricColor[];
  fabricTransactions: FabricTransaction[];
  models: DesignModel[];
  requirements: ModelRequirement[];
  accessories: ModelAccessory[];
  modelAccessories: ModelAccessory[];
  cuttingRecords: CuttingRecord[];
  qcRecords: QCRecord[];
  printDispatches: PrintDispatch[];
  sewingDispatches: SewingDispatch[];
  appNotifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  flashMessages: FlashMessage[];
  addFlashMessage: (text: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
  removeFlashMessage: (id: string) => void;

  // Dynamic Role Management
  addRole: (data: Omit<CustomRole, 'id'>) => void;
  updateRole: (id: string, updates: Partial<CustomRole>) => void;
  deleteRole: (id: string) => { success: boolean; message: string };

  // Permission helper with all system sections + legacy shortcuts
  hasPermission: (
    module: SystemSectionKey | 'warehouse' | 'design' | 'cutting' | 'qc' | 'reports',
    requireEdit?: boolean
  ) => boolean;

  // Internal Messaging System
  internalMessages: InternalMessage[];
  unreadMessagesCount: number;
  sendInternalMessage: (receiverId: string, content: string) => { success: boolean; message: string };
  markMessageRead: (messageId: string) => void;

  // Financial & Sensitive Permissions Checkers
  canViewFabricPrices: () => boolean;
  canEditFabricPrices: () => boolean;
  canViewAccessoryPrices: () => boolean;
  canEditAccessoryPrices: () => boolean;
  canViewPrintingCosts: () => boolean;
  canEditPrintingCosts: () => boolean;
  canSendWhatsApp: () => boolean;
  canSendMessages: () => boolean;

  // Warehouse Actions
  addFabricOrColor: (data: {
    fabricId?: string;
    newFabricName?: string;
    unit?: 'توب' | 'كيلو' | 'متر';
    colorCode: string;
    colorName?: string;
    hexCode?: string;
    quantity: number;
    supplierId?: string;
  }) => { success: boolean; message: string; fabricId: string };
  recordTransaction: (data: {
    colorId: string;
    operation: 'add' | 'deduct';
    amount: number;
    modelCodeRef?: string;
    notes?: string;
  }) => { success: boolean; message: string };
  exportWarehouseInventoryCsv: () => void;
  updateColorPrice: (colorId: string, price: number) => void;

  // Accessories Warehouse Actions
  accessoryTypes: AccessoryType[];
  accessoryItems: AccessoryItem[];
  accessoryTransactions: AccessoryTransaction[];
  addAccessoryType: (name: string, description?: string) => string;
  addAccessoryItem: (data: {
    type_id: string;
    type_name?: string;
    code: string;
    name: string;
    image?: string;
    unit: AccessoryUnit;
    quantity: number;
    price_per_unit: number;
    supplier_id?: string;
    min_threshold: number;
    usage_type?: AccessoryUsageType;
    custom_model_code?: string;
    target_quantity?: number;
    delivered_quantity?: number;
  }) => { success: boolean; message: string; itemId: string };
  updateAccessoryItem: (id: string, updates: Partial<AccessoryItem>) => void;
  deleteAccessoryItem: (id: string) => { success: boolean; message: string };
  recordAccessoryTransaction: (data: {
    accessoryId: string;
    operation: 'add' | 'deduct';
    amount: number;
    modelCodeRef?: string;
    notes?: string;
  }) => { success: boolean; message: string };
  exportAccessoryInventoryCsv: () => void;
  markAccessoryWithdrawn: (accessoryId: string) => void;

  // Design Actions
  addDesignModel: (data: {
    modelCode: string;
    modelType: string;
    sizeCategoryId?: string;
    imageUrl?: string;
    targetCutQuantity?: number;
    notesShirt?: string;
    notesPants?: string;
  }) => { success: boolean; message: string; modelId?: string };
  updateModelPlan: (data: {
    modelId: string;
    reqQuantities: Record<string, number>;
    accQuantities: Record<string, number>;
    mainMarkerUrl?: string;
    printMarkerUrl?: string;
    notesShirt?: string;
    notesPants?: string;
    targetCutQuantity?: number;
  }) => { success: boolean; message: string };
  updateModelNotesAndTarget: (
    modelId: string,
    data: {
      target_cut_quantity?: number;
      notes_shirt?: string;
      notes_pants?: string;
    }
  ) => void;
  addModelRequirement: (modelId: string, colorId: string, partName: string) => void;
  deleteModelRequirement: (reqId: string) => void;
  addModelAccessory: (
    modelId: string,
    accessory: {
      id?: string;
      code?: string;
      name: string;
      unit?: string;
      image?: string;
      target_type?: 'shirt' | 'pants';
      piece_consumption?: number;
      planned_quantity?: number;
    }
  ) => { success: boolean; message: string };
  deleteModelAccessory: (accId: string) => void;
  issueFabricToCutting: (modelId: string) => { success: boolean; message: string };
  deleteDesignModel: (modelId: string) => void;

  // Cutting Actions
  addCuttingRecord: (data: {
    modelId: string;
    colorName: string;
    cutterName: string;
    layersCount: number;
    layerWeight: number;
    piecesCount: number;
    shadeDegree?: string;
  }) => void;
  finishCuttingToQC: (modelId: string) => void;
  exportCuttingCsv: (modelId: string) => void;

  // QC Actions & Multi-stage counting
  recordQCData: (data: {
    modelId: string;
    colorName: string;
    size: string;
    goodQty: number;
    defectQty: number;
    defectNotes?: string;
    stage?: QCStageType;
  }) => void;
  addQCRecord: (data: any) => void;
  recordQCStageCount: (data: {
    modelId: string;
    stage: QCStageType;
    piecesCounted: number;
    defectQty: number;
    defectNotes?: string;
    advanceStage?: boolean;
  }) => void;
  finishQCApproval: (modelId: string) => void;
  exportQcCsv: (modelId: string) => void;

  // Printing & Embroidery Actions
  addPrintDispatch: (data: {
    modelId: string;
    shopName: string;
    piecesCount: number;
    printType: string;
    expectedDeliveryDate?: string;
    costPerPiece?: number;
    totalCost?: number;
    notes?: string;
  }) => void;
  updateDispatchStatus: (dispatchId: string, status: DispatchStatus) => void;

  // Sewing Actions
  dispatchModelToSewing: (data: {
    modelId: string;
    workshopName: string;
    piecesCount: number;
    expectedDeliveryDate: string;
    pieceType?: 'shirt' | 'pants';
    pieceLabel?: string;
    notes?: string;
  }) => void;
  receiveModelFromSewing: (dispatchId: string, modelId?: string) => void;
  finishSewingToQC: (modelId: string, notes?: string) => void;
  finishQCToProduction: (modelId: string, notes?: string) => void;

  // Settings Actions
  addSizeDef: (name: string, values: string) => void;
  addSupplier: (name: string, phone: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  toggleUserActive: (userId: string) => { success: boolean; message: string };
  updateUserPermissionsAndPassword: (
    userId: string,
    permissions: User['permissions'],
    newPassword?: string,
    newRole?: string,
    roleId?: string
  ) => void;
  deleteUser: (userId: string) => { success: boolean; message: string };

  // Log & Timeline helper
  logAction: (action: string, details: string) => void;
  addModelTimelineEvent: (modelId: string, event: Omit<ModelTimelineEvent, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const INITIAL_ROLES: CustomRole[] = [
  {
    id: 'role-1',
    name: 'مدير عام المصنع',
    description: 'صلاحيات كاملة للمتابعة والإشراف على كافة أقسام المصنع والمخازن والماليات',
    permissions: {
      fabric_warehouse_view: true,
      fabric_warehouse_edit: true,
      accessories_warehouse_view: true,
      accessories_warehouse_edit: true,
      production_warehouse_view: true,
      production_warehouse_edit: true,
      design_view: true,
      design_edit: true,
      cutting_view: true,
      cutting_edit: true,
      qc_view: true,
      qc_edit: true,
      printing_view: true,
      printing_edit: true,
      sewing_view: true,
      sewing_edit: true,
      models_tracking_view: true,
      models_tracking_edit: true,
      reports_view: true,
      reports_edit: true,
      view_fabric_prices: true,
      edit_fabric_prices: true,
      view_accessory_prices: true,
      edit_accessory_prices: true,
      view_printing_costs: true,
      edit_printing_costs: true,
      send_whatsapp_requests: true,
      send_internal_messages: true
    }
  },
  {
    id: 'role-2',
    name: 'مدير الإكسسوارات والمستلزمات',
    description: 'إدارة مخزن الإكسسوارات وإضافة الأصناف والصرف ومتابعة حد التنبيه وإعادة الطلب',
    permissions: {
      fabric_warehouse_view: false,
      fabric_warehouse_edit: false,
      accessories_warehouse_view: true,
      accessories_warehouse_edit: true,
      production_warehouse_view: false,
      production_warehouse_edit: false,
      design_view: true,
      design_edit: false,
      cutting_view: false,
      cutting_edit: false,
      qc_view: false,
      qc_edit: false,
      printing_view: false,
      printing_edit: false,
      sewing_view: false,
      sewing_edit: false,
      models_tracking_view: true,
      models_tracking_edit: false,
      reports_view: true,
      reports_edit: false,
      view_fabric_prices: false,
      edit_fabric_prices: false,
      view_accessory_prices: true,
      edit_accessory_prices: true,
      view_printing_costs: false,
      edit_printing_costs: false,
      send_whatsapp_requests: true,
      send_internal_messages: true
    }
  },
  {
    id: 'role-3',
    name: 'مسؤول مخزن الأقمشة',
    description: 'إدارة أصناف وألوان الأقمشة وحركات الإضافة والصرف وتسجيل الأسعار',
    permissions: {
      fabric_warehouse_view: true,
      fabric_warehouse_edit: true,
      accessories_warehouse_view: false,
      accessories_warehouse_edit: false,
      production_warehouse_view: false,
      production_warehouse_edit: false,
      design_view: true,
      design_edit: false,
      cutting_view: false,
      cutting_edit: false,
      qc_view: false,
      qc_edit: false,
      printing_view: false,
      printing_edit: false,
      sewing_view: false,
      sewing_edit: false,
      models_tracking_view: true,
      models_tracking_edit: false,
      reports_view: true,
      reports_edit: false,
      view_fabric_prices: true,
      edit_fabric_prices: true,
      view_accessory_prices: false,
      edit_accessory_prices: false,
      view_printing_costs: false,
      edit_printing_costs: false,
      send_whatsapp_requests: true,
      send_internal_messages: false
    }
  },
  {
    id: 'role-4',
    name: 'مسؤول قسم التصميم',
    description: 'إضافة الموديلات الجديدة وتلوينها وسحب الخامات والإكسسوارات وإعداد الباترون والماركر',
    permissions: {
      fabric_warehouse_view: true,
      fabric_warehouse_edit: false,
      accessories_warehouse_view: true,
      accessories_warehouse_edit: false,
      production_warehouse_view: false,
      production_warehouse_edit: false,
      design_view: true,
      design_edit: true,
      cutting_view: false,
      cutting_edit: false,
      qc_view: false,
      qc_edit: false,
      printing_view: false,
      printing_edit: false,
      sewing_view: false,
      sewing_edit: false,
      models_tracking_view: true,
      models_tracking_edit: false,
      reports_view: false,
      reports_edit: false,
      view_fabric_prices: false,
      edit_fabric_prices: false,
      view_accessory_prices: false,
      edit_accessory_prices: false,
      view_printing_costs: false,
      edit_printing_costs: false,
      send_whatsapp_requests: false,
      send_internal_messages: true
    }
  },
  {
    id: 'role-5',
    name: 'مسؤول قسم القص',
    description: 'استلام الموديلات وتسجيل بيانات الفرش والراقات وعدد القطع المنفذة',
    permissions: {
      fabric_warehouse_view: false,
      fabric_warehouse_edit: false,
      accessories_warehouse_view: false,
      accessories_warehouse_edit: false,
      production_warehouse_view: false,
      production_warehouse_edit: false,
      design_view: true,
      design_edit: false,
      cutting_view: true,
      cutting_edit: true,
      qc_view: false,
      qc_edit: false,
      printing_view: false,
      printing_edit: false,
      sewing_view: false,
      sewing_edit: false,
      models_tracking_view: true,
      models_tracking_edit: false,
      reports_view: false,
      reports_edit: false,
      view_fabric_prices: false,
      edit_fabric_prices: false,
      view_accessory_prices: false,
      edit_accessory_prices: false,
      view_printing_costs: false,
      edit_printing_costs: false,
      send_whatsapp_requests: false,
      send_internal_messages: false
    }
  },
  {
    id: 'role-6',
    name: 'مراقب الجودة والفرز',
    description: 'فحص وتدقيق القطع عبر مراحل العد قبل الطباعة، بعد الطباعة، وبعد المكن',
    permissions: {
      fabric_warehouse_view: false,
      fabric_warehouse_edit: false,
      accessories_warehouse_view: false,
      accessories_warehouse_edit: false,
      production_warehouse_view: false,
      production_warehouse_edit: false,
      design_view: false,
      design_edit: false,
      cutting_view: true,
      cutting_edit: false,
      qc_view: true,
      qc_edit: true,
      printing_view: true,
      printing_edit: false,
      sewing_view: true,
      sewing_edit: false,
      models_tracking_view: true,
      models_tracking_edit: false,
      reports_view: true,
      reports_edit: false,
      view_fabric_prices: false,
      edit_fabric_prices: false,
      view_accessory_prices: false,
      edit_accessory_prices: false,
      view_printing_costs: false,
      edit_printing_costs: false,
      send_whatsapp_requests: false,
      send_internal_messages: false
    }
  },
  {
    id: 'role-7',
    name: 'مسؤول المطابع والتطريز',
    description: 'إرسال واستلام تشغيلات المطابع والتطريز وتتبع حالات التسليم',
    permissions: {
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
      qc_view: true,
      qc_edit: false,
      printing_view: true,
      printing_edit: true,
      sewing_view: false,
      sewing_edit: false,
      models_tracking_view: true,
      models_tracking_edit: false,
      reports_view: true,
      reports_edit: false,
      view_fabric_prices: false,
      edit_fabric_prices: false,
      view_accessory_prices: false,
      edit_accessory_prices: false,
      view_printing_costs: true,
      edit_printing_costs: true,
      send_whatsapp_requests: false,
      send_internal_messages: true
    }
  },
  {
    id: 'role-8',
    name: 'مسؤول قسم المكن والخياطة',
    description: 'متابعة خطوط المكن واستلام الموديلات بعد عد الطباعة وإتمام الخياطة',
    permissions: {
      fabric_warehouse_view: false,
      fabric_warehouse_edit: false,
      accessories_warehouse_view: true,
      accessories_warehouse_edit: false,
      production_warehouse_view: false,
      production_warehouse_edit: false,
      design_view: true,
      design_edit: false,
      cutting_view: false,
      cutting_edit: false,
      qc_view: true,
      qc_edit: false,
      printing_view: false,
      printing_edit: false,
      sewing_view: true,
      sewing_edit: true,
      models_tracking_view: true,
      models_tracking_edit: false,
      reports_view: true,
      reports_edit: false,
      view_fabric_prices: false,
      edit_fabric_prices: false,
      view_accessory_prices: false,
      edit_accessory_prices: false,
      view_printing_costs: false,
      edit_printing_costs: false,
      send_whatsapp_requests: false,
      send_internal_messages: true
    }
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'user-sudo',
    username: 'sudo',
    password: '14596357',
    real_name: 'حساب الإدارة العليا (Sudo)',
    phone: '01000000000',
    role: 'مدير عام المصنع',
    role_id: 'role-1',
    is_sudo: true,
    permissions: {
      warehouse: 'edit',
      design: 'edit',
      cutting: 'edit',
      qc: 'edit',
      printing: 'edit',
      sewing: 'edit',
      models_tracking: 'edit',
      fabric_warehouse: 'edit',
      accessories_warehouse: 'edit',
      production_warehouse: 'edit',
      reports: 'edit',
      view_fabric_prices: true,
      edit_fabric_prices: true,
      view_accessory_prices: true,
      edit_accessory_prices: true,
      view_printing_costs: true,
      edit_printing_costs: true,
      send_whatsapp_requests: true,
      send_internal_messages: true
    },
    is_active: true,
    last_active: new Date().toISOString()
  },
  {
    id: 'user-2',
    username: 'owner',
    password: '123',
    real_name: 'أ/ محمود الشامي (المالك)',
    role: 'مدير عام المصنع',
    role_id: 'role-1',
    permissions: {
      warehouse: 'view',
      design: 'view',
      cutting: 'view',
      qc: 'view',
      printing: 'view',
      sewing: 'view',
      models_tracking: 'view',
      view_fabric_prices: true,
      view_accessory_prices: true,
      view_printing_costs: true
    },
    is_active: true,
    last_active: new Date().toISOString()
  },
  {
    id: 'user-3',
    username: 'warehouse_mgr',
    password: '123',
    real_name: 'أحمد رجب (أمين مخزن القماش)',
    role: 'مسؤول مخزن الأقمشة',
    role_id: 'role-3',
    permissions: {
      warehouse: 'edit',
      fabric_warehouse: 'edit',
      view_fabric_prices: true,
      edit_fabric_prices: true,
      send_whatsapp_requests: true
    },
    is_active: true
  },
  {
    id: 'user-acc',
    username: 'acc_manager',
    password: '123',
    real_name: 'سعيد إكسسوار (مسؤول الإكسسوارات)',
    role: 'مدير الإكسسوارات والمستلزمات',
    role_id: 'role-2',
    permissions: {
      warehouse: 'edit',
      accessories_warehouse: 'edit',
      view_accessory_prices: true,
      edit_accessory_prices: true,
      send_whatsapp_requests: true
    },
    is_active: true
  },
  {
    id: 'user-4',
    username: 'cutter_head',
    password: '123',
    real_name: 'عماد عثمان (رئيس قسم القص)',
    role: 'مسؤول قسم القص',
    role_id: 'role-5',
    permissions: { cutting: 'edit', design: 'view' },
    is_active: true
  },
  {
    id: 'user-5',
    username: 'qc_inspector',
    password: '123',
    real_name: 'سامح فرز (مسؤول الجودة والكنترول)',
    role: 'مراقب الجودة والفرز',
    role_id: 'role-6',
    permissions: { qc: 'edit', printing: 'view', sewing: 'view' },
    is_active: true
  }
];

const INITIAL_SIZES: SizeDef[] = [
  { id: 'size-1', name: 'بيبي', values: '1, 2, 3' },
  { id: 'size-2', name: 'أطفال / وسط', values: '4, 6, 8, 10, 12' },
  { id: 'size-3', name: 'شبابي', values: '14, 16, 18' },
  { id: 'size-4', name: 'رجالي', values: 'S, M, L, XL, 2XL, 3XL' }
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'شركة النسيج الحديث للمحلة', phone: '01002345678' },
  { id: 'sup-2', name: 'مؤسسة الأهرام للغزول والصباغة', phone: '01129876543' },
  { id: 'sup-3', name: 'مستودع إكسسوارات الفهد', phone: '01234567890' }
];

const INITIAL_FABRICS: Fabric[] = [
  {
    id: 'fab-1',
    name: 'قطن 100% سنغل جيرسي',
    description: 'قطن تمشيط مصري فاخر للتيشيرتات والأطقم الصيفية خامة ناعمة ومريحة',
    unit: 'كيلو',
    supplier_id: 'sup-1',
    image: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'fab-2',
    name: 'ميلتون قطن مبطن 3 فتلة',
    description: 'خامة شتوي فاخرة ثقيلة للسويت شيرت والبنطلون الرجالي والأطفالي',
    unit: 'كيلو',
    supplier_id: 'sup-2',
    image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'fab-3',
    name: 'ريب مضلع لايكرا 1x1',
    description: 'ريب قطني مرن للياقات والأساور وكمر التيشيرت والبنطلون',
    unit: 'كيلو',
    supplier_id: 'sup-1',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60'
  }
];

const INITIAL_FABRIC_COLORS: FabricColor[] = [
  {
    id: 'col-1',
    fabric_id: 'fab-1',
    color_code: 'CT-01',
    color_name: 'أبيض ناصع',
    hex_code: '#ffffff',
    price_per_unit: 140,
    quantity: 180,
    reserved_quantity: 45
  },
  {
    id: 'col-2',
    fabric_id: 'fab-1',
    color_code: 'CT-02',
    color_name: 'أسود كربوني',
    hex_code: '#1e293b',
    price_per_unit: 145,
    quantity: 210,
    reserved_quantity: 40
  },
  {
    id: 'col-3',
    fabric_id: 'fab-1',
    color_code: 'CT-03',
    color_name: 'كحلي داكن',
    hex_code: '#0f172a',
    price_per_unit: 142,
    quantity: 20,
    reserved_quantity: 15
  },
  {
    id: 'col-4',
    fabric_id: 'fab-2',
    color_code: 'ML-10',
    color_name: 'رمادي ميلانج',
    hex_code: '#94a3b8',
    price_per_unit: 175,
    quantity: 130,
    reserved_quantity: 60
  },
  {
    id: 'col-5',
    fabric_id: 'fab-2',
    color_code: 'ML-20',
    color_name: 'زيتي عسكري',
    hex_code: '#365314',
    price_per_unit: 180,
    quantity: 22,
    reserved_quantity: 10
  },
  {
    id: 'col-6',
    fabric_id: 'fab-3',
    color_code: 'RB-01',
    color_name: 'أبيض ناصع',
    hex_code: '#ffffff',
    price_per_unit: 160,
    quantity: 50,
    reserved_quantity: 10
  }
];

const INITIAL_TRANSACTIONS: FabricTransaction[] = [
  {
    id: 'tr-1',
    color_id: 'col-1',
    fabric_id: 'fab-1',
    model_code_ref: 'M-101',
    notes: 'صرف أولي للقص المبدئي لتشغيلة التيشرت الصيفي',
    operation: 'deduct',
    amount: 45,
    timestamp: '2026-10-30 09:20'
  },
  {
    id: 'tr-2',
    color_id: 'col-4',
    fabric_id: 'fab-2',
    model_code_ref: 'SW-204',
    notes: 'صرف قماش ميلانج لصالح مقص السويت شيرت',
    operation: 'deduct',
    amount: 60,
    timestamp: '2026-10-29 11:00'
  },
  {
    id: 'tr-3',
    color_id: 'col-2',
    fabric_id: 'fab-1',
    model_code_ref: 'توريد جديد',
    notes: 'استلام فاتورة توريد 15 رول أسود من مؤسسة الأهرام',
    operation: 'add',
    amount: 75,
    timestamp: '2026-10-28 14:15'
  }
];

const INITIAL_ACCESSORY_TYPES: AccessoryType[] = [
  { id: 'type-1', name: 'بادج', icon: 'Shield', description: 'بادجات تطريز وسيليكون وليزر للأكمام والصدور والجيوب' },
  { id: 'type-2', name: 'لعبة', icon: 'Sparkles', description: 'ألعاب ملابس أطفال وميداليات وحليات قماشية' },
  { id: 'type-3', name: 'ورد', icon: 'Flower2', description: 'ورود شيفون وستان وفيونكات للأطواق والفساتين' },
  { id: 'type-4', name: 'دانتيل وتطريز', icon: 'Feather', description: 'شرايط دانتيل قطني وجبير وتطريزات جاهزة' },
  { id: 'type-5', name: 'تيكت وعلامات', icon: 'Tag', description: 'تيكت رقبة قطني منسوج وكروت مقاس وعناية' },
  { id: 'type-6', name: 'سوست ومستلزمات', icon: 'Minimize2', description: 'سوست عظم ومعدن وجرارات وإكسسوارات سحاب' }
];

const INITIAL_ACCESSORY_ITEMS: AccessoryItem[] = [
  {
    id: 'acc-1',
    type_id: 'type-1',
    type_name: 'بادج',
    code: 'BDG-101',
    name: 'بادج نسر رياضي مطرز مذهب',
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&auto=format&fit=crop&q=60',
    unit: 'قطعة',
    quantity: 160,
    reserved_quantity: 25,
    price_per_unit: 8.5,
    supplier_id: 'sup-3',
    min_threshold: 40,
    created_at: '2026-10-20',
    usage_type: 'stock'
  },
  {
    id: 'acc-2',
    type_id: 'type-1',
    type_name: 'بادج',
    code: 'BDG-102',
    name: 'بادج سيليكون كابتن خاص لموديل M-101',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=60',
    unit: 'قطعة',
    quantity: 1000,
    reserved_quantity: 0,
    price_per_unit: 12.0,
    supplier_id: 'sup-1',
    min_threshold: 1200, // Acts as target required quantity
    target_quantity: 1200,
    delivered_quantity: 1000,
    withdrawn_for_model: false,
    usage_type: 'custom_model',
    custom_model_code: 'M-101',
    created_at: '2026-10-21'
  },
  {
    id: 'acc-3',
    type_id: 'type-1',
    type_name: 'بادج',
    code: 'BDG-103',
    name: 'بادج شيلد رياضي عاكس للضوء',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=60',
    unit: 'قطعة',
    quantity: 90,
    reserved_quantity: 0,
    price_per_unit: 9.5,
    supplier_id: 'sup-2',
    min_threshold: 30,
    created_at: '2026-10-22',
    usage_type: 'stock'
  },
  {
    id: 'acc-4',
    type_id: 'type-2',
    type_name: 'لعبة',
    code: 'TOY-201',
    name: 'دبدوب قماشي صغير جيب بناتي محشو',
    image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=500&auto=format&fit=crop&q=60',
    unit: 'قطعة',
    quantity: 12,
    reserved_quantity: 2,
    price_per_unit: 15.0,
    supplier_id: 'sup-3',
    min_threshold: 35,
    created_at: '2026-10-22',
    usage_type: 'stock'
  },
  {
    id: 'acc-5',
    type_id: 'type-5',
    type_name: 'تيكت وعلامات',
    code: 'TKT-501',
    name: 'تيكت منسوج قطن خاص لموديل SW-204',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500&auto=format&fit=crop&q=60',
    unit: 'قطعة',
    quantity: 800,
    reserved_quantity: 0,
    price_per_unit: 2.5,
    supplier_id: 'sup-1',
    min_threshold: 800,
    target_quantity: 800,
    delivered_quantity: 800,
    withdrawn_for_model: true, // Fully delivered & withdrawn -> won't appear in deficit
    usage_type: 'custom_model',
    custom_model_code: 'SW-204',
    created_at: '2026-10-23'
  }
];

const INITIAL_ACCESSORY_TRANSACTIONS: AccessoryTransaction[] = [
  {
    id: 'acc-tr-1',
    accessory_id: 'acc-1',
    accessory_code: 'BDG-101',
    accessory_name: 'بادج نسر رياضي مطرز مذهب',
    operation: 'deduct',
    amount: 25,
    model_code_ref: 'M-101',
    notes: 'صرف تشغيلة تيشيرت',
    timestamp: '2026-10-30 10:15'
  }
];

const INITIAL_MODELS: DesignModel[] = [
  {
    id: 'mod-1',
    model_code: 'M-101',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60',
    model_type: 'أولادي',
    status: 'مرحلة التصميم',
    size_category_id: 'size-2',
    main_marker_url: 'MK-M101-MAIN',
    print_marker_url: 'PR-M101-FRONT',
    target_cut_quantity: 500,
    notes_shirt: 'ملاحظات التيشرت: يرجى تثبيت البادج على الصدر الأيسر بدقة، وتركيب تيكت الرقبة بدون شد.',
    notes_pants: 'ملاحظات البنطلون: كمر استيك عريض 4 سم وجيوب جانبية مبطنة بسنجل أبيض.',
    created_at: '2026-10-30T08:30:00.000Z',
    is_deleted: false,
    timeline: [
      {
        id: 'tl-1',
        stage: 'مرحلة التصميم',
        title: 'إنشاء وتجهيز الموديل',
        description: 'تم إنشاء الموديل وتحديد الألوان والماركر والكمية المستهدفة للقص 500 قطعة',
        user_name: 'مسؤول التصميم',
        timestamp: '2026-10-30 08:30'
      }
    ]
  },
  {
    id: 'mod-2',
    model_code: 'SW-204',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60',
    model_type: 'رجالي',
    status: 'في القص',
    size_category_id: 'size-4',
    main_marker_url: 'MK-SW204-HOOD',
    print_marker_url: 'PR-SW204-BACK',
    target_cut_quantity: 600,
    actual_cut_count: 580,
    cutter_name: 'عماد عثمان',
    notes_shirt: 'ملاحظات التيشرت/السويت شيرت: كابيشو مبطن خامة سنجل متباينة اللون مع شريط سحب قطن عريض.',
    notes_pants: 'ملاحظات البنطلون: أساور ريب 1x1 مطاطية وتطريز بسيط على الركبة.',
    colored_at: '2026-10-25T14:00:00.000Z',
    cut_at: '2026-10-28T09:30:00.000Z',
    created_at: '2026-10-25T12:00:00.000Z',
    is_deleted: false,
    timeline: [
      {
        id: 'tl-1',
        stage: 'مرحلة التصميم',
        title: 'إتمام التصميم والتلوين',
        description: 'تم اعتماد درجات الألوان وسحب خامات الميلتون والريب',
        user_name: 'مسؤول التصميم',
        timestamp: '2026-10-25 14:00'
      },
      {
        id: 'tl-2',
        stage: 'في القص',
        title: 'صرف الخامات والبدء بالقص',
        description: 'استلام مقصدار القص عماد عثمان للموديل والبدء بفرش الراقات',
        user_name: 'عماد عثمان',
        timestamp: '2026-10-28 09:30'
      }
    ]
  },
  {
    id: 'mod-3',
    model_code: 'T-88',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=60',
    model_type: 'أطفال / وسط',
    status: 'العد قبل الطباعة',
    size_category_id: 'size-2',
    main_marker_url: 'MK-T88-BODY',
    print_marker_url: 'PR-T88-CHEST',
    target_cut_quantity: 400,
    actual_cut_count: 400,
    cutter_name: 'أحمد إبراهيم',
    count_before_print: 395,
    notes_shirt: 'طباعة حرارية ديجيتال ألوان مائية على صدر التيشرت.',
    notes_pants: 'شورت صيفي قطن 100% مع رباط خصر أبيض.',
    colored_at: '2026-10-20T10:00:00.000Z',
    cut_at: '2026-10-22T11:00:00.000Z',
    created_at: '2026-10-20T09:00:00.000Z',
    is_deleted: false,
    timeline: [
      {
        id: 'tl-1',
        stage: 'مرحلة التصميم',
        title: 'تجهيز الموديل',
        description: 'اعتماد باترون الأطفال الصيفي',
        user_name: 'مسؤول التصميم',
        timestamp: '2026-10-20 10:00'
      },
      {
        id: 'tl-2',
        stage: 'في القص',
        title: 'اكتمال القص',
        description: 'قص 400 قطعة وتحويلها للعد والفرز الأولي قبل الطباعة',
        user_name: 'أحمد إبراهيم',
        timestamp: '2026-10-22 11:00'
      }
    ]
  },
  {
    id: 'mod-4',
    model_code: 'HD-505',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60',
    model_type: 'شبابي',
    status: 'العد بعد الطباعة',
    size_category_id: 'size-3',
    main_marker_url: 'MK-HD505',
    print_marker_url: 'PR-HD505-CHEST',
    target_cut_quantity: 450,
    actual_cut_count: 450,
    count_before_print: 450,
    count_after_print: 442,
    print_house_name: 'مطبعة النجوم الحديثة',
    notes_shirt: 'طباعة ديجيتال صدر وظهر بدقة عالية وسلك سكرين مائي.',
    notes_pants: 'بنطلون باجي جيوب جانبية متعددة.',
    colored_at: '2026-10-18T10:00:00.000Z',
    cut_at: '2026-10-19T11:00:00.000Z',
    created_at: '2026-10-18T09:00:00.000Z',
    is_deleted: false,
    timeline: [
      {
        id: 'tl-1',
        stage: 'في القص',
        title: 'اكتمال القص',
        description: 'تم قص 450 قطعة بنجاح',
        user_name: 'عماد عثمان',
        timestamp: '2026-10-19 11:00'
      },
      {
        id: 'tl-2',
        stage: 'المطابع والتطريز',
        title: 'استلام من المطبعة',
        description: 'تم استلام التشغيلة من مطبعة النجوم الحديثة وتحويلها للعد بعد الطباعة',
        user_name: 'مسؤول المطابع',
        timestamp: '2026-10-24 16:30'
      }
    ]
  },
  {
    id: 'mod-5',
    model_code: 'SW-900',
    image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=500&auto=format&fit=crop&q=60',
    model_type: 'رجالي',
    status: 'في قسم المكن',
    size_category_id: 'size-4',
    main_marker_url: 'MK-SW900',
    print_marker_url: 'PR-SW900',
    target_cut_quantity: 350,
    actual_cut_count: 350,
    count_before_print: 350,
    count_after_print: 348,
    print_house_name: 'مطبعة الأهرام',
    notes_shirt: 'ملاحظات التيشرت: خياطة أوفر 4 فتلة وسنجر نظافة داخلية للرقبة.',
    notes_pants: 'ملاحظات البنطلون: استيك مزدوج وأربطة مدعمة بجرامات معدنية.',
    created_at: '2026-10-15T09:00:00.000Z',
    is_deleted: false,
    timeline: [
      {
        id: 'tl-1',
        stage: 'العد بعد الطباعة',
        title: 'اعتماد العد بعد الطباعة',
        description: 'العدد الفعلي المحصور بعد الطباعة 348 قطعة وتم التحويل لقسم المكن',
        user_name: 'سامح فرز',
        timestamp: '2026-10-27 10:00'
      }
    ]
  }
];

const INITIAL_REQUIREMENTS: ModelRequirement[] = [
  { id: 'req-1', model_id: 'mod-1', color_id: 'col-1', part_name: 'الصدر والظهر', planned_quantity: 45 },
  { id: 'req-2', model_id: 'mod-1', color_id: 'col-6', part_name: 'ياقة ريب مضلع', planned_quantity: 10 },
  { id: 'req-3', model_id: 'mod-2', color_id: 'col-4', part_name: 'جسم السويت شيرت', planned_quantity: 60 },
  { id: 'req-4', model_id: 'mod-3', color_id: 'col-2', part_name: 'الجسم الأساسي', planned_quantity: 40 }
];

const INITIAL_ACCESSORIES: ModelAccessory[] = [
  {
    id: 'macc-1',
    model_id: 'mod-1',
    target_type: 'shirt',
    piece_consumption: 1,
    planned_quantity: 500,
    accessory_id: 'acc-2',
    accessory_code: 'BDG-102',
    accessory_name: 'بادج سيليكون كابتن خاص لموديل M-101',
    unit: 'قطعة'
  },
  {
    id: 'macc-2',
    model_id: 'mod-1',
    target_type: 'shirt',
    piece_consumption: 1,
    planned_quantity: 500,
    accessory_name: 'تيكت رقبة قطني',
    unit: 'قطعة'
  },
  {
    id: 'macc-3',
    model_id: 'mod-1',
    target_type: 'pants',
    piece_consumption: 0.8,
    planned_quantity: 400,
    accessory_name: 'استيك كمر عريض 4 سم',
    unit: 'متر'
  },
  {
    id: 'macc-4',
    model_id: 'mod-2',
    target_type: 'shirt',
    piece_consumption: 1.2,
    planned_quantity: 720,
    accessory_name: 'شريط كابيشو قطن عريض',
    unit: 'متر'
  }
];

const INITIAL_CUTTING_RECORDS: CuttingRecord[] = [
  {
    id: 'cut-1',
    model_id: 'mod-2',
    color_name: 'ML-10 (جسم السويت شيرت)',
    cutter_name: 'عماد عثمان',
    layers_count: 35,
    layer_weight: 1.8,
    pieces_count: 580,
    shade_degree: 'درجة A',
    created_at: '2026-10-28 15:30'
  },
  {
    id: 'cut-2',
    model_id: 'mod-3',
    color_name: 'CT-02 (الجسم الأساسي)',
    cutter_name: 'أحمد إبراهيم',
    layers_count: 40,
    layer_weight: 1.2,
    pieces_count: 400,
    shade_degree: 'صبغة متجانسة',
    created_at: '2026-10-24 13:00'
  }
];

const INITIAL_QC_RECORDS: QCRecord[] = [
  {
    id: 'qc-1',
    model_id: 'mod-3',
    stage: 'before_print',
    color_name: 'CT-02 (الجسم الأساسي)',
    size: '6',
    pieces_cut: 400,
    good_qty: 395,
    defect_qty: 5,
    defect_notes: 'بقعة زيت خفيفة من ماكينة القص تم استبعادها',
    created_at: '2026-10-24 16:00',
    inspector_name: 'سامح فرز'
  },
  {
    id: 'qc-2',
    model_id: 'mod-4',
    stage: 'after_print',
    color_name: 'HD-505',
    size: 'M',
    pieces_cut: 450,
    good_qty: 442,
    defect_qty: 8,
    defect_notes: 'عيوب تسييل ألوان من المطبوعة',
    created_at: '2026-10-25 14:00',
    inspector_name: 'سامح فرز'
  }
];

const INITIAL_PRINT_DISPATCHES: PrintDispatch[] = [
  {
    id: 'disp-1',
    model_id: 'mod-4',
    shop_name: 'مطبعة النجوم الحديثة',
    dispatched_at: '2026-10-22 10:00',
    expected_delivery_date: '2026-10-24',
    pieces_count: 450,
    print_type: 'سلك سكرين مائي 4 لون',
    cost_per_piece: 4.5,
    total_cost: 2025,
    notes: 'تسليم سريع مع تجفيف حراري كامل',
    status: 'تم الاستلام بالمصنع',
    received_at: '2026-10-24 16:30'
  },
  {
    id: 'disp-2',
    model_id: 'mod-3',
    shop_name: 'مطبعة الأهرام الذهبية',
    dispatched_at: '2026-10-26 11:00',
    expected_delivery_date: new Date().toISOString().slice(0, 10),
    pieces_count: 395,
    print_type: 'تطريز ديجيتال كمبيوتر',
    cost_per_piece: 6.0,
    total_cost: 2370,
    notes: 'تطريز لوجو الصدر والظهر',
    status: 'مرسل للمطبعة'
  }
];

const INITIAL_SEWING_DISPATCHES: SewingDispatch[] = [
  {
    id: 'sew-disp-1',
    model_id: 'mod-4',
    workshop_name: 'ورشة الأمل للخياطة',
    pieces_count: 442,
    dispatched_at: '2026-10-25 15:00',
    expected_delivery_date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    status: 'في ورشة المكن',
    notes: 'تشغيل أوفر وسنجر وتجميع التيشرت والبنطلون'
  }
];

const INITIAL_INTERNAL_MESSAGES: InternalMessage[] = [
  {
    id: 'msg-1',
    sender_id: 'user-1',
    sender_name: 'الإدارة العليا (Sudo)',
    receiver_id: 'user-2',
    receiver_name: 'أحمد محمود',
    content: 'مرحباً أحمد، يرجى متابعة مواعيد استلام الموديلات من ورش الخياطة اليوم.',
    created_at: '10:30 ص',
    is_read: true
  },
  {
    id: 'msg-2',
    sender_id: 'user-2',
    sender_name: 'أحمد محمود',
    receiver_id: 'user-1',
    receiver_name: 'الإدارة العليا (Sudo)',
    content: 'تم التأكيد مع ورشة النور لخياطة التيشرت، وسيتم تسليم الدفعة الأولى اليوم بالموعد.',
    created_at: '11:15 ص',
    is_read: false
  }
];


const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    userName: 'مدير النظام (Sudo)',
    action: 'تهيئة النظام',
    details: 'تشغيل نظام إدارة المصنع وإعداد جداول الخامات والموديلات والصلاحيات المتقدمة',
    ip_address: '127.0.0.1',
    timestamp: '2026-10-20 09:00'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadStored = <T,>(key: string, defaultVal: T): T => {
    try {
      const data = localStorage.getItem(`factory_erp_${key}`);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      console.error('Failed to load from localStorage', e);
      return defaultVal;
    }
  };

  const [roles, setRoles] = useState<CustomRole[]>(() => loadStored('roles', INITIAL_ROLES));

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = loadStored<User | null>('current_user', null);
    if (!stored || stored.username === 'admin') {
      return INITIAL_USERS[0];
    }
    return stored;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const stored = loadStored<User[]>('users', INITIAL_USERS);
    if (!stored.some((u) => u.username === 'sudo')) {
      return [INITIAL_USERS[0], ...stored.filter((u) => u.username !== 'admin')];
    }
    return stored;
  });

  const [sizeDefs, setSizeDefs] = useState<SizeDef[]>(() => loadStored('sizes', INITIAL_SIZES));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStored('suppliers', INITIAL_SUPPLIERS));
  const [fabrics, setFabrics] = useState<Fabric[]>(() => loadStored('fabrics', INITIAL_FABRICS));
  const [fabricColors, setFabricColors] = useState<FabricColor[]>(() =>
    loadStored('colors', INITIAL_FABRIC_COLORS)
  );
  const [fabricTransactions, setFabricTransactions] = useState<FabricTransaction[]>(() =>
    loadStored('transactions', INITIAL_TRANSACTIONS)
  );
  const [models, setModels] = useState<DesignModel[]>(() => loadStored('models', INITIAL_MODELS));
  const [requirements, setRequirements] = useState<ModelRequirement[]>(() =>
    loadStored('requirements', INITIAL_REQUIREMENTS)
  );
  const [accessories, setAccessories] = useState<ModelAccessory[]>(() =>
    loadStored('accessories', INITIAL_ACCESSORIES)
  );
  const [accessoryTypes, setAccessoryTypes] = useState<AccessoryType[]>(() =>
    loadStored('acc_types', INITIAL_ACCESSORY_TYPES)
  );
  const [accessoryItems, setAccessoryItems] = useState<AccessoryItem[]>(() =>
    loadStored('acc_items', INITIAL_ACCESSORY_ITEMS)
  );
  const [accessoryTransactions, setAccessoryTransactions] = useState<AccessoryTransaction[]>(() =>
    loadStored('acc_transactions', INITIAL_ACCESSORY_TRANSACTIONS)
  );
  const [cuttingRecords, setCuttingRecords] = useState<CuttingRecord[]>(() =>
    loadStored('cutting', INITIAL_CUTTING_RECORDS)
  );
  const [qcRecords, setQcRecords] = useState<QCRecord[]>(() => loadStored('qc', INITIAL_QC_RECORDS));
  const [printDispatches, setPrintDispatches] = useState<PrintDispatch[]>(() =>
    loadStored('print_dispatches', INITIAL_PRINT_DISPATCHES)
  );
  const [sewingDispatches, setSewingDispatches] = useState<SewingDispatch[]>(() =>
    loadStored('sewing_dispatches', INITIAL_SEWING_DISPATCHES)
  );
  const [internalMessages, setInternalMessages] = useState<InternalMessage[]>(() =>
    loadStored('internal_messages', INITIAL_INTERNAL_MESSAGES)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStored('logs', INITIAL_LOGS));
  const [flashMessages, setFlashMessages] = useState<FlashMessage[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('erp_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Auto-sync state to localStorage
  useEffect(() => {
    localStorage.setItem('factory_erp_internal_messages', JSON.stringify(internalMessages));
  }, [internalMessages]);
  useEffect(() => {
    localStorage.setItem('factory_erp_roles', JSON.stringify(roles));
  }, [roles]);
  useEffect(() => {
    localStorage.setItem('factory_erp_current_user', JSON.stringify(currentUser));
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem('factory_erp_users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem('factory_erp_sizes', JSON.stringify(sizeDefs));
  }, [sizeDefs]);
  useEffect(() => {
    localStorage.setItem('factory_erp_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);
  useEffect(() => {
    localStorage.setItem('factory_erp_fabrics', JSON.stringify(fabrics));
  }, [fabrics]);
  useEffect(() => {
    localStorage.setItem('factory_erp_colors', JSON.stringify(fabricColors));
  }, [fabricColors]);
  useEffect(() => {
    localStorage.setItem('factory_erp_transactions', JSON.stringify(fabricTransactions));
  }, [fabricTransactions]);
  useEffect(() => {
    localStorage.setItem('factory_erp_acc_types', JSON.stringify(accessoryTypes));
  }, [accessoryTypes]);
  useEffect(() => {
    localStorage.setItem('factory_erp_acc_items', JSON.stringify(accessoryItems));
  }, [accessoryItems]);
  useEffect(() => {
    localStorage.setItem('factory_erp_acc_transactions', JSON.stringify(accessoryTransactions));
  }, [accessoryTransactions]);
  useEffect(() => {
    localStorage.setItem('factory_erp_models', JSON.stringify(models));
  }, [models]);
  useEffect(() => {
    localStorage.setItem('factory_erp_requirements', JSON.stringify(requirements));
  }, [requirements]);
  useEffect(() => {
    localStorage.setItem('factory_erp_accessories', JSON.stringify(accessories));
  }, [accessories]);
  useEffect(() => {
    localStorage.setItem('factory_erp_cutting', JSON.stringify(cuttingRecords));
  }, [cuttingRecords]);
  useEffect(() => {
    localStorage.setItem('factory_erp_qc', JSON.stringify(qcRecords));
  }, [qcRecords]);
  useEffect(() => {
    localStorage.setItem('factory_erp_print_dispatches', JSON.stringify(printDispatches));
  }, [printDispatches]);
  useEffect(() => {
    localStorage.setItem('factory_erp_sewing_dispatches', JSON.stringify(sewingDispatches));
  }, [sewingDispatches]);
  useEffect(() => {
    localStorage.setItem('factory_erp_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Flash message handler
  const addFlashMessage = (text: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
    const id = 'flash-' + Date.now() + Math.random().toString(36).substr(2, 4);
    setFlashMessages((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      removeFlashMessage(id);
    }, 4500);
  };

  const removeFlashMessage = (id: string) => {
    setFlashMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const logAction = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      userName: currentUser?.real_name || currentUser?.username || 'مستخدم غير معروف',
      userId: currentUser?.id,
      action,
      details,
      ip_address: '192.168.1.10',
      timestamp: new Date().toLocaleString('ar-EG', { hour12: false })
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 200)]);
  };

  const addModelTimelineEvent = (
    modelId: string,
    event: Omit<ModelTimelineEvent, 'id' | 'timestamp'>
  ) => {
    const newEvent: ModelTimelineEvent = {
      ...event,
      id: 'tl-' + Date.now(),
      timestamp: new Date().toLocaleString('ar-EG', { hour12: false })
    };
    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== modelId) return m;
        return {
          ...m,
          timeline: [newEvent, ...(m.timeline || [])]
        };
      })
    );
  };

  // Dynamic Role Management
  const addRole = (data: Omit<CustomRole, 'id'>) => {
    const newRole: CustomRole = {
      ...data,
      id: 'role-' + Date.now(),
      users_count: 0,
      created_at: new Date().toISOString()
    };
    setRoles((prev) => [...prev, newRole]);
    logAction('الصلاحيات', `إنشاء دور وظيفي جديد: ${newRole.name}`);
    addFlashMessage(`تم إنشاء الدور "${newRole.name}" بنجاح`);
  };

  const updateRole = (id: string, updates: Partial<CustomRole>) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    logAction('الصلاحيات', `تحديث صلاحيات الدور: ${updates.name || id}`);
    addFlashMessage('تم تحديث الدور الوظيفي بنجاح');
  };

  const deleteRole = (id: string): { success: boolean; message: string } => {
    const roleUsers = users.filter((u) => u.role_id === id);
    if (roleUsers.length > 0) {
      return {
        success: false,
        message: `لا يمكن حذف هذا الدور لوجود ${roleUsers.length} موظف مرتبط به حالياً.`
      };
    }
    const role = roles.find((r) => r.id === id);
    setRoles((prev) => prev.filter((r) => r.id !== id));
    logAction('الصلاحيات', `حذف الدور: ${role?.name || id}`);
    addFlashMessage('تم حذف الدور الوظيفي بنجاح');
    return { success: true, message: 'تم الحذف بنجاح' };
  };

  // Permission Resolver
  const getUserPermissionsObject = (): RolePermissions | null => {
    if (!currentUser) return null;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) {
      return {
        fabric_warehouse_view: true,
        fabric_warehouse_edit: true,
        accessories_warehouse_view: true,
        accessories_warehouse_edit: true,
        production_warehouse_view: true,
        production_warehouse_edit: true,
        design_view: true,
        design_edit: true,
        cutting_view: true,
        cutting_edit: true,
        qc_view: true,
        qc_edit: true,
        printing_view: true,
        printing_edit: true,
        sewing_view: true,
        sewing_edit: true,
        models_tracking_view: true,
        models_tracking_edit: true,
        reports_view: true,
        reports_edit: true,
        view_fabric_prices: true,
        edit_fabric_prices: true,
        view_accessory_prices: true,
        edit_accessory_prices: true,
        view_printing_costs: true,
        edit_printing_costs: true,
        send_whatsapp_requests: true,
        send_internal_messages: true
      };
    }

    if (currentUser.role_id) {
      const role = roles.find((r) => r.id === currentUser.role_id);
      if (role?.permissions) return role.permissions;
    }
    const roleByName = roles.find((r) => r.name === currentUser.role);
    if (roleByName?.permissions) return roleByName.permissions;
    return null;
  };

  const hasPermission = (
    module: SystemSectionKey | 'warehouse' | 'design' | 'cutting' | 'qc' | 'reports',
    requireEdit: boolean = false
  ): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;

    const rolePerms = getUserPermissionsObject();

    if (module === 'warehouse') {
      if (rolePerms) {
        if (requireEdit) {
          return (
            rolePerms.fabric_warehouse_edit ||
            rolePerms.accessories_warehouse_edit ||
            rolePerms.production_warehouse_edit
          );
        }
        return (
          rolePerms.fabric_warehouse_view ||
          rolePerms.accessories_warehouse_view ||
          rolePerms.production_warehouse_view
        );
      }
      const lvl = currentUser.permissions?.warehouse;
      if (!lvl) return false;
      return requireEdit ? lvl === 'edit' : true;
    }

    const key = module as SystemSectionKey;
    if (rolePerms) {
      const viewKey = `${key}_view` as keyof RolePermissions;
      const editKey = `${key}_edit` as keyof RolePermissions;
      if (requireEdit) return Boolean(rolePerms[editKey]);
      return Boolean(rolePerms[viewKey]);
    }

    const legacyLevel = (currentUser.permissions as any)?.[module];
    if (!legacyLevel) return false;
    return requireEdit ? legacyLevel === 'edit' : true;
  };

  // Fine-grained financial & sensitive permission checkers
  const canViewFabricPrices = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.view_fabric_prices !== undefined) return p.view_fabric_prices;
    return Boolean(currentUser.permissions?.view_fabric_prices);
  };

  const canEditFabricPrices = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.edit_fabric_prices !== undefined) return p.edit_fabric_prices;
    return Boolean(currentUser.permissions?.edit_fabric_prices);
  };

  const canViewAccessoryPrices = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.view_accessory_prices !== undefined) return p.view_accessory_prices;
    return Boolean(currentUser.permissions?.view_accessory_prices);
  };

  const canEditAccessoryPrices = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.edit_accessory_prices !== undefined) return p.edit_accessory_prices;
    return Boolean(currentUser.permissions?.edit_accessory_prices);
  };

  const canViewPrintingCosts = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.view_printing_costs !== undefined) return p.view_printing_costs;
    return Boolean(currentUser.permissions?.view_printing_costs);
  };

  const canEditPrintingCosts = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.edit_printing_costs !== undefined) return p.edit_printing_costs;
    return Boolean(currentUser.permissions?.edit_printing_costs);
  };

  const canSendWhatsApp = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.send_whatsapp_requests !== undefined) return p.send_whatsapp_requests;
    return Boolean(currentUser.permissions?.send_whatsapp_requests);
  };

  const canSendMessages = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.send_internal_messages !== undefined) return p.send_internal_messages;
    return Boolean(currentUser.permissions?.send_internal_messages);
  };

  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    return internalMessages.filter(
      (m) => (m.receiver_id === currentUser.id || m.receiver_id === currentUser.username) && !m.is_read
    ).length;
  }, [internalMessages, currentUser]);

  const sendInternalMessage = (receiverId: string, content: string): { success: boolean; message: string } => {
    if (!canSendMessages()) {
      addFlashMessage('ليس لديك صلاحية إرسال الرسائل والمراسلات الداخلية. يرجى مراجعة إدارة Sudo.', 'danger');
      return { success: false, message: 'ليس لديك صلاحية إرسال الرسائل الداخلية' };
    }
    if (!content.trim()) {
      return { success: false, message: 'لا يمكن إرسال رسالة فارغة' };
    }
    const receiver = users.find((u) => u.id === receiverId || u.username === receiverId);
    if (!receiver) {
      return { success: false, message: 'المستلم المحدد غير موجود' };
    }

    const newMsg: InternalMessage = {
      id: 'msg-' + Date.now(),
      sender_id: currentUser?.id || 'user-1',
      sender_name: currentUser?.real_name || 'الإدارة العليا (Sudo)',
      receiver_id: receiver.id,
      receiver_name: receiver.real_name,
      content: content.trim(),
      created_at: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      is_read: false
    };

    setInternalMessages((prev) => [...prev, newMsg]);
    logAction('المراسلات الداخلية', `إرسال رسالة من ${currentUser?.real_name} إلى ${receiver.real_name}`);
    addFlashMessage(`تم إرسال الرسالة إلى ${receiver.real_name} بنجاح`, 'success');
    return { success: true, message: 'تم إرسال الرسالة بنجاح' };
  };

  const markMessageRead = (messageId: string) => {
    setInternalMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
    );
  };

  // Warehouse Actions
  const addFabricOrColor = (data: {
    fabricId?: string;
    newFabricName?: string;
    unit?: 'توب' | 'كيلو' | 'متر';
    colorCode: string;
    colorName?: string;
    hexCode?: string;
    quantity: number;
    supplierId?: string;
  }) => {
    let targetFabricId = data.fabricId;

    if (!targetFabricId && data.newFabricName?.trim()) {
      const newFab: Fabric = {
        id: 'fab-' + Date.now(),
        name: data.newFabricName.trim(),
        description: '',
        unit: data.unit || 'كيلو',
        supplier_id: data.supplierId
      };
      setFabrics((prev) => [...prev, newFab]);
      targetFabricId = newFab.id;
      logAction('المخزن', `إضافة خامة قماش جديدة: ${newFab.name}`);
    }

    if (!targetFabricId) {
      return { success: false, message: 'يجب اختيار خامة أو كتابة اسم خامة جديدة', fabricId: '' };
    }

    const cleanCode = data.colorCode.trim().toUpperCase();
    const existingColor = fabricColors.find(
      (c) => c.fabric_id === targetFabricId && c.color_code.toUpperCase() === cleanCode
    );

    if (existingColor) {
      setFabricColors((prev) =>
        prev.map((c) =>
          c.id === existingColor.id
            ? { ...c, quantity: Number((c.quantity + data.quantity).toFixed(2)) }
            : c
        )
      );
      addFlashMessage(`تمت زيادة كمية اللون ${cleanCode} بمقدار ${data.quantity}`);
    } else {
      const newColor: FabricColor = {
        id: 'col-' + Date.now(),
        fabric_id: targetFabricId,
        color_code: cleanCode,
        color_name: data.colorName || '',
        hex_code: data.hexCode || '#64748b',
        price_per_unit: 0,
        quantity: Math.max(0, data.quantity),
        reserved_quantity: 0
      };
      setFabricColors((prev) => [...prev, newColor]);
      addFlashMessage(`تم تسجيل اللون الجديد ${cleanCode} بنجاح`);
    }

    logAction('المخزن', `استلام كمية ${data.quantity} للون ${cleanCode}`);
    return { success: true, message: 'تم الحفظ بنجاح', fabricId: targetFabricId };
  };

  const recordTransaction = (data: {
    colorId: string;
    operation: 'add' | 'deduct';
    amount: number;
    modelCodeRef?: string;
    notes?: string;
  }) => {
    const color = fabricColors.find((c) => c.id === data.colorId);
    if (!color) return { success: false, message: 'اللون غير موجود' };
    if (data.amount <= 0) return { success: false, message: 'الكمية يجب أن تكون أكبر من صفر' };

    if (data.operation === 'deduct') {
      if (color.quantity < data.amount) {
        return { success: false, message: 'الكمية الموجودة بالمخزن لا تكفي للصرف' };
      }
    }

    setFabricColors((prev) =>
      prev.map((c) => {
        if (c.id !== data.colorId) return c;
        const newQty =
          data.operation === 'add'
            ? Number((c.quantity + data.amount).toFixed(2))
            : Number((c.quantity - data.amount).toFixed(2));
        return { ...c, quantity: Math.max(0, newQty) };
      })
    );

    const transaction: FabricTransaction = {
      id: 'tr-' + Date.now(),
      color_id: data.colorId,
      fabric_id: color.fabric_id,
      model_code_ref: data.modelCodeRef || '',
      notes: data.notes || '',
      operation: data.operation,
      amount: data.amount,
      timestamp: new Date().toLocaleString('ar-EG', { hour12: false })
    };
    setFabricTransactions((prev) => [transaction, ...prev]);

    const opText = data.operation === 'add' ? 'إضافة / مرتجع' : 'صرف للمقص';
    logAction('المخزن', `حركة ${opText} بمقدار ${data.amount} للون ${color.color_code}`);
    addFlashMessage(`تم تنفيذ حركة ${opText} بنجاح`);
    return { success: true, message: 'تم تنفيذ الحركة بنجاح' };
  };

  const exportWarehouseInventoryCsv = () => {
    const headers = ['الخامة', 'كود اللون', 'اسم اللون', 'الكمية الفعلية', 'الكمية المحجوزة', 'المتاح للتصميم', 'الوحدة'];
    const rows = fabricColors.map((color) => {
      const fabric = fabrics.find((f) => f.id === color.fabric_id);
      const available = color.quantity - color.reserved_quantity;
      return [
        fabric?.name || 'غير معروف',
        color.color_code,
        color.color_name || '-',
        color.quantity.toString(),
        color.reserved_quantity.toString(),
        available.toString(),
        fabric?.unit || 'كيلو'
      ];
    });

    const csvContent =
      '\ufeff' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `warehouse_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logAction('المخزن', 'تصدير تقرير جرد المخزن إلى ملف إكسيل');
    addFlashMessage('تم تحميل شيت جرد المخزن بنجاح');
  };

  const updateColorPrice = (colorId: string, price: number) => {
    setFabricColors((prev) =>
      prev.map((c) => (c.id === colorId ? { ...c, price_per_unit: Math.max(0, price) } : c))
    );
    addFlashMessage('تم تحديث سعر خامة القماش بنجاح');
  };

  // Accessories Actions
  const addAccessoryType = (name: string, description: string = '') => {
    const trimmed = name.trim();
    const existing = accessoryTypes.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;
    const newId = 'type-' + Date.now();
    const newType: AccessoryType = {
      id: newId,
      name: trimmed,
      description
    };
    setAccessoryTypes((prev) => [...prev, newType]);
    logAction('مخزن الإكسسوارات', `إضافة تصنيف إكسسوار جديد: ${trimmed}`);
    addFlashMessage(`تم إضافة تصنيف "${trimmed}" بنجاح`);
    return newId;
  };

  const addAccessoryItem = (data: {
    type_id: string;
    type_name?: string;
    code: string;
    name: string;
    image?: string;
    unit: AccessoryUnit;
    quantity: number;
    price_per_unit: number;
    supplier_id?: string;
    min_threshold: number;
    usage_type?: AccessoryUsageType;
    custom_model_code?: string;
    target_quantity?: number;
    delivered_quantity?: number;
  }) => {
    const cleanCode = data.code.trim().toUpperCase();
    const existing = accessoryItems.find((a) => a.code.toUpperCase() === cleanCode);
    if (existing) {
      return { success: false, message: 'كود الإكسسوار مستخدم بالفعل!', itemId: '' };
    }

    const matchedType = accessoryTypes.find((t) => t.id === data.type_id);
    const newItemId = 'acc-' + Date.now();
    const usageType = data.usage_type || 'stock';
    const targetQty = usageType === 'custom_model' ? (data.target_quantity || data.min_threshold) : data.min_threshold;
    const deliveredQty = usageType === 'custom_model' ? (data.delivered_quantity ?? data.quantity) : data.quantity;

    const newItem: AccessoryItem = {
      id: newItemId,
      type_id: data.type_id,
      type_name: matchedType?.name || data.type_name || 'عام',
      code: cleanCode,
      name: data.name.trim(),
      image:
        data.image ||
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=60',
      unit: data.unit,
      quantity: Math.max(0, data.quantity),
      reserved_quantity: 0,
      price_per_unit: Math.max(0, data.price_per_unit),
      supplier_id: data.supplier_id,
      min_threshold: Math.max(0, data.min_threshold),
      usage_type: usageType,
      custom_model_code: data.custom_model_code?.trim(),
      target_quantity: targetQty,
      delivered_quantity: deliveredQty,
      withdrawn_for_model: false,
      created_at: new Date().toISOString().slice(0, 10)
    };

    setAccessoryItems((prev) => [newItem, ...prev]);
    logAction('مخزن الإكسسوارات', `إضافة إكسسوار جديد: ${newItem.name} (${newItem.code})`);
    addFlashMessage(`تم إضافة صنف الإكسسوار "${newItem.name}" بنجاح`);
    return { success: true, message: 'تم الحفظ بنجاح', itemId: newItemId };
  };

  const updateAccessoryItem = (id: string, updates: Partial<AccessoryItem>) => {
    setAccessoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    logAction('مخزن الإكسسوارات', `تعديل بيانات الصنف: ${updates.name || id}`);
    addFlashMessage('تم تحديث بيانات الصنف بنجاح');
  };

  const deleteAccessoryItem = (id: string) => {
    const item = accessoryItems.find((a) => a.id === id);
    if (!item) return { success: false, message: 'الصنف غير موجود' };
    if (item.reserved_quantity > 0) {
      return { success: false, message: 'لا يمكن حذف صنف محجوز منه كميات لموديلات تحت التشغيل!' };
    }
    setAccessoryItems((prev) => prev.filter((a) => a.id !== id));
    logAction('مخزن الإكسسوارات', `حذف صنف إكسسوار: ${item.name}`);
    addFlashMessage('تم حذف الصنف بنجاح');
    return { success: true, message: 'تم حذف الصنف بنجاح' };
  };

  const markAccessoryWithdrawn = (accessoryId: string) => {
    setAccessoryItems((prev) =>
      prev.map((item) => {
        if (item.id !== accessoryId) return item;
        return {
          ...item,
          withdrawn_for_model: true
        };
      })
    );
    addFlashMessage('تم تسجيل سحب الإكسسوار بالكامل للموديل بنجاح');
  };

  const recordAccessoryTransaction = (data: {
    accessoryId: string;
    operation: 'add' | 'deduct';
    amount: number;
    modelCodeRef?: string;
    notes?: string;
  }) => {
    const item = accessoryItems.find((a) => a.id === data.accessoryId);
    if (!item) return { success: false, message: 'الصنف غير موجود' };
    if (data.amount <= 0) return { success: false, message: 'الكمية يجب أن تكون أكبر من صفر' };

    if (data.operation === 'deduct') {
      if (item.quantity < data.amount) {
        return { success: false, message: 'الرصيد المتاح لا يكفي للصرف' };
      }
    }

    setAccessoryItems((prev) =>
      prev.map((a) => {
        if (a.id !== data.accessoryId) return a;
        const newQty =
          data.operation === 'add'
            ? Number((a.quantity + data.amount).toFixed(2))
            : Number((a.quantity - data.amount).toFixed(2));
        
        let newDelivered = a.delivered_quantity;
        if (a.usage_type === 'custom_model' && data.operation === 'add') {
          newDelivered = Number(((a.delivered_quantity || 0) + data.amount).toFixed(2));
        }

        return {
          ...a,
          quantity: Math.max(0, newQty),
          delivered_quantity: newDelivered
        };
      })
    );

    const transaction: AccessoryTransaction = {
      id: 'acc-tr-' + Date.now(),
      accessory_id: item.id,
      accessory_code: item.code,
      accessory_name: item.name,
      operation: data.operation,
      amount: data.amount,
      model_code_ref: data.modelCodeRef || '',
      notes: data.notes || '',
      timestamp: new Date().toLocaleString('ar-EG', { hour12: false })
    };
    setAccessoryTransactions((prev) => [transaction, ...prev]);

    const opText = data.operation === 'add' ? 'إضافة / توريد' : 'صرف للتشغيل';
    logAction('مخزن الإكسسوارات', `حركة ${opText} بمقدار ${data.amount} للصنف ${item.code}`);
    addFlashMessage(`تم تسجيل حركة ${opText} بنجاح`);
    return { success: true, message: 'تم تنفيذ الحركة بنجاح' };
  };

  const exportAccessoryInventoryCsv = () => {
    const headers = [
      'التصنيف',
      'الكود',
      'الاسم',
      'النوع',
      'الرصيد الحالي',
      'المحجوز',
      'المتاح',
      'الحد الأدنى / المطلوب',
      'الوحدة'
    ];
    const rows = accessoryItems.map((a) => [
      a.type_name,
      a.code,
      a.name,
      a.usage_type === 'custom_model' ? `خاص بموديل ${a.custom_model_code || ''}` : 'رصيد مستمر',
      a.quantity.toString(),
      a.reserved_quantity.toString(),
      (a.quantity - a.reserved_quantity).toString(),
      (a.usage_type === 'custom_model' ? a.target_quantity || a.min_threshold : a.min_threshold).toString(),
      a.unit
    ]);

    const csvContent =
      '\ufeff' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `accessories_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logAction('مخزن الإكسسوارات', 'تصدير شيت جرد الإكسسوارات إلى إكسيل');
    addFlashMessage('تم تصدير جرد الإكسسوارات بنجاح');
  };

  // Design Actions
  const addDesignModel = (data: {
    modelCode: string;
    modelType: string;
    sizeCategoryId?: string;
    imageUrl?: string;
    targetCutQuantity?: number;
    notesShirt?: string;
    notesPants?: string;
  }) => {
    const cleanCode = data.modelCode.trim().toUpperCase();
    const existing = models.find((m) => !m.is_deleted && m.model_code.toUpperCase() === cleanCode);
    if (existing) {
      addFlashMessage('كود الموديل مستخدم بالفعل!', 'danger');
      return { success: false, message: 'كود الموديل مستخدم بالفعل!' };
    }

    const newModelId = 'mod-' + Date.now();
    const targetCutQty = data.targetCutQuantity || 100;

    const newModel: DesignModel = {
      id: newModelId,
      model_code: cleanCode,
      model_type: data.modelType,
      size_category_id: data.sizeCategoryId,
      image:
        data.imageUrl ||
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60',
      status: 'مرحلة التصميم',
      main_marker_url: '',
      print_marker_url: '',
      target_cut_quantity: targetCutQty,
      notes_shirt: data.notesShirt || '',
      notes_pants: data.notesPants || '',
      created_at: new Date().toISOString(),
      is_deleted: false,
      timeline: [
        {
          id: 'tl-' + Date.now(),
          stage: 'مرحلة التصميم',
          title: 'إنشاء الموديل الجديد',
          description: `تم إنشاء الموديل بالعدد المستهدف للقص: ${targetCutQty} قطعة`,
          user_name: currentUser?.real_name || 'مسؤول التصميم',
          timestamp: new Date().toLocaleString('ar-EG', { hour12: false })
        }
      ]
    };

    setModels((prev) => [newModel, ...prev]);
    logAction('التصميم', `إنشاء موديل جديد: ${cleanCode}`);
    addFlashMessage(`تم إنشاء الموديل ${cleanCode} بنجاح`);
    return { success: true, message: 'تم إنشاء الموديل بنجاح', modelId: newModelId };
  };

  const updateModelPlan = (data: {
    modelId: string;
    reqQuantities: Record<string, number>;
    accQuantities: Record<string, number>;
    mainMarkerUrl?: string;
    printMarkerUrl?: string;
    notesShirt?: string;
    notesPants?: string;
    targetCutQuantity?: number;
  }) => {
    const model = models.find((m) => m.id === data.modelId);
    if (!model) return { success: false, message: 'الموديل غير موجود' };

    setRequirements((prev) =>
      prev.map((r) => {
        if (r.model_id !== data.modelId) return r;
        const newQty = data.reqQuantities[r.id];
        return newQty !== undefined ? { ...r, planned_quantity: Math.max(0, newQty) } : r;
      })
    );

    setAccessories((prev) =>
      prev.map((a) => {
        if (a.model_id !== data.modelId) return a;
        const newQty = data.accQuantities[a.id];
        return newQty !== undefined ? { ...a, planned_quantity: Math.max(0, newQty) } : a;
      })
    );

    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== data.modelId) return m;
        return {
          ...m,
          main_marker_url: data.mainMarkerUrl ?? m.main_marker_url,
          print_marker_url: data.printMarkerUrl ?? m.print_marker_url,
          notes_shirt: data.notesShirt ?? m.notes_shirt,
          notes_pants: data.notesPants ?? m.notes_pants,
          target_cut_quantity: data.targetCutQuantity ?? m.target_cut_quantity
        };
      })
    );

    logAction('التصميم', `تحديث خطة وخامات الموديل ${model.model_code}`);
    addFlashMessage('تم حفظ تفاصيل وملاحظات الموديل بنجاح');
    return { success: true, message: 'تم حفظ الخطة بنجاح' };
  };

  const updateModelNotesAndTarget = (
    modelId: string,
    data: {
      target_cut_quantity?: number;
      notes_shirt?: string;
      notes_pants?: string;
    }
  ) => {
    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== modelId) return m;
        return {
          ...m,
          ...(data.target_cut_quantity !== undefined ? { target_cut_quantity: data.target_cut_quantity } : {}),
          ...(data.notes_shirt !== undefined ? { notes_shirt: data.notes_shirt } : {}),
          ...(data.notes_pants !== undefined ? { notes_pants: data.notes_pants } : {})
        };
      })
    );
    addFlashMessage('تم تحديث بيانات وملاحظات التشغيل بنجاح');
  };

  const addModelRequirement = (modelId: string, colorId: string, partName: string) => {
    const newReq: ModelRequirement = {
      id: 'req-' + Date.now(),
      model_id: modelId,
      color_id: colorId,
      part_name: partName.trim(),
      planned_quantity: 0
    };
    setRequirements((prev) => [...prev, newReq]);
    addFlashMessage('تمت إضافة خامة اللون بنجاح');
  };

  const deleteModelRequirement = (reqId: string) => {
    setRequirements((prev) => prev.filter((r) => r.id !== reqId));
    addFlashMessage('تم حذف الخامة من الموديل');
  };

  const addModelAccessory = (
    modelId: string,
    accessory: {
      id?: string;
      code?: string;
      name: string;
      unit?: string;
      image?: string;
      target_type?: 'shirt' | 'pants';
      piece_consumption?: number;
      planned_quantity?: number;
    }
  ) => {
    const targetModel = models.find((m) => m.id === modelId);
    const targetCut = targetModel?.target_cut_quantity || 100;
    const pieceConsumption = accessory.piece_consumption || 1;
    const plannedQty = accessory.planned_quantity ?? Math.round(pieceConsumption * targetCut);

    const newAcc: ModelAccessory = {
      id: 'macc-' + Date.now(),
      model_id: modelId,
      accessory_id: accessory.id,
      accessory_code: accessory.code,
      accessory_name: accessory.name,
      unit: accessory.unit || 'قطعة',
      image: accessory.image,
      target_type: accessory.target_type || 'shirt',
      piece_consumption: pieceConsumption,
      planned_quantity: plannedQty
    };
    setAccessories((prev) => [...prev, newAcc]);
    addFlashMessage(`تمت إضافة إكسسوار "${accessory.name}" إلى ${accessory.target_type === 'pants' ? 'البنطلون' : 'التيشرت'}`);
    return { success: true, message: 'تمت الإضافة بنجاح' };
  };

  const deleteModelAccessory = (accId: string) => {
    setAccessories((prev) => prev.filter((a) => a.id !== accId));
    addFlashMessage('تم إزالة الإكسسوار من الموديل');
  };

  const issueFabricToCutting = (modelId: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    if (!targetModel) return { success: false, message: 'الموديل غير موجود' };

    const modelReqs = requirements.filter((r) => r.model_id === modelId);
    const modelAccs = accessories.filter((a) => a.model_id === modelId);

    // Deduct fabric
    let newColors = [...fabricColors];
    const newTrans: FabricTransaction[] = [];
    for (const req of modelReqs) {
      if (req.planned_quantity > 0) {
        newColors = newColors.map((col) => {
          if (col.id === req.color_id) {
            const nextQty = Math.max(0, Number((col.quantity - req.planned_quantity).toFixed(2)));
            return { ...col, quantity: nextQty };
          }
          return col;
        });
        const colorObj = fabricColors.find((c) => c.id === req.color_id);
        newTrans.push({
          id: 'tr-' + Date.now() + Math.random().toString(36).slice(2, 6),
          color_id: req.color_id,
          fabric_id: colorObj?.fabric_id || '',
          model_code_ref: targetModel.model_code,
          notes: `صرف خامات للقص - قطعة: ${req.part_name}`,
          operation: 'deduct',
          amount: req.planned_quantity,
          timestamp: new Date().toLocaleString('ar-EG', { hour12: false })
        });
      }
    }
    setFabricColors(newColors);
    setFabricTransactions((prev) => [...newTrans, ...prev]);

    // Deduct accessories
    let newAccItems = [...accessoryItems];
    const newAccTrans: AccessoryTransaction[] = [];
    for (const acc of modelAccs) {
      const plannedQty = Number(acc.planned_quantity) || 0;
      if (acc.accessory_id && plannedQty > 0) {
        newAccItems = newAccItems.map((item) => {
          if (item.id === acc.accessory_id) {
            const nextQty = Math.max(0, Number((item.quantity - plannedQty).toFixed(2)));
            return { ...item, quantity: nextQty };
          }
          return item;
        });
        newAccTrans.push({
          id: 'acc-tr-' + Date.now() + Math.random().toString(36).slice(2, 6),
          accessory_id: acc.accessory_id,
          accessory_code: acc.accessory_code || '',
          accessory_name: acc.accessory_name,
          operation: 'deduct',
          amount: plannedQty,
          model_code_ref: targetModel.model_code,
          notes: `صرف إكسسوار للتشغيل والقص (${acc.target_type === 'pants' ? 'بنطلون' : 'تيشرت'}) - موديل: ${targetModel.model_code}`,
          timestamp: new Date().toLocaleString('ar-EG', { hour12: false })
        });
      }
    }
    setAccessoryItems(newAccItems);
    setAccessoryTransactions((prev) => [...newAccTrans, ...prev]);

    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: 'في القص', cut_at: new Date().toISOString() } : m))
    );

    addModelTimelineEvent(modelId, {
      stage: 'في القص',
      title: 'صرف الخامات والتحويل لقسم القص',
      description: `تم صرف الأقمشة والإكسسوارات للعدد المستهدف ${targetModel.target_cut_quantity} قطعة`,
      user_name: currentUser?.real_name || 'مسؤول التصميم'
    });

    logAction('التصميم', `صرف خامات وإكسسوارات الموديل ${targetModel.model_code} وتحويله للقص`);
    addFlashMessage('تم صرف الأقمشة والإكسسوارات وتحويل الموديل للقص بنجاح');
    return { success: true, message: 'تم صرف الخامات والإكسسوارات وتحويل الموديل للقص.' };
  };

  const deleteDesignModel = (modelId: string) => {
    const target = models.find((m) => m.id === modelId);
    if (!target) return;
    setModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, is_deleted: true } : m)));
    logAction('التصميم', `تم حذف الموديل ${target.model_code}`);
    addFlashMessage(`تم حذف الموديل ${target.model_code}`);
  };

  // Cutting Actions
  const addCuttingRecord = (data: {
    modelId: string;
    colorName: string;
    cutterName: string;
    layersCount: number;
    layerWeight: number;
    piecesCount: number;
    shadeDegree?: string;
  }) => {
    const newRecord: CuttingRecord = {
      id: 'cut-' + Date.now(),
      model_id: data.modelId,
      color_name: data.colorName,
      colorName: data.colorName,
      cutter_name: data.cutterName.trim(),
      cutterName: data.cutterName.trim(),
      layers_count: Math.max(0, data.layersCount),
      layersCount: Math.max(0, data.layersCount),
      layer_weight: Math.max(0, data.layerWeight),
      layerWeight: Math.max(0, data.layerWeight),
      pieces_count: Math.max(0, data.piecesCount),
      piecesCount: Math.max(0, data.piecesCount),
      shade_degree: data.shadeDegree?.trim() || '',
      shadeDegree: data.shadeDegree?.trim() || '',
      created_at: new Date().toLocaleString('ar-EG', { hour12: false })
    };
    setCuttingRecords((prev) => [newRecord, ...prev]);

    // Update actual cut count and cutter name on model
    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== data.modelId) return m;
        const newTotal = (m.actual_cut_count || 0) + data.piecesCount;
        return {
          ...m,
          actual_cut_count: newTotal,
          cutter_name: data.cutterName.trim()
        };
      })
    );

    addModelTimelineEvent(data.modelId, {
      stage: 'في القص',
      title: `تسجيل راق قص (${data.piecesCount} قطعة)`,
      description: `بواسطة المقصدار: ${data.cutterName} | عدد الراقات: ${data.layersCount} | وزن: ${data.layerWeight} كجم`,
      user_name: data.cutterName
    });

    logAction('القص', `تسجيل راق قص للموديل: ${data.piecesCount} قطعة`);
    addFlashMessage(`تم تسجيل الراق بنجاح (${data.piecesCount} قطعة)`);
  };

  const finishCuttingToQC = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: 'العد قبل الطباعة' } : m))
    );

    addModelTimelineEvent(modelId, {
      stage: 'العد قبل الطباعة',
      title: 'إنهاء القص والتحويل للعد قبل الطباعة',
      description: `إجمالي القطع المقصوصة: ${model?.actual_cut_count || 0} قطعة`,
      user_name: currentUser?.real_name || 'مسؤول القص'
    });

    logAction('القص', `إنهاء قص الموديل ${model?.model_code} وتحويله للعد والفرز قبل الطباعة`);
    addFlashMessage('تم إنهاء القص وتحويل الموديل لقسم الفرز (العد قبل الطباعة) بنجاح');
  };

  const exportCuttingCsv = (modelId: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    const records = cuttingRecords.filter((r) => r.model_id === modelId);
    const headers = ['كود الموديل', 'اللون / القطعة', 'اسم المقصدار', 'عدد الرقات', 'وزن الراق (كجم)', 'القطع المنتجة', 'درجة الصبغة', 'تاريخ ووقت التسجيل'];
    const rows = records.map((r) => [
      targetModel?.model_code || modelId,
      r.color_name,
      r.cutter_name,
      r.layers_count.toString(),
      r.layer_weight.toString(),
      r.pieces_count.toString(),
      r.shade_degree || '-',
      r.created_at
    ]);

    const csvContent =
      '\ufeff' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cutting_${targetModel?.model_code || 'records'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logAction('القص', `تصدير سجل القص للموديل ${targetModel?.model_code} إلى إكسيل`);
    addFlashMessage('تم تصدير سجل القص بنجاح');
  };

  // QC Actions
  const recordQCData = (data: {
    modelId: string;
    colorName: string;
    size: string;
    goodQty: number;
    defectQty: number;
    defectNotes?: string;
    stage?: QCStageType;
  }) => {
    const cleanNotes = data.defectNotes?.trim() || '';
    const stage = data.stage || 'before_print';

    const newQC: QCRecord = {
      id: 'qc-' + Date.now(),
      model_id: data.modelId,
      stage,
      color_name: data.colorName,
      size: data.size,
      good_qty: Math.max(0, data.goodQty),
      defect_qty: Math.max(0, data.defectQty),
      defect_notes: cleanNotes,
      inspector_name: currentUser?.real_name || 'مراقب الجودة',
      created_at: new Date().toLocaleString('ar-EG', { hour12: false })
    };
    setQcRecords((prev) => [newQC, ...prev]);

    logAction('الفرز', `تسجيل بيانات فرز (${stage}): سليم: ${data.goodQty}، هالك: ${data.defectQty}`);
    addFlashMessage('تم تسجيل بيانات الفرز والكنترول بنجاح');
  };

  const recordQCStageCount = (data: {
    modelId: string;
    stage: QCStageType;
    piecesCounted: number;
    defectQty: number;
    defectNotes?: string;
    advanceStage?: boolean;
  }) => {
    const model = models.find((m) => m.id === data.modelId);
    if (!model) return;

    const newQC: QCRecord = {
      id: 'qc-' + Date.now(),
      model_id: data.modelId,
      stage: data.stage,
      color_name: model.model_type || 'الأساسي',
      pieces_cut: model.actual_cut_count || model.target_cut_quantity,
      good_qty: data.piecesCounted,
      defect_qty: data.defectQty,
      defect_notes: data.defectNotes || '',
      inspector_name: currentUser?.real_name || 'مراقب الجودة',
      created_at: new Date().toLocaleString('ar-EG', { hour12: false })
    };
    setQcRecords((prev) => [newQC, ...prev]);

    if (data.stage === 'before_print') {
      setModels((prev) =>
        prev.map((m) => {
          if (m.id !== data.modelId) return m;
          return {
            ...m,
            count_before_print: data.piecesCounted,
            ...(data.advanceStage ? { status: 'جاهز للطباعة / التجميع' } : {})
          };
        })
      );
      addModelTimelineEvent(data.modelId, {
        stage: 'العد قبل الطباعة',
        title: 'إتمام العد قبل الطباعة',
        description: `القطع السليمة: ${data.piecesCounted} | هالك: ${data.defectQty} ${data.advanceStage ? '-> تحويل للمطابع والتطريز' : ''}`,
        user_name: currentUser?.real_name || 'مراقب الجودة'
      });
    } else if (data.stage === 'after_print') {
      setModels((prev) =>
        prev.map((m) => {
          if (m.id !== data.modelId) return m;
          return {
            ...m,
            count_after_print: data.piecesCounted,
            ...(data.advanceStage ? { status: 'في قسم المكن' } : {})
          };
        })
      );
      addModelTimelineEvent(data.modelId, {
        stage: 'العد بعد الطباعة',
        title: 'إتمام العد بعد الطباعة',
        description: `العدد الفعلي بعد الطباعة: ${data.piecesCounted} قطعة ${data.advanceStage ? '-> تحويل لقسم المكن' : ''}`,
        user_name: currentUser?.real_name || 'مراقب الجودة'
      });
    } else if (data.stage === 'after_sewing') {
      setModels((prev) =>
        prev.map((m) => {
          if (m.id !== data.modelId) return m;
          return {
            ...m,
            count_after_sewing: data.piecesCounted,
            ...(data.advanceStage ? { status: 'مخزن الإنتاج التام' } : {})
          };
        })
      );
      addModelTimelineEvent(data.modelId, {
        stage: 'العد بعد المكن',
        title: 'إتمام العد النهائي بعد المكن',
        description: `الإنتاج التام المعتمد: ${data.piecesCounted} قطعة ${data.advanceStage ? '-> تحويل لمخزن الإنتاج التام' : ''}`,
        user_name: currentUser?.real_name || 'مراقب الجودة'
      });
    }

    addFlashMessage('تم تسجيل بيانات العد والمرحلة بنجاح');
  };

  const finishQCApproval = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: 'جاهز للطباعة / التجميع' } : m))
    );
    addModelTimelineEvent(modelId, {
      stage: 'المطابع والتطريز',
      title: 'الاعتماد وجاهزية الإرسال للمطابع',
      description: 'تم اعتماد نتائج الفرز وأصبح الموديل جاهزاً للتسليم للمطابع',
      user_name: currentUser?.real_name || 'مراقب الجودة'
    });
    logAction('الفرز', `الاعتماد النهائي للفرز لموديل ${model?.model_code}`);
    addFlashMessage('تم إنهاء الفرز والاعتماد بنجاح، الموديل الآن متاح في قسم المطابع والتطريز');
  };

  const exportQcCsv = (modelId: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    const records = qcRecords.filter((r) => r.model_id === modelId);
    const headers = ['المرحلة', 'كود الموديل', 'المفتش', 'العدد السليم', 'العدد الهالك', 'ملاحظات العيوب', 'تاريخ ووقت الفرز'];
    const rows = records.map((r) => [
      r.stage === 'before_print' ? 'العد قبل الطباعة' : r.stage === 'after_print' ? 'العد بعد الطباعة' : 'العد بعد المكن',
      targetModel?.model_code || modelId,
      r.inspector_name || '-',
      r.good_qty.toString(),
      r.defect_qty.toString(),
      r.defect_notes || '-',
      r.created_at
    ]);

    const csvContent =
      '\ufeff' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `qc_${targetModel?.model_code || 'records'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logAction('الفرز', `تصدير تقرير الجودة للموديل ${targetModel?.model_code} إلى إكسيل`);
    addFlashMessage('تم تصدير تقرير الفرز والجودة بنجاح');
  };

  // Printing & Embroidery Actions
  const addPrintDispatch = (data: {
    modelId: string;
    shopName: string;
    piecesCount: number;
    printType: string;
    expectedDeliveryDate?: string;
    costPerPiece?: number;
    totalCost?: number;
    notes?: string;
  }) => {
    const targetModel = models.find((m) => m.id === data.modelId);
    const newDisp: PrintDispatch = {
      id: 'disp-' + Date.now(),
      model_id: data.modelId,
      shop_name: data.shopName.trim(),
      dispatched_at: new Date().toLocaleString('ar-EG', { hour12: false }),
      expected_delivery_date: data.expectedDeliveryDate,
      pieces_count: Math.max(0, data.piecesCount),
      print_type: data.printType.trim(),
      cost_per_piece: data.costPerPiece,
      total_cost: data.totalCost || (data.costPerPiece ? data.costPerPiece * data.piecesCount : undefined),
      notes: data.notes?.trim() || '',
      status: 'مرسل للمطبعة'
    };
    setPrintDispatches((prev) => [newDisp, ...prev]);

    // IMMEDIATELY update model status to 'مرسل للمطبعة' so it disappears from readyModels!
    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== data.modelId) return m;
        return {
          ...m,
          status: 'مرسل للمطبعة',
          print_house_name: data.shopName.trim(),
          print_house: data.shopName.trim(),
          print_cost: data.costPerPiece,
          print_expected_date: data.expectedDeliveryDate
        };
      })
    );

    addModelTimelineEvent(data.modelId, {
      stage: 'المطابع والتطريز',
      title: `إرسال للمطبعة: ${data.shopName}`,
      description: `تم إرسال ${data.piecesCount} قطعة للتشغيل (${data.printType})${data.expectedDeliveryDate ? ` - موعد الاستلام المتوقع: ${data.expectedDeliveryDate}` : ''}`,
      user_name: currentUser?.real_name || 'مسؤول المطابع'
    });

    logAction('المطابع والتطريز', `إرسال ${data.piecesCount} قطعة من موديل ${targetModel?.model_code} إلى ${data.shopName}`);
    addFlashMessage(`تم إرسال الموديل للمطبعة (${data.shopName}) بنجاح`);
  };

  const updateDispatchStatus = (dispatchId: string, status: DispatchStatus) => {
    const disp = printDispatches.find((d) => d.id === dispatchId);
    if (!disp) return;

    setPrintDispatches((prev) =>
      prev.map((d) => {
        if (d.id !== dispatchId) return d;
        const receivedAt = status === 'تم الاستلام بالمصنع' ? new Date().toLocaleString('ar-EG', { hour12: false }) : d.received_at;
        return { ...d, status, received_at: receivedAt };
      })
    );

    // If received at factory, automatically route to 'العد بعد الطباعة' inside QC!
    if (status === 'تم الاستلام بالمصنع') {
      setModels((prev) =>
        prev.map((m) => {
          if (m.id !== disp.model_id) return m;
          return {
            ...m,
            status: 'العد بعد الطباعة'
          };
        })
      );

      addModelTimelineEvent(disp.model_id, {
        stage: 'العد بعد الطباعة',
        title: 'استلام الموديل من المطبعة',
        description: `تم استلام الشحنة من ${disp.shop_name} وتوجيه الموديل تلقائياً للعد بعد الطباعة`,
        user_name: currentUser?.real_name || 'مسؤول المطابع'
      });
    }

    logAction('المطابع والتطريز', `تحديث حالة الإرسالية إلى: ${status}`);
    addFlashMessage(`تم تحديث حالة التشغيل إلى "${status}" بنجاح`);
  };

  // Sewing Section Actions - Matching Printing Dispatch Pattern with Independent Shirt & Pants Tracking
  const dispatchModelToSewing = (data: {
    modelId: string;
    workshopName: string;
    piecesCount: number;
    expectedDeliveryDate: string;
    pieceType?: 'shirt' | 'pants';
    pieceLabel?: string;
    notes?: string;
  }) => {
    const targetModel = models.find((m) => m.id === data.modelId);
    const resolvedType = data.pieceType || 'shirt';
    const resolvedLabel = data.pieceLabel || (resolvedType === 'shirt' ? 'تيشرت' : 'بنطلون');

    const newDisp: SewingDispatch = {
      id: 'sew-disp-' + Date.now(),
      model_id: data.modelId,
      piece_type: resolvedType,
      piece_label: resolvedLabel,
      workshop_name: data.workshopName.trim(),
      pieces_count: Math.max(0, data.piecesCount),
      dispatched_at: new Date().toLocaleString('ar-EG', { hour12: false }),
      expected_delivery_date: data.expectedDeliveryDate,
      status: 'في ورشة المكن',
      notes: data.notes?.trim() || ''
    };
    setSewingDispatches((prev) => [newDisp, ...prev]);

    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== data.modelId) return m;
        const updates: Partial<DesignModel> = {
          status: 'في قسم المكن',
          sewing_workshop: data.workshopName.trim(),
          sewing_expected_date: data.expectedDeliveryDate,
          sewing_pieces_count: data.piecesCount
        };
        if (resolvedType === 'shirt') {
          updates.sewing_shirt_workshop = data.workshopName.trim();
          updates.sewing_shirt_expected_date = data.expectedDeliveryDate;
          updates.sewing_shirt_status = 'في ورشة المكن';
          updates.sewing_shirt_pieces = data.piecesCount;
        } else {
          updates.sewing_pants_workshop = data.workshopName.trim();
          updates.sewing_pants_expected_date = data.expectedDeliveryDate;
          updates.sewing_pants_status = 'في ورشة المكن';
          updates.sewing_pants_pieces = data.piecesCount;
        }
        return {
          ...m,
          ...updates
        };
      })
    );

    addModelTimelineEvent(data.modelId, {
      stage: 'قسم المكن والخياطة',
      title: `إرسال [${resolvedLabel}] إلى ورشة المكن: ${data.workshopName}`,
      description: `تم إرسال ${data.piecesCount} قطعة [${resolvedLabel}] للخياطة إلى ورشة (${data.workshopName})، تاريخ الاستلام المتوقع: ${data.expectedDeliveryDate}${data.notes ? ` - ${data.notes}` : ''}`,
      user_name: currentUser?.real_name || 'مسؤول خطوط الخياطة'
    });

    logAction('قسم المكن', `إرسال ${data.piecesCount} قطعة [${resolvedLabel}] من موديل ${targetModel?.model_code} إلى ورشة ${data.workshopName}`);
    addFlashMessage(`تم تسجيل خروج [${resolvedLabel}] لورشة الخياطة (${data.workshopName}) بنجاح`);
  };

  const receiveModelFromSewing = (dispatchId: string, modelId?: string) => {
    const disp = sewingDispatches.find((d) => d.id === dispatchId);
    const targetModelId = modelId || disp?.model_id;
    if (!targetModelId) return;
    const targetModel = models.find((m) => m.id === targetModelId);
    const pieceType = disp?.piece_type || 'shirt';
    const pieceLabel = disp?.piece_label || (pieceType === 'shirt' ? 'تيشرت' : 'بنطلون');

    const updatedDispatches = sewingDispatches.map((d) => {
      if (d.id !== dispatchId) return d;
      return {
        ...d,
        status: 'تم الاستلام' as const,
        received_at: new Date().toLocaleString('ar-EG', { hour12: false })
      };
    });
    setSewingDispatches(updatedDispatches);

    // Check if other active dispatches exist for this model
    const otherPending = updatedDispatches.filter(
      (d) => d.model_id === targetModelId && d.id !== dispatchId && d.status !== 'تم الاستلام'
    );
    const allPiecesReceived = otherPending.length === 0;

    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== targetModelId) return m;
        const updates: Partial<DesignModel> = {};
        if (pieceType === 'shirt') {
          updates.sewing_shirt_status = 'تم الاستلام';
        } else {
          updates.sewing_pants_status = 'تم الاستلام';
        }
        if (allPiecesReceived) {
          updates.status = 'العد بعد المكن';
        }
        return {
          ...m,
          ...updates
        };
      })
    );

    addModelTimelineEvent(targetModelId, {
      stage: 'قسم المكن والفرز',
      title: `استلام [${pieceLabel}] من ورشة المكن`,
      description: `تم استلام [${pieceLabel}] من ورشة ${disp?.workshop_name || ''}${allPiecesReceived ? ' واكتمال القطع وتوجيه الموديل تلقائياً إلى الفرز والجودة (العد بعد المكن)' : ''}`,
      user_name: currentUser?.real_name || 'مسؤول الإنتاج'
    });

    logAction('قسم المكن', `استلام [${pieceLabel}] موديل ${targetModel?.model_code} من ورشة ${disp?.workshop_name}`);
    addFlashMessage(`تم استلام [${pieceLabel}] بنجاح${allPiecesReceived ? ' واكتمال القطع ونقل الموديل إلى العد بعد المكن بالفرز' : ''}`);
  };

  const finishSewingToQC = (modelId: string, notes?: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: 'العد بعد المكن' } : m))
    );

    addModelTimelineEvent(modelId, {
      stage: 'العد بعد المكن',
      title: 'إتمام مرحلة الخياطة والمكن',
      description: `تم إنهاء الخياطة وتوجيه الموديل للعد النهائي بعد المكن. ${notes || ''}`,
      user_name: currentUser?.real_name || 'مسؤول قسم المكن'
    });

    logAction('قسم المكن', `إنهاء خياطة الموديل ${targetModel?.model_code} وتحويله للعد النهائي`);
    addFlashMessage('تم إنهاء الخياطة وتحويل الموديل للعد النهائي بعد المكن بنجاح');
  };

  const finishQCToProduction = (modelId: string, notes?: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: 'مخزن الإنتاج التام' } : m))
    );

    addModelTimelineEvent(modelId, {
      stage: 'مخزن الإنتاج التام',
      title: 'الاعتماد النهائي ودخول مخزن الإنتاج التام',
      description: `تم الفحص النهائي بنجاح ودخول البضاعة الجاهزة إلى مخزن الإنتاج. ${notes || ''}`,
      user_name: currentUser?.real_name || 'مراقب الجودة'
    });

    logAction('الإنتاج', `تحويل الموديل ${targetModel?.model_code} إلى مخزن الإنتاج التام`);
    addFlashMessage('تم تحويل الموديل إلى مخزن الإنتاج التام بنجاح');
  };

  // Settings Actions
  const addSizeDef = (name: string, values: string) => {
    const newSize: SizeDef = {
      id: 'size-' + Date.now(),
      name: name.trim(),
      values: values.trim()
    };
    setSizeDefs((prev) => [...prev, newSize]);
    logAction('الإعدادات', `تعريف فئة مقاسات جديدة: ${name}`);
    addFlashMessage('تمت إضافة فئة المقاسات بنجاح');
  };

  const addSupplier = (name: string, phone: string) => {
    const newSup: Supplier = {
      id: 'sup-' + Date.now(),
      name: name.trim(),
      phone: phone.trim()
    };
    setSuppliers((prev) => [...prev, newSup]);
    logAction('الإعدادات', `إضافة مورد جديد: ${name}`);
    addFlashMessage('تمت إضافة المورد بنجاح');
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: 'user-' + Date.now()
    };
    setUsers((prev) => [...prev, newUser]);
    logAction('إدارة الحسابات', `إنشاء حساب جديد للموظف: ${newUser.username}`);
    addFlashMessage(`تم إنشاء حساب جديد للموظف ${newUser.real_name}`);
  };

  const toggleUserActive = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'المستخدم غير موجود' };
    if (targetUser.username === 'sudo') {
      return { success: false, message: 'لا يمكن تعطيل حساب الإدارة العليا (Sudo)' };
    }

    const nextState = !targetUser.is_active;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: nextState } : u))
    );
    const actText = nextState ? 'تفعيل' : 'إيقاف';
    logAction('إدارة الحسابات', `${actText} حساب المستخدم: ${targetUser.username}`);
    addFlashMessage(`تم ${actText} الحساب بنجاح`);
    return { success: true, message: `تم ${actText} الحساب بنجاح` };
  };

  const updateUserPermissionsAndPassword = (
    userId: string,
    permissions: User['permissions'],
    newPassword?: string,
    newRole?: string,
    roleId?: string
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        return {
          ...u,
          permissions: { ...u.permissions, ...permissions },
          ...(newPassword ? { password: newPassword } : {}),
          ...(newRole ? { role: newRole } : {}),
          ...(roleId ? { role_id: roleId } : {})
        };
      })
    );
    logAction('إدارة الحسابات', `تحديث بيانات وصلاحيات الموظف (ID: ${userId})`);
    addFlashMessage('تم حفظ تعديلات المستخدم بنجاح');
  };

  const deleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'المستخدم غير موجود' };
    if (target.username === 'sudo') {
      return { success: false, message: 'لا يمكن حذف حساب الإدارة العليا (Sudo)' };
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    logAction('إدارة الحسابات', `حذف المستخدم: ${target.username}`);
    addFlashMessage(`تم حذف المستخدم ${target.real_name}`);
    return { success: true, message: 'تم الحذف بنجاح' };
  };

  const markNotificationRead = (id: string) => {
    setReadNotificationIds((prev) => {
      const updated = prev.includes(id) ? prev : [...prev, id];
      try {
        localStorage.setItem('erp_read_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Smart Real-time In-App Notifications for Expected Delivery Dates
  const appNotifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check Print Dispatches
    printDispatches.forEach((disp) => {
      if (disp.status === 'تم الاستلام بالمصنع' || !disp.expected_delivery_date) return;
      const model = models.find((m) => m.id === disp.model_id);
      const modelCode = model?.model_code || 'موديل';

      const expDate = new Date(disp.expected_delivery_date);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const notifId = `notif-print-${disp.id}-${disp.expected_delivery_date}`;

      if (diffDays < 0) {
        list.push({
          id: notifId,
          model_id: disp.model_id,
          model_code: modelCode,
          stage: 'printing',
          source_name: disp.shop_name,
          expected_date: disp.expected_delivery_date,
          urgency: 'overdue',
          days_diff: diffDays,
          title: `🚨 تأخر استلام من المطبعة (${modelCode})`,
          message: `تخطى موعد استلام الموديل ${modelCode} من مطبعة ${disp.shop_name} بمقدار ${Math.abs(diffDays)} يوم، ولم يتم تسجيل الاستلام بعد!`,
          is_read: readNotificationIds.includes(notifId),
          created_at: disp.dispatched_at
        });
      } else if (diffDays === 0) {
        list.push({
          id: notifId,
          model_id: disp.model_id,
          model_code: modelCode,
          stage: 'printing',
          source_name: disp.shop_name,
          expected_date: disp.expected_delivery_date,
          urgency: 'today',
          days_diff: 0,
          title: `⏰ موعد استلام اليوم (${modelCode})`,
          message: `اليوم موعد استلام الموديل ${modelCode} من مطبعة ${disp.shop_name}.`,
          is_read: readNotificationIds.includes(notifId),
          created_at: disp.dispatched_at
        });
      } else if (diffDays === 1) {
        list.push({
          id: notifId,
          model_id: disp.model_id,
          model_code: modelCode,
          stage: 'printing',
          source_name: disp.shop_name,
          expected_date: disp.expected_delivery_date,
          urgency: 'tomorrow',
          days_diff: 1,
          title: `📅 موعد استلام غداً (${modelCode})`,
          message: `غداً موعد استلام الموديل ${modelCode} من مطبعة ${disp.shop_name}.`,
          is_read: readNotificationIds.includes(notifId),
          created_at: disp.dispatched_at
        });
      }
    });

    // 2. Check Sewing Dispatches
    sewingDispatches.forEach((disp) => {
      if (disp.status === 'تم الاستلام' || !disp.expected_delivery_date) return;
      const model = models.find((m) => m.id === disp.model_id);
      const modelCode = model?.model_code || 'موديل';
      const pieceLabel = disp.piece_label ? ` [${disp.piece_label}]` : '';

      const expDate = new Date(disp.expected_delivery_date);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const notifId = `notif-sew-${disp.id}-${disp.expected_delivery_date}`;

      if (diffDays < 0) {
        list.push({
          id: notifId,
          model_id: disp.model_id,
          model_code: modelCode,
          stage: 'sewing',
          source_name: disp.workshop_name,
          expected_date: disp.expected_delivery_date,
          urgency: 'overdue',
          days_diff: diffDays,
          title: `🚨 تأخر استلام من ورشة المكن${pieceLabel} (${modelCode})`,
          message: `تخطى موعد استلام ${modelCode}${pieceLabel} من ورشة ${disp.workshop_name} بمقدار ${Math.abs(diffDays)} يوم، ولم يتم تسجيل الاستلام بعد!`,
          is_read: readNotificationIds.includes(notifId),
          created_at: disp.dispatched_at
        });
      } else if (diffDays === 0) {
        list.push({
          id: notifId,
          model_id: disp.model_id,
          model_code: modelCode,
          stage: 'sewing',
          source_name: disp.workshop_name,
          expected_date: disp.expected_delivery_date,
          urgency: 'today',
          days_diff: 0,
          title: `⏰ موعد استلام اليوم${pieceLabel} (${modelCode})`,
          message: `اليوم موعد استلام الموديل ${modelCode}${pieceLabel} من ورشة المكن (${disp.workshop_name}).`,
          is_read: readNotificationIds.includes(notifId),
          created_at: disp.dispatched_at
        });
      } else if (diffDays === 1) {
        list.push({
          id: notifId,
          model_id: disp.model_id,
          model_code: modelCode,
          stage: 'sewing',
          source_name: disp.workshop_name,
          expected_date: disp.expected_delivery_date,
          urgency: 'tomorrow',
          days_diff: 1,
          title: `📅 موعد استلام غداً${pieceLabel} (${modelCode})`,
          message: `غداً موعد استلام الموديل ${modelCode}${pieceLabel} من ورشة المكن (${disp.workshop_name}).`,
          is_read: readNotificationIds.includes(notifId),
          created_at: disp.dispatched_at
        });
      }
    });

    const priorityOrder = { overdue: 0, today: 1, tomorrow: 2 };
    return list.sort((a, b) => priorityOrder[a.urgency] - priorityOrder[b.urgency]);
  }, [printDispatches, sewingDispatches, models, readNotificationIds]);

  const unreadNotificationsCount = useMemo(() => {
    // Overdue notifications stay persistent and visible until actual receipt!
    return appNotifications.filter((n) => n.urgency === 'overdue' || !n.is_read).length;
  }, [appNotifications]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        roles,
        auditLogs,
        sizeDefs,
        suppliers,
        fabrics,
        fabricColors,
        fabricTransactions,
        models,
        requirements,
        accessories,
        modelAccessories: accessories,
        cuttingRecords,
        qcRecords,
        printDispatches,
        sewingDispatches,
        appNotifications,
        unreadNotificationsCount,
        markNotificationRead,
        flashMessages,
        addFlashMessage,
        removeFlashMessage,
        addRole,
        updateRole,
        deleteRole,
        hasPermission,
        canViewFabricPrices,
        canEditFabricPrices,
        canViewAccessoryPrices,
        canEditAccessoryPrices,
        canViewPrintingCosts,
        canEditPrintingCosts,
        canSendWhatsApp,
        canSendMessages,
        internalMessages,
        unreadMessagesCount,
        sendInternalMessage,
        markMessageRead,
        addFabricOrColor,
        recordTransaction,
        exportWarehouseInventoryCsv,
        updateColorPrice,
        accessoryTypes,
        accessoryItems,
        accessoryTransactions,
        addAccessoryType,
        addAccessoryItem,
        updateAccessoryItem,
        deleteAccessoryItem,
        recordAccessoryTransaction,
        exportAccessoryInventoryCsv,
        markAccessoryWithdrawn,
        addDesignModel,
        updateModelPlan,
        updateModelNotesAndTarget,
        addModelRequirement,
        deleteModelRequirement,
        addModelAccessory,
        deleteModelAccessory,
        issueFabricToCutting,
        deleteDesignModel,
        addCuttingRecord,
        finishCuttingToQC,
        exportCuttingCsv,
        recordQCData,
        addQCRecord: recordQCData,
        recordQCStageCount,
        finishQCApproval,
        exportQcCsv,
        addPrintDispatch,
        updateDispatchStatus,
        dispatchModelToSewing,
        receiveModelFromSewing,
        finishSewingToQC,
        finishQCToProduction,
        addSizeDef,
        addSupplier,
        addUser,
        toggleUserActive,
        updateUserPermissionsAndPassword,
        deleteUser,
        logAction,
        addModelTimelineEvent
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
