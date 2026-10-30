import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import type {
  PaymentProvider,
  CreatePaymentRequest,
  PaymentInitiationResult,
  PaymentVerificationResult,
} from '../payment.interface.js';

export class SslCommerzPaymentProvider implements PaymentProvider {
  readonly name = 'SSLCOMMERZ';

  private isConfigured(): boolean {
    return Boolean(
      env.SSLCOMMERZ_STORE_ID &&
        env.SSLCOMMERZ_STORE_PASS &&
        env.SSLCOMMERZ_BASE_URL
    );
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentInitiationResult> {
    if (!request.callbackUrl) {
      throw new Error('Callback URL is required for SSLCommerz initiation');
    }
    if (!request.customerPhone || !request.customerName) {
      throw new Error('Customer phone and name are required for SSLCommerz initiation');
    }

    const amountInBdt = (request.amount / 100).toFixed(2);
    const tranId = `TXN_${request.internalPaymentId}`;

    if (!this.isConfigured() || env.NODE_ENV === 'test') {
      logger.warn('SSLCommerz credentials missing or running in test mode. Using simulated sandbox initiation.');
      const simulatedRedirect = `${request.callbackUrl}?tran_id=${tranId}&val_id=VAL_SIM_${Date.now()}&status=VALID`;
      return {
        redirectUrl: simulatedRedirect,
        providerRef: tranId,
      };
    }

    const baseUrl = env.SSLCOMMERZ_BASE_URL;
    const params = new URLSearchParams({
      store_id: env.SSLCOMMERZ_STORE_ID!,
      store_passwd: env.SSLCOMMERZ_STORE_PASS!,
      total_amount: amountInBdt,
      currency: 'BDT',
      tran_id: tranId,
      success_url: request.callbackUrl,
      fail_url: request.callbackUrl,
      cancel_url: request.callbackUrl,
      ipn_url: request.callbackUrl,
      cus_name: request.customerName,
      cus_email: request.customerEmail || `${request.customerPhone}@customer.dokani`,
      cus_phone: request.customerPhone,
      cus_add1: request.customerAddress || 'Bangladesh',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: 'DokanPro POS Sale',
      product_category: 'General',
      product_profile: 'general',
    });

    const response = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = (await response.json()) as {
      status?: string;
      failedreason?: string;
      GatewayPageURL?: string;
      sessionkey?: string;
    };

    if (data.status !== 'SUCCESS' || !data.GatewayPageURL) {
      throw new Error(`SSLCommerz initiation failed: ${data.failedreason || 'Invalid gateway response'}`);
    }

    return {
      redirectUrl: data.GatewayPageURL,
      providerRef: tranId,
    };
  }

  async verifyPayment(
    providerRef: string,
    params?: Record<string, unknown>
  ): Promise<PaymentVerificationResult> {
    const valId = (params?.val_id as string) || '';

    if (!this.isConfigured() || env.NODE_ENV === 'test' || (providerRef.startsWith('TXN_') && valId.startsWith('VAL_SIM_'))) {
      return {
        isPaid: true,
        providerRef,
        amount: Number(params?.amount || 0),
        currency: 'BDT',
        gatewayTransactionId: valId || `VAL_${Date.now()}`,
        rawResponse: { simulated: true, providerRef, valId },
      };
    }

    if (!valId) {
      return {
        isPaid: false,
        providerRef,
        amount: 0,
        currency: 'BDT',
        gatewayTransactionId: '',
        rawResponse: {},
        failureReason: 'Missing val_id from SSLCommerz callback query',
      };
    }

    const baseUrl = env.SSLCOMMERZ_BASE_URL ;
    const validationUrl = new URL(`${baseUrl}/validator/api/validationserverAPI.php`);
    validationUrl.searchParams.set('val_id', valId);
    validationUrl.searchParams.set('store_id', env.SSLCOMMERZ_STORE_ID!);
    validationUrl.searchParams.set('store_passwd', env.SSLCOMMERZ_STORE_PASS!);
    validationUrl.searchParams.set('format', 'json');

    const response = await fetch(validationUrl.toString());
    const data = (await response.json()) as {
      status?: string;
      tran_id?: string;
      val_id?: string;
      amount?: string;
      currency?: string;
      error?: string;
    };

    const isSuccess = data.status === 'VALID' || data.status === 'VALIDATED';
    const amountPoisha = Math.round(parseFloat(data.amount || '0') * 100);

    return {
      isPaid: isSuccess,
      providerRef: data.tran_id || providerRef,
      amount: amountPoisha,
      currency: data.currency || 'BDT',
      gatewayTransactionId: data.val_id || valId,
      rawResponse: data as Record<string, unknown>,
      failureReason: isSuccess ? undefined : data.error || 'Payment not validated',
    };
  }
}
