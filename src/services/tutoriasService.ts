import type { TutoriaAgendada, EstadoTutoria } from '../types/tutoria';
import { TUTORIAS_INICIALES } from '../data/tutoriasIniciales';
import { solicitar } from './api';
import { obtenerSesion } from '../utils/auth';

const RUTA = '/tutorias';
const STORAGE_TUTORIAS_KEY = 'conecta_tutor_tutorias_persisted_v5';

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

const MESES_MAP: Record<string, number> = {
  enero: 0, ene: 0,
  febrero: 1, feb: 1,
  marzo: 2, mar: 2,
  abril: 3, abr: 3,
  mayo: 4, may: 4,
  junio: 5, jun: 5,
  julio: 6, jul: 6,
  agosto: 7, ago: 7,
  septiembre: 8, sep: 8, sept: 8,
  octubre: 9, oct: 9,
  noviembre: 10, nov: 10,
  diciembre: 11, dic: 11,
};

export function calcularTiempoRestante(
  fechaISO?: string,
  fechaTexto?: string,
  estado?: string,
  calificacion?: number
): string {
  if (estado === 'completada') return 'Finalizada';
  if (estado === 'cancelada') return 'Cancelada';
  if (calificacion !== undefined && calificacion !== null && Number(calificacion) > 0) return 'Ya Tomada';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let target: Date | null = null;

  if (fechaISO && /^\d{4}-\d{2}-\d{2}/.test(fechaISO)) {
    const parts = fechaISO.substring(0, 10).split('-').map(Number);
    target = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  } else if (fechaTexto) {
    const matchCompleto = String(fechaTexto).match(/(\d{1,2})\s+de\s+([a-zA-ZáéíóúÁÉÍÓÚ]+)(?:\s+de\s+(\d{4}))?/i);
    if (matchCompleto) {
      const dia = parseInt(matchCompleto[1], 10);
      const mesStr = matchCompleto[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const mes = MESES_MAP[mesStr] !== undefined ? MESES_MAP[mesStr] : hoy.getMonth();
      let anio = matchCompleto[3] ? parseInt(matchCompleto[3], 10) : hoy.getFullYear();

      if (!matchCompleto[3]) {
        if (mes < hoy.getMonth() || (mes === hoy.getMonth() && dia < hoy.getDate() - 15)) {
          anio += 1;
        }
      }
      target = new Date(anio, mes, dia, 0, 0, 0, 0);
    } else {
      const matchSimple = String(fechaTexto).match(/(?:[a-zA-ZáéíóúÁÉÍÓÚ]+)\s+(\d{1,2})/i);
      if (matchSimple) {
        const dia = parseInt(matchSimple[1], 10);
        let anio = hoy.getFullYear();
        let mes = hoy.getMonth();
        if (dia < hoy.getDate() - 15) {
          mes += 1;
          if (mes > 11) {
            mes = 0;
            anio += 1;
          }
        }
        target = new Date(anio, mes, dia, 0, 0, 0, 0);
      }
    }
  }

  if (!target || isNaN(target.getTime())) {
    return 'En 2 dias';
  }

  const diffMs = target.getTime() - hoy.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return 'Ya Tomada';
  if (diffDias === 0) return 'Hoy';
  if (diffDias === 1) return 'En 1 dia';
  return `En ${diffDias} dias`;
}

export interface SolicitudAgendamiento {
  tutorId: string;
  tutorUsuarioId?: string;
  tutorNombres: string;
  tutorApellidos: string;
  tutorIniciales: string;
  tutorSemestreTexto: string;
  tutorAvatar?: string;
  duracionHoras?: number;
  precioHora?: number;
  precioTotal?: number;
  fechaISO?: string;
  fechaTexto?: string;
  diaNumero: number;
  diaSemana: string;
  mes: string;
  año?: number;
  franjaTexto: string;
  modalidad: 'Presencial' | 'Virtual';
  lugarOSede: string;
  materia: string;
  detalles: string;
  nombresArchivos?: string[];
  archivos?: { nombre: string; url?: string; tipo?: string }[];
  archivosAdjuntos?: { nombre: string; url?: string; tipo?: string }[];
  estudianteId?: string;
  estudianteNombres?: string;
  estudianteApellidos?: string;
  estudianteIniciales?: string;
  estudianteCorreo?: string;
  estudianteTelefono?: string;
  estudianteCarrera?: string;
  estudianteSemestreCompleto?: string;
  estudianteAvatar?: string;
}

/**
 * Servicio de tutorías agendadas del estudiante.
 */

export async function obtenerTutorias(): Promise<TutoriaAgendada[]> {
  const sesion = obtenerSesion();
  const estudianteId = sesion?.id || '';
  const estudianteCorreo = sesion?.correo || '';

  try {
    const params = new URLSearchParams();
    if (estudianteId) params.append('estudianteId', estudianteId);
    if (estudianteCorreo) params.append('estudianteCorreo', estudianteCorreo);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await solicitar<TutoriaAgendada[]>(`${RUTA}${queryString}`);
    if (Array.isArray(res)) {
      return res
        .filter((t) => t.estado !== 'cancelada')
        .map((t) => ({
          ...t,
          tiempoRestanteTexto: calcularTiempoRestante(t.fechaISO, t.fechaTexto, t.estado, t.calificacion),
        }));
    }
  } catch {
    // fallback
  }

  // Filtrar estrictamente por el ID o correo del estudiante para no mostrar tutorias de otros usuarios ni canceladas
  if (estudianteId || estudianteCorreo) {
    return tutoriasEnMemoria
      .filter((t) =>
        (t.estudianteId === estudianteId || (estudianteCorreo && t.estudianteCorreo?.toLowerCase() === estudianteCorreo.toLowerCase())) &&
        t.estado !== 'cancelada'
      )
      .map((t) => ({
        ...t,
        tiempoRestanteTexto: calcularTiempoRestante(t.fechaISO, t.fechaTexto, t.estado, t.calificacion),
      }));
  }

  return [];
}

export async function obtenerTutoriaPorId(id: string): Promise<TutoriaAgendada> {
  try {
    const res = await solicitar<TutoriaAgendada>(`${RUTA}/${id}`);
    if (res) {
      return {
        ...res,
        tiempoRestanteTexto: calcularTiempoRestante(res.fechaISO, res.fechaTexto, res.estado, res.calificacion),
      };
    }
    return res;
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 200));
    const tutoria = tutoriasEnMemoria.find((t) => t.id === id);
    if (!tutoria) {
      const item = tutoriasEnMemoria[0] || TUTORIAS_INICIALES[0];
      return {
        ...item,
        tiempoRestanteTexto: calcularTiempoRestante(item.fechaISO, item.fechaTexto, item.estado, item.calificacion),
      };
    }
    return {
      ...tutoria,
      tiempoRestanteTexto: calcularTiempoRestante(tutoria.fechaISO, tutoria.fechaTexto, tutoria.estado, tutoria.calificacion),
    };
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
    const params = new URLSearchParams();
    if (tutorId) params.append('tutorId', tutorId);
    if (tutorNombres) params.append('tutorNombres', tutorNombres);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await solicitar<TutoriaAgendada[]>(`${RUTA}/asignadas${query}`);
    if (Array.isArray(res)) {
      return res.map((t) => ({
        ...t,
        tiempoRestanteTexto: calcularTiempoRestante(t.fechaISO, t.fechaTexto, t.estado, t.calificacion),
      }));
    }
  } catch {
    // fallback
  }

  const normalizar = (s: string) => s.toLowerCase().trim();
  const asignadas = tutoriasEnMemoria
    .filter((t) => {
      if (tutorId && (t.tutorId === tutorId || t.tutorUsuarioId === tutorId)) return true;
      if (tutorNombres && normalizar(`${t.tutorNombres} ${t.tutorApellidos}`).includes(normalizar(tutorNombres))) return true;
      return false;
    })
    .map((t) => ({
      ...t,
      tiempoRestanteTexto: calcularTiempoRestante(t.fechaISO, t.fechaTexto, t.estado, t.calificacion),
    }));

  return asignadas;
}

export async function cancelarTutoria(id: string): Promise<void> {
  try {
    await solicitar<void>(`${RUTA}/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error al cancelar la tutoría en el backend:', error);
  } finally {
    tutoriasEnMemoria = tutoriasEnMemoria.filter((item) => item.id !== id);
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
  const sesionEstudiante = obtenerSesion();

  const datosCompletos: SolicitudAgendamiento = {
    ...datos,
    estudianteId: datos.estudianteId || sesionEstudiante?.id || '',
    estudianteNombres: datos.estudianteNombres || sesionEstudiante?.nombres || '',
    estudianteApellidos: datos.estudianteApellidos || sesionEstudiante?.apellidos || '',
    estudianteIniciales:
      datos.estudianteIniciales ||
      (sesionEstudiante?.nombres && sesionEstudiante?.apellidos
        ? `${sesionEstudiante.nombres.charAt(0)}${sesionEstudiante.apellidos.charAt(0)}`.toUpperCase()
        : ''),
    estudianteCorreo: datos.estudianteCorreo || sesionEstudiante?.correo || '',
    estudianteCarrera:
      datos.estudianteCarrera ||
      (sesionEstudiante?.carrera
        ? `${sesionEstudiante.semestre || 1}º semestre ${sesionEstudiante.carrera}`
        : '') ||
      '',
    estudianteTelefono:
      datos.estudianteTelefono !== undefined && datos.estudianteTelefono !== null
        ? datos.estudianteTelefono
        : sesionEstudiante?.telefono || '',
    estudianteSemestreCompleto:
      datos.estudianteSemestreCompleto ||
      sesionEstudiante?.semestreTexto ||
      sesionEstudiante?.carrera ||
      '',
    estudianteAvatar: datos.estudianteAvatar || sesionEstudiante?.avatarUrl || '',
    tutorAvatar: datos.tutorAvatar || '',
    duracionHoras: datos.duracionHoras || 1,
    precioTotal: datos.precioTotal || 0,
    precioHora: datos.precioHora || 0,
    fechaTexto: datos.fechaTexto || `${datos.diaSemana} ${datos.diaNumero}, ${datos.franjaTexto}`,
    fechaISO: datos.fechaISO || '',
  };

  // Intentar guardar en el backend (MongoDB Atlas)
  let errorBackend: unknown = null;
  try {
    const res = await solicitar<TutoriaAgendada>(RUTA, {
      method: 'POST',
      body: JSON.stringify(datosCompletos),
    });
    if (res && res.id) {
      const resCalculada: TutoriaAgendada = {
        ...res,
        tiempoRestanteTexto: calcularTiempoRestante(res.fechaISO || datosCompletos.fechaISO, res.fechaTexto, res.estado, res.calificacion),
      };
      tutoriasEnMemoria = [resCalculada, ...tutoriasEnMemoria.filter((t) => t.id !== res.id)];
      guardarTutoriasPersistidas(tutoriasEnMemoria);
      return resCalculada;
    }
  } catch (err) {
    errorBackend = err;
    console.error('Error al agendar tutoria en el backend:', err);
  }

  // Si el backend esta disponible pero fallo, re-lanzar el error para que el usuario vea el mensaje
  if (errorBackend) {
    throw errorBackend;
  }

  // Fallback solo si el backend no esta disponible (sin conexion)
  await new Promise((resolver) => setTimeout(resolver, 400));

  const fechaTextoFinal = datosCompletos.fechaTexto || `${datos.diaSemana} ${datos.diaNumero}, ${datos.franjaTexto}`;
  const nuevaTutoria: TutoriaAgendada = {
    id: `tutoria-${Date.now()}`,
    tutorId: datos.tutorId,
    tutorUsuarioId: datos.tutorUsuarioId,
    tutorNombres: datos.tutorNombres,
    tutorApellidos: datos.tutorApellidos,
    tutorIniciales: datos.tutorIniciales,
    tutorSemestreTexto: datos.tutorSemestreTexto,
    tutorAvatar: datosCompletos.tutorAvatar,
    duracionHoras: datosCompletos.duracionHoras,
    precioTotal: datosCompletos.precioTotal,
    fechaISO: datosCompletos.fechaISO,
    fechaTexto: fechaTextoFinal,
    tiempoRestanteTexto: calcularTiempoRestante(datosCompletos.fechaISO, fechaTextoFinal, 'pendiente'),
    lugarTexto:
      datos.modalidad === 'Presencial'
        ? datos.lugarOSede || 'Sede Claustro'
        : 'Virtual - Google Meets',
    materia: datos.materia || 'Cálculo II',
    estado: 'pendiente',
    esVirtual: datos.modalidad === 'Virtual',
    linkReunion:
      datos.modalidad === 'Virtual' ? 'https://meet.google.com/foj-amx-bqp?pli=1&authuser=1' : undefined,
    estudianteId: datosCompletos.estudianteId,
    estudianteNombres: datosCompletos.estudianteNombres,
    estudianteApellidos: datosCompletos.estudianteApellidos,
    estudianteIniciales: datosCompletos.estudianteIniciales,
    estudianteCorreo: datosCompletos.estudianteCorreo,
    estudianteCarrera: datosCompletos.estudianteCarrera,
    estudianteTelefono: datosCompletos.estudianteTelefono,
    estudianteSemestreCompleto: datosCompletos.estudianteSemestreCompleto,
    estudianteAvatar: datosCompletos.estudianteAvatar,
    detalles: datos.detalles,
    nombresArchivos: datos.nombresArchivos,
    archivos: datos.archivos,
    archivosAdjuntos: datos.archivosAdjuntos || datos.archivos,
  };

  tutoriasEnMemoria = [nuevaTutoria, ...tutoriasEnMemoria];
  guardarTutoriasPersistidas(tutoriasEnMemoria);
  return nuevaTutoria;
}
