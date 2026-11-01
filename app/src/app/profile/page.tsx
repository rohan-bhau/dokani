'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useSetApprovalPinMutation,
} from '@/store/authApi';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
} from 'lucide-react';

export default function ProfilePage() {
  const { data, isLoading, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [setApprovalPin, { isLoading: isSettingPin }] = useSetApprovalPinMutation();

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [showBanglaDigits, setShowBanglaDigits] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [profileMsg, setProfileMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [pinMsg, setPinMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const profile = data?.data;

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setLanguage(profile.language || 'en');
      setShowBanglaDigits(profile.showBanglaDigits || false);
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await updateProfile({
        name: name.trim(),
        language,
        showBanglaDigits,
      }).unwrap();
      setProfileMsg({ text: 'Profile preferences saved successfully.' });
      refetch();
    } catch (err: any) {
      setProfileMsg({ text: err?.data?.message || 'Failed to update profile.', isError: true });
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinMsg({ text: 'PIN must be exactly 4 digits.', isError: true });
      return;
    }

    if (pin !== confirmPin) {
      setPinMsg({ text: 'PIN and confirmation do not match.', isError: true });
      return;
    }

    try {
      await setApprovalPin({ pin }).unwrap();
      setPinMsg({ text: '4-digit Supervisor approval PIN updated successfully.' });
      setPin('');
      setConfirmPin('');
    } catch (err: any) {
      setPinMsg({ text: err?.data?.message || 'Failed to set PIN.', isError: true });
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Security</h1>
            <p className="text-sm text-slate-600">
              Manage personal details, store role permissions, and counter approval PIN.
            </p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading profile...</div>
          ) : (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{profile?.name}</h2>
                    <p className="text-xs text-slate-500">
                      Mobile: {profile?.phone} &bull; Store: {profile?.tenant?.name}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Interface Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                      >
                        <option value="en">English (Default)</option>
                        <option value="bn">বাংলা (Bengali)</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={showBanglaDigits}
                          onChange={(e) => setShowBanglaDigits(e.target.checked)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span>Display Bangla Numerals (১২৩৪৫৬৭৮৯০)</span>
                      </label>
                    </div>
                  </div>

                  {profileMsg && (
                    <div
                      className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                        profileMsg.isError
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {profileMsg.isError ? (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      )}
                      <span>{profileMsg.text}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 4-Digit Approval PIN Setup */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    POS Counter Approval PIN (4-Digits)
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  This 4-digit PIN is entered at checkout terminals to authorize cashier discounts exceeding limits, voided receipts, and high-value customer returns.
                </p>

                <form onSubmit={handlePinSubmit} className="space-y-4 max-w-md">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        New 4-Digit PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-center text-sm font-mono tracking-widest"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-center text-sm font-mono tracking-widest"
                      />
                    </div>
                  </div>

                  {pinMsg && (
                    <div
                      className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                        pinMsg.isError
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {pinMsg.isError ? (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      )}
                      <span>{pinMsg.text}</span>
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={isSettingPin}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {isSettingPin ? 'Saving PIN...' : 'Set Approval PIN'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    </AuthGuard>
  );
}
