import type { Usuario, CredencialesLogin } from '../types/usuario';
import { autenticarUsuario, cerrarSesion, obtenerSesion } from '../utils/auth';
import { solicitar } from './api';

const RUTA = '/auth';

export async function login(credenciales: CredencialesLogin): Promise<Usuario> {
  try {
    return await solicitar<Usuario>(`${RUTA}/login`, {
      method: 'POST',
      body: JSON.stringify(credenciales),
    });
  } catch {
    // Modo demostración: valida contra el local
    await new Promise((resolver) => setTimeout(resolver, 400));
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
