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
  carrera?: string;
  cursos?: string[]; // Cursos que dicta el tutor
  avatarUrl?: string;
}

export interface CredencialesLogin {
  usuario: string; // Puede ser correo o usuario
  clave: string;
}

export type RegistroEstudiante = Omit<Usuario, 'id' | 'cursos'>;
export type RegistroTutor = Omit<Usuario, 'id'>;
