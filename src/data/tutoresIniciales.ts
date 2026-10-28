import type { Tutor, DiaDisponible } from '../types/tutor';

const DIAS_MOCK_DEFECTO: DiaDisponible[] = [
  {
    diaSemana: 'MAR',
    numero: 2,
    disponible: true,
    franjas: [
      { id: 'f-1', texto: '9:00 - 10:30 AM', disponible: true },
      { id: 'f-2', texto: '11:00 - 12:30 PM', disponible: true },
      { id: 'f-3', texto: '2:00 - 3:00 PM', disponible: true },
      { id: 'f-4', texto: '3:00 - 4:00 PM', disponible: false },
    ],
  },
  {
    diaSemana: 'MIE',
    numero: 3,
    disponible: true,
    franjas: [
      { id: 'f-1', texto: '9:00 - 10:30 AM', disponible: false },
      { id: 'f-2', texto: '2:00 - 3:00 PM', disponible: true },
      { id: 'f-3', texto: '3:00 - 4:00 PM', disponible: true },
    ],
  },
  {
    diaSemana: 'JUE',
    numero: 4,
    disponible: true,
    franjas: [
      { id: 'f-1', texto: '10:00 - 11:30 AM', disponible: true },
      { id: 'f-2', texto: '2:00 - 3:00 PM', disponible: true },
    ],
  },
  {
    diaSemana: 'VIE',
    numero: 5,
    disponible: true,
    franjas: [
      { id: 'f-1', texto: '9:00 - 10:30 AM', disponible: true },
      { id: 'f-2', texto: '10:00 - 12:00 PM', disponible: false },
      { id: 'f-3', texto: '2:00 - 3:00 PM', disponible: true },
      { id: 'f-4', texto: '3:00 - 4:00 PM', disponible: true },
    ],
  },
  {
    diaSemana: 'SAB',
    numero: 6,
    disponible: false,
    franjas: [],
  },
  {
    diaSemana: 'LUN',
    numero: 7,
    disponible: true,
    franjas: [
      { id: 'f-1', texto: '8:00 - 9:30 AM', disponible: true },
      { id: 'f-2', texto: '2:00 - 3:30 PM', disponible: true },
    ],
  },
  {
    diaSemana: 'MAR',
    numero: 8,
    disponible: true,
    franjas: [
      { id: 'f-1', texto: '9:00 - 10:30 AM', disponible: true },
      { id: 'f-2', texto: '3:00 - 4:00 PM', disponible: true },
    ],
  },
];

export const TUTORES_INICIALES: Tutor[] = [
  {
    id: 'tutor-1',
    nombres: 'Daniel',
    apellidos: 'Nieto',
    iniciales: 'DN',
    semestreTexto: '6º semestre MACC - claustro',
    sede: 'Claustro',
    modalidad: 'Presencial',
    descripcion:
      'Pase Calculo 2 con promedio de 4.8 fui monitor de planta por 2 semestres. Me apasiona enseñar :D',
    precioHora: 20000,
    precioFormato: '$20.000 x hora',
    materiaPrincipal: 'calculo II',
    estrellas: 4.9,
    diasDisponibles: DIAS_MOCK_DEFECTO,
  },
  {
    id: 'tutor-2',
    nombres: 'Juan',
    apellidos: 'Cespedes',
    iniciales: 'JC',
    semestreTexto: '6º semestre MACC - Claustro',
    sede: 'Claustro',
    modalidad: 'Virtual',
    descripcion:
      'Pase Calculo 2 con promedio de 4.8 fui monitor de planta por 2 semestres. Me apasiona enseñar :D',
    precioHora: 20000,
    precioFormato: '$20.000 x hora',
    materiaPrincipal: 'calculo II',
    estrellas: 4.9,
    diasDisponibles: DIAS_MOCK_DEFECTO,
  },
  {
    id: 'tutor-3',
    nombres: 'Juan',
    apellidos: 'Ditta',
    iniciales: 'JD',
    semestreTexto: '6º semestre MACC - Mutis',
    sede: 'Mutis',
    modalidad: 'Presencial',
    descripcion:
      'Pase Calculo 2 con promedio de 4.8 fui monitor de planta por 2 semestres. Me apasiona enseñar :D',
    precioHora: 20000,
    precioFormato: '$20.000 x hora',
    materiaPrincipal: 'calculo II',
    estrellas: 4.9,
    diasDisponibles: DIAS_MOCK_DEFECTO,
  },
];
