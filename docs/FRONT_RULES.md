# FRONT_RULES.md

## Reglas de Frontend – Proyecto "Admin" (White-Label Multi-Club)

Este documento define TODAS las reglas del FRONT.  
Cursor **debe respetar siempre** estas reglas al generar código.

El objetivo del front es:

- Ser **white-label**, con branding configurable por cada administrador.
- Tener **diseño profesional**, iconografía grande y UI clara.
- Ser **Next.js + TypeScript + TailwindCSS** con App Router.
- Crear un flujo simple de navegación entre Landing → Login → Panel Cliente/Admin.

---

# 1. Stack Técnico

- **Next.js (App Router)** → obligatorio.
- **TypeScript estricto** (`strict: true`).
- **TailwindCSS** con configuración custom si hace falta.
- **Componentización**: todo lo repetible debe ser componente.
- **Iconos grandes**: usar lucide-react o similar (mínimo 32–48px en dashboards).
- **Responsivo**: Desktop primero, pero Mobile 100% usable.
- **No usar any.**

---

# 2. Branding White-Label

Cada administrador debe poder personalizar:

- `appName` (string)
- `logoUrl` (string opcional)
- `paletteId` (una de las 4 paletas)

## 2.1. Archivo: `config/branding.ts`

Debe existir y exportar:

```ts
export type ColorPaletteId = 'orange' | 'blue' | 'violet' | 'green';

export type BrandingConfig = {
  appName: string;
  logoUrl?: string;
  paletteId: ColorPaletteId;
};
2.2. Paletas predefinidas
Debe existir:

ts
Copiar código
export const COLOR_PALETTES = {
  orange: {
    primary: '#f97316',
    primarySoft: '#fb923c',
    accent: '#fef3c7',
    background: '#0f0f0f',
    surface: '#1a1a1a',
    text: '#ffffff',
  },
  blue: {
    primary: '#2563eb',
    primarySoft: '#3b82f6',
    accent: '#dbeafe',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#ffffff',
  },
  violet: {
    primary: '#8b5cf6',
    primarySoft: '#a78bfa',
    accent: '#f5f3ff',
    background: '#1a1125',
    surface: '#2a1a3a',
    text: '#ffffff',
  },
  green: {
    primary: '#10b981',
    primarySoft: '#34d399',
    accent: '#d1fae5',
    background: '#0d1f19',
    surface: '#123228',
    text: '#ffffff',
  },
};
2.3. Branding por defecto
ts
Copiar código
export const DEFAULT_BRANDING: BrandingConfig = {
  appName: "Admin",
  logoUrl: "",
  paletteId: "orange",
};
2.4. Hook: useBranding()
Debe resolver:

branding actual

paleta actual

funciones para actualizar estos valores (state global o context)

3. Rutas Obligatorias
El proyecto SIEMPRE debe incluir:

Ruta	Descripción
/	Landing principal (marketing)
/login-cliente	Login alumno/cliente
/login-admin	Login administrador
/cliente	Panel del cliente
/admin	Panel del administrador

Ninguna de estas páginas debe eliminarse.
Se pueden agregar subrutas, pero estas forman el esqueleto oficial.

4. Lineamientos de Diseño
4.1. Estilo general
Moderno, limpio, profesional.

Paleta derivada SIEMPRE del branding.

Fondos oscuros suaves (background, surface).

Botones con color primary.

Bordes redondeados (rounded-xl o rounded-2xl).

Sombra sutil (shadow-md, shadow-lg).

Espaciado generoso.

Tipografía sans-serif (Inter recomendada).

4.2. Iconos
Iconos grandes (mínimo 32px en paneles; 48px recomendado para cards de acción).

Iconos alineados a izquierda, texto a derecha.

Tono del icono = primarySoft o text.

4.3. Cards de acción
Deben existir como componente reutilizable.

Contener:

Icono grande.

Título claro.

Subtexto corto.

Cuando el usuario pasa el cursor → leve escala + shadow.

Usos:

Crear Cliente

Registrar Pago

Agenda Diaria

Ir a Sede

Ver Listado

etc.

5. Estructura de Layouts
5.1. Layout global
Header fija arriba.

Logo + appName a la izquierda.

Links o avatar a la derecha.

5.2. Panel Cliente
Sidebar lateral (desktop)
Avatar o logo arriba.

Nombre + email.

Lista de opciones con icono grande:

Turnos

Horarios

Últimos pagos

Historial de turnos

Noticias

Contacto

Cambiar de sede

Cerrar sesión

Mobile
Sidebar tipo drawer.

5.3. Panel Admin
Debe incluir:

Nav superior
Logo + nombre del sistema.

Botón “Salir” a la derecha.

Barra de secciones
Panel de inicio

Clientes

Turnos

Sedes

Finanzas

Configuración

Panel de inicio (home)
Grid de cards de acción grandes:

Crear Cliente

Listado Clientes

Registrar Pago

Agenda Diaria

Sede Caballito

Sede Núñez

Además:

Sección lateral de “Notas rápidas”.

Módulo “Cumpleaños del día”.

6. Landing Página /
Debe incluir:

Header con:

Logo

appName

Botones “Soy cliente” y “Soy admin”

Hero grande:

Título fuerte del producto

Subtítulo explicando que es multi-negocio, multi-sede y white-label

CTAs → /login-admin y /login-cliente

Mockup simple del panel admin y del panel cliente

Sección “Características”

Sección “Para Administradores”

Sección “Para Clientes”

Sección “Beneficios”

Footer con contacto básico

7. Componentes Reutilizables
Cursor debe crear y usar componentes como:

<Header />

<SidebarCliente />

<AdminHeader />

<AdminNav />

<ActionCard />

<BrandingProvider />

<PaletteSelector /> (para /admin/configuracion)

8. Página /admin/configuracion
Debe permitir:

Cambiar appName

Cambiar logoUrl

Cambiar paletteId

Ver previsualización de la paleta

Todo esto es local (state/context) por ahora.
Más adelante se conecta al backend.

9. No se debe hacer
No usar any.

No inventar lógica de backend.

No borrar rutas obligatorias.

No aplicar estilos sin usar el branding.

No usar componentes sin tipado.

No mezclar colores arbitrarios: usar SIEMPRE COLOR_PALETTES.

10. Objetivos del Front V1
Navegación completa funcionando.

Paneles Admin y Cliente estilizados.

Branding funcionando en Header + Botones + Cards.

4 paletas disponibles.

Sección de configuración de marca operativa.
```
