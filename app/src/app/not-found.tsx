import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 mb-4">
        <HelpCircle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">
        Page Not Found
      </h2>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        The requested page does not exist or has been moved.
      </p>
      <Link
        href="/pos"
        className="inline-flex items-center gap-2 rounded bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Go to POS</span>
      </Link>
    </div>
  );
}
