import type { Tutor } from '../types/tutor';
import { TUTORES_INICIALES } from '../data/tutoresIniciales';
import {
  obtenerTutoresPersistidos,
  guardarTodosLosTutoresPersistidos,
} from './tutoresService';
import { actualizarUsuarioLocal } from '../utils/auth';
import { solicitar } from './api';

export async function obtenerTodasLasSolicitudesAdmin(): Promise<Tutor[]> {
  try {
    const solicitudes = await solicitar<Tutor[]>('/admin/solicitudes');
    if (Array.isArray(solicitudes)) {
      const persistidos = obtenerTutoresPersistidos();
      const mapa = new Map<string, Tutor>();
      solicitudes.forEach((t) => mapa.set(t.id, t));
      persistidos.forEach((t) => {
        if (!mapa.has(t.id)) {
          mapa.set(t.id, t);
        }
      });
      return Array.from(mapa.values());
    }
  } catch (error) {
    console.warn('Fallo al obtener solicitudes de admin desde la API, usando respaldo:', error);
  }

  // Respaldo en memoria / localStorage si la API no está disponible
  const persistidos = obtenerTutoresPersistidos();
  const mapaTutores = new Map<string, Tutor>();

  TUTORES_INICIALES.forEach((t) => {
    mapaTutores.set(t.id, {
      ...t,
      estadoAprobacion: t.estadoAprobacion || 'aprobado',
      activo: t.activo !== undefined ? t.activo : true,
      notaMateria: t.notaMateria || 4.8,
      soporteNotasNombre: t.soporteNotasNombre || 'certificado_oficial.pdf',
    });
  });

  persistidos.forEach((t) => {
    mapaTutores.set(t.id, t);
  });

  return Array.from(mapaTutores.values());
}

export async function obtenerSolicitudesPendientes(): Promise<Tutor[]> {
  try {
    const pendientes = await solicitar<Tutor[]>('/admin/solicitudes/pendientes');
    if (Array.isArray(pendientes)) return pendientes;
  } catch {
    // fallback
  }
  const todos = await obtenerTodasLasSolicitudesAdmin();
  return todos.filter((t) => t.estadoAprobacion === 'pendiente');
}

export async function obtenerTutoresParaGestion(): Promise<Tutor[]> {
  try {
    const tutores = await solicitar<Tutor[]>('/admin/tutores');
    if (Array.isArray(tutores)) return tutores;
  } catch {
    // fallback
  }
  const todos = await obtenerTodasLasSolicitudesAdmin();
  return todos.filter((t) => t.estadoAprobacion === 'aprobado');
}

export async function aprobarTutor(id: string): Promise<Tutor> {
  const persistidos = obtenerTutoresPersistidos();
  const tutorLocal = persistidos.find((t) => t.id === id);

  try {
    const tutorAprobado = await solicitar<Tutor>(`/admin/tutores/${id}/aprobar`, {
      method: 'PATCH',
      body: JSON.stringify(tutorLocal || {}),
    });

    // Sincronizar en almacenamiento local
    const persistidos = obtenerTutoresPersistidos();
    const actualizados = persistidos.map((t) =>
      t.id === id ? { ...t, estadoAprobacion: 'aprobado' as const, activo: true } : t
    );
    guardarTodosLosTutoresPersistidos(actualizados);

    actualizarUsuarioLocal(id, {
      estadoAprobacion: 'aprobado',
      activo: true,
    });

    return tutorAprobado;
  } catch (error) {
    console.warn('Error llamando API de aprobación, usando respaldo local:', error);
    const persistidos = obtenerTutoresPersistidos();
    let tutorModificado: Tutor | null = null;

    const actualizados = persistidos.map((t) => {
      if (t.id === id) {
        tutorModificado = {
          ...t,
          estadoAprobacion: 'aprobado' as const,
          activo: true,
        };
        return tutorModificado;
      }
      return t;
    });

    guardarTodosLosTutoresPersistidos(actualizados);
    actualizarUsuarioLocal(id, {
      estadoAprobacion: 'aprobado',
      activo: true,
    });

    if (!tutorModificado) {
      throw new Error(`Tutor con ID ${id} no encontrado.`);
    }
    return tutorModificado;
  }
}

export async function rechazarTutor(
  id: string,
  motivo: string = 'No cumple con los requisitos académicos mínimos'
): Promise<Tutor> {
  try {
    const res = await solicitar<any>(`/admin/tutores/${id}/rechazar`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo }),
    });

    // Al rechazar, el perfil se elimina por completo para que no exista
    const persistidos = obtenerTutoresPersistidos();
    const actualizados = persistidos.filter((t) => t.id !== id);
    guardarTodosLosTutoresPersistidos(actualizados);

    return res as Tutor;
  } catch (error) {
    console.warn('Error llamando API de rechazo, usando eliminación local:', error);
    // Eliminar completamente de persistidos para que el perfil no exista
    const persistidos = obtenerTutoresPersistidos();
    const actualizados = persistidos.filter((t) => t.id !== id);
    guardarTodosLosTutoresPersistidos(actualizados);

    return { id, estadoAprobacion: 'rechazado', motivoRechazo: motivo } as any;
  }
}

export async function alternarEstadoTutor(
  id: string,
  nuevoEstadoActivo: boolean
): Promise<Tutor> {
  try {
    const tutorActualizado = await solicitar<Tutor>(`/admin/tutores/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: nuevoEstadoActivo }),
    });

    const persistidos = obtenerTutoresPersistidos();
    const actualizados = persistidos.map((t) =>
      t.id === id ? { ...t, activo: nuevoEstadoActivo } : t
    );
    guardarTodosLosTutoresPersistidos(actualizados);

    actualizarUsuarioLocal(id, {
      activo: nuevoEstadoActivo,
    });

    return tutorActualizado;
  } catch (error) {
    console.warn('Error llamando API de estado tutor, usando respaldo local:', error);
    const persistidos = obtenerTutoresPersistidos();
    let tutorModificado: Tutor | null = null;

    const actualizados = persistidos.map((t) => {
      if (t.id === id) {
        tutorModificado = {
          ...t,
          activo: nuevoEstadoActivo,
        };
        return tutorModificado;
      }
      return t;
    });

    guardarTodosLosTutoresPersistidos(actualizados);
    actualizarUsuarioLocal(id, {
      activo: nuevoEstadoActivo,
    });

    if (!tutorModificado) {
      throw new Error(`Tutor con ID ${id} no encontrado.`);
    }
    return tutorModificado;
  }
}
