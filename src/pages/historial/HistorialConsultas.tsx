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
  
  // DATOS GENERALES
  const [paciente, setPaciente] = useState<any>(null);
  const [idEdicion, setIdEdicion] = useState<string | null>(null);
  
  // CONTROL DE VISTA (8 TABS VS 3 TABS)
  const [activeTab, setActiveTab] = useState<string>("anamnesis");
  const [modoCompleto, setModoCompleto] = useState(true); // true = 8 tabs, false = 3 tabs

  // ================= 3. ANAMNESIS (Siempre visible) =================
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [enfermedadActual, setEnfermedadActual] = useState("");

  // ================= 4. ANTECEDENTES PERINATALES (Ocultable) =================
  const [desconocePerinatales, setDesconocePerinatales] = useState(false);
  const [productoGestacion, setProductoGestacion] = useState("");
  const [edadGestacional, setEdadGestacional] = useState<number | "">("");
  const [viaParto, setViaParto] = useState("");
  const [pesoNacimiento, setPesoNacimiento] = useState<number | "">("");
  const [tallaNacimiento, setTallaNacimiento] = useState<number | "">("");
  const [apgarMin, setApgarMin] = useState<number | "">("");
  const [apgar5, setApgar5] = useState<number | "">("");
  const [complicacionesPerinatales, setComplicacionesPerinatales] = useState("");

  // ================= B. INMUNIZACIONES (Ocultable) =================
  const [estadoVacunacion, setEstadoVacunacion] = useState("");

  // ================= C. ANTECEDENTES PERSONALES (Ocultable) =================
  const [enfermedadesCronicas, setEnfermedadesCronicas] = useState<Record<string, boolean>>({ 
    "Asma": false, "Diabetes": false, "Cardiopatías": false, "Epilepsia": false 
  });
  const [hospitalizaciones, setHospitalizaciones] = useState<{ si: boolean; causa: string; fecha: string }>({ si: false, causa: "", fecha: "" });
  const [cirugias, setCirugias] = useState<{ si: boolean; tipo: string; fecha: string }>({ si: false, tipo: "", fecha: "" });
  const [alergiasDetalle, setAlergiasDetalle] = useState(""); 

  // ================= D. ANTECEDENTES FAMILIARES (Ocultable) =================
  const [enfermedadesFamiliares, setEnfermedadesFamiliares] = useState<Record<string, boolean>>({ 
    "HTA": false, "Diabetes": false, "Cáncer": false, "Enfermedades Genéticas": false 
  });

  // ================= 5. DESARROLLO (Ocultable) =================
  const [desconoceDesarrollo, setDesconoceDesarrollo] = useState(false);
  const [desarrollo, setDesarrollo] = useState({ 
    sostenCefalico: "", sedestacion: "", deambulacion: "", lenguaje: "" 
  });
  const [alimentacion, setAlimentacion] = useState("");

  // ================= 6. EXAMEN FÍSICO (Siempre visible) =================
  const [signosVitales, setSignosVitales] = useState({ 
    peso: "", talla: "", perimetroCefalico: "", temperatura: "", fc: "", fr: "", spo2: "", paSistolica: "", paDiastolica: "" 
  });
  const [aspectoGeneral, setAspectoGeneral] = useState("");
  const [pielFaneras, setPielFaneras] = useState("");
  const [cabezaCuello, setCabezaCuello] = useState("");
  const [cardiopulmonar, setCardiopulmonar] = useState("");
  const [abdomen, setAbdomen] = useState("");
  const [neurologico, setNeurologico] = useState("");
  const [evolucionClinica, setEvolucionClinica] = useState("");

  // ================= 7. DIAGNÓSTICO Y PLAN (Siempre visible) =================
  const [listaDiagnosticos, setListaDiagnosticos] = useState<DiagnosticoItem[]>([]);
  const [impresionDiagnostica, setImpresionDiagnostica] = useState("");
  const [estudiosSolicitados, setEstudiosSolicitados] = useState("");
  const [planManejo, setPlanManejo] = useState("");
  const [pronostico, setPronostico] = useState("");

  // ================= CARGAR DATOS Y DETERMINAR MODO =================
  useEffect(() => {
    const lista = obtenerPacientes();
    const encontrado = lista.find((p: any) => p.cedula == cedula);
    
    if (encontrado) {
        setPaciente(encontrado);
        
        // LÓGICA AUTOMÁTICA DE PESTAÑAS:
        // Si NO tiene historial previo, es PRIMERA VEZ -> Modo Completo (8 tabs).
        // Si YA TIENE historial, es SEGUIMIENTO -> Modo Simple (3 tabs).
        if (!encontrado.historiaClinica || encontrado.historiaClinica.length === 0) {
            setModoCompleto(true); 
        } else {
            setModoCompleto(false);
        }
    }

    // Si estamos editando una consulta específica
    if (location.state && location.state.consultaAEditar) {
        const c = location.state.consultaAEditar;
        setIdEdicion(c.id); 
        // Al editar, permitimos ver todo si hay datos relevantes, o mantenemos simple. 
        // Por defecto en edición sugerimos ver todo para corregir.
        setModoCompleto(true); 
        
        setMotivoConsulta(c.motivo || "");
        setEnfermedadActual(c.enfermedadActual || "");
        
        if (c.antecedentes) {
            const per = c.antecedentes.perinatales || {};
            setDesconocePerinatales(per.desconoce || false);
            setProductoGestacion(per.productoGestacion || "");
            setEdadGestacional(per.edadGestacional || "");
            setViaParto(per.viaParto || "");
            setPesoNacimiento(per.pesoNacimiento || "");
            setTallaNacimiento(per.tallaNacimiento || "");
            setApgarMin(per.apgarMin || "");
            setApgar5(per.apgar5 || "");
            setComplicacionesPerinatales(per.complicaciones || "");

            setEstadoVacunacion(c.antecedentes.vacunacion || "");
            if(c.antecedentes.cronicas) setEnfermedadesCronicas(c.antecedentes.cronicas);
            setAlergiasDetalle(c.antecedentes.alergiasDetalle || "");
            if(c.antecedentes.hospitalizaciones) setHospitalizaciones(c.antecedentes.hospitalizaciones);
            if(c.antecedentes.cirugias) setCirugias(c.antecedentes.cirugias);
            if(c.antecedentes.familiares) setEnfermedadesFamiliares(c.antecedentes.familiares);
            
            const des = c.antecedentes.desarrollo || {};
            setDesconoceDesarrollo(des.desconoce || false);
            setDesarrollo(des.hitos || { sostenCefalico: "", sedestacion: "", deambulacion: "", lenguaje: "" });
            setAlimentacion(des.alimentacion || "");
        }

        if (c.examenFisico) {
            setSignosVitales(c.examenFisico.vitales || {});
            setAspectoGeneral(c.examenFisico.segmentario?.aspectoGeneral || "");
            setPielFaneras(c.examenFisico.segmentario?.pielFaneras || "");
            setCabezaCuello(c.examenFisico.segmentario?.cabezaCuello || "");
            setCardiopulmonar(c.examenFisico.segmentario?.cardiopulmonar || "");
            setAbdomen(c.examenFisico.segmentario?.abdomen || "");
            setNeurologico(c.examenFisico.segmentario?.neurologico || "");
            setEvolucionClinica(c.examenFisico.evolucion || "");
        }

        if (c.diagnostico) {
            setListaDiagnosticos(c.diagnostico.cie10 || []);
            setImpresionDiagnostica(c.diagnostico.impresion || "");
            setEstudiosSolicitados(c.diagnostico.estudios || "");
            setPlanManejo(c.diagnostico.plan || "");
            setPronostico(c.diagnostico.pronostico || "");
        }
    }
  }, [cedula, location.state]);

  // Helpers
  const agregarFilaDiagnostico = () => setListaDiagnosticos([...listaDiagnosticos, { id: uuidv4(), cie10: '', descripcion: '', tipo: 'Presuntivo' }]);
  const eliminarDiagnostico = (id: string) => setListaDiagnosticos(listaDiagnosticos.filter(d => d.id !== id));
  const actualizarDiagnostico = (id: string, campo: keyof DiagnosticoItem, valor: string) => setListaDiagnosticos(listaDiagnosticos.map(d => d.id === id ? { ...d, [campo]: valor } : d));

  const handleGuardarHistoria = () => {
    if (!cedula) return alert("Error de cédula");

    const datosConsulta = {
      id: idEdicion || uuidv4(),
      fecha: idEdicion ? (location.state?.consultaAEditar?.fecha) : new Date().toISOString().split('T')[0],
      hora: idEdicion ? (location.state?.consultaAEditar?.hora) : new Date().toLocaleTimeString(),
      estado: "Finalizada",
      
      motivo: motivoConsulta,
      enfermedadActual,
      
      // Guardamos SIEMPRE los antecedentes, aunque estén ocultos en modo simple, para no borrarlos al actualizar.
      antecedentes: {
          perinatales: { 
              desconoce: desconocePerinatales,
              productoGestacion, edadGestacional, viaParto, pesoNacimiento, tallaNacimiento,
              apgarMin, apgar5, complicaciones: complicacionesPerinatales
          },
          vacunacion: estadoVacunacion,
          cronicas: enfermedadesCronicas,
          alergiasDetalle,
          hospitalizaciones, cirugias,
          familiares: enfermedadesFamiliares,
          desarrollo: { desconoce: desconoceDesarrollo, hitos: desarrollo, alimentacion }
      },

      examenFisico: {
          vitales: signosVitales,
          segmentario: { aspectoGeneral, pielFaneras, cabezaCuello, cardiopulmonar, abdomen, neurologico },
          evolucion: evolucionClinica
      },

      diagnostico: {
          cie10: listaDiagnosticos,
          impresion: impresionDiagnostica,
          estudios: estudiosSolicitados,
          plan: planManejo,
          pronostico
      }
    };

    let exito = false;
    if (idEdicion) { exito = actualizarConsultaExistente(cedula, datosConsulta); } 
    else { exito = agregarConsulta(cedula, datosConsulta); }
    
    if (exito) { alert("Consulta guardada exitosamente."); window.location.reload(); }
    else alert("Error al guardar.");
  };

  const handleNuevaConsulta = () => {
      if(window.confirm("¿Limpiar formulario?")) navigate(0);
  };

  const consultasPasadas = paciente?.historiaClinica?.filter((c: any) => c.estado !== 'Agendada') || [];

  // DEFINICIÓN DE TABS VISIBLES
  const tabsVisibles = modoCompleto 
    ? [ // 8 TABS (Primera Vez)
        { id: "anamnesis", label: "Anamnesis" }, 
        { id: "antecedentesPerinatales", label: "Perinatales" }, 
        { id: "inmunizaciones", label: "Inmunizaciones" }, 
        { id: "antecedentesPersonales", label: "Personales" }, 
        { id: "antecedentesFamiliares", label: "Familiares" }, 
        { id: "desarrollo", label: "Desarrollo" }, 
        { id: "examenFisico", label: "Examen Físico" }, 
        { id: "diagnostico", label: "Diagnóstico" } 
      ]
    : [ // 3 TABS (Seguimiento / Subsecuente)
        { id: "anamnesis", label: "Anamnesis" }, 
        { id: "examenFisico", label: "Examen Físico" }, 
        { id: "diagnostico", label: "Diagnóstico" } 
      ];

  return (
    <div className="d-flex flex-column" style={{ height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
      
      {/* 1. HEADER (FIJO) */}
      <div className="bg-white border-bottom flex-shrink-0">
         {/* Botones Superiores */}
         <div className="px-4 pt-3 d-flex justify-content-between align-items-center">
             <div>
                <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => navigate(-1)}>← Volver</button>
                <h4 className="fw-bold text-primary m-0">{idEdicion ? "Editando Consulta" : "Nueva Consulta Pediátrica"}</h4>
             </div>
             <div className="d-flex gap-2">
                 <button className="btn btn-outline-primary btn-sm" onClick={() => setModoCompleto(!modoCompleto)}>
                     {modoCompleto ? "👁 Ocultar Antecedentes" : "👁 Ver Antecedentes Completos"}
                 </button>
                 <button className="btn btn-success fw-bold px-4" onClick={handleGuardarHistoria}>
                     <i className="bi bi-save me-2"></i> {idEdicion ? "ACTUALIZAR" : "GUARDAR"}
                 </button>
             </div>
         </div>

         {/* FICHA DE IDENTIFICACIÓN SOLICITADA */}
         <div className="px-4 pb-3 mt-2">
             <div className="card bg-light border-0 shadow-sm">
                 <div className="card-body py-2 px-3">
                     <div className="row small text-secondary">
                         <div className="col-md-3"><strong>Paciente:</strong> {paciente ? `${paciente.nombres} ${paciente.apellidos}` : '...'}</div>
                         <div className="col-md-2"><strong>Cédula:</strong> {cedula}</div>
                         <div className="col-md-2"><strong>F. Nacimiento:</strong> {paciente?.fechaNacimiento || '-'}</div>
                         <div className="col-md-2"><strong>Sexo:</strong> {paciente?.sexo || '-'}</div>
                         <div className="col-md-2"><strong>Sangre:</strong> {paciente?.tipoSangre || '-'}</div>
                         <div className="col-md-3 mt-1"><strong>Etnia:</strong> {paciente?.grupoEtnico || '-'}</div>
                         <div className="col-md-3 mt-1"><strong>Ubicación:</strong> {paciente?.provincia}, {paciente?.canton}</div>
                         <div className="col-md-3 mt-1"><strong>F. Atención:</strong> {new Date().toLocaleDateString()}</div>
                     </div>
                 </div>
             </div>
         </div>
      </div>

      {/* 2. TABS DINÁMICOS (3 u 8) */}
      <div className="px-4 pt-2 flex-shrink-0 bg-light border-bottom">
        <ul className="nav nav-tabs border-bottom-0">
            {tabsVisibles.map(tab => (
                <li className="nav-item" key={tab.id}>
                    <button 
                        className={`nav-link ${activeTab === tab.id ? 'active fw-bold bg-white border-bottom-0 text-primary' : 'text-muted'}`} 
                        onClick={() => setActiveTab(tab.id)}
                        style={{fontSize: '0.9rem'}}
                    >
                        {tab.label}
                    </button>
                </li>
            ))}
        </ul>
      </div>

      {/* 3. CONTENIDO DEL FORMULARIO (SCROLLABLE) */}
      <div className="flex-grow-1 p-4 overflow-auto" style={{ backgroundColor: 'white' }}>
         <div style={{ maxWidth: '100%', margin: '0 auto' }}>
            
            {/* 3. ANAMNESIS */}
            {activeTab === "anamnesis" && (
                <>
                   <div className="alert alert-info py-2 small mb-3"><i className="bi bi-info-circle me-2"></i> Anamnesis y Motivo de Consulta</div>
                   <div className="mb-3"><label className="fw-bold">A. Motivo de Consulta</label><textarea className="form-control" rows={2} value={motivoConsulta} onChange={e=>setMotivoConsulta(e.target.value)}/></div>
                   <div className="mb-3"><label className="fw-bold">B. Enfermedad Actual</label><textarea className="form-control" rows={10} value={enfermedadActual} onChange={e=>setEnfermedadActual(e.target.value)}/></div>
                </>
            )}

            {/* 4. PERINATALES */}
            {activeTab === "antecedentesPerinatales" && modoCompleto && (
               <div className="row g-3">
                   <div className="col-12 text-end border-bottom pb-2 mb-2 d-flex justify-content-between">
                       <h6 className="text-primary m-0">Antecedentes Perinatales</h6>
                       <div className="form-check">
                           <input className="form-check-input" type="checkbox" id="chkDesconoce" checked={desconocePerinatales} onChange={(e) => setDesconocePerinatales(e.target.checked)}/>
                           <label className="form-check-label small text-danger fw-bold" htmlFor="chkDesconoce">Desconoce / No Recuerda</label>
                       </div>
                   </div>
                   <div className="col-md-3"><label className="small">Producto Gestación</label><select className="form-select" value={productoGestacion} onChange={e=>setProductoGestacion(e.target.value)} disabled={desconocePerinatales}><option value="">Seleccione</option><option>Única</option><option>Gemelar</option><option>Múltiple</option></select></div>
                   <div className="col-md-3"><label className="small">Edad Gestacional (sem)</label><input type="number" className="form-control" value={edadGestacional} onChange={e=>setEdadGestacional(Number(e.target.value))} disabled={desconocePerinatales}/></div>
                   <div className="col-md-3"><label className="small">Vía Parto</label><select className="form-select" value={viaParto} onChange={e=>setViaParto(e.target.value)} disabled={desconocePerinatales}><option value="">Seleccione</option><option>Vaginal</option><option>Cesárea</option></select></div>
                   <div className="col-md-3"><label className="small">Peso Nacer (g)</label><input type="number" className="form-control" value={pesoNacimiento} onChange={e=>setPesoNacimiento(Number(e.target.value))} disabled={desconocePerinatales}/></div>
                   <div className="col-md-3"><label className="small">Talla Nacer (cm)</label><input type="number" className="form-control" value={tallaNacimiento} onChange={e=>setTallaNacimiento(Number(e.target.value))} disabled={desconocePerinatales}/></div>
                   <div className="col-md-3"><label className="small">Apgar 1'</label><input type="number" className="form-control" value={apgarMin} onChange={e=>setApgarMin(Number(e.target.value))} disabled={desconocePerinatales}/></div>
                   <div className="col-md-3"><label className="small">Apgar 5'</label><input type="number" className="form-control" value={apgar5} onChange={e=>setApgar5(Number(e.target.value))} disabled={desconocePerinatales}/></div>
                   <div className="col-md-12"><label className="small">Complicaciones Perinatales</label><input className="form-control" placeholder="SDR, Ictericia, Sepsis..." value={complicacionesPerinatales} onChange={e=>setComplicacionesPerinatales(e.target.value)} disabled={desconocePerinatales}/></div>
               </div>
            )}

            {/* B. INMUNIZACIONES */}
            {activeTab === "inmunizaciones" && modoCompleto && (
               <div className="mb-3">
                   <h6 className="text-primary border-bottom pb-2">Antecedentes de Inmunizaciones</h6>
                   <label className="form-label fw-bold">Estado de Vacunación</label>
                   <select className="form-select" value={estadoVacunacion} onChange={e => setEstadoVacunacion(e.target.value)}><option value="">Seleccione...</option><option>Completo para la edad</option><option>Incompleto</option><option>No vacunado</option></select>
               </div>
            )}

            {/* C. PERSONALES */}
            {activeTab === "antecedentesPersonales" && modoCompleto && (
                <>
                   <h6 className="fw-bold text-primary mb-3 border-bottom pb-2">Antecedentes Patológicos Personales</h6>
                   <label className="fw-bold small mb-2">Enfermedades Crónicas</label>
                   <div className="d-flex gap-3 flex-wrap mb-4">{Object.keys(enfermedadesCronicas).map(k=>(<div className="form-check" key={k}><input type="checkbox" className="form-check-input" checked={enfermedadesCronicas[k]} onChange={()=>setEnfermedadesCronicas({...enfermedadesCronicas, [k]: !enfermedadesCronicas[k]})}/><label className="form-check-label small">{k}</label></div>))}</div>
                   <div className="mb-3"><label className="fw-bold small">Alergias (Detalle)</label><input className="form-control" value={alergiasDetalle} onChange={e=>setAlergiasDetalle(e.target.value)} placeholder="Medicamentos o alimentos..." /></div>
                   <div className="card p-3 bg-light mb-3"><div className="form-check fw-bold"><input type="checkbox" className="form-check-input" checked={cirugias.si} onChange={()=>setCirugias({...cirugias, si: !cirugias.si})}/> Cirugías Previas</div>{cirugias.si && <input className="form-control mt-2" placeholder="Tipo y Fecha" value={cirugias.tipo} onChange={e=>setCirugias({...cirugias, tipo: e.target.value})}/>}</div>
                   <div className="card p-3 bg-light mb-3"><div className="form-check fw-bold"><input type="checkbox" className="form-check-input" checked={hospitalizaciones.si} onChange={()=>setHospitalizaciones({...hospitalizaciones, si: !hospitalizaciones.si})}/> Hospitalizaciones Previas</div>{hospitalizaciones.si && <input className="form-control mt-2" placeholder="Causa y Fecha" value={hospitalizaciones.causa} onChange={e=>setHospitalizaciones({...hospitalizaciones, causa: e.target.value})}/>}</div>
                </>
            )}

            {/* D. FAMILIARES */}
            {activeTab === "antecedentesFamiliares" && modoCompleto && (
               <>
                   <h6 className="fw-bold text-primary mb-3 border-bottom pb-2">Antecedentes Familiares</h6>
                   <div className="d-flex flex-column gap-2">{Object.keys(enfermedadesFamiliares).map(k=>(<div className="form-check" key={k}><input type="checkbox" className="form-check-input" checked={enfermedadesFamiliares[k]} onChange={()=>setEnfermedadesFamiliares({...enfermedadesFamiliares, [k]: !enfermedadesFamiliares[k]})}/><label className="form-check-label">{k}</label></div>))}</div>
               </>
            )}

            {/* 5. DESARROLLO */}
            {activeTab === "desarrollo" && modoCompleto && (
               <div className="row g-3">
                   <div className="col-12 text-end border-bottom pb-2 mb-2 d-flex justify-content-between">
                        <h6 className="fw-bold text-primary m-0">Desarrollo Psicomotor</h6>
                        <div className="form-check">
                           <input className="form-check-input" type="checkbox" id="chkDesconoceDes" checked={desconoceDesarrollo} onChange={(e) => setDesconoceDesarrollo(e.target.checked)}/>
                           <label className="form-check-label small text-danger fw-bold" htmlFor="chkDesconoceDes">Desconoce / No Recuerda</label>
                       </div>
                   </div>
                   <div className="col-md-3"><label>Sostén Cefálico (meses)</label><input type="number" className="form-control" value={desarrollo.sostenCefalico} onChange={e=>setDesarrollo({...desarrollo, sostenCefalico:e.target.value})} disabled={desconoceDesarrollo}/></div>
                   <div className="col-md-3"><label>Sedestación (meses)</label><input type="number" className="form-control" value={desarrollo.sedestacion} onChange={e=>setDesarrollo({...desarrollo, sedestacion:e.target.value})} disabled={desconoceDesarrollo}/></div>
                   <div className="col-md-3"><label>Deambulación (meses)</label><input type="number" className="form-control" value={desarrollo.deambulacion} onChange={e=>setDesarrollo({...desarrollo, deambulacion:e.target.value})} disabled={desconoceDesarrollo}/></div>
                   <div className="col-md-3"><label>Lenguaje (meses)</label><input type="number" className="form-control" value={desarrollo.lenguaje} onChange={e=>setDesarrollo({...desarrollo, lenguaje:e.target.value})} disabled={desconoceDesarrollo}/></div>
                   <div className="col-md-12 mt-3"><label className="fw-bold">Alimentación</label><select className="form-select" value={alimentacion} onChange={e=>setAlimentacion(e.target.value)} disabled={desconoceDesarrollo}><option value="">Seleccione...</option><option>Lactancia Materna Exclusiva</option><option>Fórmula</option><option>Ablactación iniciada</option></select></div>
               </div>
            )}

            {/* 6. EXAMEN FÍSICO */}
            {activeTab === "examenFisico" && (
                <>
                   {/* A. Signos Vitales */}
                   <div className="card bg-light mb-4 border-0">
                       <div className="card-body p-3">
                           <h6 className="text-primary mb-3 small fw-bold text-uppercase">A. Signos Vitales y Antropometría</h6>
                           <div className="row g-2 text-center">
                               <div className="col"><label className="small d-block">Peso (kg)</label><input className="form-control form-control-sm text-center" value={signosVitales.peso} onChange={e=>setSignosVitales({...signosVitales, peso:e.target.value})}/></div>
                               <div className="col"><label className="small d-block">Talla (cm)</label><input className="form-control form-control-sm text-center" value={signosVitales.talla} onChange={e=>setSignosVitales({...signosVitales, talla:e.target.value})}/></div>
                               <div className="col"><label className="small d-block">P. Cefálico (cm)</label><input className="form-control form-control-sm text-center" value={signosVitales.perimetroCefalico} onChange={e=>setSignosVitales({...signosVitales, perimetroCefalico:e.target.value})}/></div>
                               <div className="col"><label className="small d-block">Temp (°C)</label><input className="form-control form-control-sm text-center" value={signosVitales.temperatura} onChange={e=>setSignosVitales({...signosVitales, temperatura:e.target.value})}/></div>
                               <div className="col"><label className="small d-block">FC (lpm)</label><input className="form-control form-control-sm text-center" value={signosVitales.fc} onChange={e=>setSignosVitales({...signosVitales, fc:e.target.value})}/></div>
                               <div className="col"><label className="small d-block">FR (rpm)</label><input className="form-control form-control-sm text-center" value={signosVitales.fr} onChange={e=>setSignosVitales({...signosVitales, fr:e.target.value})}/></div>
                               <div className="col"><label className="small d-block">SpO2 (%)</label><input className="form-control form-control-sm text-center" value={signosVitales.spo2} onChange={e=>setSignosVitales({...signosVitales, spo2:e.target.value})}/></div>
                           </div>
                       </div>
                   </div>

                   {/* B. Segmentario */}
                   <h6 className="text-primary mb-3 border-bottom pb-2">B. Examen Físico Segmentario</h6>
                   <div className="row g-3">
                       <div className="col-md-6"><label className="fw-bold small">Aspecto General</label><textarea className="form-control" rows={2} placeholder="Consciente, hidratado..." value={aspectoGeneral} onChange={e=>setAspectoGeneral(e.target.value)}/></div>
                       <div className="col-md-6"><label className="fw-bold small">Piel y Faneras</label><textarea className="form-control" rows={2} placeholder="Sin lesiones..." value={pielFaneras} onChange={e=>setPielFaneras(e.target.value)}/></div>
                       <div className="col-md-6"><label className="fw-bold small">Cabeza y Cuello</label><textarea className="form-control" rows={2} placeholder="Fontanelas..." value={cabezaCuello} onChange={e=>setCabezaCuello(e.target.value)}/></div>
                       <div className="col-md-6"><label className="fw-bold small">Cardiopulmonar</label><textarea className="form-control" rows={2} value={cardiopulmonar} onChange={e=>setCardiopulmonar(e.target.value)}/></div>
                       <div className="col-md-6"><label className="fw-bold small">Abdomen</label><textarea className="form-control" rows={2} value={abdomen} onChange={e=>setAbdomen(e.target.value)}/></div>
                       <div className="col-md-6"><label className="fw-bold small">Neurológico</label><textarea className="form-control" rows={2} value={neurologico} onChange={e=>setNeurologico(e.target.value)}/></div>
                       <div className="col-12 mt-2"><label className="fw-bold text-success">Evolución Clínica</label><textarea className="form-control border-success" rows={3} value={evolucionClinica} onChange={e=>setEvolucionClinica(e.target.value)}/></div>
                   </div>
                </>
            )}

            {/* 7. DIAGNÓSTICO Y PLAN */}
            {activeTab === "diagnostico" && (
               <>
                   {/* A. Diagnósticos */}
                   <div className="mb-4 p-3 bg-light rounded border">
                       <label className="fw-bold text-primary mb-2">A. Diagnósticos (CIE-10)</label>
                       {listaDiagnosticos.map((diag) => (
                           <div key={diag.id} className="row g-2 mb-2">
                               <div className="col-md-2"><input className="form-control form-control-sm" placeholder="Código" value={diag.cie10} onChange={e => actualizarDiagnostico(diag.id, 'cie10', e.target.value)} /></div>
                               <div className="col-md-8"><input className="form-control form-control-sm" placeholder="Descripción" value={diag.descripcion} onChange={e => actualizarDiagnostico(diag.id, 'descripcion', e.target.value)} /></div>
                               <div className="col-md-1"><button className="btn btn-outline-danger btn-sm w-100" onClick={() => eliminarDiagnostico(diag.id)}>X</button></div>
                           </div>
                       ))}
                       <button className="btn btn-sm btn-outline-primary mt-2" onClick={agregarFilaDiagnostico}>+ Agregar</button>
                   </div>

                   <div className="mb-3"><label className="fw-bold">Impresión Diagnóstica (Justificación)</label><textarea className="form-control" rows={3} value={impresionDiagnostica} onChange={e => setImpresionDiagnostica(e.target.value)}></textarea></div>

                   <div className="row g-3">
                       <div className="col-12"><h6 className="text-primary border-bottom pb-2 mt-2">B. Estudios y Laboratorios</h6></div>
                       <div className="col-md-12"><label className="fw-bold small">Solicitados</label><textarea className="form-control" rows={2} value={estudiosSolicitados} onChange={e => setEstudiosSolicitados(e.target.value)} /></div>
                       
                       <div className="col-12"><h6 className="text-primary border-bottom pb-2 mt-2">C. Plan de Tratamiento</h6></div>
                       <div className="col-md-6"><label className="fw-bold small">Farmacológico / No Farmacológico</label><textarea className="form-control" rows={4} value={planManejo} onChange={e => setPlanManejo(e.target.value)} /></div>
                       <div className="col-md-6"><label className="fw-bold small">Próxima Cita / Pronóstico</label><input className="form-control" value={pronostico} onChange={e => setPronostico(e.target.value)} /></div>
                   </div>
               </>
            )}
         </div>
      </div>

      {/* 4. FOOTER (HISTORIAL) */}
      <div className="bg-white border-top shadow-sm p-4 d-flex flex-column flex-shrink-0" style={{ height: '280px' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-success fw-bold m-0"><i className="bi bi-clock-history me-2"></i>HISTORIAL PREVIO</h6>
                <button className="btn btn-success fw-bold btn-sm" onClick={handleNuevaConsulta}>+ NUEVA CONSULTA</button>
            </div>
            <div className="flex-grow-1 overflow-auto">
                <div className="row g-3">
                    {consultasPasadas.slice().reverse().map((hist: any, i: number) => (
                        <div key={i} className="col-md-4 col-lg-3">
                            <div className={`p-3 rounded border h-100 bg-white shadow-sm ${idEdicion === hist.id ? 'border-warning bg-warning bg-opacity-10' : ''}`}>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="fw-bold small">{hist.fecha}</span>
                                    <button className="btn btn-sm btn-link p-0 small" onClick={() => {
                                        navigate('.', { state: { consultaAEditar: hist } });
                                        window.location.reload();
                                    }}>Editar</button>
                                </div>
                                <strong className="d-block text-primary small text-truncate">{hist.motivo}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
      </div>
    </div>
  );
}