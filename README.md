# Hotel Los Volcanes — Sistema de Reservaciones

Sistema de reservaciones hoteleras desarrollado como proyecto de Ingeniería de Software — Universidad Mariano Gálvez de Guatemala.

## Despliegue en Producción

| Servicio | URL |
|---|---|
| **Frontend** | https://hotel-los-volcanes-api-server.vercel.app |
| **API Backend** | https://sistema-reservaciones-hotel-production.up.railway.app |
| **Health Check** | https://sistema-reservaciones-hotel-production.up.railway.app/api/health |

### Credenciales de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@hotel.com | Admin123! |
| Cliente | maria@example.com | Admin123! |

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, TanStack Query |
| Backend / API | Node.js, Express 5, TypeScript |
| Base de datos | PostgreSQL + Drizzle ORM |
| Autenticación | JWT (jsonwebtoken) + bcryptjs |
| Pruebas | Vitest, Supertest |
| CI/CD | GitHub Actions |
| Monorepo | pnpm workspaces |

## Estructura del Repositorio

```
HotelLosVolcanes_Completo/
├── artifacts/
│   ├── api-server/          # Backend Express — REST API
│   ├── hotel-app/           # Frontend React — Portal cliente y admin
│   └── hotel-reservas-doc/  # Frontend React — Documentación/reportes
├── lib/
│   ├── db/                  # Schema Drizzle ORM + cliente de base de datos
│   ├── api-spec/            # Especificación OpenAPI
│   ├── api-zod/             # Schemas de validación Zod generados
│   └── api-client-react/    # Cliente React Query generado por Orval
├── .github/workflows/       # Pipeline CI/CD (GitHub Actions)
└── pnpm-workspace.yaml      # Configuración del monorepo
```

## Prerrequisitos

- **Node.js** 20 o superior
- **pnpm** 10 o superior (`npm install -g pnpm`)
- **PostgreSQL** 15 o superior (o una URL de base de datos compatible)

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/hperezc16-blip/sistema-reservaciones-hotel.git
cd sistema-reservaciones-hotel

# 2. Instalar dependencias del monorepo
pnpm install
```

## Configuración

### Variables de entorno — API Server

Crear el archivo `artifacts/api-server/.env`:

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/hotel_los_volcanes

# JWT — clave secreta (cambiar en producción)
JWT_SECRET=tu_clave_secreta_aqui

# Servidor
PORT=3000
NODE_ENV=development
```

### Variables de entorno — Frontend

Crear el archivo `artifacts/hotel-app/.env`:

```env
VITE_API_URL=http://localhost:3000
```

### Migración de base de datos

```bash
cd lib/db
pnpm db:push      # Aplica el schema a la base de datos
pnpm db:seed      # (Opcional) Carga datos iniciales
```

## Ejecución en Desarrollo

```bash
# Terminal 1 — Backend
cd artifacts/api-server
pnpm dev

# Terminal 2 — Frontend principal
cd artifacts/hotel-app
pnpm dev
```

El backend corre en `http://localhost:3000` y el frontend en `http://localhost:5173`.

## Scripts Disponibles (raíz del monorepo)

| Comando | Descripción |
|---|---|
| `pnpm build` | Compila todos los paquetes |
| `pnpm typecheck` | Verificación de tipos TypeScript |
| `pnpm lint` | Análisis estático con ESLint |
| `pnpm test` | Ejecuta todas las pruebas |
| `pnpm test:coverage` | Pruebas con reporte de cobertura |

## Pruebas

```bash
# Ejecutar todas las pruebas
pnpm test

# Generar reporte de cobertura
pnpm test:coverage
```

**Cobertura actual:** 74.3% statements · 78.1% branches · 67.7% funciones

Los reportes de cobertura se generan en `artifacts/api-server/coverage/`.

## Pipeline CI/CD

El pipeline de GitHub Actions se activa en cada `push` o `pull_request` a las ramas `main` y `develop`:

| Job | Trigger | Descripción |
|---|---|---|
| **Build & Typecheck** | push / PR | Compila el proyecto y verifica tipos TypeScript |
| **Lint** | push / PR | Análisis estático con ESLint |
| **Tests & Coverage** | push / PR | Ejecuta Vitest y genera reporte de cobertura |
| **Deploy** | push a `main` | Despliega API en Railway y frontend en Vercel (requiere secrets configurados) |

### Configuración de Deploy (secrets de GitHub)

Para activar el deploy automático, agregar estos secrets en **Settings → Secrets → Actions**:

| Secret | Plataforma | Cómo obtenerlo |
|---|---|---|
| `RAILWAY_TOKEN` | Railway | Dashboard → Account Settings → Tokens |
| `VERCEL_TOKEN` | Vercel | Account → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel | `vercel whoami --token <token>` |
| `VERCEL_PROJECT_ID` | Vercel | Proyecto → Settings → Project ID |

Ver [DEPLOY_SETUP.md](DEPLOY_SETUP.md) para la guía completa paso a paso.

## Funcionalidades del Sistema

### Portal Cliente
- Registro e inicio de sesión con JWT
- Catálogo de habitaciones con filtros (tipo, capacidad, disponibilidad por fechas)
- Creación y cancelación de reservaciones
- Historial de reservaciones del usuario

### Panel Administrador
- Dashboard con estadísticas (ocupación, ingresos del mes, reservaciones recientes)
- Gestión de habitaciones (crear, editar, desactivar)
- Gestión de reservaciones (cambiar estado, estado de pago)
- Calendario de ocupación (vista de 30 días)

## Ramas

| Rama | Propósito |
|---|---|
| `main` | Código en producción (estable) |
| `develop` | Integración de nuevas funcionalidades |

## Autores

- **Hazel Ruvi Pérez Cárcamo** — hperezc16@miumg.edu.gt
- Universidad Mariano Gálvez de Guatemala — Ingeniería de Software
##Contribuciones
.Hazel Ruvi Pérez Cárcamo -- Desarrollo principal
. Luis Reyes -- Módulo de calificaciones y reseñas
