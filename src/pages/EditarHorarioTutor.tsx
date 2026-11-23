import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditarHorarioTutor.css';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import type { Usuario } from '../types/usuario';
import type { DiaDisponible } from '../types/tutor';
import { obtenerSesion, guardarSesion, registrarUsuarioLocal } from '../utils/auth';
import { obtenerTutorPorId, actualizarTutor } from '../services/tutoresService';
import fomaTutor from '../assets/fomaTutor.svg';

interface DiaConfig {
  clave: string;
  nombre: string;
  numero: number;
}

const DIAS_COLUMNA_IZQ: DiaConfig[] = [
  { clave: 'LU', nombre: 'Lunes', numero: 1 },
  { clave: 'MA', nombre: 'Martes', numero: 2 },
  { clave: 'MI', nombre: 'Miércoles', numero: 3 },
];

const DIAS_COLUMNA_DER: DiaConfig[] = [
  { clave: 'JU', nombre: 'Jueves', numero: 4 },
  { clave: 'VI', nombre: 'Viernes', numero: 5 },
  { clave: 'SA', nombre: 'Sábado', numero: 6 },
];

const FRANJAS_PREDEFINIDAS = [
  '7:00 - 8:30 AM',
  '8:30 - 10:00 AM',
  '9:00 - 10:30 AM',
  '10:00 - 11:30 AM',
  '11:30 - 1:00 PM',
  '1:00 - 2:30 PM',
  '2:00 - 3:30 PM',
  '3:30 - 5:00 PM',
  '4:00 - 5:30 PM',
  '5:00 - 6:30 PM',
];

export function EditarHorarioTutor() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const sesion = obtenerSesion();
    return sesion && (sesion.rol || '').toLowerCase() === 'tutor' ? sesion : null;
  });

  const [diasActivos, setDiasActivos] = useState<string[]>([]);
  const [horasConfiguradas, setHorasConfiguradas] = useState<string[]>([]);
  const [nuevaHora, setNuevaHora] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Cargar datos actuales desde el backend (MongoDB Atlas) al montar
  useEffect(() => {
    const sesionActual = obtenerSesion();
    if (!sesionActual || (sesionActual.rol || '').toLowerCase() !== 'tutor') {
      navigate('/login', { replace: true });
      return;
    }

    setUsuario(sesionActual);

    // Obtener información viva desde MongoDB Atlas
    obtenerTutorPorId(sesionActual.id)
      .then((tutor) => {
        if (tutor && tutor.diasDisponibles && Array.isArray(tutor.diasDisponibles)) {
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

          setDiasActivos(Array.from(new Set(dias)));
          setHorasConfiguradas(Array.from(horasSet));
        } else if (sesionActual.diasDisponibles && Array.isArray(sesionActual.diasDisponibles)) {
          const dias = sesionActual.diasDisponibles.map((d: any) =>
            typeof d === 'string' ? d : d.diaSemana
          );
          setDiasActivos(Array.from(new Set(dias.filter(Boolean))));
        }
      })
      .catch((err) => {
        console.warn('No se pudo cargar tutor de la API, usando sesión local:', err);
        if (sesionActual.diasDisponibles && Array.isArray(sesionActual.diasDisponibles)) {
          const dias = sesionActual.diasDisponibles.map((d: any) =>
            typeof d === 'string' ? d : d.diaSemana
          );
          setDiasActivos(Array.from(new Set(dias.filter(Boolean))));
        }
      });
  }, [navigate]);

  const toggleDia = (diaClave: string) => {
    setDiasActivos((prev) =>
      prev.includes(diaClave)
        ? prev.filter((d) => d !== diaClave)
        : [...prev, diaClave]
    );
  };

  const toggleFranjaPredefinida = (franja: string) => {
    setHorasConfiguradas((prev) =>
      prev.includes(franja)
        ? prev.filter((h) => h !== franja)
        : [...prev, franja]
    );
  };

  const agregarHoraPersonalizada = () => {
    const limpia = nuevaHora.trim();
    if (!limpia) return;
    if (!horasConfiguradas.includes(limpia)) {
      setHorasConfiguradas((prev) => [...prev, limpia]);
    }
    setNuevaHora('');
  };

  const eliminarHora = (hora: string) => {
    setHorasConfiguradas((prev) => prev.filter((h) => h !== hora));
  };

  const handleGuardar = async () => {
    if (!usuario) return;

    setGuardando(true);
    setMensajeError(null);

    const diasNumeros: Record<string, number> = {
      LU: 1,
      MA: 2,
      MI: 3,
      JU: 4,
      VI: 5,
      SA: 6,
    };

    // Construir estructura DiaDisponible con franjas para MongoDB Atlas
    const diasEstructurados: DiaDisponible[] = diasActivos.map((clave) => ({
      diaSemana: clave,
      numero: diasNumeros[clave] || 1,
      disponible: true,
      franjas: horasConfiguradas.map((hora, idx) => ({
        id: `f-${clave.toLowerCase()}-${idx + 1}`,
        texto: hora,
        disponible: true,
      })),
    }));

    try {
      await actualizarTutor(usuario.id, {
        diasDisponibles: diasEstructurados,
      });

      const usuarioActualizado: Usuario = {
        ...usuario,
        diasDisponibles: diasEstructurados,
      };

      setUsuario(usuarioActualizado);
      guardarSesion(usuarioActualizado);
      registrarUsuarioLocal(usuarioActualizado);

      setModalConfirmacion(true);
    } catch (err: any) {
      console.error('Error al guardar horario:', err);
      setMensajeError(
        err?.message || 'Ocurrió un error al guardar el horario en la base de datos.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const renderFilaDia = (dia: DiaConfig) => {
    const activo = diasActivos.includes(dia.clave);

    return (
      <div key={dia.clave} className="horario-dia-row">
        <div
          className={`horario-dia-box ${activo ? 'active' : 'inactive'}`}
          onClick={() => toggleDia(dia.clave)}
          title={`Hacer clic para alternar ${dia.nombre}`}
        >
          <span className="horario-dia-letter">{dia.clave}</span>
          <span className={`horario-dia-dot ${activo ? '' : 'hidden'}`} aria-hidden="true" />
        </div>

        <button
          type="button"
          className={`horario-toggle-switch ${activo ? 'active' : ''}`}
          onClick={() => toggleDia(dia.clave)}
          aria-pressed={activo}
          aria-label={`Alternar disponibilidad ${dia.nombre}`}
        />
        <span className="horario-dia-nombre">{dia.nombre}</span>
      </div>
    );
  };

  return (
    <div className="horario-tutor-page">
      <Header usuario={usuario} />

      <main className="horario-tutor-main">
        <section className="horario-tutor-card" aria-label="Editar horario de disponibilidad">
          <div className="horario-tutor-top-bar" />

          <div className="horario-tutor-body">
            <div className="horario-tutor-header">
              <h1 className="horario-tutor-title">Editar días y horarios de atención</h1>
              <p className="horario-tutor-subtitle">
                Seleccione los días y configure las franjas horarias en las que está disponible para dar tutorías
              </p>
            </div>

            {mensajeError && (
              <div className="horario-error-banner" role="alert">
                {mensajeError}
              </div>
            )}

            {/* SECCIÓN 1: SELECCIÓN DE DÍAS */}
            <div className="horario-section-block">
              <h2 className="horario-section-subtitle">1. Días disponibles</h2>
              <div className="horario-dias-panel">
                <div className="horario-grid-2-cols">
                  {/* Columna Izquierda: LU, MA, MI */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {DIAS_COLUMNA_IZQ.map(renderFilaDia)}
                  </div>

                  {/* Columna Derecha: JU, VI, SA */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {DIAS_COLUMNA_DER.map(renderFilaDia)}
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: FRANJAS HORARIAS */}
            <div className="horario-section-block">
              <h2 className="horario-section-subtitle">2. Franjas horarias de atención</h2>
              <p className="horario-section-desc">
                Seleccione las opciones predefinidas o agregue un horario personalizado para sus tutorías:
              </p>

              <div className="horario-franjas-predefinidas">
                {FRANJAS_PREDEFINIDAS.map((franja) => {
                  const seleccionada = horasConfiguradas.includes(franja);
                  return (
                    <button
                      key={franja}
                      type="button"
                      className={`horario-franja-pill ${seleccionada ? 'activa' : ''}`}
                      onClick={() => toggleFranjaPredefinida(franja)}
                    >
                      {franja} {seleccionada ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>

              {/* Agregar hora personalizada */}
              <div className="horario-custom-row">
                <input
                  type="text"
                  className="horario-custom-input"
                  placeholder="Ej: 8:00 - 9:30 AM"
                  value={nuevaHora}
                  onChange={(e) => setNuevaHora(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      agregarHoraPersonalizada();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={agregarHoraPersonalizada}
                >
                  Agregar franja
                </Button>
              </div>

              {/* Resumen de horas seleccionadas */}
              <div className="horario-horas-seleccionadas">
                <span className="horario-horas-label">Franjas seleccionadas ({horasConfiguradas.length}):</span>
                {horasConfiguradas.length === 0 ? (
                  <p className="horario-vacio-texto">
                    No has seleccionado ninguna franja horaria. Los estudiantes verán el horario vacío hasta que agregues al menos una.
                  </p>
                ) : (
                  <div className="horario-chips-container">
                    {horasConfiguradas.map((hora) => (
                      <span key={hora} className="horario-chip">
                        {hora}
                        <button
                          type="button"
                          className="horario-chip-remove"
                          onClick={() => eliminarHora(hora)}
                          title={`Eliminar ${hora}`}
                          aria-label={`Eliminar franja ${hora}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="horario-footer-actions">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/tutor/perfil')}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleGuardar}
                disabled={guardando}
              >
                {guardando ? 'Guardando en base de datos...' : 'Guardar horario'}
              </Button>
            </div>
          </div>
        </section>
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
              Su disponibilidad de días y franjas horarias ha sido actualizada en la base de datos.
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

export default EditarHorarioTutor;
