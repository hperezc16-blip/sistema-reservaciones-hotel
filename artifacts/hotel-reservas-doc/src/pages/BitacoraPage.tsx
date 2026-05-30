const ERRORES = [
  {
    id: "E-01",
    titulo: "Railway OOM — Exit 134 / SIGABRT",
    categoria: "Infraestructura",
    color: "bg-red-50 border-red-300 text-red-900",
    badge: "bg-red-100 text-red-700",
    sintoma: "El proceso de build moría silenciosamente en Railway con exit code 134 (SIGABRT = señal de aborto enviada por el sistema operativo cuando un proceso excede memoria).",
    causa: "El script build.mjs ejecutaba esbuild a través de la API de Node.js. Esto carga el runtime completo de Node.js + el módulo esbuild en memoria. En el ambiente Railway con límite de 512 MB de RAM en la capa gratuita, el proceso consumía 500–520 MB antes de compilar una sola línea de código.",
    solucion: "Reemplazar la invocación de la API de Node.js por el binario CLI de esbuild, que está compilado en Go y usa ~20–30 MB de RAM. El binario CLI no carga Node.js para compilar.",
    archivos: ["railway.toml → buildCommand", "nixpacks.toml → [phases.build].cmds"],
    antes: 'node ./build.mjs',
    despues: './node_modules/.bin/esbuild artifacts/api-server/src/index.ts --bundle --platform=node --target=node18 --format=esm --outfile=artifacts/api-server/dist/index.mjs --sourcemap --packages=external',
    leccion: "En ambientes con límite de RAM bajo (< 1 GB), siempre preferir binarios nativos sobre herramientas que requieran el runtime de Node.js para tareas de build.",
  },
  {
    id: "E-02",
    titulo: "drizzle-kit — No schema files found",
    categoria: "Base de Datos",
    color: "bg-orange-50 border-orange-300 text-orange-900",
    badge: "bg-orange-100 text-orange-700",
    sintoma: 'Al ejecutar las migraciones con drizzle-kit, el proceso fallaba con "No schema files found at ..." a pesar de que el archivo existía en la ruta especificada.',
    causa: 'drizzle.config.ts usaba path.join(__dirname, "src/schema/index.ts"). En proyectos con "type": "module" en package.json (ESM), la variable __dirname no existe — es una variable de CommonJS. El valor era undefined, haciendo que la ruta resultante fuera inválida.',
    solucion: 'Eliminar el uso de path.join() y __dirname, y en su lugar usar una ruta relativa directa como string: "./src/schema/index.ts". drizzle-kit la resuelve correctamente desde el directorio donde se ejecuta.',
    archivos: ["lib/db/drizzle.config.ts"],
    antes: 'schema: path.join(__dirname, "./src/schema/index.ts")',
    despues: 'schema: "./src/schema/index.ts"',
    leccion: "En proyectos ESM (type: module), __dirname y __filename no están disponibles. Usar import.meta.url + fileURLToPath() o rutas relativas directas.",
  },
  {
    id: "E-03",
    titulo: "Co-autoría no deseada en commits y PRs",
    categoria: "Control de Versiones",
    color: "bg-purple-50 border-purple-300 text-purple-900",
    badge: "bg-purple-100 text-purple-700",
    sintoma: 'Varios commits del historial de git contenían líneas "Co-Authored-By" con correos externos no deseados. Algunos PRs incluían texto automático en el footer. Requerimiento del proyecto: el repositorio debe reflejar únicamente la autoría del equipo de desarrollo.',
    causa: 'Configuración por defecto del entorno de desarrollo que agrega co-autoría automáticamente en commits y en el cuerpo de los PRs. No existía configuración de atribución en el proyecto al inicio.',
    solucion: '1) Reescribir el historial de git con filter-branch para eliminar las líneas Co-Authored-By no deseadas. 2) Limpiar el cuerpo de los PRs con gh pr edit. 3) Configurar el archivo de settings del entorno con atribución vacía para prevenir recurrencia.',
    archivos: ["settings.json (configuración del entorno)", "Historial de git reescrito con force push"],
    antes: '# Commits contenían:\nCo-Authored-By: herramienta-externa <noreply@ejemplo.com>',
    despues: '# Historial limpio — solo autores del equipo\n# settings.json con attribution: { "commit": "", "pr": "" }',
    leccion: "Configurar la atribución desde el inicio del proyecto. El historial de git es inmutable en la práctica — reescribirlo requiere force push y debe coordinarse con todos los colaboradores.",
  },
  {
    id: "E-04",
    titulo: "Seed script — Module resolution fallida",
    categoria: "Base de Datos",
    color: "bg-yellow-50 border-yellow-300 text-yellow-900",
    badge: "bg-yellow-100 text-yellow-700",
    sintoma: 'Al ejecutar node admin_seed.mjs para sembrar la base de datos, el proceso fallaba con "Cannot find module \'bcryptjs\'" aunque el paquete estaba instalado.',
    causa: 'pnpm utiliza un virtual store (node_modules/.pnpm/) con enlaces simbólicos estrictos. Al ejecutar node directamente desde fuera del workspace, el resolvedor de módulos de Node.js no encontraba los paquetes en la ruta esperada.',
    solucion: 'Ejecutar el script dentro del contexto del workspace con pnpm exec: "pnpm exec node admin_seed.mjs" desde el directorio lib/db. pnpm exec configura correctamente el PATH y las variables de entorno del workspace.',
    archivos: ["lib/db/admin_seed.mjs"],
    antes: 'node admin_seed.mjs  # falla: Cannot find module',
    despues: 'cd lib/db && pnpm exec node admin_seed.mjs  # funciona correctamente',
    leccion: "En monorepos pnpm, siempre ejecutar scripts que dependan de paquetes del workspace usando pnpm exec o pnpm run, nunca node directamente.",
  },
  {
    id: "E-05",
    titulo: "Vercel deployment desde rama incorrecta",
    categoria: "Despliegue",
    color: "bg-blue-50 border-blue-300 text-blue-900",
    badge: "bg-blue-100 text-blue-700",
    sintoma: 'El primer despliegue en Vercel fallaba en "Installing dependencies..." sin errores claros. El build no encontraba la configuración correcta del proyecto.',
    causa: 'Al conectar el repositorio en Vercel, la plataforma tomó el último commit de la rama main. En ese momento, main apuntaba al commit inicial 56c7ecc que NO tenía el archivo vercel.json — este archivo existía solo en develop. Sin vercel.json, Vercel no sabía el directorio de salida ni el comando de build.',
    solucion: 'Crear y mergear un Pull Request de develop → main ANTES de completar la configuración de Vercel, asegurando que main tuviera el vercel.json con buildCommand, outputDirectory y rewrites configurados.',
    archivos: ["vercel.json (root del repositorio)"],
    antes: '# main no tenía vercel.json — Vercel usó defaults incorrectos',
    despues: '// vercel.json\n{\n  "buildCommand": "pnpm --filter @workspace/hotel-app build",\n  "outputDirectory": "artifacts/hotel-app/dist/public",\n  "rewrites": [{ "source": "/api/:path*", "destination": "https://...railway.app/api/:path*" }]\n}',
    leccion: "Antes de conectar un repositorio a Vercel (o cualquier plataforma CI/CD), verificar que la rama de producción tenga todos los archivos de configuración necesarios.",
  },
  {
    id: "E-06",
    titulo: "Hook bloqueando merge de PR",
    categoria: "Configuración",
    color: "bg-slate-50 border-slate-300 text-slate-900",
    badge: "bg-slate-100 text-slate-700",
    sintoma: 'Al intentar mergear un Pull Request, un hook pre-commit/pre-push rechazaba la operación verificando si quedaban textos no deseados en el cuerpo del PR.',
    causa: 'El cuerpo del PR contenía texto generado automáticamente por el entorno de desarrollo en el footer. El hook de validación estaba configurado para detectar este patrón y bloquear el merge hasta que se limpiara.',
    solucion: 'Dos pasos: 1) Limpiar el cuerpo del PR con "gh pr edit --body ..." eliminando el footer automático. 2) Crear el archivo de configuración del entorno en la raíz del proyecto para que el hook reconociera la configuración de atribución vacía.',
    archivos: ["settings.json (configuración del entorno)", "PR #1 (cuerpo actualizado)"],
    antes: '# PR body terminaba con texto automático del entorno de desarrollo',
    despues: '# PR body limpio — solo descripción del equipo\n# settings.json presente con attribution vacía',
    leccion: "Los hooks de CI son la última línea de defensa. Si un hook bloquea algo, entender la causa raíz antes de intentar saltarlo.",
  },
  {
    id: "E-07",
    titulo: "Perfil no actualizaba el header de navegación",
    categoria: "Frontend",
    color: "bg-teal-50 border-teal-300 text-teal-900",
    badge: "bg-teal-100 text-teal-700",
    sintoma: 'Al guardar cambios en la página "Mi Perfil" (nombre o teléfono), el nombre del usuario en la barra de navegación seguía mostrando el nombre anterior hasta que el usuario cerraba sesión y volvía a entrar.',
    causa: 'El AuthContext almacenaba el objeto usuario en estado de React y en localStorage. La función saveProfile hacía el PATCH al API correctamente, pero no actualizaba el estado del contexto — solo recibía la respuesta del servidor y la descartaba.',
    solucion: 'Agregar función updateUser al AuthContext que actualiza tanto el estado de React (setUser) como el localStorage. Llamar updateUser(data) en Profile.tsx con la respuesta del API después de un guardado exitoso.',
    archivos: ["artifacts/hotel-app/src/contexts/AuthContext.tsx", "artifacts/hotel-app/src/pages/Profile.tsx"],
    antes: '// saveProfile solo llamaba toast, no actualizaba contexto\nawait axiosInstance.patch("/auth/profile", {...});\ntoast({ title: "Perfil actualizado" });',
    despues: '// saveProfile ahora usa la respuesta para actualizar el contexto\nconst { data } = await axiosInstance.patch("/auth/profile", {...});\nupdateUser(data); // actualiza React state + localStorage\ntoast({ title: "Perfil actualizado" });',
    leccion: "Cuando la API devuelve datos actualizados, siempre sincronizarlos con el estado local del cliente. No asumir que el estado ya está actualizado.",
  },
  {
    id: "E-08",
    titulo: "Reservaciones pendientes aparecían en historial",
    categoria: "Frontend",
    color: "bg-indigo-50 border-indigo-300 text-indigo-900",
    badge: "bg-indigo-100 text-indigo-700",
    sintoma: 'Una reservación recién creada (estado "pendiente") aparecía inmediatamente en la sección "Historial" en vez de "Reservaciones Activas", confundiendo al usuario sobre el estado de su reservación.',
    causa: 'El filtro en MyReservations.tsx solo consideraba el estado "confirmada" como activo. Las reservaciones en estado "pendiente" (recién creadas, antes de que el admin las confirme) no encajaban en ninguna categoría activa.',
    solucion: 'Ampliar el filtro para incluir "pendiente" en reservaciones activas: filter(r => r.estado === "confirmada" || r.estado === "pendiente"). Solo "cancelada" y "completada" van al historial.',
    archivos: ["artifacts/hotel-app/src/pages/MyReservations.tsx"],
    antes: 'const activas = reservations?.filter(r => r.estado === "confirmada") || [];',
    despues: 'const activas = reservations?.filter(r => r.estado === "confirmada" || r.estado === "pendiente") || [];',
    leccion: 'Modelar los estados del negocio explícitamente. "Pendiente" es una reservación activa desde la perspectiva del cliente aunque el admin no la haya procesado aún.',
  },
];

const FEATURES = [
  {
    area: "Autenticación",
    icon: "🔐",
    color: "bg-blue-50 border-blue-200",
    items: [
      "Registro de usuario con validación de email único y contraseña mínimo 8 caracteres",
      "Login con JWT firmado (HS256, expiración configurable)",
      "Middleware requireAuth y requireAdmin para proteger rutas",
      "Endpoint GET /auth/me para recuperar usuario autenticado",
      "PATCH /auth/profile — actualizar nombre, teléfono y cambio de contraseña",
      "POST /auth/forgot-password — genera token de recuperación de 1 hora",
      "POST /auth/reset-password — valida token y actualiza contraseña con bcrypt (salt 12)",
    ]
  },
  {
    area: "Habitaciones",
    icon: "🛏️",
    color: "bg-green-50 border-green-200",
    items: [
      "GET /rooms — listado con filtros: tipo, capacidad, precio mín/máx, disponible",
      "GET /rooms/:id — detalle completo incluyendo disponibilidad por fechas",
      "POST /rooms — crear habitación (solo admin): nombre, tipo, precio, capacidad, imagen, amenidades",
      "PATCH /rooms/:id — editar habitación con todos sus campos",
      "DELETE /rooms/:id — eliminación lógica (activo = false)",
      "Tipos soportados: sencilla, doble, suite, cabaña",
    ]
  },
  {
    area: "Reservaciones",
    icon: "📅",
    color: "bg-purple-50 border-purple-200",
    items: [
      "GET /reservations — listado del usuario autenticado (admin ve todas)",
      "POST /reservations — crear reservación con validación de conflictos de fecha",
      "PATCH /reservations/:id — actualizar estado (pendiente → confirmada → completada)",
      "DELETE /reservations/:id — cancelar (solo antes de fecha de entrada, si es futuro)",
      "POST /reservations/:id/pay — procesar pago: genera código de autorización y número de factura",
      "Cálculo automático de precio total según noches × precio por noche",
      "Validación: no se puede reservar una habitación ya ocupada en las mismas fechas",
    ]
  },
  {
    area: "Panel de Administración",
    icon: "⚙️",
    color: "bg-orange-50 border-orange-200",
    items: [
      "Dashboard con 6 KPIs en tiempo real: reservaciones totales, de hoy, habitaciones disponibles, ocupación %, ingresos del mes",
      "Tabla de reservaciones con filtros y cambio de estado",
      "Calendario visual de ocupación por habitación (30 días)",
      "CRUD completo de habitaciones con formulario en modal",
      "Check-in / Check-out del día con botones de acción",
      "Inventario de habitaciones con estados: disponible, ocupada, limpieza, mantenimiento — persistido en BD",
      "Reportes con gráficas recharts: ingresos mensuales (BarChart), reservas por mes, distribución por tipo (PieChart)",
      "Gestión de usuarios: listar, activar/desactivar cuentas (no se puede desactivar un admin)",
    ]
  },
  {
    area: "Portal del Cliente",
    icon: "👤",
    color: "bg-teal-50 border-teal-200",
    items: [
      "Mis Reservaciones: activas (pendiente + confirmada) e historial (completada, cancelada)",
      "Tracking visual por pasos: Reservado → Confirmado → Hospedaje → Completado",
      "Botón cancelar (solo disponible en reservaciones futuras confirmadas)",
      "Mi Perfil: editar nombre y teléfono, cambio de contraseña con validación",
      "Avatar inicial automático desde primera letra del nombre",
      "Actualización inmediata del nombre en la barra de navegación al guardar",
    ]
  },
  {
    area: "Simulación de Pago",
    icon: "💳",
    color: "bg-yellow-50 border-yellow-200",
    items: [
      "Proceso de reservación en 3 pasos: fechas → revisión → pago",
      "Selección de método de pago: Tarjeta de Crédito/Débito o Factura por Correo",
      "Animación de procesamiento con 4 pasos secuenciales (900ms c/u)",
      "Generación de código de autorización único (alphanúmerico, 8 caracteres)",
      "Número de factura formato FV-XXXXXXXX",
      "Pantalla de confirmación con todos los detalles: código, factura, fechas, precio",
    ]
  },
  {
    area: "Páginas Públicas",
    icon: "🌐",
    color: "bg-pink-50 border-pink-200",
    items: [
      "Home: hero con imágenes Unsplash, secciones de habitaciones destacadas, servicios, galería",
      "Habitaciones: grid con filtros en tiempo real por tipo, precio, capacidad",
      "Servicios: 8 servicios con horarios (Piscina, Restaurante, Tours, Transporte, Café, Gimnasio, WiFi, Seguridad)",
      "Galería: 15 fotos categorizadas con filtro y lightbox de navegación completo",
      "Contacto: formulario + 7 preguntas frecuentes con acordeón",
      "Recuperar contraseña: flujo completo forgot → reset con token de 1 hora",
    ]
  },
];

const STACK = [
  { layer: "Frontend", tech: "React 18 + TypeScript + Vite", color: "bg-blue-100 text-blue-800", justificacion: "Vite ofrece HMR instantáneo y build optimizado con Rollup. TypeScript garantiza type safety en toda la aplicación." },
  { layer: "Estilos", tech: "Tailwind CSS + shadcn/ui", color: "bg-cyan-100 text-cyan-800", justificacion: "Tailwind permite diseño utilitario sin CSS custom. shadcn/ui provee componentes accesibles (Radix UI) con estilos personalizables." },
  { layer: "Estado/Fetch", tech: "TanStack Query + Axios", color: "bg-purple-100 text-purple-800", justificacion: "TanStack Query maneja caché, loading states y revalidación automática. Axios provee interceptores para inyectar JWT en cada request." },
  { layer: "Routing", tech: "Wouter", color: "bg-violet-100 text-violet-800", justificacion: "Alternativa minimalista a React Router (~2KB vs ~50KB). API casi idéntica, suficiente para las necesidades del proyecto." },
  { layer: "Formularios", tech: "React Hook Form + Zod", color: "bg-indigo-100 text-indigo-800", justificacion: "RHF evita re-renders innecesarios. Zod provee validación type-safe compartida entre frontend y backend." },
  { layer: "Gráficas", tech: "Recharts", color: "bg-green-100 text-green-800", justificacion: "Librería basada en SVG, composable y altamente personalizable. Soporte nativo para BarChart, PieChart y LineChart responsivos." },
  { layer: "Backend", tech: "Express.js + TypeScript", color: "bg-yellow-100 text-yellow-800", justificacion: "Framework minimalista y maduro. TypeScript añade type safety a los handlers y middlewares." },
  { layer: "ORM", tech: "Drizzle ORM", color: "bg-orange-100 text-orange-800", justificacion: "ORM type-safe con SQL cercano al estándar. Genera consultas eficientes sin magic oculto. Integración nativa con drizzle-zod para validación." },
  { layer: "Base de Datos", tech: "PostgreSQL (Railway)", color: "bg-red-100 text-red-800", justificacion: "Base de datos relacional robusta. Railway provee PostgreSQL administrado con backups automáticos y variables de entorno directas." },
  { layer: "Auth", tech: "JWT + bcryptjs", color: "bg-rose-100 text-rose-800", justificacion: "JWT para autenticación stateless. bcrypt con salt rounds 12 para hashing seguro de contraseñas (resistente a ataques de fuerza bruta)." },
  { layer: "Monorepo", tech: "pnpm workspaces", color: "bg-slate-100 text-slate-800", justificacion: "pnpm usa hard links reduciendo el espacio en disco. Workspaces permiten compartir tipos y utilidades entre frontend, backend y librerías." },
  { layer: "Build API", tech: "esbuild (CLI nativo Go)", color: "bg-emerald-100 text-emerald-800", justificacion: "El binario Go de esbuild usa ~20MB de RAM vs 500MB+ de webpack/TSC. Crítico para buildear en Railway con límite de 512MB." },
  { layer: "Deploy Frontend", tech: "Vercel", color: "bg-neutral-100 text-neutral-800", justificacion: "Deploy automático desde GitHub. vercel.json configura proxy /api/* → Railway eliminando problemas de CORS en producción." },
  { layer: "Deploy Backend", tech: "Railway", color: "bg-zinc-100 text-zinc-800", justificacion: "PaaS con soporte nativo para PostgreSQL. nixpacks.toml permite control total del proceso de build. Variables de entorno seguras." },
];

const ENDPOINTS = [
  { method: "POST", path: "/api/auth/register", auth: "Público", desc: "Registrar nuevo usuario. Body: { nombre, email, password, telefono? }" },
  { method: "POST", path: "/api/auth/login", auth: "Público", desc: "Iniciar sesión. Devuelve JWT + objeto usuario" },
  { method: "GET",  path: "/api/auth/me", auth: "JWT", desc: "Obtener perfil del usuario autenticado" },
  { method: "PATCH", path: "/api/auth/profile", auth: "JWT", desc: "Actualizar nombre/teléfono o cambiar contraseña" },
  { method: "POST", path: "/api/auth/forgot-password", auth: "Público", desc: "Solicitar recuperación de contraseña por email" },
  { method: "POST", path: "/api/auth/reset-password", auth: "Público", desc: "Restablecer contraseña con token de recuperación" },
  { method: "GET",  path: "/api/rooms", auth: "Público", desc: "Listar habitaciones. Query: tipo, capacidad, precioMin, precioMax, disponible" },
  { method: "GET",  path: "/api/rooms/:id", auth: "Público", desc: "Obtener detalle de una habitación" },
  { method: "POST", path: "/api/rooms", auth: "Admin", desc: "Crear nueva habitación" },
  { method: "PATCH", path: "/api/rooms/:id", auth: "Admin", desc: "Actualizar datos de habitación" },
  { method: "DELETE", path: "/api/rooms/:id", auth: "Admin", desc: "Desactivar habitación (soft delete)" },
  { method: "GET",  path: "/api/reservations", auth: "JWT", desc: "Listar reservaciones del usuario (admin ve todas)" },
  { method: "POST", path: "/api/reservations", auth: "JWT", desc: "Crear reservación. Body: { habitacionId, fechaEntrada, fechaSalida, notas? }" },
  { method: "PATCH", path: "/api/reservations/:id", auth: "JWT", desc: "Actualizar estado de reservación" },
  { method: "DELETE", path: "/api/reservations/:id", auth: "JWT", desc: "Cancelar reservación" },
  { method: "POST", path: "/api/reservations/:id/pay", auth: "JWT", desc: "Procesar pago. Devuelve codigoAutorizacion + numeroFactura" },
  { method: "GET",  path: "/api/admin/stats", auth: "Admin", desc: "KPIs del dashboard: reservaciones, ocupación, ingresos del mes" },
  { method: "GET",  path: "/api/admin/calendar", auth: "Admin", desc: "Ocupación por habitación para el calendario (query: desde, hasta)" },
  { method: "GET",  path: "/api/admin/reports", auth: "Admin", desc: "Datos para gráficas: ingresos mensuales, distribución por tipo, stats de pago" },
  { method: "GET",  path: "/api/admin/users", auth: "Admin", desc: "Listar todos los usuarios" },
  { method: "PATCH", path: "/api/admin/users/:id", auth: "Admin", desc: "Activar/desactivar usuario. Body: { activo: boolean }" },
  { method: "GET",  path: "/api/admin/inventory", auth: "Admin", desc: "Estado de cada habitación: disponible, ocupada, en limpieza, mantenimiento" },
  { method: "PATCH", path: "/api/admin/rooms/:id/status", auth: "Admin", desc: "Cambiar estado manual de habitación. Body: { estadoManual: string | null }" },
  { method: "GET",  path: "/api/admin/checkinout", auth: "Admin", desc: "Llegadas y salidas programadas para hoy" },
  { method: "GET",  path: "/api/health", auth: "Público", desc: "Health check de la API. Devuelve { status: 'ok' }" },
];

const METHOD_COLOR: Record<string, string> = {
  GET:    "bg-green-100 text-green-800",
  POST:   "bg-blue-100 text-blue-800",
  PATCH:  "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
};

export default function BitacoraPage() {
  return (
    <div className="space-y-10">
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Bitácora Técnica</span>
          <span className="text-xs text-muted-foreground">Documentación de desarrollo completa</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Bitácora de Desarrollo</h1>
        <p className="mt-2 text-muted-foreground">Registro técnico detallado: errores encontrados, decisiones de arquitectura, funcionalidades implementadas y referencia completa de la API.</p>
      </div>

      {/* URLs de Producción */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-primary mb-4">URLs de Producción y Credenciales de Prueba</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { label: "Frontend (Vercel)", url: "https://sistema-reservaciones-hotel.vercel.app", color: "bg-black text-white" },
            { label: "Backend API (Railway)", url: "https://sistema-reservaciones-hotel-production.up.railway.app", color: "bg-purple-600 text-white" },
          ].map(item => (
            <div key={item.label} className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
              <code className={`text-xs px-2 py-1 rounded font-mono block ${item.color}`}>{item.url}</code>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { rol: "Administrador", email: "admin@hotel.com", password: "Admin123!", permisos: "Acceso completo al panel admin" },
            { rol: "Cliente Demo", email: "maria@example.com", password: "Admin123!", permisos: "Acceso al portal de cliente" },
          ].map(c => (
            <div key={c.rol} className="bg-muted/30 border rounded-lg p-4">
              <p className="text-xs font-bold uppercase tracking-wider mb-2">{c.rol}</p>
              <div className="space-y-1 text-sm font-mono">
                <p><span className="text-muted-foreground">Email: </span>{c.email}</p>
                <p><span className="text-muted-foreground">Pass:  </span>{c.password}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{c.permisos}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stack Tecnológico */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-primary mb-4">Stack Tecnológico y Justificación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STACK.map(s => (
            <div key={s.layer} className="border rounded-lg p-3 flex gap-3">
              <div className="shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${s.color}`}>{s.layer}</span>
              </div>
              <div>
                <p className="text-sm font-semibold">{s.tech}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.justificacion}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Errores y Soluciones */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-primary mb-2">Errores Críticos Encontrados y Soluciones</h2>
        <p className="text-sm text-muted-foreground mb-6">8 problemas documentados con causa raíz, solución aplicada y lección aprendida.</p>
        <div className="space-y-6">
          {ERRORES.map(e => (
            <div key={e.id} className={`border-2 rounded-xl p-5 ${e.color}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${e.badge}`}>{e.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${e.badge}`}>{e.categoria}</span>
                <h3 className="font-bold text-base">{e.titulo}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <p className="font-semibold text-xs uppercase tracking-wider mb-1 opacity-70">Síntoma</p>
                  <p>{e.sintoma}</p>
                </div>
                <div>
                  <p className="font-semibold text-xs uppercase tracking-wider mb-1 opacity-70">Causa Raíz</p>
                  <p>{e.causa}</p>
                </div>
                <div>
                  <p className="font-semibold text-xs uppercase tracking-wider mb-1 opacity-70">Solución Aplicada</p>
                  <p>{e.solucion}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Antes (código/configuración problemática)</p>
                  <pre className="bg-red-900/10 border border-red-300/40 rounded p-2 text-xs font-mono whitespace-pre-wrap overflow-x-auto">{e.antes}</pre>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Después (solución implementada)</p>
                  <pre className="bg-green-900/10 border border-green-300/40 rounded p-2 text-xs font-mono whitespace-pre-wrap overflow-x-auto">{e.despues}</pre>
                </div>
              </div>

              <div className="bg-white/40 rounded-lg p-3 text-xs">
                <span className="font-bold">Lección aprendida: </span>{e.leccion}
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {e.archivos.map(f => (
                  <code key={f} className="text-xs bg-white/50 px-2 py-0.5 rounded border">{f}</code>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Funcionalidades Implementadas */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-primary mb-4">Funcionalidades Implementadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map(f => (
            <div key={f.area} className={`border rounded-xl p-4 ${f.color}`}>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span>{f.icon}</span> {f.area}
              </h3>
              <ul className="space-y-1.5">
                {f.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5 shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Referencia de API */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-primary mb-4">Referencia Completa de Endpoints — API REST</h2>
        <p className="text-sm text-muted-foreground mb-4">Base URL: <code className="bg-muted px-2 py-0.5 rounded text-xs">https://sistema-reservaciones-hotel-production.up.railway.app</code></p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left">Método</th>
                <th className="px-3 py-2 text-left">Ruta</th>
                <th className="px-3 py-2 text-left">Auth</th>
                <th className="px-3 py-2 text-left">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ENDPOINTS.map((ep, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${METHOD_COLOR[ep.method]}`}>{ep.method}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{ep.path}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ep.auth === "Admin" ? "bg-red-100 text-red-700" : ep.auth === "JWT" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                      {ep.auth}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Estructura del Monorepo */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-primary mb-4">Estructura del Monorepo (pnpm workspaces)</h2>
        <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">{`HotelLosVolcanes_Completo/
├── artifacts/
│   ├── api-server/          # Backend Express.js + TypeScript
│   │   └── src/
│   │       ├── index.ts     # Entry point, middlewares globales
│   │       ├── routes/      # auth.ts, rooms.ts, reservations.ts, admin.ts
│   │       └── middlewares/ # auth.ts (JWT verify, requireAdmin)
│   ├── hotel-app/           # Frontend React + Vite
│   │   └── src/
│   │       ├── pages/       # Todas las páginas públicas y admin
│   │       ├── components/  # Layout, UI (shadcn), componentes reutilizables
│   │       ├── contexts/    # AuthContext (JWT + user state)
│   │       └── lib/         # axios-client (interceptor JWT)
│   └── hotel-reservas-doc/  # Documentación técnica (este sitio)
├── lib/
│   ├── db/                  # Drizzle ORM + PostgreSQL schema + migrations
│   │   ├── src/schema/      # users.ts, rooms.ts, reservations.ts
│   │   └── dist/            # Pre-compilado para uso en Railway
│   └── api-zod/             # Schemas Zod compartidos frontend ↔ backend
├── migrations/              # SQL migrations manuales
├── railway.toml             # Config build/deploy Railway
├── nixpacks.toml            # Fases de build en Railway
├── vercel.json              # Config deploy + proxy /api/* → Railway
└── pnpm-workspace.yaml      # Definición de workspaces`}</pre>
      </section>

      {/* Proceso de Despliegue */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-primary mb-4">Proceso de Despliegue (CI/CD)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">R</span>
              Railway — API + Base de Datos
            </h3>
            <ol className="space-y-2 text-sm">
              {[
                "Push a rama main activa el webhook de Railway",
                "nixpacks.toml: install → pnpm install --filter @workspace/api-server...",
                "nixpacks.toml: build → esbuild CLI compila TS a ESM (~15s, ~25MB RAM)",
                "Deploy: node --enable-source-maps ./artifacts/api-server/dist/index.mjs",
                "Variable DATABASE_URL inyectada automáticamente por Railway Postgres",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">V</span>
              Vercel — Frontend React
            </h3>
            <ol className="space-y-2 text-sm">
              {[
                "Push a rama main activa el pipeline de Vercel",
                "vercel.json: installCommand → pnpm install --frozen-lockfile",
                "vercel.json: buildCommand → pnpm --filter @workspace/hotel-app build",
                "outputDirectory: artifacts/hotel-app/dist/public (Vite output)",
                "rewrites: /api/:path* → Railway URL (elimina CORS en producción)",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">Migración de base de datos requerida en Railway</p>
          <p className="text-xs text-amber-700 mb-2">Para activar la columna estado_manual en la tabla rooms, ejecutar en el Postgres Console de Railway:</p>
          <pre className="bg-amber-900/10 rounded p-2 text-xs font-mono">ALTER TABLE rooms ADD COLUMN IF NOT EXISTS estado_manual VARCHAR(20);</pre>
        </div>
      </section>

      {/* Limitaciones conocidas */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-primary mb-4">Limitaciones Conocidas y Mejoras Futuras</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              tipo: "Limitación actual",
              color: "bg-red-50 border-red-200 text-red-900",
              items: [
                "Correo electrónico simulado — los tokens de recuperación y facturas no se envían realmente. En producción se requiere integrar Resend o SendGrid.",
                "Tokens de reset en memoria — se pierden al reiniciar el servidor Railway. En producción usar tabla DB con expiración.",
                "Plan gratuito Railway — el servidor se duerme tras 5 min de inactividad, causando latencia de ~2s en el primer request.",
              ]
            },
            {
              tipo: "Mejoras futuras",
              color: "bg-green-50 border-green-200 text-green-900",
              items: [
                "Integración con Resend/SendGrid para emails transaccionales reales (facturas, recuperación de contraseña, confirmaciones).",
                "Subida de imágenes a Cloudinary en vez de URL manual para las habitaciones.",
                "Sistema de calificaciones y reseñas de huéspedes por reservación completada.",
                "Notificaciones push en tiempo real con WebSockets para el panel admin.",
              ]
            },
          ].map(section => (
            <div key={section.tipo} className={`border rounded-xl p-4 ${section.color}`}>
              <p className="font-bold text-sm mb-3">{section.tipo}</p>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="shrink-0 mt-0.5">{section.tipo === "Limitación actual" ? "⚠️" : "→"}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
