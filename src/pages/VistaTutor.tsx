import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './VistaTutor.css';
import { Header } from '../components/Header';
import { Cargando } from '../components/Cargando';
import { Button } from '../components/Button';
import {
  obtenerTutoriasPorTutor,
  actualizarLinkReunion,
  calcularTiempoRestante,
} from '../services/tutoriasService';
import { obtenerMensajeDeError } from '../services/api';
import type { TutoriaAgendada } from '../types/tutoria';
import type { Usuario } from '../types/usuario';
import { obtenerSesion } from '../utils/auth';
import fomaTutor from '../assets/fomaTutor.svg';

export function VistaTutor() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const sesion = obtenerSesion();
    return sesion && (sesion.rol || '').toLowerCase() === 'tutor' ? sesion : null;
  });

  useEffect(() => {
    const sesionActual = obtenerSesion();
    if (!sesionActual || (sesionActual.rol || '').toLowerCase() !== 'tutor') {
      navigate('/login', { replace: true });
    } else if (!usuario || usuario.id !== sesionActual.id) {
      setUsuario(sesionActual);
    }
  }, [usuario, navigate]);

  // Estados asíncronos
  const [tutorias, setTutorias] = useState<TutoriaAgendada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorDeCarga, setErrorDeCarga] = useState<string | null>(null);

  // Modal para agregar link
  const [tutoriaModalLink, setTutoriaModalLink] = useState<TutoriaAgendada | null>(null);
  const [nuevoLink, setNuevoLink] = useState('');
  const [guardandoLink, setGuardandoLink] = useState(false);

  useEffect(() => {
    let cancelado = false;

    obtenerTutoriasPorTutor(usuario?.id, `${usuario?.nombres} ${usuario?.apellidos}`)
      .then((datos) => {
        if (!cancelado) {
          setTutorias(datos);
          setCargando(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setErrorDeCarga(obtenerMensajeDeError(err));
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [usuario]);

  const handleAbrirModalLink = (tutoria: TutoriaAgendada) => {
    setTutoriaModalLink(tutoria);
    setNuevoLink(
      tutoria.linkReunion || 'https://meet.google.com/foj-amx-bqp?pli=1&authuser=1'
    );
  };

  const handleGuardarLink = async () => {
    if (!tutoriaModalLink) return;
    setGuardandoLink(true);

    try {
      await actualizarLinkReunion(tutoriaModalLink.id, nuevoLink.trim());
      setTutorias((prev) =>
        prev.map((t) =>
          t.id === tutoriaModalLink.id ? { ...t, linkReunion: nuevoLink.trim() } : t
        )
      );
      setTutoriaModalLink(null);
    } catch (err) {
      console.error('Error guardando link de reunión:', err);
    } finally {
      setGuardandoLink(false);
    }
  };

  return (
    <div className="tutor-page">
      <Header usuario={usuario} />

      <main className="tutor-main">
        {/* Título de la página según Figma */}
        <h1 className="tutor-page-title">Tutorias agendadas</h1>

        {cargando && <Cargando texto="Cargando tutorías agendadas..." />}

        {!cargando && errorDeCarga && (
          <div style={{ color: 'var(--Rojo-aux)', textAlign: 'center', margin: '20px 0' }}>
            <p>{errorDeCarga}</p>
          </div>
        )}

        {/* Grid con las tarjetas de tutorías */}
        {!cargando && !errorDeCarga && tutorias.length === 0 && (
          <div style={{ textAlign: 'center', margin: '40px 0', color: '#666' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>No tienes tutorías agendadas por el momento.</p>
            <p>Cuando los estudiantes reserven sesiones contigo, aparecerán listadas aquí.</p>
          </div>
        )}

        {!cargando && !errorDeCarga && tutorias.length > 0 && (
          <section className="tutor-cards-grid" aria-label="Lista de tutorías agendadas">
            {tutorias.map((tutoria) => {
              const iniciales =
                tutoria.estudianteIniciales ||
                (tutoria.estudianteNombres
                  ? `${tutoria.estudianteNombres.charAt(0)}${
                      tutoria.estudianteApellidos ? tutoria.estudianteApellidos.charAt(0) : ''
                    }`
                  : 'DM');

              return (
                <article key={tutoria.id} className="tutor-card">
                  <div className="tutor-card-top-bar" />

                  <div className="tutor-card-content">
                    {/* Header de Estudiante con Avatar de Iniciales */}
                    <div className="tutor-card-student">
                      <div className="tutor-student-avatar-initials" style={{ overflow: 'hidden' }}>
                        {tutoria.estudianteAvatar ? (
                          <img
                            src={tutoria.estudianteAvatar}
                            alt={`${tutoria.estudianteNombres} ${tutoria.estudianteApellidos}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : (
                          iniciales
                        )}
                      </div>

                      <div className="tutor-student-text">
                        <span className="tutor-student-name">
                          {tutoria.estudianteNombres} {tutoria.estudianteApellidos}
                        </span>
                        <span className="tutor-student-subtitle">
                          {tutoria.estudianteCarrera || '6º semestre ISE'}
                        </span>
                      </div>
                    </div>

                    {/* Caja de Detalles */}
                    <div className="tutor-card-details-box">
                      <div className="tutor-card-details-left">
                        <span className="tutor-card-datetime">{tutoria.fechaTexto}</span>
                        <span className="tutor-card-location">{tutoria.lugarTexto}</span>
                      </div>

                      <span className="tutor-card-time-badge">
                        {calcularTiempoRestante(tutoria.fechaISO, tutoria.fechaTexto, tutoria.estado, tutoria.calificacion) || tutoria.tiempoRestanteTexto || 'En 2 dias'}
                      </span>
                    </div>

                    {/* Footer de Tarjeta con Materia a la izquierda y Botones a la derecha */}
                    <div className="tutor-card-footer">
                      <span className="tutor-materia-pill">{tutoria.materia}</span>

                      <div className="tutor-card-actions">
                        <Button
                          variant="primary"
                          className="tutor-btn-link"
                          onClick={() => handleAbrirModalLink(tutoria)}
                        >
                          agregar link
                        </Button>

                        <Button
                          variant="primary"
                          className="tutor-btn-info"
                          onClick={() => navigate(`/tutor/tutorias/${tutoria.id}`)}
                        >
                          Informacion
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* Forma decorativa inferior según Figma (fomaTutor.svg) */}
      <img
        src={fomaTutor}
        alt=""
        className="tutor-bottom-shape"
        aria-hidden="true"
      />

      {/* Modal: "agregar link Tutor" según Image 1 */}
      {tutoriaModalLink && (
        <div
          className="tutor-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setTutoriaModalLink(null)}
        >
          <div
            className="tutor-link-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="tutor-modal-close-btn"
              onClick={() => setTutoriaModalLink(null)}
              aria-label="Cerrar modal"
            >
              ✕
            </button>

            <h2 className="tutor-link-modal-title">
              Agrege el link Para su monitoria:
            </h2>

            <div className="tutor-link-modal-field">
              <label className="tutor-link-modal-label" htmlFor="link-reunion-input">
                Ingrese aca el link de su reunion:
              </label>
              <input
                id="link-reunion-input"
                type="text"
                className="tutor-link-modal-input"
                value={nuevoLink}
                onChange={(e) => setNuevoLink(e.target.value)}
                placeholder="https://meet.google.com/foj-amx-bqp?pli=1&authuser=1"
                autoFocus
              />
            </div>

            <Button
              variant="primary"
              size="md"
              style={{ minWidth: '130px' }}
              onClick={handleGuardarLink}
              disabled={guardandoLink}
            >
              {guardandoLink ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VistaTutor;
