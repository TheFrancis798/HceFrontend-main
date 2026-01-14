// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/auth/Login';
import MainLayout from '../components/layout/MainLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import RegistroPaciente from '../pages/pacientes/RegistroPaciente';
import ConsultaPacientes from '../pages/pacientes/ConsultaPacientes';
import ActualizarPaciente from '../pages/pacientes/ActualizarPaciente';
import HistorialConsultas from '../pages/historial/HistorialConsultas';


// Dentro de tus <Routes>
<Route path="/historial/:cedula" element={<HistorialConsultas />} />

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Login />} />

        {/* Rutas protegidas dentro del layout */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pacientes/registro" element={<RegistroPaciente />} />
          <Route path="/pacientes/consulta" element={<ConsultaPacientes />} />
          <Route path="/pacientes/actualizar" element={<ActualizarPaciente />} />
          <Route path="/historial" element={<HistorialConsultas />} />
          <Route path="/historial/:cedula" element={<HistorialConsultas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
