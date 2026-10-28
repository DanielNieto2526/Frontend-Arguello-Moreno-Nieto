import type { Tutor, DiaDisponible } from '../types/tutor';
import type { DatosRegistroTutor, Usuario } from '../types/usuario';
import { TUTORES_INICIALES } from '../data/tutoresIniciales';
import { solicitar } from './api';
import { registrarUsuarioLocal } from '../utils/auth';

const RUTA = '/tutores';
const STORAGE_TUTORES_KEY = 'conecta_tutor_nuevos_tutores';

function obtenerTutoresPersistidos(): Tutor[] {
  try {
    const data = localStorage.getItem(STORAGE_TUTORES_KEY);
    return data ? (JSON.parse(data) as Tutor[]) : [];
  } catch {
    return [];
  }
}

function guardarTutorPersistido(tutor: Tutor): void {
  try {
    const lista = obtenerTutoresPersistidos();
    const filtrada = lista.filter((t) => t.id !== tutor.id);
    filtrada.push(tutor);
    localStorage.setItem(STORAGE_TUTORES_KEY, JSON.stringify(filtrada));
  } catch (e) {
    console.error('Error guardando tutor persistido:', e);
  }
}

function generarDiasDisponibles(diasSeleccionados: string[] = ['LUN', 'MIE', 'VIE']): DiaDisponible[] {
  const dias = ['MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'LUN', 'MAR'];
  const numeros = [2, 3, 4, 5, 6, 7, 8];
  return dias.map((dia, idx) => {
    const seleccionado = diasSeleccionados.includes(dia);
    return {
      diaSemana: dia,
      numero: numeros[idx],
      disponible: seleccionado,
      franjas: seleccionado
        ? [
            { id: `f-${idx}-1`, texto: '9:00 - 10:30 AM', disponible: true },
            { id: `f-${idx}-2`, texto: '2:00 - 3:00 PM', disponible: true },
            { id: `f-${idx}-3`, texto: '3:00 - 4:00 PM', disponible: true },
          ]
        : [],
    };
  });
}

/**
 * Servicio de tutores de la API.
 * Los componentes llaman a estas funciones.
 */

export async function obtenerTutores(): Promise<Tutor[]> {
  try {
    return await solicitar<Tutor[]>(RUTA);
  } catch {
    // simulamos 500ms de latencia de red para reflejar los estados de carga.
    await new Promise((resolver) => setTimeout(resolver, 500));
    const tutoresPersistidos = obtenerTutoresPersistidos();
    return [...tutoresPersistidos, ...TUTORES_INICIALES];
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
    return await solicitar<{ usuario: Usuario; tutor: Tutor }>(`${RUTA}/registro`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 600));

    const idTutor = `tutor-${Date.now()}`;
    const idUsuario = `user-tutor-${Date.now()}`;
    const iniciales = `${datos.nombres.charAt(0)}${datos.apellidos.charAt(0)}`.toUpperCase();
    const semestreTexto = `${datos.semestre}º semestre ${datos.carrera} - ${datos.sede.toLowerCase()}`;
    const precioFormato = `$${Number(datos.precioHora).toLocaleString('es-CO')} x hora`;

    const nuevoTutor: Tutor = {
      id: idTutor,
      nombres: datos.nombres.trim(),
      apellidos: datos.apellidos.trim(),
      iniciales,
      semestreTexto,
      sede: datos.sede,
      modalidad: datos.modalidad,
      descripcion: datos.descripcion.trim(),
      precioHora: Number(datos.precioHora),
      precioFormato,
      materiaPrincipal: datos.materiaPrincipal.trim(),
      estrellas: 5.0,
      diasDisponibles: generarDiasDisponibles(datos.diasDisponibles),
      cursos: [
        datos.materiaPrincipal.trim(),
        ...(datos.cursosAdicionales || []).map((c) => c.trim()),
      ],
      correo: datos.correo.trim().toLowerCase(),
      activo: true,
    };

    const nuevoUsuario: Usuario = {
      id: idUsuario,
      nombres: datos.nombres.trim(),
      apellidos: datos.apellidos.trim(),
      correo: datos.correo.trim().toLowerCase(),
      clave: datos.clave,
      rol: 'tutor',
      carrera: datos.carrera,
      semestre: datos.semestre,
      cursos: nuevoTutor.cursos,
      sede: datos.sede,
      modalidad: datos.modalidad,
      precioHora: Number(datos.precioHora),
      descripcion: datos.descripcion.trim(),
      materiaPrincipal: datos.materiaPrincipal.trim(),
    };

    // Guardar en persistencia local
    guardarTutorPersistido(nuevoTutor);
    registrarUsuarioLocal(nuevoUsuario);

    return { usuario: nuevoUsuario, tutor: nuevoTutor };
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
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 300));
    const tutores = obtenerTutoresPersistidos();
    const index = tutores.findIndex((t) => t.id === tutorId);
    if (index !== -1) {
      tutores[index].activo = activo;
      localStorage.setItem(STORAGE_TUTORES_KEY, JSON.stringify(tutores));
    }
  }
}
