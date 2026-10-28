import './Cargando.css';

export interface CargandoProps {
  texto?: string;
}

export function Cargando({ texto = 'Cargando información...' }: CargandoProps) {
  return (
    <div className="cargando" role="status" aria-live="polite">
      <span className="cargando__spinner" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}

export default Cargando;
