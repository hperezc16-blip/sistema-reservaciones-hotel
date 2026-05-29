# Guía de Configuración de Deploy

Instrucciones para activar el deploy automático del pipeline CI/CD.

## Arquitectura de Deploy

```
GitHub push → main
     │
     ├── Build & Typecheck ──┐
     ├── Lint ───────────────┼──► Deploy (si todos pasan)
     └── Tests & Coverage ───┘         │
                                        ├── API → Railway
                                        └── Frontend → Vercel
```

---

## Parte 1 — Configurar Railway (API Backend)

### 1.1 Crear cuenta y proyecto

1. Ir a [railway.app](https://railway.app) y registrarse con GitHub
2. Hacer clic en **New Project → Empty Project**
3. Nombrar el proyecto: `hotel-los-volcanes`

### 1.2 Agregar PostgreSQL

1. Dentro del proyecto, hacer clic en **New → Database → PostgreSQL**
2. Railway crea automáticamente la variable `DATABASE_URL`
3. Copiar el valor de `DATABASE_URL` desde la pestaña **Variables**

### 1.3 Crear el servicio de la API

1. Hacer clic en **New → GitHub Repo**
2. Seleccionar el repositorio `sistema-reservaciones-hotel`
3. Configurar el servicio:
   - **Root Directory:** `artifacts/api-server`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `node --enable-source-maps ./dist/index.mjs`

### 1.4 Agregar variables de entorno al servicio

En el servicio API → pestaña **Variables**:

```
DATABASE_URL=<copiado del servicio PostgreSQL>
JWT_SECRET=una_clave_secreta_larga_y_segura_aqui
NODE_ENV=production
PORT=3000
```

### 1.5 Obtener el token de Railway

1. Ir a [railway.app/account/tokens](https://railway.app/account/tokens)
2. Hacer clic en **Create Token**
3. Nombre: `github-actions-deploy`
4. Copiar el token generado → este es `RAILWAY_TOKEN`

---

## Parte 2 — Configurar Vercel (Frontend)

### 2.1 Crear cuenta y proyecto

1. Ir a [vercel.com](https://vercel.com) y registrarse con GitHub
2. Hacer clic en **Add New → Project**
3. Importar el repositorio `sistema-reservaciones-hotel`
4. Configurar:
   - **Root Directory:** `artifacts/hotel-app`
   - **Framework Preset:** Vite (se detecta automáticamente)
5. Agregar variable de entorno:
   - `VITE_API_URL` = URL pública del servicio Railway (ej. `https://hotel-api.up.railway.app`)
6. Hacer clic en **Deploy**

### 2.2 Obtener los IDs de Vercel

Con la CLI de Vercel instalada (`npm i -g vercel`):

```bash
# Autenticarse
vercel login

# Dentro de artifacts/hotel-app, linkear el proyecto
cd artifacts/hotel-app
vercel link

# Esto crea .vercel/project.json con orgId y projectId
cat .vercel/project.json
```

O desde el dashboard:
- **VERCEL_ORG_ID:** Vercel → Settings → General → Team ID
- **VERCEL_PROJECT_ID:** Proyecto → Settings → Project ID
- **VERCEL_TOKEN:** Account → Settings → Tokens → Create

---

## Parte 3 — Agregar Secrets a GitHub

1. Ir al repositorio en GitHub
2. **Settings → Secrets and variables → Actions → New repository secret**

Agregar los 4 secrets:

| Nombre | Valor |
|---|---|
| `RAILWAY_TOKEN` | Token obtenido en paso 1.5 |
| `VERCEL_TOKEN` | Token obtenido en paso 2.2 |
| `VERCEL_ORG_ID` | Team/Org ID de Vercel |
| `VERCEL_PROJECT_ID` | Project ID del proyecto hotel-app |

---

## Parte 4 — Activar el deploy

Una vez configurados los secrets:

```bash
# Hacer merge de develop a main activa el deploy automáticamente
git checkout main
git merge develop
git push origin main
```

El pipeline ejecutará: Build → Lint → Test → **Deploy** en ese orden.

---

## Verificación

Después del primer deploy exitoso:
- **API:** `https://<proyecto>.up.railway.app/api/healthz` → `{"status":"ok"}`
- **Frontend:** URL de Vercel (ej. `https://hotel-los-volcanes.vercel.app`)

Actualizar `VITE_API_URL` en Vercel con la URL final de Railway si es necesario.
