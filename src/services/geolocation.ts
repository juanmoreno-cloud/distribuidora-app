// Wrapper sencillo de navigator.geolocation para capturar lat/long.
export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export function obtenerUbicacion(): Promise<Coordenadas> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Este dispositivo no soporta GPS.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitud: pos.coords.latitude, longitud: pos.coords.longitude }),
      (err) => {
        // Mensajes claros para el vendedor en campo.
        const mensajes: Record<number, string> = {
          1: 'Permiso de ubicación denegado. Actívalo en el navegador.',
          2: 'No se pudo obtener la ubicación. Revisa el GPS.',
          3: 'La ubicación tardó demasiado. Intenta de nuevo.',
        };
        reject(new Error(mensajes[err.code] || 'Error obteniendo ubicación.'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
