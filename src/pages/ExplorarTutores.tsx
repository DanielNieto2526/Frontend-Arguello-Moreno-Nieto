import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExplorarTutores.css';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Cargando } from '../components/Cargando';
import { obtenerTutores } from '../services/tutoresService';
import { obtenerMensajeDeError } from '../services/api';
import type { Tutor } from '../types/tutor';
import { obtenerSesion } from '../utils/auth';

export function ExplorarTutores() {
  const navigate = useNavigate();
  const [usuario] = useState(() => obtenerSesion());

  // Estados de datos asíncronos (Sesión 3)
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorDeCarga, setErrorDeCarga] = useState<string | null>(null);
  const [intentoDeCarga, setIntentoDeCarga] = useState(0);

  // Estados de filtros y paginación (6 tutores por pantalla según requerimiento)
  const TUTORES_POR_PAGINA = 6;
  const [busqueda, setBusqueda] = useState('');
  const [sede, setSede] = useState('Todas');
  const [modalidad, setModalidad] = useState('Todas');
  const [pagina, setPagina] = useState(1);

  // Consumo asíncrono del servicio con useEffect y bandera de limpieza
  useEffect(() => {
    let cancelado = false;

    obtenerTutores()
      .then((datos) => {
        if (!cancelado) {
          setTutores(datos);
          setCargando(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelado) {
          setErrorDeCarga(obtenerMensajeDeError(error));
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [intentoDeCarga]);

  // Valores derivados: filtrado en memoria sin duplicar estado
  const tutoresFiltrados = useMemo(() => {
    return tutores.filter((tutor) => {
      // Solo mostrar tutores aprobados por el administrador y activos en el catálogo
      const estaAprobado = !tutor.estadoAprobacion || tutor.estadoAprobacion === 'aprobado';
      const estaActivo = tutor.activo !== false;
      if (!estaAprobado || !estaActivo) {
        return false;
      }

      const termino = busqueda.toLowerCase().trim();
      const coincideEnCursos =
        Array.isArray(tutor.cursos) &&
        tutor.cursos.some((c) => (c || '').toLowerCase().includes(termino));

      const cumpleMateria =
        termino === '' ||
        (tutor.materiaPrincipal || '').toLowerCase().includes(termino) ||
        coincideEnCursos ||
        (tutor.descripcion || '').toLowerCase().includes(termino) ||
        `${tutor.nombres} ${tutor.apellidos}`.toLowerCase().includes(termino);

      const cumpleSede =
        sede === 'Todas' || tutor.sede.toLowerCase() === sede.toLowerCase();

      const modTutor = (tutor.modalidad || '').toLowerCase();
      const esHibrido = modTutor.includes('hibrid') || modTutor.includes('híbrid');
      const cumpleModalidad =
        modalidad === 'Todas' ||
        (modalidad === 'Híbrida' && esHibrido) ||
        (modalidad === 'Presencial' && (modTutor === 'presencial' || esHibrido)) ||
        (modalidad === 'Virtual' && (modTutor === 'virtual' || esHibrido)) ||
        modTutor === modalidad.toLowerCase();

      return cumpleMateria && cumpleSede && cumpleModalidad;
    });
  }, [tutores, busqueda, sede, modalidad]);

  // Cálculo de páginas y división de 6 tutores por página
  const totalPaginas = Math.ceil(tutoresFiltrados.length / TUTORES_POR_PAGINA) || 1;

  const tutoresPaginados = useMemo(() => {
    const inicio = (pagina - 1) * TUTORES_POR_PAGINA;
    return tutoresFiltrados.slice(inicio, inicio + TUTORES_POR_PAGINA);
  }, [tutoresFiltrados, pagina]);

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
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setPagina(1);
                }}
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
              onChange={(e) => {
                setSede(e.target.value);
                setPagina(1);
              }}
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
              onChange={(e) => {
                setModalidad(e.target.value);
                setPagina(1);
              }}
              aria-label="Seleccionar modalidad"
            >
              <option value="Todas">Modalidad: Todas</option>
              <option value="Presencial">Modalidad: Presencial</option>
              <option value="Virtual">Modalidad: Virtual</option>
              <option value="Híbrida">Modalidad: Híbrida</option>
            </select>
            <span className="filter-select-arrow" aria-hidden="true">▼</span>
          </div>

          {/* Botón Realizar Consulta */}
          <Button
            variant="pill"
            className="filter-submit-btn"
            onClick={() => setPagina(1)}
          >
            <span>Realizar Consulta</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Button>
        </section>

        {/* Estado Cargando */}
        {cargando && <Cargando texto="Cargando tutores disponibles..." />}

        {/* Estado: Error con botón de reintento */}
        {!cargando && errorDeCarga && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--Rojo-aux)' }} role="alert">
            <p style={{ marginBottom: '16px' }}>{errorDeCarga}</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setCargando(true);
                setErrorDeCarga(null);
                setIntentoDeCarga((i) => i + 1);
              }}
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Listado de Tutores (6 por página) */}
        {!cargando && !errorDeCarga && (
          <section className="tutores-grid" aria-label="Tutores disponibles">
            {tutoresFiltrados.length === 0 ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6B5B5E', padding: '40px 0' }}>
                No se encontraron tutores con los criterios seleccionados.
              </p>
            ) : (
              tutoresPaginados.map((tutor: Tutor) => (
                <article key={tutor.id} className="tutor-card">
                  {/* Barra superior vino tinto */}
                  <div className="tutor-card-top-bar" aria-hidden="true" />

                  {/* Cabecera con avatar e información */}
                  <header className="tutor-card-header">
                    <div className="tutor-avatar-circle" aria-hidden="true" style={{ overflow: 'hidden' }}>
                      {tutor.avatarUrl || tutor.fotoPerfil ? (
                        <img
                          src={tutor.avatarUrl || tutor.fotoPerfil}
                          alt={`${tutor.nombres} ${tutor.apellidos}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        />
                      ) : (
                        tutor.iniciales
                      )}
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

                  <footer className="tutor-card-footer">
                    <div className="tutor-badges-group">
                      <span className="tutor-subject-badge">{tutor.materiaPrincipal}</span>
                      <span className="tutor-rating-badge">
                        <span className="tutor-star-icon">★</span> {tutor.estrellas} estrellas
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleAgendar(tutor.id)}
                    >
                      Agendar
                    </Button>
                  </footer>
                </article>
              ))
            )}
          </section>
        )}

        {/* Paginación dinámica según total de páginas */}
        {!cargando && !errorDeCarga && tutoresFiltrados.length > 0 && totalPaginas > 1 && (
          <nav className="explorar-pagination" aria-label="Paginación de resultados">
            <button
              type="button"
              className="pagination-btn"
              disabled={pagina === 1}
              onClick={() => {
                setPagina((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Página anterior"
            >
              ‹
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numPagina) => (
              <button
                key={numPagina}
                type="button"
                className={`pagination-btn ${pagina === numPagina ? 'active' : ''}`}
                onClick={() => {
                  setPagina(numPagina);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                aria-label={`Página ${numPagina}`}
                aria-current={pagina === numPagina ? 'page' : undefined}
              >
                {numPagina}
              </button>
            ))}

            <button
              type="button"
              className="pagination-btn"
              disabled={pagina === totalPaginas}
              onClick={() => {
                setPagina((p) => Math.min(totalPaginas, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Página siguiente"
            >
              ›
            </button>
          </nav>
        )}
      </main>

      {/* Decoración curva inferior suave */}
      <div className="explorar-bottom-curve" aria-hidden="true" />
    </div>
  );
}

export default ExplorarTutores;
