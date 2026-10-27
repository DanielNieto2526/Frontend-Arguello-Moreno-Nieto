import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TutoriasPendientes.css';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { TUTORIAS_INICIALES } from '../data/tutoriasIniciales';
import type { TutoriaAgendada } from '../types/tutoria';
import { obtenerSesion } from '../utils/auth';
import formaPendientesEstudiantes from '../assets/formaPendientesEstudiantes.svg';

export function TutoriasPendientes() {
  const navigate = useNavigate();
  const [usuario] = useState(() => obtenerSesion());
  const [tutorias, setTutorias] = useState<TutoriaAgendada[]>(TUTORIAS_INICIALES);

  // Estado para el modal de cancelación
  const [tutoriaACancelar, setTutoriaACancelar] = useState<TutoriaAgendada | null>(null);

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

  const handleConfirmarCancelacion = () => {
    if (tutoriaACancelar) {
      setTutorias((prev) =>
        prev.filter((item) => item.id !== tutoriaACancelar.id)
      );
      setTutoriaACancelar(null);
    }
  };

  return (
    <div className="pendientes-page">

      <Header usuario={usuario} />

      <main className="pendientes-main">
        
        <h1 className="pendientes-title">Tutorias agendadas</h1>

        {/* 3 tarjetas */}
        <section className="tutorias-grid" aria-label="Tutorías agendadas">
          {tutorias.map((tutoria) => (
            <article key={tutoria.id} className="tutoria-card">
              {/* Barra vino tinto */}
              <div className="tutoria-card-top-bar" aria-hidden="true" />

              {/* Avatar + Nombre y semestre */}
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

              {/* horario, tiempo restante y lugar */}
              <div className="tutoria-details-box">
                <div className="tutoria-details-row-top">
                  <span className="tutoria-datetime-text">{tutoria.fechaTexto}</span>
                  <span className="tutoria-countdown-badge">
                    {tutoria.tiempoRestanteTexto}
                  </span>
                </div>
                <span className="tutoria-location-text">{tutoria.lugarTexto}</span>
              </div>

              {/*Materia y botones */}
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
          ))}
        </section>
      </main>

      {/* Forma SVG */}
      <img
        src={formaPendientesEstudiantes}
        alt=""
        className="pendientes-bottom-shape"
        aria-hidden="true"
      />

      {/* onfirmación para cancelar */}
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
