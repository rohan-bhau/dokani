'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  Menu,
  X,
  Store,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { RootState, AppDispatch } from '@/store';
import { logout as logoutAction } from '@/store/authSlice';
import { useLogoutMutation } from '@/store/authApi';

const NAV_ITEMS = [
  { href: '/products', label: 'Products', icon: Boxes },
  { href: '/pos', label: 'POS Billing', icon: ShoppingCart },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/features', label: 'Features', icon: ClipboardList },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user: currentUser, isInitialized } = useSelector((state: RootState) => state.auth);
  const [logoutMutation] = useLogoutMutation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const refreshToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('dokani_refresh_token') || undefined
        : undefined;
    try {
      await logoutMutation({ refreshToken }).unwrap();
    } catch {
      // Proceed with local logout regardless of network response
    }
    dispatch(logoutAction());
    setMobileMenuOpen(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8">
        {/* Brand Logo & Desktop Nav */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-xs">
              DP
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight leading-tight">Dokani</span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest hidden sm:block">
                Retail OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`rounded-md px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                pathname === '/'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Home
            </Link>

            <Link
              href="/features"
              className={`rounded-md px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                pathname === '/features'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Features
            </Link>

            {currentUser && (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                    pathname === '/dashboard'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/products"
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                    pathname.startsWith('/products')
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Boxes className="h-3.5 w-3.5" />
                  <span>Products</span>
                </Link>

                <Link
                  href="/customers"
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                    pathname.startsWith('/customers')
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Customers</span>
                </Link>

                <Link
                  href="/pos"
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                    pathname.startsWith('/pos')
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>POS Terminal</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {isInitialized && currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="font-semibold text-slate-900 leading-tight">
                  {currentUser.tenant?.name || currentUser.name}
                </span>
                <span className="text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  {currentUser.roles?.[0] || 'Merchant'}
                </span>
              </div>

              <Link
                href="/pos"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Open POS</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="hidden sm:inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md border border-slate-300 px-3.5 py-2 font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand px-3.5 py-2 font-semibold text-white transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 shadow-xs"
              >
                Register Store
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex md:hidden items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 pt-3 pb-6 shadow-md space-y-4">
          {currentUser && (
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-xs">
                  {currentUser.tenant?.name || currentUser.name}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                  {currentUser.roles?.[0] || 'Merchant'} • {currentUser.phone}
                </p>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          )}

          <nav className="flex flex-col space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between rounded-md px-3 py-2.5 text-xs font-medium ${
                pathname === '/'
                  ? 'bg-emerald-50 text-brand font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Home & Overview</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>

            <Link
              href="/features"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between rounded-md px-3 py-2.5 text-xs font-medium ${
                pathname === '/features'
                  ? 'bg-emerald-50 text-brand font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>All Platform Features</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>

            {currentUser ? (
              <>
                <div className="pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Store Management
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-md px-3 py-2.5 text-xs font-medium ${
                    pathname === '/dashboard'
                      ? 'bg-emerald-50 text-brand font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                    <span>Dashboard & Analytics</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/pos"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-md px-3 py-2.5 text-xs font-medium ${
                    pathname.startsWith('/pos')
                      ? 'bg-emerald-50 text-brand font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-brand" />
                    <span>POS Counter Terminal</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-md px-3 py-2.5 text-xs font-medium ${
                    pathname.startsWith('/products')
                      ? 'bg-emerald-50 text-brand font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-blue-600" />
                    <span>Product Catalog & Stock</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/customers"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-md px-3 py-2.5 text-xs font-medium ${
                    pathname.startsWith('/customers')
                      ? 'bg-emerald-50 text-brand font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span>Customer Due (Baki Khata)</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white py-2.5 text-xs font-semibold text-rose-600 shadow-2xs hover:bg-slate-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out of Dokani</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-4 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-md border border-slate-300 py-2.5 text-xs font-medium text-slate-800"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-md bg-brand py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-brand-hover"
                >
                  Register New Store
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
