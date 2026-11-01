'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  useGetPublicInvoiceQuery,
  useCompleteSimulatedPaymentMutation,
} from '../../../store/paymentApi';
import {
  CheckCircle2,
  CreditCard,
  Printer,
  ShieldCheck,
  Store,
  AlertCircle,
  ArrowRight,
  Lock,
  Smartphone,
  ArrowLeft,
  Building2,
} from 'lucide-react';

function PublicPaymentContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = typeof params.token === 'string' ? params.token : '';
  const providerParam = searchParams.get('provider')?.toUpperCase();

  const { data, isLoading, isError, refetch } = useGetPublicInvoiceQuery(token, {
    skip: !token,
  });

  const [completePayment, { isLoading: isSubmitting }] =
    useCompleteSimulatedPaymentMutation();

  const [selectedMethod, setSelectedMethod] = useState<'BKASH' | 'SSLCOMMERZ'>('BKASH');
  const [step, setStep] = useState<'SELECTION' | 'GATEWAY' | 'OTP' | 'SUCCESS'>('SELECTION');
  const [sslTab, setSslTab] = useState<'CARDS' | 'MOBILE' | 'NET_BANKING'>('CARDS');

  // Input states
  const [accountNumber, setAccountNumber] = useState('01711111111');
  const [pin, setPin] = useState('12345');
  const [otp, setOtp] = useState('123456');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    invoiceNumber: string;
    transactionId: string;
    amount: number;
    provider: string;
  } | null>(null);

  // Automatically select provider & step from query param if redirected from checkout
  useEffect(() => {
    if (providerParam === 'BKASH') {
      setSelectedMethod('BKASH');
      setStep('GATEWAY');
    } else if (providerParam === 'SSLCOMMERZ') {
      setSelectedMethod('SSLCOMMERZ');
      setStep('GATEWAY');
    }
  }, [providerParam]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center animate-pulse">
          <div className="h-12 w-12 bg-slate-200 rounded-full mx-auto mb-4" />
          <div className="h-5 bg-slate-200 rounded w-1/2 mx-auto mb-3" />
          <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invoice Not Found</h1>
          <p className="text-xs text-slate-600 mb-6">
            This payment link is invalid, expired, or has already been settled.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition"
            >
              Retry
            </button>
            <Link
              href="/pos"
              className="flex-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition text-center"
            >
              Go to POS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const invoice = data.data;
  const isAlreadyPaid = invoice.status === 'COMPLETED' && invoice.dueTotal === 0;

  const handleStartGateway = () => {
    setErrorMessage('');
    setStep('GATEWAY');
  };

  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (selectedMethod === 'BKASH') {
      if (!/^01[3-9]\d{8}$/.test(accountNumber.trim())) {
        setErrorMessage('Enter a valid 11-digit Bangladeshi mobile number.');
        return;
      }
    }
    setStep('OTP');
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (otp.trim().length !== 6 && otp.trim() !== '123456') {
      setErrorMessage('Please enter the 6-digit verification code (demo: 123456).');
      return;
    }

    if (selectedMethod === 'BKASH' && pin.trim().length !== 5) {
      setErrorMessage('Please enter your 5-digit confidential bKash PIN (demo: 12345).');
      return;
    }

    try {
      const response = await completePayment({
        token,
        provider: selectedMethod,
        account: accountNumber,
        pin: pin,
      }).unwrap();

      setPaymentSuccessData({
        invoiceNumber: response.invoiceNumber,
        transactionId: response.transactionId,
        amount: response.amount,
        provider: selectedMethod,
      });
      setStep('SUCCESS');
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string } };
      setErrorMessage(errObj?.data?.message ?? 'Payment failed. Please try again.');
    }
  };

  const formatBdt = (amount: number) => {
    return Number(amount).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800 font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Store className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-900 tracking-tight text-sm">Dokani Hosted Gateway</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-bit SSL Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 my-auto">
        {step === 'SUCCESS' || isAlreadyPaid ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 text-center bg-gradient-to-b from-emerald-50 to-white border-b border-slate-100">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 ring-8 ring-emerald-50">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Payment Successful</h1>
              <p className="text-xs text-slate-600">
                Thank you! Payment received and settled for {invoice.tenant.name}.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Invoice Number</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {paymentSuccessData?.invoiceNumber || invoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {paymentSuccessData?.transactionId || 'TRX-ONLINE-CONFIRMED'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Payment Channel</span>
                  <span className="font-semibold text-slate-900">
                    {paymentSuccessData?.provider || selectedMethod}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Amount Paid</span>
                  <span className="text-base font-black text-emerald-600">
                    ৳{formatBdt(paymentSuccessData?.amount || invoice.total)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <Link
                  href="/pos"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 bg-white rounded-xl text-xs font-semibold hover:bg-slate-50 transition text-center"
                >
                  Return to POS Terminal
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Shop & Bill Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Merchant
                  </div>
                  <h1 className="text-base font-bold text-slate-900">{invoice.tenant.name}</h1>
                  {invoice.tenant.phone && (
                    <p className="text-[11px] text-slate-500">Phone: {invoice.tenant.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Invoice
                  </span>
                  <span className="font-mono font-semibold text-slate-800 text-xs">
                    #{invoice.invoiceNumber}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Total Payable</span>
                <span className="text-xl font-black text-slate-900">
                  ৳{formatBdt(invoice.dueTotal > 0 ? invoice.dueTotal : invoice.total)}
                </span>
              </div>
            </div>

            {/* STEP 1: PAYMENT METHOD SELECTION */}
            {step === 'SELECTION' && (
              <div className="p-6 space-y-4">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Payment Method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('BKASH')}
                    className={`p-3.5 rounded-xl border-2 text-left transition flex items-center justify-between ${
                      selectedMethod === 'BKASH'
                        ? 'border-[#E2136E] bg-pink-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-5 h-5 text-[#E2136E]" />
                      <div>
                        <span className="block text-xs font-bold text-[#E2136E]">bKash Checkout</span>
                        <span className="text-[10px] text-slate-500">Instant mobile wallet</span>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedMethod === 'BKASH'
                          ? 'border-[#E2136E] bg-[#E2136E]'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedMethod === 'BKASH' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('SSLCOMMERZ')}
                    className={`p-3.5 rounded-xl border-2 text-left transition flex items-center justify-between ${
                      selectedMethod === 'SSLCOMMERZ'
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      <div>
                        <span className="block text-xs font-bold text-indigo-950">SSLCommerz</span>
                        <span className="text-[10px] text-slate-500">Cards & Internet banking</span>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedMethod === 'SSLCOMMERZ'
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedMethod === 'SSLCOMMERZ' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleStartGateway}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <span>Proceed to Payment Gateway</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: OFFICIAL GATEWAY SCREEN */}
            {step === 'GATEWAY' && (
              <div className="p-6">
                {selectedMethod === 'BKASH' ? (
                  <form onSubmit={handleProceedToOtp} className="space-y-4">
                    {/* bKash Official Banner */}
                    <div className="bg-[#E2136E] text-white p-4 rounded-xl text-center space-y-1">
                      <p className="text-[11px] tracking-wider uppercase font-semibold opacity-90">
                        bKash Official Payment Gateway
                      </p>
                      <p className="text-xl font-black">
                        ৳{formatBdt(invoice.dueTotal > 0 ? invoice.dueTotal : invoice.total)}
                      </p>
                      <p className="text-[11px] opacity-80">Merchant: {invoice.tenant.name}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800">
                          Your bKash Account Number
                        </label>
                        <button
                          type="button"
                          onClick={() => setAccountNumber('01711111111')}
                          className="text-[11px] font-semibold text-[#E2136E] hover:underline"
                        >
                          ⚡ Use Demo: 01711111111
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={11}
                        placeholder="01XXXXXXXXX"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Enter any valid 11-digit Bangladeshi mobile number
                      </p>
                    </div>

                    {errorMessage && (
                      <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                        {errorMessage}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep('SELECTION')}
                        className="w-1/3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700"
                      >
                        Change Method
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-[#E2136E] hover:bg-[#c2105e] text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        Confirm & Proceed
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleProceedToOtp} className="space-y-4">
                    {/* SSLCommerz Official Banner */}
                    <div className="bg-indigo-950 text-white p-4 rounded-xl text-center space-y-1">
                      <p className="text-[11px] tracking-wider uppercase font-semibold text-indigo-200">
                        SSLCommerz Hosted Checkout
                      </p>
                      <p className="text-xl font-black">
                        ৳{formatBdt(invoice.dueTotal > 0 ? invoice.dueTotal : invoice.total)}
                      </p>
                      <p className="text-[11px] text-indigo-300">Merchant: {invoice.tenant.name}</p>
                    </div>

                    {/* SSLCommerz Tabs */}
                    <div className="flex border-b border-slate-200 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setSslTab('CARDS')}
                        className={`py-2 px-3 border-b-2 transition ${
                          sslTab === 'CARDS'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Cards
                      </button>
                      <button
                        type="button"
                        onClick={() => setSslTab('MOBILE')}
                        className={`py-2 px-3 border-b-2 transition ${
                          sslTab === 'MOBILE'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Mobile Banking
                      </button>
                      <button
                        type="button"
                        onClick={() => setSslTab('NET_BANKING')}
                        className={`py-2 px-3 border-b-2 transition ${
                          sslTab === 'NET_BANKING'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Net Banking
                      </button>
                    </div>

                    {sslTab === 'CARDS' && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700">Card Number</label>
                            <span className="text-[11px] font-semibold text-indigo-600">⚡ Demo Card</span>
                          </div>
                          <input
                            type="text"
                            placeholder="4123 4567 8901 2345"
                            defaultValue="4123 4567 8901 2345"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Expiry (MM/YY)</label>
                            <input
                              type="text"
                              placeholder="12/28"
                              defaultValue="12/28"
                              required
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">CVV</label>
                            <input
                              type="password"
                              placeholder="123"
                              defaultValue="123"
                              maxLength={4}
                              required
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {sslTab === 'MOBILE' && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            className="p-2 border border-indigo-600 bg-indigo-50 rounded-xl text-center text-xs font-bold text-indigo-900"
                          >
                            Nagad
                          </button>
                          <button
                            type="button"
                            className="p-2 border border-slate-200 rounded-xl text-center text-xs font-medium text-slate-700"
                          >
                            Rocket
                          </button>
                          <button
                            type="button"
                            className="p-2 border border-slate-200 rounded-xl text-center text-xs font-medium text-slate-700"
                          >
                            Upay
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="017XXXXXXXX"
                          defaultValue="01711111111"
                          required
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                        />
                      </div>
                    )}

                    {sslTab === 'NET_BANKING' && (
                      <div className="space-y-3 pt-1">
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800">
                          <option>City Bank (Citytouch)</option>
                          <option>BRAC Bank (Astha)</option>
                          <option>Islami Bank (CellFin)</option>
                          <option>Dutch Bangla Bank (Nexus)</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Bank Customer ID / Account"
                          defaultValue="ACC-992182"
                          required
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                        />
                      </div>
                    )}

                    {errorMessage && (
                      <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                        {errorMessage}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep('SELECTION')}
                        className="w-1/3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700"
                      >
                        Change Method
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        Proceed to 3D Secure
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* STEP 3: OTP & PIN AUTHORIZATION */}
            {step === 'OTP' && (
              <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
                <div className="text-center space-y-1 mb-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-700">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedMethod === 'BKASH' ? 'bKash PIN & Verification' : '3D Secure Authorization'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter the test verification code to authorize payment.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      6-Digit Verification Code (OTP)
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtp('123456')}
                      className="text-[11px] font-semibold text-brand hover:underline"
                    >
                      ⚡ Fill Demo: 123456
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="w-full text-center tracking-widest text-lg font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {selectedMethod === 'BKASH' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800">
                        5-Digit bKash PIN
                      </label>
                      <button
                        type="button"
                        onClick={() => setPin('12345')}
                        className="text-[11px] font-semibold text-[#E2136E] hover:underline"
                      >
                        ⚡ Fill Demo: 12345
                      </button>
                    </div>
                    <input
                      type="password"
                      maxLength={5}
                      placeholder="•••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      required
                      className="w-full text-center tracking-widest text-lg px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 font-mono"
                    />
                  </div>
                )}

                {errorMessage && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    {errorMessage}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('GATEWAY')}
                    className="w-1/3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    {isSubmitting ? 'Verifying...' : 'Authorize & Settle Payment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Powered by Dokani OS &bull; Secure Multi-Tenant Retail Platform
      </footer>
    </div>
  );
}

export default function PublicPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center animate-pulse">
            <div className="h-12 w-12 bg-slate-200 rounded-full mx-auto mb-4" />
            <div className="h-5 bg-slate-200 rounded w-1/2 mx-auto mb-3" />
          </div>
        </div>
      }
    >
      <PublicPaymentContent />
    </Suspense>
  );
}
