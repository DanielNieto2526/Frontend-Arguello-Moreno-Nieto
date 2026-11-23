export type EstadoTutoria = 'pendiente' | 'completada' | 'cancelada';

export interface ArchivoAdjunto {
  nombre: string;
  url?: string;
  tipo?: string;
}

export interface TutoriaAgendada {
  id: string;
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
  fechaTexto: string; // ej: "Miercoles 2, 3:00 - 4:00 PM"
  tiempoRestanteTexto: string; // ej: "En 2 dias", "Ya Tomada"
  lugarTexto: string; // ej: "Virtual - Google Meets", "Casur 311 - Claustro"
  materia: string; // ej: "calculo II", "Analisis Real"
  modalidad?: string;
  franjaTexto?: string;
  diaSemana?: string;
  diaNumero?: number;
  mes?: string;
  año?: number;
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
  archivos?: ArchivoAdjunto[];
  archivosAdjuntos?: ArchivoAdjunto[];
  calificacion?: number;
  comentarioEstudiante?: string;
}
