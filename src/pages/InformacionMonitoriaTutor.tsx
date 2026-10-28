import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './InformacionMonitoriaTutor.css';
import { Header } from '../components/Header';
import { Cargando } from '../components/Cargando';
import { obtenerTutoriaPorId } from '../services/tutoriasService';
import type { TutoriaAgendada } from '../types/tutoria';
import type { Usuario } from '../types/usuario';
import { obtenerSesion } from '../utils/auth';
import formaPendientesEstudiantes from '../assets/formaPendientesEstudiantes.svg';

export function InformacionMonitoriaTutor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [usuario] = useState<Usuario | null>(() => {
    const sesion = obtenerSesion();
    if (!sesion || sesion.rol !== 'tutor') {
      return {
        id: '2',
        nombres: 'Daniel',
        apellidos: 'Nieto',
        correo: 'dnieto@urosario.edu.co',
        rol: 'tutor',
        carrera: 'Matematicas Aplicadas y Ciencias de la Computacion',
        semestre: 6,
        semestreTexto: '6º semestre MACC - Claustro',
        cursos: ['Calculo II', 'Variable Compleja', 'Analisis Real'],
        sede: 'Claustro',
        modalidad: 'Híbrida',
        precioHora: 20000,
        descripcion:
          'Sé lo retador que es el paso de Cálculo I a Cálculo II y Álgebra Lineal en los primeros semestres de ingeniería y ciencias. Fui monitor oficial de planta durante 4 semestres consecutivos y comprendo exactamente los errores típicos de parcial y dónde se confunden los conceptos teóricos.',
        diasDisponibles: ['LU', 'MA', 'MI'],
      };
    }
    return sesion;
  });

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

  const handleDescargar = () => {
    const nombreArchivo =
      tutoria?.nombresArchivos && tutoria.nombresArchivos.length > 0
        ? tutoria.nombresArchivos[0]
        : 'taller_integrales_calculo2.pdf';
    alert(`Descargando archivo adjunto: ${nombreArchivo}`);
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
      : 'Daniela Moreno';

  const estudianteIniciales =
    tutoria?.estudianteIniciales ||
    (tutoria?.estudianteNombres && tutoria?.estudianteApellidos
      ? `${tutoria.estudianteNombres.charAt(0)}${tutoria.estudianteApellidos.charAt(0)}`
      : 'DM');

  const textoDudas =
    tutoria?.detalles ||
    'El ultimoTe escribo porque actualmente estoy repasando el tema de integrales impropias en Cálculo II y tengo varias dudas que no he logrado resolver por mi cuenta. Específicamente, se me está dificultando plantear formalmente los límites, identificar las discontinuidades dentro del intervalo y aplicar los criterios de comparación para determinar si convergen o divergen.\n\nTe adjunto el taller asociado al tema.';

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

            <div className="info-monitoria-attachment-row">
              <span className="info-monitoria-attachment-label">1 archivo adjunto</span>
              <button
                type="button"
                className="info-btn-descargar"
                onClick={handleDescargar}
              >
                Descargar
              </button>
            </div>
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

              <div className="info-monitoria-avatar-initials">
                {estudianteIniciales}
              </div>
            </div>

            <div className="info-contact-field">
              <label className="info-contact-label">Telefono:</label>
              <div className="info-contact-value-box">
                {tutoria?.estudianteTelefono || '320 4051954'}
              </div>
            </div>

            <div className="info-contact-grid-2">
              <div className="info-contact-field">
                <label className="info-contact-label">Correo Institucional</label>
                <div className="info-contact-value-box">
                  {tutoria?.estudianteCorreo || 'dmoreno@urosario.edu.co'}
                </div>
              </div>

              <div className="info-contact-field">
                <label className="info-contact-label">Semestre</label>
                <div className="info-contact-value-box">
                  {tutoria?.estudianteSemestreCompleto ||
                    'sexto semestre Ingenieria de Sistemas'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Botón Volver */}
        <div className="info-monitoria-actions">
          <button
            type="button"
            className="info-btn-volver"
            onClick={() => navigate('/tutor/tutorias')}
          >
            Volver
          </button>
        </div>
      </main>

      {/* Forma decorativa inferior según Figma */}
      <img
        src={formaPendientesEstudiantes}
        alt=""
        className="tutor-bottom-shape"
        aria-hidden="true"
      />
    </div>
  );
}

export default InformacionMonitoriaTutor;
