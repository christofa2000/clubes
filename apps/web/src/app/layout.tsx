// Estrategia: cargar fuentes globales y envolver la aplicación con el BrandingProvider para compartir colores en todas las rutas.
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';

import { BrandingProvider } from '@/context/branding-context';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Gestión de Clubes',
  description: 'Portal SaaS multi-club para admins, profesores y alumnos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <BrandingProvider>{children}</BrandingProvider>
      </body>
    </html>
  );
}
