import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Asegúrate de que esta ruta sea correcta en tu proyecto
import { obtenerPacientes } from "../../services/pacienteStorage";
import { jsPDF } from "jspdf";

export default function ConsultaPacientes() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState(""); // Buscador simple
  
  // Estado para el modal de lista de historial
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any | null>(null);
  
  // Estado para la Vista Previa (Solo lectura)
  const [consultaVistaPrevia, setConsultaVistaPrevia] = useState<any | null>(null);

  // 1. Cargar datos
  useEffect(() => {
    const lista = obtenerPacientes();
    // Validamos que sea un array para evitar errores de .map
    setPacientes(Array.isArray(lista) ? lista : []);
  }, []);

  // Filtrado
  const pacientesFiltrados = pacientes.filter(p => 
    (p.nombres + " " + p.apellidos + " " + p.cedula).toLowerCase().includes(busqueda.toLowerCase())
  );

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
        paciente.historiaClinica.forEach((c: any) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFillColor(240, 240, 240);
            doc.rect(10, y - 5, 190, 8, "F");
            doc.setFont("helvetica", "bold");
            doc.text(`Consulta ${c.fecha}`, 12, y);
            y += 8;
            doc.setFont("helvetica", "normal");
            doc.text(`Motivo: ${c.motivo}`, 12, y);
            y += 10;
        });
    } else {
        doc.text("Sin historial registrado.", 10, y);
    }
    doc.save(`Historial_${paciente.cedula}.pdf`);
  };

  // Helper para mostrar listas
  const renderCheckList = (obj: any) => {
      if (!obj) return "Ninguno";
      const keys = Object.keys(obj).filter(k => obj[k] === true);
      return keys.length > 0 ? keys.join(", ") : "Ninguno";
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0 text-primary fw-bold">Consultar Pacientes</h4>
        <input 
            type="text" 
            className="form-control w-25" 
            placeholder="Buscar paciente..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      
      {/* TABLA PRINCIPAL CON DATOS COMPLETOS */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 table-striped">
                <thead className="bg-primary text-white">
                <tr>
                    <th>Cédula</th>
                    <th>Paciente</th>
                    <th>F. Nacimiento</th>
                    <th>Sexo</th>
                    <th>Sangre</th>
                    <th>Etnia</th>
                    <th>Ubicación</th>
                    <th className="text-center" style={{ minWidth: '220px' }}>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {pacientesFiltrados.length > 0 ? pacientesFiltrados.map((p) => (
                    <tr key={p.id}>
                    <td className="ps-3 fw-bold">{p.cedula}</td>
                    <td>
                        <div className="d-flex flex-column">
                            <span className="fw-bold">{p.apellidos}</span>
                            <span>{p.nombres}</span>
                        </div>
                    </td>
                    <td>{p.fechaNacimiento}</td>
                    <td>{p.sexo}</td>
                    <td><span className="badge bg-secondary">{p.tipoSangre}</span></td>
                    <td>{p.grupoEtnico}</td>
                    <td className="small">{p.provincia}, {p.canton}</td>
                    <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                            <button className="btn btn-primary btn-sm fw-bold" onClick={() => handleNuevaConsulta(p.cedula)}>
                                {p.historiaClinica && p.historiaClinica.length > 0 ? "+ Nueva" : "Llenar HCE"}
                            </button>
                            {p.historiaClinica && p.historiaClinica.length > 0 && (
                                <>
                                    <button className="btn btn-success btn-sm" onClick={() => handleVerHistorial(p)} title="Ver Historial"><i className="bi bi-eye"></i></button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => handleDescargarPDF(p)} title="PDF"><i className="bi bi-file-pdf"></i></button>
                                </>
                            )}
                        </div>
                    </td>
                    </tr>
                )) : (
                    <tr><td colSpan={8} className="text-center py-4">No se encontraron pacientes.</td></tr>
                )}
                </tbody>
            </table>
        </div>
      </div>

      {/* MODAL 1: LISTA DE HISTORIAL */}
      {pacienteSeleccionado && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
            <div className="modal-content border-0 shadow">
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
                                    <button className="btn btn-sm btn-info text-white" onClick={() => setConsultaVistaPrevia(consulta)}>
                                        Vista Previa
                                    </button>
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditarConsulta(pacienteSeleccionado.cedula, consulta)}>
                                        Editar
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                <p className="mb-0"><strong>Motivo:</strong> {consulta.motivo}</p>
                            </div>
                        </div>
                    ))
                 ) : (<p className="text-center py-4">Sin datos de historial.</p>)}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cerrarModal}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: VISTA PREVIA DETALLADA (8 SECCIONES SIEMPRE)             */}
      {/* ================================================================= */}
      {consultaVistaPrevia && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} tabIndex={-1}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header bg-dark text-white">
                        <h5 className="modal-title">Reporte Completo de Consulta</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setConsultaVistaPrevia(null)}></button>
                    </div>
                    <div className="modal-body p-4 bg-light">
                        
                        {/* 1. ANAMNESIS */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-primary">1. Anamnesis y Motivo</div>
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
                                {consultaVistaPrevia.antecedentes?.perinatales?.desconoce ? (
                                    <span className="badge bg-secondary">Datos no recordados</span>
                                ) : (
                                    consultaVistaPrevia.antecedentes?.perinatales ? (
                                        <div className="row">
                                            <div className="col-md-3"><strong>Gestación:</strong> {consultaVistaPrevia.antecedentes.perinatales.productoGestacion}</div>
                                            <div className="col-md-3"><strong>Semanas:</strong> {consultaVistaPrevia.antecedentes.perinatales.edadGestacional}</div>
                                            <div className="col-md-3"><strong>Parto:</strong> {consultaVistaPrevia.antecedentes.perinatales.viaParto}</div>
                                            <div className="col-md-3"><strong>Peso Nacer:</strong> {consultaVistaPrevia.antecedentes.perinatales.pesoNacimiento}g</div>
                                            <div className="col-md-3"><strong>Talla:</strong> {consultaVistaPrevia.antecedentes.perinatales.tallaNacimiento}cm</div>
                                            <div className="col-md-3"><strong>Apgar:</strong> {consultaVistaPrevia.antecedentes.perinatales.apgarMin}' / {consultaVistaPrevia.antecedentes.perinatales.apgar5}'</div>
                                        </div>
                                    ) : <span className="text-muted">No registrados</span>
                                )}
                            </div>
                        </div>

                        {/* 3. INMUNIZACIONES */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-success">3. Inmunizaciones</div>
                            <div className="card-body">
                                <strong>Estado de Vacunación:</strong> {consultaVistaPrevia.antecedentes?.vacunacion || "No registrado"}
                            </div>
                        </div>

                        {/* 4. ANTECEDENTES PERSONALES */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-success">4. Antecedentes Personales</div>
                            <div className="card-body">
                                <ul className="mb-0">
                                    <li><strong>Crónicas:</strong> {renderCheckList(consultaVistaPrevia.antecedentes?.cronicas)}</li>
                                    <li><strong>Alergias:</strong> {consultaVistaPrevia.antecedentes?.alergiasDetalle || "No"}</li>
                                    <li><strong>Cirugías:</strong> {consultaVistaPrevia.antecedentes?.cirugias?.si ? consultaVistaPrevia.antecedentes.cirugias.tipo : "No"}</li>
                                    <li><strong>Hospitalizaciones:</strong> {consultaVistaPrevia.antecedentes?.hospitalizaciones?.si ? consultaVistaPrevia.antecedentes.hospitalizaciones.causa : "No"}</li>
                                </ul>
                            </div>
                        </div>

                        {/* 5. ANTECEDENTES FAMILIARES */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-success">5. Antecedentes Familiares</div>
                            <div className="card-body">
                                <strong>Patologías Familiares:</strong> {renderCheckList(consultaVistaPrevia.antecedentes?.familiares)}
                            </div>
                        </div>

                        {/* 6. DESARROLLO */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-success">6. Desarrollo Psicomotor</div>
                            <div className="card-body">
                                {consultaVistaPrevia.antecedentes?.desarrollo?.desconoce ? (
                                    <span className="badge bg-secondary">Datos no recordados</span>
                                ) : (
                                    <div className="row text-center">
                                        <div className="col-3"><strong>Sostén Cef.:</strong> {consultaVistaPrevia.antecedentes?.desarrollo?.hitos?.sostenCefalico || '-'}</div>
                                        <div className="col-3"><strong>Sedestación:</strong> {consultaVistaPrevia.antecedentes?.desarrollo?.hitos?.sedestacion || '-'}</div>
                                        <div className="col-3"><strong>Deambulación:</strong> {consultaVistaPrevia.antecedentes?.desarrollo?.hitos?.deambulacion || '-'}</div>
                                        <div className="col-3"><strong>Lenguaje:</strong> {consultaVistaPrevia.antecedentes?.desarrollo?.hitos?.lenguaje || '-'}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 7. EXAMEN FÍSICO */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header bg-white fw-bold text-primary">7. Examen Físico</div>
                            <div className="card-body">
                                <div className="row g-2 mb-3 text-center small">
                                    <div className="col bg-light p-2 border"><strong>Peso:</strong> {consultaVistaPrevia.examenFisico?.vitales?.peso || "-"} kg</div>
                                    <div className="col bg-light p-2 border"><strong>Talla:</strong> {consultaVistaPrevia.examenFisico?.vitales?.talla || "-"} cm</div>
                                    <div className="col bg-light p-2 border"><strong>Temp:</strong> {consultaVistaPrevia.examenFisico?.vitales?.temperatura || "-"} °C</div>
                                    <div className="col bg-light p-2 border"><strong>SatO2:</strong> {consultaVistaPrevia.examenFisico?.vitales?.spo2 || "-"}%</div>
                                </div>
                                <div className="small">
                                    <div className="mb-1"><strong>Aspecto General:</strong> {consultaVistaPrevia.examenFisico?.segmentario?.aspectoGeneral}</div>
                                    <div className="mb-1"><strong>Cardiopulmonar:</strong> {consultaVistaPrevia.examenFisico?.segmentario?.cardiopulmonar}</div>
                                    <div className="mb-1"><strong>Abdomen:</strong> {consultaVistaPrevia.examenFisico?.segmentario?.abdomen}</div>
                                </div>
                                <div className="mt-2 p-2 border rounded bg-white">
                                    <strong>Evolución:</strong> {consultaVistaPrevia.examenFisico?.evolucion || "Sin descripción."}
                                </div>
                            </div>
                        </div>

                        {/* 8. DIAGNÓSTICO */}
                        <div className="card shadow-sm border-primary">
                            <div className="card-header bg-primary text-white fw-bold">8. Diagnóstico y Plan</div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="fw-bold small text-muted">Diagnósticos CIE-10:</label>
                                    {consultaVistaPrevia.diagnostico?.cie10 && consultaVistaPrevia.diagnostico.cie10.length > 0 ? (
                                        <ul className="list-group list-group-flush small mb-2">
                                            {consultaVistaPrevia.diagnostico.cie10.map((d:any, i:number) => (
                                                <li key={i} className="list-group-item px-0">
                                                    <span className="badge bg-secondary me-2">{d.cie10}</span> {d.descripcion}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <div className="text-muted small fst-italic">Ninguno</div>}
                                    <p className="mt-2"><strong>Impresión:</strong> {consultaVistaPrevia.diagnostico?.impresion || "Sin notas."}</p>
                                </div>
                                <div className="row">
                                    <div className="col-md-6"><label className="fw-bold small text-muted">Plan / Receta</label><div className="p-2 border rounded bg-light text-success fst-italic">{consultaVistaPrevia.diagnostico?.plan || "---"}</div></div>
                                    <div className="col-md-6"><label className="fw-bold small text-muted">Estudios / Pronóstico</label><div className="p-2 border rounded bg-light">{consultaVistaPrevia.diagnostico?.estudios || "-"}</div></div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="modal-footer bg-light">
                        <button type="button" className="btn btn-secondary px-4" onClick={() => setConsultaVistaPrevia(null)}>Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}