'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';
import { ShopLogo } from '@/components/dokani-logo';

interface InvitePreview {
  name: string;
  emailOrPhone: string;
  requiresPhoneInput: boolean;
  roleName: string;
  tenantName: string;
  tenantLogoUrl: string | null;
  expiresAt: string;
}

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === 'string' ? params.token : '';

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    let active = true;
    fetch(`/api/v1/staff/invitations/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.message || 'Invitation link is invalid or expired.');
        }
        return json.data as InvitePreview;
      })
      .then((data) => {
        if (active) setInvite(data);
      })
      .catch((err: Error) => {
        if (active) setLoadError(err.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/staff/invitations/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          confirmPassword,
          ...(invite?.requiresPhoneInput && phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || 'Failed to activate account.');
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to activate account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto my-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm animate-pulse space-y-4">
        <div className="h-12 w-12 rounded-xl bg-slate-200 mx-auto" />
        <div className="h-5 w-48 rounded bg-slate-200 mx-auto" />
        <div className="h-32 rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (loadError || !invite) {
    return (
      <div className="mx-auto my-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h1 className="text-lg font-bold text-slate-900">Invitation Unavailable</h1>
        <p className="text-xs text-slate-600">{loadError || 'This invitation link is invalid.'}</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <span>Go to Sign In</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="mx-auto my-16 max-w-md rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm space-y-4">
        <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
        <h1 className="text-lg font-bold text-slate-900">Account Activated</h1>
        <p className="text-xs text-slate-600">
          You have joined <span className="font-semibold text-slate-900">{invite.tenantName}</span> as{' '}
          <span className="font-semibold text-slate-900">{invite.roleName}</span>. Redirecting to sign in...
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover"
        >
          <span>Sign In Now</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto my-12 max-w-md px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <ShopLogo name={invite.tenantName} logoUrl={invite.tenantLogoUrl} size="md" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Join {invite.tenantName}</h1>
          <p className="text-xs text-slate-500">
            Hi <span className="font-semibold text-slate-800">{invite.name}</span>, set your password to activate your staff account.
          </p>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Assigned Role: {invite.roleName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {invite.requiresPhoneInput ? (
            <div>
              <label htmlFor="invite-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number (for login) *
              </label>
              <input
                id="invite-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="01711223344"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
              Login Phone: <span className="font-mono font-semibold text-slate-900">{invite.emailOrPhone}</span>
            </div>
          )}

          <div>
            <label htmlFor="invite-password" className="block text-xs font-semibold text-slate-700 mb-1">
              Password *
            </label>
            <input
              id="invite-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label htmlFor="invite-confirm-password" className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password *
            </label>
            <input
              id="invite-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Re-enter password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {submitError && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isSubmitting ? 'Activating...' : 'Activate Account & Join'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

