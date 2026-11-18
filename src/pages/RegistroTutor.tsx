import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegistroTutor.css';
import { registrarNuevoTutor } from '../services/tutoresService';
import { validarCorreoURosario } from '../utils/auth';
import { Button } from '../components/Button';

interface TutorFormData {
  nombres: string;
  apellidos: string;
  correo: string;
  clave: string;
  semestre: string;
  carrera: string;
  materiaPrincipal: string;
  notaMateria: string;
  promedioAcumulado: string;
  precioHora: string;
  modalidad: 'Híbrida' | 'Presencial' | 'Virtual';
  descripcion: string;
  aceptaTerminos: boolean;
}

export function RegistroTutor() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState<string>('');
  const [soporteNotasUrl, setSoporteNotasUrl] = useState<string>('');
  const [modalRegistroExitoso, setModalRegistroExitoso] = useState(false);

  const [formData, setFormData] = useState<TutorFormData>({
    nombres: '',
    apellidos: '',
    correo: '',
    clave: '',
    semestre: '6',
    carrera: '',
    materiaPrincipal: '',
    notaMateria: '4.5',
    promedioAcumulado: '4.2',
    precioHora: '20000',
    modalidad: 'Híbrida',
    descripcion: '',
    aceptaTerminos: false,
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNombreArchivo(file.name);

      // Si el archivo es menor a 2.5MB, lo convertimos a DataURL para que persista
      if (file.size <= 2.5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setSoporteNotasUrl(reader.result);
          }
        };
        reader.onerror = () => {
          setSoporteNotasUrl('');
        };
        reader.readAsDataURL(file);
      } else {
        // Para archivos mayores a 2.5MB, el almacenamiento persistente debe ser en el backend
        setSoporteNotasUrl('');
      }

      setError(null);
    }
  };

  const handleTabClick = (tab: 'register' | 'login') => {
    if (tab === 'login') {
      navigate('/login');
    } else {
      setActiveTab('register');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validarCorreoURosario(formData.correo)) {
      setError('El correo debe pertenecer al dominio institucional (@urosario.edu.co).');
      return;
    }

    if (!formData.clave.trim()) {
      setError('Por favor ingresa una contraseña para tu cuenta.');
      return;
    }

    if (formData.clave.trim().length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (!formData.materiaPrincipal.trim()) {
      setError('Por favor indica cuál es tu materia principal a asesorar.');
      return;
    }

    const notaNum = parseFloat(formData.notaMateria);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 5) {
      setError('Por favor ingresa una nota válida en la materia (entre 0.0 y 5.0).');
      return;
    }

    if (notaNum < 4.0) {
      setError('Para postularte como tutor debes haber obtenido una calificación mínima de 4.0 en la materia.');
      return;
    }

    if (!nombreArchivo) {
      setError('Debes adjuntar el soporte o certificado de notas oficial en PDF o imagen para verificar tu calificación.');
      return;
    }

    if (!formData.aceptaTerminos) {
      setError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }

    setGuardando(true);

    try {
      await registrarNuevoTutor({
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        correo: formData.correo.trim().toLowerCase(),
        clave: formData.clave.trim(),
        carrera: formData.carrera.trim() || 'Matemáticas y Computación',
        semestre: Number(formData.semestre) || 6,
        sede: 'Claustro',
        modalidad: formData.modalidad,
        materiaPrincipal: formData.materiaPrincipal.trim(),
        precioHora: Number(formData.precioHora) || 20000,
        descripcion:
          formData.descripcion.trim() ||
          `Monitor de ${formData.materiaPrincipal.trim()} con promedio destacado y vocación pedagógica.`,
        diasDisponibles: ['LU', 'MA', 'MI'],
        notaMateria: notaNum,
        promedioAcumulado: parseFloat(formData.promedioAcumulado) || 4.2,
        soporteNotasNombre: nombreArchivo,
        soporteNotasUrl: soporteNotasUrl || undefined,
      });

      // No se inicia sesión directamente como activo; se notifica que está en revisión
      setModalRegistroExitoso(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al registrar el tutor. Por favor intenta de nuevo.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrarModal = () => {
    setModalRegistroExitoso(false);
    navigate('/login');
  };

  return (
    <div className="register-tutor-body">
      <div className="register-tutor-card-container">
        {/* Panel Izquierdo Oscuro */}
        <div className="register-tutor-left-panel">
          <div>
            <h1 className="register-tutor-left-title">REGISTRO DE TUTORES</h1>
            <p className="register-tutor-left-subtitle">
              Comparte tu conocimiento, apoya a compañeros rosaristas y genera ingresos.
            </p>
          </div>
          <div className="register-tutor-logo-text">UROSARIO</div>
        </div>

        {/* Botón Flotante Central */}
        <div className="register-tutor-circle-divider" aria-hidden="true">
          ❯
        </div>

        {/* Panel Derecho del Formulario */}
        <div className="register-tutor-right-panel">
          {/* Pestañas Superiores */}
          <div className="register-tutor-tabs">
            <button
              type="button"
              className={`register-tutor-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabClick('register')}
            >
              registrarse
            </button>
            <button
              type="button"
              className={`register-tutor-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabClick('login')}
            >
              iniciar sesión
            </button>
          </div>

          {error && <div className="register-tutor-error">{error}</div>}

          {activeTab === 'register' ? (
            <form onSubmit={handleSubmit}>
              <div className="register-tutor-capsule">
                <label className="register-tutor-capsule-label" htmlFor="tutor-nombres">
                  Nombres ▸
                </label>
                <input
                  className="register-tutor-capsule-field"
                  type="text"
                  id="tutor-nombres"
                  name="nombres"
                  placeholder="Ej. Daniel"
                  value={formData.nombres}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="register-tutor-capsule">
                <label className="register-tutor-capsule-label" htmlFor="tutor-apellidos">
                  Apellidos ▸
                </label>
                <input
                  className="register-tutor-capsule-field"
                  type="text"
                  id="tutor-apellidos"
                  name="apellidos"
                  placeholder="Ej. Nieto"
                  value={formData.apellidos}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="register-tutor-capsule">
                <label className="register-tutor-capsule-label" htmlFor="tutor-correo">
                  Correo Institucional ▸
                </label>
                <input
                  className="register-tutor-capsule-field"
                  type="email"
                  id="tutor-correo"
                  name="correo"
                  placeholder="dnieto@urosario.edu.co"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="register-tutor-capsule">
                <label className="register-tutor-capsule-label" htmlFor="tutor-clave">
                  Contraseña ▸
                </label>
                <input
                  className="register-tutor-capsule-field"
                  type="password"
                  id="tutor-clave"
                  name="clave"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.clave}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="register-tutor-capsule">
                <label className="register-tutor-capsule-label" htmlFor="tutor-carrera">
                  Carrera ▸
                </label>
                <input
                  className="register-tutor-capsule-field"
                  type="text"
                  id="tutor-carrera"
                  name="carrera"
                  placeholder="Ej. MACC / Ingeniería de Sistemas"
                  value={formData.carrera}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="register-tutor-capsule">
                <label className="register-tutor-capsule-label" htmlFor="tutor-semestre">
                  Semestre ▸
                </label>
                <select
                  className="register-tutor-capsule-field"
                  id="tutor-semestre"
                  name="semestre"
                  value={formData.semestre}
                  onChange={handleChange}
                  required
                >
                  <option value="1">1° Semestre</option>
                  <option value="2">2° Semestre</option>
                  <option value="3">3° Semestre</option>
                  <option value="4">4° Semestre</option>
                  <option value="5">5° Semestre</option>
                  <option value="6">6° Semestre</option>
                  <option value="7">7° Semestre</option>
                  <option value="8">8° Semestre</option>
                  <option value="9">9° Semestre</option>
                  <option value="10">10° Semestre</option>
                </select>
              </div>

              <div className="register-tutor-capsule">
                <label className="register-tutor-capsule-label" htmlFor="tutor-materia">
                  Materia Principal ▸
                </label>
                <input
                  className="register-tutor-capsule-field"
                  type="text"
                  id="tutor-materia"
                  name="materiaPrincipal"
                  placeholder="Ej. Cálculo II / Análisis Real"
                  value={formData.materiaPrincipal}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* NUEVOS CAMPOS: VERIFICACIÓN DE NOTAS Y CERTIFICADO */}
              <div className="register-tutor-capsule">
                <label className="register-tutor-capsule-label" htmlFor="tutor-nota">
                  Nota en la Materia ▸
                </label>
                <input
                  className="register-tutor-capsule-field"
                  type="number"
                  id="tutor-nota"
                  name="notaMateria"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Ej. 4.6 (mínimo 4.0)"
                  value={formData.notaMateria}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="register-tutor-capsule">
                <label className="register-tutor-capsule-label" htmlFor="tutor-pga">
                  Promedio Acumulado ▸
                </label>
                <input
                  className="register-tutor-capsule-field"
                  type="number"
                  id="tutor-pga"
                  name="promedioAcumulado"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Ej. 4.3"
                  value={formData.promedioAcumulado}
                  onChange={handleChange}
                />
              </div>

              <div className="register-tutor-capsule register-tutor-capsule--file">
                <label className="register-tutor-capsule-label" htmlFor="tutor-archivo">
                  Certificado Notas (PDF/IMG) ▸
                </label>
                <input
                  type="file"
                  id="tutor-archivo"
                  accept=".pdf,image/png,image/jpeg"
                  onChange={handleFileChange}
                  className="register-tutor-hidden-file"
                />
                <label htmlFor="tutor-archivo" className="register-tutor-file-trigger">
                  <span className="register-tutor-file-name">
                    {nombreArchivo ? nombreArchivo : 'Seleccionar archivo (PDF o Imagen)...'}
                  </span>
                  <span className="register-tutor-file-badge">Examinar</span>
                </label>
              </div>

              <div className="register-tutor-capsule">
                <label className="register-tutor-capsule-label" htmlFor="tutor-precio">
                  Tarifa x Hora (COP) ▸
                </label>
                <input
                  className="register-tutor-capsule-field"
                  type="number"
                  id="tutor-precio"
                  name="precioHora"
                  placeholder="20000"
                  value={formData.precioHora}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="register-tutor-capsule">
                <label className="register-tutor-capsule-label" htmlFor="tutor-modalidad">
                  Modalidad ▸
                </label>
                <select
                  className="register-tutor-capsule-field"
                  id="tutor-modalidad"
                  name="modalidad"
                  value={formData.modalidad}
                  onChange={handleChange}
                >
                  <option value="Híbrida">Híbrida</option>
                  <option value="Presencial">Presencial</option>
                  <option value="Virtual">Virtual</option>
                </select>
              </div>

              <div className="register-tutor-capsule">
                <label className="register-tutor-capsule-label" htmlFor="tutor-desc">
                  Descripción ▸
                </label>
                <input
                  className="register-tutor-capsule-field"
                  type="text"
                  id="tutor-desc"
                  name="descripcion"
                  placeholder="Breve reseña de tu experiencia docente"
                  value={formData.descripcion}
                  onChange={handleChange}
                />
              </div>

              <div className="register-tutor-footer">
                <label className="register-tutor-terms">
                  <input
                    type="checkbox"
                    name="aceptaTerminos"
                    checked={formData.aceptaTerminos}
                    onChange={handleChange}
                    required
                  />
                  Acepto términos y condiciones
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={guardando}
                >
                  {guardando ? 'Enviando postulación...' : 'Registrarse como tutor ▸'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="login-placeholder">
              <p>Redirigiendo a inicio de sesión...</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN: POSTULACIÓN PENDIENTE DE REVISIÓN */}
      {modalRegistroExitoso && (
        <div
          className="register-tutor-modal-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="register-tutor-modal-card">
            <p className="register-tutor-modal-text">
              Tu registro y tu certificado de calificaciones{' '}
              <strong>({nombreArchivo || 'Taller_3.pdf'})</strong> han sido recibidos
              satisfactoriamente.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={handleCerrarModal}
            >
              Entendido / Ir al Inicio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistroTutor;
