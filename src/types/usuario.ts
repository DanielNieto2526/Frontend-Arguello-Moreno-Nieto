export const ROLES = ['estudiante', 'tutor', 'admin'] as const;
export type Rol = (typeof ROLES)[number];

export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  clave?: string;
  rol: Rol;
  semestre?: number;
  semestreTexto?: string;
  carrera?: string;
  cursos?: string[]; // Cursos que dicta el tutor
  avatarUrl?: string;
  sede?: string;
  modalidad?: string;
  precioHora?: number;
  descripcion?: string;
  materiaPrincipal?: string;
  telefono?: string;
  diasDisponibles?: string[];
}

export interface CredencialesLogin {
  usuario: string; // Puede ser correo o usuario
  clave: string;
}

export type RegistroEstudiante = Omit<Usuario, 'id' | 'cursos'>;
export type RegistroTutor = Omit<Usuario, 'id'>;

export interface DatosRegistroTutor {
  nombres: string;
  apellidos: string;
  correo: string;
  clave: string;
  carrera: string;
  semestre: number;
  sede: string;
  modalidad: string;
  materiaPrincipal: string;
  cursosAdicionales?: string[];
  precioHora: number;
  descripcion: string;
  diasDisponibles?: string[];
}
