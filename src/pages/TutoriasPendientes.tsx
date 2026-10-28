import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TutoriasPendientes.css';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Cargando } from '../components/Cargando';
import { obtenerTutorias, cancelarTutoria } from '../services/tutoriasService';
import { obtenerMensajeDeError } from '../services/api';
import type { TutoriaAgendada } from '../types/tutoria';
import { obtenerSesion } from '../utils/auth';
import formaPendientesEstudiantes from '../assets/formaPendientesEstudiantes.svg';

export function TutoriasPendientes() {
  const navigate = useNavigate();
  const [usuario] = useState(() => obtenerSesion());

  // Estados asíncronos (Sesión 3)
  const [tutorias, setTutorias] = useState<TutoriaAgendada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorDeCarga, setErrorDeCarga] = useState<string | null>(null);
  const [intentoDeCarga, setIntentoDeCarga] = useState(0);

  // Estado para el modal de cancelación
  const [tutoriaACancelar, setTutoriaACancelar] = useState<TutoriaAgendada | null>(null);

  // Consumo del servicio en useEffect con cleanup
  useEffect(() => {
    let cancelado = false;

    obtenerTutorias()
      .then((datos) => {
        if (!cancelado) {
          setTutorias(datos);
          setCargando(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelado) {
          setErrorDeCarga(obtenerMensajeDeError(error));
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [intentoDeCarga]);

  const handleCalificar = (tutoriaId: string) => {
    navigate(`/app/tutorias/${tutoriaId}/feedback`);
  };

  const handleAbrirLink = (link?: string) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      alert('Enlace de sesión: https://meet.google.com/xyz-qwer-vbn');
    }
  };

  const handleConfirmarCancelacion = async () => {
    if (!tutoriaACancelar) return;
    const id = tutoriaACancelar.id;

    // Actualización optimista e invocación al servicio
    setTutorias((prev) => prev.filter((item) => item.id !== id));
    setTutoriaACancelar(null);

    try {
      await cancelarTutoria(id);
    } catch (error) {
      console.error('Error al cancelar la tutoría en el servicio:', error);
    }
  };

  return (
    <div className="pendientes-page">
      {/* Header reutilizable */}
      <Header usuario={usuario} />

      <main className="pendientes-main">
        {/* Título de la pantalla según Figma */}
        <h1 className="pendientes-title">Tutorias agendadas</h1>

        {/* Estado: Cargando */}
        {cargando && <Cargando texto="Cargando tus tutorías agendadas..." />}

        {/* Estado: Error con botón de reintento */}
        {!cargando && errorDeCarga && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--Rojo-aux)' }} role="alert">
            <p style={{ marginBottom: '16px' }}>{errorDeCarga}</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setCargando(true);
                setErrorDeCarga(null);
                setIntentoDeCarga((i) => i + 1);
              }}
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Grid de 3 tarjetas */}
        {!cargando && !errorDeCarga && (
          <section className="tutorias-grid" aria-label="Tutorías agendadas">
            {tutorias.length === 0 ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6B5B5E', padding: '40px 0' }}>
                No tienes tutorías pendientes ni agendadas en este momento.
              </p>
            ) : (
              tutorias.map((tutoria) => (
                <article key={tutoria.id} className="tutoria-card">
                  {/* Barra superior vino tinto */}
                  <div className="tutoria-card-top-bar" aria-hidden="true" />

                  {/* Encabezado: Avatar + Nombre y semestre */}
                  <header className="tutoria-card-header">
                    <div className="tutoria-avatar-circle" aria-hidden="true">
                      {tutoria.tutorIniciales}
                    </div>
                    <div className="tutoria-tutor-info">
                      <h2 className="tutoria-tutor-name">
                        {tutoria.tutorNombres} {tutoria.tutorApellidos}
                      </h2>
                      <span className="tutoria-tutor-subtitle">
                        {tutoria.tutorSemestreTexto}
                      </span>
                    </div>
                  </header>

                  {/* Caja rosada con horario, tiempo restante y lugar */}
                  <div className="tutoria-details-box">
                    <div className="tutoria-details-row-top">
                      <span className="tutoria-datetime-text">{tutoria.fechaTexto}</span>
                      <span className="tutoria-countdown-badge">
                        {tutoria.tiempoRestanteTexto}
                      </span>
                    </div>
                    <span className="tutoria-location-text">{tutoria.lugarTexto}</span>
                  </div>

                  {/* Pie de la tarjeta: Materia y botones */}
                  <footer className="tutoria-card-footer">
                    <span className="tutoria-materia-badge">{tutoria.materia}</span>

                    <div className="tutoria-actions-group">
                      {tutoria.puedeCalificar && (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => handleCalificar(tutoria.id)}
                        >
                          Calificar
                        </Button>
                      )}

                      {tutoria.esVirtual && tutoria.linkReunion && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAbrirLink(tutoria.linkReunion)}
                        >
                          Link
                        </Button>
                      )}

                      {!tutoria.puedeCalificar && (
                        <Button
                          variant="cancel"
                          size="md"
                          onClick={() => setTutoriaACancelar(tutoria)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </footer>
                </article>
              ))
            )}
          </section>
        )}
      </main>

      {/* Forma SVG decorativa inferior provista en assets */}
      <img
        src={formaPendientesEstudiantes}
        alt=""
        className="pendientes-bottom-shape"
        aria-hidden="true"
      />

      {/* Modal de confirmación para cancelar */}
      {tutoriaACancelar && (
        <div
          className="cancel-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-title"
        >
          <div className="cancel-modal-card">
            <h3 id="cancel-title" className="cancel-modal-title">
              ¿Cancelar tutoría?
            </h3>
            <p className="cancel-modal-text">
              ¿Estás seguro/a de que deseas cancelar la tutoría de{' '}
              <strong>{tutoriaACancelar.materia}</strong> con{' '}
              <strong>
                {tutoriaACancelar.tutorNombres} {tutoriaACancelar.tutorApellidos}
              </strong>{' '}
              programada para el {tutoriaACancelar.fechaTexto}?
            </p>
            <div className="cancel-modal-actions">
              <Button
                variant="cancel"
                size="md"
                onClick={handleConfirmarCancelacion}
              >
                Sí, cancelar
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setTutoriaACancelar(null)}
              >
                Volver
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutoriasPendientes;
