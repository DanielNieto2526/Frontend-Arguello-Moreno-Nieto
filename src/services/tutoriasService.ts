import type { TutoriaAgendada } from '../types/tutoria';
import { TUTORIAS_INICIALES } from '../data/tutoriasIniciales';
import { solicitar } from './api';

const RUTA = '/tutorias';

// Almacén en memoria para mutaciones locales durante la sesión 3 antes de persistir en MongoDB
let tutoriasEnMemoria: TutoriaAgendada[] = [...TUTORIAS_INICIALES];

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
    // Simula 600ms de red para visualizar el estado "Cargando..."
    await new Promise((resolver) => setTimeout(resolver, 600));
    return [...tutoriasEnMemoria];
  }
}

export async function cancelarTutoria(id: string): Promise<void> {
  try {
    await solicitar<void>(`${RUTA}/${id}`, {
      method: 'DELETE',
    });
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 400));
    tutoriasEnMemoria = tutoriasEnMemoria.filter((item) => item.id !== id);
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
    await new Promise((resolver) => setTimeout(resolver, 400));
    tutoriasEnMemoria = tutoriasEnMemoria.map((item) =>
      item.id === id ? { ...item, puedeCalificar: false, estado: 'completada' } : item
    );
  }
}

export async function agendarTutoria(datos: SolicitudAgendamiento): Promise<TutoriaAgendada> {
  try {
    return await solicitar<TutoriaAgendada>(RUTA, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 600));

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
          : 'Virtual • Google Meets',
      materia: datos.materia || 'Cálculo II',
      estado: 'pendiente',
      esVirtual: datos.modalidad === 'Virtual',
      linkReunion:
        datos.modalidad === 'Virtual' ? 'https://meet.google.com/abc-tuto-ros' : undefined,
    };

    tutoriasEnMemoria = [nuevaTutoria, ...tutoriasEnMemoria];
    return nuevaTutoria;
  }
}
