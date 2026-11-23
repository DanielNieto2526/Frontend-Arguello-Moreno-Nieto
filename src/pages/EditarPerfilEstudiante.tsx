import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditarPerfilEstudiante.css';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import type { Usuario } from '../types/usuario';
import { obtenerSesion, cerrarSesion, guardarSesion, registrarUsuarioLocal } from '../utils/auth';
import { actualizarPerfilUsuario } from '../services/authService';
import { solicitar } from '../services/api';
import formaPendientesEstudiantes from '../assets/formaPendientesEstudiantes.svg';

export function EditarPerfilEstudiante() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sesion = obtenerSesion();
    if (sesion?.rol === 'admin') {
      navigate('/admin', { replace: true });
    } else if (sesion?.rol === 'tutor') {
      navigate('/tutor/perfil', { replace: true });
    }
  }, [navigate]);

  const [usuario, setUsuario] = useState<Usuario>(() => {
    const sesion = obtenerSesion();
    if (!sesion || sesion.rol !== 'estudiante') {
      return {
        id: '',
        nombres: '',
        apellidos: '',
        correo: '',
        rol: 'estudiante',
        carrera: '',
        semestre: 1,
        semestreTexto: '',
        telefono: '',
        sede: 'Claustro',
        descripcion: '',
      };
    }
    return sesion;
  });

  const [telefono, setTelefono] = useState(usuario.telefono || '');
  const [correo, setCorreo] = useState(usuario.correo || '');
  const [semestreTexto, setSemestreTexto] = useState(usuario.semestreTexto || '');

  // Sincronizar en vivo con la base de datos MongoDB Atlas al cargar
  useEffect(() => {
    const sesion = obtenerSesion();
    if (sesion && sesion.id) {
      solicitar<Usuario>(`/usuarios/${sesion.id}`)
        .then((doc) => {
          if (doc) {
            setUsuario(doc);
            setTelefono(doc.telefono || '');
            setCorreo(doc.correo || '');
            setSemestreTexto(doc.semestreTexto || '');
            guardarSesion(doc);
            registrarUsuarioLocal(doc);
          }
        })
        .catch(() => {});
    }
  }, []);
  const [fotoNombre, setFotoNombre] = useState<string | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [guardandoFoto, setGuardandoFoto] = useState(false);
  const [mensajeFoto, setMensajeFoto] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const iniciales = `${(usuario.nombres || 'D').charAt(0)}${(usuario.apellidos || 'M').charAt(0)}`.toUpperCase();

  const procesarArchivo = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    setFotoNombre(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const resultado = event.target?.result as string;
      if (resultado) {
        setFotoPreview(resultado);
        setMensajeFoto('Foto seleccionada. Haz clic en "Guardar foto de perfil" para confirmarla.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      procesarArchivo(files[0]);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleGuardarFoto = async () => {
    const fotoAGuardar = fotoPreview || usuario.avatarUrl;
    if (!fotoAGuardar) {
      alert('Por favor selecciona una foto para subir.');
      return;
    }

    setGuardandoFoto(true);
    setMensajeFoto(null);

    try {
      await actualizarPerfilUsuario(usuario.id, {
        avatarUrl: fotoAGuardar,
      });

      const usuarioActualizado: Usuario = {
        ...usuario,
        avatarUrl: fotoAGuardar,
      };

      setUsuario(usuarioActualizado);
      guardarSesion(usuarioActualizado);
      registrarUsuarioLocal(usuarioActualizado);
      setFotoPreview(null);
      setMensajeFoto('Foto de perfil guardada con exito en la base de datos.');
      setTimeout(() => setMensajeFoto(null), 4000);
    } catch (err: any) {
      console.error('Error al guardar foto:', err);
      alert('Error al guardar la foto de perfil en la base de datos.');
    } finally {
      setGuardandoFoto(false);
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const cambios: Partial<Usuario> = {
        telefono: telefono.trim(),
        correo: correo.trim(),
        semestreTexto: semestreTexto.trim(),
      };

      if (fotoPreview) {
        cambios.avatarUrl = fotoPreview;
      }

      const actualizado = await actualizarPerfilUsuario(usuario.id, cambios);
      setUsuario(actualizado);
      guardarSesion(actualizado);
      registrarUsuarioLocal(actualizado);
      setModalConfirmacion(true);
    } catch (err: any) {
      console.error('Error al actualizar perfil de estudiante:', err);
      alert('Error al guardar los cambios en la base de datos.');
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrarSesion = () => {
    cerrarSesion();
    navigate('/login');
  };

  const fotoActual = fotoPreview || usuario.avatarUrl;

  return (
    <div className="edita-perfil-page">
      <Header usuario={usuario} />

      <main className="edita-perfil-main">
        {/* Título de la pantalla centrado */}
        <h1 className="edita-perfil-title">Edita tu perfil</h1>

        {/* Tarjeta 1: Información de perfil del estudiante */}
        <section className="edita-perfil-card" aria-label="Información de contacto">
          <div className="edita-perfil-top-bar" />

          <div className="edita-perfil-card-body">
            {/* Cabecera del estudiante */}
            <div className="edita-perfil-user-header">
              <div className="edita-perfil-avatar-circle" aria-hidden="true">
                {fotoActual ? (
                  <img
                    src={fotoActual}
                    alt={`${usuario.nombres} ${usuario.apellidos}`}
                    className="edita-perfil-avatar-img"
                  />
                ) : (
                  iniciales
                )}
              </div>
              <div className="edita-perfil-user-meta">
                <span className="edita-perfil-user-name">
                  {usuario.nombres} {usuario.apellidos}
                </span>
                <span className="edita-perfil-user-subtitle">
                  {usuario.semestreTexto || 'Estudiante Universidad del Rosario'}
                </span>
              </div>
            </div>

            {/* Fila con los 3 campos horizontales: Teléfono, Correo Institucional, Semestre */}
            <div className="edita-perfil-fields-row">
              <div className="edita-perfil-field-col">
                <label className="edita-perfil-label" htmlFor="input-telefono">
                  Teléfono:
                </label>
                <input
                  id="input-telefono"
                  type="text"
                  className="edita-perfil-input"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="320 4051954"
                />
              </div>

              <div className="edita-perfil-field-col">
                <label className="edita-perfil-label" htmlFor="input-correo">
                  Correo institucional:
                </label>
                <input
                  id="input-correo"
                  type="email"
                  className="edita-perfil-input"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="usuario@urosario.edu.co"
                />
              </div>

              <div className="edita-perfil-field-col">
                <label className="edita-perfil-label" htmlFor="input-semestre">
                  Semestre:
                </label>
                <input
                  id="input-semestre"
                  type="text"
                  className="edita-perfil-input"
                  value={semestreTexto}
                  onChange={(e) => setSemestreTexto(e.target.value)}
                  placeholder="6º semestre Ingeniería de Sistemas"
                />
              </div>
            </div>

            {/* Botón naranja Guardar centrado */}
            <div className="edita-perfil-orange-btn-wrap">
              <Button
                variant="primary"
                size="md"
                onClick={handleGuardar}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar información'}
              </Button>
            </div>
          </div>
        </section>

        {/* Tarjeta 2: Cambio de foto de perfil con botón dedicado */}
        <section className="edita-perfil-card" aria-label="Cambio de foto de perfil">
          <div className="edita-perfil-top-bar" />

          <div className="edita-perfil-card-body">
            <h2 className="edita-perfil-heading">Foto de perfil</h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '14px' }}>
              Arrastra una imagen o selecciónala desde tu dispositivo para actualizar tu foto de perfil.
            </p>

            <div
              className={`edita-perfil-dropzone ${isDragging ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label="Arrastra o selecciona una foto de perfil"
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
              <span className="edita-perfil-dropzone-text">
                {fotoNombre ? `Archivo seleccionado: ${fotoNombre}` : 'Arrastra aquí una imagen o haz clic para seleccionar'}
              </span>
            </div>

            {/* Acciones y botón dedicado Guardar Foto de Perfil */}
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {fotoActual && (
                  <img
                    src={fotoActual}
                    alt="Previsualización"
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #7D1128' }}
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Examinar foto
                </Button>
              </div>

              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={handleGuardarFoto}
                disabled={guardandoFoto || (!fotoPreview && !usuario.avatarUrl)}
              >
                {guardandoFoto ? 'Guardando foto...' : 'Guardar foto de perfil'}
              </Button>
            </div>

            {mensajeFoto && (
              <p style={{ fontSize: '13px', color: 'var(--Vino-tinto)', fontWeight: 600, marginTop: '12px' }}>
                {mensajeFoto}
              </p>
            )}
          </div>
        </section>

        {/* Botón inferior Cerrar Sesión */}
        <div className="edita-perfil-logout-wrap">
          <button
            type="button"
            className="edita-perfil-btn-logout"
            onClick={handleCerrarSesion}
          >
            Cerrar Sesión
          </button>
        </div>
      </main>

      {/* Modal de confirmación al guardar */}
      {modalConfirmacion && (
        <div className="confirmar-modal-backdrop" role="dialog" aria-modal="true">
          <div className="confirmar-modal-card">
            <h2 className="confirmar-modal-title">Sus cambios se han guardado con éxito</h2>
            <p style={{ color: 'var(--Vino-tinto)', marginBottom: '20px', fontSize: '14px' }}>
              La información de su perfil ha sido actualizada en la base de datos.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setModalConfirmacion(false)}
            >
              Aceptar
            </Button>
          </div>
        </div>
      )}

      {/* Forma orgánica inferior según Figma */}
      <img
        src={formaPendientesEstudiantes}
        alt=""
        className="edita-perfil-bottom-shape"
        aria-hidden="true"
      />
    </div>
  );
}

export default EditarPerfilEstudiante;
