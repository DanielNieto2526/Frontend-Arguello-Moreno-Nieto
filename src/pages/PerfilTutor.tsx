import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './PerfilTutor.css';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import type { Usuario } from '../types/usuario';
import { obtenerSesion } from '../utils/auth';
import { obtenerResenasPorTutor, calcularPromedioTutor } from '../services/resenasService';
import fomaTutor from '../assets/fomaTutor.svg';

export function PerfilTutor() {
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
        cursos: ['Calculo II', 'Algebra Lineal', 'Analisis Real'],
        sede: 'Claustro',
        modalidad: 'Híbrida',
        precioHora: 20000,
        descripcion:
          'Sé lo retador que es el paso de Cálculo I a Cálculo II y Álgebra Lineal en los primeros semestres de ingeniería y ciencias. Fui monitor oficial de planta durante 4 semestres consecutivos y comprendo exactamente los errores típicos de parcial y dónde se confunden los conceptos teóricos.',
        diasDisponibles: ['LU', 'MA', 'MI', 'JU'],
      };
    }
    return sesion;
  });

  const [cursoAbierto, setCursoAbierto] = useState<string | null>(null);

  const toggleCurso = (curso: string) => {
    setCursoAbierto((prev) => (prev === curso ? null : curso));
  };

  const cursos = usuario?.cursos || ['Calculo II', 'Algebra Lineal', 'Analisis Real'];
  const diasDisponibles = usuario?.diasDisponibles || ['LU', 'MA', 'MI', 'JU'];
  const precio = usuario?.precioHora || 20000;

  const tutorId = usuario?.id || '2';
  const tutorNombre = usuario ? `${usuario.nombres} ${usuario.apellidos}` : 'Daniel Nieto';

  const resenas = useMemo(() => {
    return obtenerResenasPorTutor(tutorId, tutorNombre);
  }, [tutorId, tutorNombre]);

  const { promedio, estrellas } = useMemo(() => {
    return calcularPromedioTutor(tutorId, tutorNombre);
  }, [tutorId, tutorNombre]);

  return (
    <div className="perfil-tutor-page">
      <Header usuario={usuario} />

      <main className="perfil-tutor-main">
        <div className="perfil-tutor-grid">
          {/* COLUMNA IZQUIERDA: TARJETA DE PERFIL */}
          <section className="perfil-card-left" aria-label="Perfil del Tutor">
            <div className="perfil-card-top-bar" />

            <div className="perfil-card-left-body">
              <div className="perfil-avatar-row">
                <div className="perfil-avatar-initials">DN</div>

                <div className="perfil-name-block">
                  <span className="perfil-tutor-name">
                    {usuario?.nombres} {usuario?.apellidos}
                  </span>
                  <span className="perfil-tutor-subtitle">
                    {usuario?.semestreTexto || '6º semestre MACC - Claustro'}
                  </span>
                </div>
              </div>

              <p className="perfil-bio-text">
                {usuario?.descripcion ||
                  'Sé lo retador que es el paso de Cálculo I a Cálculo II y Álgebra Lineal en los primeros semestres de ingeniería y ciencias. Fui monitor oficial de planta durante 4 semestres consecutivos y comprendo exactamente los errores típicos de parcial y dónde se confunden los conceptos teóricos.'}
              </p>

              <h2 className="perfil-section-title">Cursos que asesoro:</h2>

              <div className="perfil-cursos-list">
                {cursos.map((curso) => {
                  const estaAbierto = cursoAbierto === curso;
                  return (
                    <div key={curso}>
                      <button
                        type="button"
                        className="perfil-curso-item"
                        onClick={() => toggleCurso(curso)}
                        aria-expanded={estaAbierto}
                      >
                        <span>{curso}</span>
                        <span className={`perfil-curso-chevron ${estaAbierto ? 'open' : ''}`}>
                          ▼
                        </span>
                      </button>
                      {estaAbierto && (
                        <div className="perfil-curso-content">
                          Monitoría orientada a talleres prácticos, preparación de parciales y
                          resolución de dudas puntuales de {curso}.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="perfil-precio-row">
                <div className="perfil-precio-box">
                  Precio hora: {precio.toLocaleString('es-CO')}
                </div>

                <Button
                  variant="primary"
                  className="perfil-btn-editar"
                  onClick={() => navigate('/tutor/perfil/editar')}
                >
                  Editar
                </Button>
              </div>
            </div>
          </section>

          {/* COLUMNA DERECHA: DÍAS DISPONIBLES Y RESEÑAS */}
          <div className="perfil-col-right">
            {/* Tarjeta Días Disponibles */}
            <section className="perfil-card-right" aria-label="Días Disponibles">
              <div className="perfil-card-top-bar" />

              <div className="perfil-card-right-body">
                <div className="perfil-dias-header">
                  <h2 className="perfil-right-title">Dias disponibles</h2>
                  <p className="perfil-right-subtitle">Sujeto a cambios</p>
                </div>

                <div className="perfil-dias-row">
                  <div className="perfil-dias-boxes">
                    {diasDisponibles.map((dia) => (
                      <div key={dia} className="perfil-dia-box">
                        <span className="perfil-dia-text">{dia}</span>
                        <span className="perfil-dia-dot" aria-hidden="true" />
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="primary"
                    className="perfil-btn-editar"
                    onClick={() => navigate('/tutor/perfil/horario')}
                  >
                    Editar
                  </Button>
                </div>
              </div>
            </section>

            {/* Tarjeta Reseñas */}
            <section className="perfil-card-right" aria-label="Reseñas de estudiantes">
              <div className="perfil-card-top-bar" />

              <div className="perfil-card-right-body">
                <div className="perfil-resenas-header">
                  <div>
                    <h2 className="perfil-right-title">Reseñas</h2>
                    <p className="perfil-right-subtitle">Que piensan los demás</p>
                  </div>

                  <div className="perfil-stars-container" aria-label={`Calificación promedio: ${promedio.toFixed(1)} estrellas`}>
                    <span className="perfil-score-text">{promedio.toFixed(1)}</span>
                    <div className="perfil-stars-icons">
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

                <div className="perfil-reviews-list">
                  {resenas.length === 0 ? (
                    <div className="perfil-review-box">
                      <p className="perfil-review-comment" style={{ color: '#8A7B7E' }}>
                        Aún no tienes reseñas registradas.
                      </p>
                    </div>
                  ) : (
                    resenas.map((res) => (
                      <div key={res.id} className="perfil-review-box">
                        <div className="perfil-review-header">
                          <span className="perfil-review-author">{res.autor}:</span>
                          <span className="perfil-review-score">★ {res.calificacion.toFixed(1)}</span>
                        </div>
                        <p className="perfil-review-comment">
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

      {/* Forma decorativa inferior según Figma (fomaTutor.svg) */}
      <img
        src={fomaTutor}
        alt=""
        className="tutor-bottom-shape"
        aria-hidden="true"
      />
    </div>
  );
}

export default PerfilTutor;
