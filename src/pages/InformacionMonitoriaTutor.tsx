import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './InformacionMonitoriaTutor.css';
import { Header } from '../components/Header';
import { Cargando } from '../components/Cargando';
import { Button } from '../components/Button';
import { obtenerTutoriaPorId } from '../services/tutoriasService';
import type { TutoriaAgendada } from '../types/tutoria';
import type { Usuario } from '../types/usuario';
import { obtenerSesion } from '../utils/auth';
import fomaTutor from '../assets/fomaTutor.svg';

export function InformacionMonitoriaTutor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const sesion = obtenerSesion();
    return sesion && (sesion.rol || '').toLowerCase() === 'tutor' ? sesion : null;
  });

  useEffect(() => {
    const sesionActual = obtenerSesion();
    if (!sesionActual || (sesionActual.rol || '').toLowerCase() !== 'tutor') {
      navigate('/login', { replace: true });
    } else if (!usuario || usuario.id !== sesionActual.id) {
      setUsuario(sesionActual);
    }
  }, [usuario, navigate]);

  const [tutoria, setTutoria] = useState<TutoriaAgendada | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const idABuscar = id || 'tutoria-1';

    obtenerTutoriaPorId(idABuscar)
      .then((datos) => {
        if (!cancelado) {
          setTutoria(datos);
          setCargando(false);
        }
      })
      .catch((err) => {
        console.error('Error cargando información de monitoría:', err);
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  const listaArchivos: { nombre: string; url?: string; tipo?: string }[] = useMemo(() => {
    if (tutoria?.archivos && Array.isArray(tutoria.archivos) && tutoria.archivos.length > 0) {
      return tutoria.archivos;
    }
    if (tutoria?.archivosAdjuntos && Array.isArray(tutoria.archivosAdjuntos) && tutoria.archivosAdjuntos.length > 0) {
      return tutoria.archivosAdjuntos;
    }
    if (tutoria?.nombresArchivos && Array.isArray(tutoria.nombresArchivos) && tutoria.nombresArchivos.length > 0) {
      return tutoria.nombresArchivos.map((n) => ({ nombre: n }));
    }
    return [];
  }, [tutoria]);

  const handleDescargarArchivo = (archivo: { nombre: string; url?: string; tipo?: string }) => {
    if (archivo.url) {
      const link = document.createElement('a');
      link.href = archivo.url;
      link.download = archivo.nombre || 'archivo_tutoria';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`El archivo "${archivo.nombre}" fue registrado solo por nombre y no cuenta con contenido descargable.`);
    }
  };

  if (cargando) {
    return (
      <div className="info-monitoria-page">
        <Header usuario={usuario} />
        <main className="info-monitoria-main">
          <Cargando texto="Cargando detalles de la monitoría..." />
        </main>
      </div>
    );
  }

  const estudianteNombreCompleto =
    tutoria?.estudianteNombres && tutoria?.estudianteApellidos
      ? `${tutoria.estudianteNombres} ${tutoria.estudianteApellidos}`
      : (tutoria?.estudianteNombres || 'Estudiante');

  const estudianteIniciales =
    tutoria?.estudianteIniciales ||
    (tutoria?.estudianteNombres && tutoria?.estudianteApellidos
      ? `${tutoria.estudianteNombres.charAt(0)}${tutoria.estudianteApellidos.charAt(0)}`
      : 'ES');

  const textoDudas =
    tutoria?.detalles && tutoria.detalles.trim()
      ? tutoria.detalles
      : 'Sin detalles adicionales registrados por el estudiante para esta monitoría.';

  return (
    <div className="info-monitoria-page">
      <Header usuario={usuario} />

      <main className="info-monitoria-main">
        {/* Tarjeta 1: Información de Monitoria */}
        <section className="info-monitoria-card" aria-label="Información de la monitoría">
          <div className="info-monitoria-top-bar" />

          <div className="info-monitoria-body">
            <div className="info-monitoria-header">
              <div>
                <h1 className="info-monitoria-title">Informacion de Monitoria</h1>
                <p className="info-monitoria-subtitle">Informacion a tener en cuenta</p>
              </div>
            </div>

            <div className="info-monitoria-text-box">{textoDudas}</div>

            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--Vino-tinto)', backgroundColor: '#F7F3F3', padding: '6px 12px', borderRadius: '6px', border: '1px solid #EADCDD' }}>
                Duración: {tutoria?.duracionHoras || 1} {(tutoria?.duracionHoras || 1) === 1 ? 'hora' : 'horas'}
              </span>
              {tutoria?.precioTotal ? (
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#047857', backgroundColor: '#ECFDF5', padding: '6px 12px', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                  Total: ${tutoria.precioTotal.toLocaleString('es-CO')} COP
                </span>
              ) : null}
            </div>

            {listaArchivos.length > 0 ? (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span className="info-monitoria-attachment-label" style={{ fontWeight: 600 }}>
                  {listaArchivos.length} {listaArchivos.length === 1 ? 'archivo adjunto' : 'archivos adjuntos'}:
                </span>
                {listaArchivos.map((arch, idx) => (
                  <div
                    key={`${arch.nombre}-${idx}`}
                    className="info-monitoria-attachment-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#FDFBFA',
                      border: '1px solid #ECE0DF',
                      borderRadius: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--Vino-tinto)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '70%',
                      }}
                    >
                      Archivo: {arch.nombre}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDescargarArchivo(arch)}
                    >
                      Descargar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="info-monitoria-attachment-row" style={{ marginTop: '16px' }}>
                <span className="info-monitoria-attachment-label" style={{ color: 'var(--Gris-medio)', fontStyle: 'italic' }}>
                  No hay archivos adjuntos en esta monitoría
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Tarjeta 2: Información Contacto Estudiante */}
        <section className="info-monitoria-card" aria-label="Contacto del estudiante">
          <div className="info-monitoria-top-bar" />

          <div className="info-monitoria-body">
            <div className="info-monitoria-header">
              <div>
                <h2 className="info-monitoria-title">
                  Informacion Contacto {estudianteNombreCompleto}
                </h2>
              </div>

              <div className="info-monitoria-avatar-initials" style={{ overflow: 'hidden' }}>
                {tutoria?.estudianteAvatar ? (
                  <img
                    src={tutoria.estudianteAvatar}
                    alt={estudianteNombreCompleto}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  estudianteIniciales
                )}
              </div>
            </div>

            <div className="info-contact-field">
              <label className="info-contact-label">Telefono:</label>
              <div className="info-contact-value-box">
                {tutoria?.estudianteTelefono || 'No registrado'}
              </div>
            </div>

            <div className="info-contact-grid-2">
              <div className="info-contact-field">
                <label className="info-contact-label">Correo Institucional</label>
                <div className="info-contact-value-box">
                  {tutoria?.estudianteCorreo || 'No registrado'}
                </div>
              </div>

              <div className="info-contact-field">
                <label className="info-contact-label">Semestre / Carrera</label>
                <div className="info-contact-value-box">
                  {tutoria?.estudianteSemestreCompleto ||
                    tutoria?.estudianteCarrera ||
                    'No registrado'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Botón Volver */}
        <div className="info-monitoria-actions">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/tutor/tutorias')}
          >
            Volver
          </Button>
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

export default InformacionMonitoriaTutor;
