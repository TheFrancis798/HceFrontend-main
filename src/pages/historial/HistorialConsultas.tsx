import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { obtenerPacientes, agregarConsulta, actualizarConsultaExistente } from "../../services/pacienteStorage";

interface DiagnosticoItem {
  id: string; cie10: string; descripcion: string; tipo: 'Presuntivo' | 'Definitivo';
}

export default function HistorialConsultas() {
  const { cedula } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [paciente, setPaciente] = useState<any>(null);
  const [idEdicion, setIdEdicion] = useState<string | null>(null);

  // PESTAÑA ACTIVA
  const [activeTab, setActiveTab] = useState<string>("anamnesis");

  // ================= ESTADOS DEL FORMULARIO =================
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [enfermedadActual, setEnfermedadActual] = useState("");

  const [productoGestacion, setProductoGestacion] = useState("");
  const [edadGestacional, setEdadGestacional] = useState<number | "">("");
  const [viaParto, setViaParto] = useState("");
  const [pesoNacimiento, setPesoNacimiento] = useState<number | "">("");
  const [tallaNacimiento, setTallaNacimiento] = useState<number | "">("");
  const [apgarMin, setApgarMin] = useState<number | "">("");
  const [apgar5, setApgar5] = useState<number | "">("");

  const [estadoVacunacion, setEstadoVacunacion] = useState("");

  const enfermedadesCronicasOptions = ["Asma", "Diabetes", "Cardiopatías", "Epilepsia"];
  const [enfermedadesCronicas, setEnfermedadesCronicas] = useState<Record<string, boolean>>(
    enfermedadesCronicasOptions.reduce((acc, cur) => ({ ...acc, [cur]: false }), {})
  );
  const [hospitalizaciones, setHospitalizaciones] = useState<{ si: boolean; causa: string; fecha: string }>({ si: false, causa: "", fecha: "" });
  const [cirugias, setCirugias] = useState<{ si: boolean; tipo: string; fecha: string }>({ si: false, tipo: "", fecha: "" });
  const [alergias, setAlergias] = useState<{ si: boolean; tipo: string; reaccion: string }>({ si: false, tipo: "", reaccion: "" });

  const enfermedadesFamiliaresOptions = ["HTA", "Diabetes", "Cáncer", "Enfermedades Genéticas"];
  const [enfermedadesFamiliares, setEnfermedadesFamiliares] = useState<Record<string, boolean>>(
    enfermedadesFamiliaresOptions.reduce((acc, cur) => ({ ...acc, [cur]: false }), {})
  );
  const [sostenCefalico, setSostenCefalico] = useState<number | "">("");
  const [sedestacion, setSedestacion] = useState<number | "">("");
  const [deambulacion, setDeambulacion] = useState<number | "">("");
  const [lenguaje, setLenguaje] = useState<number | "">("");

  const [descripcionFisica, setDescripcionFisica] = useState(""); 
  const [peso, setPeso] = useState<number | "">("");
  const [talla, setTalla] = useState<number | "">("");
  const [temperatura, setTemperatura] = useState<number | "">("");
  const [fc, setFc] = useState<number | "">("");
  const [fr, setFr] = useState<number | "">("");
  const [pa, setPa] = useState<{ sistolica: number | ""; diastolica: number | "" }>({ sistolica: "", diastolica: "" });
  const [spo2, setSpo2] = useState<number | "">("");
  
  const [notaHistorial, setNotaHistorial] = useState(""); 
  const [listaDiagnosticos, setListaDiagnosticos] = useState<DiagnosticoItem[]>([]);
  const [estudiosSolicitados, setEstudiosSolicitados] = useState("");
  const [manejoFarmacologico, setManejoFarmacologico] = useState("");
  const [pronostico, setPronostico] = useState("");

  // ================= CARGAR DATOS =================
  useEffect(() => {
    const lista = obtenerPacientes();
    const encontrado = lista.find((p: any) => p.cedula == cedula);
    if (encontrado) setPaciente(encontrado);

    if (location.state && location.state.consultaAEditar) {
        const c = location.state.consultaAEditar;
        setIdEdicion(c.id); 
        
        setMotivoConsulta(c.motivo || "");
        setEnfermedadActual(c.enfermedadActual || "");
        
        if (c.antecedentesSnapshot) {
            const ant = c.antecedentesSnapshot;
            if(ant.antecedentesPerinatales) {
                setProductoGestacion(ant.antecedentesPerinatales.productoGestacion || "");
                setEdadGestacional(ant.antecedentesPerinatales.edadGestacional || "");
                setViaParto(ant.antecedentesPerinatales.viaParto || "");
                setPesoNacimiento(ant.antecedentesPerinatales.pesoNacimiento || "");
                setTallaNacimiento(ant.antecedentesPerinatales.tallaNacimiento || "");
                setApgarMin(ant.antecedentesPerinatales.apgarMin || "");
                setApgar5(ant.antecedentesPerinatales.apgar5 || "");
            }
            if(ant.enfermedadesCronicas) setEnfermedadesCronicas(ant.enfermedadesCronicas);
            if(ant.hospitalizaciones) setHospitalizaciones(ant.hospitalizaciones);
            if(ant.cirugias) setCirugias(ant.cirugias);
            if(ant.alergias) setAlergias(ant.alergias);
            if(ant.enfermedadesFamiliares) setEnfermedadesFamiliares(ant.enfermedadesFamiliares);
            if(ant.estadoVacunacion) setEstadoVacunacion(ant.estadoVacunacion);
            if(ant.desarrollo) {
                setSostenCefalico(ant.desarrollo.sostenCefalico || "");
                setSedestacion(ant.desarrollo.sedestacion || "");
                setDeambulacion(ant.desarrollo.deambulacion || "");
                setLenguaje(ant.desarrollo.lenguaje || "");
            }
        }

        if (c.examenFisico) {
            setDescripcionFisica(c.examenFisico.descripcion || "");
            setPeso(c.examenFisico.peso || "");
            setTalla(c.examenFisico.talla || "");
            setTemperatura(c.examenFisico.temperatura || "");
            setFc(c.examenFisico.fc || "");
            setFr(c.examenFisico.fr || "");
            setSpo2(c.examenFisico.spo2 || "");
            if (c.examenFisico.presionArterial) {
                const parts = c.examenFisico.presionArterial.split("/");
                setPa({ sistolica: parts[0] || "", diastolica: parts[1] || "" });
            }
        }

        setNotaHistorial(c.diagnosticoTexto || c.impresionDiagnostica || ""); 
        if (c.diagnosticos) setListaDiagnosticos(c.diagnosticos);
        setEstudiosSolicitados(c.estudiosSolicitados || "");
        if (c.planTratamiento) {
            setManejoFarmacologico(c.planTratamiento.receta || "");
            setPronostico(c.planTratamiento.pronostico || "");
        }
    }
  }, [cedula, location.state]);

  const agregarFilaDiagnostico = () => setListaDiagnosticos([...listaDiagnosticos, { id: uuidv4(), cie10: '', descripcion: '', tipo: 'Presuntivo' }]);
  const eliminarDiagnostico = (id: string) => setListaDiagnosticos(listaDiagnosticos.filter(d => d.id !== id));
  const actualizarDiagnostico = (id: string, campo: keyof DiagnosticoItem, valor: string) => setListaDiagnosticos(listaDiagnosticos.map(d => d.id === id ? { ...d, [campo]: valor } : d));

  const handleNuevaConsulta = () => {
    if(window.confirm("¿Limpiar formulario para nueva consulta?")) {
        setIdEdicion(null);
        setMotivoConsulta(""); setEnfermedadActual(""); 
        setDescripcionFisica(""); setNotaHistorial(""); 
        setPeso(""); setTalla(""); setTemperatura(""); setPa({ sistolica: "", diastolica: "" }); 
        setListaDiagnosticos([]); setManejoFarmacologico(""); 
        setActiveTab("anamnesis");
        navigate(`/historial/${cedula}`, { state: {} });
    }
  };

  const handleGuardarHistoria = () => {
    if (!cedula) return alert("Error de cédula");

    const datosConsulta = {
      id: idEdicion || uuidv4(),
      fecha: idEdicion ? (location.state?.consultaAEditar?.fecha) : new Date().toISOString().split('T')[0],
      hora: idEdicion ? (location.state?.consultaAEditar?.hora) : new Date().toLocaleTimeString(),
      estado: "Finalizada",
      motivo: motivoConsulta,
      enfermedadActual,
      diagnosticoTexto: notaHistorial, 
      impresionDiagnostica: notaHistorial,
      examenFisico: {
          descripcion: descripcionFisica,
          peso, talla, temperatura, fc, fr, spo2, 
          presionArterial: `${pa.sistolica}/${pa.diastolica}`
      },
      diagnosticos: listaDiagnosticos, 
      estudiosSolicitados,
      planTratamiento: {
          receta: manejoFarmacologico,
          estudios: estudiosSolicitados,
          pronostico
      },
      antecedentesSnapshot: {
        enfermedadesCronicas, hospitalizaciones, cirugias, alergias, enfermedadesFamiliares, 
        antecedentesPerinatales: { 
            productoGestacion, edadGestacional, viaParto, pesoNacimiento, tallaNacimiento, apgarMin, apgar5 
        },
        estadoVacunacion,
        desarrollo: { sostenCefalico, sedestacion, deambulacion, lenguaje }
      }
    };

    let exito = false;
    if (idEdicion) {
        exito = actualizarConsultaExistente(cedula, datosConsulta);
        if (exito) alert("Consulta actualizada correctamente.");
    } else {
        exito = agregarConsulta(cedula, datosConsulta);
        if (exito) alert("Nueva consulta guardada correctamente.");
    }

    if (exito) window.location.reload();
    else alert("Error al guardar.");
  };

  const consultasPasadas = paciente?.historiaClinica?.filter((c: any) => c.estado !== 'Agendada') || [];

  return (
    <div className="d-flex flex-column" style={{ height: '100vh', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
      
      {/* ========================================================================= */}
      {/* 1. SECCIÓN SUPERIOR: FORMULARIO (OCUPA LA MAYOR PARTE)                    */}
      {/* ========================================================================= */}
      <div className="flex-grow-1 p-4 d-flex flex-column" style={{ overflow: 'hidden' }}>
          
          {/* HEADER */}
          <div className="flex-shrink-0 d-flex justify-content-between align-items-center mb-4">
             <div>
                <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => navigate(-1)}>← Volver</button>
                <h4 className="fw-bold text-primary">
                    {idEdicion ? "Editando Consulta Existente" : "Nueva Consulta Médica"}
                </h4>
                <span className="badge bg-secondary">Paciente: {paciente ? `${paciente.nombres} ${paciente.apellidos}` : '...'}</span>
             </div>
             <button className={idEdicion ? "btn btn-warning fw-bold px-4" : "btn btn-success fw-bold px-4"} onClick={handleGuardarHistoria}>
                 <i className="bi bi-save me-2"></i> {idEdicion ? "ACTUALIZAR CAMBIOS" : "GUARDAR CONSULTA"}
             </button>
          </div>

          {/* TABS */}
          <ul className="nav nav-tabs mb-0 flex-shrink-0 d-flex flex-wrap" style={{ borderBottom: 'none' }}>
             {[ 
               { id: "anamnesis", label: "Anamnesis" }, 
               { id: "antecedentesPerinatales", label: "Ant. Perinatales" }, 
               { id: "inmunizaciones", label: "Inmunizaciones" }, 
               { id: "antecedentesPersonales", label: "Ant. Personales" }, 
               { id: "antecedentesFamiliares", label: "Ant. Familiares" }, 
               { id: "desarrollo", label: "Desarrollo" }, 
               { id: "examenFisico", label: "Examen Físico" }, 
               { id: "diagnosticoPlan", label: "Diagnóstico" } 
             ].map(tab => (
                 <li className="nav-item" key={tab.id}>
                     <button 
                        className={`nav-link ${activeTab === tab.id ? 'active fw-bold' : ''}`} 
                        onClick={() => setActiveTab(tab.id)}
                        style={activeTab === tab.id ? { backgroundColor: 'white', borderBottomColor: 'white' } : {}}
                     >
                        {tab.label}
                     </button>
                 </li>
             ))}
          </ul>

          {/* CONTENIDO DEL FORMULARIO (SCROLL INTERNO) */}
          <div className="card p-4 shadow-sm border-0 flex-grow-1 overflow-auto" style={{ backgroundColor: 'white', borderTopLeftRadius: 0 }}>
             
             {/* 1. ANAMNESIS */}
             {activeTab === "anamnesis" && (
                 <>
                    <div className="mb-3"><label className="fw-bold">Motivo de Consulta</label><textarea className="form-control" rows={2} value={motivoConsulta} onChange={e=>setMotivoConsulta(e.target.value)}/></div>
                    <div className="mb-3"><label className="fw-bold">Enfermedad Actual</label><textarea className="form-control" rows={5} value={enfermedadActual} onChange={e=>setEnfermedadActual(e.target.value)}/></div>
                 </>
             )}

             {/* 2. ANTECEDENTES PERINATALES */}
             {activeTab === "antecedentesPerinatales" && (
                <div className="row g-3">
                    <div className="col-md-6"><label>Producto Gestación</label><select className="form-select" value={productoGestacion} onChange={e=>setProductoGestacion(e.target.value)}><option value="">Seleccione</option><option>Única</option><option>Gemelar</option></select></div>
                    <div className="col-md-6"><label>Edad Gestacional (sem)</label><input type="number" className="form-control" value={edadGestacional} onChange={e=>setEdadGestacional(Number(e.target.value))}/></div>
                    <div className="col-md-6"><label>Vía Parto</label><select className="form-select" value={viaParto} onChange={e=>setViaParto(e.target.value)}><option value="">Seleccione</option><option>Vaginal</option><option>Cesárea</option></select></div>
                    <div className="col-md-3"><label>Peso Nacer (g)</label><input type="number" className="form-control" value={pesoNacimiento} onChange={e=>setPesoNacimiento(Number(e.target.value))}/></div>
                    <div className="col-md-3"><label>Talla Nacer (cm)</label><input type="number" className="form-control" value={tallaNacimiento} onChange={e=>setTallaNacimiento(Number(e.target.value))}/></div>
                    <div className="col-md-3"><label>Apgar 1'</label><input type="number" className="form-control" value={apgarMin} onChange={e=>setApgarMin(Number(e.target.value))}/></div>
                    <div className="col-md-3"><label>Apgar 5'</label><input type="number" className="form-control" value={apgar5} onChange={e=>setApgar5(Number(e.target.value))}/></div>
                </div>
             )}

             {/* 3. INMUNIZACIONES */}
             {activeTab === "inmunizaciones" && (
                <div className="mb-3">
                    <label className="form-label fw-bold">Estado de Vacunación</label>
                    <select className="form-select" value={estadoVacunacion} onChange={e => setEstadoVacunacion(e.target.value)}>
                        <option value="">Seleccione...</option>
                        <option>Completo para la edad</option>
                        <option>Incompleto</option>
                        <option>No vacunado</option>
                    </select>
                </div>
             )}

             {/* 4. ANTECEDENTES PERSONALES */}
             {activeTab === "antecedentesPersonales" && (
                <>
                    <h6 className="fw-bold text-primary">Patologías Crónicas</h6>
                    <div className="d-flex gap-3 flex-wrap mb-4">{Object.keys(enfermedadesCronicas).map(k=>(<div className="form-check" key={k}><input type="checkbox" className="form-check-input" checked={enfermedadesCronicas[k]} onChange={()=>setEnfermedadesCronicas({...enfermedadesCronicas, [k]: !enfermedadesCronicas[k]})}/><label className="form-check-label">{k}</label></div>))}</div>
                    <div className="card p-3 bg-light mb-3"><div className="form-check fw-bold"><input type="checkbox" className="form-check-input" checked={alergias.si} onChange={()=>setAlergias({...alergias, si: !alergias.si})}/> Alergias</div>{alergias.si && <input className="form-control mt-2" placeholder="Especificar medicamento o alimento" value={alergias.tipo} onChange={e=>setAlergias({...alergias, tipo: e.target.value})}/>}</div>
                    <div className="card p-3 bg-light mb-3"><div className="form-check fw-bold"><input type="checkbox" className="form-check-input" checked={cirugias.si} onChange={()=>setCirugias({...cirugias, si: !cirugias.si})}/> Cirugías</div>{cirugias.si && <input className="form-control mt-2" placeholder="Tipo y Fecha" value={cirugias.tipo} onChange={e=>setCirugias({...cirugias, tipo: e.target.value})}/>}</div>
                </>
             )}

             {/* 5. ANTECEDENTES FAMILIARES */}
             {activeTab === "antecedentesFamiliares" && (
                <>
                    <h6 className="fw-bold text-primary">Antecedentes Familiares</h6>
                    <div className="d-flex flex-column gap-2 mt-3">{Object.keys(enfermedadesFamiliares).map(k=>(<div className="form-check" key={k}><input type="checkbox" className="form-check-input" checked={enfermedadesFamiliares[k]} onChange={()=>setEnfermedadesFamiliares({...enfermedadesFamiliares, [k]: !enfermedadesFamiliares[k]})}/><label className="form-check-label">{k}</label></div>))}</div>
                </>
             )}

             {/* 6. DESARROLLO */}
             {activeTab === "desarrollo" && (
                <div className="row g-3">
                    <h6 className="fw-bold text-primary mb-3">Hitos del Desarrollo</h6>
                    <div className="col-md-4"><label>Sostén Cefálico (meses)</label><input type="number" className="form-control" value={sostenCefalico} onChange={e=>setSostenCefalico(Number(e.target.value))}/></div>
                    <div className="col-md-4"><label>Sedestación (meses)</label><input type="number" className="form-control" value={sedestacion} onChange={e=>setSedestacion(Number(e.target.value))}/></div>
                    <div className="col-md-4"><label>Deambulación (meses)</label><input type="number" className="form-control" value={deambulacion} onChange={e=>setDeambulacion(Number(e.target.value))}/></div>
                    <div className="col-md-4"><label>Lenguaje (meses)</label><input type="number" className="form-control" value={lenguaje} onChange={e=>setLenguaje(Number(e.target.value))}/></div>
                </div>
             )}
             
             {/* 7. EXAMEN FÍSICO */}
             {activeTab === "examenFisico" && (
                 <>
                    <div className="row g-3 mb-4 p-3 bg-light rounded border">
                        <h6 className="text-primary mb-2">Signos Vitales y Antropometría</h6>
                        <div className="col-2"><label className="small">Peso (kg)</label><input className="form-control form-control-sm" type="number" value={peso} onChange={e=>setPeso(Number(e.target.value))}/></div>
                        <div className="col-2"><label className="small">Talla (cm)</label><input className="form-control form-control-sm" type="number" value={talla} onChange={e=>setTalla(Number(e.target.value))}/></div>
                        <div className="col-2"><label className="small">Temp (°C)</label><input className="form-control form-control-sm" type="number" value={temperatura} onChange={e=>setTemperatura(Number(e.target.value))}/></div>
                        <div className="col-2"><label className="small">FC</label><input className="form-control form-control-sm" type="number" value={fc} onChange={e=>setFc(Number(e.target.value))}/></div>
                        <div className="col-2"><label className="small">FR</label><input className="form-control form-control-sm" type="number" value={fr} onChange={e=>setFr(Number(e.target.value))}/></div>
                        <div className="col-2">
                            <label className="small">PA (Sis/Dia)</label>
                            <div className="d-flex gap-1">
                                <input className="form-control form-control-sm" placeholder="120" value={pa.sistolica} onChange={e=>setPa({...pa, sistolica: Number(e.target.value)})}/>
                                <input className="form-control form-control-sm" placeholder="80" value={pa.diastolica} onChange={e=>setPa({...pa, diastolica: Number(e.target.value)})}/>
                            </div>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="fw-bold mb-2">Descripción / Hallazgos Físicos</label>
                        <textarea 
                            className="form-control" 
                            rows={6}
                            placeholder="Describa aquí lo que presenta el paciente (inspección, palpación, auscultación)..."
                            value={descripcionFisica}
                            onChange={(e) => setDescripcionFisica(e.target.value)}
                        ></textarea>
                    </div>
                 </>
             )}

             {/* 8. DIAGNÓSTICO */}
             {activeTab === "diagnosticoPlan" && (
                <>
                    {/* CIE-10 */}
                    <div className="mb-4">
                        <label className="fw-bold text-primary mb-2">Diagnósticos CIE-10 (Opcional)</label>
                        {listaDiagnosticos.map((diag) => (
                            <div key={diag.id} className="row g-2 mb-2">
                                <div className="col-md-2"><input className="form-control form-control-sm" placeholder="Código" value={diag.cie10} onChange={e => actualizarDiagnostico(diag.id, 'cie10', e.target.value)} /></div>
                                <div className="col-md-8"><input className="form-control form-control-sm" placeholder="Descripción" value={diag.descripcion} onChange={e => actualizarDiagnostico(diag.id, 'descripcion', e.target.value)} /></div>
                                <div className="col-md-1"><button className="btn btn-outline-danger btn-sm w-100" onClick={() => eliminarDiagnostico(diag.id)}>X</button></div>
                            </div>
                        ))}
                        <button className="btn btn-sm btn-outline-primary" onClick={agregarFilaDiagnostico}>+ Agregar CIE-10</button>
                    </div>

                    {/* --- EDITOR DE TEXTO LIMPIO --- */}
                    <div className="card mb-4" style={{border: '1px solid #dee2e6'}}>
                        <div className="card-header bg-white py-2">
                            <span className="fw-bold text-uppercase" style={{fontSize: '0.85rem', color: '#555', letterSpacing: '0.5px'}}>
                                NOTAS DE HISTORIAL / DIAGNÓSTICO
                            </span>
                        </div>
                        
                        <textarea 
                            className="form-control border-0 p-3" 
                            style={{minHeight: '200px', resize: 'vertical', boxShadow: 'none', outline: 'none'}}
                            placeholder="Empieza a escribir el diagnóstico detallado, evolución y análisis..."
                            value={notaHistorial}
                            onChange={(e) => setNotaHistorial(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Plan */}
                    <div className="row g-3">
                        <div className="col-md-12">
                            <label className="form-label fw-bold text-success">Plan / Tratamiento / Receta</label>
                            <textarea className="form-control border-success" rows={3} value={manejoFarmacologico} onChange={e => setManejoFarmacologico(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Estudios Solicitados</label>
                            <textarea className="form-control" rows={2} value={estudiosSolicitados} onChange={e => setEstudiosSolicitados(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Pronóstico</label>
                            <select className="form-select" value={pronostico} onChange={e => setPronostico(e.target.value)}>
                                <option value="">Seleccione</option>
                                <option>Bueno</option>
                                <option>Reservado</option>
                                <option>Malo</option>
                            </select>
                        </div>
                    </div>
                </>
             )}
          </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECCIÓN INFERIOR: HISTORIAL Y NUEVA CONSULTA (FOOTER)                  */}
      {/* ========================================================================= */}
      <div className="bg-white border-top shadow-sm p-4 d-flex flex-column" style={{ minHeight: '250px', maxHeight: '350px', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="text-success fw-bold m-0"><i className="bi bi-clock-history me-2"></i>HISTORIAL DE CONSULTAS</h6>
                <button className="btn btn-success fw-bold btn-sm" onClick={handleNuevaConsulta}>
                    + INICIAR NUEVA CONSULTA
                </button>
            </div>
            
            {/* Lista Horizontal de Historial (Grid) */}
            <div className="row g-3">
                {consultasPasadas.slice().reverse().map((hist: any, i: number) => (
                    <div key={i} className="col-md-6 col-lg-4 col-xl-3">
                        <div className={`p-3 rounded border h-100 ${idEdicion === hist.id ? 'bg-warning bg-opacity-10 border-warning' : 'bg-light'}`}>
                            <div className="d-flex justify-content-between mb-1">
                                <span className="fw-bold">{hist.fecha}</span>
                                <button className="btn btn-sm btn-link p-0" onClick={() => {
                                    navigate('.', { state: { consultaAEditar: hist } });
                                    window.location.reload();
                                }}>Editar</button>
                            </div>
                            <strong className="d-block text-primary small text-truncate">{hist.motivo}</strong>
                            {hist.examenFisico?.descripcion && (
                                <p className="small text-muted mt-2 mb-0 border-top pt-2 text-truncate">
                                    {hist.examenFisico.descripcion}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
      </div>
    </div>
  );
}