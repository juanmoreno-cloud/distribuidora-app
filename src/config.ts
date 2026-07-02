// ====================================================================
// Configuración "de fábrica" que viaja dentro de la app.
// La URL del Web App de Google Sheets se deja aquí para que CUALQUIER
// dispositivo que abra la app ya la tenga puesta, sin configurar nada.
// El admin puede sobrescribirla por-equipo desde la pantalla Configuración.
// Si algún día cambias el despliegue de Apps Script, actualiza esta URL
// y vuelve a publicar la app.
// ====================================================================
export const WEBAPP_URL_DEFAULT =
  'https://script.google.com/macros/s/AKfycby5MxOKXyo43Snmu_ESLI-8HxdYJZLkyky1s1cb4LdXZtPfcwhDlRJyMBgQA5EQ9SNh/exec';

// Token del Apps Script (vacío si no configuraste uno en el script).
export const TOKEN_DEFAULT = '';

// Versión visible de la app (se muestra en el login y en Configuración).
// Súbela en cada entrega: sirve para saber qué versión corre cada teléfono.
export const APP_VERSION = 'v7';
