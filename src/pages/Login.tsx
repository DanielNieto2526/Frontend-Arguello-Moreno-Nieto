import { useState } from 'react';
import type { FormEvent } from 'react';
import './Login.css';
import loginHeroImg from '../assets/login.png';
import formaLoginImg from '../assets/formaLogin.svg';
import { autenticarUsuario } from '../utils/auth';
import type { Usuario } from '../types/usuario';
import { Button } from '../components/Button';

export interface LoginProps {
  titulo?: string;
  subtitulo?: string;
  onLoginSuccess?: (usuario: Usuario) => void;
  onNavigateToRegisterStudent?: () => void;
  onNavigateToRegisterTutor?: () => void;
}

export function Login({
  titulo = 'Aprende con ConectaTutor',
  subtitulo = 'De estudiantes para estudiantes',
  onLoginSuccess,
  onNavigateToRegisterStudent,
  onNavigateToRegisterTutor,
}: LoginProps) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Divide el título para aplicar el color naranja a la palabra "Tutor"
  const renderTitulo = () => {
    if (titulo.includes('ConectaTutor')) {
      const partes = titulo.split('ConectaTutor');
      return (
        <h1 className="login-title">
          {partes[0]}Conecta
          <span className="login-title-highlight">Tutor</span>
          {partes[1]}
        </h1>
      );
    }
    return <h1 className="login-title">{titulo}</h1>;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    if (!usuario.trim() || !clave.trim()) {
      setError('Por favor ingresa tu usuario y clave.');
      return;
    }

    const sesion = autenticarUsuario({ usuario, clave });

    if (sesion) {
      setMensajeExito(`¡Bienvenido/a, ${sesion.nombres}! Rol: ${sesion.rol}`);
      if (onLoginSuccess) {
        onLoginSuccess(sesion);
      }
    } else {
      setError('Credenciales inválidas. Verifica tu usuario y clave.');
    }
  };

  const handleRegisterStudent = () => {
    if (onNavigateToRegisterStudent) {
      onNavigateToRegisterStudent();
    } else {
      window.location.hash = '#/registro/estudiante';
    }
  };

  const handleRegisterTutor = () => {
    if (onNavigateToRegisterTutor) {
      onNavigateToRegisterTutor();
    } else {
      window.location.hash = '#/registro/tutor';
    }
  };

  return (
    <div className="login-screen">
      {/* Fondo orgánico decorativo superior derecho */}
      <img className="forma" src={formaLoginImg} alt="" aria-hidden="true" />

      <main className="login-container">
        {/* Columna Izquierda: Imagen de estudiantes */}
        <section className="login-hero-wrapper">
          <img
            src={loginHeroImg}
            alt="Estudiantes de la Universidad del Rosario en biblioteca"
            className="login-hero-image"
          />
        </section>

        {/* Columna Derecha: Título y Formulario */}
        <section className="login-content">
          <header className="login-header">
            {renderTitulo()}
            <p className="login-subtitle">{subtitulo}</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="login-usuario" className="login-label">
                Usuario
              </label>
              <input
                id="login-usuario"
                type="text"
                className="login-input"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-clave" className="login-label">
                Clave
              </label>
              <input
                id="login-clave"
                type="password"
                className="login-input"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="login-feedback error" role="alert">{error}</div>}
            {mensajeExito && <div className="login-feedback success" role="status">{mensajeExito}</div>}

            <div className="login-actions">
              <Button type="submit" variant="primary" size="lg">
                Iniciar Sesion
              </Button>

              <nav className="login-links" aria-label="Enlaces de registro">
                <button
                  type="button"
                  onClick={handleRegisterStudent}
                  className="login-link"
                >
                  registrate como estudiante
                </button>
                <button
                  type="button"
                  onClick={handleRegisterTutor}
                  className="login-link"
                >
                  registrate como tutor
                </button>
              </nav>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Login;
