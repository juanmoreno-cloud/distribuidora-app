import bcrypt from 'bcryptjs';

// Cifra una contraseña (para usuarios nuevos o cambios de clave).
export function hashClave(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

// Verifica una contraseña contra su hash guardado.
export function verificarClave(plain: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}
