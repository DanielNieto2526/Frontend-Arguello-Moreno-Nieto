import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { RegisterStudent } from './pages/RegistroEstudiante';
import { ExplorarTutores } from './pages/ExplorarTutores';
import type { Usuario } from './types/usuario';
import { obtenerSesion, cerrarSesion } from './utils/auth';
import './App.css';

const TITULO_SITIO = 'Aprende con ConectaTutor';
const SUBTITULO_SITIO = 'De estudiantes para estudiantes';

/**
 * Envoltorio para la pantalla de inicio de sesión
 */
function LoginWrapper() {
  const navigate = useNavigate();

  const handleLoginSuccess = (user: Usuario) => {
    if (user.rol === 'admin') {
      navigate('/admin');
    } else if (user.rol === 'tutor') {
      navigate('/tutor/tutorias');
    } else {
      navigate('/app/explorar');
    }
  };

  return (
    <Login
      titulo={TITULO_SITIO}
      subtitulo={SUBTITULO_SITIO}
      onLoginSuccess={handleLoginSuccess}
      onNavigateToRegisterStudent={() => navigate('/registro/estudiante')}
      onNavigateToRegisterTutor={() => navigate('/registro/tutor')}
    />
  );
}

/**
 * Vista de demostración para rutas en desarrollo
 */
function PlaceholderView({ titulo, rolEsperado }: { titulo: string; rolEsperado: string }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(() => obtenerSesion());

  const handleCerrarSesion = () => {
    cerrarSesion();
    setUsuario(null);
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ color: 'var(--Vino-tinto)', marginBottom: '16px' }}>{titulo}</h1>
      <p style={{ color: 'var(--Rojo-aux)', marginBottom: '24px' }}>
        Pantalla en desarrollo para el rol: <strong>{rolEsperado}</strong>
      </p>
      {usuario && (
        <div style={{ background: 'var(--Gris-fondo)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
          <p><strong>Usuario activo:</strong> {usuario.nombres} {usuario.apellidos}</p>
          <p><strong>Correo:</strong> {usuario.correo}</p>
          <p><strong>Rol:</strong> {usuario.rol}</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{
            padding: '10px 20px',
            background: 'var(--Naranja-boton)',
            color: 'var(--Vino-tinto)',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Volver al Login
        </button>
        {usuario && (
          <button
            type="button"
            onClick={handleCerrarSesion}
            style={{
              padding: '10px 20px',
              background: 'var(--Vino-tinto)',
              color: 'var(--Blanco)',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Cerrar Sesión
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * COMPONENTE RAÍZ: define el enrutamiento general y pasa props a los componentes
 */
export function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* Rutas públicas de autenticación */}
          <Route path="/" element={<LoginWrapper />} />
          <Route path="/login" element={<LoginWrapper />} />
          <Route
            path="/registro/estudiante"
            element={<RegisterStudent />}
          />
          <Route
            path="/registro/tutor"
            element={<PlaceholderView titulo="Registro de Tutor" rolEsperado="Público / Tutor" />}
          />

          {/* Rutas de Estudiante */}
          <Route path="/app/explorar" element={<ExplorarTutores />} />
          <Route
            path="/app/tutorias"
            element={<PlaceholderView titulo="Mis Tutorías" rolEsperado="estudiante" />}
          />

          {/* Rutas de Tutor */}
          <Route
            path="/tutor/tutorias"
            element={<PlaceholderView titulo="Tutorías Asignadas" rolEsperado="tutor" />}
          />

          {/* Rutas de Administrador */}
          <Route
            path="/admin"
            element={<PlaceholderView titulo="Dashboard Administrador" rolEsperado="admin" />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
