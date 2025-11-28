'use client';

// Estrategia: representar el logo/nombre configurado por cada club y reutilizarlo en headers y paneles.
import { useMemo } from 'react';

import { useBranding } from '@/context/branding-context';

type BrandingMarkProps = {
  direction?: 'row' | 'column';
  subtitle?: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const AVATAR_SIZES: Record<NonNullable<BrandingMarkProps['size']>, string> = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-base',
  lg: 'h-16 w-16 text-lg',
};

export function BrandingMark({
  direction = 'row',
  subtitle,
  showName = true,
  size = 'md',
}: BrandingMarkProps): JSX.Element {
  const { branding } = useBranding();
  const initials = useMemo(() => branding.appName.slice(0, 2).toUpperCase(), [branding.appName]);

  const Wrapper = direction === 'column' ? 'div' : 'div';

  return (
    <Wrapper
      className={`flex items-center gap-3 ${direction === 'column' ? 'flex-col text-center' : 'flex-row'}`}
    >
      {branding.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={branding.appName}
          className={`rounded-2xl object-cover ${AVATAR_SIZES[size]} bg-[var(--brand-primary-soft)]`}
          src={branding.logoUrl}
        />
      ) : (
        <div
          className={`flex items-center justify-center rounded-2xl bg-[var(--brand-primary-soft)] font-semibold text-[var(--brand-background)] ${AVATAR_SIZES[size]}`}
        >
          {initials}
        </div>
      )}
      {showName ? (
        <div className="space-y-0.5">
          <p className="text-base font-semibold text-[var(--brand-text)]">{branding.appName}</p>
          {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
        </div>
      ) : null}
    </Wrapper>
  );
}


