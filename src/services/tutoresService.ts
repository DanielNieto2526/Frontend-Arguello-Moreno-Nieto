import type { Tutor } from '../types/tutor';
import type { DatosRegistroTutor, Usuario } from '../types/usuario';
import { TUTORES_INICIALES } from '../data/tutoresIniciales';
import { solicitar } from './api';
import { registrarUsuarioLocal, obtenerSesion, guardarSesion } from '../utils/auth';

const RUTA = '/tutores';
const STORAGE_TUTORES_KEY = 'conecta_tutor_nuevos_tutores';

export function obtenerTutoresPersistidos(): Tutor[] {
  try {
    const data = localStorage.getItem(STORAGE_TUTORES_KEY);
    return data ? (JSON.parse(data) as Tutor[]) : [];
  } catch {
    return [];
  }
}

export function guardarTutorPersistido(tutor: Tutor): void {
  try {
    const lista = obtenerTutoresPersistidos();
    const filtrada = lista.filter((t) => t.id !== tutor.id);
    filtrada.push(tutor);
    localStorage.setItem(STORAGE_TUTORES_KEY, JSON.stringify(filtrada));
  } catch (e) {
    console.error('Error guardando tutor persistido:', e);
  }
}

export function guardarTodosLosTutoresPersistidos(lista: Tutor[]): void {
  try {
    localStorage.setItem(STORAGE_TUTORES_KEY, JSON.stringify(lista));
  } catch (e) {
    console.error('Error guardando lista de tutores:', e);
  }
}



/**
 * Servicio de tutores de la API.
 * Los componentes llaman a estas funciones.
 */

export async function obtenerTutores(): Promise<Tutor[]> {
  try {
    return await solicitar<Tutor[]>(RUTA);
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 300));
    const tutoresPersistidos = obtenerTutoresPersistidos();
    const mapa = new Map<string, Tutor>();

    TUTORES_INICIALES.forEach((t) => {
      mapa.set(t.id, {
        ...t,
        estadoAprobacion: 'aprobado',
        activo: t.activo !== undefined ? t.activo : true,
      });
    });

    tutoresPersistidos.forEach((t) => {
      mapa.set(t.id, t);
    });

    return Array.from(mapa.values());
  }
}

export async function obtenerTutorPorId(id: string): Promise<Tutor> {
  try {
    return await solicitar<Tutor>(`${RUTA}/${id}`);
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 400));
    const tutoresPersistidos = obtenerTutoresPersistidos();
    const todos = [...tutoresPersistidos, ...TUTORES_INICIALES];
    const tutor = todos.find((t) => t.id === id);
    if (!tutor) {
      throw new Error(`Tutor con id ${id} no encontrado`);
    }
    return tutor;
  }
}

export async function registrarNuevoTutor(
  datos: DatosRegistroTutor
): Promise<{ usuario: Usuario; tutor: Tutor }> {
  try {
    const res = await solicitar<{ usuario: Usuario; tutor: Tutor }>(`${RUTA}/registro`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    if (res && res.tutor) {
      guardarTutorPersistido(res.tutor);
    }
    if (res && res.usuario) {
      registrarUsuarioLocal(res.usuario);
    }
    return res;
  } catch (error: unknown) {
    console.error('Error al registrar nuevo tutor en el backend:', error);
    throw error;
  }
}

export async function actualizarDisponibilidadTutor(
  tutorId: string,
  activo: boolean
): Promise<void> {
  try {
    await solicitar<void>(`${RUTA}/${tutorId}/disponibilidad`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });

    const tutores = obtenerTutoresPersistidos();
    const index = tutores.findIndex((t) => t.id === tutorId);
    if (index !== -1) {
      tutores[index].activo = activo;
      localStorage.setItem(STORAGE_TUTORES_KEY, JSON.stringify(tutores));
    }
  } catch (error) {
    console.error('Error al actualizar disponibilidad:', error);
    throw error;
  }
}

export async function actualizarTutor(
  tutorId: string,
  cambios: Partial<Tutor & Usuario>
): Promise<Tutor> {
  try {
    const tutorActualizado = await solicitar<Tutor>(`${RUTA}/${tutorId}`, {
      method: 'PATCH',
      body: JSON.stringify(cambios),
    });

    if (tutorActualizado) {
      guardarTutorPersistido(tutorActualizado);
      const sesion = obtenerSesion();
      if (
        sesion &&
        (sesion.id === tutorId ||
          sesion.id === tutorActualizado.id ||
          sesion.correo === tutorActualizado.correo)
      ) {
        const sesionActualizada = { ...sesion, ...cambios, ...tutorActualizado };
        guardarSesion(sesionActualizada);
        registrarUsuarioLocal(sesionActualizada);
      }
    }
    return tutorActualizado;
  } catch (error) {
    console.error('Error actualizando tutor en el backend:', error);
    throw error;
  }
}
