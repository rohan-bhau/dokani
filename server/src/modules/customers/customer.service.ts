import { CustomerRepository } from './customer.repository.js';
import { NotFoundError } from '../../common/errors.js';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  QueryCustomerInput,
  CollectDueInput,
} from '@dokani/shared';

function serializeCustomer(customer: any) {
  if (!customer) return null;
  return {
    ...customer,
    dueBalance: Number(customer.dueBalance),
  };
}

function serializeLedger(item: any) {
  if (!item) return null;
  return {
    ...item,
    amount: Number(item.amount),
    balanceAfter: Number(item.balanceAfter),
  };
}

export class CustomerService {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async create(tenantId: string, input: CreateCustomerInput, createdBy?: string) {
    const customer = await this.customerRepo.create(tenantId, input, createdBy);
    return serializeCustomer(customer);
  }

  async findAll(tenantId: string, query: QueryCustomerInput) {
    const result = await this.customerRepo.findAll(tenantId, query);
    return {
      ...result,
      items: result.items.map(serializeCustomer),
    };
  }

  async findById(tenantId: string, id: string) {
    const customer = await this.customerRepo.findById(tenantId, id);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    return serializeCustomer(customer);
  }

  async update(tenantId: string, id: string, input: UpdateCustomerInput) {
    const existing = await this.customerRepo.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    await this.customerRepo.update(tenantId, id, input);
    return this.findById(tenantId, id);
  }

  async collectDue(
    tenantId: string,
    customerId: string,
    input: CollectDueInput,
    createdBy?: string
  ) {
    const result = await this.customerRepo.collectDue(tenantId, customerId, input, createdBy);
    return {
      customer: serializeCustomer(result.customer),
      payment: {
        ...result.payment,
        amount: Number(result.payment.amount),
      },
      ledger: serializeLedger(result.ledger),
    };
  }

  async getLedger(tenantId: string, customerId: string, page = 1, limit = 20) {
    const existing = await this.customerRepo.findById(tenantId, customerId);
    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    const result = await this.customerRepo.getLedger(tenantId, customerId, page, limit);
    return {
      ...result,
      items: result.items.map(serializeLedger),
    };
  }
}
