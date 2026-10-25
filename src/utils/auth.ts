import { USUARIOS_INICIALES } from '../data/usuariosIniciales';
import type { Usuario, CredencialesLogin } from '../types/usuario';

const STORAGE_KEY = 'conecta_tutor_user';

export function validarCorreoURosario(correo: string): boolean {
  return correo.trim().toLowerCase().endsWith('@urosario.edu.co');
}

export function autenticarUsuario(credenciales: CredencialesLogin): Usuario | null {
  const input = credenciales.usuario.trim().toLowerCase();
  const clave = credenciales.clave.trim();

  // Buscar por correo o por prefijo antes del arroba
  const usuario = USUARIOS_INICIALES.find((u) => {
    const userPrefix = u.correo.split('@')[0].toLowerCase();
    return (u.correo.toLowerCase() === input || userPrefix === input) && u.clave === clave;
  });

  if (usuario) {
    guardarSesion(usuario);
    return usuario;
  }
  return null;
}

export function guardarSesion(usuario: Usuario): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
  } catch (e) {
    console.error('Error guardando sesión:', e);
  }
}

export function obtenerSesion(): Usuario | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as Usuario) : null;
  } catch {
    return null;
  }
}

export function cerrarSesion(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error cerrando sesión:', e);
  }
}
