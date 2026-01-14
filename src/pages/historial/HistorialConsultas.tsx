import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useParams, useNavigate } from "react-router-dom";
import { obtenerPacientes, agregarConsulta } from "../../services/pacienteStorage";

// Interfaz para la tabla dinámica de diagnósticos
interface DiagnosticoItem {
  id: string;
  cie10: string;
  descripcion: string;
  tipo: 'Presuntivo' | 'Definitivo';
}

export default function HistorialConsultas() {
  const { cedula } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<any>(null);

  // Cargar datos del paciente para el Sidebar
  useEffect(() => {
    const lista = obtenerPacientes();
    const encontrado = lista.find((p: any) => p.cedula == cedula);
    if (encontrado) setPaciente(encontrado);
  }, [cedula]);

  const [activeTab, setActiveTab] = useState<
    | "anamnesis"
    | "antecedentesPerinatales"
    | "inmunizaciones"
    | "antecedentesPersonales"
    | "antecedentesFamiliares"
    | "desarrollo"
    | "examenFisico"
    | "diagnosticoPlan"
  >("anamnesis");

  // ================= ESTADOS DEL FORMULARIO =================

  // ANAMNESIS
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [enfermedadActual, setEnfermedadActual] = useState("");

  // ANTECEDENTES PERINATALES
  const [productoGestacion, setProductoGestacion] = useState("");
  const [edadGestacional, setEdadGestacional] = useState<number | "">("");
  const [viaParto, setViaParto] = useState("");
  const [pesoNacimiento, setPesoNacimiento] = useState<number | "">("");
  const [tallaNacimiento, setTallaNacimiento] = useState<number | "">("");
  const [apgarMin, setApgarMin] = useState<number | "">("");
  const [apgar5, setApgar5] = useState<number | "">("");
  const [complicacionesPerinatales, setComplicacionesPerinatales] = useState<Record<string, boolean>>({
    SDR: false,
    Ictericia: false,
    Sepsis: false,
  });

  // INMUNIZACIONES
  const [estadoVacunacion, setEstadoVacunacion] = useState("");

  // ANTECEDENTES PERSONALES
  const enfermedadesCronicasOptions = ["Asma", "Diabetes", "Cardiopatías", "Epilepsia"];
  const [enfermedadesCronicas, setEnfermedadesCronicas] = useState<Record<string, boolean>>(
    enfermedadesCronicasOptions.reduce((acc, cur) => ({ ...acc, [cur]: false }), {})
  );
  const [hospitalizaciones, setHospitalizaciones] = useState<{ si: boolean; causa: string; fecha: string }>({ si: false, causa: "", fecha: "" });
  const [cirugias, setCirugias] = useState<{ si: boolean; tipo: string; fecha: string }>({ si: false, tipo: "", fecha: "" });
  const [alergias, setAlergias] = useState<{ si: boolean; tipo: string; reaccion: string }>({ si: false, tipo: "", reaccion: "" });

  // ANTECEDENTES FAMILIARES
  const enfermedadesFamiliaresOptions = ["HTA", "Diabetes", "Cáncer", "Enfermedades Genéticas"];
  const [enfermedadesFamiliares, setEnfermedadesFamiliares] = useState<Record<string, boolean>>(
    enfermedadesFamiliaresOptions.reduce((acc, cur) => ({ ...acc, [cur]: false }), {})
  );

  // DESARROLLO PSICOMOTOR
  const [sostenCefalico, setSostenCefalico] = useState<number | "">("");
  const [sedestacion, setSedestacion] = useState<number | "">("");
  const [deambulacion, setDeambulacion] = useState<number | "">("");
  const [lenguaje, setLenguaje] = useState<number | "">("");
  const [alimentacion, setAlimentacion] = useState("");

  // EXAMEN FISICO
  const [peso, setPeso] = useState<number | "">("");
  const [talla, setTalla] = useState<number | "">("");
  const [perimetroCefalico, setPerimetroCefalico] = useState<number | "">("");
  const [temperatura, setTemperatura] = useState<number | "">("");
  const [fc, setFc] = useState<number | "">("");
  const [fr, setFr] = useState<number | "">("");
  const [pa, setPa] = useState<{ sistolica: number | ""; diastolica: number | "" }>({ sistolica: "", diastolica: "" });
  const [spo2, setSpo2] = useState<number | "">("");

  const [aspectoGeneral, setAspectoGeneral] = useState<Record<string, boolean>>({
    Consciente: false, Alerta: false, Activo: false, Decaido: false,
  });

  const [pielFaneras, setPielFaneras] = useState<Record<string, boolean>>({
    Ictericia: false, Cianosis: false, Rash: false,
  });
  const [cabezaCuello, setCabezaCuello] = useState<Record<string, boolean>>({
    FontanelaAnterior: false, Adenopatias: false,
  });
  const [cardiopulmonar, setCardiopulmonar] = useState<Record<string, boolean>>({
    RuidosCardiacos: false, MurmulloVesicular: false, Soplos: false, Crepitantes: false,
  });
  const [abdomen, setAbdomen] = useState<Record<string, boolean>>({
    Blando: false, Depresible: false, DolorPalpacion: false, Hepatomegalia: false, Esplenomegalia: false,
  });
  const [neurologico, setNeurologico] = useState<Record<string, boolean>>({
    Reflejos: false, EstadoMental: false, TonoMuscular: false,
  });

  const [evolucionClinica, setEvolucionClinica] = useState("");

  // DIAGNOSTICO Y PLAN
  const [listaDiagnosticos, setListaDiagnosticos] = useState<DiagnosticoItem[]>([]);
  const [diagnosticoPrincipal, setDiagnosticoPrincipal] = useState("");
  const [diagnosticosSecundarios, setDiagnosticosSecundarios] = useState("");
  
  const [impresionDiagnostica, setImpresionDiagnostica] = useState("");
  const [estudiosSolicitados, setEstudiosSolicitados] = useState("");
  const [resultadosRelevantes, setResultadosRelevantes] = useState(""); 
  const [manejoFarmacologico, setManejoFarmacologico] = useState("");
  const [manejoNoFarmacologico, setManejoNoFarmacologico] = useState<Record<string, boolean>>({
    Hidratacion: false, Dieta: false, Oxigeno: false, Fisioterapia: false,
  });
  const [pronostico, setPronostico] = useState("");

  // ================= LOGICA DE DIAGNÓSTICOS MÚLTIPLES =================
  const agregarFilaDiagnostico = () => {
    setListaDiagnosticos([
      ...listaDiagnosticos,
      { id: uuidv4(), cie10: '', descripcion: '', tipo: 'Presuntivo' }
    ]);
  };

  const eliminarDiagnostico = (id: string) => {
    setListaDiagnosticos(listaDiagnosticos.filter(d => d.id !== id));
  };

  const actualizarDiagnostico = (id: string, campo: keyof DiagnosticoItem, valor: string) => {
    setListaDiagnosticos(listaDiagnosticos.map(d => d.id === id ? { ...d, [campo]: valor } : d));
  };

  // ================= LOGICA NUEVA CONSULTA (Limpiar formulario) =================
  const handleNuevaConsulta = () => {
    const confirmar = window.confirm("¿Deseas iniciar una nueva consulta? Esto limpiará el formulario actual.");
    if (confirmar) {
        // Limpiamos estados
        setMotivoConsulta("");
        setEnfermedadActual("");
        setPeso(""); setTalla(""); setPerimetroCefalico(""); setTemperatura(""); setFc(""); setFr(""); setSpo2("");
        setPa({ sistolica: "", diastolica: "" });
        setEvolucionClinica("");
        setListaDiagnosticos([]);
        setDiagnosticoPrincipal("");
        setDiagnosticosSecundarios("");
        setImpresionDiagnostica("");
        setEstudiosSolicitados("");
        setResultadosRelevantes("");
        setManejoFarmacologico("");
        setPronostico("");
        
        // Regresamos a la primera pestaña
        setActiveTab("anamnesis");
    }
  };

  // ================= GUARDAR CONSULTA =================
  const handleGuardarHistoria = () => {
    if (!cedula) return alert("No se encontró cédula en la URL");

    // Construimos el objeto completo de la consulta
    const nuevaConsulta = {
      id: uuidv4(),
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString(),
      estado: "Finalizada",
      
      // Anamnesis
      motivo: motivoConsulta,
      enfermedadActual,
      
      // Examen Físico
      examenFisico: {
          peso, talla, perimetroCefalico, temperatura, fc, fr, spo2, 
          presionArterial: `${pa.sistolica}/${pa.diastolica}`,
          aspectoGeneral, pielFaneras, cabezaCuello, cardiopulmonar, abdomen, neurologico, evolucionClinica
      },

      // Diagnósticos
      diagnosticos: listaDiagnosticos, 
      diagnosticoTexto: diagnosticoPrincipal,
      diagnosticosSecundarios, 

      // Plan
      impresionDiagnostica,
      estudiosSolicitados,
      resultadosRelevantes,
      planTratamiento: {
          receta: manejoFarmacologico,
          estudios: estudiosSolicitados,
          indicaciones: manejoNoFarmacologico,
          pronostico
      },

      // Snapshot de antecedentes
      antecedentesSnapshot: {
        enfermedadesCronicas, 
        hospitalizaciones, 
        cirugias, 
        alergias,
        enfermedadesFamiliares, 
        antecedentesPerinatales: {
            productoGestacion, edadGestacional, pesoNacimiento
        }
      }
    };

    const exito = agregarConsulta(cedula, nuevaConsulta);

    if (exito) {
        alert("¡Nueva consulta registrada correctamente!");
        window.location.reload();
    } else {
        alert("Hubo un error al guardar la consulta.");
    }
  };

  // Filtros para el Sidebar
  const consultasPasadas = paciente?.historiaClinica?.filter((c: any) => c.estado !== 'Agendada') || [];
  const consultasAgendadas = paciente?.historiaClinica?.filter((c: any) => c.estado === 'Agendada') || [];


  return (
    <div className="d-flex" style={{ height: '100vh', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
      
      {/* ================= COLUMNA IZQUIERDA: FORMULARIO COMPLETO ================= */}
      <div className="flex-grow-1 p-4 overflow-auto" style={{ height: '100%' }}>
          
          <div className="d-flex justify-content-between align-items-center mb-4">
             <div>
                <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => navigate(-1)}>← Volver a la lista</button>
                <h4 className="fw-bold text-primary">Nueva Consulta Médica</h4>
                <span className="badge bg-secondary">Paciente: {paciente ? `${paciente.nombres} ${paciente.apellidos}` : 'Cargando...'}</span>
             </div>
             <button className="btn btn-success fw-bold px-4" onClick={handleGuardarHistoria}>
                 <i className="bi bi-save me-2"></i> GUARDAR CONSULTA
             </button>
          </div>

          {/* ====== Tabs ====== */}
          <ul className="nav nav-tabs mb-3">
            {[
              { key: "anamnesis", label: "Anamnesis" },
              { key: "antecedentesPerinatales", label: "Ant. Perinatales" },
              { key: "inmunizaciones", label: "Inmunizaciones" },
              { key: "antecedentesPersonales", label: "Ant. Personales" },
              { key: "antecedentesFamiliares", label: "Ant. Familiares" },
              { key: "desarrollo", label: "Desarrollo" },
              { key: "examenFisico", label: "Examen Físico" },
              { key: "diagnosticoPlan", label: "Diagnóstico y Plan" },
            ].map((tab) => (
              <li key={tab.key} className="nav-item">
                <button
                  className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key as any)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="card p-4 shadow-sm border-0 mb-5" style={{ minHeight: "60vh", backgroundColor: 'white' }}>
            
            {/* ================= PESTAÑA 1: ANAMNESIS ================= */}
            {activeTab === "anamnesis" && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-bold">Motivo de Consulta (MC)</label>
                  <textarea className="form-control" rows={2} value={motivoConsulta} onChange={(e) => setMotivoConsulta(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Enfermedad Actual (EA)</label>
                  <textarea className="form-control" rows={5} value={enfermedadActual} onChange={(e) => setEnfermedadActual(e.target.value)} />
                </div>
              </>
            )}

            {/* ================= PESTAÑA 2: PERINATALES ================= */}
            {activeTab === "antecedentesPerinatales" && (
              <div className="row g-3">
                <div className="col-md-4">
                  <label>Producto de Gestación</label>
                  <select className="form-select" value={productoGestacion} onChange={(e) => setProductoGestacion(e.target.value)}>
                    <option value="">Seleccione</option>
                    <option>Única</option>
                    <option>Gemelar</option>
                    <option>Múltiple</option>
                    <option>Desconoce</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label>Edad Gestacional (semanas)</label>
                  <input type="number" className="form-control" value={edadGestacional} onChange={(e) => setEdadGestacional(Number(e.target.value))} />
                </div>
                <div className="col-md-4">
                  <label>Vía del Parto</label>
                  <select className="form-select" value={viaParto} onChange={(e) => setViaParto(e.target.value)}>
                    <option value="">Seleccione</option>
                    <option>Vaginal</option>
                    <option>Cesárea</option>
                    <option>Desconoce</option>
                  </select>
                </div>
                {/* Resto de inputs perinatales... */}
                <div className="col-md-3"><label>Peso Nacer (g)</label><input type="number" className="form-control" value={pesoNacimiento} onChange={(e) => setPesoNacimiento(Number(e.target.value))} /></div>
                <div className="col-md-3"><label>Talla Nacer (cm)</label><input type="number" className="form-control" value={tallaNacimiento} onChange={(e) => setTallaNacimiento(Number(e.target.value))} /></div>
                <div className="col-md-3"><label>Apgar 1'</label><input type="number" className="form-control" value={apgarMin} onChange={(e) => setApgarMin(Number(e.target.value))} /></div>
                <div className="col-md-3"><label>Apgar 5'</label><input type="number" className="form-control" value={apgar5} onChange={(e) => setApgar5(Number(e.target.value))} /></div>
                
                <div className="col-12 mt-3">
                  <label className="fw-bold mb-2">Complicaciones Perinatales</label>
                  <div className="d-flex gap-3">
                    {Object.keys(complicacionesPerinatales).map((key) => (
                      <div className="form-check" key={key}>
                        <input className="form-check-input" type="checkbox" checked={complicacionesPerinatales[key]} onChange={() => setComplicacionesPerinatales({ ...complicacionesPerinatales, [key]: !complicacionesPerinatales[key] })} />
                        <label className="form-check-label">{key}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= PESTAÑA 3: INMUNIZACIONES ================= */}
            {activeTab === "inmunizaciones" && (
              <div className="mb-3">
                <label className="form-label">Estado de Vacunación</label>
                <select className="form-select" value={estadoVacunacion} onChange={e => setEstadoVacunacion(e.target.value)}>
                  <option value="">Seleccione</option>
                  <option>Completo para la edad</option>
                  <option>Incompleto</option>
                  <option>No vacunado</option>
                </select>
              </div>
            )}

            {/* ================= PESTAÑA 4: PERSONALES ================= */}
            {activeTab === "antecedentesPersonales" && (
              <>
                <h6 className="fw-bold mt-2">Enfermedades Crónicas</h6>
                <div className="d-flex gap-3 mb-4 flex-wrap">
                  {Object.keys(enfermedadesCronicas).map(key => (
                    <div className="form-check" key={key}>
                      <input className="form-check-input" type="checkbox" checked={enfermedadesCronicas[key]} onChange={() => setEnfermedadesCronicas({ ...enfermedadesCronicas, [key]: !enfermedadesCronicas[key] })} />
                      <label className="form-check-label">{key}</label>
                    </div>
                  ))}
                </div>
                
                <div className="card bg-light p-3 mb-3">
                    <div className="form-check mb-2">
                        <input type="checkbox" className="form-check-input" checked={hospitalizaciones.si} onChange={() => setHospitalizaciones({ ...hospitalizaciones, si: !hospitalizaciones.si })}/>
                        <label className="form-check-label fw-bold">Hospitalizaciones Previas</label>
                    </div>
                    {hospitalizaciones.si && (
                        <div className="row">
                             <div className="col-8"><input className="form-control form-control-sm" placeholder="Causa" value={hospitalizaciones.causa} onChange={e => setHospitalizaciones({...hospitalizaciones, causa: e.target.value})}/></div>
                             <div className="col-4"><input type="date" className="form-control form-control-sm" value={hospitalizaciones.fecha} onChange={e => setHospitalizaciones({...hospitalizaciones, fecha: e.target.value})}/></div>
                        </div>
                    )}
                </div>
                <div className="card bg-light p-3 mb-3">
                    <div className="form-check mb-2">
                        <input type="checkbox" className="form-check-input" checked={cirugias.si} onChange={() => setCirugias({ ...cirugias, si: !cirugias.si })}/>
                        <label className="form-check-label fw-bold">Cirugías Previas</label>
                    </div>
                    {cirugias.si && (
                        <div className="row">
                             <div className="col-8"><input className="form-control form-control-sm" placeholder="Tipo" value={cirugias.tipo} onChange={e => setCirugias({...cirugias, tipo: e.target.value})}/></div>
                             <div className="col-4"><input type="date" className="form-control form-control-sm" value={cirugias.fecha} onChange={e => setCirugias({...cirugias, fecha: e.target.value})}/></div>
                        </div>
                    )}
                </div>
                <div className="card bg-light p-3 mb-3 border-danger">
                    <div className="form-check mb-2">
                        <input type="checkbox" className="form-check-input" checked={alergias.si} onChange={() => setAlergias({ ...alergias, si: !alergias.si })}/>
                        <label className="form-check-label fw-bold text-danger">Alergias</label>
                    </div>
                    {alergias.si && (
                        <div className="row">
                            <div className="col-6"><input className="form-control form-control-sm" placeholder="Medicamento/Alimento" value={alergias.tipo} onChange={e => setAlergias({...alergias, tipo: e.target.value})}/></div>
                            <div className="col-6"><input className="form-control form-control-sm" placeholder="Reacción" value={alergias.reaccion} onChange={e => setAlergias({...alergias, reaccion: e.target.value})}/></div>
                        </div>
                    )}
                </div>
              </>
            )}

            {/* ================= PESTAÑA 5: FAMILIARES ================= */}
            {activeTab === "antecedentesFamiliares" && (
               <div className="mb-3">
                   <h6 className="fw-bold">Enfermedades Familiares</h6>
                   <div className="d-flex flex-column gap-2 mt-2">
                    {Object.keys(enfermedadesFamiliares).map(key => (
                        <div className="form-check" key={key}>
                            <input type="checkbox" className="form-check-input" checked={enfermedadesFamiliares[key]} onChange={() => setEnfermedadesFamiliares({...enfermedadesFamiliares, [key]: !enfermedadesFamiliares[key]})}/>
                            <label className="form-check-label">{key}</label>
                        </div>
                    ))}
                   </div>
               </div>
            )}

            {/* ================= PESTAÑA 6: DESARROLLO ================= */}
            {activeTab === "desarrollo" && (
              <div className="row g-3">
                 <div className="col-md-4"><label>Sostén Cefálico</label><input type="number" className="form-control" value={sostenCefalico} onChange={e => setSostenCefalico(Number(e.target.value))}/></div>
                 <div className="col-md-4"><label>Sedestación</label><input type="number" className="form-control" value={sedestacion} onChange={e => setSedestacion(Number(e.target.value))}/></div>
                 <div className="col-md-4"><label>Deambulación</label><input type="number" className="form-control" value={deambulacion} onChange={e => setDeambulacion(Number(e.target.value))}/></div>
                 <div className="col-md-6"><label>Lenguaje</label><input type="number" className="form-control" value={lenguaje} onChange={e => setLenguaje(Number(e.target.value))}/></div>
                 <div className="col-md-6">
                    <label>Alimentación</label>
                    <select className="form-select" value={alimentacion} onChange={e => setAlimentacion(e.target.value)}>
                        <option value="">Seleccione</option>
                        <option>Lactancia Materna</option>
                        <option>Fórmula</option>
                        <option>Ablactación</option>
                    </select>
                 </div>
              </div>
            )}

            {/* ================= PESTAÑA 7: EXAMEN FISICO ================= */}
            {activeTab === "examenFisico" && (
              <>
                 <div className="row g-3 mb-4 p-3 bg-light rounded border">
                    <h6 className="text-primary mb-0">Signos Vitales y Antropometría</h6>
                    <div className="col-md-3"><label>Peso (kg)</label><input type="number" className="form-control" value={peso} onChange={e => setPeso(Number(e.target.value))}/></div>
                    <div className="col-md-3"><label>Talla (cm)</label><input type="number" className="form-control" value={talla} onChange={e => setTalla(Number(e.target.value))}/></div>
                    <div className="col-md-3"><label>P. Cefálico</label><input type="number" className="form-control" value={perimetroCefalico} onChange={e => setPerimetroCefalico(Number(e.target.value))}/></div>
                    <div className="col-md-3"><label>Temp (°C)</label><input type="number" className="form-control" value={temperatura} onChange={e => setTemperatura(Number(e.target.value))}/></div>
                    <div className="col-md-3"><label>FC (lpm)</label><input type="number" className="form-control" value={fc} onChange={e => setFc(Number(e.target.value))}/></div>
                    <div className="col-md-3"><label>FR (rpm)</label><input type="number" className="form-control" value={fr} onChange={e => setFr(Number(e.target.value))}/></div>
                    <div className="col-md-3"><label>SatO2 (%)</label><input type="number" className="form-control" value={spo2} onChange={e => setSpo2(Number(e.target.value))}/></div>
                    <div className="col-md-3">
                        <label>Presión Arterial</label>
                        <div className="d-flex gap-1">
                            <input type="number" className="form-control" placeholder="Sis" value={pa.sistolica} onChange={e => setPa({...pa, sistolica: Number(e.target.value)})}/>
                            <input type="number" className="form-control" placeholder="Dia" value={pa.diastolica} onChange={e => setPa({...pa, diastolica: Number(e.target.value)})}/>
                        </div>
                    </div>
                 </div>

                 {/* Sistemas Completos */}
                 <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="fw-bold small text-muted">Aspecto General</label>
                        <div className="d-flex gap-2 flex-wrap">{Object.keys(aspectoGeneral).map(key => (<div className="form-check" key={key}><input type="checkbox" className="form-check-input" checked={aspectoGeneral[key]} onChange={() => setAspectoGeneral({...aspectoGeneral, [key]: !aspectoGeneral[key]})}/><label className="form-check-label">{key}</label></div>))}</div>
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="fw-bold small text-muted">Piel y Faneras</label>
                        <div className="d-flex gap-2 flex-wrap">{Object.keys(pielFaneras).map(key => (<div className="form-check" key={key}><input type="checkbox" className="form-check-input" checked={pielFaneras[key]} onChange={() => setPielFaneras({...pielFaneras, [key]: !pielFaneras[key]})}/><label className="form-check-label">{key}</label></div>))}</div>
                    </div>
                    <div className="col-md-6 mb-3"><label className="fw-bold small text-muted">Cabeza/Cuello</label><div className="d-flex gap-2 flex-wrap">{Object.keys(cabezaCuello).map(key => (<div className="form-check" key={key}><input type="checkbox" className="form-check-input" checked={cabezaCuello[key]} onChange={() => setCabezaCuello({...cabezaCuello, [key]: !cabezaCuello[key]})}/><label className="form-check-label">{key}</label></div>))}</div></div>
                    <div className="col-md-6 mb-3"><label className="fw-bold small text-muted">Cardiopulmonar</label><div className="d-flex gap-2 flex-wrap">{Object.keys(cardiopulmonar).map(key => (<div className="form-check" key={key}><input type="checkbox" className="form-check-input" checked={cardiopulmonar[key]} onChange={() => setCardiopulmonar({...cardiopulmonar, [key]: !cardiopulmonar[key]})}/><label className="form-check-label">{key}</label></div>))}</div></div>
                    <div className="col-md-6 mb-3"><label className="fw-bold small text-muted">Abdomen</label><div className="d-flex gap-2 flex-wrap">{Object.keys(abdomen).map(key => (<div className="form-check" key={key}><input type="checkbox" className="form-check-input" checked={abdomen[key]} onChange={() => setAbdomen({...abdomen, [key]: !abdomen[key]})}/><label className="form-check-label">{key}</label></div>))}</div></div>
                    <div className="col-md-6 mb-3"><label className="fw-bold small text-muted">Neurológico</label><div className="d-flex gap-2 flex-wrap">{Object.keys(neurologico).map(key => (<div className="form-check" key={key}><input type="checkbox" className="form-check-input" checked={neurologico[key]} onChange={() => setNeurologico({...neurologico, [key]: !neurologico[key]})}/><label className="form-check-label">{key}</label></div>))}</div></div>
                 </div>

                 <div className="mt-3">
                    <label className="form-label fw-bold">Evolución Clínica</label>
                    <textarea className="form-control" rows={3} value={evolucionClinica} onChange={e => setEvolucionClinica(e.target.value)} />
                 </div>
              </>
            )}

            {/* ================= PESTAÑA 8: DIAGNOSTICO Y PLAN ================= */}
            {activeTab === "diagnosticoPlan" && (
              <>
                 {/* Lista Dinámica */}
                 <div className="card bg-light p-3 mb-4 border shadow-sm">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <label className="fw-bold text-primary">Lista de Diagnósticos (CIE-10)</label>
                        <button className="btn btn-sm btn-primary" onClick={agregarFilaDiagnostico}>+ Agregar</button>
                    </div>
                    {listaDiagnosticos.length === 0 && <p className="text-muted small fst-italic text-center py-2">Sin diagnósticos agregados.</p>}
                    {listaDiagnosticos.map((diag) => (
                        <div key={diag.id} className="row g-2 mb-2 align-items-center bg-white p-2 border rounded">
                            <div className="col-md-2"><input className="form-control form-control-sm" placeholder="Código" value={diag.cie10} onChange={e => actualizarDiagnostico(diag.id, 'cie10', e.target.value)} /></div>
                            <div className="col-md-6"><input className="form-control form-control-sm" placeholder="Descripción" value={diag.descripcion} onChange={e => actualizarDiagnostico(diag.id, 'descripcion', e.target.value)} /></div>
                            <div className="col-md-3"><select className="form-select form-select-sm" value={diag.tipo} onChange={e => actualizarDiagnostico(diag.id, 'tipo', e.target.value as any)}><option>Presuntivo</option><option>Definitivo</option></select></div>
                            <div className="col-md-1"><button className="btn btn-outline-danger btn-sm w-100" onClick={() => eliminarDiagnostico(diag.id)}>X</button></div>
                        </div>
                    ))}
                 </div>

                 {/* Inputs Plan */}
                 <div className="mb-3"><label className="form-label">Diagnóstico Texto Libre (Opcional)</label><input type="text" className="form-control" value={diagnosticoPrincipal} onChange={e => setDiagnosticoPrincipal(e.target.value)}/></div>
                 <div className="mb-3"><label className="form-label">Diagnósticos Secundarios</label><input type="text" className="form-control" value={diagnosticosSecundarios} onChange={e => setDiagnosticosSecundarios(e.target.value)}/></div>
                 
                 <div className="row g-3">
                    <div className="col-md-6"><label className="form-label">Impresión Diagnóstica</label><textarea className="form-control" rows={3} value={impresionDiagnostica} onChange={e => setImpresionDiagnostica(e.target.value)} /></div>
                    <div className="col-md-6"><label className="form-label">Estudios Solicitados</label><textarea className="form-control" rows={3} value={estudiosSolicitados} onChange={e => setEstudiosSolicitados(e.target.value)} /></div>
                 </div>

                 <div className="mt-3">
                    <label className="form-label fw-bold">Resultados Relevantes de Exámenes</label>
                    <textarea className="form-control" rows={3} value={resultadosRelevantes} onChange={e => setResultadosRelevantes(e.target.value)} />
                 </div>

                 <div className="mt-3">
                    <label className="form-label fw-bold text-success">Manejo Farmacológico (Receta)</label>
                    <textarea className="form-control border-success" rows={4} value={manejoFarmacologico} onChange={e => setManejoFarmacologico(e.target.value)} />
                 </div>

                 <div className="mt-3">
                     <label className="form-label fw-bold">Manejo No Farmacológico</label>
                     <div className="d-flex gap-3">
                        {Object.keys(manejoNoFarmacologico).map(key => (
                        <div className="form-check" key={key}>
                            <input type="checkbox" className="form-check-input" checked={manejoNoFarmacologico[key]} onChange={() => setManejoNoFarmacologico({...manejoNoFarmacologico, [key]: !manejoNoFarmacologico[key]})}/>
                            <label className="form-check-label">{key}</label>
                        </div>
                        ))}
                     </div>
                 </div>

                 <div className="mt-3 mb-4">
                    <label className="form-label">Pronóstico</label>
                    <select className="form-select w-50" value={pronostico} onChange={e => setPronostico(e.target.value)}>
                        <option value="">Seleccione</option>
                        <option>Bueno</option>
                        <option>Reservado</option>
                        <option>Malo</option>
                    </select>
                 </div>
              </>
            )}

          </div>
      </div>

      {/* ================= COLUMNA DERECHA: SIDEBAR ================= */}
      <div className="bg-white border-start shadow-sm p-3 d-none d-xl-block" style={{ width: '400px', overflowY: 'auto' }}>
            
            {/* BOTÓN NUEVA CONSULTA (AQUÍ ESTÁ LA NUEVA FUNCIONALIDAD) */}
            <button 
                className="btn btn-success w-100 mb-4 fw-bold py-2 shadow-sm text-uppercase"
                onClick={handleNuevaConsulta}
            >
                <i className="bi bi-plus-circle me-2"></i> INICIAR NUEVA CONSULTA
            </button>

            {/* CITAS AGENDADAS */}
            <div className="mb-4 bg-light p-3 rounded border border-warning">
                <h6 className="text-warning fw-bold mb-3"><i className="bi bi-calendar-event me-2"></i>CITAS AGENDADAS</h6>
                {consultasAgendadas.length > 0 ? (
                    consultasAgendadas.map((cita: any, i: number) => (
                        <div key={i} className="card mb-2 border-0 shadow-sm">
                            <div className="card-body p-2">
                                <small className="text-muted d-block">{cita.fecha} - {cita.hora}</small>
                                <strong className="text-dark d-block mb-2">{cita.motivo}</strong>
                                <button className="btn btn-sm btn-primary w-100">Iniciar Consulta</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-muted small fst-italic text-center mb-0">No hay citas futuras.</p>
                )}
            </div>

            {/* HISTORIAL */}
            <h6 className="text-success fw-bold mb-3 px-2">HISTORIAL MÉDICO</h6>
            <div className="px-2" style={{ borderLeft: '3px solid #198754', marginLeft: '12px' }}>
                {consultasPasadas.slice().reverse().map((hist: any, i: number) => (
                    <div key={i} className="mb-4 position-relative ps-4">
                        <div className="position-absolute bg-success rounded-circle border border-white shadow-sm" style={{ width: '16px', height: '16px', left: '-10px', top: '4px' }}></div>
                        <div className="mb-1 d-flex justify-content-between"><span className="fw-bold text-dark">{hist.fecha}</span><span className="text-muted small">{hist.hora}</span></div>
                        <div className="bg-light p-3 rounded border shadow-sm position-relative">
                            <strong className="d-block text-primary small mb-2 text-uppercase">{hist.motivo || "Consulta General"}</strong>
                            {hist.diagnosticos && hist.diagnosticos.length > 0 ? (
                                <ul className="mb-2 ps-3 small text-secondary bg-white rounded p-1 border">
                                    {hist.diagnosticos.map((d: any, idx: number) => <li key={idx}><strong>{d.cie10}</strong>: {d.descripcion}</li>)}
                                </ul>
                            ) : (hist.diagnosticoTexto && <p className="small text-muted mb-1">Dx: {hist.diagnosticoTexto}</p>)}
                            
                            {hist.examenFisico && (
                                <div className="d-flex flex-wrap gap-1 small text-muted mb-2 border-top pt-2 mt-2">
                                    <span className="badge bg-white text-dark border">T: {hist.examenFisico.temperatura}°</span>
                                    <span className="badge bg-white text-dark border">Kg: {hist.examenFisico.peso}</span>
                                    <span className="badge bg-white text-dark border">PA: {hist.examenFisico.presionArterial}</span>
                                </div>
                            )}
                            {hist.planTratamiento && hist.planTratamiento.receta && (
                                <div className="small text-dark fst-italic border-start border-3 border-info ps-2 mt-2" style={{ backgroundColor: '#e3f2fd' }}>Rx: {hist.planTratamiento.receta.substring(0, 50)}...</div>
                            )}
                        </div>
                    </div>
                ))}
                {consultasPasadas.length === 0 && <p className="text-muted ps-3 py-3">No hay historial previo registrado.</p>}
            </div>
      </div>
    </div>
  );
}