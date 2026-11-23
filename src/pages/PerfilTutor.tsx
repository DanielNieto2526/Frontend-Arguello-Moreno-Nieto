import { useState, useMemo, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './PerfilTutor.css';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import type { Usuario } from '../types/usuario';
import { obtenerSesion, guardarSesion, registrarUsuarioLocal } from '../utils/auth';
import { obtenerTutorPorId, actualizarTutor } from '../services/tutoresService';
import { actualizarPerfilUsuario } from '../services/authService';
import { comprimirImagen } from '../utils/imagen';
import {
  obtenerResenasPorTutor,
  obtenerResenasPorTutorAsync,
  type Resena,
} from '../services/resenasService';
import fomaTutor from '../assets/fomaTutor.svg';

export function PerfilTutor() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const sesion = obtenerSesion();
    return sesion && (sesion.rol || '').toLowerCase() === 'tutor' ? sesion : null;
  });

  const [cursoAbierto, setCursoAbierto] = useState<string | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [guardandoFoto, setGuardandoFoto] = useState(false);
  const [mensajeFoto, setMensajeFoto] = useState<string | null>(null);

  // Cargar datos vivos desde MongoDB Atlas
  useEffect(() => {
    const sesionActual = obtenerSesion();
    if (!sesionActual || (sesionActual.rol || '').toLowerCase() !== 'tutor') {
      navigate('/login', { replace: true });
      return;
    }

    setUsuario(sesionActual);

    obtenerTutorPorId(sesionActual.id)
      .then((tutor) => {
        if (tutor) {
          const usuarioSincronizado: Usuario = {
            ...sesionActual,
            nombres: tutor.nombres || sesionActual.nombres,
            apellidos: tutor.apellidos || sesionActual.apellidos,
            descripcion: tutor.descripcion !== undefined ? tutor.descripcion : sesionActual.descripcion,
            cursos: tutor.cursos || sesionActual.cursos || [],
            diasDisponibles: tutor.diasDisponibles || sesionActual.diasDisponibles || [],
            precioHora: tutor.precioHora !== undefined ? tutor.precioHora : sesionActual.precioHora,
            salones: tutor.salones || sesionActual.salones || [],
            avatarUrl: tutor.avatarUrl || sesionActual.avatarUrl || '',
          };
          setUsuario(usuarioSincronizado);
          guardarSesion(usuarioSincronizado);
          registrarUsuarioLocal(usuarioSincronizado);
        }
      })
      .catch((err) => {
        console.warn('Cargando perfil desde sesión local:', err);
      });
  }, [navigate]);

  const toggleCurso = (curso: string) => {
    setCursoAbierto((prev) => (prev === curso ? null : curso));
  };

  const handleSeleccionarArchivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    try {
      const comprimida = await comprimirImagen(archivo, 500, 0.82);
      setFotoPreview(comprimida);
      setMensajeFoto('Foto seleccionada y optimizada. Haz clic en "Guardar foto de perfil" para confirmar.');
    } catch {
      alert('No se pudo procesar la imagen seleccionada.');
    }
  };

  const handleGuardarFoto = async () => {
    if (!usuario) return;
    const fotoAGuardar = fotoPreview || usuario.avatarUrl;
    if (!fotoAGuardar) {
      alert('Por favor primero selecciona una imagen para subir.');
      return;
    }

    setGuardandoFoto(true);
    setMensajeFoto(null);

    try {
      await actualizarTutor(usuario.id, {
        correo: usuario.correo,
        avatarUrl: fotoAGuardar,
        fotoPerfil: fotoAGuardar,
      });

      try {
        await actualizarPerfilUsuario(usuario.id, {
          avatarUrl: fotoAGuardar,
        });
      } catch {}

      const usuarioActualizado: Usuario = {
        ...usuario,
        avatarUrl: fotoAGuardar,
      };

      setUsuario(usuarioActualizado);
      guardarSesion(usuarioActualizado);
      registrarUsuarioLocal(usuarioActualizado);
      setFotoPreview(null);
      setMensajeFoto('¡Foto de perfil guardada con éxito en la base de datos!');
      setTimeout(() => setMensajeFoto(null), 4000);
    } catch (err: any) {
      console.error('Error al guardar foto de perfil:', err);
      alert(err instanceof Error ? err.message : 'Error al guardar la foto de perfil en la base de datos.');
    } finally {
      setGuardandoFoto(false);
    }
  };

  // Extraer días disponibles y franjas
  const { diasActivos, franjasUnicas } = useMemo(() => {
    if (!usuario?.diasDisponibles || !Array.isArray(usuario.diasDisponibles)) {
      return { diasActivos: [], franjasUnicas: [] };
    }

    const dias: string[] = [];
    const horasSet = new Set<string>();

    usuario.diasDisponibles.forEach((item: any) => {
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
      diasActivos: Array.from(new Set(dias)),
      franjasUnicas: Array.from(horasSet),
    };
  }, [usuario?.diasDisponibles]);

  const cursos = usuario?.cursos || [];
  const precio = usuario?.precioHora ?? 0;

  const tutorId = usuario?.id || '';
  const tutorNombre = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : '';

  const iniciales = usuario?.nombres && usuario?.apellidos
    ? `${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}`.toUpperCase()
    : 'TU';

  const [resenasRemotas, setResenasRemotas] = useState<Resena[] | null>(null);

  useEffect(() => {
    if (tutorId) {
      obtenerResenasPorTutorAsync(tutorId, tutorNombre)
        .then((res) => {
          if (Array.isArray(res)) setResenasRemotas(res);
        })
        .catch(() => {});
    }
  }, [tutorId, tutorNombre]);

  const resenas = useMemo(() => {
    if (resenasRemotas !== null) return resenasRemotas;
    return obtenerResenasPorTutor(tutorId, tutorNombre);
  }, [resenasRemotas, tutorId, tutorNombre]);

  const { promedio, estrellas } = useMemo(() => {
    if (resenas.length === 0) return { promedio: 5.0, total: 0, estrellas: 5 };
    const suma = resenas.reduce((acc, r) => acc + (Number(r.calificacion) || 5), 0);
    const prom = Math.round((suma / resenas.length) * 10) / 10;
    return { promedio: prom, total: resenas.length, estrellas: Math.max(1, Math.min(5, Math.round(prom))) };
  }, [resenas]);

  const fotoActual = fotoPreview || usuario?.avatarUrl;

  return (
    <div className="perfil-tutor-page">
      <Header usuario={usuario} />

      <main className="perfil-tutor-main">
        <div className="perfil-tutor-grid">
          {/* COLUMNA IZQUIERDA: TARJETA DE PERFIL */}
          <section className="perfil-card-left" aria-label="Perfil del Tutor">
            <div className="perfil-card-top-bar" />

            <div className="perfil-card-left-body">
              {/* Avatar e información principal */}
              <div className="perfil-avatar-row">
                {fotoActual ? (
                  <img
                    src={fotoActual}
                    alt={tutorNombre || 'Foto de perfil'}
                    className="perfil-avatar-img"
                  />
                ) : (
                  <div className="perfil-avatar-initials">{iniciales}</div>
                )}

                <div className="perfil-name-block">
                  <span className="perfil-tutor-name">
                    {usuario?.nombres} {usuario?.apellidos}
                  </span>
                  <span className="perfil-tutor-subtitle">
                    {usuario?.semestreTexto || 'Tutor de la Universidad del Rosario'}
                  </span>
                </div>
              </div>

              {/* Controles para cambiar y guardar foto de perfil */}
              <div style={{ marginBottom: '18px', padding: '12px', backgroundColor: '#FAF4F3', border: '1px solid #EADCDD', borderRadius: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--Vino-tinto)', display: 'block', marginBottom: '8px' }}>
                  Foto de perfil:
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleSeleccionarArchivo}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Seleccionar foto
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={handleGuardarFoto}
                    disabled={guardandoFoto || (!fotoPreview && !usuario?.avatarUrl)}
                  >
                    {guardandoFoto ? 'Guardando...' : 'Guardar foto de perfil'}
                  </Button>
                </div>
                {mensajeFoto && (
                  <p style={{ fontSize: '12px', color: 'var(--Vino-tinto)', fontWeight: 600, marginTop: '8px', margin: '8px 0 0' }}>
                    {mensajeFoto}
                  </p>
                )}
              </div>

              <p className="perfil-bio-text">
                {usuario?.descripcion || 'Aún no has agregado una descripción a tu perfil. Puedes editarla en cualquier momento.'}
              </p>

              <h2 className="perfil-section-title">Cursos que asesoro:</h2>

              <div className="perfil-cursos-list">
                {cursos.length === 0 ? (
                  <p style={{ color: '#8A7B7E', fontStyle: 'italic', fontSize: '13px' }}>
                    Aún no has registrado cursos que asesoras.
                  </p>
                ) : (
                  cursos.map((curso) => {
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
                  })
                )}
              </div>

              <div className="perfil-precio-row">
                <div className="perfil-precio-box">
                  Precio hora: ${(precio || 0).toLocaleString('es-CO')}
                </div>

                <Button
                  variant="primary"
                  className="perfil-btn-editar"
                  onClick={() => navigate('/tutor/perfil/editar')}
                >
                  Editar perfil
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
                  <h2 className="perfil-right-title">Días disponibles</h2>
                  <p className="perfil-right-subtitle">Horario de atención</p>
                </div>

                <div className="perfil-dias-row">
                  <div className="perfil-dias-boxes">
                    {diasActivos.length === 0 ? (
                      <p style={{ color: '#8A7B7E', fontSize: '13px', fontStyle: 'italic' }}>
                        Aún no has configurado tus días disponibles.
                      </p>
                    ) : (
                      diasActivos.map((dia) => (
                        <div key={dia} className="perfil-dia-box">
                          <span className="perfil-dia-text">{dia}</span>
                          <span className="perfil-dia-dot" aria-hidden="true" />
                        </div>
                      ))
                    )}
                  </div>

                  <Button
                    variant="primary"
                    className="perfil-btn-editar"
                    onClick={() => navigate('/tutor/perfil/horario')}
                  >
                    Editar horario
                  </Button>
                </div>

                {/* Resumen de franjas horarias */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #F0E6E8', paddingTop: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--Vino-tinto)', display: 'block', marginBottom: '8px' }}>
                    Franjas horarias de atención configuradas:
                  </span>
                  {franjasUnicas.length === 0 ? (
                    <p style={{ color: '#8A7B7E', fontStyle: 'italic', fontSize: '12px', margin: 0 }}>
                      No tienes franjas horarias configuradas.
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

                {/* Salones presenciales configurados */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #F0E6E8', paddingTop: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--Vino-tinto)', display: 'block', marginBottom: '8px' }}>
                    Salones para atención presencial:
                  </span>
                  {(!usuario?.salones || usuario.salones.length === 0) ? (
                    <p style={{ color: '#8A7B7E', fontStyle: 'italic', fontSize: '12px', margin: 0 }}>
                      No tienes salones registrados. Puedes configurarlos al editar tu perfil.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {usuario.salones.map((s: any, idx: number) => (
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
            <section className="perfil-card-right" aria-label="Reseñas de estudiantes">
              <div className="perfil-card-top-bar" />

              <div className="perfil-card-right-body">
                <div className="perfil-resenas-header">
                  <div>
                    <h2 className="perfil-right-title">Reseñas</h2>
                    <p className="perfil-right-subtitle">Qué piensan los demás</p>
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
