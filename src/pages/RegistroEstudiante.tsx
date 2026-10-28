import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegistroEstudiante.css';
import { registrarUsuarioLocal, guardarSesion, validarCorreoURosario } from '../utils/auth';
import type { Usuario } from '../types/usuario';

interface StudentFormData {
  nombres: string;
  apellidos: string;
  correo: string;
  semestre: string;
  carrera: string;
  aceptaTerminos: boolean;
}

export function RegisterStudent() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<StudentFormData>({
    nombres: '',
    apellidos: '',
    correo: '',
    semestre: '',
    carrera: '',
    aceptaTerminos: false,
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTabClick = (tab: 'register' | 'login') => {
    if (tab === 'login') {
      navigate('/login');
    } else {
      setActiveTab('register');
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validarCorreoURosario(formData.correo)) {
      setError('El correo debe pertenecer al dominio institucional (@urosario.edu.co).');
      return;
    }

    if (!formData.aceptaTerminos) {
      setError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }

    const nuevoEstudiante: Usuario = {
      id: `estudiante-${Date.now()}`,
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      correo: formData.correo.trim().toLowerCase(),
      clave: 'conecta2026',
      rol: 'estudiante',
      carrera: formData.carrera.trim(),
      semestre: Number(formData.semestre) || 1,
    };

    registrarUsuarioLocal(nuevoEstudiante);
    guardarSesion(nuevoEstudiante);

    navigate('/app/explorar');
  };

  return (
    <div className="register-body">
      <div className="register-card-container">
        {/* Panel Izquierdo Oscuro */}
        <div className="left-panel">
          <div>
            <h1 className="left-panel-title">REGISTRO ESTUDIANTIL</h1>
            <p className="left-panel-subtitle">
              Crea tu cuenta para acceder a la plataforma de tutorías.
            </p>
          </div>
          <div className="logo-text">UROSARIO</div>
        </div>

        {/* Botón Flotante Central */}
        <div className="circle-divider" aria-hidden="true">
          ❯
        </div>

        {/* Panel Derecho del Formulario */}
        <div className="right-panel">
          {/* Pestañas Superiores */}
          <div className="tabs-container">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabClick('register')}
            >
              registrarse
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabClick('login')}
            >
              iniciar sesión
            </button>
          </div>

          {error && <div className="register-error-msg">{error}</div>}

          {activeTab === 'register' ? (
            <form onSubmit={handleSubmit}>
              <div className="input-capsule">
                <label className="capsule-label" htmlFor="nombres">
                  Nombres ▸
                </label>
                <input
                  className="capsule-field"
                  type="text"
                  id="nombres"
                  name="nombres"
                  placeholder="Ej. Juan Manuel"
                  value={formData.nombres}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-capsule">
                <label className="capsule-label" htmlFor="apellidos">
                  Apellidos ▸
                </label>
                <input
                  className="capsule-field"
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  placeholder="Ej. Pérez"
                  value={formData.apellidos}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-capsule">
                <label className="capsule-label" htmlFor="correo">
                  Correo Institucional ▸
                </label>
                <input
                  className="capsule-field"
                  type="email"
                  id="correo"
                  name="correo"
                  placeholder="usuario@urosario.edu.co"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-capsule">
                <label className="capsule-label" htmlFor="semestre">
                  Semestre ▸
                </label>
                <select
                  className="capsule-field"
                  id="semestre"
                  name="semestre"
                  value={formData.semestre}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona semestre...</option>
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

              <div className="input-capsule">
                <label className="capsule-label" htmlFor="carrera">
                  Carrera ▸
                </label>
                <input
                  className="capsule-field"
                  type="text"
                  id="carrera"
                  name="carrera"
                  placeholder="Ej. MACC / Economía"
                  value={formData.carrera}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-footer">
                <label className="terms-label">
                  <input
                    type="checkbox"
                    name="aceptaTerminos"
                    checked={formData.aceptaTerminos}
                    onChange={handleChange}
                    required
                  />
                  Acepto términos y condiciones
                </label>
                <button type="submit" className="submit-btn">
                  registrarse ▸
                </button>
              </div>
            </form>
          ) : (
            <div className="login-placeholder">
              <p>Redirigiendo a inicio de sesión...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegisterStudent;

