import type { Usuario, CredencialesLogin } from '../types/usuario';
import { autenticarUsuario, cerrarSesion, obtenerSesion, guardarSesion, registrarUsuarioLocal } from '../utils/auth';
import { solicitar } from './api';

const RUTA = '/auth';

export async function login(credenciales: CredencialesLogin): Promise<Usuario> {
  try {
    const sesion = await solicitar<Usuario>(`${RUTA}/login`, {
      method: 'POST',
      body: JSON.stringify(credenciales),
    });
    if (sesion) {
      guardarSesion(sesion);
      registrarUsuarioLocal(sesion);
    }
    return sesion;
  } catch (error: unknown) {
    // Si el error tiene código de estado (400, 401, 403 por pendiente/rechazado), propagar el error del backend!
    if (error && typeof error === 'object' && 'status' in error && (error as any).status !== 0) {
      throw error;
    }
    // Solo si el servidor está apagado (status 0), validar contra almacenamiento local
    await new Promise((resolver) => setTimeout(resolver, 300));
    const sesion = autenticarUsuario(credenciales);
    if (!sesion) {
      throw new Error('Credenciales inválidas. Verifica tu usuario y clave.');
    }
    return sesion;
  }
}

export function logout(): void {
  cerrarSesion();
}

export function obtenerSesionActual(): Usuario | null {
  return obtenerSesion();
}

export async function registrarEstudiante(
  datos: Partial<Usuario> & { clave: string }
): Promise<Usuario> {
  try {
    const nuevo = await solicitar<Usuario>(`${RUTA}/registro/estudiante`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    if (nuevo) {
      guardarSesion(nuevo);
      registrarUsuarioLocal(nuevo);
    }
    return nuevo;
  } catch (error: unknown) {
    console.error('Error al registrar estudiante en el backend:', error);
    throw error;
  }
}

export async function actualizarPerfilUsuario(
  id: string,
  cambios: Partial<Usuario>
): Promise<Usuario> {
  try {
    const usuarioActualizado = await solicitar<Usuario>(`/usuarios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cambios),
    });
    if (usuarioActualizado) {
      guardarSesion(usuarioActualizado);
      registrarUsuarioLocal(usuarioActualizado);
    }
    return usuarioActualizado;
  } catch (err) {
    console.error('Error al actualizar perfil de usuario en el backend:', err);
    throw err;
  }
}
