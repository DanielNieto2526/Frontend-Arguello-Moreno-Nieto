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
    nombres: 'David',
    apellidos: 'Nieto',
    correo: 'dnieto@urosario.edu.co',
    clave: 'conecta2026',
    rol: 'tutor',
    carrera: 'Ingeniería de Sistemas',
    semestre: 8,
    cursos: ['Estructuras de Datos', 'Desarrollo Web', 'Bases de Datos'],
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
