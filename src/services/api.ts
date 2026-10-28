/**
 * Cliente HTTP de la aplicación .
 * Centraliza fetch: URL base, encabezados, conversión a JSON y manejo de errores.
 */

// La URL de la API se lee de las variables de entorno (archivo .env).
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/** Error con la información que devuelve el backend: { mensaje, errores? } */
export class ApiError extends Error {
  status: number;
  errores: string[];
  mensaje: string;

  constructor(status: number, mensaje: string, errores: string[] = []) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status; // 0 significa "no hubo respuesta del servidor"
    this.errores = errores;
    this.mensaje = mensaje;
  }
}

interface RespuestaDeError {
  mensaje?: string;
  errores?: string[];
}

/**
 * Función central para todas las peticiones HTTP del frontend.
 * - Resuelve concatenar URL base
 * - Añade encabezado Content-Type: application/json al enviar cuerpo
 * - Valida respuesta.ok y levanta ApiError con formato del servidor
 * - Soporta status 204 (No Content)
 * - Captura errores de red (status 0)
 */
export async function solicitar<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;

  const headers = new Headers(opciones.headers);
  if (opciones.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const respuesta = await fetch(url, { ...opciones, headers });

    // 204 No Content: no hay cuerpo
    if (respuesta.status === 204) {
      return undefined as T;
    }

    if (!respuesta.ok) {
      let mensaje = `Error ${respuesta.status}: ${respuesta.statusText}`;
      let errores: string[] = [];

      try {
        const errorJson = (await respuesta.json()) as RespuestaDeError;
        if (errorJson.mensaje) mensaje = errorJson.mensaje;
        if (errorJson.errores) errores = errorJson.errores;
      } catch {
        // La respuesta no era JSON
      }

      throw new ApiError(respuesta.status, mensaje, errores);
    }

    return (await respuesta.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Error de red, CORS o servidor apagado
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica tu conexión.');
  }
}

/**
 * Función para obtener un mensaje de cualquier error capturado.
 */
export function obtenerMensajeDeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.mensaje;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado al procesar la solicitud.';
}
