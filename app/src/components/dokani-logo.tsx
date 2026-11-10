'use client';

import { useState, useEffect, useId } from 'react';

interface DokaniLogoProps {
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
}

export function DokaniLogo({
  size = 36,
  showWordmark = false,
  subtitle = 'Retail OS',
  className = '',
}: DokaniLogoProps) {
  const gradId = useId();

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill={`url(#${gradId})`} />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 11H24.5C32.232 11 38 16.768 38 24C38 31.232 32.232 37 24.5 37H12V11ZM16.5 15.5V32.5H24.5C29.7467 32.5 33.5 28.7467 33.5 24C33.5 19.2533 29.7467 15.5 24.5 15.5H16.5Z"
          fill="#FFFFFF"
        />
        <rect x="19.5" y="23.5" width="2.5" height="6.5" rx="1.25" fill="#FFFFFF" fillOpacity="0.85" />
        <rect x="23.5" y="20" width="2.5" height="10" rx="1.25" fill="#FFFFFF" fillOpacity="0.95" />
        <rect x="27.5" y="17.5" width="2.5" height="12.5" rx="1.25" fill="#6EE7B7" />
      </svg>

      {showWordmark && (
        <span className="flex flex-col text-left">
          <span className="text-lg font-black tracking-tight leading-none text-slate-900">
            Dokani
          </span>
          {subtitle && (
            <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-widest mt-0.5">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

interface ShopLogoProps {
  name: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'lg' | 'full';
  className?: string;
}

export function ShopLogo({
  name,
  logoUrl,
  size = 'md',
  rounded = 'lg',
  className = '',
}: ShopLogoProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }[size];

  const radiusClass = rounded === 'full' ? 'rounded-full' : 'rounded-lg';
  const resolvedSrc = logoUrl && !hasError ? logoUrl : '/logos/default-shop.svg';

  return (
    <img
      src={resolvedSrc}
      alt={`${name} logo`}
      onError={() => {
        if (resolvedSrc !== '/logos/default-shop.svg') {
          setHasError(true);
        }
      }}
      className={`${sizeClasses} ${radiusClass} object-cover border border-slate-200 bg-white shrink-0 ${className}`}
    />
  );
}

