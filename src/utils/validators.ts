// Validacion de RIF venezolano. Acepta:
//  - J-12345678-9  (con digito verificador)
//  - J-12345678    (sin digito verificador)
//  - SIN IDENTIFICACION (cliente sin RIF aun)
const RIF_REGEX = /^(J|V|E|G)-(\d{7,8})-(\d{1})$|^(J|V|E|G)-(\d{7,8})$|^SIN IDENTIFICACION$/;

export function esRifValido(rif: string): boolean {
  return RIF_REGEX.test((rif || '').trim().toUpperCase());
}

// Validacion de Cedula de Identidad venezolana: V-12345678 o E-12345678
// (persona natural o extranjero, sin digito verificador). Acepta tambien
// el literal SIN IDENTIFICACION para clientes sin documento aun.
const CEDULA_REGEX = /^(V|E)-(\d{6,8})$|^SIN IDENTIFICACION$/;

export function esCedulaValida(cedula: string): boolean {
  return CEDULA_REGEX.test((cedula || '').trim().toUpperCase());
}

// Telefono: solo digitos, guiones, espacios y +. Minimo 7 digitos.
export function esTelefonoValido(tel: string): boolean {
  const limpio = (tel || '').replace(/[\s\-+]/g, '');
  return /^\d{7,15}$/.test(limpio);
}

export function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

// Contraseña fuerte: mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.
export function esClaveFuerte(clave: string): boolean {
  return (
    clave.length >= 8 &&
    /[A-Z]/.test(clave) &&
    /[a-z]/.test(clave) &&
    /[0-9]/.test(clave) &&
    /[^A-Za-z0-9]/.test(clave)
  );
}

// Username válido: 4+ caracteres, solo letras, números, puntos y guiones bajos.
export function esUsernameValido(username: string): boolean {
  return /^[A-Za-z0-9._]{4,}$/.test(username || '');
}
