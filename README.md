# Distribuidora App

PWA **offline-first** para una distribuidora de alimentos: captación de clientes en campo,
toma de pedidos con carrito, carga del camión y guías de despacho. Funciona **100% sin
internet** (los datos se guardan en el teléfono) y sincroniza con **Google Sheets** cuando
hay conexión.

## Tecnología

React 18 + Vite + TypeScript · Tailwind CSS · Dexie.js (IndexedDB) · vite-plugin-pwa ·
jsPDF · lucide-react · bcryptjs (contraseñas cifradas). Sincronización mediante un
**Google Apps Script Web App** (sin servidor propio y sin exponer claves secretas en el
teléfono).

## Instalación y uso (desarrollo)

> Requisito: Node.js 20 o superior.

```bash
npm install     # instala todo
npm run dev     # abre la app en http://localhost:5173
```

Para entrar: **usuario y contraseña** (ver "Login y roles"). La app ya trae 8 clientes,
40 productos y 22 usuarios de ejemplo cargados.

## Login y roles

La app usa autenticación local (contra IndexedDB, funciona sin internet). Las contraseñas
se guardan **cifradas** con bcrypt. Hay 22 usuarios precargados con **4 roles**:

| Rol | Qué ve | Pantalla inicial |
|-----|--------|------------------|
| **admin** | Todo + Configuración y Gestión de Usuarios | Inicio (4 módulos) |
| **vendedor** | Clientes y Pedidos | Inicio (2 módulos) |
| **despachador** | Despacho (marcar entregas, PDF) | Despacho |
| **almacenista** | Carga del Camión (solo lectura, PDF) | Carga |

- **Entrada de administrador:** usuarios `admin1` y `admin2` (sus contraseñas se entregaron
  al dueño por separado, no se guardan en el código).
- Los usuarios **no-admin** deben **cambiar su contraseña temporal en el primer login**.
- **Seguridad:** 3 intentos fallidos → cuenta bloqueada 15 min; la sesión persiste al reabrir
  la app y expira tras 8 h de inactividad.
- **Gestión de usuarios** (solo admin): Inicio → engranaje → Gestión de Usuarios. Permite
  crear, editar y activar/desactivar usuarios (no se puede desactivar al último admin).
- Las contraseñas semilla se generan cifradas con `node scripts/gen-hashes.mjs`
  (que reescribe `src/db/seedUsuarios.ts`). El texto plano de las claves **no** vive en el código.

## Build para producción

```bash
npm run build   # genera la carpeta dist/
```

La carpeta `dist/` se puede subir tal cual a **Vercel**, **Netlify** o servirse como sitio
estático. Al ser una PWA, desde el teléfono se puede **instalar** ("Agregar a pantalla de
inicio") y queda como una app más.

## Publicar en la nube (Vercel) — recomendado para el equipo

Publicar la app da **una sola dirección https** que todos los vendedores usan desde cualquier
celular (no dependen de la IP del PC), y habilita el **GPS automático** (requiere https).

1. Entra a [vercel.com](https://vercel.com) → **"Log in with GitHub"** y autoriza.
2. **"Add New… → Project"** → importa el repo `distribuidora-app`.
3. Vercel detecta **Vite** solo: Build = `npm run build`, Output = `dist`. Pulsa **Deploy**.
4. Al terminar, tendrás una URL fija tipo `https://distribuidora-app.vercel.app` → esa es la que
   usan todos. Cada `git push` a `main` **re-despliega solo**.

El archivo `vercel.json` ya deja configurado el ruteo (para que `/clientes`, `/pedidos`, etc.
funcionen al recargar). La **URL del Web App de Google Sheets viene fija de fábrica**
(`src/config.ts`), así que ningún vendedor necesita configurarla; el admin puede cambiarla desde
Configuración si algún día cambia el despliegue del Apps Script.

## Conectar con Google Sheets (sincronización)

Sincronización **bidireccional** con regla simple: la **app siempre gana**. Al sincronizar,
la app **sube** clientes y pedidos (sobrescribe la fila en Sheets) y **baja** el catálogo/precios
y los **clientes nuevos** (no pisa los clientes que ya existen en la app; no baja pedidos
históricos). Para conectarla:

### 1. La hoja
El script usa la hoja por su **ID** (ya viene puesto en `SHEET_ID` dentro de `Code.gs`). No
necesitas crear las pestañas a mano: se crean solas (`Clientes`, `Pedidos`, `Catalogo`).

### 2. Pegar el script (proyecto independiente / standalone)
1. Abre tu proyecto de **Apps Script**.
2. Borra lo que haya y pega **todo** el contenido de [`apps-script/Code.gs`](apps-script/Code.gs).
   (Ya trae tu `SHEET_ID`; si algún día cambias de hoja, actualiza esa línea.)
3. (Opcional) Para más seguridad, cambia `var TOKEN = '';` por una clave tuya y pon la misma
   en la app.
4. Guarda (Ctrl+S).

### 3. Implementar como Web App
1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En "Tipo", elige **Aplicación web**.
3. Configura:
   - **Ejecutar como:** Yo (tu cuenta).
   - **Quién tiene acceso:** **Cualquier persona**.
4. **Implementar**. La primera vez Google te pedirá autorizar permisos: acéptalos.
5. Copia la **URL del Web App** (termina en `/exec`).

### 4. Pegar la URL en la app
1. En la app, pantalla **Inicio → ícono de engranaje (Configuración)**.
2. Pega la **URL del Web App** (y el **Token** si pusiste uno).
3. Toca **Probar conexión**. Si dice "Conexión exitosa", ya está.
4. Toca **Descargar catálogo y clientes** para traer datos existentes (opcional).

A partir de ahí, la app sincroniza sola (bidireccional) al volver el internet y cada 5 minutos:
sube lo pendiente y baja catálogo/precios y clientes nuevos. La insignia de la pantalla de
inicio muestra **⏳ N** registros pendientes o **Al día**; también puedes tocarla para
sincronizar manualmente.

## Cómo funciona offline

Todo se guarda primero en el teléfono (IndexedDB). Si no hay internet, los clientes y pedidos
quedan marcados como **pendientes** (🟡) y se suben automáticamente cuando vuelve la conexión.
Si la sincronización falla, **la app no se rompe**: simplemente reintenta más tarde.

## Estructura del proyecto

```
src/
├─ db/            # base de datos local (Dexie) + datos semilla
├─ components/    # piezas de UI reutilizables
├─ hooks/         # sesión, offline, sincronización
├─ services/      # Google Sheets, geolocalización
├─ pages/         # las pantallas (login, clientes, pedidos, carga, despacho, config)
├─ utils/         # formatos, validaciones, PDF, distancias, WhatsApp
└─ types/         # tipos de TypeScript (modelo de datos)
apps-script/Code.gs   # script para pegar en Google Sheets
scripts/gen-icons.mjs # genera los íconos de la PWA
```
