/**
 * Apps Script Web App para sincronizar la Distribuidora App con Google Sheets.
 *
 * Este script es INDEPENDIENTE (standalone), por eso abre la hoja por su ID
 * (no usa getActiveSpreadsheet). El ID ya viene puesto abajo (SHEET_ID).
 *
 * CÓMO DESPLEGARLO (pasos detallados también en el README.md):
 *  1) Abre tu proyecto de Apps Script.
 *  2) Borra todo el contenido y pega TODO este archivo. Guarda (Ctrl+S).
 *  3) (Opcional) Cambia TOKEN por una clave secreta y pon la misma en la app.
 *  4) Implementar → Nueva implementación → tipo "Aplicación web":
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier persona
 *     Autoriza los permisos que pida la primera vez.
 *  5) Copia la URL del Web App (termina en /exec) y pégala en la app:
 *     Inicio → engranaje (Configuración) → URL del Web App.
 *
 * Regla de negocio: la APP siempre gana. Al subir (push) se sobrescribe la
 * fila en Sheets. Al bajar (pull) se traen catálogo/precios, clientes NUEVOS
 * y pedidos NUEVOS (recientes); lo que ya existe en la app NO se pisa desde
 * Sheets. Los registros marcados ELIMINADO/eliminado en Sheets se ocultan
 * también en los demás dispositivos.
 */

var SHEET_ID = '1GwYPKp0KaKZaLplHEV2U-wK6p2BSNHt4v2mBkDbDuIw';
// Debe ser IGUAL a TOKEN_DEFAULT en src/config.ts. Cierra el acceso abierto a
// la hoja: quien no envíe este token recibe "Token inválido".
var TOKEN = 'VUWiSDHX0PiDq0uDGbz7LnWw';

// Hojas y sus encabezados (se crean solas si no existen).
var HOJAS = {
  Clientes: ['id','razon_social','nombre_fantasia','rif','telefono','direccion','tipo_cliente','zona','estado','latitud','longitud','contacto_nombre','vendedor_asignado','ruta','tipo_pago','limite_credito','observaciones','fecha_registro','actualizado_en'],
  Pedidos: ['id','fecha_pedido','fecha_entrega','vendedor','ruta','cliente_id','cliente_nombre','tipo_pago','estado_pedido','total_pedido','notas','entregado','obs_entrega','lineas_json','actualizado_en'],
  Catalogo: ['codigo','descripcion','grupo','sub_grupo','precio_unitario','unidad','stock'],
};

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (TOKEN && body.token !== TOKEN) return json({ ok: false, error: 'Token inválido' });

    switch (body.action) {
      case 'pushClientes': return json(upsert_('Clientes', body.payload || []));
      case 'pushPedidos':  return json(upsert_('Pedidos', body.payload || []));
      case 'pushCatalogo': return json(upsert_('Catalogo', body.payload || []));
      case 'getClientes':  return json({ ok: true, rows: leer_('Clientes') });
      case 'getPedidos':   return json({ ok: true, rows: leer_('Pedidos') });
      case 'getCatalogo':  return json({ ok: true, rows: leer_('Catalogo') });
      case 'ping':         return json({ ok: true, pong: true });
      default:             return json({ ok: false, error: 'Acción desconocida: ' + body.action });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Permite probar la URL desde el navegador.
function doGet() {
  return json({ ok: true, mensaje: 'Web App de Distribuidora App activo.' });
}

// ---- Helpers ----
function hoja_(nombre) {
  var ss = SpreadsheetApp.openById(SHEET_ID); // script standalone: abre por ID
  var sh = ss.getSheetByName(nombre);
  if (!sh) {
    sh = ss.insertSheet(nombre);
    sh.appendRow(HOJAS[nombre]);
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(HOJAS[nombre]);
  } else {
    // Si la hoja existe con menos columnas (versión anterior), agrega los
    // encabezados que falten (ej: la columna "stock" del inventario).
    var cols = HOJAS[nombre];
    var actuales = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    for (var i = 0; i < cols.length; i++) {
      if (actuales.indexOf(cols[i]) === -1) {
        sh.getRange(1, actuales.length + 1).setValue(cols[i]);
        actuales.push(cols[i]);
      }
    }
  }
  return sh;
}

// Inserta o actualiza filas usando la columna "id"/"codigo" como llave.
// (La app siempre gana al subir, EXCEPTO si la fila ya en Sheets tiene un
// actualizado_en más reciente: eso evita que un equipo con datos viejos pise
// la edición más reciente de otro equipo.)
function upsert_(nombre, objetos) {
  var sh = hoja_(nombre);
  var cols = HOJAS[nombre];
  var llave = cols[0]; // id (o codigo)
  var indexActualizadoEn = cols.indexOf('actualizado_en');
  var datos = sh.getDataRange().getValues();
  var indexLlave = {};
  for (var r = 1; r < datos.length; r++) indexLlave[String(datos[r][0])] = r + 1; // fila real

  var creados = 0, actualizados = 0, rechazados = 0;
  objetos.forEach(function (obj) {
    var fila = cols.map(function (c) { return obj[c] != null ? obj[c] : ''; });
    var clave = String(obj[llave]);
    if (indexLlave[clave]) {
      var filaExistente = datos[indexLlave[clave] - 1];
      var actualizadoEnEntrante = indexActualizadoEn > -1 ? String(obj['actualizado_en'] || '') : '';
      var actualizadoEnActual = indexActualizadoEn > -1 ? String(filaExistente[indexActualizadoEn] || '') : '';
      // Comparación de string sirve para fechas ISO 8601 (orden lexicográfico == cronológico).
      if (actualizadoEnEntrante && actualizadoEnActual && actualizadoEnEntrante <= actualizadoEnActual) {
        rechazados++;
        return;
      }
      sh.getRange(indexLlave[clave], 1, 1, cols.length).setValues([fila]);
      actualizados++;
    } else {
      sh.appendRow(fila);
      creados++;
    }
  });
  return { ok: true, creados: creados, actualizados: actualizados, rechazados: rechazados };
}

function leer_(nombre) {
  var sh = hoja_(nombre);
  var datos = sh.getDataRange().getValues();
  if (datos.length < 2) return [];
  var cols = datos[0];
  return datos.slice(1).map(function (fila) {
    var obj = {};
    cols.forEach(function (c, i) { obj[c] = fila[i]; });
    return obj;
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
