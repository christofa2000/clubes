'use client';

// Estrategia: header fijo reutilizable en la landing, muestra logo, navegación y CTAs de login.
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

import { BrandingMark } from '@/components/branding/branding-mark';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '#caracteristicas', label: 'Características' },
  { href: '#para-admins', label: 'Para Admins' },
  { href: '#para-clientes', label: 'Para Clientes' },
  { href: '#beneficios', label: 'Beneficios' },
  { href: '#contacto', label: 'Contacto' },
];

export function Header(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--brand-border)] bg-[var(--brand-background)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <BrandingMark subtitle="Plataforma para clubes" />
        <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--brand-accent)] md:flex">
          {NAV_ITEMS.map((item) => (
            <Link className="transition hover:text-[var(--brand-primary)]" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost">
            <Link href="/login-cliente">Soy cliente</Link>
          </Button>
          <Button asChild>
            <Link href="/login-admin">Soy admin</Link>
          </Button>
        </div>
        <button
          aria-label="Abrir menú principal"
          className="rounded-2xl border border-[var(--brand-border)] p-2 text-[var(--brand-text)] md:hidden"
          onClick={() => {
            setOpen((prev) => !prev);
          }}
          type="button"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-[var(--brand-border)] bg-[var(--brand-background)] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-[var(--brand-accent)]">
            {NAV_ITEMS.map((item) => (
              <Link
                className="rounded-2xl px-3 py-2 hover:bg-[var(--brand-primary-soft)]/20"
                href={item.href}
                key={item.href}
                onClick={() => {
                  setOpen(false);
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid gap-2">
            <Button asChild variant="ghost">
              <Link href="/login-cliente">Soy cliente</Link>
            </Button>
            <Button asChild>
              <Link href="/login-admin">Soy admin</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

