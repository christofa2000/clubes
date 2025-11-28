# TECH_RULES_V1 — Reglas Técnicas del Proyecto "Gestión de Clubes"

Estado: Aprobado  
Ámbito: Backend + base de datos (V1).  
Este archivo es una guía para cualquier desarrollador o IA (por ejemplo, Cursor) que escriba código para este proyecto.

---

## 1. Documentos que SON la verdad del proyecto

Antes de escribir código, SIEMPRE leer:

1. `docs/NEGOCIO_V1.md` → define el negocio y las reglas funcionales.
2. `docs/TECH_RULES.md` → este archivo (reglas técnicas).
3. Diagramas en:
   - `docs/diagrama-arquitectura.jpg`
   - `docs/DIAGRAMA ERD.jpg`

> Regla: **no inventar features ni cambiar reglas del negocio**.  
> Si algo no está definido, el código debe dejarlo preparado pero NO asumir comportamiento nuevo.

---

## 2. Stack técnico

### 2.1. Lenguaje y entorno

- Backend en **Node.js** + **TypeScript**.
- TypeScript en modo **estricto** (`"strict": true` en `tsconfig.json`).
- Objetivo de runtime: Node 20+.

### 2.2. Framework backend

- Framework principal: **NestJS** (arquitectura modular).
- Patrón: `Controller → Service → Repository/Prisma`.

Si por alguna razón no se usa NestJS (solo si el humano lo decide), la arquitectura debe respetar igualmente:

- Separación clara entre:
  - controladores (HTTP)
  - servicios (lógica de negocio)
  - capa de acceso a datos (Prisma)

### 2.3. Base de datos y ORM

- DB: **PostgreSQL** (compatible con Supabase).
- ORM: **Prisma**.
- El schema de Prisma debe alinearse con el ERD de `docs/DIAGRAMA ERD.jpg` y `docs/NEGOCIO_V1.md`.

---

## 3. Principios generales

1. **Multi-tenant por `club_id`**: todas las entidades de negocio ligadas a un club deben tener `clubId`.
2. **Roles y permisos estrictos**: SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO.
3. **Código declarativo, predecible y tipado**.
4. **Nada de lógica misteriosa en el controlador**: la lógica de negocio va en servicios.
5. **No inventar endpoints**: solo crear endpoints que estén justificados por:
   - casos de uso
   - reglas de negocio en `NEGOCIO_V1.md`.

---

## 4. Estructura de carpetas del backend (propuesta inicial)

Dentro de `club/api` o similar:

```bash
src/
  main.ts
  app.module.ts
  config/
  common/
    filters/
    guards/
    interceptors/
    dto/
    utils/
  modules/
    auth/
    users/
    clubs/
    branches/
    activities/
    plans/
    classes/
    reservations/
    attendance/
    payments/
    cashbox/
    reports/
    notifications/
```

Reglas:

Cada módulo debe tener al menos:

\*.controller.ts

\*.service.ts

dto/ para DTOs

entities/ si se usan entidades TS

Código compartido va en common/.

5. TypeScript y estilo

Prohibido usar any explícito. Usar tipos, genéricos o unknown + refinamiento.

Usar DTOs para inputs de endpoints (CreateXDto, UpdateXDto, etc.).

Activar strictNullChecks.

Estandarizar nombres:

Tablas/campos en inglés: clubs, branches, students, teachers, activities, plans, classes, reservations, payments, attendance, cashbox.

Propiedades en camelCase: clubId, branchId, studentId, etc.

Formato:

Usar ESLint + Prettier (reglas estándar TypeScript/NestJS).

No dejar código comentado viejo.

6. Autenticación y autorización
   6.1. Autenticación

Sistema de login por email + contraseña.

Usar JWT o sesiones, pero de forma consistente.

El payload del token debe incluir como mínimo:

userId

role (SUPER_ADMIN | ADMIN | TEACHER | STUDENT)

clubId (null/undefined en SUPER_ADMIN)

6.2. Autorización

Usar guards (en NestJS) o middlewares equivalentes.

Todos los endpoints deben:

verificar usuario autenticado

verificar rol correcto

aplicar filtro por clubId cuando corresponda

Regla:

El SUPER_ADMIN nunca puede acceder a datos internos de negocio de clubes (alumnos, pagos, asistencias, etc.) en V1.

El ADMIN solo accede a datos de su clubId.

7. Multi-tenant y clubId

Reglas clave:

Todas las entidades de negocio (alumnos, profesores, actividades, planes, clases, reservas, pagos, caja, asistencia) deben tener relación directa o indirecta con clubId.

En servicios y repositorios, siempre filtrar por clubId del usuario logueado.

Ningún endpoint debe devolver datos de otro club.

Si hay dudas con una entidad, ver NEGOCIO_V1.md y el ERD antes de decidir.

8. Manejo de errores

Nunca devolver errores genéricos sin contexto.

Estructura recomendada de error HTTP:

{
"statusCode": 400,
"error": "Bad Request",
"message": "Reason of the error in human-readable form",
"details": { "...": "optional extra info" }
}

Errores comunes:

400 → datos inválidos

401 → no autenticado

403 → sin permisos o acceso a otro club

404 → recurso no encontrado (dentro del club)

409 → conflictos de negocio (cupos llenos, reserva duplicada, etc.)

9. Endpoint design (REST)

Reglas de estilo:

Usar nombres en plural, en inglés:

/api/clubs

/api/branches

/api/activities

/api/plans

/api/classes

/api/reservations

/api/attendance

/api/payments

/api/reports

Operaciones típicas:

GET /resource → listar

GET /resource/:id → detalle

POST /resource → crear

PUT /resource/:id → actualizar completo

PATCH /resource/:id → actualizar parcial

DELETE /resource/:id → desactivar (eliminación lógica)

Para acciones específicas de negocio, usar subrutas claras:

POST /classes/:id/reservations → reservar

POST /classes/:id/cancel-reservation → cancelar

POST /attendance/:classInstanceId/check-in → marcar presente por QR

POST /payments/import → carga masiva

10. Lógica de negocio vs lógica técnica

La lógica de negocio (reglas de reservas, asistencia, deudas, etc.) debe implementarse siguiendo estrictamente docs/NEGOCIO_V1.md.

No “simplificar” reglas solo para que el código sea más fácil.

Si una regla no está clara:

dejar TODO preparado (estructura, endpoints, tipos)

pero no inventar comportamiento final.

11. Testing

Objetivo V1: al menos tests de unidad básicos en módulos críticos:

auth

reservations

attendance

payments

No hace falta cobertura completa en V1, pero:

cualquier lógica compleja (ej: validación de cupos, cancelación, reglas de 24h) debe tener test.

12. Reglas específicas para IA (Cursor, etc.)

Leer siempre docs/NEGOCIO_V1.md antes de crear o modificar lógica de negocio.

No cambiar reglas definidas allí aunque parezcan complicadas.

Respetar este orden de prioridad:

NEGOCIO_V1.md

TECH_RULES.md

USE_CASES.md (cuando exista)

MODULES_STRUCTURE.md (cuando exista)

Antes de crear un nuevo endpoint, comprobar:

¿Está este flujo en un caso de uso?

¿Respeta roles y clubId?

No generar código muerto ni helpers no usados.

Comentar el código solo cuando ayude a entender decisiones de negocio o multi-tenant.

13. Futuras extensiones (fuera de V1)

Integración con pasarelas de pago.

Página pública por club.

Subdominios por club.

Notificaciones avanzadas (WhatsApp, push).

Integraciones contables/fiscales.

En V1, NO preparar integraciones concretas, solo dejar el código modular y extensible.
