# Gestión de Clubes — Monorepo (NestJS + Prisma + Next.js)

Plataforma SaaS multi-club que centraliza la administración de sedes, actividades, planes, clases, reservas, pagos y reportes. El repositorio usa Turborepo para orquestar la API NestJS/Prisma y el frontend Next.js, alineado con los documentos funcionales y técnicos en `docs/`.

## Estructura general

```
.
├── apps
│   ├── api        # Backend NestJS + Prisma + JWT
│   └── web        # Frontend Next.js + Tailwind + shadcn/ui
├── packages
│   ├── eslint-config
│   └── tsconfig
├── docs           # NEGOCIO_V1, USE_CASES, MODULES_STRUCTURE, TECH_RULES, diagramas
└── turbo.json     # Pipelines Turborepo (build, dev, lint, test)
```

## Backend (`apps/api`)

- **Stack**: NestJS 11, Prisma 5, PostgreSQL/Supabase, JWT, Passport.
- **Módulos implementados**:
  - `auth`: `POST /auth/login`, estrategia JWT personalizada y guards (`JwtAuthGuard`, `RolesGuard`, `@CurrentUser`).
  - `users`: `GET /users/me` para leer el perfil autenticado.
  - `clubs`: CRUD para SUPER_ADMIN.
  - `branches`, `activities`, `plans`: CRUD multi-tenant para ADMIN con baja lógica (`isActive`).
  - `classes`: UC-07 completo (clases únicas o recurrentes, generación de `ClassOccurrence`, listados, edición, desactivación).
  - Stubs listos para UC futuros (`reservations`, `attendance`, `payments`, `cashbox`, `reports`, `notifications`).
- **Prisma**: `apps/api/prisma/schema.prisma` modela Club, User (roles), Branch, Activity, Plan, StudentPlan, Class, ClassOccurrence, Reservation, Attendance, Payment, CashboxEntry + enums.

### Variables de entorno

1. Copiar el ejemplo:
   ```bash
   cp apps/api/env.example apps/api/.env
   ```
2. Completar con datos reales:
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
   JWT_SECRET="cambia-esto"
   JWT_EXPIRES_IN="1d"    # compatible con jsonwebtoken (1d, 12h, 3600, etc.)
   PORT=3000
   ```
   > **Nunca** publiques credenciales (Supabase/API keys) en el repo o en canales abiertos.

### Scripts backend

| Comando                                        | Descripción                                        |
| ---------------------------------------------- | -------------------------------------------------- |
| `npm run dev` (raíz)                           | Levanta API y Web en paralelo vía Turborepo        |
| `npm run dev --workspace apps/api`             | Solo backend (`nest start --watch`)                |
| `npm run prisma:generate --workspace apps/api` | Regenera el cliente Prisma tras editar el schema   |
| `npm run prisma:migrate --workspace apps/api`  | Ejecuta migraciones (requiere `DATABASE_URL` real) |
| `npm run lint`                                 | Lint compartido (API + Web)                        |

## Frontend (`apps/web`)

- **Stack**: Next.js 15 (App Router), TypeScript estricto, Tailwind, shadcn/ui (estilo “New York”), utilidades `cn` y componentes base (`Button`).
- **Páginas iniciales**:
  - `/`: Landing “Gestión de Clubes - Plataforma SaaS” con CTA “Ingresar”.
  - `/login`: formulario simple de login (sin lógica todavía) para todos los roles.
- **Scripts web**:

| Comando         | Descripción            |
| --------------- | ---------------------- |
| `npm run dev`   | `next dev --turbopack` |
| `npm run lint`  | `next lint`            |
| `npm run build` | `next build`           |
| `npm run start` | `next start`           |

## Flujo recomendado

1. **Leer los documentos**: `docs/NEGOCIO_V1.md`, `docs/USE_CASES.md`, `docs/MODULES_STRUCTURE.md`, `docs/TECH_RULES.md`.
2. **Configurar entorno**:
   - Crear `.env` en `apps/api` (ver arriba) con un `DATABASE_URL` válido.
   - `npm install` en la raíz.
   - `npm run prisma:generate --workspace apps/api`.
3. **Desarrollar**:
   - `npm run dev` para levantar ambas apps en watch mode.
   - Luego de editar `schema.prisma`, correr `npm run prisma:migrate --workspace apps/api`.
   - Mantener la lógica en servicios Nest y filtrar siempre por `clubId`.
4. **Estilo / reglas**:
   - TypeScript estricto, sin `any`.
   - Controllers delgados; servicios contienen reglas de negocio.
   - Guards + decorators (`@Roles`, `@CurrentUser`) en todos los endpoints protegidos.

## TODO / Próximos pasos V1

- Flujos de creación de ADMIN/TEACHER/STUDENT (UC-01, UC-04, UC-05) y asignación de planes.
- UC-08..UC-14 (reservas, cancelaciones, asistencia, pagos, cashbox, reportes, notificaciones).
- Regenerar occurrences futuras al editar clases recurrentes.
- Estrategia incremental para recurrencias sin `endDate` (jobs o scheduler).
- Tests unitarios/integración para módulos críticos (auth, planes, clases, etc.).

## Recursos

- Documentación funcional/técnica: carpeta `docs/`.
- Diagramas: `docs/diagrama-arquitectura.jpg` y `docs/DIAGRAMA ERD.jpg`.
- Reglas para IA/colaboradores: `.cursorrules`.

> Este README resume el estado actual del monorepo. Cualquier feature nuevo debe alinearse con los documentos oficiales antes de codificar.
