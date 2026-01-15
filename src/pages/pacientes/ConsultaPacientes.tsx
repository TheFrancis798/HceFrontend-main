import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPacientes } from "../../services/pacienteStorage";
import { jsPDF } from "jspdf";

export default function ConsultaPacientes() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<any[]>([]);
  
  // Estado para el modal de lista de historial
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any | null>(null);
  
  // Estado para la Vista Previa (Solo lectura)
  const [consultaVistaPrevia, setConsultaVistaPrevia] = useState<any | null>(null);

  // 1. Cargar datos
  useEffect(() => {
    const lista = obtenerPacientes();
    setPacientes(lista);
  }, []);

  // 2. Navegación
  const handleNuevaConsulta = (cedula: string) => {
    navigate(`/historial/${cedula}`);
  };

  const handleVerHistorial = (paciente: any) => {
    setPacienteSeleccionado(paciente);
  };

  const cerrarModal = () => {
    setPacienteSeleccionado(null);
  };

  const handleEditarConsulta = (cedula: string, consulta: any) => {
    navigate(`/historial/${cedula}`, { state: { consultaAEditar: consulta } });
  };

  // 3. Generar PDF (Resumido)
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
            if (c.diagnosticoTexto) {
                doc.text(`Dx: ${c.diagnosticoTexto}`, 12, y);
                y += 6;
            }
            y += 5;
        });
    } else {
        doc.text("Sin historial.", 10, y);
    }
    doc.save(`Historial_${paciente.cedula}.pdf`);
  };

  // Helper para mostrar listas de checkboxes (Personales/Familiares)
  const renderCheckList = (obj: any) => {
      if (!obj) return "Ninguno";
      const keys = Object.keys(obj).filter(k => obj[k] === true);
      return keys.length > 0 ? keys.join(", ") : "Ninguno";
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0 text-primary">Consultar Pacientes</h4>
      </div>
      
      {/* TABLA PRINCIPAL */}
      <div className="table-responsive shadow-sm bg-white rounded">
        <table className="table table-hover align-middle mb-0 table-bordered">
            <thead className="table-light">
            <tr>
                <th className="py-3 ps-3">Cédula</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Fecha Nacimiento</th>
                <th>Sexo</th>
                <th className="text-center" style={{ minWidth: '300px' }}>Acciones</th>
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
                        <button className="btn btn-primary btn-sm fw-bold" onClick={() => handleNuevaConsulta(p.cedula)}>
                            {p.historiaClinica && p.historiaClinica.length > 0 ? "+ Nueva" : "Llenar HCE"}
                        </button>
                        {p.historiaClinica && p.historiaClinica.length > 0 && (
                            <>
                                <button className="btn btn-success btn-sm" onClick={() => handleVerHistorial(p)}>Ver HCE</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => handleDescargarPDF(p)}>PDF</button>
                            </>
                        )}
                    </div>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>

      {/* MODAL 1: LISTA DE HISTORIAL */}
      {pacienteSeleccionado && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Historial: {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={cerrarModal}></button>
              </div>
              <div className="modal-body bg-light">
                 {pacienteSeleccionado.historiaClinica && pacienteSeleccionado.historiaClinica.length > 0 ? (
                    [...pacienteSeleccionado.historiaClinica].reverse().map((consulta: any, index: number) => (
                        <div key={index} className="card mb-3 border-0 shadow-sm">
                            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                                <span>{consulta.fecha} <small className="text-muted">({consulta.hora})</small></span>
                                <div className="d-flex gap-2">
                                    <button 
                                        className="btn btn-sm btn-info text-white" 
                                        onClick={() => setConsultaVistaPrevia(consulta)}
                                    >
                                        <i className="bi bi-eye"></i> Vista Previa
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleEditarConsulta(pacienteSeleccionado.cedula, consulta)}
                                    >
                                        <i className="bi bi-pencil-square"></i> Editar
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                <p className="mb-0"><strong>Motivo:</strong> {consulta.motivo}</p>
                            </div>
                        </div>
                    ))
                 ) : (<p className="text-center py-4">Sin datos.</p>)}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cerrarModal}>Cerrar</button>
                <button type="button" className="btn btn-primary" onClick={() => handleNuevaConsulta(pacienteSeleccionado.cedula)}>+ Nueva Consulta</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: VISTA PREVIA DETALLADA (8 SECCIONES)                     */}
      {/* ================================================================= */}
      {consultaVistaPrevia && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} tabIndex={-1}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header bg-dark text-white">
                        <h5 className="modal-title">
                            <i className="bi bi-clipboard-data me-2"></i> 
                            Reporte Completo de Consulta
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setConsultaVistaPrevia(null)}></button>
                    </div>
                    <div className="modal-body p-4 bg-light">
                        
                        {/* 1. ANAMNESIS */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-primary">1. Anamnesis</div>
                            <div className="card-body">
                                <p><strong>Motivo:</strong> {consultaVistaPrevia.motivo || "---"}</p>
                                <p className="mb-0"><strong>Enfermedad Actual:</strong></p>
                                <div className="p-2 border rounded bg-light" style={{whiteSpace: 'pre-wrap'}}>{consultaVistaPrevia.enfermedadActual || "---"}</div>
                            </div>
                        </div>

                        {/* 2. ANTECEDENTES PERINATALES */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-success">2. Antecedentes Perinatales</div>
                            <div className="card-body">
                                {consultaVistaPrevia.antecedentesSnapshot?.antecedentesPerinatales ? (
                                    <div className="row">
                                        <div className="col-md-3"><strong>Gestación:</strong> {consultaVistaPrevia.antecedentesSnapshot.antecedentesPerinatales.productoGestacion}</div>
                                        <div className="col-md-3"><strong>Semanas:</strong> {consultaVistaPrevia.antecedentesSnapshot.antecedentesPerinatales.edadGestacional}</div>
                                        <div className="col-md-3"><strong>Parto:</strong> {consultaVistaPrevia.antecedentesSnapshot.antecedentesPerinatales.viaParto}</div>
                                        <div className="col-md-3"><strong>Peso Nacer:</strong> {consultaVistaPrevia.antecedentesSnapshot.antecedentesPerinatales.pesoNacimiento}g</div>
                                        <div className="col-md-3"><strong>Talla Nacer:</strong> {consultaVistaPrevia.antecedentesSnapshot.antecedentesPerinatales.tallaNacimiento}cm</div>
                                        <div className="col-md-3"><strong>Apgar:</strong> {consultaVistaPrevia.antecedentesSnapshot.antecedentesPerinatales.apgarMin}' / {consultaVistaPrevia.antecedentesSnapshot.antecedentesPerinatales.apgar5}'</div>
                                    </div>
                                ) : <span className="text-muted">No registrados</span>}
                            </div>
                        </div>

                        {/* 3. INMUNIZACIONES */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-success">3. Inmunizaciones</div>
                            <div className="card-body">
                                <strong>Estado de Vacunación:</strong> {consultaVistaPrevia.antecedentesSnapshot?.estadoVacunacion || "No registrado"}
                            </div>
                        </div>

                        {/* 4. ANTECEDENTES PERSONALES */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-success">4. Antecedentes Personales</div>
                            <div className="card-body">
                                <ul className="mb-0">
                                    <li><strong>Patologías Crónicas:</strong> {renderCheckList(consultaVistaPrevia.antecedentesSnapshot?.enfermedadesCronicas)}</li>
                                    <li><strong>Alergias:</strong> {consultaVistaPrevia.antecedentesSnapshot?.alergias?.si ? consultaVistaPrevia.antecedentesSnapshot.alergias.tipo : "No"}</li>
                                    <li><strong>Cirugías:</strong> {consultaVistaPrevia.antecedentesSnapshot?.cirugias?.si ? consultaVistaPrevia.antecedentesSnapshot.cirugias.tipo : "No"}</li>
                                    <li><strong>Hospitalizaciones:</strong> {consultaVistaPrevia.antecedentesSnapshot?.hospitalizaciones?.si ? consultaVistaPrevia.antecedentesSnapshot.hospitalizaciones.causa : "No"}</li>
                                </ul>
                            </div>
                        </div>

                        {/* 5. ANTECEDENTES FAMILIARES */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-success">5. Antecedentes Familiares</div>
                            <div className="card-body">
                                <strong>Patologías Familiares:</strong> {renderCheckList(consultaVistaPrevia.antecedentesSnapshot?.enfermedadesFamiliares)}
                            </div>
                        </div>

                        {/* 6. DESARROLLO */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-success">6. Desarrollo (Hitos en meses)</div>
                            <div className="card-body">
                                {consultaVistaPrevia.antecedentesSnapshot?.desarrollo ? (
                                    <div className="row text-center">
                                        <div className="col-3 border-end"><strong>Sostén Cefálico:</strong> {consultaVistaPrevia.antecedentesSnapshot.desarrollo.sostenCefalico || '-'}</div>
                                        <div className="col-3 border-end"><strong>Sedestación:</strong> {consultaVistaPrevia.antecedentesSnapshot.desarrollo.sedestacion || '-'}</div>
                                        <div className="col-3 border-end"><strong>Deambulación:</strong> {consultaVistaPrevia.antecedentesSnapshot.desarrollo.deambulacion || '-'}</div>
                                        <div className="col-3"><strong>Lenguaje:</strong> {consultaVistaPrevia.antecedentesSnapshot.desarrollo.lenguaje || '-'}</div>
                                    </div>
                                ) : <span className="text-muted">No registrados</span>}
                            </div>
                        </div>

                        {/* 7. EXAMEN FÍSICO */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-primary">7. Examen Físico</div>
                            <div className="card-body">
                                <div className="row g-2 mb-3 text-center small">
                                    <div className="col bg-light p-2 rounded border mx-1"><strong>Peso:</strong> {consultaVistaPrevia.examenFisico?.peso || "-"} kg</div>
                                    <div className="col bg-light p-2 rounded border mx-1"><strong>Talla:</strong> {consultaVistaPrevia.examenFisico?.talla || "-"} cm</div>
                                    <div className="col bg-light p-2 rounded border mx-1"><strong>Temp:</strong> {consultaVistaPrevia.examenFisico?.temperatura || "-"} °C</div>
                                    <div className="col bg-light p-2 rounded border mx-1"><strong>PA:</strong> {consultaVistaPrevia.examenFisico?.presionArterial || "-"}</div>
                                    <div className="col bg-light p-2 rounded border mx-1"><strong>FC:</strong> {consultaVistaPrevia.examenFisico?.fc || "-"}</div>
                                    <div className="col bg-light p-2 rounded border mx-1"><strong>FR:</strong> {consultaVistaPrevia.examenFisico?.fr || "-"}</div>
                                    <div className="col bg-light p-2 rounded border mx-1"><strong>SatO2:</strong> {consultaVistaPrevia.examenFisico?.spo2 || "-"}%</div>
                                </div>
                                <label className="fw-bold small text-muted">Hallazgos / Descripción:</label>
                                <div className="p-2 border rounded bg-white" style={{whiteSpace: 'pre-wrap'}}>
                                    {consultaVistaPrevia.examenFisico?.descripcion || "Sin descripción."}
                                </div>
                            </div>
                        </div>

                        {/* 8. DIAGNÓSTICO */}
                        <div className="card shadow-sm border-primary">
                            <div className="card-header bg-primary text-white fw-bold">8. Diagnóstico y Plan</div>
                            <div className="card-body">
                                {/* Diagnósticos */}
                                <div className="mb-3">
                                    <label className="fw-bold small text-muted">Diagnósticos CIE-10:</label>
                                    {consultaVistaPrevia.diagnosticos && consultaVistaPrevia.diagnosticos.length > 0 ? (
                                        <ul className="list-group list-group-flush small mb-2">
                                            {consultaVistaPrevia.diagnosticos.map((d:any, i:number) => (
                                                <li key={i} className="list-group-item px-0">
                                                    <span className="badge bg-secondary me-2">{d.cie10}</span> {d.descripcion}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <div className="text-muted small fst-italic mb-2">Ninguno seleccionado</div>}
                                    
                                    <label className="fw-bold small text-muted">Notas de Diagnóstico:</label>
                                    <div className="p-2 border rounded bg-white mb-3" style={{whiteSpace: 'pre-wrap'}}>
                                        {consultaVistaPrevia.diagnosticoTexto || "Sin notas."}
                                    </div>
                                </div>
                                
                                <div className="row">
                                    <div className="col-md-6">
                                        <label className="fw-bold small text-muted">Plan / Receta</label>
                                        <div className="p-2 border rounded bg-light text-success fst-italic">
                                            {consultaVistaPrevia.planTratamiento?.receta || "---"}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="fw-bold small text-muted">Estudios / Pronóstico</label>
                                        <div className="p-2 border rounded bg-light">
                                            <span className="d-block"><strong>Estudios:</strong> {consultaVistaPrevia.planTratamiento?.estudios || consultaVistaPrevia.estudiosSolicitados || "-"}</span>
                                            <span className="d-block"><strong>Pronóstico:</strong> {consultaVistaPrevia.planTratamiento?.pronostico || "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="modal-footer bg-light">
                        <button type="button" className="btn btn-secondary px-4" onClick={() => setConsultaVistaPrevia(null)}>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
}