# Gestión de Clubes — Monorepo (NestJS + Prisma + Next.js)

Plataforma SaaS multi-club que centraliza la administración de sedes, actividades, planes, clases, reservas, pagos y reportes. El repositorio usa Turborepo para orquestar la API NestJS/Prisma y el frontend Next.js, con autenticación integrada mediante Supabase Auth.

**Estado actual**: Backend completo con validación de tokens Supabase, soft delete implementado, flujo de invitación de usuarios, panel de SUPER_ADMIN operativo, y frontend con login funcional y gestión completa de clubes y usuarios.

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
  - `auth`: `GET /auth/me` protegido con `AuthGuard`, valida tokens de Supabase y retorna usuario de Prisma. Servicio `SupabaseAdminService` para operaciones administrativas (invitación y eliminación de usuarios).
  - `users`:
    - Gestión completa de usuarios: `POST /users/admin`, `POST /users/students`, `POST /users/teachers`
    - Listados: `GET /users/admins`, `GET /users/students`, `GET /users/teachers`, `GET /users/me`
    - Invitación: `POST /users/invite` (solo SUPER_ADMIN) - Envía email de invitación con magic link
    - Eliminación: `DELETE /users/admins/:id`, `DELETE /users/:id` (solo SUPER_ADMIN) - Eliminación real en Supabase + soft delete en Prisma
  - `clubs`:
    - CRUD completo para SUPER_ADMIN: `GET /clubs`, `POST /clubs`, `GET /clubs/:id`, `DELETE /clubs/:id`
    - Endpoints multi-rol: `GET /clubs/my`, `PATCH /clubs/my` (para ADMIN)
    - Soft delete implementado (`isActive`, `deletedAt`)
  - `branches`, `activities`, `plans`: CRUD multi-tenant para ADMIN con baja lógica (`isActive`)
  - `classes`: UC-07 completo (clases únicas o recurrentes, generación de `ClassOccurrence`, listados, edición, desactivación)
  - Stubs listos para UC futuros (`reservations`, `attendance`, `payments`, `cashbox`, `reports`, `notifications`)
- **Prisma**: `apps/api/prisma/schema.prisma` modela Club, User (roles), Branch, Activity, Plan, StudentPlan, Class, ClassOccurrence, Reservation, Attendance, Payment, CashboxEntry + enums. Soft delete implementado en `Club` (`isActive`, `deletedAt`) y `User` (`active`, `deletedAt`, `supabaseUserId`).
- **Autenticación**: El backend valida tokens JWT de Supabase usando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. No genera tokens propios, solo valida los que Supabase emite. Operaciones administrativas (invitación y eliminación) se realizan con `SUPABASE_SERVICE_ROLE_KEY` mediante `SupabaseAdminService`.

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
   FRONTEND_URL="http://localhost:3000"
   ```
   > **Nunca** publiques credenciales (Supabase/API keys) en el repo o en canales abiertos.
   >
   > **Nota**: `FRONTEND_URL` se usa para construir las URLs de redirección en las invitaciones de usuarios.

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
  - `/login`: Formulario funcional de login con Supabase Auth. Redirige según rol (ADMIN/SUPER_ADMIN → `/admin` o `/superadmin`, TEACHER → `/teacher`, STUDENT → `/cliente`).
  - `/admin`: Panel de administración completo para ADMIN y SUPER_ADMIN, con verificación de autenticación y protección de rutas.
  - `/superadmin`: Panel completo de SUPER_ADMIN con:
    - Listado de clubes con opción de crear nuevos
    - Listado de administradores por club
    - Creación de nuevos administradores
    - Eliminación de clubes (soft delete) con confirmación
    - Eliminación de administradores (real delete en Supabase + soft delete en Prisma) con confirmación
  - `/superadmin/users`: Formulario de invitación de usuarios (solo SUPER_ADMIN)
    - Campos: email, role, firstName, lastName, phone, clubId (opcional)
    - Envía email de invitación con magic link a `/auth/set-password`
  - `/auth/set-password`: Página para establecer contraseña después de recibir invitación
    - Lee `access_token` y `refresh_token` de la URL (query params o hash)
    - Establece sesión con `supabase.auth.setSession()`
    - Permite al usuario definir su contraseña con `supabase.auth.updateUser()`
    - Redirige a `/login` después de establecer contraseña
  - `/auth/update-password`: Página para actualizar contraseña (usuarios autenticados)
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
- ✅ Panel de SUPER_ADMIN (`/superadmin`) completo con gestión de clubes y usuarios.
- ✅ Flujo completo de invitación de usuarios:
  - Endpoint `POST /users/invite` (solo SUPER_ADMIN)
  - Formulario en `/superadmin/users`
  - Email de invitación con magic link
  - Página `/auth/set-password` para establecer contraseña
  - Integración con Supabase Auth Admin API
- ✅ Eliminación de usuarios y clubes:
  - Soft delete en Prisma (`isActive`/`active`, `deletedAt`)
  - Eliminación real en Supabase Auth para usuarios
  - Endpoints protegidos: `DELETE /users/:id`, `DELETE /users/admins/:id`, `DELETE /clubs/:id`
  - Confirmaciones en frontend antes de eliminar
- ✅ Endpoints de usuarios (`/users/admin`, `/users/students`, `/users/teachers`, `/users/invite`, `/users/admins`, etc.).
- ✅ CRUD completo de clubes, sedes, actividades, planes y clases.
- ✅ Soft delete implementado en modelos `Club` y `User` (campos `isActive`/`active` y `deletedAt`).
- ✅ Configuración de CORS para desarrollo local.
- ✅ Documentación completa:
  - Módulo de autenticación (`apps/api/AUTH_MODULE_DOCUMENTATION.md`)
  - Integración con Supabase Auth (`apps/web/SUPABASE_AUTH_INTEGRATION.md`)
  - Configuración de invitación de usuarios (`docs/USER_INVITATION_SETUP.md`)

### 📋 Próximos pasos V1

- Flujos completos de creación de ADMIN/TEACHER/STUDENT (UC-01, UC-04, UC-05) y asignación de planes.
- UC-08..UC-14 (reservas, cancelaciones, asistencia, pagos, cashbox, reportes, notificaciones).
- Regenerar occurrences futuras al editar clases recurrentes.
- Estrategia incremental para recurrencias sin `endDate` (jobs o scheduler).
- Tests unitarios/integración para módulos críticos (auth, planes, clases, etc.).
- Paneles para PROFESOR y ALUMNO.
- Endpoint opcional `POST /api/users/activate-self` para activar usuario en Prisma después de establecer contraseña.

## Documentación adicional

- **Documentación funcional/técnica**: Carpeta `docs/` con reglas de negocio, casos de uso y estructura técnica:
  - `docs/NEGOCIO_V1.md` - Reglas de negocio y alcance V1
  - `docs/USE_CASES.md` - Casos de uso del sistema
  - `docs/MODULES_STRUCTURE.md` - Estructura de módulos backend
  - `docs/TECH_RULES.md` - Reglas técnicas y stack
  - `docs/USER_INVITATION_SETUP.md` - Configuración del flujo de invitación de usuarios
- **Diagramas**: `docs/diagrama-arquitectura.jpg` y `docs/DIAGRAMA ERD.jpg`.
- **Autenticación**:
  - Backend: `apps/api/AUTH_MODULE_DOCUMENTATION.md` - Documentación completa del módulo de autenticación.
  - Frontend: `apps/web/SUPABASE_AUTH_INTEGRATION.md` - Flujo completo de integración con Supabase Auth.
- **Reglas para IA/colaboradores**: `.cursorrules`.

## Flujos principales

### Flujo de autenticación (login)

1. **Usuario hace login** en `/login` con email y password.
2. **Frontend** autentica con Supabase Auth (`supabase.auth.signInWithPassword`).
3. **Supabase** retorna un `access_token` JWT.
4. **Frontend** guarda la sesión en localStorage (manejado por Supabase).
5. **Frontend** llama a `GET /auth/me` con header `Authorization: Bearer <token>`.
6. **Backend** valida el token con Supabase (`supabase.auth.getUser(token)`).
7. **Backend** busca el usuario en Prisma y retorna `CurrentUser` con rol y `clubId`.
8. **Frontend** redirige según el rol del usuario.

### Flujo de invitación de usuarios

1. **SUPER_ADMIN** accede a `/superadmin/users` y completa el formulario de invitación.
2. **Frontend** llama a `POST /users/invite` con datos del usuario (email, role, firstName, etc.).
3. **Backend** valida permisos (solo SUPER_ADMIN) y datos.
4. **Backend** llama a `supabaseAdmin.auth.admin.inviteUserByEmail()` con:
   - Email del usuario
   - `redirectTo`: `{FRONTEND_URL}/auth/set-password`
   - Metadata: `role`, `clubId`, `firstName`, `lastName`
5. **Supabase** envía email automáticamente con magic link que contiene `access_token` y `refresh_token`.
6. **Usuario invitado** hace clic en el link del email.
7. **Frontend** (`/auth/set-password`) lee los tokens de la URL y establece sesión con `supabase.auth.setSession()`.
8. **Usuario** establece su contraseña con `supabase.auth.updateUser({ password })`.
9. **Frontend** redirige a `/login` para que el usuario pueda hacer login normalmente.

### Flujo de eliminación (soft delete)

1. **SUPER_ADMIN** accede a `/superadmin` y selecciona eliminar un club o usuario.
2. **Frontend** muestra modal de confirmación.
3. **Frontend** llama a `DELETE /clubs/:id` o `DELETE /users/:id`.
4. **Backend** valida permisos (solo SUPER_ADMIN).
5. **Para usuarios**: Backend elimina el usuario en Supabase Auth (`supabaseAdmin.auth.admin.deleteUser()`).
6. **Backend** realiza soft delete en Prisma:
   - `Club`: `isActive = false`, `deletedAt = new Date()`
   - `User`: `active = false`, `deletedAt = new Date()`
7. **Backend** retorna éxito.
8. **Frontend** actualiza la UI removiendo el elemento de la lista.

> Este README resume el estado actual del monorepo. Cualquier feature nuevo debe alinearse con los documentos oficiales antes de codificar.
