import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VerPerfilTutorDesdeEstudiante.css';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Cargando } from '../components/Cargando';
import type { Usuario } from '../types/usuario';
import type { Tutor } from '../types/tutor';
import { obtenerSesion, obtenerListaUsuarios } from '../utils/auth';
import { obtenerTutorPorId } from '../services/tutoresService';
import {
  obtenerResenasPorTutor,
  obtenerResenasPorTutorAsync,
  type Resena,
} from '../services/resenasService';
import fomaVerPerilTutor from '../assets/fomaVerPerilTutor.svg';

export function VerPerfilTutorDesdeEstudiante() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();

  // Usuario estudiante actualmente con sesión
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
      carrera: 'Ing. de Sistemas energéticos',
      semestre: 6,
      semestreTexto: '6º semestre ISE',
    };
  });

  const [tutor, setTutor] = useState<Tutor | Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cursoAbierto, setCursoAbierto] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    const idABuscar = tutorId || 'tutor-1';

    obtenerTutorPorId(idABuscar)
      .then((datos) => {
        if (!cancelado) {
          setTutor(datos);
          setCargando(false);
        }
      })
      .catch(() => {
        if (!cancelado) {
          const lista = obtenerListaUsuarios();
          const tutorEncontrado = lista.find(
            (u) =>
              u.rol === 'tutor' &&
              (u.id === idABuscar ||
                (u.nombres + ' ' + u.apellidos).toLowerCase().includes(idABuscar.toLowerCase()))
          );
          setTutor(tutorEncontrado || null);
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [tutorId]);

  const toggleCurso = (curso: string) => {
    setCursoAbierto((prev) => (prev === curso ? null : curso));
  };

  // Extraer días disponibles y franjas configuradas
  const { diasFormateados, franjasUnicas } = useMemo(() => {
    if (!tutor || !tutor.diasDisponibles || !Array.isArray(tutor.diasDisponibles)) {
      return { diasFormateados: [], franjasUnicas: [] };
    }

    const dias: string[] = [];
    const horasSet = new Set<string>();

    tutor.diasDisponibles.forEach((item: any) => {
      if (typeof item === 'string') {
        dias.push(item);
      } else if (item && typeof item === 'object') {
        if (item.disponible !== false && item.diaSemana) {
          dias.push(item.diaSemana);
        }
        if (Array.isArray(item.franjas)) {
          item.franjas.forEach((f: any) => {
            if (f && f.texto) {
              horasSet.add(f.texto);
            }
          });
        }
      }
    });

    return {
      diasFormateados: Array.from(new Set(dias)),
      franjasUnicas: Array.from(horasSet),
    };
  }, [tutor]);

  const cursos = tutor?.cursos || [];

  const iniciales =
    tutor?.nombres && tutor?.apellidos
      ? `${tutor.nombres.charAt(0)}${tutor.apellidos.charAt(0)}`.toUpperCase()
      : 'TU';

  const [resenasRemotas, setResenasRemotas] = useState<Resena[] | null>(null);

  useEffect(() => {
    if (tutor) {
      obtenerResenasPorTutorAsync(tutor.id, `${tutor.nombres} ${tutor.apellidos}`)
        .then((res) => {
          if (Array.isArray(res)) setResenasRemotas(res);
        })
        .catch(() => {});
    }
  }, [tutor]);

  const resenas = useMemo(() => {
    if (resenasRemotas !== null) return resenasRemotas;
    if (!tutor) return [];
    return obtenerResenasPorTutor(tutor.id, `${tutor.nombres} ${tutor.apellidos}`);
  }, [resenasRemotas, tutor]);

  const { promedio, estrellas } = useMemo(() => {
    if (resenas.length === 0) return { promedio: 5.0, total: 0, estrellas: 5 };
    const suma = resenas.reduce((acc, r) => acc + (Number(r.calificacion) || 5), 0);
    const prom = Math.round((suma / resenas.length) * 10) / 10;
    return { promedio: prom, total: resenas.length, estrellas: Math.max(1, Math.min(5, Math.round(prom))) };
  }, [resenas]);

  if (cargando) {
    return (
      <div className="ver-tutor-page">
        <Header usuario={usuarioEstudiante} />
        <Cargando texto="Cargando perfil del tutor..." />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="ver-tutor-page">
        <Header usuario={usuarioEstudiante} />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ color: 'var(--Vino-tinto)', marginBottom: '16px' }}>
            Tutor no encontrado
          </h2>
          <Button variant="primary" onClick={() => navigate('/app/explorar')}>
            Volver a Explorar
          </Button>
        </div>
      </div>
    );
  }

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
                  {tutor.avatarUrl ? (
                    <img
                      src={tutor.avatarUrl}
                      alt={`${tutor.nombres} ${tutor.apellidos}`}
                      className="ver-tutor-avatar-img"
                    />
                  ) : (
                    iniciales
                  )}
                </div>

                <div className="ver-tutor-name-block">
                  <h1 className="ver-tutor-name">
                    {tutor.nombres} {tutor.apellidos}
                  </h1>
                  <span className="ver-tutor-subtitle">
                    {tutor.semestreTexto || 'Tutor de la Universidad del Rosario'}
                  </span>
                </div>
              </div>

              {/* Biografía / Descripción del tutor */}
              <p className="ver-tutor-bio">
                {tutor.descripcion || 'Este tutor aún no ha agregado una descripción de su perfil.'}
              </p>

              {/* Sección de cursos que asesoro */}
              <h2 className="ver-tutor-section-title">Cursos que asesoro:</h2>

              <div className="ver-tutor-cursos-list">
                {cursos.length === 0 ? (
                  <p style={{ color: '#8A7B7E', fontStyle: 'italic', padding: '8px 0', fontSize: '13px' }}>
                    Este tutor no tiene cursos registrados todavía.
                  </p>
                ) : (
                  cursos.map((curso) => {
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
                  })
                )}
              </div>

              {/* Precio y botón de agendar */}
              <div className="ver-tutor-precio-row" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ padding: '8px 16px', backgroundColor: '#FAF4F3', border: '1px solid #EADCDD', borderRadius: '8px', fontWeight: 600, color: 'var(--Vino-tinto)', fontSize: '14px' }}>
                  Precio hora: ${(tutor.precioHora || 0).toLocaleString('es-CO')}
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate(`/app/agendar/${tutor.id}`)}
                >
                  Agendar tutoría
                </Button>
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
                  <h2 className="ver-tutor-right-title">Días disponibles</h2>
                  <p className="ver-tutor-right-subtitle">Horario de atención</p>
                </div>

                <div className="ver-tutor-dias-boxes">
                  {diasFormateados.length === 0 ? (
                    <p style={{ color: '#8A7B7E', fontStyle: 'italic', padding: '12px 0', fontSize: '13px' }}>
                      El tutor aún no ha configurado sus días de atención.
                    </p>
                  ) : (
                    diasFormateados.map((dia) => (
                      <div key={dia} className="ver-tutor-dia-box">
                        <span className="ver-tutor-dia-text">{dia}</span>
                        <span className="ver-tutor-dia-dot" aria-hidden="true" />
                      </div>
                    ))
                  )}
                </div>

                {/* Franjas horarias configuradas por el tutor */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #F0E6E8', paddingTop: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--Vino-tinto)', display: 'block', marginBottom: '8px' }}>
                    Franjas horarias disponibles:
                  </span>
                  {franjasUnicas.length === 0 ? (
                    <p style={{ color: '#8A7B7E', fontStyle: 'italic', fontSize: '12px', margin: 0 }}>
                      Sin franjas horarias configuradas todavía.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {franjasUnicas.map((franja) => (
                        <span
                          key={franja}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            backgroundColor: '#FAF4F3',
                            border: '1px solid #EADCDD',
                            borderRadius: '12px',
                            color: 'var(--Vino-tinto)',
                          }}
                        >
                          {franja}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Salones presenciales del tutor */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #F0E6E8', paddingTop: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--Vino-tinto)', display: 'block', marginBottom: '8px' }}>
                    Salones y Sedes de atención presencial:
                  </span>
                  {(!tutor.salones || tutor.salones.length === 0) ? (
                    <p style={{ color: '#8A7B7E', fontStyle: 'italic', fontSize: '12px', margin: 0 }}>
                      El tutor no ha registrado salones específicos de atención presencial.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {tutor.salones.map((s: any, idx: number) => (
                        <span
                          key={`${s.sede}-${s.salon}-${idx}`}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            backgroundColor: '#FAF4F3',
                            border: '1px solid #EADCDD',
                            borderRadius: '12px',
                            color: 'var(--Vino-tinto)',
                          }}
                        >
                          {s.salon} ({s.sede})
                        </span>
                      ))}
                    </div>
                  )}
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
                    <p className="ver-tutor-right-subtitle">Qué piensan los demás</p>
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
