// Uso único (desarrollo): cifra las 22 claves semilla con bcrypt y genera
// src/db/seedUsuarios.ts con SOLO los hashes (nunca las claves en texto).
//   node scripts/gen-hashes.mjs
import bcrypt from 'bcryptjs';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const R1 = 'Ruta 1 (Zona Oeste/Norte)';
const R2 = 'Ruta 2 (Zona Centro/Sur)';
const R3 = 'Ruta 3 (Zona Este)';

// [username, nombre_completo, rol, ruta_asignada, clave, debe_cambiar_clave]
const USUARIOS = [
  ['admin1', 'Administrador Principal', 'admin', '', 'Mercurio8B!A1', false],
  ['admin2', 'Administrador Secundario', 'admin', '', 'Neptuno8B!A2', false],
  ['VendedorR1_1', 'Vendedor 1 Ruta 1', 'vendedor', R1, 'Amazonas8B!V01', false],
  ['VendedorR1_2', 'Vendedor 2 Ruta 1', 'vendedor', R1, 'Everest8B!V02', false],
  ['VendedorR2_3', 'Vendedor 3 Ruta 2', 'vendedor', R2, 'Atlantis8B!V03', false],
  ['VendedorR2_4', 'Vendedor 4 Ruta 2', 'vendedor', R2, 'Catarata8B!V04', false],
  ['VendedorR3_5', 'Vendedor 5 Ruta 3', 'vendedor', R3, 'Diamante8B!V05', false],
  ['VendedorR3_6', 'Vendedor 6 Ruta 3', 'vendedor', R3, 'Elefante8B!V06', false],
  ['VendedorR1_7', 'Vendedor 7 Ruta 1', 'vendedor', R1, 'Fortaleza8B!V07', false],
  ['VendedorR2_8', 'Vendedor 8 Ruta 2', 'vendedor', R2, 'Galaxia8B!V08', false],
  ['VendedorR3_9', 'Vendedor 9 Ruta 3', 'vendedor', R3, 'Huracan8B!V09', false],
  ['VendedorR1_10', 'Vendedor 10 Ruta 1', 'vendedor', R1, 'Invierno8B!V10', false],
  ['Despachador1', 'Despachador 1', 'despachador', '', 'Jaguar8B!D01', false],
  ['Despachador2', 'Despachador 2', 'despachador', '', 'Karmico8B!D02', false],
  ['Despachador3', 'Despachador 3', 'despachador', '', 'Laberinto8B!D03', false],
  ['Despachador4', 'Despachador 4', 'despachador', '', 'Misterio8B!D04', false],
  ['Despachador5', 'Despachador 5', 'despachador', '', 'Nomada8B!D05', false],
  ['Almacenista1', 'Almacenista 1', 'almacenista', '', 'Olimpo8B!L01', false],
  ['Almacenista2', 'Almacenista 2', 'almacenista', '', 'Piramide8B!L02', false],
  ['Almacenista3', 'Almacenista 3', 'almacenista', '', 'Quetzal8B!L03', false],
  ['Almacenista4', 'Almacenista 4', 'almacenista', '', 'Relampago8B!L04', false],
  ['Almacenista5', 'Almacenista 5', 'almacenista', '', 'Sahara8B!L05', false],
  ['Inventario1', 'Analista de Inventario 1', 'inventario', '', 'Tornado8B!I01', false],
  ['Inventario2', 'Analista de Inventario 2', 'inventario', '', 'Universo8B!I02', false],
  ['Lector1', 'Auditor (solo lectura)', 'lector', '', 'Vigilante8B!L1', false],
];

const FECHA = '2026-01-01T00:00:00.000Z';
const filas = USUARIOS.map(([username, nombre, rol, ruta, clave, cambiar]) => {
  const hash = bcrypt.hashSync(clave, 10);
  const rutaTxt = ruta ? `'${ruta}'` : 'undefined';
  return `  { id: '${username}', username: '${username}', password: '${hash}', nombre_completo: '${nombre}', rol: '${rol}', ruta_asignada: ${rutaTxt}, activo: true, fecha_creacion: '${FECHA}', creado_por: 'sistema', debe_cambiar_clave: ${cambiar} },`;
}).join('\n');

const contenido = `import type { Usuario } from '../types';

// ====================================================================
// 22 usuarios precargados. Las contraseñas están CIFRADAS (bcrypt): el
// texto plano NO aparece en el código. Generado por scripts/gen-hashes.mjs.
// Se cargan solo en el primer arranque (si la tabla usuarios está vacía).
// Los no-admin deben cambiar su clave en el primer login.
// ====================================================================
export const USUARIOS_SEED: Usuario[] = [
${filas}
];
`;

writeFileSync(join(__dirname, '..', 'src', 'db', 'seedUsuarios.ts'), contenido);
console.log('Generado src/db/seedUsuarios.ts con', USUARIOS.length, 'usuarios cifrados.');
