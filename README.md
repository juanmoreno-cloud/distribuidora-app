# Distribuidora App

PWA **offline-first** para una distribuidora de alimentos: captación de clientes en campo,
toma de pedidos con carrito, carga del camión y guías de despacho. Funciona **100% sin
internet** (los datos se guardan en el teléfono) y sincroniza con **Google Sheets** cuando
hay conexión.

## Tecnología

React 18 + Vite + TypeScript · Tailwind CSS · Dexie.js (IndexedDB) · vite-plugin-pwa ·
jsPDF · lucide-react. Sincronización mediante un **Google Apps Script Web App** (sin servidor
propio y sin exponer claves secretas en el teléfono).

## Instalación y uso (desarrollo)

> Requisito: Node.js 20 o superior.

```bash
npm install     # instala todo
npm run dev     # abre la app en http://localhost:5173
```

Para entrar: elige un vendedor y una ruta, y toca **INICIAR JORNADA**. La app ya trae
8 clientes y 40 productos de ejemplo cargados.

## Build para producción

```bash
npm run build   # genera la carpeta dist/
```

La carpeta `dist/` se puede subir tal cual a **Vercel**, **Netlify** o servirse como sitio
estático. Al ser una PWA, desde el teléfono se puede **instalar** ("Agregar a pantalla de
inicio") y queda como una app más.

## Conectar con Google Sheets (sincronización)

La app sube clientes y pedidos a tu Google Sheet, y puede bajar el catálogo de precios y los
clientes registrados por otros vendedores. Para conectarla:

### 1. Crear la hoja
Crea un Google Sheet (o usa el que ya tienes). No necesitas crear las pestañas a mano: el
script las crea solas (`Clientes`, `Pedidos`, `Catalogo`) con sus encabezados.

### 2. Pegar el script
1. En el Google Sheet: menú **Extensiones → Apps Script**.
2. Borra lo que haya y pega **todo** el contenido de [`apps-script/Code.gs`](apps-script/Code.gs).
3. (Opcional) Si quieres más seguridad, cambia la línea `var TOKEN = '';` por una clave tuya,
   por ejemplo `var TOKEN = 'mi-clave-secreta';`. Esa misma clave la pondrás en la app.
4. Guarda (ícono de disquete).

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

A partir de ahí, la app sincroniza sola: al volver el internet y cada 5 minutos. La insignia
de la pantalla de inicio muestra **⏳ N** registros pendientes o **Al día**. También puedes
tocarla para sincronizar manualmente.

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
