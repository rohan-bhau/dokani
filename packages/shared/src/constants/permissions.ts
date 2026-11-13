export const SystemRole = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  INVENTORY_CLERK: 'INVENTORY_CLERK',
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

const ALL_TENANT_PERMISSIONS: PermissionType[] = Object.values(Permission).filter(
  (code) => code !== Permission.PLATFORM_MANAGE
);

export const ROLE_DEFAULT_PERMISSIONS: Record<
  Exclude<SystemRoleType, 'PLATFORM_ADMIN'>,
  PermissionType[]
> = {
  OWNER: ALL_TENANT_PERMISSIONS,
  MANAGER: [
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.STOCK_VIEW,
    Permission.STOCK_ADJUST,
    Permission.SUPPLIER_MANAGE,
    Permission.PURCHASE_MANAGE,
    Permission.SALE_CREATE,
    Permission.SALE_VOID,
    Permission.SALE_RETURN,
    Permission.SALE_DISCOUNT_HIGH,
    Permission.STAFF_VIEW,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_MANAGE,
    Permission.DUE_COLLECT,
    Permission.REPORT_VIEW_ALL,
    Permission.REPORT_VIEW_OWN,
    Permission.AUDIT_LOG_VIEW,
    Permission.EXPENSE_VIEW,
    Permission.EXPENSE_MANAGE,
  ],
  CASHIER: [
    Permission.PRODUCT_VIEW,
    Permission.SALE_CREATE,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_MANAGE,
    Permission.DUE_COLLECT,
    Permission.REPORT_VIEW_OWN,
  ],
  INVENTORY_CLERK: [
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.STOCK_VIEW,
    Permission.STOCK_ADJUST,
    Permission.SUPPLIER_MANAGE,
    Permission.PURCHASE_MANAGE,
  ],
};
