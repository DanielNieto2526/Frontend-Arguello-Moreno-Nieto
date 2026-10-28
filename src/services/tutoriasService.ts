import type { TutoriaAgendada, EstadoTutoria } from '../types/tutoria';
import { TUTORIAS_INICIALES } from '../data/tutoriasIniciales';
import { solicitar } from './api';
import { obtenerSesion } from '../utils/auth';

const RUTA = '/tutorias';
const STORAGE_TUTORIAS_KEY = 'conecta_tutor_tutorias_persisted_v3';

function cargarTutoriasPersistidas(): TutoriaAgendada[] {
  try {
    const data = localStorage.getItem(STORAGE_TUTORIAS_KEY);
    if (data) {
      const parsed = JSON.parse(data) as TutoriaAgendada[];
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return [...TUTORIAS_INICIALES];
}

function guardarTutoriasPersistidas(lista: TutoriaAgendada[]): void {
  try {
    localStorage.setItem(STORAGE_TUTORIAS_KEY, JSON.stringify(lista));
  } catch (e) {
    console.error('Error guardando tutorias en storage:', e);
  }
}

// Almacén en memoria sincronizado con localStorage
let tutoriasEnMemoria: TutoriaAgendada[] = cargarTutoriasPersistidas();

export interface SolicitudAgendamiento {
  tutorId: string;
  tutorNombres: string;
  tutorApellidos: string;
  tutorIniciales: string;
  tutorSemestreTexto: string;
  diaNumero: number;
  diaSemana: string;
  mes: string;
  franjaTexto: string;
  modalidad: 'Presencial' | 'Virtual';
  lugarOSede: string;
  materia: string;
  detalles: string;
  nombresArchivos?: string[];
}

/**
 * Servicio de tutorías agendadas del estudiante.
 */

export async function obtenerTutorias(): Promise<TutoriaAgendada[]> {
  try {
    return await solicitar<TutoriaAgendada[]>(RUTA);
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 300));
    return [...tutoriasEnMemoria];
  }
}

export async function obtenerTutoriaPorId(id: string): Promise<TutoriaAgendada> {
  try {
    return await solicitar<TutoriaAgendada>(`${RUTA}/${id}`);
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 200));
    const tutoria = tutoriasEnMemoria.find((t) => t.id === id);
    if (!tutoria) {
      return tutoriasEnMemoria[0] || TUTORIAS_INICIALES[0];
    }
    return tutoria;
  }
}

/**
 * Obtiene tutorías asignadas a un tutor específico.
 */
export async function obtenerTutoriasPorTutor(
  tutorId?: string,
  tutorNombres?: string
): Promise<TutoriaAgendada[]> {
  try {
    const query = tutorId ? `?tutorId=${encodeURIComponent(tutorId)}` : '';
    return await solicitar<TutoriaAgendada[]>(`${RUTA}/asignadas${query}`);
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 300));
    
    if (tutorId || tutorNombres) {
      const normalizar = (s: string) => s.toLowerCase().trim();
      const filtradas = tutoriasEnMemoria.filter((t) => {
        if (tutorId && (t.tutorId === tutorId || t.tutorId === '2' || t.tutorId === 'tutor-1')) return true;
        if (tutorNombres && normalizar(`${t.tutorNombres} ${t.tutorApellidos}`).includes(normalizar(tutorNombres))) return true;
        return false;
      });

      if (filtradas.length > 0) return filtradas;
    }

    return [...tutoriasEnMemoria];
  }
}

export async function cancelarTutoria(id: string): Promise<void> {
  try {
    await solicitar<void>(`${RUTA}/${id}`, {
      method: 'DELETE',
    });
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 300));
    tutoriasEnMemoria = tutoriasEnMemoria.map((item) =>
      item.id === id ? { ...item, estado: 'cancelada' as EstadoTutoria } : item
    );
    guardarTutoriasPersistidas(tutoriasEnMemoria);
  }
}

export async function actualizarLinkReunion(
  id: string,
  linkReunion: string
): Promise<TutoriaAgendada> {
  try {
    return await solicitar<TutoriaAgendada>(`${RUTA}/${id}/link`, {
      method: 'PATCH',
      body: JSON.stringify({ linkReunion }),
    });
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 300));
    let actualizada: TutoriaAgendada | null = null;
    tutoriasEnMemoria = tutoriasEnMemoria.map((item) => {
      if (item.id === id) {
        actualizada = { ...item, linkReunion };
        return actualizada;
      }
      return item;
    });
    guardarTutoriasPersistidas(tutoriasEnMemoria);
    if (!actualizada) {
      throw new Error(`Tutoría con id ${id} no encontrada`);
    }
    return actualizada;
  }
}

export async function actualizarEstadoTutoria(
  id: string,
  nuevoEstado: EstadoTutoria
): Promise<TutoriaAgendada> {
  try {
    return await solicitar<TutoriaAgendada>(`${RUTA}/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: nuevoEstado }),
    });
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 300));
    let actualizada: TutoriaAgendada | null = null;
    tutoriasEnMemoria = tutoriasEnMemoria.map((item) => {
      if (item.id === id) {
        actualizada = {
          ...item,
          estado: nuevoEstado,
          tiempoRestanteTexto: nuevoEstado === 'completada' ? 'Finalizada' : item.tiempoRestanteTexto,
        };
        return actualizada;
      }
      return item;
    });
    guardarTutoriasPersistidas(tutoriasEnMemoria);
    if (!actualizada) {
      throw new Error(`Tutoría con id ${id} no encontrada`);
    }
    return actualizada;
  }
}

export async function calificarTutoria(
  id: string,
  calificacion: number,
  comentarios?: string
): Promise<void> {
  try {
    await solicitar<void>(`${RUTA}/${id}/calificacion`, {
      method: 'POST',
      body: JSON.stringify({ calificacion, comentarios }),
    });
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 300));
    tutoriasEnMemoria = tutoriasEnMemoria.map((item) =>
      item.id === id
        ? {
            ...item,
            puedeCalificar: false,
            estado: 'completada',
            calificacion,
            comentarioEstudiante: comentarios,
          }
        : item
    );
    guardarTutoriasPersistidas(tutoriasEnMemoria);
  }
}

export async function agendarTutoria(datos: SolicitudAgendamiento): Promise<TutoriaAgendada> {
  try {
    return await solicitar<TutoriaAgendada>(RUTA, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 400));

    const sesionEstudiante = obtenerSesion();

    const nuevaTutoria: TutoriaAgendada = {
      id: `tutoria-${Date.now()}`,
      tutorId: datos.tutorId,
      tutorNombres: datos.tutorNombres,
      tutorApellidos: datos.tutorApellidos,
      tutorIniciales: datos.tutorIniciales,
      tutorSemestreTexto: datos.tutorSemestreTexto,
      fechaTexto: `${datos.diaSemana} ${datos.diaNumero}, ${datos.franjaTexto}`,
      tiempoRestanteTexto: 'En 3 dias',
      lugarTexto:
        datos.modalidad === 'Presencial'
          ? datos.lugarOSede || 'Sede Claustro'
          : 'Virtual - Google Meets',
      materia: datos.materia || 'Cálculo II',
      estado: 'pendiente',
      esVirtual: datos.modalidad === 'Virtual',
      linkReunion:
        datos.modalidad === 'Virtual' ? 'https://meet.google.com/foj-amx-bqp?pli=1&authuser=1' : undefined,
      estudianteId: sesionEstudiante?.id || '1',
      estudianteNombres: sesionEstudiante?.nombres || 'Daniela',
      estudianteApellidos: sesionEstudiante?.apellidos || 'Moreno',
      estudianteIniciales: `${(sesionEstudiante?.nombres || 'D').charAt(0)}${(sesionEstudiante?.apellidos || 'M').charAt(0)}`,
      estudianteCorreo: sesionEstudiante?.correo || 'dmoreno@urosario.edu.co',
      estudianteCarrera: sesionEstudiante?.carrera ? `${sesionEstudiante.semestre || 6}º semestre ${sesionEstudiante.carrera}` : '6º semestre ISE',
      estudianteTelefono: sesionEstudiante?.telefono || '320 4051954',
      estudianteSemestreCompleto: sesionEstudiante?.carrera || 'sexto semestre Ingenieria de Sistemas',
      detalles: datos.detalles,
      nombresArchivos: datos.nombresArchivos,
    };

    tutoriasEnMemoria = [nuevaTutoria, ...tutoriasEnMemoria];
    guardarTutoriasPersistidas(tutoriasEnMemoria);
    return nuevaTutoria;
  }
}
