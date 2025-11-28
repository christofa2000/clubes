import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Plataforma SaaS</p>
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
          Gestión de Clubes - Plataforma SaaS
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Administra clubes, sedes, actividades y roles desde un único lugar preparado para
          multi-tenant. Esta es la base del portal web; próximamente conectaremos la autenticación y
          los paneles por rol.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/login">Ingresar</Link>
      </Button>
    </main>
  );
}
