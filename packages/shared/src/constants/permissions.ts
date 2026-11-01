export const SystemRole = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
} as const;

export type SystemRoleType = (typeof SystemRole)[keyof typeof SystemRole];

export const Permission = {
  TENANT_SETTINGS_MANAGE: 'tenant:settings:manage',
  STAFF_MANAGE: 'staff:manage',
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  STOCK_VIEW: 'stock:view',
  STOCK_ADJUST: 'stock:adjust',
  SUPPLIER_MANAGE: 'supplier:manage',
  PURCHASE_MANAGE: 'purchase:manage',
  SALE_CREATE: 'sale:create',
  SALE_VOID: 'sale:void',
  SALE_RETURN: 'sale:return',
  SALE_DISCOUNT_HIGH: 'sale:discount:high',
  STAFF_VIEW: 'staff:view',
  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_MANAGE: 'customer:manage',
  DUE_COLLECT: 'due:collect',
  REPORT_VIEW_ALL: 'report:view:all',
  REPORT_VIEW_OWN: 'report:view:own',
  AUDIT_LOG_VIEW: 'audit_log:view',
  PLATFORM_MANAGE: 'platform:manage',
  EXPENSE_VIEW: 'expense:view',
  EXPENSE_MANAGE: 'expense:manage',
} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission];
