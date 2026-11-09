import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VerPerfilTutorDesdeEstudiante.css';
import { Header } from '../components/Header';
import type { Tutor } from '../types/tutor';
import type { Usuario } from '../types/usuario';
import { obtenerTutorPorId } from '../services/tutoresService';
import { TUTORES_INICIALES } from '../data/tutoresIniciales';
import { obtenerSesion } from '../utils/auth';
import formaPendientesEstudiantes from '../assets/formaPendientesEstudiantes.svg';

export function VerPerfilTutorDesdeEstudiante() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();

  // Usuario estudiante actualmente con sesión
  const [usuarioEstudiante] = useState<Usuario | null>(() => obtenerSesion());

  // Estado del tutor visualizado (por defecto Juan Céspedes / tutor-2 si no se halla)
  const [tutor, setTutor] = useState<Tutor>(() => {
    return TUTORES_INICIALES.find((t) => t.id === 'tutor-2') || TUTORES_INICIALES[0];
  });

  const [cursoAbierto, setCursoAbierto] = useState<string | null>(null);

  useEffect(() => {
    if (tutorId) {
      obtenerTutorPorId(tutorId)
        .then((t) => {
          if (t) setTutor(t);
        })
        .catch(() => {
          // Si no se encuentra en API/persistido, buscar en iniciales o usar Juan Céspedes
          const encontrado =
            TUTORES_INICIALES.find((t) => t.id === tutorId) ||
            TUTORES_INICIALES.find((t) => t.id === 'tutor-2') ||
            TUTORES_INICIALES[0];
          setTutor(encontrado);
        });
    }
  }, [tutorId]);

  const toggleCurso = (curso: string) => {
    setCursoAbierto((prev) => (prev === curso ? null : curso));
  };

  const cursos =
    tutor.cursos && tutor.cursos.length > 0
      ? tutor.cursos
      : ['Calculo II', 'Algebra Lineal', 'Analisis Real'];

  const diasDisponibles = ['LU', 'MA', 'MI', 'JU'];

  return (
    <div className="ver-tutor-page">
      <Header usuario={usuarioEstudiante} />

      <main className="ver-tutor-main">
        <div className="ver-tutor-grid">
          {/* COLUMNA IZQUIERDA: TARJETA DE PERFIL DEL TUTOR */}
          <section className="ver-tutor-card-left" aria-label="Perfil del Tutor">
            <div className="ver-tutor-top-bar" />

            <div className="ver-tutor-left-body">
              {/* Avatar e información principal */}
              <div className="ver-tutor-avatar-row">
                <div className="ver-tutor-avatar-circle" aria-hidden="true">
                  {tutor.iniciales || 'JC'}
                </div>

                <div className="ver-tutor-name-block">
                  <h1 className="ver-tutor-name">
                    {tutor.nombres} {tutor.apellidos}
                  </h1>
                  <span className="ver-tutor-subtitle">
                    {tutor.semestreTexto || '6º semestre MACC - Claustro'}
                  </span>
                </div>
              </div>

              {/* Biografía / Descripción */}
              <p className="ver-tutor-bio">
                {tutor.descripcion ||
                  'Sé lo retador que es el paso de Cálculo I a Cálculo II y Álgebra Lineal en los primeros semestres de ingeniería y ciencias. Fui monitor oficial de planta durante 4 semestres consecutivos y comprendo exactamente los errores típicos de parcial y dónde se confunden los conceptos teóricos.'}
              </p>

              {/* Sección de cursos que asesora */}
              <h2 className="ver-tutor-section-title">Cursos que asesora:</h2>

              <div className="ver-tutor-cursos-list">
                {cursos.map((curso) => {
                  const estaAbierto = cursoAbierto === curso;
                  return (
                    <div key={curso} className="ver-tutor-curso-wrapper">
                      <button
                        type="button"
                        className="ver-tutor-curso-btn"
                        onClick={() => toggleCurso(curso)}
                        aria-expanded={estaAbierto}
                      >
                        <span>{curso}</span>
                        <span className={`ver-tutor-chevron ${estaAbierto ? 'open' : ''}`}>
                          ▼
                        </span>
                      </button>
                      {estaAbierto && (
                        <div className="ver-tutor-curso-content">
                          Tutoría y asesoría para preparación de parciales, talleres y resolución
                          de dudas conceptuales sobre {curso}.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botón opcional para agendar directamente con este tutor */}
              <div className="ver-tutor-agendar-wrap">
                <button
                  type="button"
                  className="ver-tutor-btn-agendar"
                  onClick={() => navigate(`/app/agendar/${tutor.id}`)}
                >
                  Agendar Tutoría
                </button>
              </div>
            </div>
          </section>

          {/* COLUMNA DERECHA: DÍAS DISPONIBLES Y RESEÑAS */}
          <div className="ver-tutor-col-right">
            {/* Tarjeta Días Disponibles */}
            <section className="ver-tutor-card-right" aria-label="Días Disponibles">
              <div className="ver-tutor-top-bar" />

              <div className="ver-tutor-right-body">
                <div className="ver-tutor-dias-header">
                  <h2 className="ver-tutor-right-title">Dias disponibles</h2>
                  <p className="ver-tutor-right-subtitle">Sujeto a cambios</p>
                </div>

                <div className="ver-tutor-dias-boxes">
                  {diasDisponibles.map((dia) => (
                    <div key={dia} className="ver-tutor-dia-box">
                      <span className="ver-tutor-dia-text">{dia}</span>
                      <span className="ver-tutor-dia-dot" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Tarjeta Reseñas */}
            <section className="ver-tutor-card-right" aria-label="Reseñas de estudiantes">
              <div className="ver-tutor-top-bar" />

              <div className="ver-tutor-right-body">
                <div className="ver-tutor-resenas-header">
                  <div>
                    <h2 className="ver-tutor-right-title">Reseñas</h2>
                    <p className="ver-tutor-right-subtitle">Que piensan los demás</p>
                  </div>

                  <div className="ver-tutor-stars" aria-label="Calificación 3 estrellas">
                    ★ ★ ★
                  </div>
                </div>

                <div className="ver-tutor-review-box">
                  <span className="ver-tutor-review-author">Mariana Fuentes:</span>
                  <p className="ver-tutor-review-comment">
                    "Daniel explica con mucha paciencia. Tenía un bloqueo total con cambio de
                    coordenadas polares y en solo hora y media logré resolver los ejercicios del
                    taller que caían fijo en el examen. Saqué 4.6 en el parcial. Súper
                    recomendado."
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Forma decorativa inferior según Figma */}
      <img
        src={formaPendientesEstudiantes}
        alt=""
        className="ver-tutor-bottom-shape"
        aria-hidden="true"
      />
    </div>
  );
}

export default VerPerfilTutorDesdeEstudiante;

