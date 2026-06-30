/**
 * Apps Script Web App para sincronizar la Distribuidora App con Google Sheets.
 *
 * CÓMO INSTALARLO (ver pasos detallados en el README.md de la app):
 *  1) Abre tu Google Sheet → menú Extensiones → Apps Script.
 *  2) Borra el contenido y pega TODO este archivo.
 *  3) (Opcional) Cambia TOKEN por una clave secreta tuya y ponla igual en la app.
 *  4) Implementar → Nueva implementación → tipo "Aplicación web".
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier persona
 *  5) Copia la URL del Web App y pégala en la pantalla Configuración de la app.
 *
 * La app envía un POST con JSON { action, token, payload }. No se exponen
 * claves secretas en el teléfono (solo la URL pública del Web App).
 */

var TOKEN = ''; // si lo dejas vacío, no se exige token

// Hojas y sus encabezados (se crean solas si no existen).
var HOJAS = {
  Clientes: ['id','razon_social','nombre_fantasia','rif','telefono','direccion','tipo_cliente','zona','estado','latitud','longitud','contacto_nombre','vendedor_asignado','ruta','tipo_pago','limite_credito','observaciones','fecha_registro'],
  Pedidos: ['id','fecha_pedido','fecha_entrega','vendedor','ruta','cliente_id','cliente_nombre','tipo_pago','estado_pedido','total_pedido','notas','entregado','obs_entrega','lineas_json'],
  Catalogo: ['codigo','descripcion','grupo','sub_grupo','precio_unitario','unidad'],
};

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (TOKEN && body.token !== TOKEN) return json({ ok: false, error: 'Token inválido' });

    switch (body.action) {
      case 'pushClientes': return json(upsert_('Clientes', body.payload || []));
      case 'pushPedidos':  return json(upsert_('Pedidos', body.payload || []));
      case 'getClientes':  return json({ ok: true, rows: leer_('Clientes') });
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(nombre);
  if (!sh) {
    sh = ss.insertSheet(nombre);
    sh.appendRow(HOJAS[nombre]);
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(HOJAS[nombre]);
  }
  return sh;
}

// Inserta o actualiza filas usando la columna "id"/"codigo" como llave.
function upsert_(nombre, objetos) {
  var sh = hoja_(nombre);
  var cols = HOJAS[nombre];
  var llave = cols[0]; // id (o codigo)
  var datos = sh.getDataRange().getValues();
  var indexLlave = {};
  for (var r = 1; r < datos.length; r++) indexLlave[String(datos[r][0])] = r + 1; // fila real

  var creados = 0, actualizados = 0;
  objetos.forEach(function (obj) {
    var fila = cols.map(function (c) { return obj[c] != null ? obj[c] : ''; });
    var clave = String(obj[llave]);
    if (indexLlave[clave]) {
      sh.getRange(indexLlave[clave], 1, 1, cols.length).setValues([fila]);
      actualizados++;
    } else {
      sh.appendRow(fila);
      creados++;
    }
  });
  return { ok: true, creados: creados, actualizados: actualizados };
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
