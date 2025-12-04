# Documentación del Módulo de Autenticación

## 📋 Resumen Ejecutivo

**IMPORTANTE:** Este módulo NO tiene endpoints de login/register. La autenticación se maneja mediante **Supabase Auth** desde el frontend. El backend:

1. **Valida tokens** que Supabase genera (`AuthService` / `AuthGuard`)
2. **Provisiona usuarios** cuando se crean desde negocio (por ahora solo admins) usando el nuevo `SupabaseAdminService`.

### Endpoints Disponibles

Solo existe **1 endpoint** en `/auth`:

- **GET /auth/me** - Obtiene el perfil del usuario autenticado

---

## 📁 Estructura de Archivos

```
apps/api/src/auth/
├── auth.controller.ts          # Controlador con endpoints públicos
├── auth.service.ts             # Servicio de validación de tokens
├── supabase-admin.service.ts   # Servicio admin que crea/invita usuarios en Supabase
├── auth.module.ts              # Módulo NestJS
├── decorators/
│   ├── current-user.decorator.ts  # Decorator para obtener usuario actual
│   └── roles.decorator.ts         # Decorator para definir roles requeridos
├── guards/
│   ├── auth.guard.ts           # Guard que valida tokens
│   └── roles.guard.ts          # Guard que valida roles
├── interfaces/
│   └── authenticated-request.interface.ts  # Tipo de Request extendido
└── types/
    └── current-user.type.ts    # Tipo del usuario actual
```

---

## 🔐 AuthController (`auth.controller.ts`)

```typescript
import { Controller, Get, UnauthorizedException, UseGuards } from '@nestjs/common';

import { CurrentUser } from './decorators/current-user.decorator';
import { AuthGuard } from './guards/auth.guard';
import type { CurrentUser as CurrentUserType } from './types/current-user.type';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /auth/me
   * 
   * Obtiene el perfil del usuario autenticado.
   * 
   * Headers requeridos:
   *   Authorization: Bearer <token>
   * 
   * Payload (body): NINGUNO
   * 
   * Respuesta exitosa (200):
   * {
   *   "id": "clx123...",
   *   "email": "admin@club.com",
   *   "role": "ADMIN",
   *   "clubId": "clx456...",
   *   "branchId": null
   * }
   * 
   * Errores posibles:
   * - 401 AUTH_NO_USER: No hay usuario en el request
   * - 401 AUTH_TOKEN_MISSING: Falta el header Authorization
   * - 401 AUTH_INVALID_TOKEN: Token inválido o expirado
   * - 401 AUTH_USER_NOT_FOUND: Usuario no existe en la BD
   */
  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: CurrentUserType | null): CurrentUserType {
    if (!user) {
      throw new UnauthorizedException('AUTH_NO_USER');
    }
    return this.authService.getProfile(user);
  }
}
```

---

## 🔧 AuthService (`auth.service.ts`)

```typescript
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, User } from '@prisma/client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUser, TokenIdentity } from './types/current-user.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly supabase: SupabaseClient | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Inicializa cliente de Supabase si está configurado
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceRoleKey) {
      this.logger.warn('[AuthService] Supabase no configurado, se usará fallback local limitado.');
      this.supabase = null;
    } else {
      this.supabase = createClient(url, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  /**
   * Resuelve el usuario actual a partir del header Authorization.
   * 
   * Flujo:
   * 1. Extrae el token Bearer del header
   * 2. Valida el token con Supabase (o fallback local)
   * 3. Busca el usuario en Prisma por email o id
   * 4. Retorna el CurrentUser con rol y clubId
   * 
   * @param authHeader - Header Authorization completo (ej: "Bearer eyJ...")
   * @returns CurrentUser con id, email, role, clubId
   * @throws UnauthorizedException si el token es inválido o el usuario no existe
   */
  async resolveCurrentUser(authHeader?: string | string[]): Promise<CurrentUser> {
    const token = this.extractBearerToken(authHeader);

    if (!token) {
      throw new UnauthorizedException('AUTH_TOKEN_MISSING');
    }

    // Valida token con Supabase o fallback local
    const identity = this.supabase
      ? await this.resolveTokenViaSupabase(token)
      : this.resolveTokenIdentityFallback(token);

    // Busca usuario en Prisma
    const prismaUser = await this.findUser(identity);

    if (!prismaUser) {
      throw new UnauthorizedException('AUTH_USER_NOT_FOUND');
    }

    return this.mapToCurrentUser(prismaUser);
  }

  /**
   * Retorna el perfil del usuario (actualmente solo devuelve el mismo objeto).
   * 
   * @param currentUser - Usuario actual autenticado
   * @returns Mismo objeto CurrentUser
   */
  getProfile(currentUser: CurrentUser): CurrentUser {
    return currentUser;
  }

  /**
   * Extrae el token Bearer del header Authorization.
   * 
   * Formato esperado: "Bearer <token>"
   * 
   * @param headerValue - Valor del header Authorization
   * @returns Token sin el prefijo "Bearer " o null si no es válido
   */
  private extractBearerToken(headerValue?: string | string[]): string | null {
    if (Array.isArray(headerValue)) {
      headerValue = headerValue[0];
    }

    if (!headerValue) {
      return null;
    }

    const [type, token] = headerValue.split(' ');

    if (type?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }

  /**
   * Valida el token con Supabase Auth.
   * 
   * @param token - Token JWT de Supabase
   * @returns TokenIdentity con id y email del usuario
   * @throws UnauthorizedException si el token es inválido
   */
  private async resolveTokenViaSupabase(token: string): Promise<TokenIdentity> {
    if (!this.supabase) {
      throw new UnauthorizedException('AUTH_SUPABASE_NOT_CONFIGURED');
    }

    const { data, error } = await this.supabase.auth.getUser(token);

    if (error) {
      this.logger.warn(`Supabase token validation failed: ${error.message}`);
      throw new UnauthorizedException('AUTH_INVALID_TOKEN');
    }

    const user = data.user as typeof data.user | null;

    if (!user) {
      this.logger.warn('Supabase token validation failed: payload missing user');
      throw new UnauthorizedException('AUTH_INVALID_TOKEN');
    }

    return {
      id: user.id,
      email: user.email ?? undefined,
    };
  }

  /**
   * Fallback local para desarrollo cuando Supabase no está configurado.
   * 
   * Intenta decodificar un JWT manualmente, o trata el token como un user ID directo.
   * 
   * @param token - Token a validar
   * @returns TokenIdentity con id (y opcionalmente email)
   */
  private resolveTokenIdentityFallback(token: string): TokenIdentity {
    const decoded = this.decodeJwtToken(token);
    if (decoded) {
      return decoded;
    }

    // Mock/fallback: treat the token as a direct user id (useful for local dev)
    return { id: token };
  }

  /**
   * Decodifica un JWT manualmente (solo para fallback).
   * 
   * Extrae el payload del JWT y retorna id y email si están presentes.
   * 
   * @param token - Token JWT
   * @returns TokenIdentity o null si no es un JWT válido
   */
  private decodeJwtToken(token: string): TokenIdentity | null {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    if (!parts[1]) {
      throw new UnauthorizedException('AUTH_TOKEN_MALFORMED');
    }

    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
        sub?: string;
        email?: string;
        id?: string;
      };

      return {
        id: payload.sub ?? payload.id,
        email: payload.email,
      };
    } catch (error) {
      this.logger.verbose(`JWT decode failed: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Busca un usuario en Prisma por email o id.
   * 
   * @param identity - TokenIdentity con id o email
   * @returns Usuario con id, email, role, clubId o null si no existe
   */
  private async findUser(identity: TokenIdentity): Promise<Pick<User, 'id' | 'email' | 'role' | 'clubId'> | null> {
    if (!identity.email && !identity.id) {
      return null;
    }

    const where: Prisma.UserWhereInput = identity.email
      ? { email: identity.email }
      : { id: identity.id as string };

    return this.prisma.user.findFirst({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        clubId: true,
      },
    });
  }

  /**
   * Mapea un usuario de Prisma a CurrentUser.
   * 
   * @param user - Usuario de Prisma
   * @returns CurrentUser con todos los campos requeridos
   */
  private mapToCurrentUser(user: Pick<User, 'id' | 'email' | 'role' | 'clubId'>): CurrentUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      clubId: user.clubId ?? null,
      branchId: null,
    };
  }
}
```

---

## 🛡️ Guards

### AuthGuard (`guards/auth.guard.ts`)

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { AuthService } from '../auth.service';

/**
 * Guard que valida la autenticación del usuario.
 * 
 * Funcionamiento:
 * 1. Extrae el header Authorization del request
 * 2. Llama a AuthService.resolveCurrentUser() para validar el token
 * 3. Si es válido, agrega el usuario al request como currentUser y user
 * 4. Si no es válido, lanza UnauthorizedException
 * 
 * Se usa con @UseGuards(AuthGuard) en los endpoints que requieren autenticación.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const headers = request.headers as Record<string, string | string[] | undefined>;
    const authorizationHeader = headers.authorization;
    const headerValue = Array.isArray(authorizationHeader)
      ? authorizationHeader[0]
      : authorizationHeader;

    const currentUser = await this.authService.resolveCurrentUser(headerValue).catch((error: unknown) => {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('AUTH_INVALID_TOKEN');
    });

    request.currentUser = currentUser;
    request.user = currentUser;

    return true;
  }
}
```

### RolesGuard (`guards/roles.guard.ts`)

```typescript
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { ROLES_METADATA_KEY } from '../decorators/roles.decorator';

/**
 * Guard que valida que el usuario tenga uno de los roles requeridos.
 * 
 * Funcionamiento:
 * 1. Lee los roles requeridos del decorator @Roles()
 * 2. Verifica que el usuario autenticado tenga uno de esos roles
 * 3. Si no tiene el rol correcto, lanza ForbiddenException (403)
 * 
 * Se usa junto con AuthGuard y el decorator @Roles():
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(UserRole.ADMIN)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const currentUser = request.currentUser ?? request.user;

    if (!currentUser) {
      throw new ForbiddenException('AUTH_ROLE_UNKNOWN');
    }

    if (!requiredRoles.includes(currentUser.role)) {
      throw new ForbiddenException('AUTH_ROLE_FORBIDDEN');
    }

    return true;
  }
}
```

---

## 🎯 Decorators

### CurrentUser (`decorators/current-user.decorator.ts`)

```typescript
import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

import type { CurrentUser as CurrentUserType } from '../types/current-user.type';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

/**
 * Decorator para obtener el usuario actual del request.
 * 
 * Uso:
 * @Get('profile')
 * @UseGuards(AuthGuard)
 * getProfile(@CurrentUser() user: CurrentUserType) {
 *   return user;
 * }
 * 
 * El usuario debe estar autenticado (AuthGuard debe ejecutarse antes).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType | null => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.currentUser ?? request.user;

    if (!user) {
      throw new UnauthorizedException('CURRENT_USER_NOT_AVAILABLE');
    }

    return user;
  },
);
```

### Roles (`decorators/roles.decorator.ts`)

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_METADATA_KEY = 'auth/roles';

/**
 * Decorator para definir qué roles pueden acceder a un endpoint.
 * 
 * Uso:
 * @Get('admin-only')
 * @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 * adminEndpoint() { ... }
 * 
 * Debe usarse junto con RolesGuard:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_METADATA_KEY, roles);
```

---

## 📝 Tipos e Interfaces

### CurrentUser (`types/current-user.type.ts`)

```typescript
import { UserRole } from '@prisma/client';

/**
 * Tipo que representa al usuario autenticado actual.
 * 
 * Campos:
 * - id: ID único del usuario (CUID)
 * - email: Email del usuario
 * - role: Rol del usuario (SUPER_ADMIN, ADMIN, TEACHER, STUDENT)
 * - clubId: ID del club al que pertenece (null para SUPER_ADMIN)
 * - branchId: ID de la sede (opcional, actualmente siempre null)
 */
export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  clubId: string | null;
  branchId?: string | null;
};

/**
 * Tipo que representa la identidad extraída del token.
 * Usado internamente para buscar el usuario en Prisma.
 */
export type TokenIdentity = {
  id?: string;
  email?: string;
};
```

### AuthenticatedRequest (`interfaces/authenticated-request.interface.ts`)

```typescript
import type { Request } from 'express';

import type { CurrentUser } from '../types/current-user.type';

/**
 * Interfaz que extiende Request de Express para incluir el usuario autenticado.
 * 
 * Los guards (AuthGuard) agregan estos campos al request después de validar el token.
 */
export interface AuthenticatedRequest extends Request {
  currentUser?: CurrentUser;
  user?: CurrentUser;
}
```

---

## 📦 AuthModule (`auth.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Módulo de autenticación.
 * 
 * Exporta:
 * - AuthService: Para validar tokens y resolver usuarios
 * - AuthGuard: Para proteger endpoints
 * - RolesGuard: Para validar roles
 * 
 * Dependencias:
 * - ConfigModule: Para leer variables de entorno (SUPABASE_URL, etc.)
 * - PrismaModule: Para acceder a la base de datos
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard],
  exports: [AuthService, AuthGuard, RolesGuard],
})
export class AuthModule {}
```

---

## 🔍 Resumen de Endpoints

### GET /auth/me

**Descripción:** Obtiene el perfil del usuario autenticado.

**Autenticación:** Requerida (Bearer token)

**Headers:**
```
Authorization: Bearer <token_de_supabase>
```

**Body:** Ninguno

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

**Errores posibles:**
- `401 AUTH_TOKEN_MISSING`: Falta el header Authorization
- `401 AUTH_INVALID_TOKEN`: Token inválido o expirado
- `401 AUTH_USER_NOT_FOUND`: Usuario no existe en la BD
- `401 AUTH_NO_USER`: No hay usuario en el request
- `401 AUTH_SUPABASE_NOT_CONFIGURED`: Supabase no está configurado (solo en fallback)

---

## ⚠️ Endpoints que NO existen (pero podrían necesitarse)

Según la documentación del proyecto (`NEGOCIO_V1.md` y `USE_CASES.md`), deberían existir pero **actualmente NO están implementados**:

### ❌ POST /auth/login
**No existe.** El login se maneja desde el frontend con Supabase Auth.

### ❌ POST /auth/register
**No existe.** El registro de usuarios se hace mediante otros endpoints:
- `POST /users/admin` (SUPER_ADMIN crea ADMIN)
- `POST /users/students` (ADMIN crea STUDENT)
- `POST /users/teachers` (ADMIN crea TEACHER)

### ❌ POST /auth/refresh
**No existe.** El refresh token se maneja desde Supabase.

### ❌ POST /auth/change-password
**No existe.** Mencionado como opcional en V1, pero no implementado.

---

## 🔐 Flujo de Autenticación Actual

1. **Frontend** → Usuario hace login con Supabase Auth (email + password)
2. **Supabase** → Genera un JWT token y lo devuelve al frontend
3. **Frontend** → Guarda el token (localStorage, cookies, etc.)
4. **Frontend** → En cada request al backend, incluye: `Authorization: Bearer <token>`
5. **Backend** → `AuthGuard` intercepta el request
6. **Backend** → `AuthService.resolveCurrentUser()` valida el token con Supabase
7. **Backend** → Busca el usuario en Prisma por email/id
8. **Backend** → Agrega `currentUser` al request
9. **Backend** → Ejecuta el endpoint con el usuario autenticado

---

## 📚 Referencias

---

## 🧩 Provisioning de usuarios (SupabaseAdminService)

Para alinear el modelo de negocio (Prisma) con Supabase Auth, el módulo ahora expone `SupabaseAdminService`, disponible para otros módulos vía `AuthModule`. Este servicio usa la **service role key** y realiza acciones privilegiadas:

- `inviteUserByEmail(email)` → envía una invitación oficial de Supabase. Si el email ya existe, lanza `ConflictException`.
- `createUserWithPassword(email, password)` → helper genérico (no usado aún) para futuros flujos.
- `deleteUser(userId)` → cleanup best-effort cuando Prisma falla después de provisionar en Supabase.

### Flujo vigente: alta de ADMIN

1. SUPER_ADMIN (frontend `/superadmin`) envía `POST /users/admin`.
2. `UsersService.createAdmin` valida clubId/email y llama a `SupabaseAdminService.inviteUserByEmail`.
3. Si Supabase confirma la invitación, se persiste el usuario en Prisma con `role=ADMIN`, `clubId`, y se guarda `supabaseUserId`.
4. Si Prisma falla, se intenta borrar al usuario recién creado en Supabase para mantener consistencia.

Este patrón será reutilizable para profesores/alumnos en próximos incrementos: basta con reutilizar el servicio desde los otros casos de uso y persistir el `supabaseUserId` asociado.

> Requisitos de entorno: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` deben estar definidos. Si faltan, `SupabaseAdminService` lanza `ServiceUnavailableException`.


- Documentación del proyecto: `docs/NEGOCIO_V1.md`
- Casos de uso: `docs/USE_CASES.md`
- Reglas técnicas: `docs/TECH_RULES.md`


