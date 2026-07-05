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

// Token del Apps Script: eleva la barrera de "cualquiera con la URL" a "alguien
// que además conoce este token". DEBE ser IGUAL a la variable TOKEN en Code.gs.
// Si lo cambias aquí, cámbialo también en el script y redespliega.
export const TOKEN_DEFAULT = 'VUWiSDHX0PiDq0uDGbz7LnWw';

// Versión visible de la app (se muestra en el login y en Configuración).
// Súbela en cada entrega: sirve para saber qué versión corre cada teléfono.
export const APP_VERSION = 'v10';
