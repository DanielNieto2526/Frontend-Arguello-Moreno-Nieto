import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AgendarTutoria.css';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Cargando } from '../components/Cargando';
import { obtenerTutorPorId } from '../services/tutoresService';
import { agendarTutoria } from '../services/tutoriasService';
import { obtenerMensajeDeError } from '../services/api';
import type { Tutor, DiaDisponible } from '../types/tutor';
import { obtenerSesion } from '../utils/auth';

export function AgendarTutoria() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const [usuario] = useState(() => obtenerSesion());

  // Estados asíncronos para cargar tutor
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario de agendamiento
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaDisponible | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>('3:00 - 4:00 PM');
  const [modalidad, setModalidad] = useState<'Presencial' | 'Virtual'>('Presencial');
  const [sedePresencial, setSedePresencial] = useState<string>('Casur 311 - Claustro');
  const [detalles, setDetalles] = useState<string>('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [confirmacionExitosa, setConfirmacionExitosa] = useState(false);

  // Carga asíncrona del tutor seleccionado (Sesión 3)
  useEffect(() => {
    let cancelado = false;
    const idABuscar = tutorId || 'tutor-1';

    obtenerTutorPorId(idABuscar)
      .then((datosTutor) => {
        if (!cancelado) {
          setTutor(datosTutor);
          // Seleccionar por defecto el día viernes 5 o el primer disponible
          const diaPorDefecto =
            datosTutor.diasDisponibles?.find((d) => d.numero === 5 && d.disponible) ||
            datosTutor.diasDisponibles?.find((d) => d.disponible) ||
            null;
          setDiaSeleccionado(diaPorDefecto);
          setCargando(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setError(obtenerMensajeDeError(err));
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [tutorId]);

  // Manejo de carga de archivos (PDF o fotos)
  const handleArchivoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nuevosArchivos = Array.from(e.target.files);
      setArchivos((prev) => [...prev, ...nuevosArchivos]);
    }
  };

  const handleEliminarArchivo = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmar = async (e: FormEvent) => {
    e.preventDefault();
    if (!tutor || !diaSeleccionado) {
      alert('Por favor selecciona un día disponible.');
      return;
    }
    if (!horaSeleccionada) {
      alert('Por favor selecciona una franja horaria.');
      return;
    }

    setGuardando(true);

    try {
      await agendarTutoria({
        tutorId: tutor.id,
        tutorNombres: tutor.nombres,
        tutorApellidos: tutor.apellidos,
        tutorIniciales: tutor.iniciales,
        tutorSemestreTexto: tutor.semestreTexto,
        diaNumero: diaSeleccionado.numero,
        diaSemana: diaSeleccionado.diaSemana,
        mes: 'Septiembre',
        franjaTexto: horaSeleccionada,
        modalidad,
        lugarOSede:
          modalidad === 'Presencial' ? sedePresencial : 'Virtual • Google Meets',
        materia: tutor.materiaPrincipal || 'Cálculo II',
        detalles,
        nombresArchivos: archivos.map((f) => f.name),
      });

      setConfirmacionExitosa(true);
    } catch (err: unknown) {
      alert(obtenerMensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="agendar-page">
        <Header usuario={usuario} />
        <Cargando texto="Cargando disponibilidad del tutor..." />
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="agendar-page">
        <Header usuario={usuario} />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ color: 'var(--Rojo-aux)', marginBottom: '16px' }}>
            {error || 'No se encontró el tutor especificado'}
          </h2>
          <Button variant="primary" onClick={() => navigate('/app/explorar')}>
            Volver a Explorar
          </Button>
        </div>
      </div>
    );
  }

  const franjasActivas = diaSeleccionado?.franjas || [
    { id: 'f-1', texto: '9:00 - 10:30 AM', disponible: true },
    { id: 'f-2', texto: '10:00 - 12:00 PM', disponible: false },
    { id: 'f-3', texto: '2:00 - 3:00 PM', disponible: true },
    { id: 'f-4', texto: '3:00 - 4:00 PM', disponible: true },
  ];

  return (
    <div className="agendar-page">
      <Header usuario={usuario} />

      <main className="agendar-main">
        {/* Título de la pantalla */}
        <h1 className="agendar-title">
          Agendar Tutoria con {tutor.nombres} {tutor.apellidos}
        </h1>

        <form onSubmit={handleConfirmar} style={{ width: '100%' }}>
          {/* Card 1: Seleccionar Día */}
          <section className="agendar-card">
            <div className="agendar-card__top-bar" aria-hidden="true" />
            <div className="agendar-card__content">
              <h2 className="agendar-card__title">Seleccionar Dia</h2>
              <p className="agendar-card__subtitle">Septiembre</p>

              <div className="dias-disponibles-row">
                {tutor.diasDisponibles?.map((dia, index) => {
                  const estaSeleccionado =
                    diaSeleccionado?.numero === dia.numero &&
                    diaSeleccionado?.diaSemana === dia.diaSemana;

                  return (
                    <button
                      key={`${dia.diaSemana}-${dia.numero}-${index}`}
                      type="button"
                      disabled={!dia.disponible}
                      className={`dia-card-btn ${estaSeleccionado ? 'selected' : ''}`}
                      onClick={() => {
                        setDiaSeleccionado(dia);
                        // Si la hora seleccionada previa no está disponible en este día, reiniciar
                        const primeraDisponible = dia.franjas.find((f) => f.disponible);
                        if (primeraDisponible) {
                          setHoraSeleccionada(primeraDisponible.texto);
                        }
                      }}
                      aria-label={`${dia.diaSemana} ${dia.numero}`}
                    >
                      <span className="dia-card__dia-semana">{dia.diaSemana}</span>
                      <span className="dia-card__numero">{dia.numero}</span>
                      <span
                        className={`dia-card__punto ${dia.disponible ? '' : 'disabled'}`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="dias-arrow-container">
                <button
                  type="button"
                  className="dias-arrow-btn"
                  title="Siguiente semana"
                  aria-label="Siguiente semana"
                >
                  →
                </button>
              </div>
            </div>
          </section>

          {/* Fila Inferior con 2 tarjetas */}
          <div className="agendar-bottom-grid">
            {/* Tarjeta Seleccionar Hora */}
            <section className="agendar-card">
              <div className="agendar-card__top-bar" aria-hidden="true" />
              <div className="agendar-card__content">
                <h2 className="agendar-card__title">Seleccionar Hora</h2>

                <div className="horas-grid">
                  {franjasActivas.map((franja) => {
                    const estaSeleccionada = horaSeleccionada === franja.texto;
                    const tachada = !franja.disponible;

                    return (
                      <button
                        key={franja.id}
                        type="button"
                        disabled={tachada}
                        className={`hora-pill-btn ${tachada ? 'tachada' : ''} ${
                          estaSeleccionada ? 'selected' : ''
                        }`}
                        onClick={() => setHoraSeleccionada(franja.texto)}
                      >
                        {franja.texto}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Tarjeta Dividida: Modalidad y Lugar + Info */}
            <section className="agendar-card">
              <div className="agendar-card__top-bar" aria-hidden="true" />
              <div className="modalidad-info-card">
                {/* Columna Izquierda: Modalidad y Lugar */}
                <div className="modalidad-col">
                  <h2 className="agendar-card__title" style={{ marginBottom: '18px' }}>
                    Modalidad y Lugar
                  </h2>

                  {/* Opción Presencial */}
                  <div
                    className={`modalidad-option-box ${
                      modalidad === 'Presencial' ? 'selected' : ''
                    }`}
                    onClick={() => setModalidad('Presencial')}
                  >
                    <div className="modalidad-option-header">
                      <span>Forma presencial</span>
                      <span>{modalidad === 'Presencial' ? '▼' : '›'}</span>
                    </div>

                    {modalidad === 'Presencial' && (
                      <select
                        className="modalidad-sede-select"
                        value={sedePresencial}
                        onChange={(e) => setSedePresencial(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Seleccionar sede presencial"
                      >
                        <option value="Casur 311 - Claustro">Casur 311 - Claustro</option>
                        <option value="Laboratorio 1 - Mutis">Laboratorio 1 - Mutis</option>
                        <option value="Salón 402 - Sede Norte">Salón 402 - Sede Norte</option>
                      </select>
                    )}
                  </div>

                  {/* Opción Remoto */}
                  <div
                    className={`modalidad-option-box ${
                      modalidad === 'Virtual' ? 'selected' : ''
                    }`}
                    onClick={() => setModalidad('Virtual')}
                  >
                    <div className="modalidad-option-header">
                      <span>Acceso Remoto</span>
                      <span>{modalidad === 'Virtual' ? '▼' : '›'}</span>
                    </div>

                    {modalidad === 'Virtual' && (
                      <p style={{ fontSize: '11.5px', color: '#6B5B5E', marginTop: '6px' }}>
                        Se generará enlace automático a Google Meets
                      </p>
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Info y Archivos */}
                <div className="info-col">
                  <h2 className="agendar-card__title" style={{ marginBottom: '14px' }}>
                    Info
                  </h2>

                  <div className="info-textarea-wrapper">
                    <textarea
                      className="info-textarea"
                      placeholder="Detallaes para desarollar en la tutoria. Tambien se pueden subir archivos"
                      value={detalles}
                      onChange={(e) => setDetalles(e.target.value)}
                    />

                    {/* Botón para subir PDF o Fotos */}
                    <label className="file-upload-btn-label">
                      <span>📎 Adjuntar foto o PDF</span>
                      <input
                        type="file"
                        className="file-upload-input"
                        multiple
                        accept="application/pdf,image/*"
                        onChange={handleArchivoChange}
                      />
                    </label>

                    {/* Lista de archivos adjuntos */}
                    {archivos.length > 0 && (
                      <div className="files-preview-list">
                        {archivos.map((file, idx) => (
                          <div key={`${file.name}-${idx}`} className="file-preview-item">
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              📄 {file.name}
                            </span>
                            <button
                              type="button"
                              className="file-remove-btn"
                              onClick={() => handleEliminarArchivo(idx)}
                              title="Quitar archivo"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Barra inferior de confirmación y total */}
          <footer className="agendar-footer-actions">
            <div className="agendar-total-text">
              <span className="agendar-total-label">Total:</span>
              <span className="agendar-total-value">{tutor.precioFormato.split(' ')[0]}</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={guardando}
            >
              {guardando ? 'Agendando...' : 'Confirmar'}
            </Button>
          </footer>
        </form>
      </main>

      {/* Modal de confirmación exitosa */}
      {confirmacionExitosa && (
        <div className="confirmacion-modal-backdrop" role="dialog" aria-modal="true">
          <div className="confirmacion-modal-card">
            <h3 className="confirmacion-modal-title">¡Tutoría Agendada!</h3>
            <div className="confirmacion-modal-details">
              <p><strong>Tutor:</strong> {tutor.nombres} {tutor.apellidos}</p>
              <p>
                <strong>Fecha:</strong> {diaSeleccionado?.diaSemana} {diaSeleccionado?.numero} de Septiembre
              </p>
              <p><strong>Franja:</strong> {horaSeleccionada}</p>
              <p>
                <strong>Modalidad:</strong> {modalidad} (
                {modalidad === 'Presencial' ? sedePresencial : 'Google Meets'})
              </p>
              {archivos.length > 0 && (
                <p><strong>Archivos adjuntos:</strong> {archivos.length}</p>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/app/tutorias')}
            >
              Ir a Mis Tutorías
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgendarTutoria;
