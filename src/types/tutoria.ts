export type EstadoTutoria = 'pendiente' | 'completada' | 'cancelada';

export interface TutoriaAgendada {
  id: string;
  tutorId: string;
  tutorNombres: string;
  tutorApellidos: string;
  tutorIniciales: string;
  tutorSemestreTexto: string;
  fechaTexto: string; // ej: "Miercoles 2, 3:00 - 4:00 PM"
  tiempoRestanteTexto: string; // ej: "En 2 dias", "Ya Tomada"
  lugarTexto: string; // ej: "Virtual - Google Meets", "Casur 311 - Claustro"
  materia: string; // ej: "calculo II", "Analisis Real"
  estado: EstadoTutoria;
  esVirtual?: boolean;
  linkReunion?: string; // ej: "https://meet.google.com/abc-defg-hij"
  puedeCalificar?: boolean;
  estudianteId?: string;
  estudianteNombres?: string;
  estudianteApellidos?: string;
  estudianteIniciales?: string;
  estudianteCorreo?: string;
  estudianteTelefono?: string;
  estudianteCarrera?: string;
  estudianteSemestreCompleto?: string;
  estudianteAvatar?: string;
  detalles?: string;
  nombresArchivos?: string[];
  calificacion?: number;
  comentarioEstudiante?: string;
}
