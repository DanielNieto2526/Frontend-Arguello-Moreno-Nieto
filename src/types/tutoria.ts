export type EstadoTutoria = 'pendiente' | 'completada' | 'cancelada';

export interface TutoriaAgendada {
  id: string;
  tutorId: string;
  tutorNombres: string;
  tutorApellidos: string;
  tutorIniciales: string;
  tutorSemestreTexto: string;
  fechaTexto: string; // ej: "Miercoles 2, 3:00 - 4:00 PM"
  tiempoRestanteTexto: string; // ej: "En 2 dias", "En 70 dias", "Ya Tomada"
  lugarTexto: string; // ej: "Laboratorio 1 - Mutis", "Casur 311 - Claustro", "Virtual • Google Meets"
  materia: string; // ej: "calculo II", "Ing Datos", "Analisis Real"
  estado: EstadoTutoria;
  esVirtual?: boolean;
  linkReunion?: string; // ej: "https://meet.google.com/abc-defg-hij"
  puedeCalificar?: boolean;
}
