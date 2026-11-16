import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import './VerPerfilTutorDesdeEstudiante.css';
import { Header } from '../components/Header';
import type { Usuario } from '../types/usuario';
import { obtenerSesion, obtenerListaUsuarios } from '../utils/auth';
import { USUARIOS_INICIALES } from '../data/usuariosIniciales';
import { TUTORES_INICIALES } from '../data/tutoresIniciales';
import { obtenerResenasPorTutor, calcularPromedioTutor } from '../services/resenasService';
import fomaVerPerilTutor from '../assets/fomaVerPerilTutor.svg';

export function VerPerfilTutorDesdeEstudiante() {
  const { tutorId } = useParams<{ tutorId: string }>();

  // Usuario estudiante actualmente con sesión (Juan Filip Coral por defecto si no hay sesión)
  const [usuarioEstudiante] = useState<Usuario | null>(() => {
    const sesion = obtenerSesion();
    if (sesion && sesion.rol === 'estudiante') {
      return sesion;
    }
    return {
      id: '1',
      nombres: 'Juan Filip',
      apellidos: 'Coral',
      correo: 'jcoral@urosario.edu.co',
      rol: 'estudiante',
      carrera: 'Ing. de Sistemas energeticos',
      semestre: 6,
      semestreTexto: '6º semestre ISE',
    };
  });

  // Información del tutor visualizado (Daniel Nieto por defecto o el indicado en la URL)
  const tutor = useMemo<Usuario>(() => {
    const listaUsuarios = obtenerListaUsuarios();
    const tutorEncontrado = listaUsuarios.find(
      (u) =>
        u.rol === 'tutor' &&
        (tutorId
          ? u.id === tutorId ||
            (u.nombres + ' ' + u.apellidos).toLowerCase().includes(tutorId.toLowerCase())
          : u.id === '2' ||
            u.correo.toLowerCase() === 'dnieto@urosario.edu.co' ||
            u.nombres.toLowerCase().includes('daniel'))
    );
    if (tutorEncontrado) return tutorEncontrado;

    const tutorInicial = TUTORES_INICIALES.find(
      (t) =>
        t.id === tutorId ||
        (tutorId &&
          (t.nombres + ' ' + t.apellidos).toLowerCase().includes(tutorId.toLowerCase()))
    );
    if (tutorInicial) {
      return {
        id: tutorInicial.id,
        nombres: tutorInicial.nombres,
        apellidos: tutorInicial.apellidos,
        correo: `${tutorInicial.nombres.toLowerCase()}.${tutorInicial.apellidos.toLowerCase()}@urosario.edu.co`,
        rol: 'tutor',
        carrera: 'Matematicas Aplicadas y Ciencias de la Computacion',
        semestre: 6,
        semestreTexto: tutorInicial.semestreTexto,
        cursos: tutorInicial.cursos,
        sede: tutorInicial.sede,
        modalidad: tutorInicial.modalidad,
        precioHora: tutorInicial.precioHora,
        descripcion: tutorInicial.descripcion,
        diasDisponibles: ['LU', 'MA', 'MI', 'JU'],
      };
    }

    return (
      USUARIOS_INICIALES.find((u) => u.id === '2') || {
        id: '2',
        nombres: 'Daniel',
        apellidos: 'Nieto',
        correo: 'dnieto@urosario.edu.co',
        rol: 'tutor',
        carrera: 'Matematicas Aplicadas y Ciencias de la Computacion',
        semestre: 6,
        semestreTexto: '6º semestre MACC - Claustro',
        cursos: ['Calculo II', 'Algebra Lineal', 'Analisis Real'],
        sede: 'Claustro',
        modalidad: 'Híbrida',
        precioHora: 20000,
        descripcion:
          'Sé lo retador que es el paso de Cálculo I a Cálculo II y Álgebra Lineal en los primeros semestres de ingeniería y ciencias. Fui monitor oficial de planta durante 4 semestres consecutivos y comprendo exactamente los errores típicos de parcial y dónde se confunden los conceptos teóricos.',
        diasDisponibles: ['LU', 'MA', 'MI', 'JU'],
      }
    );
  }, [tutorId]);

  const [cursoAbierto, setCursoAbierto] = useState<string | null>(null);

  const toggleCurso = (curso: string) => {
    setCursoAbierto((prev) => (prev === curso ? null : curso));
  };

  const cursos =
    tutor.cursos && tutor.cursos.length > 0
      ? tutor.cursos
      : ['Calculo II', 'Algebra Lineal', 'Analisis Real'];

  const diasDisponibles =
    tutor.diasDisponibles && tutor.diasDisponibles.length > 0
      ? tutor.diasDisponibles
      : ['LU', 'MA', 'MI', 'JU'];

  const iniciales =
    tutor.nombres && tutor.apellidos
      ? `${tutor.nombres.charAt(0)}${tutor.apellidos.charAt(0)}`.toUpperCase()
      : 'DN';

  // Reseñas y promedio dinámico según requerimiento
  const resenas = useMemo(() => {
    return obtenerResenasPorTutor(tutor.id, `${tutor.nombres} ${tutor.apellidos}`);
  }, [tutor.id, tutor.nombres, tutor.apellidos]);

  const { promedio, estrellas } = useMemo(() => {
    return calcularPromedioTutor(tutor.id, `${tutor.nombres} ${tutor.apellidos}`);
  }, [tutor.id, tutor.nombres, tutor.apellidos]);

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
                  {iniciales}
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

              {/* Biografía / Descripción del tutor */}
              <p className="ver-tutor-bio">
                {tutor.descripcion ||
                  'Sé lo retador que es el paso de Cálculo I a Cálculo II y Álgebra Lineal en los primeros semestres de ingeniería y ciencias. Fui monitor oficial de planta durante 4 semestres consecutivos y comprendo exactamente los errores típicos de parcial y dónde se confunden los conceptos teóricos.'}
              </p>

              {/* Sección de cursos que asesoro */}
              <h2 className="ver-tutor-section-title">Cursos que asesoro:</h2>

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

            {/* Tarjeta Reseñas con Promedio de Estrellas y Comentarios adicionales según Figma */}
            <section className="ver-tutor-card-right" aria-label="Reseñas de estudiantes">
              <div className="ver-tutor-top-bar" />

              <div className="ver-tutor-right-body">
                <div className="ver-tutor-resenas-header">
                  <div>
                    <h2 className="ver-tutor-right-title">Reseñas</h2>
                    <p className="ver-tutor-right-subtitle">Que piensan los demás</p>
                  </div>

                  <div
                    className="ver-tutor-rating-badge"
                    aria-label={`Calificación promedio: ${promedio.toFixed(1)} estrellas`}
                  >
                    <div className="ver-tutor-score-row">
                      <span className="ver-tutor-score-text">{promedio.toFixed(1)}</span>
                      <span className="ver-tutor-big-star">★</span>
                    </div>
                    <div className="ver-tutor-small-stars">
                      {[1, 2, 3].map((starIdx) => (
                        <span
                          key={starIdx}
                          className={starIdx <= estrellas ? 'star-filled' : 'star-empty'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lista de reseñas con comentarios adicionales enviados por los estudiantes */}
                <div className="ver-tutor-reviews-list">
                  {resenas.length === 0 ? (
                    <div className="ver-tutor-review-box">
                      <p className="ver-tutor-review-comment" style={{ color: '#8A7B7E' }}>
                        Este tutor aún no cuenta con reseñas registradas.
                      </p>
                    </div>
                  ) : (
                    resenas.map((res) => (
                      <div key={res.id} className="ver-tutor-review-box">
                        <div className="ver-tutor-review-header">
                          <span className="ver-tutor-review-author">{res.autor}:</span>
                          <span className="ver-tutor-review-stars-pill">
                            ★ {res.calificacion.toFixed(1)}
                          </span>
                        </div>
                        <p className="ver-tutor-review-comment">
                          "{res.comentario}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Forma decorativa inferior derecha según Figma (fomaVerPerilTutor.svg) */}
      <img
        src={fomaVerPerilTutor}
        alt=""
        className="ver-tutor-bottom-shape"
        aria-hidden="true"
      />
    </div>
  );
}

export default VerPerfilTutorDesdeEstudiante;
