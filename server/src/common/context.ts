import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  tenantId: string;
  userId: string;
  permissions: string[];
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getRequestContext = (): RequestContext => {
  const ctx = requestContext.getStore();
  if (!ctx) {
    throw new Error('Request context is not available outside an active request scope.');
  }
  return ctx;
};

export const getTenantId = (): string => {
  return getRequestContext().tenantId;
};

export const getUserId = (): string => {
  return getRequestContext().userId;
};
