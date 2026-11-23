import { solicitar } from './api';

export interface Resena {
  id: string;
  tutorId: string;
  tutorNombres?: string;
  tutoriaId?: string;
  autor: string;
  calificacion: number;
  pregunta1?: number;
  pregunta2?: number;
  pregunta3?: number;
  pregunta4?: number;
  comentario: string;
  fecha: string;
}

const STORAGE_RESENAS_KEY = 'conecta_tutor_resenas_v1';

export const RESENAS_INICIALES: Resena[] = [
  {
    id: 'res-dn-1',
    tutorId: '2',
    tutorNombres: 'Daniel Nieto',
    autor: 'Mariana Fuentes',
    calificacion: 5,
    pregunta1: 5,
    pregunta2: 5,
    pregunta3: 5,
    pregunta4: 5,
    comentario:
      'Daniel explica con mucha paciencia. Tenía un bloqueo total con cambio de coordenadas polares y en solo hora y media logré resolver los ejercicios del taller que caían fijo en el examen. Saqué 4.6 en el parcial. Súper recomendado.',
    fecha: 'Hace 3 días',
  },
  {
    id: 'res-jc-1',
    tutorId: 'tutor-jc',
    tutorNombres: 'Juan Cachon',
    autor: 'Carlos Mendoza',
    calificacion: 5,
    pregunta1: 5,
    pregunta2: 5,
    pregunta3: 5,
    pregunta4: 5,
    comentario:
      'Excelente tutoría de Cálculo II. Me ayudó a entender integración por partes y sustitución trigonométrica en una sola sesión.',
    fecha: 'Hace 5 días',
  },
  {
    id: 'res-ga-1',
    tutorId: 'tutor-ga',
    tutorNombres: 'Gabriela Arevalo',
    autor: 'Valentina Ríos',
    calificacion: 5,
    pregunta1: 5,
    pregunta2: 5,
    pregunta3: 5,
    pregunta4: 5,
    comentario:
      'Muy clara en la explicación de bases de datos relacionales y optimización de consultas SQL.',
    fecha: 'Hace 1 semana',
  },
];

function cargarResenasPersistidas(): Resena[] {
  try {
    const data = localStorage.getItem(STORAGE_RESENAS_KEY);
    if (data) {
      const parsed = JSON.parse(data) as Resena[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error cargando reseñas de localStorage:', e);
  }
  return [...RESENAS_INICIALES];
}

function guardarResenasPersistidas(lista: Resena[]): void {
  try {
    localStorage.setItem(STORAGE_RESENAS_KEY, JSON.stringify(lista));
  } catch (e) {
    console.error('Error guardando reseñas en localStorage:', e);
  }
}

let resenasEnMemoria: Resena[] = cargarResenasPersistidas();

export function esMismoTutor(
  tutorAId: string,
  tutorBId?: string,
  tutorBNombres?: string
): boolean {
  if (!tutorAId) return false;
  if (tutorBId && tutorAId === tutorBId) return true;

  // Aliases para Daniel Nieto
  const esDanielA =
    tutorAId === '2' ||
    tutorAId === 'tutor-1' ||
    tutorAId.toLowerCase() === 'daniel nieto';
  const esDanielB =
    tutorBId === '2' ||
    tutorBId === 'tutor-1' ||
    (tutorBNombres && tutorBNombres.toLowerCase().trim() === 'daniel nieto');
  if (esDanielA && esDanielB) return true;

  // Aliases para Juan Cachon
  const esCachonA =
    tutorAId === 'tutor-jc' ||
    tutorAId === 'tutor-2' ||
    tutorAId.toLowerCase().includes('cachon');
  const esCachonB =
    tutorBId === 'tutor-jc' ||
    tutorBId === 'tutor-2' ||
    (tutorBNombres && tutorBNombres.toLowerCase().includes('cachon'));
  if (esCachonA && esCachonB) return true;

  // Aliases para Gabriela Arevalo
  const esArevaloA =
    tutorAId === 'tutor-ga' ||
    tutorAId === 'tutor-4' ||
    tutorAId.toLowerCase().includes('arevalo');
  const esArevaloB =
    tutorBId === 'tutor-ga' ||
    tutorBId === 'tutor-4' ||
    (tutorBNombres && tutorBNombres.toLowerCase().includes('arevalo'));
  if (esArevaloA && esArevaloB) return true;

  if (tutorBNombres && tutorAId.toLowerCase() === tutorBNombres.toLowerCase().trim()) {
    return true;
  }

  return false;
}

export function obtenerTodasLasResenas(): Resena[] {
  return [...resenasEnMemoria];
}

export async function obtenerResenasPorTutorAsync(
  tutorId: string,
  tutorNombres?: string
): Promise<Resena[]> {
  try {
    const params = new URLSearchParams();
    if (tutorNombres) params.append('tutorNombres', tutorNombres);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await solicitar<Resena[]>(`/resenas/tutor/${encodeURIComponent(tutorId)}${query}`);
    if (Array.isArray(res) && res.length > 0) {
      const idsExistentes = new Set(res.map((r) => r.id));
      resenasEnMemoria = [
        ...res,
        ...resenasEnMemoria.filter((r) => !idsExistentes.has(r.id)),
      ];
      guardarResenasPersistidas(resenasEnMemoria);
      return res;
    }
  } catch {
    // fallback
  }
  return obtenerResenasPorTutor(tutorId, tutorNombres);
}

export function obtenerResenasPorTutor(
  tutorId: string,
  tutorNombres?: string
): Resena[] {
  return resenasEnMemoria.filter((r) =>
    esMismoTutor(r.tutorId, tutorId, tutorNombres)
  );
}

export function calcularPromedioTutor(
  tutorId: string,
  tutorNombres?: string
): { promedio: number; total: number; estrellas: number } {
  const lista = obtenerResenasPorTutor(tutorId, tutorNombres);
  if (lista.length === 0) {
    return { promedio: 5.0, total: 0, estrellas: 5 };
  }

  const suma = lista.reduce((acc, r) => acc + (Number(r.calificacion) || 5), 0);
  const promedioCrudo = suma / lista.length;
  const promedio = Math.round(promedioCrudo * 10) / 10;
  const estrellas = Math.max(1, Math.min(5, Math.round(promedio)));

  return { promedio, total: lista.length, estrellas };
}

export async function guardarNuevaResena(
  datos: Omit<Resena, 'id' | 'fecha'>
): Promise<Resena> {
  const idTemporal = `res-${Date.now()}`;
  const payload = {
    ...datos,
    id: idTemporal,
    fecha: 'Hoy',
  };

  try {
    const res = await solicitar<Resena>('/resenas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res && res.id) {
      resenasEnMemoria = [res, ...resenasEnMemoria.filter((r) => r.id !== res.id)];
      guardarResenasPersistidas(resenasEnMemoria);
      return res;
    }
  } catch {
    // fallback
  }

  const nuevaResena: Resena = {
    ...payload,
  };
  resenasEnMemoria = [nuevaResena, ...resenasEnMemoria];
  guardarResenasPersistidas(resenasEnMemoria);
  return nuevaResena;
}
