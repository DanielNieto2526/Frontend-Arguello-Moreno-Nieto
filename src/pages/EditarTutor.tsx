import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditarTutor.css';
import { Header } from '../components/Header';
import type { Usuario } from '../types/usuario';
import { obtenerSesion, guardarSesion, registrarUsuarioLocal } from '../utils/auth';
import formaPendientesEstudiantes from '../assets/formaPendientesEstudiantes.svg';

export function EditarTutor() {
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

  const [descripcion, setDescripcion] = useState(usuario.descripcion || '');
  const [cursosTexto, setCursosTexto] = useState(
    usuario.cursos ? usuario.cursos.join(', ') : 'Calculo II, Variable Compleja, Analisis Real'
  );
  const [precio, setPrecio] = useState(usuario.precioHora ? String(usuario.precioHora) : '20000');
  const [modalConfirmacion, setModalConfirmacion] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const listaCursos = cursosTexto
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const usuarioActualizado: Usuario = {
      ...usuario,
      descripcion: descripcion.trim(),
      cursos: listaCursos.length > 0 ? listaCursos : usuario.cursos,
      precioHora: Number(precio) || usuario.precioHora || 20000,
    };

    setUsuario(usuarioActualizado);
    guardarSesion(usuarioActualizado);
    registrarUsuarioLocal(usuarioActualizado);

    // Muestra el modal de confirmación según Image 1
    setModalConfirmacion(true);
  };

  return (
    <div className="editar-tutor-page">
      <Header usuario={usuario} />

      <main className="editar-tutor-main">
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* Tarjeta 1: Editar descripción */}
          <section className="editar-tutor-card" aria-label="Editar descripción">
            <div className="editar-tutor-top-bar" />

            <div className="editar-tutor-body">
              <div className="editar-tutor-header">
                <h1 className="editar-tutor-title">Editar descripcion</h1>
                <p className="editar-tutor-subtitle">Realiza cambios a tu info</p>
              </div>

              <textarea
                className="editar-desc-box"
                placeholder="Ingrese el texto a cambiar de su descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </section>

          {/* Tarjeta 2: Editar cursos y Cambiar precio */}
          <section className="editar-tutor-card" aria-label="Editar cursos y precio">
            <div className="editar-tutor-top-bar" />

            <div className="editar-tutor-body">
              <div className="editar-grid-2">
                {/* Columna Izquierda: Cursos */}
                <div className="editar-col-box">
                  <div className="editar-col-header">
                    <h2 className="editar-tutor-title">Editar cursos</h2>
                    <p className="editar-tutor-subtitle">Realiza cambios a tu info</p>
                  </div>

                  <textarea
                    className="editar-input-box"
                    placeholder="Ingrese los cursos que desea enseñar (separados por coma)"
                    value={cursosTexto}
                    onChange={(e) => setCursosTexto(e.target.value)}
                  />
                </div>

                {/* Columna Derecha: Cambiar precio */}
                <div className="editar-col-box">
                  <div className="editar-col-header">
                    <h2 className="editar-tutor-title">Cambiar precio</h2>
                    <p className="editar-tutor-subtitle">Precio por hora de monitoria</p>
                  </div>

                  <input
                    type="number"
                    className="editar-input-box"
                    style={{ minHeight: 'auto', height: '52px' }}
                    placeholder="Ingrese su nuevo precio"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Botones Guardar y Volver */}
          <div className="editar-actions">
            <button type="submit" className="editar-btn-guardar">
              Guardar
            </button>

            <button
              type="button"
              className="editar-btn-volver"
              onClick={() => navigate('/tutor/perfil')}
            >
              Cancelar y volver a mi perfil
            </button>
          </div>
        </form>
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

export default EditarTutor;
