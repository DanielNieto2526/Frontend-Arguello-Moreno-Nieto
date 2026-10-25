import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExplorarTutores.css';
import { Header } from '../components/Header';
import { TUTORES_INICIALES } from '../data/tutoresIniciales';
import type { Tutor } from '../types/tutor';
import { obtenerSesion } from '../utils/auth';

export function ExplorarTutores() {
  const navigate = useNavigate();
  const [usuario] = useState(() => obtenerSesion());

  const [busqueda, setBusqueda] = useState('');
  const [sede, setSede] = useState('Todas');
  const [modalidad, setModalidad] = useState('Todas');
  const [pagina, setPagina] = useState(1);

  // Filtrado de tutores
  const tutoresFiltrados = useMemo(() => {
    return TUTORES_INICIALES.filter((tutor) => {
      const cumpleMateria =
        busqueda.trim() === '' ||
        tutor.materiaPrincipal.toLowerCase().includes(busqueda.toLowerCase()) ||
        tutor.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        `${tutor.nombres} ${tutor.apellidos}`.toLowerCase().includes(busqueda.toLowerCase());

      const cumpleSede =
        sede === 'Todas' || tutor.sede.toLowerCase() === sede.toLowerCase();

      const cumpleModalidad =
        modalidad === 'Todas' ||
        tutor.modalidad.toLowerCase() === modalidad.toLowerCase();

      return cumpleMateria && cumpleSede && cumpleModalidad;
    });
  }, [busqueda, sede, modalidad]);

  const handleAgendar = (tutorId: string) => {
    navigate(`/app/agendar/${tutorId}`);
  };

  const handleVerPerfil = (tutorId: string) => {
    navigate(`/app/tutores/${tutorId}`);
  };

  return (
    <div className="explorar-page">
      {/* Componente Header reutilizable */}
      <Header usuario={usuario} />

      <main className="explorar-main">
        {/* Pill informativo superior */}
        <div className="explorar-badge-sub">
          <span className="explorar-badge-icon" role="img" aria-label="birrete">🎓</span>
          <span>De estudiantes para estudiantes</span>
        </div>

        {/* Título principal */}
        <h1 className="explorar-title">Encuentra TU tutor ideal</h1>

        {/* Barra de Filtros */}
        <section className="explorar-filters-bar" aria-label="Filtros de búsqueda">
          {/* Input de búsqueda por materia */}
          <div className="filter-search-box">
            <span className="filter-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Busca por materia (Calculo)"
              className="filter-search-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="filter-clear-btn"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Selector de Sede */}
          <div className="filter-select-box">
            <select
              className="filter-select"
              value={sede}
              onChange={(e) => setSede(e.target.value)}
              aria-label="Seleccionar sede"
            >
              <option value="Todas">Sede: Todas</option>
              <option value="Claustro">Sede: Claustro</option>
              <option value="Mutis">Sede: Mutis</option>
              <option value="Norte">Sede: Norte</option>
            </select>
            <span className="filter-select-arrow" aria-hidden="true">▼</span>
          </div>

          {/* Selector de Modalidad */}
          <div className="filter-select-box">
            <select
              className="filter-select"
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              aria-label="Seleccionar modalidad"
            >
              <option value="Todas">Modalidad: Todas</option>
              <option value="Presencial">Modalidad: Presencial</option>
              <option value="Virtual">Modalidad: Virtual</option>
            </select>
            <span className="filter-select-arrow" aria-hidden="true">▼</span>
          </div>

          {/* Botón Realizar Consulta */}
          <button
            type="button"
            className="filter-submit-btn"
            onClick={() => setPagina(1)}
          >
            <span>Realizar Consulta</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </section>

        {/* Listado de Tarjetas de Tutores */}
        <section className="tutores-grid" aria-label="Tutores disponibles">
          {tutoresFiltrados.map((tutor: Tutor) => (
            <article key={tutor.id} className="tutor-card">
              {/* Barra superior vino tinto */}
              <div className="tutor-card-top-bar" aria-hidden="true" />

              {/* Cabecera con avatar e información */}
              <header className="tutor-card-header">
                <div className="tutor-avatar-circle" aria-hidden="true">
                  {tutor.iniciales}
                </div>
                <div className="tutor-header-info">
                  <h2
                    className="tutor-name"
                    onClick={() => handleVerPerfil(tutor.id)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => e.key === 'Enter' && handleVerPerfil(tutor.id)}
                  >
                    {tutor.nombres} {tutor.apellidos}
                  </h2>
                  <span className="tutor-subtitle">{tutor.semestreTexto}</span>
                </div>
              </header>

              {/* Descripción */}
              <div className="tutor-card-body">
                <p className="tutor-description">{tutor.descripcion}</p>
              </div>

              {/* Precio */}
              <div className="tutor-price-tag">{tutor.precioFormato}</div>

              {/* Pie con badges y CTA */}
              <footer className="tutor-card-footer">
                <div className="tutor-badges-group">
                  <span className="tutor-subject-badge">{tutor.materiaPrincipal}</span>
                  <span className="tutor-rating-badge">
                    <span className="tutor-star-icon">★</span> {tutor.estrellas} estrellas
                  </span>
                </div>

                <button
                  type="button"
                  className="tutor-agendar-btn"
                  onClick={() => handleAgendar(tutor.id)}
                >
                  Agendar
                </button>
              </footer>
            </article>
          ))}
        </section>

        {/* Paginación */}
        <nav className="explorar-pagination" aria-label="Paginación de resultados">
          <button
            type="button"
            className="pagination-btn"
            disabled={pagina === 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            aria-label="Página anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className={`pagination-btn ${pagina === 1 ? 'active' : ''}`}
            onClick={() => setPagina(1)}
          >
            1
          </button>
          <button
            type="button"
            className={`pagination-btn ${pagina === 2 ? 'active' : ''}`}
            onClick={() => setPagina(2)}
          >
            2
          </button>
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setPagina((p) => p + 1)}
            aria-label="Página siguiente"
          >
            ›
          </button>
        </nav>
      </main>

      {/* Decoración curva inferior suave */}
      <div className="explorar-bottom-curve" aria-hidden="true" />
    </div>
  );
}

export default ExplorarTutores;
