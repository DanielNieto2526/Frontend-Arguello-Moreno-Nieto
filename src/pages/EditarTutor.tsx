import { useState, useEffect, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditarTutor.css';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import type { Usuario } from '../types/usuario';
import { obtenerSesion, guardarSesion, registrarUsuarioLocal } from '../utils/auth';
import { obtenerTutorPorId, actualizarTutor } from '../services/tutoresService';
import { actualizarPerfilUsuario } from '../services/authService';
import { comprimirImagen } from '../utils/imagen';
import type { SalonTutor } from '../types/tutor';
import fomaTutor from '../assets/fomaTutor.svg';

export function EditarTutor() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sesion = obtenerSesion();
    if (sesion?.rol === 'admin') {
      navigate('/admin', { replace: true });
    } else if (sesion?.rol === 'estudiante') {
      navigate('/app/perfil', { replace: true });
    }
  }, [navigate]);

  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const sesion = obtenerSesion();
    return sesion && (sesion.rol || '').toLowerCase() === 'tutor' ? sesion : null;
  });

  const [descripcion, setDescripcion] = useState(usuario?.descripcion || '');
  const [cursosTexto, setCursosTexto] = useState(
    usuario?.cursos ? usuario.cursos.join(', ') : ''
  );
  const [precio, setPrecio] = useState(
    usuario?.precioHora !== undefined ? String(usuario.precioHora) : '0'
  );
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [salones, setSalones] = useState<SalonTutor[]>([]);
  const [nuevaSedeSalon, setNuevaSedeSalon] = useState('Claustro');
  const [nuevoNombreSalon, setNuevoNombreSalon] = useState('');
  const [nuevoCursoInput, setNuevoCursoInput] = useState('');
  const [guardando, setGuardando] = useState(false);

  const agregarCurso = () => {
    const limpio = nuevoCursoInput.trim();
    if (!limpio) return;
    const listaActual = cursosTexto
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (!listaActual.some((c) => c.toLowerCase() === limpio.toLowerCase())) {
      listaActual.push(limpio);
      setCursosTexto(listaActual.join(', '));
    }
    setNuevoCursoInput('');
  };

  const eliminarCurso = (index: number) => {
    const listaActual = cursosTexto
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    listaActual.splice(index, 1);
    setCursosTexto(listaActual.join(', '));
  };

  const agregarSalon = () => {
    const limpio = nuevoNombreSalon.trim();
    if (!limpio) return;
    setSalones((prev) => [...prev, { sede: nuevaSedeSalon, salon: limpio }]);
    setNuevoNombreSalon('');
  };

  const eliminarSalon = (index: number) => {
    setSalones((prev) => prev.filter((_, i) => i !== index));
  };
  const [guardandoFoto, setGuardandoFoto] = useState(false);
  const [mensajeFoto, setMensajeFoto] = useState<string | null>(null);
  const [modalConfirmacion, setModalConfirmacion] = useState(false);

  useEffect(() => {
    const sesionActual = obtenerSesion();
    if (!sesionActual || (sesionActual.rol || '').toLowerCase() !== 'tutor') {
      navigate('/login', { replace: true });
      return;
    }

    setUsuario(sesionActual);

    // Cargar datos actuales desde MongoDB Atlas
    obtenerTutorPorId(sesionActual.id)
      .then((tutor) => {
        if (tutor) {
          if (tutor.descripcion !== undefined) setDescripcion(tutor.descripcion);
          if (tutor.cursos && Array.isArray(tutor.cursos)) setCursosTexto(tutor.cursos.join(', '));
          if (tutor.precioHora !== undefined) setPrecio(String(tutor.precioHora));
          if (tutor.salones && Array.isArray(tutor.salones)) setSalones(tutor.salones);
        }
      })
      .catch((err) => {
        console.warn('Cargando tutor desde sesión local:', err);
      });
  }, [navigate]);

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
      alert('Por favor selecciona una imagen para subir.');
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
      console.error('Error al guardar foto:', err);
      alert(err instanceof Error ? err.message : 'Error al guardar la foto de perfil en la base de datos.');
    } finally {
      setGuardandoFoto(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    setGuardando(true);

    const listaCursos = cursosTexto
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const precioNum = Number(precio) || 0;

    const salonesFinales = [...salones];
    if (nuevoNombreSalon.trim()) {
      salonesFinales.push({ sede: nuevaSedeSalon, salon: nuevoNombreSalon.trim() });
    }

    const cambios: Partial<Usuario> = {
      descripcion: descripcion.trim(),
      cursos: listaCursos,
      precioHora: precioNum,
      salones: salonesFinales,
    };

    if (fotoPreview) {
      cambios.avatarUrl = fotoPreview;
    }

    try {
      await actualizarTutor(usuario.id, cambios);

      const usuarioActualizado: Usuario = {
        ...usuario,
        ...cambios,
      };

      setUsuario(usuarioActualizado);
      guardarSesion(usuarioActualizado);
      registrarUsuarioLocal(usuarioActualizado);

      setModalConfirmacion(true);
    } catch (err: any) {
      console.error('Error al actualizar tutor:', err);
      alert('Error al guardar los cambios en la base de datos.');
    } finally {
      setGuardando(false);
    }
  };

  const fotoActual = fotoPreview || usuario?.avatarUrl;

  return (
    <div className="editar-tutor-page">
      <Header usuario={usuario} />

      <main className="editar-tutor-main">
        {/* Tarjeta de Foto de perfil con botón dedicado */}
        <section className="editar-tutor-card" aria-label="Foto de perfil" style={{ marginBottom: '24px' }}>
          <div className="editar-tutor-top-bar" />
          <div className="editar-tutor-body">
            <div className="editar-tutor-header">
              <h1 className="editar-tutor-title">Foto de perfil</h1>
              <p className="editar-tutor-subtitle">Actualice su fotografía para que los estudiantes puedan reconocerle</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#7D1128',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '22px',
                  boxShadow: '0 2px 8px rgba(60, 9, 25, 0.15)',
                  flexShrink: 0,
                }}
              >
                {fotoActual ? (
                  <img
                    src={fotoActual}
                    alt="Foto de perfil"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  `${usuario?.nombres?.charAt(0) || 'T'}${usuario?.apellidos?.charAt(0) || 'U'}`
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleSeleccionarArchivo}
                />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Seleccionar foto
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleGuardarFoto}
                    disabled={guardandoFoto || (!fotoPreview && !usuario?.avatarUrl)}
                  >
                    {guardandoFoto ? 'Guardando...' : 'Guardar foto de perfil'}
                  </Button>
                </div>
                {mensajeFoto && (
                  <span style={{ fontSize: '12px', color: 'var(--Vino-tinto)', fontWeight: 600 }}>
                    {mensajeFoto}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* Tarjeta 1: Editar descripción */}
          <section className="editar-tutor-card" aria-label="Editar descripción">
            <div className="editar-tutor-top-bar" />

            <div className="editar-tutor-body">
              <div className="editar-tutor-header">
                <h1 className="editar-tutor-title">Editar descripción</h1>
                <p className="editar-tutor-subtitle">Realiza cambios a tu información de presentación</p>
              </div>

              <textarea
                className="editar-desc-box"
                placeholder="Ingrese el texto a cambiar de su descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </section>

          {/* Tarjeta 2: Editar cursos y Cambiar precio */}
          <section className="editar-tutor-card" aria-label="Editar cursos y precio">
            <div className="editar-tutor-top-bar" />

            <div className="editar-tutor-body">
              <div className="editar-grid-2">
                {/* Columna Izquierda: Cursos */}
                <div className="editar-col-box">
                  <div className="editar-col-header">
                    <h2 className="editar-tutor-title">Editar cursos</h2>
                    <p className="editar-tutor-subtitle">Cursos que puede asesorar</p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      className="editar-input-box"
                      style={{ minHeight: 'auto', height: '40px', fontSize: '13px' }}
                      placeholder="Ej. Álgebra Lineal, Física..."
                      value={nuevoCursoInput}
                      onChange={(e) => setNuevoCursoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          agregarCurso();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={agregarCurso}
                      style={{
                        padding: '0 14px',
                        backgroundColor: 'var(--Vino-tinto)',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      + Agregar
                    </button>
                  </div>

                  {cursosTexto.split(',').map((c) => c.trim()).filter(Boolean).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      {cursosTexto
                        .split(',')
                        .map((c) => c.trim())
                        .filter(Boolean)
                        .map((c, idx) => (
                          <span
                            key={`${c}-${idx}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              backgroundColor: '#F8EFF0',
                              border: '1px solid #D8C0C2',
                              borderRadius: '16px',
                              fontSize: '12px',
                              color: 'var(--Vino-tinto)',
                              fontWeight: 600,
                            }}
                          >
                            {c}
                            <button
                              type="button"
                              onClick={() => eliminarCurso(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#999',
                                cursor: 'pointer',
                                fontSize: '12px',
                                padding: 0,
                                lineHeight: 1,
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                    </div>
                  )}

                  <textarea
                    className="editar-input-box"
                    placeholder="Ingrese los cursos que desea enseñar (separados por coma)"
                    value={cursosTexto}
                    onChange={(e) => setCursosTexto(e.target.value)}
                  />
                </div>

                {/* Columna Derecha: Cambiar precio */}
                <div className="editar-col-box">
                  <div className="editar-col-header">
                    <h2 className="editar-tutor-title">Cambiar precio</h2>
                    <p className="editar-tutor-subtitle">Precio por hora de monitoría en pesos colombianos</p>
                  </div>

                  <input
                    type="number"
                    className="editar-input-box"
                    style={{ minHeight: 'auto', height: '52px' }}
                    placeholder="Ingrese su nuevo precio"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Tarjeta 3: Salones y Sedes para atención presencial */}
          <section className="editar-tutor-card" aria-label="Salones y Sedes">
            <div className="editar-tutor-top-bar" />

            <div className="editar-tutor-body">
              <div className="editar-tutor-header">
                <h2 className="editar-tutor-title">Salones y Sedes para atención presencial</h2>
                <p className="editar-tutor-subtitle">
                  Configure los salones disponibles en cada sede para que los estudiantes puedan seleccionarlos
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <select
                  value={nuevaSedeSalon}
                  onChange={(e) => setNuevaSedeSalon(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #C77C8A',
                    color: 'var(--Vino-tinto)',
                    fontWeight: 600,
                  }}
                  aria-label="Sede del salón"
                >
                  <option value="Claustro">Sede Claustro</option>
                  <option value="Mutis">Sede Mutis</option>
                  <option value="Norte">Sede Norte</option>
                  <option value="Quinta de Mutis">Sede Quinta de Mutis</option>
                </select>

                <input
                  type="text"
                  placeholder="Ej: Casur 311 / Aula 204"
                  value={nuevoNombreSalon}
                  onChange={(e) => setNuevoNombreSalon(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      agregarSalon();
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #C77C8A',
                  }}
                />

                <Button type="button" variant="outline" size="sm" onClick={agregarSalon}>
                  + Agregar salón
                </Button>
              </div>

              {salones.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {salones.map((s, idx) => (
                    <span
                      key={`${s.sede}-${s.salon}-${idx}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: '#FAF4F3',
                        border: '1px solid #EADCDD',
                        borderRadius: '16px',
                        fontSize: '13px',
                        color: 'var(--Vino-tinto)',
                      }}
                    >
                      <strong>{s.salon}</strong> ({s.sede})
                      <button
                        type="button"
                        onClick={() => eliminarSalon(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#7D1128',
                          fontSize: '16px',
                          cursor: 'pointer',
                          lineHeight: 1,
                        }}
                        aria-label={`Eliminar salón ${s.salon}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#8A7B7E', fontStyle: 'italic', fontSize: '13px', margin: 0 }}>
                  Aún no has agregado salones para atención presencial.
                </p>
              )}
            </div>
          </section>

          {/* Botones Guardar y Volver */}
          <div className="editar-actions">
            <Button type="submit" variant="primary" size="md" disabled={guardando}>
              {guardando ? 'Guardando en base de datos...' : 'Guardar cambios'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate('/tutor/perfil')}
            >
              Cancelar y volver a mi perfil
            </Button>
          </div>
        </form>
      </main>

      <img
        src={fomaTutor}
        alt=""
        className="tutor-bottom-shape"
        aria-hidden="true"
      />

      {modalConfirmacion && (
        <div
          className="confirmar-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="confirmar-modal-card">
            <h2 className="confirmar-modal-title">
              Sus cambios se han guardado con éxito
            </h2>
            <p style={{ color: 'var(--Vino-tinto)', marginBottom: '20px', fontSize: '14px' }}>
              Su información ha sido actualizada en la base de datos.
            </p>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/tutor/perfil')}
            >
              Volver al perfil
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditarTutor;
