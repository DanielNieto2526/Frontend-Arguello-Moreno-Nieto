import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';
import type { Usuario } from '../types/usuario';
import { cerrarSesion } from '../utils/auth';

export interface HeaderProps {
  usuario?: Usuario | null;
  onLogout?: () => void;
}

export function Header({ usuario, onLogout }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCerrarSesion = () => {
    cerrarSesion();
    setMenuAbierto(false);
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  const esTutor = usuario?.rol === 'tutor' || location.pathname.startsWith('/tutor');

  // Datos mostrados según Figma
  const nombreMostrar = esTutor
    ? (usuario?.nombres ? `${usuario.nombres} ${usuario.apellidos}` : 'Daniel Nieto')
    : usuario
    ? `${usuario.nombres} ${usuario.apellidos}`
    : 'Juan Filip Coral';

  const badgeMostrar = esTutor
    ? 'Tutor - Matematicas Aplicadas y Ciencias de la Computacion'
    : usuario
    ? `${usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}${
        usuario.carrera ? ` - ${usuario.carrera}` : ''
      }`
    : 'Estudiante - Ing. de Sistemas energeticos';

  const iniciales = esTutor ? 'DN' : usuario ? `${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}` : 'JC';

  const esTutoriasActivo = location.pathname.startsWith('/tutor/tutorias') || location.pathname === '/tutor';
  const esPerfilActivo = location.pathname.startsWith('/tutor/perfil');
  const esExplorarActivo = location.pathname === '/app/explorar' || (!esTutor && location.pathname === '/');
  const esMisTutoriasEstudianteActivo = location.pathname.startsWith('/app/tutorias');

  return (
    <header className="app-header">
      {/* Sección Izquierda: Logo institucional y Navegación */}
      <div className="header-left">
        <Link to={esTutor ? '/tutor/tutorias' : '/app/explorar'} className="header-logo">
          Conecta<span className="header-logo-highlight">Tutor</span>
        </Link>

        <nav className="header-nav" aria-label="Navegación principal">
          {esTutor ? (
            <>
              <Link
                to="/tutor/tutorias"
                className={`header-nav-item ${esTutoriasActivo ? 'active' : 'outline'}`}
              >
                mis tutorias
              </Link>
              <Link
                to="/tutor/perfil"
                className={`header-nav-item ${esPerfilActivo ? 'active' : 'outline'}`}
              >
                Mi Perfil
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/app/explorar"
                className={`header-nav-item ${esExplorarActivo ? 'active' : ''}`}
              >
                explorar tutores
              </Link>
              <Link
                to="/app/tutorias"
                className={`header-nav-item ${esMisTutoriasEstudianteActivo ? 'active' : ''}`}
              >
                mis tutorias
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Sección Derecha: Notificaciones y Perfil */}
      <div className="header-right">
        {/* Campana de Notificaciones */}
        <button
          type="button"
          className="header-bell-btn"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="header-bell-badge" aria-hidden="true" />
        </button>

        <div className="header-divider" aria-hidden="true" />

        {/* Perfil del Usuario */}
        <div className="header-user-wrapper" ref={menuRef}>
          <div className="header-user-info">
            <span className="header-user-name">{nombreMostrar}</span>
            <span className="header-user-badge">{badgeMostrar}</span>
          </div>

          <button
            type="button"
            className="header-avatar"
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-expanded={menuAbierto}
            aria-label="Menú de perfil"
          >
            {usuario?.avatarUrl ? (
              <img
                src={usuario.avatarUrl}
                alt={nombreMostrar}
                className="header-avatar"
              />
            ) : (
              <span>{iniciales}</span>
            )}
          </button>

          {/* Menú desplegable */}
          {menuAbierto && (
            <div className="header-user-menu" role="menu">
              {esTutor && (
                <>
                  <button
                    type="button"
                    className="header-menu-item"
                    onClick={() => {
                      setMenuAbierto(false);
                      navigate('/tutor/tutorias');
                    }}
                  >
                    Tutorías Agendadas
                  </button>
                  <button
                    type="button"
                    className="header-menu-item"
                    onClick={() => {
                      setMenuAbierto(false);
                      navigate('/tutor/perfil');
                    }}
                  >
                    Mi Perfil
                  </button>
                </>
              )}
              <button
                type="button"
                className="header-menu-item logout"
                onClick={handleCerrarSesion}
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
