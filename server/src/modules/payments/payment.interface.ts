export interface CreatePaymentRequest {
  amount: number; // in poisha (1 BDT = 100 poisha)
  currency: string; // 'BDT'
  invoiceNumber: string;
  internalPaymentId: string;
  customerName?: string | undefined;
  customerPhone?: string | undefined;
  customerEmail?: string | undefined;
  customerAddress?: string | undefined;
  callbackUrl?: string | undefined;
}

export interface PaymentInitiationResult {
  redirectUrl: string;
  providerRef: string;
}

export interface PaymentVerificationResult {
  isPaid: boolean;
  providerRef: string;
  amount: number; // in poisha
  currency: string;
  gatewayTransactionId: string;
  rawResponse: Record<string, unknown>;
  failureReason?: string | undefined;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(request: CreatePaymentRequest): Promise<PaymentInitiationResult>;
  verifyPayment(
    providerRef: string,
    params?: Record<string, unknown>
  ): Promise<PaymentVerificationResult>;
}
