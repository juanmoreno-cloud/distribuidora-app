// Wrapper de navigator.geolocation para capturar lat/long.
export interface Coordenadas {
  latitud: number;
  longitud: number;
}

// ¿El navegador permite GPS aquí? El GPS del navegador SOLO funciona en
// "contexto seguro" (https o localhost). Si la app se abre por IP de red con
// http://, el navegador bloquea la ubicación y hay que ingresarla a mano.
export function gpsDisponible(): boolean {
  return 'geolocation' in navigator && window.isSecureContext;
}

// Un intento de lectura de posición con las opciones dadas.
function intentarPosicion(opciones: PositionOptions): Promise<Coordenadas> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitud: pos.coords.latitude, longitud: pos.coords.longitude }),
      (err) => reject(err),
      opciones,
    );
  });
}

export async function obtenerUbicacion(): Promise<Coordenadas> {
  if (!('geolocation' in navigator)) {
    throw new Error('Este dispositivo no soporta GPS. Ingresa las coordenadas manualmente.');
  }
  if (!window.isSecureContext) {
    throw new Error('El GPS automático solo funciona con https. Ingresa las coordenadas manualmente (o abre la app publicada en la nube).');
  }
  try {
    // 1er intento: alta precisión (GPS real del teléfono).
    return await intentarPosicion({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  } catch (err) {
    const e = err as GeolocationPositionError;
    if (e.code === 1) {
      throw new Error('Permiso de ubicación denegado. Actívalo o ingresa las coordenadas manualmente.');
    }
    // 2do intento: baja precisión (red/WiFi) — funciona en PCs y equipos sin GPS,
    // y acepta una posición reciente en caché (hasta 1 min).
    try {
      return await intentarPosicion({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
    } catch (err2) {
      const e2 = err2 as GeolocationPositionError;
      const mensajes: Record<number, string> = {
        1: 'Permiso de ubicación denegado. Actívalo o ingresa las coordenadas manualmente.',
        2: 'No se pudo obtener la ubicación. Ingresa las coordenadas manualmente.',
        3: 'La ubicación tardó demasiado. Intenta de nuevo o ingrésala manualmente.',
      };
      throw new Error(mensajes[e2.code] || 'Error obteniendo ubicación. Ingrésala manualmente.');
    }
  }
}
