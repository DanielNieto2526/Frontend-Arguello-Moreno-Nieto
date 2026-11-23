import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AgendarTutoria.css';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Cargando } from '../components/Cargando';
import { obtenerTutorPorId } from '../services/tutoresService';
import { agendarTutoria } from '../services/tutoriasService';
import { obtenerMensajeDeError } from '../services/api';
import { comprimirImagen } from '../utils/imagen';
import type { Tutor } from '../types/tutor';
import { obtenerSesion } from '../utils/auth';

export interface FechaCalendarioReal {
  fechaISO: string;
  diaNumero: number;
  diaSemana: string;
  diaSemanaAbrev: string;
  mesNombre: string;
  mesAbrev: string;
  año: number;
  textoCompleto: string;
  disponible: boolean;
  franjas: Array<{ id: string; texto: string; disponible: boolean }>;
}

export function calcularDuracionHorasDeFranja(franjaTexto: string): number {
  if (!franjaTexto) return 1.5;
  const normalizado = franjaTexto.trim().toUpperCase();

  // Buscar coincidencia como "7:00 - 8:30 AM", "11:30 - 1:00 PM", "2:00 - 4:00 PM", "14:00 - 16:00"
  const regex = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–—aA]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
  const match = normalizado.match(regex);
  if (match) {
    let h1 = parseInt(match[1], 10);
    const m1 = parseInt(match[2], 10);
    const ampm1 = match[3];

    let h2 = parseInt(match[4], 10);
    const m2 = parseInt(match[5], 10);
    const ampm2 = match[6] || ampm1;

    let period2 = ampm2 || (h2 < 12 && h2 >= 7 ? 'AM' : 'PM');
    let period1 = ampm1;
    if (!period1) {
      if (h1 >= 7 && h1 <= 11 && (period2 === 'PM' || period2 === 'AM')) {
        period1 = 'AM';
      } else {
        period1 = period2;
      }
    }

    if (period1 === 'PM' && h1 < 12) h1 += 12;
    if (period1 === 'AM' && h1 === 12) h1 = 0;
    if (period2 === 'PM' && h2 < 12) h2 += 12;
    if (period2 === 'AM' && h2 === 12) h2 = 0;

    const min1 = h1 * 60 + m1;
    const min2 = h2 * 60 + m2;
    let diffMin = min2 - min1;
    if (diffMin <= 0) diffMin += 24 * 60;

    const horas = diffMin / 60;
    return Math.round(horas * 10) / 10;
  }

  // Si no tiene minutos: ej "2 - 4 PM" o "7 - 9 AM"
  const regexSimple = /(\d{1,2})\s*(AM|PM)?\s*[-–—aA]\s*(\d{1,2})\s*(AM|PM)?/i;
  const matchSimple = normalizado.match(regexSimple);
  if (matchSimple) {
    let h1 = parseInt(matchSimple[1], 10);
    const ampm1 = matchSimple[2];
    let h2 = parseInt(matchSimple[3], 10);
    const ampm2 = matchSimple[4] || ampm1;

    let period2 = ampm2 || (h2 < 12 && h2 >= 7 ? 'AM' : 'PM');
    let period1 = ampm1 || (h1 > h2 ? 'AM' : period2);

    if (period1 === 'PM' && h1 < 12) h1 += 12;
    if (period1 === 'AM' && h1 === 12) h1 = 0;
    if (period2 === 'PM' && h2 < 12) h2 += 12;
    if (period2 === 'AM' && h2 === 12) h2 = 0;

    let diff = h2 - h1;
    if (diff <= 0) diff += 24;
    return diff > 0 ? diff : 1.5;
  }

  return 1.5;
}

const DIAS_CLAVES: Record<string, number> = {
  lu: 1, lun: 1, lunes: 1,
  ma: 2, mar: 2, martes: 2,
  mi: 3, mie: 3, miércoles: 3, miercoles: 3,
  ju: 4, jue: 4, jueves: 4,
  vi: 5, vie: 5, viernes: 5,
  sa: 6, sab: 6, sábado: 6, sabado: 6,
  do: 0, dom: 0, domingo: 0,
};

const FRANJAS_POR_DEFECTO = [
  { id: 'f-1', texto: '9:00 - 10:30 AM', disponible: true },
  { id: 'f-2', texto: '11:00 - 12:30 PM', disponible: true },
  { id: 'f-3', texto: '2:00 - 3:30 PM', disponible: true },
  { id: 'f-4', texto: '4:00 - 5:30 PM', disponible: true },
];

function generarFechasReales(tutor: Tutor): FechaCalendarioReal[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const DIAS_NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const DIAS_ABREV = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  const MESES_NOMBRES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const MESES_ABREV = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const diasConfig = Array.isArray(tutor.diasDisponibles) && tutor.diasDisponibles.length > 0
    ? tutor.diasDisponibles
    : ['LU', 'MA', 'MI', 'JU', 'VI'];

  const buscarConfigDia = (date: Date): { disponible: boolean; franjas: Array<{ id: string; texto: string; disponible: boolean }> } | null => {
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const nombreDia = DIAS_NOMBRES[dayOfWeek].toLowerCase();
    const abrevDia = DIAS_ABREV[dayOfWeek].toLowerCase();
    const abrev2 = abrevDia.slice(0, 2);

    for (const cfg of diasConfig) {
      if (!cfg) continue;

      // Si es un string simple ej. 'LU', 'LUN', 'Lunes', o '1'
      if (typeof cfg === 'string') {
        const c = cfg.toLowerCase().trim();
        const num = DIAS_CLAVES[c] !== undefined ? DIAS_CLAVES[c] : (isNaN(Number(c)) ? -1 : Number(c));
        if (num === dayOfWeek || c === nombreDia || c === abrevDia || c === abrev2) {
          return { disponible: true, franjas: FRANJAS_POR_DEFECTO };
        }
        continue;
      }

      // Si es un número simple ej. 1, 2, 3
      if (typeof cfg === 'number') {
        if (cfg === dayOfWeek || (dayOfWeek === 0 && (cfg === 0 || cfg === 7))) {
          return { disponible: true, franjas: FRANJAS_POR_DEFECTO };
        }
        continue;
      }

      // Si es un objeto estructurado
      if (typeof cfg === 'object') {
        if (cfg.disponible === false) continue;

        const numCfg = Number(cfg.numero);
        const nombreCfg = (cfg.diaSemana || '').toLowerCase().trim();
        const numPorClave = DIAS_CLAVES[nombreCfg];

        const coincide =
          numCfg === dayOfWeek ||
          (dayOfWeek === 0 && (numCfg === 0 || numCfg === 7)) ||
          numPorClave === dayOfWeek ||
          nombreCfg === nombreDia ||
          nombreCfg === abrevDia ||
          nombreCfg === abrev2 ||
          nombreDia.startsWith(nombreCfg) ||
          nombreCfg.startsWith(abrev2);

        if (coincide) {
          const franjas = Array.isArray(cfg.franjas) && cfg.franjas.length > 0 ? cfg.franjas : FRANJAS_POR_DEFECTO;
          return { disponible: true, franjas };
        }
      }
    }
    return null;
  };

  const lista: FechaCalendarioReal[] = [];
  for (let i = 0; i < 45; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);

    const dayOfWeek = d.getDay();
    const diaNum = d.getDate();
    const mesNum = d.getMonth();
    const año = d.getFullYear();

    const cfgEncontrada = buscarConfigDia(d);
    const disponible = Boolean(cfgEncontrada && cfgEncontrada.disponible);
    const franjas = cfgEncontrada ? cfgEncontrada.franjas : [];

    lista.push({
      fechaISO: `${año}-${String(mesNum + 1).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`,
      diaNumero: diaNum,
      diaSemana: DIAS_NOMBRES[dayOfWeek],
      diaSemanaAbrev: DIAS_ABREV[dayOfWeek],
      mesNombre: MESES_NOMBRES[mesNum],
      mesAbrev: MESES_ABREV[mesNum],
      año,
      textoCompleto: `${DIAS_NOMBRES[dayOfWeek]} ${diaNum} de ${MESES_NOMBRES[mesNum]}`,
      disponible,
      franjas,
    });
  }

  const soloDisponibles = lista.filter((item) => item.disponible);
  return soloDisponibles.length > 0 ? soloDisponibles : lista;
}

export function AgendarTutoria() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const [usuario] = useState(() => obtenerSesion());

  // Estados asíncronos para cargar tutor
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario de agendamiento
  const [fechasReales, setFechasReales] = useState<FechaCalendarioReal[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<FechaCalendarioReal | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>('');
  const carouselRef = useRef<HTMLDivElement>(null);

  const [modalidad, setModalidad] = useState<'Presencial' | 'Virtual'>('Presencial');
  const [sedePresencial, setSedePresencial] = useState<string>('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string>('');
  const [detalles, setDetalles] = useState<string>('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [confirmacionExitosa, setConfirmacionExitosa] = useState(false);

  // Carga asíncrona del tutor seleccionado (Sesión 3)
  useEffect(() => {
    let cancelado = false;
    const idABuscar = tutorId || 'tutor-1';

    obtenerTutorPorId(idABuscar)
      .then((datosTutor) => {
        if (!cancelado) {
          setTutor(datosTutor);

          const fechasGeneradas = generarFechasReales(datosTutor);
          setFechasReales(fechasGeneradas);

          const primeraFecha = fechasGeneradas.find((f) => f.disponible) || fechasGeneradas[0] || null;
          setFechaSeleccionada(primeraFecha);

          const primeraDisponible = primeraFecha?.franjas?.find((f) => f.disponible);
          setHoraSeleccionada(primeraDisponible ? primeraDisponible.texto : '');

          const materias = Array.from(
            new Set(
              [...(datosTutor.cursos || []), datosTutor.materiaPrincipal]
                .map((m) => (m || '').trim())
                .filter(Boolean)
            )
          );
          if (materias.length > 0) {
            setMateriaSeleccionada(materias[0]);
          }

          if (datosTutor.salones && datosTutor.salones.length > 0) {
            setSedePresencial(`${datosTutor.salones[0].salon} (Sede ${datosTutor.salones[0].sede})`);
          } else {
            setSedePresencial('');
          }
          setCargando(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setError(obtenerMensajeDeError(err));
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [tutorId]);

  const scrollCarousel = (direccion: 'prev' | 'next') => {
    if (carouselRef.current) {
      const shift = direccion === 'prev' ? -280 : 280;
      carouselRef.current.scrollBy({ left: shift, behavior: 'smooth' });
    }
  };

  // Manejo de carga de archivos (PDF o fotos)
  const handleArchivoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nuevosArchivos = Array.from(e.target.files);
      const archivosPesados = nuevosArchivos.filter(
        (f) => f.size > 2.5 * 1024 * 1024 && !f.type.startsWith('image/')
      );
      if (archivosPesados.length > 0) {
        alert(
          `Aviso: El archivo "${archivosPesados[0].name}" supera los 2.5 MB. Se registrará el nombre del archivo en la tutoría; te sugerimos incluir también el enlace (Drive/OneDrive) en los detalles para que tu tutor pueda descargarlo.`
        );
      }
      setArchivos((prev) => [...prev, ...nuevosArchivos]);
    }
  };

  const handleEliminarArchivo = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmar = async (e: FormEvent) => {
    e.preventDefault();
    if (!tutor || !fechaSeleccionada) {
      alert('Por favor selecciona una fecha disponible.');
      return;
    }
    if (!horaSeleccionada) {
      alert('Por favor selecciona una franja horaria.');
      return;
    }

    if (modalidad === 'Presencial' && (!tutor.salones || tutor.salones.length === 0)) {
      alert('El tutor no tiene salones presenciales configurados. Por favor selecciona modalidad Virtual.');
      return;
    }

    setGuardando(true);

    try {
      const duracionHoras = calcularDuracionHorasDeFranja(horaSeleccionada);
      const precioPorHora = Number(tutor.precioHora) || 0;
      const precioTotalCalculado = Math.round(precioPorHora * duracionHoras);
      const fechaTextoCompleta = `${fechaSeleccionada.textoCompleto}, ${horaSeleccionada}`;

      // Convertir archivos para guardado persistente en MongoDB Atlas sin superar el límite de Vercel Serverless (4.5MB)
      const archivosConvertidos = await Promise.all(
        archivos.map(async (file) => {
          // Si es imagen, se comprime automáticamente a <100KB
          if (file.type.startsWith('image/')) {
            try {
              const urlComprimida = await comprimirImagen(file, 800, 0.85);
              return {
                nombre: file.name,
                tipo: file.type,
                url: urlComprimida,
              };
            } catch {
              // fallback
            }
          }

          // Si es PDF u otro archivo de hasta 2.5MB, se convierte a Base64
          if (file.size <= 2.5 * 1024 * 1024) {
            return new Promise<{ nombre: string; tipo: string; url: string }>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  nombre: file.name,
                  tipo: file.type || 'application/pdf',
                  url: reader.result as string,
                });
              };
              reader.onerror = () => {
                resolve({
                  nombre: file.name,
                  tipo: file.type || 'application/pdf',
                  url: '',
                });
              };
              reader.readAsDataURL(file);
            });
          }

          // Para archivos mayores a 2.5MB (como notebooks de Colab o talleres pesados), se registra el nombre
          return {
            nombre: file.name,
            tipo: file.type || 'application/pdf',
            url: '',
          };
        })
      );

      await agendarTutoria({
        tutorId: tutor.id,
        tutorUsuarioId: (tutor as any).usuarioId || tutor.id,
        tutorNombres: tutor.nombres,
        tutorApellidos: tutor.apellidos,
        tutorIniciales: tutor.iniciales,
        tutorSemestreTexto: tutor.semestreTexto,
        tutorAvatar: tutor.avatarUrl || tutor.fotoPerfil || '',
        fechaISO: fechaSeleccionada.fechaISO,
        diaNumero: fechaSeleccionada.diaNumero,
        diaSemana: fechaSeleccionada.diaSemana,
        mes: fechaSeleccionada.mesNombre,
        año: fechaSeleccionada.año,
        fechaTexto: fechaTextoCompleta,
        franjaTexto: horaSeleccionada,
        modalidad,
        lugarOSede:
          modalidad === 'Presencial' ? sedePresencial : 'Virtual • Google Meets',
        materia: materiaSeleccionada || tutor.materiaPrincipal || 'Cálculo II',
        duracionHoras,
        precioHora: precioPorHora,
        precioTotal: precioTotalCalculado,
        detalles,
        nombresArchivos: archivos.map((f) => f.name),
        archivos: archivosConvertidos,
        archivosAdjuntos: archivosConvertidos,
        estudianteId: usuario?.id,
        estudianteNombres: usuario?.nombres,
        estudianteApellidos: usuario?.apellidos,
        estudianteCorreo: usuario?.correo,
        estudianteTelefono: usuario?.telefono,
        estudianteCarrera: usuario?.carrera,
        estudianteSemestreCompleto: usuario?.semestreTexto,
        estudianteAvatar: usuario?.avatarUrl,
      });

      setConfirmacionExitosa(true);
    } catch (err: unknown) {
      alert(obtenerMensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="agendar-page">
        <Header usuario={usuario} />
        <Cargando texto="Cargando disponibilidad del tutor..." />
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="agendar-page">
        <Header usuario={usuario} />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ color: 'var(--Rojo-aux)', marginBottom: '16px' }}>
            {error || 'No se encontró el tutor especificado'}
          </h2>
          <Button variant="primary" onClick={() => navigate('/app/explorar')}>
            Volver a Explorar
          </Button>
        </div>
      </div>
    );
  }

  const franjasActivas = fechaSeleccionada?.franjas || [];

  const materiasDisponibles = Array.from(
    new Set(
      [...(tutor?.cursos || []), tutor?.materiaPrincipal]
        .map((m) => (m || '').trim())
        .filter(Boolean)
    )
  );

  const duracionHoras = calcularDuracionHorasDeFranja(horaSeleccionada);
  const precioPorHora = Number(tutor.precioHora) || 0;
  const precioTotalCalculado = Math.round(precioPorHora * duracionHoras);

  return (
    <div className="agendar-page">
      <Header usuario={usuario} />

      <main className="agendar-main">
        {/* Título de la pantalla */}
        <h1 className="agendar-title">
          Agendar Tutoría con {tutor.nombres} {tutor.apellidos}
        </h1>

        <form onSubmit={handleConfirmar} style={{ width: '100%' }}>
          {/* Card 1: Seleccionar Día con carrusel real */}
          <section className="agendar-card">
            <div className="agendar-card__top-bar" aria-hidden="true" />
            <div className="agendar-card__content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h2 className="agendar-card__title" style={{ marginBottom: 0 }}>Seleccionar Día</h2>
                {fechaSeleccionada && (
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--Vino-tinto)' }}>
                    {fechaSeleccionada.mesNombre} {fechaSeleccionada.año}
                  </span>
                )}
              </div>
              <p className="agendar-card__subtitle">Fechas disponibles configuradas por el tutor</p>

              {fechasReales.length === 0 || !tutor.diasDisponibles || tutor.diasDisponibles.length === 0 ? (
                <p style={{ color: 'var(--Gris-medio)', fontStyle: 'italic', padding: '12px 0' }}>
                  El tutor aún no ha configurado sus días de atención.
                </p>
              ) : (
                <div className="dias-carousel-wrapper">
                  <button
                    type="button"
                    className="dias-nav-btn"
                    onClick={() => scrollCarousel('prev')}
                    title="Fechas anteriores"
                    aria-label="Fechas anteriores"
                  >
                    ‹
                  </button>

                  <div className="dias-disponibles-row" ref={carouselRef}>
                    {fechasReales.map((item) => {
                      const estaSeleccionado = fechaSeleccionada?.fechaISO === item.fechaISO;

                      return (
                        <button
                          key={item.fechaISO}
                          type="button"
                          disabled={!item.disponible}
                          className={`dia-card-btn ${estaSeleccionado ? 'selected' : ''}`}
                          onClick={() => {
                            setFechaSeleccionada(item);
                            const primera = item.franjas.find((f) => f.disponible);
                            setHoraSeleccionada(primera ? primera.texto : '');
                          }}
                          aria-label={item.textoCompleto}
                        >
                          <span className="dia-card__dia-semana">{item.diaSemana}</span>
                          <span className="dia-card__numero">{item.diaNumero}</span>
                          <span className="dia-card__mes">{item.mesAbrev}</span>
                          <span className={`dia-card__punto ${item.disponible ? '' : 'disabled'}`} />
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="dias-nav-btn"
                    onClick={() => scrollCarousel('next')}
                    title="Fechas posteriores"
                    aria-label="Fechas posteriores"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Fila Inferior con 2 tarjetas */}
          <div className="agendar-bottom-grid">
            {/* Tarjeta Seleccionar Hora y Duración */}
            <section className="agendar-card">
              <div className="agendar-card__top-bar" aria-hidden="true" />
              <div className="agendar-card__content">
                <h2 className="agendar-card__title">Seleccionar Hora</h2>

                <div className="horas-grid">
                  {franjasActivas.length === 0 ? (
                    <p style={{ gridColumn: '1 / -1', color: 'var(--Gris-medio)', fontStyle: 'italic', padding: '12px 0' }}>
                      El tutor no ha configurado franjas horarias para este día.
                    </p>
                  ) : (
                    franjasActivas.map((franja) => {
                      const estaSeleccionada = horaSeleccionada === franja.texto;
                      const tachada = !franja.disponible;

                      return (
                        <button
                          key={franja.id}
                          type="button"
                          disabled={tachada}
                          className={`hora-pill-btn ${tachada ? 'tachada' : ''} ${
                            estaSeleccionada ? 'selected' : ''
                          }`}
                          onClick={() => setHoraSeleccionada(franja.texto)}
                        >
                          {franja.texto}
                        </button>
                      );
                    })
                  )}
                </div>

                {horaSeleccionada && (
                  <div style={{ marginTop: '16px', padding: '10px 14px', backgroundColor: '#FDF7F5', border: '1px solid #F5D3C8', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#6B5B5E' }}>
                      Franja horaria: <strong>{horaSeleccionada}</strong> ({duracionHoras} {duracionHoras === 1 ? 'hora' : 'horas'})
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--Vino-tinto)' }}>
                      ${precioTotalCalculado.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Tarjeta Dividida: Modalidad y Lugar + Info */}
            <section className="agendar-card">
              <div className="agendar-card__top-bar" aria-hidden="true" />
              <div className="modalidad-info-card">
                {/* Columna Izquierda: Materia y Modalidad/Lugar */}
                <div className="modalidad-col">
                  {/* Selector de Materia que ofrece el tutor */}
                  <div style={{ marginBottom: '18px' }}>
                    <h2 className="agendar-card__title" style={{ marginBottom: '8px' }}>
                      Materia a Asesorar
                    </h2>
                    {materiasDisponibles.length > 1 ? (
                      <select
                        className="modalidad-sede-select"
                        value={materiaSeleccionada}
                        onChange={(e) => setMateriaSeleccionada(e.target.value)}
                        aria-label="Seleccionar materia disponible del tutor"
                      >
                        {materiasDisponibles.map((mat) => (
                          <option key={mat} value={mat}>
                            {mat}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ padding: '9px 12px', backgroundColor: '#F7F3F3', border: '1px solid #E0D5D6', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--Vino-tinto)' }}>
                        {materiaSeleccionada || tutor.materiaPrincipal || 'Cálculo II'}
                      </div>
                    )}
                  </div>

                  <h2 className="agendar-card__title" style={{ marginBottom: '18px' }}>
                    Modalidad y Lugar
                  </h2>

                  {/* Opción Presencial */}
                  <div
                    className={`modalidad-option-box ${
                      modalidad === 'Presencial' ? 'selected' : ''
                    }`}
                    onClick={() => setModalidad('Presencial')}
                  >
                    <div className="modalidad-option-header">
                      <span>Forma presencial</span>
                      <span>{modalidad === 'Presencial' ? '▼' : '›'}</span>
                    </div>

                    {modalidad === 'Presencial' && (
                      <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '10px' }}>
                        {tutor.salones && tutor.salones.length > 0 ? (
                          <>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--Vino-tinto)', display: 'block', marginBottom: '6px' }}>
                              Seleccionar salón disponible del tutor:
                            </label>
                            <select
                              className="modalidad-sede-select"
                              value={sedePresencial}
                              onChange={(e) => setSedePresencial(e.target.value)}
                              aria-label="Seleccionar salón del tutor"
                            >
                              {tutor.salones.map((s, idx) => {
                                const textoLugar = `${s.salon} (Sede ${s.sede})`;
                                return (
                                  <option key={`${s.sede}-${s.salon}-${idx}`} value={textoLugar}>
                                    {s.salon} — Sede {s.sede}
                                  </option>
                                );
                              })}
                            </select>
                          </>
                        ) : (
                          <div style={{ padding: '8px 10px', backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '6px', fontSize: '12px', color: '#B71C1C', marginTop: '6px' }}>
                            El tutor no ha registrado salones para atención presencial. Por favor selecciona <strong>Acceso Remoto</strong>.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Opción Remoto */}
                  <div
                    className={`modalidad-option-box ${
                      modalidad === 'Virtual' ? 'selected' : ''
                    }`}
                    onClick={() => setModalidad('Virtual')}
                  >
                    <div className="modalidad-option-header">
                      <span>Acceso Remoto</span>
                      <span>{modalidad === 'Virtual' ? '▼' : '›'}</span>
                    </div>

                    {modalidad === 'Virtual' && (
                      <p style={{ fontSize: '11.5px', color: '#6B5B5E', marginTop: '6px' }}>
                        Se generará enlace automático a Google Meets
                      </p>
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Info y Archivos */}
                <div className="info-col">
                  <h2 className="agendar-card__title" style={{ marginBottom: '14px' }}>
                    Info
                  </h2>

                  <div className="info-textarea-wrapper">
                    <textarea
                      className="info-textarea"
                      placeholder="Detalles para desarrollar en la tutoría. También se pueden subir archivos"
                      value={detalles}
                      onChange={(e) => setDetalles(e.target.value)}
                    />

                    {/* Botón para subir PDF o Fotos */}
                    <label className="file-upload-btn-label">
                      <span>Adjuntar foto o PDF</span>
                      <input
                        type="file"
                        className="file-upload-input"
                        multiple
                        accept="application/pdf,image/*"
                        onChange={handleArchivoChange}
                      />
                    </label>

                    {/* Lista de archivos adjuntos */}
                    {archivos.length > 0 && (
                      <div className="files-preview-list">
                        {archivos.map((file, idx) => (
                          <div key={`${file.name}-${idx}`} className="file-preview-item">
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Archivo: {file.name}
                            </span>
                            <button
                              type="button"
                              className="file-remove-btn"
                              onClick={() => handleEliminarArchivo(idx)}
                              title="Quitar archivo"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Barra inferior de confirmación y total con cálculo dinámico */}
          <footer className="agendar-footer-actions">
            <div className="agendar-total-text">
              <span className="agendar-total-label">Total:</span>
              <span className="agendar-total-value">
                ${precioTotalCalculado.toLocaleString('es-CO')} COP
              </span>
              <span style={{ fontSize: '12px', color: '#6B5B5E', marginLeft: '10px' }}>
                ({duracionHoras} {duracionHoras === 1 ? 'hora' : 'horas'} a ${precioPorHora.toLocaleString('es-CO')} / h)
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={guardando}
            >
              {guardando ? 'Agendando...' : 'Confirmar'}
            </Button>
          </footer>
        </form>
      </main>

      {/* Modal de confirmación exitosa */}
      {confirmacionExitosa && (
        <div className="confirmacion-modal-backdrop" role="dialog" aria-modal="true">
          <div className="confirmacion-modal-card">
            <h3 className="confirmacion-modal-title">¡Tutoría Agendada!</h3>
            <div className="confirmacion-modal-details">
              <p><strong>Tutor:</strong> {tutor.nombres} {tutor.apellidos}</p>
              <p>
                <strong>Fecha:</strong> {fechaSeleccionada?.textoCompleto}
              </p>
              <p><strong>Franja horaria:</strong> {horaSeleccionada} ({duracionHoras} {duracionHoras === 1 ? 'hora' : 'horas'})</p>
              <p><strong>Total a Pagar:</strong> ${precioTotalCalculado.toLocaleString('es-CO')} COP</p>
              <p>
                <strong>Modalidad:</strong> {modalidad} (
                {modalidad === 'Presencial' ? sedePresencial : 'Google Meets'})
              </p>
              {archivos.length > 0 && (
                <p><strong>Archivos adjuntos:</strong> {archivos.length}</p>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/app/tutorias')}
            >
              Ir a Mis Tutorías
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgendarTutoria;
