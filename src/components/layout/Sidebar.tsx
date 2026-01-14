import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="bg-primary text-white vh-100 p-3" style={{ width: 260 }}>
      <h5 className="text-center mb-4">Menú Clínico</h5>

      <ul className="nav flex-column gap-2">
        <li>
          <NavLink className="nav-link text-white" to="/dashboard">
            <i className="bi bi-speedometer2 me-2"></i> Dashboard
          </NavLink>
        </li>
        <li>
        <a href="/historial-usuarios">Historial de Actividad</a>
        </li>

        <li>
          <NavLink className="nav-link text-white" to="/pacientes/registro">
            <i className="bi bi-person-plus me-2"></i> Registrar Paciente
          </NavLink>
        </li>
        <li>
          <NavLink className="nav-link text-white" to="/pacientes/consulta">
            <i className="bi bi-search me-2"></i> Consultar Pacientes
          </NavLink>
        </li>
        <li>
          <NavLink className="nav-link text-white" to="/historial">
            <i className="bi bi-journal-medical me-2"></i> Historial Clínico
          </NavLink>
        </li>
      </ul>
    </aside>
  )
}
