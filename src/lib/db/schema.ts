import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  timestamp,
  bigint,
  doublePrecision,
  customType,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer | string }>({
  dataType() {
    return "bytea";
  },
  toDriver(val: Buffer) {
    return val;
  },
  fromDriver(val: Buffer | string) {
    if (typeof val === "string") {
      if (val.startsWith("\\x")) return Buffer.from(val.slice(2), "hex");
      return Buffer.from(val);
    }
    return val;
  },
});

// ============================================================
// CLOUD TABLES
// ============================================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 150 }),
  username: varchar("username", { length: 50 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  pincode: varchar("pincode", { length: 6 }),
  role: varchar("role", { length: 20 }).notNull().default("CASHIER"),
  isArchived: boolean("is_archived").default(false),
  parentAdminId: integer("parent_admin_id").references((): any => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  createdAtMs: bigint("created_at_ms", { mode: "number" }).default(0),
  subscriptionExpiryDate: text("subscription_expiry_date"),
  isSuspended: boolean("is_suspended").default(false),
  appVersion: varchar("app_version", { length: 50 }),
  accessiblePages: text("accessible_pages"),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  suffix: varchar("suffix", { length: 20 }),
  fullAddress: text("full_address"),
  birthday: varchar("birthday", { length: 20 }),
  companyName: varchar("company_name", { length: 200 }),
  companyType: varchar("company_type", { length: 50 }),
  companyAddress: text("company_address"),
  companyContactNo: varchar("company_contact_no", { length: 50 }),
});

export const systemConfig = pgTable("system_config", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value"),
  updatedAt: bigint("updated_at", { mode: "number" }),
  updatedBy: varchar("updated_by", { length: 255 }),
});

export const activationKeys = pgTable("activation_keys", {
  id: serial("id").primaryKey(),
  activationKey: varchar("activation_key", { length: 255 }).unique().notNull(),
  durationCode: varchar("duration_code", { length: 10 }).notNull(),
  generatedBy: varchar("generated_by", { length: 50 }).notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  usedBy: integer("used_by").references(() => users.id, { onDelete: "set null" }),
  usedAt: timestamp("used_at"),
});

// ============================================================
// OPERATIONAL TABLES
// ============================================================

export const tenantSettings = pgTable("tenant_settings", {
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  settingKey: varchar("setting_key", { length: 100 }).notNull(),
  settingValue: text("setting_value"),
}, (table) => [{
  pk: { columns: [table.userId, table.settingKey] },
}]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  displayOrder: integer("display_order").default(0),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  contactInfo: varchar("contact_info", { length: 255 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  isArchived: boolean("is_archived").default(false),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  backgroundColor: varchar("background_color", { length: 9 }),
  barcode: varchar("barcode", { length: 50 }),
  brandName: varchar("brand_name", { length: 100 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).default("0.0"),
  stock: integer("stock").default(0),
  supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  imageData: bytea("image_data"), 
  isArchived: boolean("is_archived").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedAtMs: bigint("updated_at_ms", { mode: "number" }).notNull().default(0),
  lastAction: varchar("last_action", { length: 255 }),
  trackExpiry: boolean("track_expiry").default(false),
  isRecipe: boolean("is_recipe").default(false),
});

export const supplierProductPrices = pgTable("supplier_product_prices", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  updatedAtMs: bigint("updated_at_ms", { mode: "number" }).notNull().default(0),
});

export const productExpiryBatch = pgTable("product_expiry_batch", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(0),
  expiryDate: text("expiry_date").notNull(),
  source: text("source").default("manual"),
  deliveryId: integer("delivery_id"),
  createdAt: timestamp("created_at").defaultNow(),
  isWrittenOff: integer("is_written_off").default(0),
  writtenOffAt: timestamp("written_off_at"),
  notes: text("notes"),
});

export const posSessions = pgTable("pos_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  openedBy: integer("opened_by").references(() => users.id, { onDelete: "set null" }),
  openedAtMs: bigint("opened_at_ms", { mode: "number" }).notNull(),
  closedAtMs: bigint("closed_at_ms", { mode: "number" }),
  startingCash: decimal("starting_cash", { precision: 10, scale: 2 }).notNull().default("0.0"),
  actualCashCounted: decimal("actual_cash_counted", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).default("OPEN"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cashTransactions = pgTable("cash_transactions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => posSessions.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAtMs: bigint("created_at_ms", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  createdAtMs: bigint("created_at_ms", { mode: "number" }).notNull().default(0),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  cashierId: integer("cashier_id").references(() => users.id, { onDelete: "set null" }),
  paymentMethod: varchar("payment_method", { length: 20 }).default("CASH"),
  amountReceived: decimal("amount_received", { precision: 10, scale: 2 }),
  changeGiven: decimal("change_given", { precision: 10, scale: 2 }),
  referenceNumber: varchar("reference_number", { length: 100 }),
  discountPercentage: integer("discount_percentage").default(0),
  discountType: varchar("discount_type", { length: 50 }),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  discountNote: text("discount_note"),
  splitCashAmount: decimal("split_cash_amount", { precision: 10, scale: 2 }),
  splitDigitalAmount: decimal("split_digital_amount", { precision: 10, scale: 2 }),
  splitDigitalMethod: varchar("split_digital_method", { length: 20 }),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0.0"),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).default("0.0"),
  serviceFeeLabel: varchar("service_fee_label", { length: 100 }),
  sessionId: integer("session_id").references(() => posSessions.id, { onDelete: "set null" }),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).default("0.0"),
  discountPercentage: integer("discount_percentage"),
  discountType: varchar("discount_type", { length: 50 }),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  discountNote: text("discount_note"),
  recipeCost: decimal("recipe_cost", { precision: 10, scale: 4 }),
});

export const refunds = pgTable("refunds", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  cashierId: integer("cashier_id").notNull(),
  approvedByManagerId: integer("approved_by_manager_id"),
  refundReason: varchar("refund_reason", { length: 100 }).notNull(),
  totalRefunded: decimal("total_refunded", { precision: 10, scale: 2 }).notNull(),
  deliveryFeeRefunded: decimal("delivery_fee_refunded", { precision: 10, scale: 2 }).default("0.0"),
  serviceFeeRefunded: decimal("service_fee_refunded", { precision: 10, scale: 2 }).default("0.0"),
  createdAtMs: bigint("created_at_ms", { mode: "number" }).notNull(),
  sessionId: integer("session_id").references(() => posSessions.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const refundItems = pgTable("refund_items", {
  id: serial("id").primaryKey(),
  refundId: integer("refund_id").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull(),
  quantityRefunded: integer("quantity_refunded").notNull(),
  amountRefunded: decimal("amount_refunded", { precision: 10, scale: 2 }).notNull().default("0.0"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).default("0.0"),
  returnedToInventory: boolean("returned_to_inventory").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deliveryLogs = pgTable("delivery_logs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  userId: integer("user_id").notNull(),
  supplierId: integer("supplier_id"),
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  referenceNumber: varchar("reference_number", { length: 100 }),
  receivedBy: varchar("received_by", { length: 255 }),
  dateReceivedMs: bigint("date_received_ms", { mode: "number" }).notNull(),
  notes: text("notes"),
});

export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  userId: integer("user_id").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  quantityChanged: integer("quantity_changed").notNull(),
  dateAdjustedMs: bigint("date_adjusted_ms", { mode: "number" }).notNull(),
  notes: text("notes"),
});

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  unitOfMeasurement: varchar("unit_of_measurement", { length: 50 }).notNull().default("unit"),
  stock: doublePrecision("stock").notNull().default(0.0),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull().default("0.0"),
  reorderLevel: doublePrecision("reorder_level").notNull().default(0.0),
  isArchived: boolean("is_archived").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedAtMs: bigint("updated_at_ms", { mode: "number" }).notNull().default(0),
  lastAction: varchar("last_action", { length: 255 }),
});

export const productRecipes = pgTable("product_recipes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quantityRequired: decimal("quantity_required", { precision: 12, scale: 4 }).notNull(),
});

export const ingredientDeliveryLogs = pgTable("ingredient_delivery_logs", {
  id: serial("id").primaryKey(),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  previousStock: decimal("previous_stock", { precision: 12, scale: 4 }).notNull().default("0"),
  newStock: decimal("new_stock", { precision: 12, scale: 4 }).notNull().default("0"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 4 }).default("0"),
  referenceNumber: varchar("reference_number", { length: 100 }),
  receivedBy: varchar("received_by", { length: 255 }),
  dateReceivedMs: bigint("date_received_ms", { mode: "number" }).notNull().default(0),
  notes: text("notes"),
});

export const ingredientUsageLogs = pgTable("ingredient_usage_logs", {
  id: serial("id").primaryKey(),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  quantityUsed: decimal("quantity_used", { precision: 12, scale: 4 }).notNull(),
  usageType: varchar("usage_type", { length: 50 }).notNull().default("SALE"),
  dateUsedMs: bigint("date_used_ms", { mode: "number" }).notNull(),
  notes: text("notes"),
});

export const ingredientAdjustments = pgTable("ingredient_adjustments", {
  id: serial("id").primaryKey(),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  previousStock: decimal("previous_stock", { precision: 12, scale: 4 }).notNull().default("0"),
  newStock: decimal("new_stock", { precision: 12, scale: 4 }).notNull().default("0"),
  quantityChanged: decimal("quantity_changed", { precision: 12, scale: 4 }).notNull().default("0"),
  dateAdjustedMs: bigint("date_adjusted_ms", { mode: "number" }).notNull().default(0),
  notes: text("notes"),
});

export const ingredientReconciliations = pgTable("ingredient_reconciliations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: integer("session_id").references(() => posSessions.id, { onDelete: "set null" }),
  performedBy: integer("performed_by").references(() => users.id, { onDelete: "set null" }),
  createdAtMs: bigint("created_at_ms", { mode: "number" }).notNull(),
  notes: text("notes"),
});

export const ingredientReconciliationItems = pgTable("ingredient_reconciliation_items", {
  id: serial("id").primaryKey(),
  reconciliationId: integer("reconciliation_id").notNull().references(() => ingredientReconciliations.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  systemStock: decimal("system_stock", { precision: 12, scale: 4 }).notNull(),
  actualStock: decimal("actual_stock", { precision: 12, scale: 4 }).notNull(),
  variance: decimal("variance", { precision: 12, scale: 4 }).notNull(),
  varianceCost: decimal("variance_cost", { precision: 10, scale: 4 }).notNull().default("0"),
  notes: text("notes"),
});

export const modifierGroups = pgTable("modifier_groups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  selectionType: varchar("selection_type", { length: 10 }).notNull().default("SINGLE"),
  isRequired: boolean("is_required").notNull().default(false),
  minSelect: integer("min_select").notNull().default(0),
  maxSelect: integer("max_select").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  isArchived: boolean("is_archived").default(false),
});

export const modifierOptions = pgTable("modifier_options", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => modifierGroups.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  additionalPrice: decimal("additional_price", { precision: 10, scale: 2 }).notNull().default("0.0"),
  isDefault: boolean("is_default").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ingredientId: integer("ingredient_id").references(() => ingredients.id, { onDelete: "set null" }),
  quantityRequired: decimal("quantity_required", { precision: 12, scale: 4 }),
  isArchived: boolean("is_archived").default(false),
});

export const productModifierGroups = pgTable("product_modifier_groups", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  groupId: integer("group_id").notNull().references(() => modifierGroups.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const orderItemModifiers = pgTable("order_item_modifiers", {
  id: serial("id").primaryKey(),
  orderItemId: integer("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  modifierOptionId: integer("modifier_option_id").references(() => modifierOptions.id, { onDelete: "set null" }),
  groupName: varchar("group_name", { length: 150 }).notNull(),
  optionName: varchar("option_name", { length: 150 }).notNull(),
  additionalPrice: decimal("additional_price", { precision: 10, scale: 2 }).notNull().default("0.0"),
});
