# Gestión de Clubes — Monorepo (NestJS + Prisma + Next.js)

Plataforma SaaS multi-club que centraliza la administración de sedes, actividades, planes, clases, reservas, pagos y reportes. El repositorio usa Turborepo para orquestar la API NestJS/Prisma y el frontend Next.js, con autenticación integrada mediante Supabase Auth.

**Estado actual**: Backend configurado con validación de tokens Supabase, frontend con login funcional y panel de administración operativo.

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

- **Stack**: NestJS 11, Prisma 5, PostgreSQL/Supabase, Supabase Auth (validación de tokens).
- **Puerto**: `4000` (configurable via `PORT` en `.env`).
- **CORS**: Configurado para permitir requests desde `http://localhost:3000` (frontend).
- **Módulos implementados**:
  - `auth`: `GET /auth/me` protegido con `AuthGuard`, valida tokens de Supabase y retorna usuario de Prisma.
  - `users`: Endpoints para gestión de usuarios (`POST /users/admin`, `POST /users/students`, `POST /users/teachers`, `GET /users/me`, etc.).
  - `clubs`: CRUD para SUPER_ADMIN y endpoints multi-rol (`GET /clubs/my` para ADMIN).
  - `branches`, `activities`, `plans`: CRUD multi-tenant para ADMIN con baja lógica (`isActive`).
  - `classes`: UC-07 completo (clases únicas o recurrentes, generación de `ClassOccurrence`, listados, edición, desactivación).
  - Stubs listos para UC futuros (`reservations`, `attendance`, `payments`, `cashbox`, `reports`, `notifications`).
- **Prisma**: `apps/api/prisma/schema.prisma` modela Club, User (roles), Branch, Activity, Plan, StudentPlan, Class, ClassOccurrence, Reservation, Attendance, Payment, CashboxEntry + enums.
- **Autenticación**: El backend valida tokens JWT de Supabase usando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. No genera tokens propios, solo valida los que Supabase emite.

### Variables de entorno

1. Copiar el ejemplo:
   ```bash
   cp apps/api/env.example apps/api/.env
   ```
2. Completar con datos reales:
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
   PORT=4000
   SUPABASE_URL="https://tu-proyecto.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-aqui"
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

- **Stack**: Next.js 15 (App Router), TypeScript estricto, Tailwind, shadcn/ui, Supabase Auth.
- **Puerto**: `3000` (por defecto de Next.js).
- **Autenticación**: Integrada con Supabase Auth. El login se maneja completamente en el frontend, y el backend solo valida tokens.
- **Páginas implementadas**:
  - `/`: Landing "Gestión de Clubes - Plataforma SaaS" con CTA "Ingresar".
  - `/login`: Formulario funcional de login con Supabase Auth. Redirige según rol (ADMIN/SUPER_ADMIN → `/admin`, TEACHER → `/teacher`, STUDENT → `/cliente`).
  - `/admin`: Panel de administración completo para ADMIN y SUPER_ADMIN, con verificación de autenticación y protección de rutas.
- **Módulos de autenticación**:
  - `lib/supabase-client.ts`: Cliente de Supabase configurado con persistencia de sesión.
  - `lib/apiClient.ts`: Cliente API con función `fetchWithAuth()` para requests autenticados.
  - `lib/authApi.ts`: Funciones de login (`loginWithEmailPassword`) y obtención de usuario (`getCurrentUserFromBackend`).
  - `hooks/use-current-user.ts`: Hook React para obtener el usuario actual autenticado.
- **Scripts web**:

| Comando         | Descripción            |
| --------------- | ---------------------- |
| `npm run dev`   | `next dev --turbopack` |
| `npm run lint`  | `next lint`            |
| `npm run build` | `next build`           |
| `npm run start` | `next start`           |

### Variables de entorno frontend

Crear `.env.local` en `apps/web/`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key-aqui"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## Flujo recomendado

1. **Leer los documentos**: `docs/NEGOCIO_V1.md`, `docs/USE_CASES.md`, `docs/MODULES_STRUCTURE.md`, `docs/TECH_RULES.md`.
2. **Configurar entorno**:
   - Crear `.env` en `apps/api` con `DATABASE_URL`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
   - Crear `.env.local` en `apps/web` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_API_URL`.
   - `npm install` en la raíz.
   - `npm run prisma:generate --workspace apps/api`.
3. **Desarrollar**:
   - `npm run dev` para levantar ambas apps en watch mode (backend en puerto 4000, frontend en puerto 3000).
   - Luego de editar `schema.prisma`, correr `npm run prisma:migrate --workspace apps/api`.
   - Mantener la lógica en servicios Nest y filtrar siempre por `clubId`.
4. **Autenticación**:
   - El login se hace desde el frontend con Supabase Auth.
   - El backend valida los tokens de Supabase en cada request protegido.
   - Usar `@UseGuards(JwtAuthGuard, RolesGuard)` y `@Roles()` en endpoints que requieren autenticación.
5. **Estilo / reglas**:
   - TypeScript estricto, sin `any`.
   - Controllers delgados; servicios contienen reglas de negocio.
   - Guards + decorators (`@Roles`, `@CurrentUser`) en todos los endpoints protegidos.

## Estado actual y próximos pasos

### ✅ Implementado

- ✅ Autenticación con Supabase Auth (frontend + validación en backend).
- ✅ Login funcional con redirección según rol.
- ✅ Panel de administración (`/admin`) con protección de rutas.
- ✅ Endpoints de usuarios (`/users/admin`, `/users/students`, `/users/teachers`).
- ✅ CRUD completo de clubes, sedes, actividades, planes y clases.
- ✅ Configuración de CORS para desarrollo local.
- ✅ Documentación del módulo de autenticación y flujo completo.

### 📋 Próximos pasos V1

- Flujos completos de creación de ADMIN/TEACHER/STUDENT (UC-01, UC-04, UC-05) y asignación de planes.
- UC-08..UC-14 (reservas, cancelaciones, asistencia, pagos, cashbox, reportes, notificaciones).
- Regenerar occurrences futuras al editar clases recurrentes.
- Estrategia incremental para recurrencias sin `endDate` (jobs o scheduler).
- Tests unitarios/integración para módulos críticos (auth, planes, clases, etc.).
- Paneles para PROFESOR y ALUMNO.

## Documentación adicional

- **Documentación funcional/técnica**: Carpeta `docs/` con reglas de negocio, casos de uso y estructura técnica.
- **Diagramas**: `docs/diagrama-arquitectura.jpg` y `docs/DIAGRAMA ERD.jpg`.
- **Autenticación**:
  - Backend: `apps/api/AUTH_MODULE_DOCUMENTATION.md` - Documentación completa del módulo de autenticación.
  - Frontend: `apps/web/SUPABASE_AUTH_INTEGRATION.md` - Flujo completo de integración con Supabase Auth.
- **Reglas para IA/colaboradores**: `.cursorrules`.

## Flujo de autenticación

1. **Usuario hace login** en `/login` con email y password.
2. **Frontend** autentica con Supabase Auth (`supabase.auth.signInWithPassword`).
3. **Supabase** retorna un `access_token` JWT.
4. **Frontend** guarda la sesión en localStorage (manejado por Supabase).
5. **Frontend** llama a `GET /auth/me` con header `Authorization: Bearer <token>`.
6. **Backend** valida el token con Supabase (`supabase.auth.getUser(token)`).
7. **Backend** busca el usuario en Prisma y retorna `CurrentUser` con rol y `clubId`.
8. **Frontend** redirige según el rol del usuario.

> Este README resume el estado actual del monorepo. Cualquier feature nuevo debe alinearse con los documentos oficiales antes de codificar.
