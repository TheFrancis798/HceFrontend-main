export default function Dashboard() {
  return (
    <>
      <h4 className="mb-4">Dashboard Clínico</h4>

      <div className="row g-3">
        <div className="col-md-3">
          <div className="card text-center p-3">
            <i className="bi bi-people fs-2 text-primary"></i>
            <h6>Total Pacientes</h6>
            <strong>0</strong>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center p-3">
            <i className="bi bi-calendar-check fs-2 text-success"></i>
            <h6>Consultas del día</h6>
            <strong>0</strong>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center p-3">
            <i className="bi bi-exclamation-triangle fs-2 text-danger"></i>
            <h6>Alertas Clínicas</h6>
            <strong>0</strong>
          </div>
        </div>
      </div>
    </>
  )
}
