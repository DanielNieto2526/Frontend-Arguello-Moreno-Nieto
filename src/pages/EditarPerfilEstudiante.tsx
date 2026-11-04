import { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditarPerfilEstudiante.css';
import { Header } from '../components/Header';
import type { Usuario } from '../types/usuario';
import { obtenerSesion, guardarSesion, cerrarSesion } from '../utils/auth';
import formaPendientesEstudiantes from '../assets/formaPendientesEstudiantes.svg';

export function EditarPerfilEstudiante() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [usuario, setUsuario] = useState<Usuario>(() => {
    const sesion = obtenerSesion();
    if (!sesion || sesion.rol !== 'estudiante') {
      return {
        id: '1',
        nombres: 'Daniela',
        apellidos: 'Moreno',
        correo: 'dmoreno@urosario.edu.co',
        rol: 'estudiante',
        carrera: 'Ingeniería de Sistemas',
        semestre: 6,
        semestreTexto: 'segundo semestre Ingenieria de Sistemas Energeticos',
        telefono: '320 4051954',
        sede: 'Claustro',
        descripcion:
          'Estudiante activa de la Universidad del Rosario enfocada en el fortalecimiento académico a través de ConectaTutor.',
      };
    }
    return sesion;
  });

  const [telefono, setTelefono] = useState(usuario.telefono || '320 4051954');
  const [correo, setCorreo] = useState(usuario.correo || 'dmoreno@urosario.edu.co');
  const [semestreTexto, setSemestreTexto] = useState(
    usuario.semestreTexto || 'segundo semestre Ingenieria de Sistemas Energeticos'
  );
  const [fotoNombre, setFotoNombre] = useState<string | null>(null);
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const iniciales = `${(usuario.nombres || 'D').charAt(0)}${(usuario.apellidos || 'M').charAt(0)}`.toUpperCase();

  const handleGuardar = () => {
    const usuarioActualizado: Usuario = {
      ...usuario,
      telefono: telefono.trim(),
      correo: correo.trim(),
      semestreTexto: semestreTexto.trim(),
    };
    setUsuario(usuarioActualizado);
    guardarSesion(usuarioActualizado);
    setModalConfirmacion(true);
  };

  const handleCerrarSesion = () => {
    cerrarSesion();
    navigate('/login');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFotoNombre(files[0].name);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFotoNombre(e.dataTransfer.files[0].name);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

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
                {iniciales}
              </div>
              <div className="edita-perfil-user-meta">
                <span className="edita-perfil-user-name">
                  {usuario.nombres} {usuario.apellidos}
                </span>
                <span className="edita-perfil-user-subtitle">
                  {usuario.semestreTexto || '2º semestre ISE - Claustro'}
                </span>
              </div>
            </div>

            {/* Fila con los 3 campos horizontales: Telefono, Correo Institucional, Semestre */}
            <div className="edita-perfil-fields-row">
              <div className="edita-perfil-field-col">
                <label className="edita-perfil-label" htmlFor="input-telefono">
                  Telefono:
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
                  placeholder="segundo semestre Ingenieria de Sistemas Energeticos"
                />
              </div>
            </div>

            {/* Botón naranja EDITAR centrado */}
            <div className="edita-perfil-orange-btn-wrap">
              <button
                type="button"
                className="edita-perfil-btn-orange"
                onClick={handleGuardar}
              >
                EDITAR
              </button>
            </div>
          </div>
        </section>

        {/* Tarjeta 2: Cambio de foto de perfil */}
        <section className="edita-perfil-card" aria-label="Cambio de foto de perfil">
          <div className="edita-perfil-top-bar" />

          <div className="edita-perfil-card-body">
            <h2 className="edita-perfil-heading">Cambio de Foto de perfil</h2>

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
                {fotoNombre ? `Archivo: ${fotoNombre}` : 'Arrastre aca una imagen'}
              </span>
            </div>
          </div>
        </section>

        {/* Botón inferior Cerrara Sesion */}
        <div className="edita-perfil-logout-wrap">
          <button
            type="button"
            className="edita-perfil-btn-logout"
            onClick={handleCerrarSesion}
          >
            Cerrara Sesion
          </button>
        </div>
      </main>

      {/* Modal de confirmación al guardar */}
      {modalConfirmacion && (
        <div className="confirmar-modal-backdrop" role="dialog" aria-modal="true">
          <div className="confirmar-modal-card">
            <h2 className="confirmar-modal-title">Sus cambios se han guardado</h2>
            <button
              type="button"
              className="confirmar-modal-btn"
              onClick={() => setModalConfirmacion(false)}
            >
              volver al perfil
            </button>
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
