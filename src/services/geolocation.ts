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

export function obtenerUbicacion(): Promise<Coordenadas> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Este dispositivo no soporta GPS. Ingresa las coordenadas manualmente.'));
      return;
    }
    if (!window.isSecureContext) {
      reject(new Error('El GPS automático solo funciona con https. Ingresa las coordenadas manualmente (o abre la app publicada en la nube).'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitud: pos.coords.latitude, longitud: pos.coords.longitude }),
      (err) => {
        // Mensajes claros para el vendedor en campo.
        const mensajes: Record<number, string> = {
          1: 'Permiso de ubicación denegado. Actívalo o ingresa las coordenadas manualmente.',
          2: 'No se pudo obtener la ubicación. Ingresa las coordenadas manualmente.',
          3: 'La ubicación tardó demasiado. Intenta de nuevo o ingrésala manualmente.',
        };
        reject(new Error(mensajes[err.code] || 'Error obteniendo ubicación. Ingrésala manualmente.'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
