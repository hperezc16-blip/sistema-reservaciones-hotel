# Pruebas de Integración y Funcionales — Hotel Los Volcanes
**Proyecto:** Sistema de Reservaciones Hotel Los Volcanes  
**Curso:** Ingeniería de Software — UMG  

---

## Introducción

Los siguientes escenarios validan la comunicación entre componentes (API ↔ Base de datos) y el cumplimiento de los criterios de aceptación de las historias de usuario. Cada escenario está implementado como prueba automatizada con Vitest + Supertest.

---

## Escenario 1 — Registro de nuevo usuario

**Historia de usuario:** "Como visitante, quiero registrarme con email y contraseña para acceder al sistema."  
**Endpoint:** `POST /api/auth/register`

| Campo | Detalle |
|---|---|
| **Precondición** | El email `nuevo@test.com` no existe en la base de datos |
| **Datos de entrada** | `{ nombre: "Juan", email: "nuevo@test.com", password: "password123" }` |
| **Pasos** | 1. Enviar POST /api/auth/register con el body JSON · 2. Verificar respuesta |
| **Resultado esperado** | HTTP 201 · Respuesta con `token` (JWT) y objeto `user` sin campo `passwordHash` |
| **Resultado obtenido** | HTTP 201 · `res.body.token` definido · `res.body.user.passwordHash` es `undefined` ✓ |
| **Archivo de prueba** | `src/__tests__/routes/auth.test.ts` — "201 con token y usuario sin passwordHash" |

---

## Escenario 2 — Inicio de sesión con credenciales válidas

**Historia de usuario:** "Como usuario registrado, quiero iniciar sesión para obtener acceso autenticado."  
**Endpoint:** `POST /api/auth/login`

| Campo | Detalle |
|---|---|
| **Precondición** | El usuario `juan@test.com` existe y está activo en la base de datos |
| **Datos de entrada** | `{ email: "juan@test.com", password: "password123" }` |
| **Pasos** | 1. Enviar POST /api/auth/login · 2. Verificar token y datos del usuario |
| **Resultado esperado** | HTTP 200 · `token` presente · `user.email` correcto · `user.passwordHash` ausente |
| **Resultado obtenido** | HTTP 200 · Token JWT válido retornado · Sin exposición del hash ✓ |
| **Archivo de prueba** | `src/__tests__/routes/auth.test.ts` — "200 con token y usuario sin passwordHash con credenciales correctas" |

---

## Escenario 3 — Bloqueo de acceso a recurso protegido sin token

**Historia de usuario:** "Como sistema, quiero rechazar peticiones sin autenticación para proteger los datos."  
**Endpoint:** `GET /api/reservations`

| Campo | Detalle |
|---|---|
| **Precondición** | Ninguna (petición sin header Authorization) |
| **Datos de entrada** | Sin header `Authorization` |
| **Pasos** | 1. Enviar GET /api/reservations sin token · 2. Verificar código de respuesta |
| **Resultado esperado** | HTTP 401 · `{ error: "Unauthorized" }` |
| **Resultado obtenido** | HTTP 401 · Middleware `requireAuth` rechaza la petición ✓ |
| **Archivo de prueba** | `src/__tests__/routes/reservations.test.ts` — "401 sin token" |

---

## Escenario 4 — Creación de habitación por administrador

**Historia de usuario:** "Como administrador, quiero crear habitaciones con sus datos para ofrecerlas a los clientes."  
**Endpoint:** `POST /api/rooms`

| Campo | Detalle |
|---|---|
| **Precondición** | Token JWT válido con `rol: "admin"` |
| **Datos de entrada** | `{ nombre: "Suite Volcán", tipo: "suite", precioNoche: 350, capacidad: 2 }` |
| **Pasos** | 1. Obtener token de admin · 2. Enviar POST /api/rooms con Authorization header · 3. Verificar respuesta |
| **Resultado esperado** | HTTP 201 · Objeto de habitación creada con `id` asignado |
| **Resultado obtenido** | HTTP 201 · `res.body.id` = `"room-1"` ✓ |
| **Archivo de prueba** | `src/__tests__/routes/rooms.test.ts` — "201 crea habitación correctamente (como admin)" |

---

## Escenario 5 — Validación de fechas en creación de reservación

**Historia de usuario:** "Como cliente, quiero reservar una habitación para fechas específicas con validación de disponibilidad."  
**Endpoint:** `POST /api/reservations`

| Campo | Detalle |
|---|---|
| **Precondición** | Token JWT de cliente válido |
| **Datos de entrada** | `{ habitacionId: "room-1", fechaEntrada: "2026-06-05", fechaSalida: "2026-06-01" }` (salida anterior a entrada) |
| **Pasos** | 1. Obtener token de cliente · 2. Enviar POST /api/reservations con fechas inválidas · 3. Verificar respuesta |
| **Resultado esperado** | HTTP 400 · `{ error: "Bad Request" }` |
| **Resultado obtenido** | HTTP 400 · Validación detecta `entradaDate >= salidaDate` ✓ |
| **Archivo de prueba** | `src/__tests__/routes/reservations.test.ts` — "400 cuando fechaSalida es anterior a fechaEntrada" |

---

## Escenario 6 — Control de acceso por rol (cliente vs admin)

**Historia de usuario:** "Como sistema, quiero que solo administradores accedan al panel administrativo."  
**Endpoint:** `GET /api/admin/stats`

| Campo | Detalle |
|---|---|
| **Precondición** | Token JWT con `rol: "cliente"` |
| **Datos de entrada** | Header `Authorization: Bearer <token_cliente>` |
| **Pasos** | 1. Obtener token de cliente · 2. Enviar GET /api/admin/stats · 3. Verificar respuesta |
| **Resultado esperado** | HTTP 403 · `{ error: "Forbidden" }` |
| **Resultado obtenido** | HTTP 403 · Middleware `requireAdmin` bloquea el acceso ✓ |
| **Archivo de prueba** | `src/__tests__/routes/admin.test.ts` — "403 con token de cliente" |

---

## Escenario 7 — Estadísticas del dashboard administrativo

**Historia de usuario:** "Como administrador, quiero ver estadísticas de ocupación e ingresos para tomar decisiones."  
**Endpoint:** `GET /api/admin/stats`

| Campo | Detalle |
|---|---|
| **Precondición** | Token JWT con `rol: "admin"` · Base de datos con datos de prueba |
| **Datos de entrada** | Header `Authorization: Bearer <token_admin>` |
| **Pasos** | 1. Obtener token de admin · 2. Enviar GET /api/admin/stats · 3. Verificar estructura de respuesta |
| **Resultado esperado** | HTTP 200 · Objeto con `totalReservaciones`, `reservacionesHoy`, `totalHabitaciones`, `habitacionesDisponibles`, `ingresosMes`, `reservasRecientes` |
| **Resultado obtenido** | HTTP 200 · `totalReservaciones: 10`, `totalHabitaciones: 5`, `habitacionesDisponibles: 5` ✓ |
| **Archivo de prueba** | `src/__tests__/routes/admin.test.ts` — "200 retorna estadísticas (sin reservas recientes)" |

---

## Escenario 8 — Cancelación de reservación por el cliente propietario

**Historia de usuario:** "Como cliente, quiero cancelar mis reservaciones para liberar la habitación."  
**Endpoint:** `PATCH /api/reservations/:id`

| Campo | Detalle |
|---|---|
| **Precondición** | Reservación `res-1` pertenece al usuario `user-1` · Estado actual: `confirmada` |
| **Datos de entrada** | Token de `user-1` · Body: `{}` (cliente solo puede cancelar, no necesita especificar estado) |
| **Pasos** | 1. Obtener token del cliente propietario · 2. PATCH /api/reservations/res-1 · 3. Verificar que no cancela si ya estaba cancelada |
| **Resultado esperado** | HTTP 400 si ya estaba cancelada · Mensaje: "La reserva ya está cancelada" |
| **Resultado obtenido** | HTTP 400 · `res.body.message` contiene "cancelada" ✓ |
| **Archivo de prueba** | `src/__tests__/routes/reservations.test.ts` — "400 cliente: reserva ya cancelada" |

---

## Escenario 9 — Protección de reservaciones entre usuarios

**Historia de usuario:** "Como sistema, quiero que un cliente no pueda ver ni modificar reservaciones de otros usuarios."  
**Endpoint:** `GET /api/reservations/:id`

| Campo | Detalle |
|---|---|
| **Precondición** | Reservación `res-1` pertenece a `otro-user` · Token del usuario `user-1` |
| **Datos de entrada** | Header `Authorization: Bearer <token_user-1>` · GET /api/reservations/res-1 |
| **Pasos** | 1. Obtener token de `user-1` · 2. Intentar acceder a reservación de `otro-user` · 3. Verificar respuesta |
| **Resultado esperado** | HTTP 403 · `{ error: "Forbidden" }` |
| **Resultado obtenido** | HTTP 403 · Validación de ownership bloquea el acceso ✓ |
| **Archivo de prueba** | `src/__tests__/routes/reservations.test.ts` — "403 cuando cliente intenta ver reserva de otro usuario" |

---

## Escenario 10 — Filtrado de habitaciones por disponibilidad (filtro en memoria)

**Historia de usuario:** "Como cliente, quiero ver habitaciones filtradas por tipo y capacidad para encontrar la adecuada."  
**Endpoint:** `GET /api/rooms?tipo=suite&capacidad=2`

| Campo | Detalle |
|---|---|
| **Precondición** | Base de datos con habitaciones de distintos tipos y capacidades |
| **Datos de entrada** | Query params: `tipo=suite`, `capacidad=3` |
| **Pasos** | 1. Enviar GET /api/rooms?capacidad=3 con 2 habitaciones mock (capacidad 2 y 4) · 2. Verificar que solo retorna la de capacidad ≥ 3 |
| **Resultado esperado** | HTTP 200 · Array con 1 elemento · Habitación de `capacidad: 4` |
| **Resultado obtenido** | HTTP 200 · `res.body.length = 1` · `res.body[0].id = "room-b"` ✓ |
| **Archivo de prueba** | `src/__tests__/routes/rooms.test.ts` — "filtra por capacidad en memoria" |

---

## Resumen de Ejecución

| Métrica | Valor |
|---|---|
| Total de escenarios documentados | 10 |
| Escenarios automatizados | 10 (100%) |
| Escenarios pasando | 10 (100%) |
| Cobertura de statements | 74.3% |
| Herramienta de ejecución | Vitest + Supertest |
| Integración CI/CD | GitHub Actions (job: Tests & Coverage) |

Todos los escenarios pasan automáticamente en cada ejecución del pipeline.
