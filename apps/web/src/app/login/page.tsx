import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function LoginPage(): JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-primary">Portal de acceso</p>
          <h1 className="text-2xl font-semibold">Ingresá a tu club</h1>
          <p className="text-sm text-muted-foreground">
            ADMIN, PROFESOR, ALUMNO y SUPER_ADMIN utilizan el mismo login. El backend se encargará de
            redirigir según el rol.
          </p>
        </div>
        <form className="space-y-4">
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="tu.correo@club.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="********"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button className="w-full" type="submit">
            Ingresar
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          ¿Problemas para acceder?{' '}
          <Link className="text-primary underline-offset-4 hover:underline" href="#">
            Contactá al SUPER_ADMIN
          </Link>
        </p>
      </div>
    </main>
  );
}

