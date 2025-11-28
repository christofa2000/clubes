# USE_CASES_V1 — Casos de Uso Principales

Estado: Aprobado  
Alcance: Versión V1 de la app de gestión de clubes.  
Relación: Este documento complementa a `NEGOCIO_V1.md` y `TECH_RULES_V1.md`.

> Importante: Si hay conflicto, las reglas de negocio de `NEGOCIO_V1.md` tienen prioridad.

---

## Índice

1. UC-01 — Crear club y Admin (SUPER_ADMIN)
2. UC-02 — Login y redirección según rol
3. UC-03 — Configuración inicial del club (ADMIN)
4. UC-04 — Alta de profesor (ADMIN)
5. UC-05 — Alta de alumno y envío de acceso (ADMIN)
6. UC-06 — Creación de planes mensuales (ADMIN)
7. UC-07 — Creación de clases (únicas y repetitivas) (ADMIN)
8. UC-08 — Reserva de clase por alumno (modo “Alumno reserva”)
9. UC-09 — Asignación de alumnos a clases (modo “Admin asigna”)
10. UC-10 — Cancelación de reserva por alumno
11. UC-11 — Registro de asistencia (profesor + QR)
12. UC-12 — Registro de pago manual (ADMIN)
13. UC-13 — Carga masiva de pagos (ADMIN)
14. UC-14 — Consulta de reportes básicos (ADMIN)

---

## UC-01 — Crear club y Admin (SUPER_ADMIN)

**Actor principal:** SUPER_ADMIN  
**Objetivo:** Crear un nuevo club y su usuario ADMIN dueño.

### Precondiciones

- SUPER_ADMIN está autenticado.
- El club aún no existe en el sistema.

### Flujo principal

1. SUPER_ADMIN accede al panel de gestión de clubes.
2. Hace clic en “Crear nuevo club”.
3. Completa datos mínimos del club:
   - Nombre del club.
   - Datos básicos de contacto.
4. Crea el usuario ADMIN asociado:
   - Nombre y apellido del dueño.
   - Email.
5. El sistema:
   - Crea el registro del club.
   - Genera usuario con rol ADMIN, ligado al `clubId`.
   - Genera una contraseña temporal.
   - Encola el envío de email con acceso.
6. El ADMIN queda en estado activo.

### Resultado

- Club creado en estado activo.
- Admin del club creado y listo para acceder.

### Errores y variaciones

- Email de ADMIN ya existente → error, informar al SUPER_ADMIN.
- Fallo en envío de email → registrar el error, pero el ADMIN sigue creado (posibilidad de reenvío).

---

## UC-02 — Login y redirección según rol

**Actor principal:** ADMIN / PROFESOR / ALUMNO / SUPER_ADMIN  
**Objetivo:** Autenticarse y acceder al panel correspondiente.

### Precondiciones

- El usuario fue creado previamente.
- Tiene email y contraseña.

### Flujo principal

1. El usuario ingresa a la landing principal y hace clic en “Ingresar”.
2. Ingresa email y contraseña.
3. El sistema:
   - Valida credenciales.
   - Obtiene rol y `clubId` (si aplica).
   - Genera token de sesión/JWT.
4. Según el rol:
   - SUPER_ADMIN → Panel global.
   - ADMIN → Panel del club (configuración, personas, clases, economía).
   - PROFESOR → Panel de profesor (clases y asistencia).
   - ALUMNO → Panel de alumno (clases, reservas, pagos, deudas).

### Resultado

- Usuario autenticado en su panel correcto.

### Errores

- Credenciales inválidas → error 401.
- Usuario desactivado → error 403 con mensaje “Usuario inactivo”.

---

## UC-03 — Configuración inicial del club (ADMIN)

**Actor principal:** ADMIN  
**Objetivo:** Dejar el club listo para operar.

### Precondiciones

- ADMIN autenticado.
- Club recién creado, sin datos de negocio.

### Flujo principal

1. ADMIN configura datos del club:
   - Nombre, logo, colores.
2. Crea al menos una sede:
   - Nombre, dirección, horarios, contacto.
3. Crea actividades (ej: Tenis, Patín).
4. Configura modalidad de reservas:
   - Modo 1: Alumno puede reservar clases.
   - Modo 2: Solo Admin asigna alumnos a clases.
5. Configura parámetros:
   - Cupo máximo por defecto.
   - Política de cancelación (24h en V1).
   - Límites de reservas por alumno.
   - Rango de validez del QR.

### Resultado

- Club con sedes, actividades y parámetros básicos configurados.

---

## UC-04 — Alta de profesor (ADMIN)

**Actor principal:** ADMIN  
**Objetivo:** Crear un usuario profesor para el club.

### Precondiciones

- ADMIN autenticado.
- Club activo.

### Flujo principal

1. ADMIN entra a “Profesores”.
2. Hace clic en “Crear profesor”.
3. Completa:
   - Nombre, apellido (obligatorio).
   - Email (recomendado para acceso).
4. El sistema:
   - Crea usuario con rol PROFESOR y `clubId`.
   - Genera contraseña temporal.
   - Encola email con acceso.

### Resultado

- Profesor creado y listo para ser asignado a clases.

### Errores

- Email en uso en otro usuario → error, decidir si se permite múltiples roles o no (en V1, se asume email único por usuario).

---

## UC-05 — Alta de alumno y envío de acceso (ADMIN)

**Actor principal:** ADMIN  
**Objetivo:** Crear un alumno con acceso al sistema.

### Precondiciones

- ADMIN autenticado.
- Club activo.

### Flujo principal

1. ADMIN entra a “Alumnos”.
2. Hace clic en “Crear alumno”.
3. Completa:
   - Nombre y apellido (obligatorios).
   - Email (recomendado si va a usar el panel).
   - Datos opcionales: teléfono, DNI, dirección, fecha de nacimiento, tutor.
4. Opcional: asigna uno o más planes al alumno.
5. El sistema:
   - Crea usuario con rol ALUMNO y `clubId`.
   - Genera contraseña temporal.
   - Encola envío de email con acceso (si hay email).

### Resultado

- Alumno creado.
- Si tiene email → recibe acceso.
- Puede ser luego asignado a clases o reservar según modalidad.

### Errores

- Email duplicado → error.
- Falta de nombre/apellido → error de validación.

---

## UC-06 — Creación de planes mensuales (ADMIN)

**Actor principal:** ADMIN  
**Objetivo:** Crear planes que luego se asignarán a alumnos.

### Precondiciones

- ADMIN autenticado.
- Club con al menos una actividad.

### Flujo principal

1. ADMIN entra a “Planes”.
2. Hace clic en “Crear plan”.
3. Define:
   - Actividad.
   - Nombre del plan.
   - Tipo de plan:
     - por cantidad de clases por semana.
     - o monto fijo sin límite.
   - Precio mensual en ARS.
4. El sistema guarda el plan.

### Resultado

- Plan disponible para ser asignado a alumnos.

---

## UC-07 — Creación de clases (únicas y repetitivas) (ADMIN)

**Actor principal:** ADMIN  
**Objetivo:** Definir las clases que el club ofrecerá.

### Precondiciones

- ADMIN autenticado.
- Existen:
  - actividades,
  - sedes,
  - profesores.

### Flujo principal

1. ADMIN entra a “Clases”.
2. Hace clic en “Crear clase”.
3. Define:
   - Actividad.
   - Sede.
   - Profesor.
   - Nivel (ej: inicial/intermedio/avanzado).
   - Tipo (grupal/individual/etc.).
   - Cupo máximo (solo alumnos).
4. Elige tipo:
   - Clase única → fecha específica + horario.
   - Clase repetitiva:
     - días de la semana.
     - horario.
     - fecha de inicio.
     - fecha de fin o “indefinida”.
5. El sistema:
   - Crea la definición de clase y, para repetitivas,
   - genera instancias según las fechas.

### Resultado

- Clases listas para reservas/asignaciones.

### Errores

- Falta de profesor/actividad/sede → error.
- Superposición de horarios con el mismo profesor (puede ser validación opcional).

---

## UC-08 — Reserva de clase por alumno (modo “Alumno reserva”)

**Actor principal:** ALUMNO  
**Objetivo:** Reservar un lugar en una clase disponible.

### Precondiciones

- Club configurado en modo “Alumno reserva”.
- Alumno autenticado.
- Alumno con al menos un plan activo que permita reservas.
- Clase con cupo disponible.

### Flujo principal

1. ALUMNO entra a su panel y ve el calendario de clases.
2. Filtra por actividad/sede/fecha si quiere.
3. Selecciona una clase disponible.
4. El sistema:
   - Verifica que el alumno tenga plan válido (según reglas de planes).
   - Verifica cupo.
   - Verifica que el alumno no tenga otra clase en el mismo horario (opcional).
5. Si todo ok → crea la reserva.

### Resultado

- Reserva confirmada para el alumno.
- La clase incrementa su contador de reservas.

### Errores

- Cupo lleno → error (opción de lista de espera).
- Sin plan activo → error.
- Usuario bloqueado → error.

---

## UC-09 — Asignación de alumnos a clases (modo “Admin asigna”)

**Actor principal:** ADMIN  
**Objetivo:** Asignar alumnos manualmente a clases.

### Precondiciones

- Club configurado en modo “Admin asigna”.
- ADMIN autenticado.
- Existen clases y alumnos.

### Flujo principal

1. ADMIN entra a detalle de una clase.
2. Ve lista de inscriptos actuales.
3. Hace clic en “Agregar alumno”.
4. Busca alumno por nombre/email/DNI.
5. Selecciona alumno y confirma.
6. El sistema:
   - Verifica plan del alumno (si se aplica).
   - Verifica cupo.
7. Crea la inscripción/reserva.

### Resultado

- Alumno asignado a la clase.

---

## UC-10 — Cancelación de reserva por alumno

**Actor principal:** ALUMNO  
**Objetivo:** Cancelar su reserva de clase respetando el plazo.

### Precondiciones

- Alumno autenticado.
- Reserva existente y activa.
- La clase aún no empezó.
- Falta ≥ 24 hs para el inicio de la clase (para cancelación por alumno).

### Flujo principal

1. ALUMNO entra a “Mis clases”.
2. Selecciona una reserva futura.
3. Hace clic en “Cancelar”.
4. El sistema:
   - Verifica que falten al menos 24 hs.
   - Marca la reserva como cancelada.
   - Libera el cupo.

### Resultado

- Reserva cancelada.
- Cupo disponible para otro alumno (reserva o lista de espera).

### Variaciones

- Si faltan < 24hs:
  - El sistema no permite cancelación por alumno.
  - Mensaje: “Contacta al club para cancelar”.

---

## UC-11 — Registro de asistencia (profesor + QR)

**Actor principal:** PROFESOR / ALUMNO  
**Objetivo:** Dejar registrada la asistencia real a la clase.

### Precondiciones

- Clase en curso o próxima a iniciar.
- Reservas / asignaciones ya registradas.

### Flujo principal A (Profesor marca asistencia)

1. PROFESOR entra a su panel y abre la clase del día.
2. Ve lista de alumnos inscriptos.
3. Para cada alumno, marca:
   - presente
   - ausente
4. El sistema guarda el registro.

### Flujo principal B (Alumno marca por QR)

1. El club muestra un QR genérico (en pantalla o impreso).
2. ALUMNO escanea QR desde su panel (web o futuro mobile).
3. El sistema:
   - Identifica club + usuario + horario.
   - Determina la clase en la que debería estar según sus reservas.
   - Marca asistencia como “presente (QR)”.

### Conflicto de fuentes

- Si el profesor luego marca al mismo alumno como ausente/presente diferente:
  - prevalece el valor marcado por el profesor.
  - se guarda igualmente que hubo check-in por QR como dato referencial (si se quiere).

---

## UC-12 — Registro de pago manual (ADMIN)

**Actor principal:** ADMIN  
**Objetivo:** Registrar un pago manual de un alumno.

### Precondiciones

- ADMIN autenticado.
- Alumno existente.

### Flujo principal

1. ADMIN entra a “Pagos”.
2. Hace clic en “Registrar pago”.
3. Selecciona alumno.
4. Ingresa:
   - Monto.
   - Fecha del pago.
   - Medio de pago (efectivo/transferencia/tarjeta/otros).
   - Concepto (opcional).
   - Nota interna (opcional).
5. El sistema:
   - Crea el registro del pago.
   - Actualiza la deuda del alumno.

### Resultado

- Pago registrado.
- Deuda recalculada.

---

## UC-13 — Carga masiva de pagos (ADMIN)

**Actor principal:** ADMIN  
**Objetivo:** Registrar múltiples pagos de una sola vez.

### Precondiciones

- ADMIN autenticado.
- Archivo de resumen bancario/Excel preparado.

### Flujo principal

1. ADMIN entra a “Pagos → Carga masiva”.
2. Sube archivo (formato definido en la implementación).
3. El sistema:
   - Lee filas con montos y referencias.
   - Intenta asociar cada pago a un alumno:
     - por email
     - por DNI
     - por otra referencia definida
4. ADMIN revisa pantalla de “conciliación”:
   - filas que matchean alumno
   - filas ambiguas o sin match
5. ADMIN confirma las que son correctas.
6. El sistema:
   - Crea los pagos correspondientes.
   - Ajusta deudas relacionadas.

### Resultado

- Pagos masivos registrados.
- Alumnos actualizados.

---

## UC-14 — Consulta de reportes básicos (ADMIN)

**Actor principal:** ADMIN  
**Objetivo:** Ver información agregada para gestionar el club.

### Precondiciones

- ADMIN autenticado.
- Club con datos (pagos, asistencias, reservas).

### Flujo principal

1. ADMIN entra a “Reportes”.
2. Selecciona tipo de reporte:
   - Facturación mensual (por club y opcional por actividad).
   - Asistencia (por alumno, clase, profesor).
   - Ocupación de clases (más llenas / menos llenas).
   - Uso de plan (cuántas clases reserva/toma un alumno).
3. Aplica filtros:
   - rango de fechas
   - actividad
   - sede
   - profesor
4. El sistema ejecuta las consultas y muestra resultados en tablas/gráficos (según la implementación).

### Resultado

- ADMIN visualiza métricas clave para tomar decisiones.

---

Fin de `USE_CASES_V1`.
