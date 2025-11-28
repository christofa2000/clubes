# MODULES_STRUCTURE_V1 — Estructura de Módulos del Backend

Estado: Aprobado  
Alcance: Backend V1 (NestJS + Prisma + PostgreSQL).  
Relación: Complementa a `NEGOCIO_V1.md`, `TECH_RULES_V1.md` y `USE_CASES_V1.md`.

> Si hay conflicto:
>
> 1. NEGOCIO_V1.md manda sobre todo.
> 2. Luego USE_CASES_V1.md.
> 3. Luego este archivo.
> 4. Finalmente TECH_RULES_V1.md.

---

## 1. Visión general

El backend está organizado en **módulos de dominio** dentro de `src/modules`.  
Cada módulo representa un área del negocio y se comunica con otros mediante servicios, no accediendo directamente a la base de datos de otro módulo.

Carpeta base sugerida:

```bash
src/
  main.ts
  app.module.ts
  config/
  common/
    dto/
    guards/
    interceptors/
    filters/
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

2. Módulo auth

Responsabilidad:

Login

Emisión de tokens (JWT o similar)

Recupero / cambio de contraseña (si se implementa en V1)

NO hace:

No gestiona alumnos, profesores, ni Admins a nivel negocio.

No maneja lógica de roles (más allá del token).

Endpoints típicos:

POST /auth/login

POST /auth/refresh (opcional)

POST /auth/change-password (opcional V1)

3. Módulo users

Responsabilidad:

Usuarios de la plataforma (ADMIN, PROFESOR, ALUMNO, SUPER_ADMIN).

Alta, baja lógica, actualización de datos básicos.

Asociación con clubId (salvo SUPER_ADMIN).

Relación con negocio:

ADMIN crea alumnos y profesores.

SUPER_ADMIN crea admins (esto también puede exponerse por módulo clubs).

NO hace:

No define lógica de clases, planes ni pagos.

No calcula deudas.

Endpoints típicos:

POST /users (creación genérica, pero normalmente se usan flows de negocio: alta alumno/profesor/admin)

GET /users/:id

PATCH /users/:id

PATCH /users/:id/deactivate

Para alta de alumno/profesor se recomienda exponer endpoints más específicos en módulos de negocio (ej: students / teachers) o usar users con flags de rol claramente definidos.

4. Módulo clubs

Responsabilidad:

Clubes (multi-tenant root).

Creación / gestión de clubes por SUPER_ADMIN.

Asociación de ADMIN ↔ Club.

NO hace:

No maneja sedes, actividades ni clases (esto lo hace branches, activities, etc.).

No gestiona pagos/planes.

Endpoints típicos:

POST /clubs (SUPER_ADMIN)

GET /clubs (SUPER_ADMIN)

GET /clubs/:id (SUPER_ADMIN)

PATCH /clubs/:id (SUPER_ADMIN)

5. Módulo branches (Sedes)

Responsabilidad:

Sedes de un club.

Datos de ubicación y contacto.

NO hace:

No maneja clases por sí mismo (solo referencia).

Endpoints típicos:

POST /branches

GET /branches

GET /branches/:id

PATCH /branches/:id

PATCH /branches/:id/deactivate

6. Módulo activities

Responsabilidad:

Actividades del club (Tenis, Patín, etc.).

NO hace:

No maneja precios (eso es plans).

No maneja clases (eso es classes).

Endpoints típicos:

POST /activities

GET /activities

GET /activities/:id

PATCH /activities/:id

PATCH /activities/:id/deactivate

7. Módulo plans

Responsabilidad:

Planes mensuales del club.

Tipo: por clases/semana o monto fijo.

Precio en ARS.

Asociación a actividades.

NO hace:

No asigna planes a alumnos (eso se puede manejar en users/students o en un submódulo específico).

No calcula deudas (eso lo hace payments/cashbox en combinación con reglas de negocio).

Endpoints típicos:

POST /plans

GET /plans

GET /plans/:id

PATCH /plans/:id

PATCH /plans/:id/deactivate

8. Módulo classes

Responsabilidad:

Definición de clases (únicas y repetitivas).

Asociación a actividad, sede y profesor.

Gestión de instancias concretas de clase (p.ej. cada martes a las 16 hs → instancias por fecha).

NO hace:

No maneja reservas (eso es reservations).

No marca asistencia (eso es attendance).

Endpoints típicos:

POST /classes → creación de clase (y series)

GET /classes → listado/filter

GET /classes/:id

PATCH /classes/:id

PATCH /classes/:id/deactivate

Si se modelan instancias de clase explícitas (classOccurrences o similar), también endpoints específicos para ellas.

9. Módulo reservations

Responsabilidad:

Reservas / inscripciones de alumnos en clases (instancias).

Soporta ambas modalidades:

Modo Alumno reserva.

Modo Admin asigna.

Respeta reglas de:

cupos

plan del alumno

políticas de cancelación (24h)

NO hace:

No marca asistencia.

No genera pagos ni deudas.

Endpoints típicos:

POST /classes/:classOccurrenceId/reservations → crear reserva

GET /reservations → listar reservas del club / alumno

DELETE /reservations/:id → cancelación (respetando reglas de 24h)

10. Módulo attendance

Responsabilidad:

Asistencia por alumno y por instancia de clase.

Marcar presente/ausente por profesor.

Registrar check-in por QR.

Resolver conflictos (profesor > QR).

NO hace:

No controla reservas (asume que la reserva existe).

No genera pagos ni penalidades.

Endpoints típicos:

POST /attendance/:classOccurrenceId/mark → marcado por profesor (lista)

POST /attendance/check-in → check-in por QR (alumno)

GET /attendance → reportes básicos filtrados

11. Módulo payments

Responsabilidad:

Pagos individuales de alumnos.

Campos: monto, fecha, medio, concepto, nota interna.

Opcional: vincular pagos con planes/ciclos mensuales para deudas.

NO hace:

No maneja caja diaria en detalle (eso es cashbox).

No integra pasarelas de pago.

Endpoints típicos:

POST /payments

GET /payments

GET /payments/:id

POST /payments/import → carga masiva (Excel)

12. Módulo cashbox

Responsabilidad:

Visión de caja del club.

Totales por día y por medio de pago.

NO hace:

No registra pagos directamente (los toma de payments).

Endpoints típicos:

GET /cashbox/daily

GET /cashbox/summary

13. Módulo reports

Responsabilidad:

Exponer reportes para ADMIN.

Usa datos de otros módulos (payments, attendance, classes, etc.).

Principales reportes V1:

Facturación mensual.

Asistencia por alumno/clase/profesor.

Ocupación de clases.

Uso del plan por alumno (en la medida en que los datos lo soporten).

NO hace:

No modifica datos.

Solo lectura/consulta.

Endpoints típicos:

GET /reports/billing

GET /reports/attendance

GET /reports/class-occupancy

GET /reports/plan-usage

14. Módulo notifications

Responsabilidad:

Envío de emails según eventos del negocio:

Alta de usuario (con contraseña).

Aviso de deuda.

Confirmación de pago.

NO hace:

No define lógica de cuándo alguien debe dinero → eso viene de payments/cashbox.

No envía WhatsApp ni SMS ni push (fuera de V1).

Endpoints típicos (si se exponen):

En V1 puede ser solo un servicio interno sin endpoints públicos.

Opcional: endpoints para reintentar envíos o probar plantillas.

15. Módulo notifications vs Jobs / Workers

Es recomendable que la lógica de envío de emails esté preparada para ejecutarse en background (cola de jobs).
En V1 esto puede ser simple, pero la estructura debe permitir:

Encolar un evento de email (ej: UserCreated, PaymentRegistered, DebtReminder).

Worker que procese la cola y llame al provider de email.

16. Módulos compartidos (common)

En src/common van recursos que no pertenecen a un solo módulo:

Guards de roles (RolesGuard, ClubGuard, etc.).

DTOs genéricos (paginación, filtros estándar).

Interceptores (logging, transformación de respuestas).

Filtros de errores HTTP.

Utilidades útiles para varios módulos (ej: helpers de fechas para clases repetitivas).

17. Reglas de separación entre módulos

Un módulo no debe acceder directamente a la DB de otro módulo:

Debe usar servicios expuestos por ese módulo (cuando aplique).

La lógica de negocio de cada área debe vivir en su propio servicio.

Evitar “módulos dios” que saben de todo (por ejemplo, no poner todo en users o clubs).

Para cambios de reglas de negocio, revisar primero:

NEGOCIO_V1.md

USE_CASES_V1.md
```
