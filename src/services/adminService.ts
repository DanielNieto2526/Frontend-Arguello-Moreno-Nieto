import type { Tutor } from '../types/tutor';
import { TUTORES_INICIALES } from '../data/tutoresIniciales';
import {
  obtenerTutoresPersistidos,
  guardarTodosLosTutoresPersistidos,
} from './tutoresService';
import { actualizarUsuarioLocal } from '../utils/auth';

const STORAGE_SOLICITUDES_INICIALES_KEY = 'conecta_tutor_admin_solicitudes_v1';

export const SOLICITUDES_INICIALES_ADMIN: Tutor[] = [
  {
    id: 'tutor-sol-1',
    nombres: 'Camilo Andres',
    apellidos: 'Torres',
    iniciales: 'CT',
    correo: 'camilo.torres@urosario.edu.co',
    semestreTexto: '5º semestre MACC - Claustro',
    sede: 'Claustro',
    modalidad: 'Presencial',
    materiaPrincipal: 'Calculo I',
    notaMateria: 4.8,
    promedioAcumulado: 4.4,
    precioHora: 20000,
    precioFormato: '$20.000 x hora',
    descripcion:
      'Monitor de Cálculo I con énfasis en límites, derivadas y problemas de optimización. Gran vocación pedagógica.',
    estrellas: 5.0,
    estadoAprobacion: 'pendiente',
    activo: false,
    soporteNotasNombre: 'historial_academico_camilo_torres.pdf',
    fechaRegistro: '15/11/2026',
    cursos: ['Calculo I', 'Precalculo'],
  },
  {
    id: 'tutor-sol-2',
    nombres: 'Laura Sofia',
    apellidos: 'Bermudez',
    iniciales: 'LB',
    correo: 'laura.bermudez@urosario.edu.co',
    semestreTexto: '6º semestre ISE - Mutis',
    sede: 'Mutis',
    modalidad: 'Híbrida',
    materiaPrincipal: 'Estructuras de Datos',
    notaMateria: 4.6,
    promedioAcumulado: 4.3,
    precioHora: 20000,
    precioFormato: '$20.000 x hora',
    descripcion:
      'Monitora con experiencia en árboles binarios, grafos y algoritmos de búsqueda y ordenamiento.',
    estrellas: 5.0,
    estadoAprobacion: 'pendiente',
    activo: false,
    soporteNotasNombre: 'sabana_notas_laura_bermudez.pdf',
    fechaRegistro: '16/11/2026',
    cursos: ['Estructuras de Datos', 'Programación Orientada a Objetos'],
  },
];

function inicializarSolicitudesSiEsNecesario(): void {
  try {
    const data = localStorage.getItem(STORAGE_SOLICITUDES_INICIALES_KEY);
    if (!data) {
      const tutoresPersistidos = obtenerTutoresPersistidos();
      const idsExistentes = new Set(tutoresPersistidos.map((t) => t.id));
      const faltantes = SOLICITUDES_INICIALES_ADMIN.filter((s) => !idsExistentes.has(s.id));
      if (faltantes.length > 0) {
        guardarTodosLosTutoresPersistidos([...tutoresPersistidos, ...faltantes]);
      }
      localStorage.setItem(STORAGE_SOLICITUDES_INICIALES_KEY, 'inicializado');
    }
  } catch (e) {
    console.error('Error inicializando solicitudes:', e);
  }
}

// Inicializar al cargar el servicio
inicializarSolicitudesSiEsNecesario();

export async function obtenerTodasLasSolicitudesAdmin(): Promise<Tutor[]> {
  await new Promise((resolver) => setTimeout(resolver, 200));

  const persistidos = obtenerTutoresPersistidos();
  const mapaTutores = new Map<string, Tutor>();

  // Cargar tutores iniciales con estado 'aprobado' y 'activo: true' por defecto si no tienen
  TUTORES_INICIALES.forEach((t) => {
    mapaTutores.set(t.id, {
      ...t,
      estadoAprobacion: t.estadoAprobacion || 'aprobado',
      activo: t.activo !== undefined ? t.activo : true,
      notaMateria: t.notaMateria || 4.8,
      soporteNotasNombre: t.soporteNotasNombre || 'certificado_oficial.pdf',
    });
  });

  // Sobrescribir o añadir los persistidos
  persistidos.forEach((t) => {
    mapaTutores.set(t.id, t);
  });

  return Array.from(mapaTutores.values());
}

export async function obtenerSolicitudesPendientes(): Promise<Tutor[]> {
  const todos = await obtenerTodasLasSolicitudesAdmin();
  return todos.filter((t) => t.estadoAprobacion === 'pendiente');
}

export async function obtenerTutoresParaGestion(): Promise<Tutor[]> {
  const todos = await obtenerTodasLasSolicitudesAdmin();
  // Los tutores para gestión son los que han sido aprobados
  return todos.filter((t) => t.estadoAprobacion === 'aprobado');
}

export async function aprobarTutor(id: string): Promise<Tutor> {
  await new Promise((resolver) => setTimeout(resolver, 250));

  const persistidos = obtenerTutoresPersistidos();
  let tutorModificado: Tutor | null = null;

  const actualizados = persistidos.map((t) => {
    if (t.id === id) {
      tutorModificado = {
        ...t,
        estadoAprobacion: 'aprobado',
        activo: true,
      };
      return tutorModificado;
    }
    return t;
  });

  if (!tutorModificado) {
    // Si era uno de TUTORES_INICIALES
    const inicial = TUTORES_INICIALES.find((t) => t.id === id);
    if (inicial) {
      tutorModificado = {
        ...inicial,
        estadoAprobacion: 'aprobado',
        activo: true,
      };
      actualizados.push(tutorModificado);
    }
  }

  guardarTodosLosTutoresPersistidos(actualizados);

  // Actualizar en usuarios locales
  actualizarUsuarioLocal(id, {
    estadoAprobacion: 'aprobado',
    activo: true,
  });

  if (!tutorModificado) {
    throw new Error(`Tutor con ID ${id} no encontrado.`);
  }

  return tutorModificado;
}

export async function rechazarTutor(id: string, motivo: string = 'No cumple con los requisitos académicos mínimos'): Promise<Tutor> {
  await new Promise((resolver) => setTimeout(resolver, 250));

  const persistidos = obtenerTutoresPersistidos();
  let tutorModificado: Tutor | null = null;

  const actualizados = persistidos.map((t) => {
    if (t.id === id) {
      tutorModificado = {
        ...t,
        estadoAprobacion: 'rechazado',
        activo: false,
        motivoRechazo: motivo,
      };
      return tutorModificado;
    }
    return t;
  });

  guardarTodosLosTutoresPersistidos(actualizados);

  actualizarUsuarioLocal(id, {
    estadoAprobacion: 'rechazado',
    activo: false,
    motivoRechazo: motivo,
  });

  if (!tutorModificado) {
    throw new Error(`Tutor con ID ${id} no encontrado.`);
  }

  return tutorModificado;
}

export async function alternarEstadoTutor(id: string, nuevoEstadoActivo: boolean): Promise<Tutor> {
  await new Promise((resolver) => setTimeout(resolver, 250));

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

  if (!tutorModificado) {
    const inicial = TUTORES_INICIALES.find((t) => t.id === id);
    if (inicial) {
      tutorModificado = {
        ...inicial,
        activo: nuevoEstadoActivo,
        estadoAprobacion: 'aprobado',
      };
      actualizados.push(tutorModificado);
    }
  }

  guardarTodosLosTutoresPersistidos(actualizados);

  actualizarUsuarioLocal(id, {
    activo: nuevoEstadoActivo,
  });

  if (!tutorModificado) {
    throw new Error(`Tutor con ID ${id} no encontrado.`);
  }

  return tutorModificado;
}
