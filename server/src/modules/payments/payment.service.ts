import { PaymentRepository } from './payment.repository.js';
import { prisma } from '../../config/prisma.js';
import { BkashPaymentProvider } from './providers/bkash.provider.js';
import { SslCommerzPaymentProvider } from './providers/sslcommerz.provider.js';
import type { PaymentProvider } from './payment.interface.js';
import { emitToTenant } from '../../config/socket.js';
import { BadRequestError, NotFoundError } from '../../common/errors.js';
import type { InitiatePaymentInput } from '@dokani/shared';

export class PaymentService {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor(private readonly paymentRepo: PaymentRepository) {
    const bkash = new BkashPaymentProvider();
    const sslcommerz = new SslCommerzPaymentProvider();

    this.providers.set(bkash.name, bkash);
    this.providers.set(sslcommerz.name, sslcommerz);
  }

  private getProvider(name: string): PaymentProvider {
    const provider = this.providers.get(name.toUpperCase());
    if (!provider) {
      throw new BadRequestError(`Unsupported payment provider: ${name}`);
    }
    return provider;
  }

  async initiatePayment(tenantId: string, input: InitiatePaymentInput) {
    const provider = this.getProvider(input.provider);

    const pendingPayment = await this.paymentRepo.createPendingPayment({
      tenantId,
      invoiceId: input.invoiceId,
      customerId: input.customerId,
      method: input.provider === 'BKASH' ? 'BKASH' : 'CARD',
      provider: input.provider,
      amount: BigInt(input.amount),
    });

    let customerName = input.customerName;
    let customerPhone = input.customerPhone;
    let customerEmail: string | undefined;
    let customerAddress: string | undefined;

    if (input.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: input.customerId, tenantId },
      });
      if (customer) {
        customerName = customerName || customer.name;
        customerPhone = customerPhone || customer.phone;
        customerEmail = customer.email ?? undefined;
        customerAddress = customer.address ?? undefined;
      }
    }

    if (!customerPhone) {
      throw new BadRequestError('Customer phone number is required for payment initiation.');
    }
    if (input.provider === 'SSLCOMMERZ' && !customerName) {
      throw new BadRequestError('Customer name is required for SSLCommerz payment initiation.');
    }
    if (!input.callbackUrl) {
      throw new BadRequestError('Callback URL is required for payment initiation.');
    }

    try {
      const initiation = await provider.createPayment({
        amount: input.amount,
        currency: 'BDT',
        invoiceNumber: input.invoiceId || pendingPayment.id,
        internalPaymentId: pendingPayment.id,
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        callbackUrl: input.callbackUrl,
      });

      await this.paymentRepo.updatePaymentProviderRef(pendingPayment.id, initiation.providerRef);

      return {
        paymentId: pendingPayment.id,
        provider: input.provider,
        redirectUrl: initiation.redirectUrl,
        providerRef: initiation.providerRef,
        amount: input.amount,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment initiation failed';
      await this.paymentRepo.failPayment(pendingPayment.id, message, { error: message });
      throw err;
    }
  }

  async handleCallbackOrIpn(providerName: string, queryOrBody: Record<string, unknown>) {
    const provider = this.getProvider(providerName);

    // Extract reference
    const providerRef =
      (typeof queryOrBody.paymentID === 'string' && queryOrBody.paymentID) ||
      (typeof queryOrBody.tran_id === 'string' && queryOrBody.tran_id) ||
      (typeof queryOrBody.providerRef === 'string' && queryOrBody.providerRef) ||
      (typeof queryOrBody.paymentId === 'string' && queryOrBody.paymentId) ||
      null;

    if (!providerRef) {
      throw new BadRequestError('Missing payment provider reference identifier in callback payload.');
    }

    const payment = await this.paymentRepo.findPaymentByProviderRef(providerRef);
    if (!payment) {
      throw new NotFoundError(`Payment not found for provider reference: ${providerRef}`);
    }

    // Idempotent webhook event deduplication
    const eventId =
      (typeof queryOrBody.val_id === 'string' && queryOrBody.val_id) ||
      (typeof queryOrBody.trxID === 'string' && queryOrBody.trxID) ||
      `${providerRef}_callback`;
    const alreadyProcessed = await this.paymentRepo.isWebhookProcessed(provider.name, eventId);
    if (alreadyProcessed) {
      return {
        success: true,
        paymentId: payment.id,
        status: 'SUCCESS',
        idempotentReplay: true,
      };
    }

    await this.paymentRepo.recordWebhookEvent({
      tenantId: payment.tenantId,
      provider: provider.name,
      eventId,
      eventType: 'PAYMENT_CALLBACK',
      payload: queryOrBody as import('@prisma/client').Prisma.InputJsonValue,
    });

    // Verify payment server-to-server with gateway
    const verification = await provider.verifyPayment(providerRef, {
      ...queryOrBody,
      amount: Number(payment.amount),
    });

    if (verification.isPaid) {
      const confirmedPayment = await this.paymentRepo.confirmPayment(
        payment.id,
        verification.gatewayTransactionId,
        verification.rawResponse as import('@prisma/client').Prisma.InputJsonValue
      );

      await this.paymentRepo.markWebhookProcessed(provider.name, eventId);

      // Instant Cashier Real-time Sync via Socket.io
      emitToTenant(payment.tenantId, 'payment:confirmed', {
        paymentId: confirmedPayment.id,
        invoiceId: confirmedPayment.invoiceId,
        amount: Number(confirmedPayment.amount),
        provider: confirmedPayment.provider,
        reference: confirmedPayment.reference,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        paymentId: confirmedPayment.id,
        status: 'SUCCESS',
        invoiceId: confirmedPayment.invoiceId,
        amount: Number(confirmedPayment.amount),
      };
    } else {
      await this.paymentRepo.failPayment(
        payment.id,
        verification.failureReason || 'Verification failed',
        verification.rawResponse as import('@prisma/client').Prisma.InputJsonValue
      );

      emitToTenant(payment.tenantId, 'payment:failed', {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        provider: payment.provider,
        reason: verification.failureReason,
        status: 'FAILED',
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        paymentId: payment.id,
        status: 'FAILED',
        reason: verification.failureReason,
      };
    }
  }

  async getPaymentStatus(tenantId: string, paymentId: string) {
    const payment = await this.paymentRepo.findPaymentById(paymentId, tenantId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    return {
      id: payment.id,
      tenantId: payment.tenantId,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      status: payment.status,
      provider: payment.provider,
      providerRef: payment.providerRef,
      amount: Number(payment.amount),
      reference: payment.reference,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
