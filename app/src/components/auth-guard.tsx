'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ShieldAlert, Store, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { RootState } from '@/store';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { user, isInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login');
    }
  }, [isInitialized, user, router]);

  if (!isInitialized) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto my-12 max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">Authentication Required</h2>
        <p className="mt-1.5 text-xs text-slate-500">
          You must be signed in with your merchant account to access products, inventory, and billing.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-hover"
          >
            <Store className="h-4 w-4" />
            <span>Sign in to Store</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Create New Store
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
