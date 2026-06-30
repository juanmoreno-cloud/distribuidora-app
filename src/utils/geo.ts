// Distancia aproximada en km entre dos puntos (fórmula de Haversine).
export function distanciaKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Ordena una lista de paradas por cercanía usando "vecino más cercano":
// arranca en la primera parada con coordenadas y va saltando a la más próxima.
// Las paradas sin coordenadas se dejan al final, en su orden original.
export function ordenarPorProximidad<T extends { latitud?: number; longitud?: number }>(items: T[]): T[] {
  const conGps = items.filter((i) => i.latitud != null && i.longitud != null);
  const sinGps = items.filter((i) => i.latitud == null || i.longitud == null);
  if (conGps.length <= 1) return [...conGps, ...sinGps];

  const restantes = [...conGps];
  const ruta: T[] = [restantes.shift()!];
  while (restantes.length) {
    const actual = ruta[ruta.length - 1];
    const origen = { lat: actual.latitud!, lng: actual.longitud! };
    let idxCercano = 0;
    let minDist = Infinity;
    restantes.forEach((cand, i) => {
      const d = distanciaKm(origen, { lat: cand.latitud!, lng: cand.longitud! });
      if (d < minDist) { minDist = d; idxCercano = i; }
    });
    ruta.push(restantes.splice(idxCercano, 1)[0]);
  }
  return [...ruta, ...sinGps];
}
