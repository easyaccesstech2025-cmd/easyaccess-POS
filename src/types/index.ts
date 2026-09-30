// ============================================================
// Easy Access POS — TypeScript Type Definitions
// Matches the Android app's Kotlin data classes exactly
// ============================================================

// ---------- User & Auth ----------
export interface User {
  id: number;
  fullName?: string;
  username: string;
  password?: string;
  email?: string;
  pincode?: string;
  role: "ADMIN" | "MANAGER" | "CASHIER";
  isArchived: boolean;
  parentAdminId?: number;
  createdAt?: string;
  subscriptionExpiryDate?: string;
  isSuspended: boolean;
  appVersion?: string;
  accessiblePages?: string;
  firstName?: string;
  lastName?: string;
  suffix?: string;
  fullAddress?: string;
  birthday?: string;
  companyName?: string;
  companyType?: string;
  companyAddress?: string;
  companyContactNo?: string;
}

export interface StaffAccount {
  id: number;
  fullName: string;
  username: string;
  role: "ADMIN" | "MANAGER" | "CASHIER";
  isArchived: boolean;
  pin: string;
  accessiblePages: string[];
  email?: string;
}

// ---------- Product & Category ----------
export interface Product {
  id: number;
  name: string;
  price: number;
  categoryId?: number;
  userId: number;
  backgroundColor?: string;
  barcode?: string;
  brandName?: string;
  costPrice: number;
  stock: number;
  supplierId?: number;
  imageUrl?: string;
  isArchived: boolean;
  trackExpiry: boolean;
  isRecipe: boolean;
  categoryName?: string;
  supplierName?: string;
  updatedAt?: string;
  lastAction?: string;
  totalSold?: number;
  hasIngredients?: boolean;
  hasModifiers?: boolean;
}

export interface Category {
  id: number;
  name: string;
  displayOrder: number;
}

// ---------- Cash Drawer ----------
export interface PosSession {
  id: number;
  userId: number;
  openedBy?: number;
  openedByName?: string;
  openedByRole?: string;
  openedAtMs: number;
  closedAtMs?: number;
  startingCash: number;
  actualCashCounted?: number;
  status: "OPEN" | "CLOSED";
}

export interface CashTransaction {
  id: number;
  sessionId: number;
  userId?: number;
  transactionType: "CASH_ADDED" | "EXPENSE";
  amount: number;
  description?: string;
  createdAtMs: number;
}

export interface ZReadingReport {
  sessionId: number;
  openedAtMs: number;
  closedAtMs?: number;
  startingCash: number;
  cashAdded: number;
  cashSales: number;
  cashExpenses: number;
  cashRefunds: number;
  expectedCashInDrawer: number;
  actualCashCounted?: number;
  shortOver?: number;
  digitalSales: number;
  digitalSalesBreakdown: Record<string, number>;
  splitSales: number;
  serviceFeesTotal: number;
  deliveryFeesTotal: number;
  totalRevenue: number;
}

// ---------- Ingredient & Recipe ----------
export interface Ingredient {
  id: number;
  userId: number;
  name: string;
  unitOfMeasurement: string;
  stock: number;
  costPerUnit: number;
  reorderLevel: number;
  isArchived: boolean;
  updatedAtMs: number;
  lastAction?: string;
}

export interface ProductRecipe {
  id: number;
  userId: number;
  productId: number;
  ingredientId: number;
  quantityRequired: number;
  ingredientName: string;
  unitOfMeasurement: string;
}

// ---------- Supplier ----------
export interface Supplier {
  id: number;
  name: string;
  contactInfo?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  isArchived: boolean;
  userId: number;
}

// ---------- Expiry ----------
export interface ExpiryBatch {
  id: number;
  productId: number;
  userId: number;
  quantity: number;
  expiryDate: string;
  source: "manual" | "initial" | "delivery";
  deliveryId?: number;
  createdAt?: string;
  isWrittenOff: boolean;
  writtenOffAt?: string;
  notes?: string;
  productName?: string;
  daysUntilExpiry?: number;
  status?: "expired" | "expiring_soon" | "safe";
}

// ---------- Reports ----------
export interface BusinessKPIs {
  grossSalesToday: number;
  netSalesToday: number;
  salesChangeVsYesterday: number;
  grossProfitToday: number;
  netProfitToday: number;
  profitChangeVsYesterday: number;
  transactionsToday: number;
  refundsTodayAmount: number;
  totalRefundsCount: number;
}

export interface SalesHistoryRow {
  saleId: string;
  date: string;
  cashier: string;
  itemsCount: number;
  totalAmount: number;
  netAmount: number;
  netProfit: number;
  paymentMethod: string;
  status: string;
  discountAmount: number;
  deliveryFee: number;
  serviceFee: number;
}

export type DateFilterType = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_YEAR" | "ALL_TIME" | "CUSTOM";

// ---------- Delivery ----------
export interface DeliveryLog {
  id: number;
  productId: number;
  userId: number;
  supplierId?: number;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceNumber?: string;
  receivedBy?: string;
  dateReceivedMs: number;
  notes?: string;
  productName?: string;
  supplierName?: string;
}

// ---------- Modifier ----------
export interface ModifierGroup {
  id: number;
  name: string;
  selectionType: "SINGLE" | "MULTI";
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  isArchived: boolean;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: number;
  groupId: number;
  name: string;
  additionalPrice: number;
  isDefault: boolean;
  sortOrder: number;
  ingredientId?: number;
  isArchived: boolean;
}

// ---------- Settings ----------
export interface TenantSetting {
  userId: number;
  settingKey: string;
  settingValue?: string;
}

// ---------- Navigation ----------
export interface NavItem {
  name: string;
  href: string;
  icon: string;
  condition?: (user: User) => boolean;
}
