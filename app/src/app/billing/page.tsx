'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import {
  useGetPlansQuery,
  useGetSubscriptionQuery,
  useSubscribePlanMutation,
} from '@/store/billingApi';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function BillingPage() {
  const { data: plansData, isLoading: isPlansLoading } = useGetPlansQuery();
  const { data: subData, isLoading: isSubLoading, refetch } = useGetSubscriptionQuery();
  const [subscribePlan, { isLoading: isUpgrading }] = useSubscribePlanMutation();

  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const plans = plansData?.data || [];
  const subscription = subData?.data;

  const formatBdt = (paisas: number) => {
    return (paisas / 100).toLocaleString('en-BD', {
      minimumFractionDigits: 0,
    });
  };

  const handleUpgradeSubmit = async (planCode: string) => {
    setUpgradeMsg(null);
    try {
      await subscribePlan({ planCode }).unwrap();
      setUpgradeMsg({ text: `Successfully subscribed to ${planCode} plan!` });
      setSelectedPlanCode(null);
      refetch();
    } catch (err: any) {
      setUpgradeMsg({
        text: err?.data?.message || 'Upgrade failed. Please try again.',
        isError: true,
      });
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription & Billing</h1>
            <p className="text-sm text-slate-600">
              Manage your Dokani retail OS subscription plan, usage limits, and gateway renewals.
            </p>
          </div>

          {upgradeMsg && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                upgradeMsg.isError
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{upgradeMsg.text}</span>
            </div>
          )}

          {/* Current Plan & Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 mb-3">
                  <Zap className="w-3.5 h-3.5" />
                  Active Subscription
                </div>
                <h2 className="text-2xl font-black tracking-tight">
                  {subscription?.plan?.name || 'Free Tier'} Plan
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Status: <span className="text-white font-medium capitalize">{subscription?.status || 'Active'}</span>
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-400">
                Billing Cycle: Monthly BDT Settlement
              </div>
            </div>

            {/* Usage Meters */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900">Resource Usage & Quotas</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Catalog Products</span>
                    <span className="text-slate-900">
                      {subscription?.usage?.productsCount || 0} /{' '}
                      {subscription?.plan?.maxProducts ? subscription.plan.maxProducts : 'Unlimited'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((subscription?.usage?.productsCount || 0) /
                            (subscription?.plan?.maxProducts || 100)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Staff Accounts</span>
                    <span className="text-slate-900">
                      {subscription?.usage?.usersCount || 1} /{' '}
                      {subscription?.plan?.maxUsers ? subscription.plan.maxUsers : 'Unlimited'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((subscription?.usage?.usersCount || 1) /
                            (subscription?.plan?.maxUsers || 10)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Invoices This Month</span>
                    <span className="text-slate-900">
                      {subscription?.usage?.invoicesThisMonth || 0} /{' '}
                      {subscription?.plan?.maxInvoicesPerMonth
                        ? subscription.plan.maxInvoicesPerMonth
                        : 'Unlimited'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((subscription?.usage?.invoicesThisMonth || 0) /
                            (subscription?.plan?.maxInvoicesPerMonth || 1000)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Comparison Cards */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Upgrade Your Retail Plan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((p) => {
                const isCurrent = subscription?.plan?.code === p.code;
                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${
                      isCurrent ? 'border-2 border-slate-900 ring-4 ring-slate-100' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="mb-4">
                        <span className="text-2xl font-black text-slate-900">
                          ৳{formatBdt(p.priceMonthly)}
                        </span>
                        <span className="text-xs text-slate-500"> /month</span>
                      </div>

                      <ul className="text-xs text-slate-600 space-y-2 mb-6">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Max {p.maxProducts.toLocaleString()} Products</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Max {p.maxUsers} Staff Accounts</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{p.maxInvoicesPerMonth.toLocaleString()} Invoices/mo</span>
                        </li>
                        {p.features?.map((f, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      disabled={isCurrent || isUpgrading}
                      onClick={() => handleUpgradeSubmit(p.code)}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold transition ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : `Upgrade to ${p.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
      </div>
    </AuthGuard>
  );
}
