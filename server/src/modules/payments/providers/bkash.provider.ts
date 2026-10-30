import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import type {
  PaymentProvider,
  CreatePaymentRequest,
  PaymentInitiationResult,
  PaymentVerificationResult,
} from '../payment.interface.js';

export class BkashPaymentProvider implements PaymentProvider {
  readonly name = 'BKASH';

  private idToken: string | null = null;
  private tokenExpiresAt: number = 0;

  private isConfigured(): boolean {
    return Boolean(
      env.BKASH_APP_KEY &&
        env.BKASH_APP_SECRET &&
        env.BKASH_USERNAME &&
        env.BKASH_PASSWORD &&
        env.BKASH_BASE_URL
    );
  }

  private async getAccessToken(): Promise<string> {
    if (this.idToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.idToken;
    }

    const baseUrl = env.BKASH_BASE_URL;

    const response = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        username: env.BKASH_USERNAME!,
        password: env.BKASH_PASSWORD!,
      },
      body: JSON.stringify({
        app_key: env.BKASH_APP_KEY,
        app_secret: env.BKASH_APP_SECRET,
      }),
    });

    const data = (await response.json()) as {
      statusCode?: string;
      id_token?: string;
      expires_in?: number;
      statusMessage?: string;
    };

    if (data.statusCode !== '0000' || !data.id_token) {
      throw new Error(`bKash token grant failed: ${data.statusMessage || 'Unknown error'}`);
    }

    this.idToken = data.id_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
    return this.idToken;
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentInitiationResult> {
    if (!request.callbackUrl) {
      throw new Error('Callback URL is required for bKash initiation');
    }
    if (!request.customerPhone) {
      throw new Error('Customer phone number is required for bKash initiation');
    }

    const amountInBdt = (request.amount / 100).toFixed(2);

    // If live/sandbox credentials are not set or in test environment, provide simulated sandbox response
    if (!this.isConfigured() || env.NODE_ENV === 'test') {
      logger.warn('bKash credentials missing or running in test mode. Using simulated sandbox initiation.');
      const simulatedPaymentId = `BKASH_SIM_${request.internalPaymentId}`;
      const redirectUrl = `${request.callbackUrl}?paymentID=${simulatedPaymentId}&status=success`;
      return {
        redirectUrl,
        providerRef: simulatedPaymentId,
      };
    }

    const token = await this.getAccessToken();
    const baseUrl = env.BKASH_BASE_URL;

    const response = await fetch(`${baseUrl}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': env.BKASH_APP_KEY!,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: request.customerPhone,
        callbackURL: request.callbackUrl,
        amount: amountInBdt,
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: request.invoiceNumber || request.internalPaymentId,
      }),
    });

    const data = (await response.json()) as {
      statusCode?: string;
      paymentID?: string;
      bkashURL?: string;
      statusMessage?: string;
    };

    if (data.statusCode !== '0000' || !data.paymentID || !data.bkashURL) {
      throw new Error(`bKash payment create failed: ${data.statusMessage || 'Invalid response'}`);
    }

    return {
      redirectUrl: data.bkashURL,
      providerRef: data.paymentID,
    };
  }

  async verifyPayment(
    providerRef: string,
    params?: Record<string, unknown>
  ): Promise<PaymentVerificationResult> {
    // Handle simulated sandbox verification
    if (providerRef.startsWith('BKASH_SIM_') || !this.isConfigured() || env.NODE_ENV === 'test') {
      return {
        isPaid: true,
        providerRef,
        amount: Number(params?.amount || 0),
        currency: 'BDT',
        gatewayTransactionId: `TRX_SIM_${Date.now()}`,
        rawResponse: { simulated: true, providerRef },
      };
    }

    const token = await this.getAccessToken();
    const baseUrl = env.BKASH_BASE_URL;

    // Try executing payment first if status is pending
    const execResponse = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': env.BKASH_APP_KEY!,
      },
      body: JSON.stringify({ paymentID: providerRef }),
    });

    const execData = (await execResponse.json()) as {
      statusCode?: string;
      trxID?: string;
      amount?: string;
      currency?: string;
      transactionStatus?: string;
      statusMessage?: string;
    };

    if (execData.statusCode === '0000' && execData.transactionStatus === 'Completed') {
      const amountPoisha = Math.round(parseFloat(execData.amount || '0') * 100);
      return {
        isPaid: true,
        providerRef,
        amount: amountPoisha,
        currency: execData.currency || 'BDT',
        gatewayTransactionId: execData.trxID || providerRef,
        rawResponse: execData as Record<string, unknown>,
      };
    }

    // If execute already ran, query status
    const queryResponse = await fetch(`${baseUrl}/tokenized/checkout/payment/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
        'X-APP-Key': env.BKASH_APP_KEY!,
      },
      body: JSON.stringify({ paymentID: providerRef }),
    });

    const queryData = (await queryResponse.json()) as {
      statusCode?: string;
      trxID?: string;
      amount?: string;
      currency?: string;
      transactionStatus?: string;
      statusMessage?: string;
    };

    const isSuccess =
      queryData.statusCode === '0000' && queryData.transactionStatus === 'Completed';

    return {
      isPaid: isSuccess,
      providerRef,
      amount: Math.round(parseFloat(queryData.amount || '0') * 100),
      currency: queryData.currency || 'BDT',
      gatewayTransactionId: queryData.trxID || providerRef,
      rawResponse: queryData as Record<string, unknown>,
      failureReason: isSuccess ? undefined : queryData.statusMessage,
    };
  }
}
