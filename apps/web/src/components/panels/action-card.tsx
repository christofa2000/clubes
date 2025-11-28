'use client';

// Estrategia: cards de acción con icono grande, hover animado, reutilizables en la landing y paneles.
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ActionCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  emphasis?: 'default' | 'primary';
};

export function ActionCard({ icon, title, description, emphasis = 'default' }: ActionCardProps) {
  return (
    <div
      className={cn(
        'group flex h-full flex-col gap-4 rounded-3xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl',
        emphasis === 'primary'
          ? 'border-transparent bg-[var(--brand-primary)] text-[var(--brand-background)]'
          : 'border-[var(--brand-border)] bg-[var(--brand-surface)] text-[var(--brand-text)]'
      )}
    >
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-2xl text-4xl',
          emphasis === 'primary'
            ? 'bg-white/20 text-white'
            : 'bg-[var(--brand-primary-soft)]/30 text-[var(--brand-primary)]'
        )}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-[var(--brand-muted-text)]">{description}</p>
      </div>
    </div>
  );
}


