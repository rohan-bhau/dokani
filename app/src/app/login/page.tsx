'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { Store, Lock, Phone, AlertCircle, ArrowRight } from 'lucide-react';
import { useLoginMutation } from '@/store/authApi';
import { setCredentials } from '@/store/authSlice';
import type { AppDispatch } from '@/store';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const res = await login({ phone: phone.trim(), password }).unwrap();
      const payload = res.data;
      dispatch(
        setCredentials({
          user: payload.user,
          token: payload.tokens.accessToken,
          refreshToken: payload.tokens.refreshToken,
        })
      );
      router.push('/products');
      router.refresh();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string; error?: { message?: string } } };
      setErrorMessage(
        error.data?.message ||
          error.data?.error?.message ||
          'Login failed. Please verify your phone number and password.'
      );
    }
  };

  const handleUseDemo = (demoPhone: string) => {
    setPhone(demoPhone);
    setPassword('Password123!');
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
            <Store className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Sign in to Dokani
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter your merchant phone and password to access your store
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

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Password
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
            <span>{isLoading ? 'Signing in...' : 'Sign in to Store'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="border-t border-slate-200 pt-4">
          <p className="text-center text-xs text-slate-600">
            Do not have a merchant account?{' '}
            <Link href="/register" className="font-semibold text-brand hover:underline">
              Register Store
            </Link>
          </p>

          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Quick Test Credentials:</span>
            <div className="mt-2 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleUseDemo('01711111111')}
                className="flex items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs transition hover:bg-slate-100"
              >
                <span className="font-medium text-slate-800">Karim Store (Owner)</span>
                <span className="text-[11px] text-brand">Fill: 01711111111</span>
              </button>
              <button
                type="button"
                onClick={() => handleUseDemo('01822222222')}
                className="flex items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs transition hover:bg-slate-100"
              >
                <span className="font-medium text-slate-800">Rahim Store (Owner)</span>
                <span className="text-[11px] text-brand">Fill: 01822222222</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
