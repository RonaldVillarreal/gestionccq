# Colegio Cardenal Quintero — Sistema de Gestión

Webapp de gestión escolar (primaria y secundaria) construida con **Vite + React + Appwrite**.
Fase 1: frontend funcional. Fase 2 (futura): automatización con n8n.

Funciona de inmediato en **modo demo** (datos en el navegador) y pasa a usar
**Appwrite** en cuanto pegas tus credenciales. No hay que tocar el código.

---

## 1. Requisitos

- Node.js 18 o superior
- npm

## 2. Instalación

```bash
npm install
```

## 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre http://localhost:5173

### Cuentas de prueba

| Rol        | Usuario   | Clave        | Entra a       |
|------------|-----------|--------------|---------------|
| Admin      | `Ronald`  | `10101987`   | `/admin`      |
| Maestro    | `anavillarreal` | `maestro123` | `/maestro`    |
| Aprobador  | `crivas`  | `aprobar123` | `/aprobador`  |

> Sin credenciales de Appwrite, la app corre en **modo demo · local**:
> todo se guarda en el navegador (localStorage). Verás un distintivo
> "Modo demo · local" en el panel. Ideal para probar el FE.

---

## 4. Conectar Appwrite (opcional pero recomendado)

Appwrite Cloud tiene un plan gratuito y no pide tarjeta.

1. Crea una cuenta en https://cloud.appwrite.io y un **proyecto**.
   Anota la **Project ID** y el **API Endpoint** (Settings del proyecto;
   suele ser algo como `https://nyc.cloud.appwrite.io/v1`).
2. Crea una **API Key** (Overview → *Integrate* → API Keys, o el menú
   *API keys*) con permiso de **Databases** (scopes `databases.*`,
   `collections.*`, `attributes.*`, `indexes.*`, `documents.*`).
   Esta clave es secreta y solo la usa el script de provisión.
3. Renombra `.env.example` a `.env` y complétalo:

   ```env
   VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=tu-project-id
   VITE_APPWRITE_DB_ID=colegio
   APPWRITE_API_KEY=tu-api-key-secreta
   ```

4. Crea automáticamente la base de datos, las 7 colecciones, sus
   atributos, índices y los usuarios de prueba:

   ```bash
   npm run setup:appwrite
   ```

5. (Opcional) Revoca/borra la `APPWRITE_API_KEY` del `.env`: ya no hace
   falta para correr la app. Reinicia `npm run dev`. La app detecta las
   credenciales `VITE_*` y usa Appwrite automáticamente, sin tocar código.

---

## 5. Qué incluye

### Panel de Administración (`/admin`)
- **Resumen**: tarjetas de indicadores + gráficos (alumnos por nivel, personal por tipo).
- **Alumnos**: alta manual o por Excel. El campo *Representante* puebla la sección Representantes.
- **Maestros**: tarjetas con botón de **WhatsApp**; al crear un maestro se puede generar su usuario de login y su registro en Personal.
- **Representantes**: se llenan desde Alumnos (un representante → varios alumnos). También alta manual.
- **Personal**: docentes, administrativos, obreros… con filtro y WhatsApp.
- **Administrativo**: alumnos morosos + recordatorios (gancho listo para n8n) y gestión de usuarios/roles.

### Portal del Maestro (`/maestro`)
- Dashboard con tarjetas y gráficos, sidebar colapsable.
- **Planificación**: tarjetas de materias (con opción de crear nuevas), editor con calendario, colores, imágenes y un **asistente IA** opcional. Cada plan se envía a un **aprobador**.
- **Boletas** y **Calificaciones** (base lista; generación de PDF y guardado definitivo quedan para fase 2).

### Portal del Aprobador (`/aprobador`)
- Lista de planificaciones asignadas. Puede **aprobar** o **enviar correcciones**.
- Flujo de estados: `borrador → pendiente → correccion → pendiente → aprobada`.

### Extras
- **Modo oscuro** con persistencia.
- Logo del colegio (placeholder en `public/logo.svg`) visible en todas las páginas.
- Identidad visual: índigo profundo + oro, tipografías Fraunces + Inter.

---

## 6. Fase 2 — Automatización n8n (pendiente)

El gancho ya está preparado en
[`src/pages/Administrativo.jsx`](src/pages/Administrativo.jsx): la constante
`N8N_WEBHOOK` (vacía por ahora). Cuando tengas el flujo en n8n, pega la URL del
webhook ahí y el botón "Recordatorio" enviará los datos del alumno moroso a n8n.
Mientras esté vacía, el botón abre WhatsApp del representante como respaldo.

---

## 7. Estructura del proyecto

```
colegio/
├─ public/logo.svg            Logo (placeholder)
├─ appwrite/setup.mjs         Script que crea la base de datos en Appwrite
├─ supabase/schema.sql        Esquema de referencia (Postgres, ya no se usa)
├─ src/
│  ├─ main.jsx                Punto de entrada
│  ├─ App.jsx                 Rutas + guardias por rol
│  ├─ styles/global.css       Sistema de diseño (claro/oscuro)
│  ├─ context/                Tema y autenticación
│  ├─ lib/                    Capa de datos (local/Appwrite), Excel, hooks
│  ├─ data/seed.js            Datos de ejemplo (modo demo)
│  ├─ components/             Layouts y UI compartida
│  └─ pages/                  Páginas de admin, maestro y aprobador
└─ .env.example               Plantilla de credenciales
```

---

## 8. Nota de seguridad

Esta fase valida el login contra la colección `usuarios` (clave en texto
plano) para mantener el FE funcional sin backend de auth. Además, las
colecciones se crean con permisos abiertos (`Role.any()`), igual que la
*anon key* de Supabase: cualquiera con la Project ID puede leer/escribir.
**Antes de producción**, migra el login a **Appwrite Auth**, elimina la
columna `pass` y restringe los permisos por rol (a nivel de colección o
documento). El endpoint, la Project ID y la DB ID son públicos por diseño;
la `APPWRITE_API_KEY` es lo único secreto y solo la usa el script de setup.
