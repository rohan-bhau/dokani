import { prisma, Prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../common/errors.js';

export class PaymentRepository {
  async createPendingPayment(data: {
    tenantId: string;
    invoiceId?: string | undefined;
    customerId?: string | undefined;
    method: 'BKASH' | 'CARD';
    provider: 'BKASH' | 'SSLCOMMERZ';
    amount: bigint;
  }) {
    return prisma.payment.create({
      data: {
        tenantId: data.tenantId,
        invoiceId: data.invoiceId ?? null,
        customerId: data.customerId ?? null,
        method: data.method,
        status: 'PENDING',
        provider: data.provider,
        amount: data.amount,
      },
    });
  }

  async updatePaymentProviderRef(id: string, providerRef: string) {
    return prisma.payment.update({
      where: { id },
      data: { providerRef },
    });
  }

  async findPaymentById(id: string, tenantId?: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return null;
    }
    return prisma.payment.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        invoice: true,
        customer: true,
      },
    });
  }

  async findPaymentByProviderRef(providerRef: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerRef);

    return prisma.payment.findFirst({
      where: {
        OR: [{ providerRef }, ...(isUuid ? [{ id: providerRef }] : [])],
      },
      include: {
        invoice: true,
        customer: true,
      },
    });
  }

  async isWebhookProcessed(provider: string, eventId: string): Promise<boolean> {
    const existing = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider,
          eventId,
        },
      },
    });
    return existing?.status === 'PROCESSED';
  }

  async recordWebhookEvent(data: {
    tenantId?: string | undefined;
    provider: string;
    eventId: string;
    eventType: string;
    payload: Prisma.InputJsonValue;
  }) {
    return prisma.webhookEvent.upsert({
      where: {
        provider_eventId: {
          provider: data.provider,
          eventId: data.eventId,
        },
      },
      create: {
        tenantId: data.tenantId ?? null,
        provider: data.provider,
        eventId: data.eventId,
        eventType: data.eventType,
        payload: data.payload,
        status: 'RECEIVED',
      },
      update: {
        payload: data.payload,
      },
    });
  }

  async markWebhookProcessed(provider: string, eventId: string) {
    return prisma.webhookEvent.update({
      where: {
        provider_eventId: {
          provider,
          eventId,
        },
      },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });
  }

  async confirmPayment(
    paymentId: string,
    gatewayTxnId: string,
    rawResponse: Prisma.InputJsonValue
  ) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { invoice: true, customer: true },
      });

      if (!payment) {
        throw new NotFoundError('Payment record not found');
      }

      // If already marked success, return early idempotently
      if (payment.status === 'SUCCESS') {
        return payment;
      }

      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCESS',
          reference: gatewayTxnId,
          metadata: rawResponse,
        },
      });

      // Update invoice if payment is tied to an invoice
      if (payment.invoiceId && payment.invoice) {
        const newPaidTotal = payment.invoice.paidTotal + payment.amount;
        const newDueTotal =
          payment.invoice.total > newPaidTotal ? payment.invoice.total - newPaidTotal : 0n;

        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidTotal: newPaidTotal,
            dueTotal: newDueTotal,
          },
        });
      }

      // Update customer due ledger if payment is tied to a customer
      if (payment.customerId && payment.customer) {
        const updatedCustomer = await tx.customer.update({
          where: { id: payment.customerId },
          data: {
            dueBalance: { decrement: payment.amount },
          },
        });

        await tx.customerLedger.create({
          data: {
            tenantId: payment.tenantId,
            customerId: payment.customerId,
            type: 'PAYMENT_RECEIVED',
            amount: payment.amount,
            balanceAfter: updatedCustomer.dueBalance,
            referenceId: payment.id,
            notes: `Digital payment via ${payment.provider || 'Gateway'}`,
          },
        });
      }

      return updatedPayment;
    });
  }

  async failPayment(paymentId: string, reason: string, rawResponse: Prisma.InputJsonValue) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        metadata: {
          reason,
          raw: rawResponse,
        },
      },
    });
  }
}
