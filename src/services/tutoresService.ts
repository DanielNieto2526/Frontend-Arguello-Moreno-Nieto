import type { Tutor } from '../types/tutor';
import { TUTORES_INICIALES } from '../data/tutoresIniciales';
import { solicitar } from './api';

const RUTA = '/tutores';

/**
 * Servicio de tutores de la API.
 * Los componentes llaman a estas funciones.
 */

export async function obtenerTutores(): Promise<Tutor[]> {
  try {
    return await solicitar<Tutor[]>(RUTA);
  } catch {
    // simulamos 600ms de latencia de red para reflejar los estados de carga.
    await new Promise((resolver) => setTimeout(resolver, 600));
    return [...TUTORES_INICIALES];
  }
}

export async function obtenerTutorPorId(id: string): Promise<Tutor> {
  try {
    return await solicitar<Tutor>(`${RUTA}/${id}`);
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 400));
    const tutor = TUTORES_INICIALES.find((t) => t.id === id);
    if (!tutor) {
      throw new Error(`Tutor con id ${id} no encontrado`);
    }
    return tutor;
  }
}
