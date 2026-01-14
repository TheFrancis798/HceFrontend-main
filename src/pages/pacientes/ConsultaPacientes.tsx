import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPacientes } from "../../services/pacienteStorage";
import { jsPDF } from "jspdf";

export default function ConsultaPacientes() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<any[]>([]);
  
  // Estado para controlar qué paciente se está viendo en el MODAL
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any | null>(null);

  // 1. Cargar datos
  useEffect(() => {
    const lista = obtenerPacientes();
    setPacientes(lista);
  }, []);

  // 2. Ir a CREAR NUEVA (Navega a otra página)
  const handleNuevaConsulta = (cedula: string) => {
    navigate(`/historial/${cedula}`);
  };

  // 3. Ir a VER HISTORIAL (Abre el Modal en la misma página)
  const handleVerHistorial = (paciente: any) => {
    setPacienteSeleccionado(paciente); // Esto activa el modal
  };

  // 4. Cerrar el Modal
  const cerrarModal = () => {
    setPacienteSeleccionado(null);
  };

  // 5. Descargar PDF
  const handleDescargarPDF = (paciente: any) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Historia Clínica: ${paciente.nombres} ${paciente.apellidos}`, 10, 20);
    let y = 40;
    doc.setFontSize(10);

    if (paciente.historiaClinica && paciente.historiaClinica.length > 0) {
        paciente.historiaClinica.forEach((c: any, i: number) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFillColor(240, 240, 240);
            doc.rect(10, y - 5, 190, 8, "F");
            doc.setFont("helvetica", "bold");
            doc.text(`Consulta ${c.fecha}`, 12, y);
            y += 8;
            doc.setFont("helvetica", "normal");
            doc.text(`Motivo: ${c.motivo}`, 12, y);
            y += 6;
            if (c.diagnosticos) {
                c.diagnosticos.forEach((d: any) => {
                    doc.text(`- ${d.cie10} ${d.descripcion}`, 15, y);
                    y += 5;
                });
            }
            y += 5;
        });
    } else {
        doc.text("Sin historial.", 10, y);
    }
    doc.save(`Historial_${paciente.cedula}.pdf`);
  };

  return (
    <>
      {/* === TÍTULO === */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0 text-primary">Consultar Pacientes</h4>
      </div>
      
      {/* === TABLA DE PACIENTES === */}
      <div className="table-responsive shadow-sm bg-white rounded">
        <table className="table table-hover align-middle mb-0 table-bordered">
            <thead className="table-light">
            <tr>
                <th className="py-3 ps-3">Cédula</th>
                <th className="py-3">Nombres</th>
                <th className="py-3">Apellidos</th>
                <th className="py-3">Fecha Nacimiento</th>
                <th className="py-3">Sexo</th>
                <th className="py-3 text-center" style={{ minWidth: '300px' }}>Acciones</th>
            </tr>
            </thead>
            <tbody>
            {pacientes.map((p) => (
                <tr key={p.id}>
                <td className="ps-3 fw-bold">{p.cedula}</td>
                <td>{p.nombres}</td>
                <td>{p.apellidos}</td>
                <td>{p.fechaNacimiento}</td>
                <td>{p.sexo}</td>
                <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                        
                        {/* BOTÓN AZUL: NUEVA CONSULTA (Navega) */}
                        <button
                            className="btn btn-primary btn-sm fw-bold d-flex align-items-center"
                            onClick={() => handleNuevaConsulta(p.cedula)}
                            title="Ir al formulario para nueva consulta"
                        >
                            {p.historiaClinica && p.historiaClinica.length > 0 ? (
                                <><i className="bi bi-plus-circle me-1"></i> Nueva</>
                            ) : (
                                "Llenar HCE"
                            )}
                        </button>

                        {/* BOTÓN VERDE: VER HISTORIAL (Abre Modal) */}
                        {p.historiaClinica && p.historiaClinica.length > 0 && (
                            <>
                                <button
                                    className="btn btn-success btn-sm d-flex align-items-center"
                                    onClick={() => handleVerHistorial(p)} // <--- AHORA ABRE EL MODAL
                                    title="Ver historial aquí mismo"
                                >
                                    <i className="bi bi-eye me-1"></i> Ver HCE
                                </button>

                                <button
                                    className="btn btn-secondary btn-sm d-flex align-items-center"
                                    onClick={() => handleDescargarPDF(p)}
                                    title="Descargar PDF"
                                >
                                    PDF
                                </button>
                            </>
                        )}

                    </div>
                </td>
                </tr>
            ))}
            
            {pacientes.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center text-muted py-5">
                        No hay pacientes registrados.
                    </td>
                </tr>
            )}
            </tbody>
        </table>
      </div>

      {/* ================================================================= */}
      {/* MODAL / VENTANA EMERGENTE PARA VER EL HISTORIAL SIN SALIR */}
      {/* ================================================================= */}
      {pacienteSeleccionado && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
            <div className="modal-content">
              
              {/* Cabecera del Modal */}
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                    <i className="bi bi-folder2-open me-2"></i>
                    Historial Clínico: {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={cerrarModal}></button>
              </div>

              {/* Cuerpo del Modal (Lista de consultas) */}
              <div className="modal-body bg-light">
                 {pacienteSeleccionado.historiaClinica && pacienteSeleccionado.historiaClinica.length > 0 ? (
                    
                    // Iteramos el historial
                    [...pacienteSeleccionado.historiaClinica].reverse().map((consulta: any, index: number) => (
                        <div key={index} className="card mb-3 border-0 shadow-sm">
                            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                                <span><i className="bi bi-calendar-check me-2 text-success"></i>{consulta.fecha} <small className="text-muted fw-normal ms-2">({consulta.hora})</small></span>
                                <span className="badge bg-secondary">#{pacienteSeleccionado.historiaClinica.length - index}</span>
                            </div>
                            <div className="card-body">
                                <p className="mb-2"><strong>Motivo:</strong> {consulta.motivo}</p>
                                
                                {consulta.enfermedadActual && (
                                    <p className="mb-2 text-muted small"><em>"{consulta.enfermedadActual}"</em></p>
                                )}

                                {/* Diagnósticos */}
                                {consulta.diagnosticos && consulta.diagnosticos.length > 0 && (
                                    <div className="mb-2 p-2 bg-light rounded border">
                                        <small className="fw-bold d-block text-primary">Diagnósticos:</small>
                                        <ul className="mb-0 ps-3 small">
                                            {consulta.diagnosticos.map((d: any, i: number) => (
                                                <li key={i}><strong>{d.cie10}</strong> - {d.descripcion} ({d.tipo})</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Examen Físico Resumido */}
                                {consulta.examenFisico && (
                                    <div className="d-flex gap-2 flex-wrap mt-2">
                                        <span className="badge bg-white text-dark border">Temp: {consulta.examenFisico.temperatura}°</span>
                                        <span className="badge bg-white text-dark border">Presión: {consulta.examenFisico.presionArterial}</span>
                                        <span className="badge bg-white text-dark border">Peso: {consulta.examenFisico.peso}kg</span>
                                    </div>
                                )}

                                {/* Tratamiento */}
                                {(consulta.planTratamiento?.receta || consulta.manejoFarmacologico) && (
                                    <div className="mt-3 border-top pt-2">
                                        <small className="fw-bold">Tratamiento:</small>
                                        <p className="small mb-0 text-success fst-italic">
                                            {consulta.planTratamiento?.receta || consulta.manejoFarmacologico}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))

                 ) : (
                    <div className="text-center py-5">
                        <p className="text-muted">No hay datos de historial para mostrar.</p>
                    </div>
                 )}
              </div>

              {/* Pie del Modal */}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cerrarModal}>Cerrar</button>
                <button type="button" className="btn btn-primary" onClick={() => handleNuevaConsulta(pacienteSeleccionado.cedula)}>
                    + Agregar Nueva Consulta Ahora
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}