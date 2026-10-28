import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './VistaTutor.css';
import { Header } from '../components/Header';
import { Cargando } from '../components/Cargando';
import {
  obtenerTutoriasPorTutor,
  actualizarLinkReunion,
} from '../services/tutoriasService';
import { obtenerMensajeDeError } from '../services/api';
import type { TutoriaAgendada } from '../types/tutoria';
import type { Usuario } from '../types/usuario';
import { obtenerSesion } from '../utils/auth';
import formaPendientesEstudiantes from '../assets/formaPendientesEstudiantes.svg';

export function VistaTutor() {
  const navigate = useNavigate();

  const [usuario] = useState<Usuario | null>(() => {
    const sesion = obtenerSesion();
    if (!sesion || sesion.rol !== 'tutor') {
      return {
        id: '2',
        nombres: 'Daniel',
        apellidos: 'Nieto',
        correo: 'dnieto@urosario.edu.co',
        rol: 'tutor',
        carrera: 'Matematicas Aplicadas y Ciencias de la Computacion',
        semestre: 6,
        semestreTexto: '6º semestre MACC - Claustro',
        cursos: ['Calculo II', 'Variable Compleja', 'Analisis Real'],
        sede: 'Claustro',
        modalidad: 'Híbrida',
        precioHora: 20000,
        descripcion:
          'Sé lo retador que es el paso de Cálculo I a Cálculo II y Álgebra Lineal en los primeros semestres de ingeniería y ciencias. Fui monitor oficial de planta durante 4 semestres consecutivos y comprendo exactamente los errores típicos de parcial y dónde se confunden los conceptos teóricos.',
        diasDisponibles: ['LU', 'MA', 'MI'],
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      };
    }
    return sesion;
  });

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

        {/* Grid con las 3 tarjetas de tutorías */}
        {!cargando && !errorDeCarga && (
          <section className="tutor-cards-grid" aria-label="Lista de tutorías agendadas">
            {tutorias.map((tutoria) => {
              const iniciales =
                tutoria.estudianteIniciales ||
                (tutoria.estudianteNombres
                  ? `${tutoria.estudianteNombres.charAt(0)}${
                      tutoria.estudianteApellidos ? tutoria.estudianteApellidos.charAt(0) : ''
                    }`
                  : 'ES');

              return (
                <article key={tutoria.id} className="tutor-card">
                  <div className="tutor-card-top-bar" />

                  <div className="tutor-card-content">
                    {/* Header de Estudiante */}
                    <div className="tutor-card-student">
                      {tutoria.estudianteAvatar ? (
                        <img
                          src={tutoria.estudianteAvatar}
                          alt={tutoria.estudianteNombres || 'Estudiante'}
                          className="tutor-student-avatar-img"
                        />
                      ) : (
                        <div className="tutor-student-avatar-initials">{iniciales}</div>
                      )}

                      <div className="tutor-student-text">
                        <span className="tutor-student-name">
                          {tutoria.estudianteNombres} {tutoria.estudianteApellidos}
                        </span>
                        <span className="tutor-student-subtitle">
                          {tutoria.estudianteCarrera || '2º semestre ISE'}
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
                        {tutoria.tiempoRestanteTexto || 'En 2 dias'}
                      </span>
                    </div>

                    {/* Footer de Tarjeta con Materia y Botones */}
                    <div className="tutor-card-footer">
                      <span className="tutor-materia-pill">{tutoria.materia}</span>

                      <div className="tutor-card-actions">
                        {tutoria.esVirtual && (
                          <button
                            type="button"
                            className="tutor-btn-orange"
                            onClick={() => handleAbrirModalLink(tutoria)}
                          >
                            agregar link
                          </button>
                        )}

                        <button
                          type="button"
                          className="tutor-btn-orange"
                          onClick={() => navigate(`/tutor/tutorias/${tutoria.id}`)}
                        >
                          Informacion
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* Forma decorativa inferior según Figma */}
      <img
        src={formaPendientesEstudiantes}
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

            <button
              type="button"
              className="tutor-btn-orange"
              style={{ minWidth: '130px', padding: '10px 24px', fontSize: '14px' }}
              onClick={handleGuardarLink}
              disabled={guardandoLink}
            >
              {guardandoLink ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VistaTutor;
