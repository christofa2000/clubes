# Integración de Supabase Auth con Backend NestJS

## 📋 Resumen

Este documento describe la integración completa de Supabase Auth en el frontend Next.js con el backend NestJS. La autenticación se maneja completamente desde el frontend usando Supabase, y el backend solo valida los tokens.

---

## 📁 Archivos Modificados y Creados

### Archivos Modificados

1. **`apps/web/src/lib/supabase-client.ts`**
   - Actualizado para usar `persistSession: true` y `autoRefreshToken: true`
   - Ahora persiste la sesión en localStorage

2. **`apps/web/src/app/login/page.tsx`**
   - Convertido a client component
   - Implementado formulario funcional con `loginWithEmailPassword()`
   - Manejo de errores y redirección según rol

3. **`apps/web/src/app/admin/page.tsx`**
   - Actualizado para usar `logout()` de `authApi`
   - Mejorada la verificación de autenticación
   - Redirección automática si no es ADMIN o SUPER_ADMIN

4. **`apps/web/src/hooks/use-current-user.ts`**
   - Refactorizado para usar `getCurrentUserFromBackend()` en lugar de localStorage
   - Ahora usa Supabase Auth para obtener la sesión

### Archivos Creados

1. **`apps/web/src/lib/apiClient.ts`** (NUEVO)
   - Cliente de API con función `fetchWithAuth()` para requests autenticados
   - Maneja tokens Bearer y errores HTTP

2. **`apps/web/src/lib/authApi.ts`** (NUEVO)
   - Módulo principal de autenticación
   - Funciones: `loginWithEmailPassword()`, `getCurrentUserFromBackend()`, `logout()`

---

## 🔐 Flujo Completo de Autenticación

### 1. Login del Usuario

```
┌─────────────┐
│   Usuario   │
│  ingresa    │
│ email/pass  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend: /login                   │
│  - Formulario con email/password    │
│  - Llama a loginWithEmailPassword() │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  authApi.loginWithEmailPassword()   │
│  1. supabase.auth.signInWithPassword│
│  2. Obtiene access_token            │
│  3. Llama a GET /auth/me con token  │
└──────┬──────────────────────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│   Supabase   │  │  Backend NestJS   │
│   Auth API   │  │  GET /auth/me     │
│              │  │  Header:          │
│  Valida      │  │  Authorization:   │
│  credenciales│  │  Bearer <token>   │
└──────┬───────┘  └────────┬─────────┘
       │                   │
       │                   ▼
       │          ┌──────────────────┐
       │          │  AuthGuard       │
       │          │  intercepta      │
       └──────────►  request          │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  AuthService    │
                  │  resolveCurrent │
                  │  User()         │
                  └────────┬────────┘
                           │
                           ├─────────────────┐
                           │                 │
                           ▼                 ▼
                  ┌──────────────┐  ┌──────────────┐
                  │  Supabase    │  │  Prisma      │
                  │  valida      │  │  busca       │
                  │  token       │  │  usuario     │
                  └──────┬───────┘  └──────┬───────┘
                         │                │
                         └────────┬───────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Retorna         │
                         │  CurrentUser     │
                         │  (id, email,     │
                         │   role, clubId)  │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Frontend        │
                         │  recibe usuario   │
                         │  redirige │
                         │  según rol        │
                         └──────────────────┘
```

### 2. Obtención del Usuario Actual

Cuando el usuario ya está autenticado (por ejemplo, al recargar la página):

```
┌─────────────────────┐
│  Frontend           │
│  useCurrentUser()   │
│  hook se ejecuta     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  getCurrentUserFrom │
│  Backend()          │
│  1. supabase.auth   │
│     .getSession()   │
│  2. Obtiene token   │
│  3. GET /auth/me    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Backend            │
│  (mismo flujo que   │
│   en login)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Retorna usuario    │
│  o null si no hay   │
│  sesión válida      │
└─────────────────────┘
```

---

## 🔧 Configuración Requerida

### Variables de Entorno en `.env.local`

```env
# Supabase (Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Variables de Entorno en Backend (`apps/api/.env`)

```env
# Supabase (Backend - para validar tokens)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Base de datos
DATABASE_URL=postgresql://...
```

---

## 📝 Funciones Principales

### `loginWithEmailPassword(email, password)`

**Ubicación:** `apps/web/src/lib/authApi.ts`

**Descripción:** Autentica al usuario con Supabase y obtiene sus datos del backend.

**Parámetros:**
- `email`: string - Email del usuario
- `password`: string - Contraseña del usuario

**Retorna:** `Promise<LoginResult>` con:
- `me`: CurrentUser del backend
- `session`: Session de Supabase
- `user`: User de Supabase

**Ejemplo:**
```typescript
try {
  const { me } = await loginWithEmailPassword('admin@club.com', 'password123');
  console.log('Usuario:', me.email, me.role);
} catch (error) {
  console.error('Error:', error.message);
}
```

---

### `getCurrentUserFromBackend()`

**Ubicación:** `apps/web/src/lib/authApi.ts`

**Descripción:** Obtiene el usuario actual desde el backend usando la sesión activa de Supabase.

**Retorna:** `Promise<CurrentUser>`

**Lanza:** `ApiClientError` si no hay sesión activa o si falla la obtención del usuario.

**Ejemplo:**
```typescript
try {
  const user = await getCurrentUserFromBackend();
  console.log('Usuario actual:', user.email);
} catch (error) {
  if (error.status === 401) {
    // Redirigir a login
  }
}
```

---

### `fetchWithAuth(path, token, init?)`

**Ubicación:** `apps/web/src/lib/apiClient.ts`

**Descripción:** Realiza un fetch autenticado al backend con un token Bearer.

**Parámetros:**
- `path`: string - Ruta del endpoint (ej: '/auth/me')
- `token`: string | null | undefined - Token de acceso de Supabase
- `init`: RequestInit - Opciones adicionales de fetch

**Retorna:** `Promise<TResponse>`

**Ejemplo:**
```typescript
const session = await supabase.auth.getSession();
const user = await fetchWithAuth('/auth/me', session.data.session?.access_token);
```

---

## 🎯 Endpoints del Backend Utilizados

### GET /auth/me

**Descripción:** Obtiene el perfil del usuario autenticado.

**Autenticación:** Requerida (Bearer token)

**Headers:**
```
Authorization: Bearer <access_token_de_supabase>
```

**Respuesta exitosa (200):**
```json
{
  "id": "clx123abc...",
  "email": "admin@club.com",
  "role": "ADMIN",
  "clubId": "clx456def...",
  "branchId": null
}
```

**Errores:**
- `401 AUTH_TOKEN_MISSING`: Falta el header Authorization
- `401 AUTH_INVALID_TOKEN`: Token inválido o expirado
- `401 AUTH_USER_NOT_FOUND`: Usuario no existe en la BD

---

## 🔄 Flujo de Redirección Según Rol

Después del login exitoso, el sistema redirige según el rol del usuario:

- **ADMIN** o **SUPER_ADMIN** → `/admin`
- **TEACHER** → `/teacher` (si existe)
- **STUDENT** → `/cliente`

---

## 🛡️ Protección de Rutas

### Página de Admin (`/admin`)

La página de admin verifica:

1. Que el usuario esté autenticado (hay sesión en Supabase)
2. Que el usuario tenga rol `ADMIN` o `SUPER_ADMIN`
3. Si no cumple alguna condición, redirige a `/login`

**Código relevante:**
```typescript
useEffect(() => {
  if (authLoading) return;
  
  if (!currentUser) {
    router.push('/login');
    return;
  }
  
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
    router.push('/login');
    return;
  }
  
  // Cargar datos...
}, [authLoading, currentUser, router]);
```

---

## 🔍 Validación en el Backend

El backend valida los tokens de Supabase de la siguiente manera:

1. **AuthGuard** intercepta el request
2. Extrae el token del header `Authorization: Bearer <token>`
3. **AuthService.resolveCurrentUser()**:
   - Valida el token con Supabase usando `supabase.auth.getUser(token)`
   - Si es válido, obtiene el email/id del usuario
   - Busca el usuario en Prisma por email o id
   - Retorna el `CurrentUser` con rol y clubId

**Código relevante en backend:**
```typescript
// apps/api/src/auth/auth.service.ts
async resolveCurrentUser(authHeader?: string | string[]): Promise<CurrentUser> {
  const token = this.extractBearerToken(authHeader);
  const identity = await this.resolveTokenViaSupabase(token);
  const prismaUser = await this.findUser(identity);
  return this.mapToCurrentUser(prismaUser);
}
```

---

## ✅ Checklist de Implementación

- [x] Cliente de Supabase configurado con persistencia de sesión
- [x] Cliente de API con `fetchWithAuth()` creado
- [x] Módulo `authApi.ts` con funciones de login y getCurrentUser
- [x] Página de login funcional con formulario
- [x] Página de admin actualizada para usar Supabase Auth
- [x] Hook `useCurrentUser` refactorizado
- [x] Manejo de errores implementado
- [x] Redirección según rol implementada

---

## 🚀 Próximos Pasos (Opcional)

1. **Refresh automático de token**: Ya implementado con `autoRefreshToken: true`
2. **Manejo de expiración de sesión**: Implementar listener de cambios de sesión
3. **Logout desde todas las páginas**: Usar `logout()` de `authApi` consistentemente
4. **Middleware de protección de rutas**: Crear middleware de Next.js para proteger rutas automáticamente

---

## 📚 Referencias

- Documentación de Supabase Auth: https://supabase.com/docs/guides/auth
- Documentación del módulo de autenticación del backend: `apps/api/AUTH_MODULE_DOCUMENTATION.md`
- Documentación del proyecto: `docs/NEGOCIO_V1.md`






