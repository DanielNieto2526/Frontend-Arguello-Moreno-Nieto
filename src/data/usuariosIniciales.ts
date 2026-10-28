import type { Usuario } from '../types/usuario';

export const USUARIOS_INICIALES: Usuario[] = [
  {
    id: '1',
    nombres: 'Daniela',
    apellidos: 'Moreno',
    correo: 'dmoreno@urosario.edu.co',
    clave: 'conecta2026',
    rol: 'estudiante',
    carrera: 'Ingeniería de Sistemas',
    semestre: 6,
  },
  {
    id: '2',
    nombres: 'Daniel',
    apellidos: 'Nieto',
    correo: 'dnieto@urosario.edu.co',
    clave: 'conecta2026',
    rol: 'tutor',
    carrera: 'Matematicas Aplicadas y Ciencias de la Computacion',
    semestre: 6,
    semestreTexto: '6º semestre MACC - Claustro',
    cursos: ['Calculo II', 'Variable Compleja', 'Analisis Real'],
    sede: 'Claustro',
    modalidad: 'Híbrida',
    precioHora: 20000,
    descripcion:
      'Sé lo retador que es el paso de Cálculo I a Cálculo II y Álgebra Lineal en los primeros semestres de ingeniería y ciencias. Fui monitor oficial de planta durante 4 semestres consecutivos y comprendo exactamente los errores típicos de parcial y dónde se confunden los conceptos teóricos.',
    diasDisponibles: ['LU', 'MA', 'MI'],
  },
  {
    id: '3',
    nombres: 'Coordinador',
    apellidos: 'URosario',
    correo: 'coord@urosario.edu.co',
    clave: 'conecta2026',
    rol: 'admin',
  },
];
