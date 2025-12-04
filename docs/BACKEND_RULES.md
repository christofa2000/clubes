# BACKEND_RULES.md

## Reglas de Backend – Proyecto "Admin" (White-Label Multi-Club)

Este documento define las reglas del BACKEND.  
El backend está hecho en **NestJS + Prisma + PostgreSQL (Supabase)**.

El objetivo del backend es:

- Implementar **lógica de negocio real** (no solo CRUD sueltos).
- Respetar **roles y permisos**.
- Respetar **multi-tenant por club y sede**.
- Ser consistente, predecible y fácil de consumir desde el front.

> ⚠️ IMPORTANTE:  
> No modificar el esquema de base de datos sin que lo indique explícitamente `NEGOCIO_V1.md`.  
> La DB actual es la “fuente de verdad”.

---

## 1. Stack y organización

- Framework: **NestJS**
- ORM: **Prisma**
- DB: **PostgreSQL en Supabase**
- Autenticación: tokens (JWT / Supabase) → siempre resueltos a un `CurrentUser`.
- Arquitectura por módulos:
  - `AuthModule`
  - `UsersModule`
  - `ClubsModule`
  - `BranchesModule`
  - `StudentsModule`
  - `ProfessionalsModule`
  - `ActivitiesModule`
  - `ReservationsModule`
  - `PaymentsModule`
  - `HealthModule`

Convención de carpetas por módulo:

```txt
src/
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/
    guards/
    strategies/
  users/
    users.module.ts
    users.controller.ts
    users.service.ts
    dto/
  ...
2. Modelo de Roles
Roles definidos (string literal):

SUPER_ADMIN

CLUB_ADMIN

PROFESSIONAL

STUDENT

En código (ejemplo):

ts
Copiar código
export type UserRole = 'SUPER_ADMIN' | 'CLUB_ADMIN' | 'PROFESSIONAL' | 'STUDENT';
Cada usuario tiene:

id

email

role: UserRole

clubId (null solo para SUPER_ADMIN)

branchId (opcional según negocio)

3. Multi-tenant: reglas básicas
SUPER_ADMIN

Puede ver y gestionar todos los clubs.

Puede crear nuevos clubs.

Puede crear usuarios de cualquier rol y asignarlos a un club.

No tiene clubId fijo (o se ignora en filtros).

CLUB_ADMIN

Solo ve datos de su club (clubId).

Solo puede gestionar:

students de su club

professionals de su club

branches de su club

activities de su club

reservations y payments de su club

No puede ver ni modificar otros clubs.

PROFESSIONAL

Solo ve:

Sus propios alumnos/asignaciones.

Sus propias clases / actividades.

Reservas relacionadas a sus clases.

No puede crear clubs ni otros admins.

STUDENT

Solo ve:

Sus datos personales.

Sus reservas.

Sus pagos.

Horarios / actividades públicas del club al que pertenece.

4. Patrón de autorización
4.1. Decorador @CurrentUser()
En cualquier request autenticado, el backend debe resolver un objeto:

ts
Copiar código
export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  clubId: string | null;
  branchId?: string | null;
};
Implementar:

CurrentUser decorator.

Guard que lee el token, lo valida y carga el usuario desde Prisma.

4.2. Guard de roles @Roles(...)
Crear:

@Roles(...roles: UserRole[]) decorator.

RolesGuard que:

Usa CurrentUser.

Verifica si el rol está permitido en ese endpoint.

Ejemplo:

ts
Copiar código
@UseGuards(AuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Get('all')
findAll() { ... }
4.3. Filtro multi-tenant
Regla:

Nunca hacer prisma.*.findMany() sin filtrar por clubId, excepto para SUPER_ADMIN.

Patrón:

Crear funciones de ayuda en un servicio base, por ejemplo:

ts
Copiar código
protected applyClubFilter<T extends { clubId?: string | null }>(
  currentUser: CurrentUser,
  where: Prisma.WhateverWhereInput = {},
): Prisma.WhateverWhereInput {
  if (currentUser.role === 'SUPER_ADMIN') return where;
  return { ...where, clubId: currentUser.clubId };
}
Usar esto en todos los servicios de dominio que trabajen con entidades “per club”.

5. Diseño de API
5.1. Convención general
Prefijo base sugerido:

/api o /v1 (ej: /api/v1/clubs)

Controladores RESTful:

GET /clubs

POST /clubs

GET /clubs/:id

PATCH /clubs/:id

DELETE /clubs/:id (solo si negocio lo permite)

Mismas convenciones para:

/users

/students

/professionals

/activities

/reservations

/payments

5.2. Endpoint clave: GET /auth/me
Debe existir sí o sí:

Ruta: GET /auth/me

Rol: cualquier usuario autenticado.

Devuelve:

json
Copiar código
{
  "id": "uuid",
  "email": "admin@mail.com",
  "role": "SUPER_ADMIN",
  "clubId": null,
  "branchId": null,
  "profile": {
    "name": "Admin Demo"
  }
}
Este endpoint es el que usa el front para:

Saber quién es el usuario.

Saber a qué ruta llevarlo (/admin, /cliente, etc.).

Mostrar nombre/rol en el header.

6. Módulos y responsabilidades
6.1. AuthModule
Responsable de:

Validar tokens.

Resolver CurrentUser.

Exponer:

GET /auth/me

(a futuro) /auth/login, /auth/logout, etc., si aplica.

No debe contener lógica de negocio (no crea clubs, no registra pagos).

6.2. UsersModule
CRUD de usuarios (con permisos):

SUPER_ADMIN:

Crear cualquier rol.

CLUB_ADMIN:

Solo puede crear STUDENT y PROFESSIONAL dentro de su club.

Validaciones:

No crear usuario con clubId de otro club si no sos SUPER_ADMIN.

No cambiar role de forma arbitraria.

6.3. ClubsModule
SOLO SUPER_ADMIN puede:

Crear clubs.

Ver listado global de clubs.

CLUB_ADMIN solo ve y puede actualizar su club.

6.4. StudentsModule
CLUB_ADMIN:

Crear y gestionar students de su club.

PROFESSIONAL:

Consultar students asignados.

STUDENT:

Ver solo su propio perfil.

6.5. ProfessionalsModule
CLUB_ADMIN:

Crear/editar professionals de su club.

PROFESSIONAL:

Ver su propio perfil.

6.6. ActivitiesModule
Activities = clases/entrenamientos.

CLUB_ADMIN:

Crea actividades para su club/sede.

PROFESSIONAL:

Puede gestionar actividades propias según negocio.

STUDENT:

Ve calendario/horarios públicos.

6.7. ReservationsModule
STUDENT:

Crear/cancelar reservas propias.

CLUB_ADMIN / PROFESSIONAL:

Ver reservas de su club / sus actividades.

6.8. PaymentsModule
CLUB_ADMIN:

Registrar pagos para estudiantes de su club.

STUDENT:

Ver sus propios pagos.

7. DTOs, Validaciones y Respuestas
Usar class-validator + class-transformer.

Cada endpoint debe tener DTOs claros:

CreateXDto

UpdateXDto

Nunca exponer passwords ni campos sensibles.

Tipos estrictos; no usar any.

Ejemplo:

ts
Copiar código
export class CreateStudentDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
8. Manejo de errores
Usar excepciones Nest:

UnauthorizedException

ForbiddenException

NotFoundException

BadRequestException

Mensajes claros tipo:

"FORBIDDEN_OTHER_CLUB" cuando intenta acceder a otro club.

"STUDENT_NOT_FOUND" etc.

9. Testing mínimo
Cada módulo importante debe tener:

Tests de servicio (*.service.spec.ts) con mocks de Prisma.

Tests mínimos:

AuthService resuelve bien CurrentUser.

ClubsService respeta filtros por clubId.

StudentsService no permite acceso entre clubs.

10. Roadmap sugerido de implementación
Orden recomendado:

AuthModule + CurrentUser + RolesGuard + GET /auth/me.

ClubsModule (solo lectura y creación por SUPER_ADMIN).

UsersModule (crear admins, professionals, students con reglas de club).

StudentsModule y ProfessionalsModule con filtros por club.

ActivitiesModule → actividades por club/sede.

ReservationsModule → reservas.

PaymentsModule → pagos.

Cada paso debe respetar:

Roles

Filtros por club

DTOs tipados

Errores claros
```
