# NEGOCIO_V1 — App de Gestión de Clubes

Versión: V1  
Estado: Definición funcional aprobada  
Propietario del sistema: SUPER_ADMIN (dueño de la plataforma)

---

# 1. Propósito del Sistema

La app es una plataforma de gestión para **clubes, academias y escuelas** (tenis, patín, danza, etc.).  
Permite administrar:

- Clubes y sedes
- Actividades
- Planes y membresías
- Alumnos y profesores
- Clases, reservas y cupos
- Asistencia de clases
- Pagos, deudas y caja
- Reportes y estadísticas

El objetivo es dar a cada club una herramienta completa para manejar su día a día, y ofrecer a profesores y alumnos un acceso simple desde web (y futuro mobile).

---

# 2. Alcance General de la V1

## Incluye

- Multi-club, multi-sede
- Roles: SUPER_ADMIN, ADMIN, PROFESOR, ALUMNO
- Gestión de actividades, planes, clases, reservas y asistencia
- Pagos manuales + carga masiva por Excel
- Caja por club
- Deudas automáticas
- Reportes (facturación + asistencia + ocupación de clases)
- Configuraciones por club
- Notificaciones por email (limitadas)

## No Incluye (excluido explícitamente)

- Integración con AFIP
- Mercado Pago / Stripe / pasarelas de pago
- Débitos automáticos
- WhatsApp / SMS / Push Notifications
- Página pública para cada club
- Comprobantes fiscales
- PDFs automáticos (solo email en V1)
- API externa pública

---

# 3. Modelo Multi-tenant

- La app es **multi-club**.
- Cada registro de negocio contiene `club_id`.
- ADMIN, PROFESOR y ALUMNO pertenecen a un único club.
- SUPER_ADMIN no está asociado a ningún club.
- Toda operación se filtra por `club_id`.
- Los datos entre clubes están completamente aislados.

---

# 4. Roles y Permisos

## 4.1 SUPER_ADMIN

- Crear, editar y eliminar usuarios **ADMIN**.
- Asociar ADMIN ↔ Club.
- No ve datos internos (alumnos, pagos, asistencias, reportes).

## 4.2 ADMIN (Dueño del Club)

Puede gestionar:

### Configuración del club

- Nombre, logo, colores
- Sedes (nombre, dirección, horarios, contacto)
- Actividades
- Planes mensuales
- Configuraciones del sistema (cupos, cancelación, límites, QR)

### Personas

- Crear alumnos
- Crear profesores
- Activar/desactivar usuarios
- Asignar planes a alumnos

### Clases

- Crear clases únicas y repetitivas
- Asignar sede, actividad, profesor, nivel y cupo
- Elegir modalidad de reservas:
  1. Alumno puede reservar
  2. Admin asigna alumnos

### Económico

- Registrar pagos manuales
- Registrar pagos masivos via Excel
- Ver caja diaria
- Ver deudas
- Bloquear alumnos deudores si lo desea

### Reportes

- Facturación
- Asistencia
- Ocupación de clases
- Uso del plan por alumno

---

## 4.3 PROFESOR

Panel simple:

- Ver calendario de clases asignadas
- Ver lista de alumnos de cada clase
- Marcar asistencia (presente/ausente)
- Mostrar QR de asistencia

No puede ver datos económicos ni administrar el club.

---

## 4.4 ALUMNO

- No se auto-registra
- Recibe email con contraseña generada automáticamente
- Puede cambiar la contraseña

Puede:

- Ver sus clases
- Reservar (si el club lo permite)
- Cancelar reservas hasta 24 horas antes
- Marcar asistencia con QR
- Ver pagos
- Ver deudas

---

# 5. Entidades Funcionales (vista de negocio)

## Club

- Nombre, logo, colores
- Relacionado con sedes, actividades, usuarios, clases, pagos, caja

## Sede

- Nombre
- Dirección
- Horarios
- Contacto
- Usada para ubicar clases

## Actividad

- Ej: Tenis, Patín
- Pertenece a un club
- Relacionada a planes y clases

## Plan

- Mensual
- Tipo:
  - por cantidad de clases por semana
  - o monto fijo sin límite
- Precio en ARS
- Un alumno puede tener varios planes activos

## Usuario

- ADMIN / PROFESOR / ALUMNO / SUPER_ADMIN
- Para alumno: datos opcionales (DNI, dirección, tutor, etc.)

## Clase

- Actividad + sede + profesor
- Única o repetitiva
- Datos: fecha/hora, nivel, tipo, cupo
- Las repetitivas generan instancias individuales

## Reserva

- Alumno + Clase (instancia)
- Respeta plan + cupo
- Cancelación hasta 24 hs antes
- Lista de espera (sí)

## Asistencia

- Alumno + clase (instancia)
- Marcada por profesor o QR
- Si hay conflicto → gana profesor
- Historial completo

## Pago

- Monto
- Fecha
- Medio (efectivo/transferencia/tarjeta/otros)
- Concepto opcional
- Nota interna opcional

## Caja

- Caja única por club
- Registra ingresos por día

## Deuda

- Calculada automáticamente por:
  - planes generados
  - pagos realizados
- Deudor puede seguir asistiendo salvo bloqueo manual

---

# 6. Reglas del Negocio

## 6.1 Alta de usuarios

- Alumno y profesor creados por ADMIN
- El sistema genera contraseña → enviada por email
- Usuario puede cambiar contraseña en su panel

## 6.2 Reservas

- Modo configurable por club:
  1. Alumno reserva
  2. Admin asigna
- Reserva válida solo si:
  - cupo disponible
  - plan lo permite
- Cancelación por alumno: hasta 24hs antes
- Admin puede cancelar sin restricciones

## 6.3 Asistencia

- Profesor marca presente/ausente
- Alumno puede marcarse con QR genérico del club
- Validez por horario
- Si profesor corrige → su valor prevalece
- Asistencia no afecta planes en V1

## 6.4 Pagos

- Manuales
- Concepto opcional
- Carga masiva por Excel/resumen bancario
- Caja única por club
- Deuda automática
- Admin decide si bloquea reservas por deuda

## 6.5 Notificaciones (V1)

- Alta de usuario
- Aviso de deuda
- Confirmación de pago

---

# 7. Reportes

Incluye:

- Facturación por mes
- Asistencia por alumno/clase/profesor
- Ocupación (clases más llenas / menos llenas)
- Uso del plan

---

# 8. Eliminación Lógica

- Alumnos, profesores, actividades, sedes, clases y planes se desactivan
- No se eliminan físicamente
- El historial siempre se conserva

---

# 9. Versión Mobile (Futuro)

- UX simplificada
- Funciones principales:
  - clases
  - reservas
  - asistencia
  - pagos básicos

---

# 10. Página Principal / Landing de la Plataforma

## 10.1 Landing Comercial

Visible para cualquier persona.

Debe incluir:

- Qué es la app
- Módulos y beneficios
- Demo visual (futuro)
- Contacto
- Formulario “Quiero mi club”

No muestra datos de clubes reales.

---

## 10.2 Portal de Acceso

En la misma landing:

Botón **Ingresar** → pantalla con:

- Login único para ADMIN / PROFESOR / ALUMNO
- Login para SUPER_ADMIN

Flujo:

1. Usuario ingresa email + contraseña
2. Backend reconoce rol y club
3. Redirige a su panel correspondiente

---

## 10.3 Restricciones

- No hay subdominios por club en V1
- No existe autogestión de registro
- No existe acceso público a datos internos

---

# 11. Filosofía General del Negocio

El sistema debe reflejar **cómo trabaja un club real**:

- ADMIN controla personas + clases + dinero
- PROFESOR controla únicamente sus clases y asistencias
- ALUMNO solo ve lo suyo y reserva
- SUPER_ADMIN se limita a gestionar clientes (clubs)

La prioridad es:

1. Claridad
2. Simplicidad
3. Evitar automatizaciones innecesarias en V1
4. Dejar espacio para crecer en V2

---

# Fin del documento
