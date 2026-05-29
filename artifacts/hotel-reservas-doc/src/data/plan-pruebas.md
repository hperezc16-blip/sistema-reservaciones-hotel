# Plan de Pruebas — Hotel Los Volcanes
**Proyecto:** Sistema de Reservaciones Hotel Los Volcanes  
**Curso:** Ingeniería de Software — UMG  
**Versión:** 1.0  

---

## 1. Objetivo

Definir la estrategia de pruebas aplicada al backend del sistema para garantizar la calidad funcional, la seguridad de los endpoints y la correcta integración entre componentes.

---

## 2. Alcance

Las pruebas cubren los módulos principales del backend (`artifacts/api-server`):

| Módulo | Archivo |
|---|---|
| Middleware de autenticación | `src/middlewares/auth.ts` |
| Rutas de autenticación | `src/routes/auth.ts` |
| Rutas de habitaciones | `src/routes/rooms.ts` |
| Rutas de reservaciones | `src/routes/reservations.ts` |
| Rutas de administración | `src/routes/admin.ts` |
| Health check | `src/routes/health.ts` |

---

## 3. Tipos de Prueba Aplicados

### 3.1 Pruebas Unitarias
Verifican el comportamiento de funciones y middlewares de forma aislada, sin dependencias externas reales.

**Herramienta:** Vitest 4.x  
**Archivos:**
- `src/__tests__/middlewares/auth.test.ts` — 9 tests
- `src/__tests__/routes/auth.test.ts` — 12 tests
- `src/__tests__/routes/rooms.test.ts` — 13 tests
- `src/__tests__/routes/reservations.test.ts` — 17 tests
- `src/__tests__/routes/admin.test.ts` — 7 tests
- `src/__tests__/routes/health.test.ts` — 1 test

**Total:** 59 pruebas unitarias

### 3.2 Pruebas de Integración (HTTP)
Verifican el comportamiento completo de los endpoints HTTP simulando peticiones reales con base de datos mockeada.

**Herramienta:** Supertest 7.x + Vitest  
**Patrón:** Mocks thenables para las cadenas de consulta de Drizzle ORM

### 3.3 Pruebas de Cobertura
Análisis automático del porcentaje de código cubierto por las pruebas.

**Herramienta:** Vitest v8 coverage provider  
**Reporte generado en:** `artifacts/api-server/coverage/`

---

## 4. Herramientas Utilizadas

| Herramienta | Versión | Propósito |
|---|---|---|
| Vitest | 4.x | Framework de pruebas unitarias e integración |
| Supertest | 7.x | Simulación de peticiones HTTP en pruebas |
| @vitest/coverage-v8 | 4.x | Reporte de cobertura de código |
| bcryptjs (mock) | — | Mock del hashing de contraseñas |
| Drizzle ORM (mock) | — | Mock del acceso a base de datos |

---

## 5. Resultados de Cobertura

| Métrica | Resultado | Umbral requerido |
|---|---|---|
| Statements | **74.3%** | ≥ 60% |
| Branches | **78.1%** | ≥ 60% |
| Functions | **67.7%** | ≥ 60% |
| Lines | **74.9%** | ≥ 60% |

Todos los umbrales mínimos requeridos por la rúbrica son superados.

---

## 6. Criterios de Entrada

| Criterio | Descripción |
|---|---|
| Código compilable | El proyecto debe compilar sin errores de TypeScript (`pnpm typecheck`) |
| Dependencias instaladas | `pnpm install` ejecutado exitosamente |
| Ambiente de pruebas | `NODE_ENV=test`, sin base de datos real (mocks) |

---

## 7. Criterios de Salida

| Criterio | Descripción |
|---|---|
| Todas las pruebas pasan | 0 pruebas fallidas (`Tests: X passed`) |
| Cobertura mínima | ≥ 60% en statements, branches y functions |
| Reporte generado | Archivo JSON y HTML en `coverage/` |
| Sin errores de tipo | `tsc --noEmit` sin errores |

---

## 8. Estrategia de Mocks

Dado que el backend usa Drizzle ORM con cadenas de consulta fluidas (builder pattern), se implementó una estrategia de **mocks thenables**:

```typescript
// Cada cadena mock implementa el protocolo Promise (método then)
// para soportar tanto await directo como encadenamiento .limit()/.returning()
const mockSelectChain: any = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then(resolve, reject) {
    return Promise.resolve(mockSelectResult).then(resolve, reject);
  },
};
```

Para rutas con múltiples SELECT (admin/stats con 6 consultas), se usó `mockReturnValueOnce` para controlar el resultado de cada llamada individual.

---

## 9. Defectos Encontrados y Resolución

| ID | Descripción | Severidad | Resolución |
|---|---|---|---|
| BUG-01 | `ReferenceError` en vi.mock por hoisting de variables | Alta | Renombrar variables con prefijo `mock` y usar `vi.fn()` directamente en la factory |
| BUG-02 | `form.reset()` no encontrado en admin/Rooms.tsx | Media | Corregir desestructuración de `useForm` para usar `reset()` directamente |
| BUG-03 | `TS2554`: hooks generados por Orval no aceptan `axiosInstance` como tercer argumento | Alta | Eliminar el argumento `axiosInstance` de todas las llamadas a hooks en 9 páginas |
| BUG-04 | Pipeline CI fallaba: `build.mjs` no existía | Alta | Crear `artifacts/api-server/build.mjs` con configuración esbuild |
| BUG-05 | `vite.config.ts` faltante en hotel-reservas-doc | Media | Crear archivo de configuración Vite estándar |
| BUG-06 | Dependencias de Replit en `pnpm-workspace.yaml` | Media | Eliminar todas las referencias a `@replit/*` y reemplazar con config estándar |

---

## 10. Ejecución en Pipeline CI/CD

Las pruebas se ejecutan automáticamente en cada `push` y `pull_request` al repositorio:

```yaml
# .github/workflows/ci.yml
- name: Tests con cobertura
  run: pnpm test:coverage
```

El pipeline sube el reporte de cobertura como artefacto de la ejecución (GitHub Actions Artifacts).
