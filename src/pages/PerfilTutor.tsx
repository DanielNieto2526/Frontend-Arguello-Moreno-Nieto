import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PerfilTutor.css';
import { Header } from '../components/Header';
import type { Usuario } from '../types/usuario';
import { obtenerSesion } from '../utils/auth';
import formaPendientesEstudiantes from '../assets/formaPendientesEstudiantes.svg';

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
        cursos: ['Calculo II', 'Variable Compleja', 'Analisis Real'],
        sede: 'Claustro',
        modalidad: 'Híbrida',
        precioHora: 20000,
        descripcion:
          'Sé lo retador que es el paso de Cálculo I a Cálculo II y Álgebra Lineal en los primeros semestres de ingeniería y ciencias. Fui monitor oficial de planta durante 4 semestres consecutivos y comprendo exactamente los errores típicos de parcial y dónde se confunden los conceptos teóricos.',
        diasDisponibles: ['LU', 'MA', 'MI'],
      };
    }
    return sesion;
  });

  const [cursoAbierto, setCursoAbierto] = useState<string | null>(null);

  const toggleCurso = (curso: string) => {
    setCursoAbierto((prev) => (prev === curso ? null : curso));
  };

  const cursos = usuario?.cursos || ['Calculo II', 'Variable Compleja', 'Analisis Real'];
  const diasDisponibles = usuario?.diasDisponibles || ['LU', 'MA', 'MI'];
  const precio = usuario?.precioHora || 20000;

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

                <button
                  type="button"
                  className="perfil-btn-editar"
                  onClick={() => navigate('/tutor/perfil/editar')}
                >
                  EDITAR
                </button>
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

                  <button
                    type="button"
                    className="perfil-btn-editar"
                    onClick={() => navigate('/tutor/perfil/horario')}
                  >
                    EDITAR
                  </button>
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

                  <div className="perfil-stars" aria-label="Calificación 5 estrellas">
                    ★ ★ ★
                  </div>
                </div>

                <div className="perfil-review-box">
                  <span className="perfil-review-author">Mariana Fuentes:</span>
                  <p className="perfil-review-comment">
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
        className="tutor-bottom-shape"
        aria-hidden="true"
      />
    </div>
  );
}

export default PerfilTutor;
