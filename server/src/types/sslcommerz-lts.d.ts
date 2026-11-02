declare module 'sslcommerz-lts' {
  interface SSLCommerzInitData {
    total_amount: number;
    currency: string;
    tran_id: string;
    success_url: string;
    fail_url: string;
    cancel_url: string;
    ipn_url?: string;
    shipping_method?: string;
    product_name?: string;
    product_category?: string;
    product_profile?: string;
    cus_name?: string;
    cus_email?: string;
    cus_add1?: string;
    cus_add2?: string;
    cus_city?: string;
    cus_state?: string;
    cus_postcode?: string;
    cus_country?: string;
    cus_phone?: string;
    [key: string]: unknown;
  }

  interface SSLCommerzInitResponse {
    status: string;
    failedreason?: string;
    sessionkey?: string;
    GatewayPageURL?: string;
    [key: string]: unknown;
  }

  interface SSLCommerzValidationResponse {
    status: string;
    tran_date?: string;
    tran_id?: string;
    val_id?: string;
    amount?: string;
    store_amount?: string;
    currency?: string;
    bank_tran_id?: string;
    card_type?: string;
    card_no?: string;
    card_issuer?: string;
    card_brand?: string;
    card_category?: string;
    error?: string;
    [key: string]: unknown;
  }

  export default class SSLCommerzPayment {
    constructor(store_id: string, store_passwd: string, is_live: boolean);
    init(data: SSLCommerzInitData): Promise<SSLCommerzInitResponse>;
    validate(data: { val_id: string }): Promise<SSLCommerzValidationResponse>;
    initiateRefund(data: {
      refund_amount: number;
      refund_remarks?: string;
      bank_tran_id: string;
      refe_id: string;
    }): Promise<unknown>;
    refundQuery(data: { refund_ref_id: string }): Promise<unknown>;
    transactionQueryByTransactionId(data: { tran_id: string }): Promise<unknown>;
    transactionQueryBySessionId(data: { sessionkey: string }): Promise<unknown>;
  }
}
