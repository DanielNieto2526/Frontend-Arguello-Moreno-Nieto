import { useState, useEffect, useMemo } from 'react';
import './DashboardAdmin.css';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Cargando } from '../components/Cargando';
import type { Tutor } from '../types/tutor';
import type { Usuario } from '../types/usuario';
import { obtenerSesion } from '../utils/auth';
import {
  obtenerTodasLasSolicitudesAdmin,
  aprobarTutor,
  rechazarTutor,
  alternarEstadoTutor,
} from '../services/adminService';

export function DashboardAdmin() {
  const [adminUser] = useState<Usuario | null>(() => {
    const sesion = obtenerSesion();
    if (sesion && sesion.rol === 'admin') return sesion;
    return {
      id: '3',
      nombres: 'Coordinador',
      apellidos: 'URosario',
      correo: 'coord@urosario.edu.co',
      rol: 'admin',
      carrera: 'Coordinación Académica',
    };
  });

  const [tabActiva, setTabActiva] = useState<'pendientes' | 'gestion'>('pendientes');
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal para ver soporte de notas
  const [tutorVerSoporte, setTutorVerSoporte] = useState<Tutor | null>(null);
  const [errorCargaDoc, setErrorCargaDoc] = useState(false);

  // Modal para rechazar
  const [tutorARechazar, setTutorARechazar] = useState<Tutor | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('La nota obtenida no cumple con el umbral mínimo institucional.');

  const recargarDatos = () => {
    obtenerTodasLasSolicitudesAdmin()
      .then((lista) => {
        setTutores(lista);
      })
      .catch((err) => {
        console.error('Error cargando tutores para admin:', err);
      });
  };

  useEffect(() => {
    let cancelado = false;
    obtenerTodasLasSolicitudesAdmin()
      .then((lista) => {
        if (!cancelado) {
          setTutores(lista);
          setCargando(false);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          console.error('Error cargando tutores para admin:', err);
          setCargando(false);
        }
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Tutores pendientes de revisión de notas
  const solicitudesPendientes = useMemo(() => {
    return tutores.filter((t) => t.estadoAprobacion === 'pendiente');
  }, [tutores]);

  // Tutores aprobados (para gestión de habilitar / deshabilitar)
  const tutoresAprobados = useMemo(() => {
    return tutores.filter((t) => t.estadoAprobacion === 'aprobado');
  }, [tutores]);

  const handleAprobar = async (id: string, nombre: string) => {
    try {
      await aprobarTutor(id);
      setMensajeExito(`El tutor ${nombre} ha sido aprobado exitosamente y ya es visible en el catálogo.`);
      recargarDatos();
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmarRechazo = async () => {
    if (!tutorARechazar) return;
    try {
      await rechazarTutor(tutorARechazar.id, motivoRechazo);
      setMensajeExito(`La solicitud de ${tutorARechazar.nombres} ${tutorARechazar.apellidos} ha sido rechazada.`);
      setTutorARechazar(null);
      recargarDatos();
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAlternarEstado = async (id: string, nombre: string, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    try {
      await alternarEstadoTutor(id, nuevoEstado);
      setMensajeExito(
        `El perfil de ${nombre} ha sido ${nuevoEstado ? 'habilitado' : 'deshabilitado'} en el catálogo.`
      );
      recargarDatos();
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="admin-page">
      <Header usuario={adminUser} />

      <main className="admin-main">
        {/* Cabecera del Panel */}
        <section className="admin-header-section">
          <h1 className="admin-title">Administración de Tutores</h1>
          <p className="admin-subtitle">
            Verifica el rendimiento académico y certificados de notas de los postulantes, aprueba nuevos
            tutores y administra el estado de los perfiles en la plataforma.
          </p>
        </section>

        {/* Mensaje de confirmación temporal */}
        {mensajeExito && (
          <div className="admin-success-toast" role="status">
            <span>✓ {mensajeExito}</span>
          </div>
        )}

        {/* Métricas Rápidas */}
        <section className="admin-stats-grid" aria-label="Resumen de estadísticas">
          <div className="admin-stat-card">
            <span className="admin-stat-number">{solicitudesPendientes.length}</span>
            <span className="admin-stat-label">Solicitudes Pendientes</span>
            <span className="admin-stat-hint">Requieren revisión de notas</span>
          </div>

          <div className="admin-stat-card">
            <span className="admin-stat-number">
              {tutoresAprobados.filter((t) => t.activo !== false).length}
            </span>
            <span className="admin-stat-label">Tutores Habilitados</span>
            <span className="admin-stat-hint">Visibles en catálogo público</span>
          </div>

          <div className="admin-stat-card">
            <span className="admin-stat-number">
              {tutoresAprobados.filter((t) => t.activo === false).length}
            </span>
            <span className="admin-stat-label">Tutores Deshabilitados</span>
            <span className="admin-stat-hint">Ocultos temporalmente</span>
          </div>
        </section>

        {/* Navegación por pestañas */}
        <nav className="admin-tabs-nav" aria-label="Pestañas de administración">
          <button
            type="button"
            className={`admin-tab-btn ${tabActiva === 'pendientes' ? 'active' : ''}`}
            onClick={() => setTabActiva('pendientes')}
          >
            <span>Verificar Solicitudes de Notas</span>
            {solicitudesPendientes.length > 0 && (
              <span className="admin-tab-counter">{solicitudesPendientes.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${tabActiva === 'gestion' ? 'active' : ''}`}
            onClick={() => setTabActiva('gestion')}
          >
            <span>Gestión de Perfiles ({tutoresAprobados.length})</span>
          </button>
        </nav>

        {cargando ? (
          <Cargando texto="Cargando panel de administración..." />
        ) : (
          <>
            {/* PESTAÑA 1: SOLICITUDES PENDIENTES CON VERIFICACIÓN DE NOTAS */}
            {tabActiva === 'pendientes' && (
              <section className="admin-section" aria-label="Solicitudes pendientes">
                {solicitudesPendientes.length === 0 ? (
                  <div className="admin-empty-box">
                    <p className="admin-empty-title">No hay solicitudes pendientes</p>
                    <p className="admin-empty-sub">
                      Todas las postulaciones de tutores y certificados de notas han sido revisados.
                    </p>
                  </div>
                ) : (
                  <div className="admin-cards-grid">
                    {solicitudesPendientes.map((solicitud) => (
                      <article key={solicitud.id} className="admin-applicant-card">
                        <div className="admin-card-top-bar" />

                        <div className="admin-applicant-body">
                          {/* Cabecera del postulante */}
                          <div className="admin-applicant-header">
                            <div className="admin-avatar-circle" aria-hidden="true" style={{ overflow: 'hidden' }}>
                              {solicitud.avatarUrl || solicitud.fotoPerfil ? (
                                <img
                                  src={solicitud.avatarUrl || solicitud.fotoPerfil}
                                  alt={`${solicitud.nombres} ${solicitud.apellidos}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                />
                              ) : (
                                solicitud.iniciales
                              )}
                            </div>
                            <div className="admin-applicant-info">
                              <h2 className="admin-applicant-name">
                                {solicitud.nombres} {solicitud.apellidos}
                              </h2>
                              <span className="admin-applicant-sub">
                                {solicitud.semestreTexto}
                              </span>
                              <span className="admin-applicant-email">
                                {solicitud.correo}
                              </span>
                            </div>
                          </div>

                          {/* Bloque Académico Destacado */}
                          <div className="admin-academic-box">
                            <div className="admin-academic-row">
                              <span className="admin-academic-label">Materia postulada:</span>
                              <strong className="admin-academic-val">{solicitud.materiaPrincipal}</strong>
                            </div>

                            <div className="admin-academic-row">
                              <span className="admin-academic-label">Nota en la materia:</span>
                              <strong className="admin-academic-val">
                                {solicitud.notaMateria ? solicitud.notaMateria.toFixed(1) : '4.5'}
                              </strong>
                            </div>

                            {solicitud.promedioAcumulado && (
                              <div className="admin-academic-row">
                                <span className="admin-academic-label">Promedio Acumulado (PGA):</span>
                                <strong className="admin-academic-val">{solicitud.promedioAcumulado.toFixed(1)}</strong>
                              </div>
                            )}

                            <div className="admin-academic-row">
                              <span className="admin-academic-label">Modalidad y Tarifa:</span>
                              <span className="admin-academic-val">
                                {solicitud.modalidad} · {solicitud.precioFormato}
                              </span>
                            </div>
                          </div>

                          {/* Soporte de notas adjunto */}
                          <div className="admin-doc-row">
                            <div className="admin-doc-info">
                              <span className="admin-doc-name">
                                {solicitud.soporteNotasNombre || 'certificado_notas_oficial.pdf'}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="admin-doc-btn"
                              onClick={() => {
                                setTutorVerSoporte(solicitud);
                                setErrorCargaDoc(false);
                              }}
                            >
                              Ver Soporte
                            </button>
                          </div>

                          {/* Acciones de Aprobación */}
                          <div className="admin-card-actions">
                            <Button
                              variant="primary"
                              size="md"
                              onClick={() =>
                                handleAprobar(
                                  solicitud.id,
                                  `${solicitud.nombres} ${solicitud.apellidos}`
                                )
                              }
                            >
                              Aprobar Tutor
                            </Button>
                            <Button
                              variant="cancel"
                              size="md"
                              onClick={() => setTutorARechazar(solicitud)}
                            >
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* PESTAÑA 2: GESTIÓN DE TUTORES (HABILITAR / DESHABILITAR) */}
            {tabActiva === 'gestion' && (
              <section className="admin-section" aria-label="Gestión de tutores">
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tutor</th>
                        <th>Materia Principal</th>
                        <th>Nota Certificada</th>
                        <th>Calificación</th>
                        <th>Estado Actual</th>
                        <th>Acción de Control</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tutoresAprobados.map((tutor) => {
                        const estaActivo = tutor.activo !== false;
                        const nombreCompleto = `${tutor.nombres} ${tutor.apellidos}`;
                        return (
                          <tr key={tutor.id} className={estaActivo ? 'row-active' : 'row-disabled'}>
                            <td>
                              <div className="admin-table-user">
                                <div className="admin-avatar-small" style={{ overflow: 'hidden' }}>
                                  {tutor.avatarUrl || tutor.fotoPerfil ? (
                                    <img
                                      src={tutor.avatarUrl || tutor.fotoPerfil}
                                      alt={nombreCompleto}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                    />
                                  ) : (
                                    tutor.iniciales
                                  )}
                                </div>
                                <div>
                                  <strong className="admin-user-name">{nombreCompleto}</strong>
                                  <span className="admin-user-sub">{tutor.semestreTexto}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="admin-materia-pill">{tutor.materiaPrincipal}</span>
                            </td>
                            <td>
                              <span className="admin-grade-pill">
                                {tutor.notaMateria ? tutor.notaMateria.toFixed(1) : '4.8'}
                              </span>
                            </td>
                            <td>
                              <span className="admin-stars-val">★ {tutor.estrellas}</span>
                            </td>
                            <td>
                              {estaActivo ? (
                                <span className="admin-status-badge active">
                                  ● Habilitado
                                </span>
                              ) : (
                                <span className="admin-status-badge disabled">
                                  ○ Deshabilitado
                                </span>
                              )}
                            </td>
                            <td>
                              <Button
                                variant={estaActivo ? 'cancel' : 'primary'}
                                size="sm"
                                onClick={() =>
                                  handleAlternarEstado(tutor.id, nombreCompleto, estaActivo)
                                }
                              >
                                {estaActivo ? 'Deshabilitar' : 'Habilitar'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* MODAL DE VISUALIZACIÓN PREVIA DEL CERTIFICADO DE NOTAS */}
      {tutorVerSoporte && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-soporte-title"
        >
          <div className="admin-modal-card admin-modal-card--doc">
            <header className="admin-modal-header">
              <div>
                <h3 id="modal-soporte-title" className="admin-modal-title">
                  {tutorVerSoporte.soporteNotasNombre || 'Certificado de Notas'}
                </h3>
                <span className="admin-modal-subtitle">
                  Postulante: {tutorVerSoporte.nombres} {tutorVerSoporte.apellidos} ·{' '}
                  {tutorVerSoporte.semestreTexto}
                </span>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setTutorVerSoporte(null)}
                aria-label="Cerrar visor"
              >
                ✕
              </button>
            </header>

            {tutorVerSoporte.soporteNotasUrl && !errorCargaDoc ? (
              tutorVerSoporte.soporteNotasUrl.startsWith('data:image/') ||
              /\.(png|jpe?g|webp|gif)$/i.test(tutorVerSoporte.soporteNotasNombre || '') ? (
                <div className="admin-uploaded-doc-wrapper">
                  <img
                    src={tutorVerSoporte.soporteNotasUrl}
                    alt={tutorVerSoporte.soporteNotasNombre || 'Certificado de notas'}
                    className="admin-uploaded-doc-img"
                    onError={() => setErrorCargaDoc(true)}
                  />
                </div>
              ) : (
                <div className="admin-uploaded-doc-wrapper">
                  <object
                    data={tutorVerSoporte.soporteNotasUrl}
                    type="application/pdf"
                    className="admin-uploaded-doc-frame"
                  >
                    <iframe
                      src={tutorVerSoporte.soporteNotasUrl}
                      title={tutorVerSoporte.soporteNotasNombre || 'Documento PDF'}
                      className="admin-uploaded-doc-frame"
                      onError={() => setErrorCargaDoc(true)}
                    >
                      <div className="admin-back-screen">
                        <h2 className="admin-back-title">esto va en el back</h2>
                      </div>
                    </iframe>
                  </object>
                </div>
              )
            ) : (
              <div className="admin-back-screen">
                <h2 className="admin-back-title">esto va en el back</h2>
              </div>
            )}

            <footer className="admin-modal-footer">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  handleAprobar(
                    tutorVerSoporte.id,
                    `${tutorVerSoporte.nombres} ${tutorVerSoporte.apellidos}`
                  );
                  setTutorVerSoporte(null);
                }}
              >
                Aprobar Tutor
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setTutorVerSoporte(null)}
              >
                Cerrar Visor
              </Button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL PARA RECHAZAR SOLICITUD */}
      {tutorARechazar && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-rechazo-title"
        >
          <div className="admin-modal-card">
            <h3 id="modal-rechazo-title" className="admin-modal-title">
              ¿Rechazar postulación de tutor?
            </h3>
            <p className="admin-modal-desc">
              Estás a punto de rechazar la solicitud de{' '}
              <strong>
                {tutorARechazar.nombres} {tutorARechazar.apellidos}
              </strong>{' '}
              para la materia <strong>{tutorARechazar.materiaPrincipal}</strong>.
            </p>

            <div className="admin-modal-field">
              <label htmlFor="motivo-rechazo" className="admin-field-label">
                Motivo del rechazo:
              </label>
              <textarea
                id="motivo-rechazo"
                className="admin-field-textarea"
                rows={3}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
              />
            </div>

            <footer className="admin-modal-footer">
              <Button
                variant="cancel"
                size="md"
                onClick={handleConfirmarRechazo}
              >
                Confirmar Rechazo
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setTutorARechazar(null)}
              >
                Cancelar
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardAdmin;
