'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { Store, User, Phone, Mail, Lock, AlertCircle, ArrowRight, ImagePlus } from 'lucide-react';
import { DokaniLogo, ShopLogo } from '@/components/dokani-logo';
import { useSignupMutation } from '@/store/authApi';
import { useUpdateSettingsMutation } from '@/store/settingsApi';
import { setCredentials } from '@/store/authSlice';
import type { AppDispatch } from '@/store';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [tenantName, setTenantName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoError, setLogoError] = useState<string | null>(null);

  const [signup, { isLoading }] = useSignupMutation();
  const [updateSettings, { isLoading: isSavingLogo }] = useUpdateSettingsMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    const cleanedPhone = phone.trim();
    const bdPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanedPhone)) {
      setErrorMessage('Please enter a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX).');
      return;
    }

    try {
      const res = await signup({
        tenantName: tenantName.trim(),
        name: name.trim(),
        phone: cleanedPhone,
        email: email.trim() ? email.trim() : undefined,
        password,
      }).unwrap();

      const payload = res.data;
      dispatch(
        setCredentials({
          user: payload.user,
          token: payload.tokens.accessToken,
          refreshToken: payload.tokens.refreshToken,
        })
      );
      setShowLogoModal(true);
    } catch (err: unknown) {
      const error = err as {
        data?: {
          message?: string;
          details?: Array<{ path: string; message: string }>;
          error?: { message?: string };
        };
      };

      if (error.data?.details && error.data.details.length > 0) {
        const firstDetail = error.data.details[0];
        setErrorMessage(`${firstDetail.message} (${firstDetail.path})`);
      } else {
        setErrorMessage(
          error.data?.message ||
            error.data?.error?.message ||
            'Registration failed. Please check your inputs and try again.'
        );
      }
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6 rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex justify-center">
            <DokaniLogo size={48} />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Register New Store
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Create your merchant account to start digital billing and inventory tracking
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="tenantName"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Store / Shop Name
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Store className="h-4 w-4" />
              </span>
              <input
                id="tenantName"
                name="tenantName"
                type="text"
                required
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="e.g. Bhai Bhai Departmental Store"
                className="block w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Owner Name
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohan Ahmed"
                  className="block w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Phone Number
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="block w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Email Address <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="store@example.com"
                className="block w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Password <span className="text-slate-400 font-normal lowercase">(min 8 characters)</span>
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-60"
          >
            <span>{isLoading ? 'Creating Store Account...' : 'Register Store'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="border-t border-slate-200 pt-4 text-center">
          <p className="text-xs text-slate-600">
            Already registered your store?{' '}
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {showLogoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 !mt-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <ShopLogo name={tenantName || 'Shop'} logoUrl={logoUrl.trim() || null} size="lg" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add Your Shop Logo
                </h3>
                <p className="text-xs text-slate-500">
                  {tenantName || 'Your store'} is ready! Add a logo link or skip to use the default icon.
                </p>
              </div>
            </div>

            {logoError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{logoError}</span>
              </div>
            )}

            <div>
              <label htmlFor="shopLogoUrl" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Shop Logo URL (Optional)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <ImagePlus className="h-4 w-4" />
                </span>
                <input
                  id="shopLogoUrl"
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/shop-logo.png"
                  className="block w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                You can also update or change this anytime from Store Settings.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  router.push('/dashboard');
                  router.refresh();
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Skip for now
              </button>
              <button
                type="button"
                disabled={isSavingLogo || !logoUrl.trim()}
                onClick={async () => {
                  setLogoError(null);
                  try {
                    await updateSettings({ logoUrl: logoUrl.trim() }).unwrap();
                    router.push('/dashboard');
                    router.refresh();
                  } catch (err: unknown) {
                    const e = err as { data?: { message?: string } };
                    setLogoError(e?.data?.message || 'Invalid logo URL. Please check and try again.');
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover transition disabled:opacity-50"
              >
                <span>{isSavingLogo ? 'Saving...' : 'Save Logo & Continue'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
