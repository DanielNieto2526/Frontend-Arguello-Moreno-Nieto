import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { ExplorarTutores } from './pages/ExplorarTutores';
import { TutoriasPendientes } from './pages/TutoriasPendientes';
import { AgendarTutoria } from './pages/AgendarTutoria';
import { RegisterStudent } from './pages/RegistroEstudiante';
import { RegistroTutor } from './pages/RegistroTutor';
import { EditarPerfilEstudiante } from './pages/EditarPerfilEstudiante';
import { VerPerfilTutorDesdeEstudiante } from './pages/VerPerfilTutorDesdeEstudiante';
import { FeedbackMonitoriaEstudiante } from './pages/FeedbackMonitoriaEstudiante';
import { VistaTutor } from './pages/VistaTutor';
import { InformacionMonitoriaTutor } from './pages/InformacionMonitoriaTutor';
import { PerfilTutor } from './pages/PerfilTutor';
import { EditarTutor } from './pages/EditarTutor';
import { EditarHorarioTutor } from './pages/EditarHorarioTutor';
import { DashboardAdmin } from './pages/DashboardAdmin';
import { Footer } from './components/Footer';
import type { Usuario } from './types/usuario';
import './App.css';

const TITULO_SITIO = 'Aprende con ConectaTutor ';
const SUBTITULO_SITIO = 'De estudiantes para estudiantes';

/**
 * Envoltorio para la pantalla de inicio de sesión
 */
function LoginWrapper() {
  const navigate = useNavigate();

  const handleLoginSuccess = (user: Usuario) => {
    const rol = (user.rol || '').toLowerCase().trim();
    if (rol === 'admin') {
      navigate('/admin');
    } else if (rol === 'tutor') {
      navigate('/tutor/tutorias');
    } else {
      navigate('/app/explorar');
    }
  };

  return (
    <Login
      titulo={TITULO_SITIO}
      subtitulo={SUBTITULO_SITIO}
      onLoginSuccess={handleLoginSuccess}
      onNavigateToRegisterStudent={() => navigate('/registro/estudiante')}
      onNavigateToRegisterTutor={() => navigate('/registro/tutor')}
    />
  );
}

/**
 * COMPONENTE RAÍZ: define el enrutamiento general y pasa props a los componentes
 */
export function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="app-main-content">
          <Routes>
            {/* Rutas públicas de autenticación */}
            <Route path="/" element={<LoginWrapper />} />
            <Route path="/login" element={<LoginWrapper />} />

            {/* Módulos de Registro con diseño Split-Card y cápsulas */}
            <Route path="/registro/estudiante" element={<RegisterStudent />} />
            <Route path="/registro/tutor" element={<RegistroTutor />} />

            {/* Rutas de Estudiante */}
            <Route path="/app/explorar" element={<ExplorarTutores />} />
            <Route path="/app/tutores/:tutorId" element={<VerPerfilTutorDesdeEstudiante />} />
            <Route path="/app/tutores" element={<VerPerfilTutorDesdeEstudiante />} />
            <Route path="/app/agendar/:tutorId" element={<AgendarTutoria />} />
            <Route path="/app/agendar" element={<AgendarTutoria />} />
            <Route path="/app/tutores/:tutorId/agendar" element={<AgendarTutoria />} />
            <Route path="/app/tutorias" element={<TutoriasPendientes />} />
            <Route path="/app/tutorias/:tutoriaId/feedback" element={<FeedbackMonitoriaEstudiante />} />
            <Route path="/app/feedback/:tutoriaId" element={<FeedbackMonitoriaEstudiante />} />
            <Route path="/app/feedback" element={<FeedbackMonitoriaEstudiante />} />
            <Route path="/app/perfil" element={<EditarPerfilEstudiante />} />
            <Route path="/app/perfil/editar" element={<EditarPerfilEstudiante />} />

            {/* Módulo de Tutor según Figma */}
            <Route path="/tutor" element={<Navigate to="/tutor/tutorias" replace />} />
            <Route path="/tutor/tutorias" element={<VistaTutor />} />
            <Route path="/tutor/tutorias/:id" element={<InformacionMonitoriaTutor />} />
            <Route path="/tutor/perfil" element={<PerfilTutor />} />
            <Route path="/tutor/perfil/editar" element={<EditarTutor />} />
            <Route path="/tutor/perfil/horario" element={<EditarHorarioTutor />} />

            {/* Rutas de Administrador */}
            <Route path="/admin" element={<DashboardAdmin />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
