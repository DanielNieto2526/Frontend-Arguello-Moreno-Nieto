import { USUARIOS_INICIALES } from '../data/usuariosIniciales';
import type { Usuario, CredencialesLogin } from '../types/usuario';

const STORAGE_KEY = 'conecta_tutor_user';
const USUARIOS_REGISTRADOS_KEY = 'conecta_tutor_usuarios_registrados';

export function validarCorreoURosario(correo: string): boolean {
  return correo.trim().toLowerCase().endsWith('@urosario.edu.co');
}

export function obtenerUsuariosRegistrados(): Usuario[] {
  try {
    const data = localStorage.getItem(USUARIOS_REGISTRADOS_KEY);
    return data ? (JSON.parse(data) as Usuario[]) : [];
  } catch {
    return [];
  }
}

export function registrarUsuarioLocal(usuario: Usuario): void {
  try {
    const existentes = obtenerUsuariosRegistrados();
    const filtrados = existentes.filter(
      (u) => u.correo.toLowerCase() !== usuario.correo.toLowerCase() && u.id !== usuario.id
    );
    filtrados.push(usuario);
    localStorage.setItem(USUARIOS_REGISTRADOS_KEY, JSON.stringify(filtrados));
  } catch (e) {
    console.error('Error guardando usuario registrado:', e);
  }
}

export function actualizarUsuarioLocal(idOrCorreo: string, updates: Partial<Usuario>): void {
  try {
    const existentes = obtenerUsuariosRegistrados();
    const index = existentes.findIndex(
      (u) => u.id === idOrCorreo || u.correo.toLowerCase() === idOrCorreo.toLowerCase()
    );
    if (index !== -1) {
      existentes[index] = { ...existentes[index], ...updates };
      localStorage.setItem(USUARIOS_REGISTRADOS_KEY, JSON.stringify(existentes));
    } else {
      // Si era de USUARIOS_INICIALES, lo agregamos a registrados con los updates
      const inicial = USUARIOS_INICIALES.find(
        (u) => u.id === idOrCorreo || u.correo.toLowerCase() === idOrCorreo.toLowerCase()
      );
      if (inicial) {
        existentes.push({ ...inicial, ...updates });
        localStorage.setItem(USUARIOS_REGISTRADOS_KEY, JSON.stringify(existentes));
      }
    }
  } catch (e) {
    console.error('Error actualizando usuario registrado:', e);
  }
}

export function obtenerListaUsuarios(): Usuario[] {
  const registrados = obtenerUsuariosRegistrados();
  const correosRegistrados = new Set(registrados.map((u) => u.correo.toLowerCase()));
  const inicialesFiltrados = USUARIOS_INICIALES.filter(
    (u) => !correosRegistrados.has(u.correo.toLowerCase())
  );
  return [...inicialesFiltrados, ...registrados];
}

export function autenticarUsuario(credenciales: CredencialesLogin): Usuario | null {
  const input = credenciales.usuario.trim().toLowerCase();
  const clave = credenciales.clave.trim();
  const listaUsuarios = obtenerListaUsuarios();

  // Buscar por correo o por prefijo antes del arroba
  const usuario = listaUsuarios.find((u) => {
    const userPrefix = u.correo.split('@')[0].toLowerCase();
    return (u.correo.toLowerCase() === input || userPrefix === input) && u.clave === clave;
  });

  if (usuario) {
    if (usuario.rol === 'tutor') {
      if (usuario.estadoAprobacion === 'pendiente') {
        throw new Error('Tu postulación como tutor aún se encuentra en revisión por el comité académico. Podrás ingresar una vez sea aprobada por la coordinación.');
      }
      if (usuario.estadoAprobacion === 'rechazado') {
        throw new Error('Tu postulación como tutor fue rechazada. No tienes acceso a la plataforma.');
      }
    }
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
