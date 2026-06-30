import type { Producto } from '../types';

// ====================================================================
// Catalogo exacto de 40 productos (definido a mano para separar bien
// grupo y sub-grupo, que en el texto original venian pegados).
// unidad: UNID = unidad, CJA = caja, KG = kilo. Los productos con
// "*KG" se venden por kilo; "*MAYOR" suelen ser caja/bulto.
// ====================================================================
export const CATALOGO_SEED: Producto[] = [
  { codigo: 54, descripcion: 'ACEITE MI COCINERO 750ML *MAYOR', grupo: 'VIVERES', sub_grupo: 'ACEITES', precio_unitario: 32.99, unidad: 'CJA' },
  { codigo: 209, descripcion: 'ACEITE MI COCINERO 900ML', grupo: 'VIVERES', sub_grupo: 'ACEITES', precio_unitario: 3.89, unidad: 'UNID' },
  { codigo: 53, descripcion: 'ACEITE MI COCINERO 900ML *MAYOR', grupo: 'VIVERES', sub_grupo: 'ACEITES', precio_unitario: 65.99, unidad: 'CJA' },
  { codigo: 1258, descripcion: 'ALAS DE POLLO *KG', grupo: 'CARNICERIA', sub_grupo: 'POLLO', precio_unitario: 4.59, unidad: 'KG' },
  { codigo: 1008, descripcion: 'ALAS DE POLLO *MAYOR', grupo: 'CARNICERIA', sub_grupo: 'POLLO', precio_unitario: 4.59, unidad: 'KG' },
  { codigo: 47, descripcion: 'ARROZ PREMIUM SANTONI 900G *MAYOR', grupo: 'VIVERES', sub_grupo: 'CEREALES Y HARINAS', precio_unitario: 29.99, unidad: 'CJA' },
  { codigo: 192, descripcion: 'ARROZ PREMIUM SANTONI 900G', grupo: 'VIVERES', sub_grupo: 'CEREALES Y HARINAS', precio_unitario: 1.25, unidad: 'UNID' },
  { codigo: 243, descripcion: 'AZUCAR KONFIT 1KG', grupo: 'VIVERES', sub_grupo: 'AZUCARES', precio_unitario: 1.39, unidad: 'UNID' },
  { codigo: 63, descripcion: 'AZUCAR KONFIT 1KG *MAYOR', grupo: 'VIVERES', sub_grupo: 'AZUCARES', precio_unitario: 28.99, unidad: 'CJA' },
  { codigo: 62, descripcion: 'AZUCAR MONTALBAN 1KG *MAYOR', grupo: 'VIVERES', sub_grupo: 'AZUCARES', precio_unitario: 29.99, unidad: 'CJA' },
  { codigo: 40, descripcion: 'CAJA DE HUEVOS TIPO A 360 UDS', grupo: 'VIVERES', sub_grupo: 'HUEVOS', precio_unitario: 71.99, unidad: 'CJA' },
  { codigo: 41, descripcion: 'CAJA DE HUEVOS TIPO AA 360 UDS', grupo: 'VIVERES', sub_grupo: 'HUEVOS', precio_unitario: 74.99, unidad: 'CJA' },
  { codigo: 1010, descripcion: 'CARNE DE PRIMERA *MAYOR', grupo: 'CARNICERIA', sub_grupo: 'RES', precio_unitario: 9.49, unidad: 'KG' },
  { codigo: 1271, descripcion: 'CARNE MOLIDA *KG', grupo: 'CARNICERIA', sub_grupo: 'RES', precio_unitario: 7.99, unidad: 'KG' },
  { codigo: 1278, descripcion: 'CHULETA AHUMADA *KG', grupo: 'CARNICERIA', sub_grupo: 'CERDO', precio_unitario: 6.89, unidad: 'KG' },
  { codigo: 1277, descripcion: 'CHULETA DE CERDO *KG', grupo: 'CARNICERIA', sub_grupo: 'CERDO', precio_unitario: 7.99, unidad: 'KG' },
  { codigo: 1273, descripcion: 'COSTILLA DE RES *KG', grupo: 'CARNICERIA', sub_grupo: 'RES', precio_unitario: 6.49, unidad: 'KG' },
  { codigo: 1013, descripcion: 'COSTILLA DE RES *MAYOR', grupo: 'CARNICERIA', sub_grupo: 'RES', precio_unitario: 5.99, unidad: 'KG' },
  { codigo: 44, descripcion: 'HARINA DE TRIGO AVEIRO 45KG', grupo: 'VIVERES', sub_grupo: 'HARINAS', precio_unitario: 38.99, unidad: 'SACO' },
  { codigo: 43, descripcion: 'HARINA MAIZ BL SANTONI 900G *MAYOR', grupo: 'VIVERES', sub_grupo: 'HARINAS', precio_unitario: 20.25, unidad: 'CJA' },
  { codigo: 187, descripcion: 'HARINA MAIZ BLANCO SANTONI 900G', grupo: 'VIVERES', sub_grupo: 'HARINAS', precio_unitario: 0.99, unidad: 'UNID' },
  { codigo: 424, descripcion: 'HARINA TRIGO PREMIUM AVEIRO 1KG', grupo: 'VIVERES', sub_grupo: 'HARINAS', precio_unitario: 1.39, unidad: 'UNID' },
  { codigo: 220, descripcion: 'MAYONESA MI COCINERO 445G', grupo: 'VIVERES', sub_grupo: 'SALSAS', precio_unitario: 3.99, unidad: 'UNID' },
  { codigo: 56, descripcion: 'MAYONESA MI COCINERO 445G *MAYOR', grupo: 'VIVERES', sub_grupo: 'SALSAS', precio_unitario: 46.19, unidad: 'CJA' },
  { codigo: 184, descripcion: 'MEDIO CARTON DE HUEVOS', grupo: 'VIVERES', sub_grupo: 'HUEVOS', precio_unitario: 2.99, unidad: 'UNID' },
  { codigo: 1256, descripcion: 'MILANESA DE POLLO *KG', grupo: 'CARNICERIA', sub_grupo: 'POLLO', precio_unitario: 5.99, unidad: 'KG' },
  { codigo: 1006, descripcion: 'MILANESA DE POLLO *MAYOR', grupo: 'CARNICERIA', sub_grupo: 'POLLO', precio_unitario: 5.49, unidad: 'KG' },
  { codigo: 19, descripcion: 'MINI MORTADELA DE POLLO *MAYOR', grupo: 'CHARCUTERIA', sub_grupo: 'EMBUTIDOS', precio_unitario: 2.99, unidad: 'UNID' },
  { codigo: 21, descripcion: 'MORTADELA EBENEZER 900 *MAYOR', grupo: 'CHARCUTERIA', sub_grupo: 'EMBUTIDOS', precio_unitario: 31.99, unidad: 'CJA' },
  { codigo: 142, descripcion: 'MORTADELA EBENEZER 900G', grupo: 'CHARCUTERIA', sub_grupo: 'EMBUTIDOS', precio_unitario: 2.79, unidad: 'UNID' },
  { codigo: 1255, descripcion: 'MUSLO DE POLLO *KG', grupo: 'CARNICERIA', sub_grupo: 'POLLO', precio_unitario: 3.49, unidad: 'KG' },
  { codigo: 1005, descripcion: 'MUSLO DE POLLO *MAYOR', grupo: 'CARNICERIA', sub_grupo: 'POLLO', precio_unitario: 2.79, unidad: 'KG' },
  { codigo: 36, descripcion: 'PAPAS PARMAK FEAST 1KG *MAYOR', grupo: 'CONGELADOS', sub_grupo: 'PAPAS', precio_unitario: 34.99, unidad: 'CJA' },
  { codigo: 1257, descripcion: 'PECHUGA DE POLLO *KG', grupo: 'CARNICERIA', sub_grupo: 'POLLO', precio_unitario: 4.49, unidad: 'KG' },
  { codigo: 1007, descripcion: 'PECHUGA DE POLLO *MAYOR', grupo: 'CARNICERIA', sub_grupo: 'POLLO', precio_unitario: 4.19, unidad: 'KG' },
  { codigo: 1002, descripcion: 'POLLO EBENEZER *MAYOR', grupo: 'CARNICERIA', sub_grupo: 'POLLO', precio_unitario: 3.19, unidad: 'KG' },
  { codigo: 1253, descripcion: 'POLLO MIS POLLITOS *KG', grupo: 'CARNICERIA', sub_grupo: 'POLLO', precio_unitario: 2.89, unidad: 'KG' },
  { codigo: 1, descripcion: 'POLLO RANCHEROS *MAYOR', grupo: 'CARNICERIA', sub_grupo: 'POLLO', precio_unitario: 3.19, unidad: 'KG' },
  { codigo: 1770, descripcion: 'QUESO BLANCO LLANERO *KG', grupo: 'CHARCUTERIA', sub_grupo: 'QUESOS', precio_unitario: 5.15, unidad: 'KG' },
  { codigo: 114, descripcion: 'SOLOMO DE CUERITO *KG', grupo: 'CARNICERIA', sub_grupo: 'CERDO', precio_unitario: 11.49, unidad: 'KG' },
];
