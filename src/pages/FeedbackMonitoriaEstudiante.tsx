import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './FeedbackMonitoriaEstudiante.css';
import { obtenerTutoriaPorId, calificarTutoria } from '../services/tutoriasService';
import { guardarNuevaResena } from '../services/resenasService';
import type { TutoriaAgendada } from '../types/tutoria';
import { obtenerSesion } from '../utils/auth';
import formaLogin from '../assets/formaLogin.svg';

export function FeedbackMonitoriaEstudiante() {
  const { tutoriaId } = useParams<{ tutoriaId: string }>();
  const navigate = useNavigate();

  const [tutoria, setTutoria] = useState<TutoriaAgendada | null>(null);
  const [cargando, setCargando] = useState(true);

  // Estados de las 4 preguntas numéricas (1 al 5) según Figma
  const [p1, setP1] = useState<string>('');
  const [p2, setP2] = useState<string>('');
  const [p3, setP3] = useState<string>('');
  const [p4, setP4] = useState<string>('');

  // Estado del textarea de comentarios adicionales (opcional) según Figma
  const [comentarios, setComentarios] = useState<string>('');

  // Estados para validación y modal de confirmación
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [modalEnviado, setModalEnviado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const id = tutoriaId || 'tutoria-1';

    obtenerTutoriaPorId(id)
      .then((datos) => {
        if (!cancelado) {
          setTutoria(datos);
          setCargando(false);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [tutoriaId]);

  const estudianteSesion = useMemo(() => {
    const sesion = obtenerSesion();
    if (sesion && sesion.rol === 'estudiante') {
      return sesion;
    }
    return {
      id: '1',
      nombres: 'Juan Filip',
      apellidos: 'Coral',
      correo: 'jcoral@urosario.edu.co',
      rol: 'estudiante' as const,
      carrera: 'Ing. de Sistemas energeticos',
      semestre: 6,
      semestreTexto: '6º semestre ISE',
    };
  }, []);

  const handleValidarNumero = (
    valor: string,
    setter: (val: string) => void
  ) => {
    if (valor === '') {
      setter('');
      return;
    }
    // Permite números del 1 al 5 (incluso decimales tipo 4.5 o enteros)
    const num = Number(valor);
    if (!isNaN(num) && num >= 1 && num <= 5) {
      setter(valor);
      setErrorValidacion(null);
    }
  };

  const handleEnviarFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    const n1 = parseFloat(p1);
    const n2 = parseFloat(p2);
    const n3 = parseFloat(p3);
    const n4 = parseFloat(p4);

    if (
      isNaN(n1) || n1 < 1 || n1 > 5 ||
      isNaN(n2) || n2 < 1 || n2 > 5 ||
      isNaN(n3) || n3 < 1 || n3 > 5 ||
      isNaN(n4) || n4 < 1 || n4 > 5
    ) {
      setErrorValidacion('Por favor responde las 4 preguntas con una calificación válida del 1 al 5.');
      return;
    }

    setEnviando(true);
    setErrorValidacion(null);

    // Calcular promedio exacto de las 4 preguntas
    const promedio = Math.round(((n1 + n2 + n3 + n4) / 4) * 10) / 10;
    const comentarioTexto = comentarios.trim();

    const tutorIdAsociado = tutoria?.tutorId || 'tutor-jc';
    const tutorNombresAsociados = tutoria
      ? `${tutoria.tutorNombres} ${tutoria.tutorApellidos}`
      : 'Juan Cachon';
    const tutoriaIdAsociada = tutoria?.id || tutoriaId || 'tutoria-1';

    try {
      // 1. Guardar la reseña en el servicio de reseñas y base de datos
      await guardarNuevaResena({
        tutorId: tutorIdAsociado,
        tutorNombres: tutorNombresAsociados,
        tutoriaId: tutoriaIdAsociada,
        autor: `${estudianteSesion.nombres} ${estudianteSesion.apellidos}`,
        calificacion: promedio,
        pregunta1: n1,
        pregunta2: n2,
        pregunta3: n3,
        pregunta4: n4,
        comentario:
          comentarioTexto ||
          `Excelente tutoría. El tutor demostró gran dominio del tema y puntualidad.`,
      });

      // 2. Actualizar el estado de la tutoría en el servicio de tutorías
      await calificarTutoria(tutoriaIdAsociada, promedio, comentarioTexto);

      setEnviando(false);
      setModalEnviado(true);
    } catch (err) {
      console.error('Error al guardar feedback:', err);
      setEnviando(false);
      setModalEnviado(true);
    }
  };

  const handleVolverAlMenu = () => {
    navigate('/app/tutorias');
  };

  const handleVerPerfilTutor = () => {
    const idTutor = tutoria?.tutorId || 'tutor-jc';
    navigate(`/app/tutores/${idTutor}`);
  };

  return (
    <div className="feedback-page">
      {/* Forma decorativa superior derecha provista en assets según Figma */}
      <img
        src={formaLogin}
        alt=""
        className="feedback-top-shape"
        aria-hidden="true"
      />

      <main className="feedback-main">
        {/* Título centrado según Figma */}
        <h1 className="feedback-title">¿Como Calificas La tutoria?</h1>

        {tutoria && (
          <p className="feedback-tutor-sub">
            Tutoría de <strong>{tutoria.materia}</strong> con{' '}
            <strong>
              {tutoria.tutorNombres} {tutoria.tutorApellidos}
            </strong>
          </p>
        )}

        {cargando ? (
          <div className="feedback-loading">Cargando datos de la sesión...</div>
        ) : (
          <form className="feedback-form" onSubmit={handleEnviarFeedback} noValidate>
            <div className="feedback-grid">
              {/* COLUMNA IZQUIERDA: PREGUNTAS DEL 1 AL 4 */}
              <div className="feedback-questions-col">
                {/* Pregunta 1 */}
                <div className="feedback-question-group">
                  <label htmlFor="q1" className="feedback-question-label">
                    1. El Tutor llego a tiempo?
                  </label>
                  <input
                    id="q1"
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={p1}
                    onChange={(e) => handleValidarNumero(e.target.value, setP1)}
                    placeholder="ingrese un numero del 1 al 5"
                    className="feedback-number-input"
                    required
                  />
                </div>

                {/* Pregunta 2 */}
                <div className="feedback-question-group">
                  <label htmlFor="q2" className="feedback-question-label">
                    2. Considera Pertiente El contenido revisado en la Tutoria?
                  </label>
                  <input
                    id="q2"
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={p2}
                    onChange={(e) => handleValidarNumero(e.target.value, setP2)}
                    placeholder="ingrese un numero del 1 al 5"
                    className="feedback-number-input"
                    required
                  />
                </div>

                {/* Pregunta 3 */}
                <div className="feedback-question-group">
                  <label htmlFor="q3" className="feedback-question-label">
                    3. Califique la disposicion del Tutor
                  </label>
                  <input
                    id="q3"
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={p3}
                    onChange={(e) => handleValidarNumero(e.target.value, setP3)}
                    placeholder="ingrese un numero del 1 al 5"
                    className="feedback-number-input"
                    required
                  />
                </div>

                {/* Pregunta 4 */}
                <div className="feedback-question-group">
                  <label htmlFor="q4" className="feedback-question-label">
                    4. Recomendaria esta tutoria a sus compañeros?
                  </label>
                  <input
                    id="q4"
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={p4}
                    onChange={(e) => handleValidarNumero(e.target.value, setP4)}
                    placeholder="ingrese un numero del 1 al 5"
                    className="feedback-number-input"
                    required
                  />
                </div>
              </div>

              {/* COLUMNA DERECHA: COMENTARIOS ADICIONALES (OPCIONAL) */}
              <div className="feedback-comments-col">
                <label htmlFor="comentarios" className="feedback-question-label">
                  4. Comentarios adicionales (opcional)
                </label>
                <textarea
                  id="comentarios"
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  placeholder="Reseña"
                  className="feedback-textarea"
                  rows={8}
                />
              </div>
            </div>

            {/* Mensaje de error de validación si aplica */}
            {errorValidacion && (
              <div className="feedback-error-banner" role="alert">
                {errorValidacion}
              </div>
            )}

            {/* BOTÓN ENVIAR CENTRADO ABAJO SEGÚN FIGMA */}
            <div className="feedback-submit-wrapper">
              <button
                type="submit"
                className="feedback-submit-btn"
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* MODAL DE CONFIRMACIÓN: 'envio feedback' SEGÚN FIGMA */}
      {modalEnviado && (
        <div
          className="feedback-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
        >
          <div className="feedback-modal-card">
            <h2 id="feedback-modal-title" className="feedback-modal-title">
              Su reseña ha sido enviada
            </h2>

            <div className="feedback-modal-actions">
              <button
                type="button"
                className="feedback-modal-btn-menu"
                onClick={handleVolverAlMenu}
              >
                Volver al Menu
              </button>

              <button
                type="button"
                className="feedback-modal-btn-perfil"
                onClick={handleVerPerfilTutor}
              >
                Ver perfil del tutor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedbackMonitoriaEstudiante;
