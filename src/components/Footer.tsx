import './Footer.css';

const ANIO_ACTUAL = 2026;

export function Footer() {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-container">
        {/* Marca institucional */}
        <div className="footer-brand-col">
          <div className="footer-logo">
            Conecta<span className="footer-logo-highlight">Tutor</span>
          </div>
          <p className="footer-tagline">
            De estudiantes para estudiantes · Universidad del Rosario
          </p>
        </div>

        {/* Información de contacto requerida */}
        <div className="footer-info-col">
          <div className="footer-item">
            <svg
              className="footer-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="footer-text">Calle 12C # 6-25</span>
          </div>

          <div className="footer-item">
            <svg
              className="footer-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <a href="tel:+576012970200" className="footer-link">
              Línea de atención Bogotá: (601) 297 0200
            </a>
          </div>

          <div className="footer-item">
            <svg
              className="footer-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <a href="mailto:conectatutor@urosario.edu.co" className="footer-link">
              conectatutor@urosario.edu.co
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © {ANIO_ACTUAL} ConectaTutor · Universidad del Rosario. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
