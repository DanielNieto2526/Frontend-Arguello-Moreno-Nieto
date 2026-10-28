import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditarHorarioTutor.css';
import { Header } from '../components/Header';
import type { Usuario } from '../types/usuario';
import { obtenerSesion, guardarSesion, registrarUsuarioLocal } from '../utils/auth';
import formaPendientesEstudiantes from '../assets/formaPendientesEstudiantes.svg';

interface DiaConfig {
  clave: string;
  nombre: string;
}

const DIAS_COLUMNA_IZQ: DiaConfig[] = [
  { clave: 'LU', nombre: 'Lunes' },
  { clave: 'MA', nombre: 'Martes' },
  { clave: 'MI', nombre: 'Miércoles' },
];

const DIAS_COLUMNA_DER: DiaConfig[] = [
  { clave: 'JU', nombre: 'Jueves' },
  { clave: 'VI', nombre: 'Viernes' },
  { clave: 'SA', nombre: 'Sábado' },
];

export function EditarHorarioTutor() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<Usuario>(() => {
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

  const [diasActivos, setDiasActivos] = useState<string[]>(
    usuario.diasDisponibles || ['LU', 'MA', 'MI']
  );
  const [modalConfirmacion, setModalConfirmacion] = useState(false);

  const toggleDia = (diaClave: string) => {
    setDiasActivos((prev) =>
      prev.includes(diaClave)
        ? prev.filter((d) => d !== diaClave)
        : [...prev, diaClave]
    );
  };

  const handleGuardar = () => {
    const usuarioActualizado: Usuario = {
      ...usuario,
      diasDisponibles: diasActivos,
    };

    setUsuario(usuarioActualizado);
    guardarSesion(usuarioActualizado);
    registrarUsuarioLocal(usuarioActualizado);

    // Muestra el modal de confirmación según Image 1
    setModalConfirmacion(true);
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
      </div>
    );
  };

  return (
    <div className="horario-tutor-page">
      <Header usuario={usuario} />

      <main className="horario-tutor-main">
        {/* Tarjeta Editar dias según Image 2 */}
        <section className="horario-tutor-card" aria-label="Editar horario de disponibilidad">
          <div className="horario-tutor-top-bar" />

          <div className="horario-tutor-body">
            <div className="horario-tutor-header">
              <h1 className="horario-tutor-title">Editar dias</h1>
              <p className="horario-tutor-subtitle">
                Seleccione los dias que esta disponible para dar tutorias
              </p>
            </div>

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

            <div className="horario-footer-actions">
              <button
                type="button"
                className="horario-btn-guardar"
                onClick={handleGuardar}
              >
                Guardar
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Forma decorativa inferior según Figma */}
      <img
        src={formaPendientesEstudiantes}
        alt=""
        className="tutor-bottom-shape"
        aria-hidden="true"
      />

      {/* Modal: "confirmar Editar Tutor" según Image 1 */}
      {modalConfirmacion && (
        <div
          className="confirmar-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="confirmar-modal-card">
            <h2 className="confirmar-modal-title">
              Sus cambios se han guardado
            </h2>

            <button
              type="button"
              className="confirmar-modal-btn"
              onClick={() => navigate('/tutor/perfil')}
            >
              volver al perfil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditarHorarioTutor;

