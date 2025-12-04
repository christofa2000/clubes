'use client';

// Estrategia: labels coherentes con el branding para mantener formularios consistentes.
import * as React from 'react';

import { cn } from '@/lib/utils';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn('text-sm font-semibold text-[var(--brand-accent)]', className)}
      {...props}
    />
  );
});

Label.displayName = 'Label';

export { Label };











