import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { obtenerPacientes, agregarConsulta, actualizarConsultaExistente } from "../../services/pacienteStorage";
import ReporteMedico from "../../components/layout/ReporteMedico";

interface DiagnosticoItem {
  id: string; cie10: string; descripcion: string; tipo: 'Presuntivo' | 'Definitivo';
}

// Interfaces para Antecedentes
interface ComplicacionExtra { id: string; cie10: string; descripcion: string; fecha: string; }
interface EventoMedico { id: string; descripcion: string; fecha: string; } 

interface Apgar {
  apariencia: number; pulso: number; reflejos: number; tonoMuscular: number; respiracion: number;
}

const calcularApgar = (a: Apgar) => a.apariencia + a.pulso + a.reflejos + a.tonoMuscular + a.respiracion;

const validarFechaNoFutura = (fecha: string) => {
    const hoy = new Date().toISOString().split('T')[0];
    return fecha <= hoy;
};

const calcularIMC = (peso: number, tallaCm: number) => {
    if (!peso || !tallaCm || tallaCm <= 0) return { valor: "", categoria: "", color: "" };
    const tallaM = tallaCm / 100;
    const imc = peso / (tallaM * tallaM);
    const imcFixed = imc.toFixed(2);
    let categoria = ""; let color = "";
    if (imc < 18.5) { categoria = "Bajo Peso"; color = "text-danger fw-bold"; }
    else if (imc >= 18.5 && imc < 24.9) { categoria = "Peso Saludable"; color = "text-success fw-bold"; }
    else if (imc >= 25 && imc < 29.9) { categoria = "Sobrepeso"; color = "text-warning fw-bold"; }
    else { categoria = "Obesidad"; color = "text-danger fw-bold"; }
    return { valor: imcFixed, categoria, color };
};

const calcularZScore = (tipo: 'PesoEdad' | 'PesoTalla', peso: number, talla: number) => {
    if (!peso || (tipo === 'PesoTalla' && !talla)) return { valor: "", color: "" };
    let media = tipo === 'PesoEdad' ? 10 : (talla - 50) * 0.3 + 3; 
    let sd = tipo === 'PesoEdad' ? 1.5 : 1.2;
    const z = (peso - media) / sd;
    const color = (z < -2 || z > 2) ? "text-danger" : "text-success"; 
    return { valor: (z > 0 ? "+" : "") + z.toFixed(2) + " SD", color };
};

export default function HistorialConsultas() {
  const { cedula } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // DATOS GENERALES
  const [paciente, setPaciente] = useState<any>(null);
  const [idEdicion, setIdEdicion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("anamnesis");
  const [modoCompleto, setModoCompleto] = useState(true);
  
  // ESTADO PARA EL NOMBRE DEL DOCTOR
  const [nombreDoctor, setNombreDoctor] = useState("Cargando...");
  
  // === NUEVO ESTADO PARA EL REPORTE ===
  const [mostrarReporte, setMostrarReporte] = useState(false);

  useEffect(() => {
    const sesionGuardada = localStorage.getItem("usuarioLogueado");
    if (sesionGuardada) {
      const datos = JSON.parse(sesionGuardada);
      setNombreDoctor(datos.nombre || "Dr. Desconocido"); 
    } else {
      setNombreDoctor("Dr. Invitado");
    }
  }, []);

  // 3. ANAMNESIS
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [enfermedadActual, setEnfermedadActual] = useState("");

  // 4. PERINATALES
  const [productoGestacion, setProductoGestacion] = useState("");
  const [edadGestacional, setEdadGestacional] = useState<number | "">("");
  const [viaParto, setViaParto] = useState("");
  const [pesoNacimiento, setPesoNacimiento] = useState<number | "">("");
  const [tallaNacimiento, setTallaNacimiento] = useState<number | "">("");
  const [apgar, setApgar] = useState<Apgar>({ apariencia: 0, pulso: 0, reflejos: 0, tonoMuscular: 0, respiracion: 0 });
  const totalApgar = calcularApgar(apgar);
  
  const [checksComplicaciones, setChecksComplicaciones] = useState({ sdr: false, ictericia: false, sepsis: false });
  const [listaComplicacionesExtra, setListaComplicacionesExtra] = useState<ComplicacionExtra[]>([]);
  const [descripcionComplicaciones, setDescripcionComplicaciones] = useState("");
  const [mostrarTablaMas, setMostrarTablaMas] = useState(false);

  const agregarFilaComplicacion = () => { setListaComplicacionesExtra([...listaComplicacionesExtra, { id: uuidv4(), cie10: '', descripcion: '', fecha: '' }]); setMostrarTablaMas(true); };
  const eliminarFilaComplicacion = (id: string) => setListaComplicacionesExtra(listaComplicacionesExtra.filter(c => c.id !== id));
  const actualizarFilaComplicacion = (id: string, campo: keyof ComplicacionExtra, valor: string) => {
      if (campo === 'fecha' && !validarFechaNoFutura(valor)) { alert("Fecha futura no permitida"); return; }
      setListaComplicacionesExtra(listaComplicacionesExtra.map(c => c.id === id ? { ...c, [campo]: valor } : c));
  };

  // B. INMUNIZACIONES
  const [estadoVacunacion, setEstadoVacunacion] = useState("");

  // C. PERSONALES
  const [enfermedadesCronicas, setEnfermedadesCronicas] = useState<Record<string, boolean>>({ "Asma": false, "Diabetes": false, "Cardiopatías": false, "Epilepsia": false });
  const [listaCronicasExtra, setListaCronicasExtra] = useState<ComplicacionExtra[]>([]);
  const [mostrarTablaCronicas, setMostrarTablaCronicas] = useState(false);
  const [descripcionCronicas, setDescripcionCronicas] = useState("");

  const agregarCronicaExtra = () => { setListaCronicasExtra([...listaCronicasExtra, { id: uuidv4(), cie10: '', descripcion: '', fecha: '' }]); setMostrarTablaCronicas(true); };
  const eliminarCronicaExtra = (id: string) => setListaCronicasExtra(listaCronicasExtra.filter(c => c.id !== id));
  const actualizarCronicaExtra = (id: string, campo: keyof ComplicacionExtra, valor: string) => {
      if (campo === 'fecha' && !validarFechaNoFutura(valor)) { alert("Fecha futura no permitida"); return; }
      setListaCronicasExtra(listaCronicasExtra.map(c => c.id === id ? { ...c, [campo]: valor } : c));
  };

  const [listaCirugias, setListaCirugias] = useState<EventoMedico[]>([]);
  const [listaHospitalizaciones, setListaHospitalizaciones] = useState<EventoMedico[]>([]);
  const [listaAlergias, setListaAlergias] = useState<EventoMedico[]>([]);

  const agregarCirugia = () => setListaCirugias([...listaCirugias, { id: uuidv4(), descripcion: '', fecha: '' }]);
  const eliminarCirugia = (id: string) => setListaCirugias(listaCirugias.filter(c => c.id !== id));
  const actualizarCirugia = (id: string, campo: keyof EventoMedico, valor: string) => { if (campo === 'fecha' && !validarFechaNoFutura(valor)) { alert("Fecha futura no permitida"); return; } setListaCirugias(listaCirugias.map(c => c.id === id ? { ...c, [campo]: valor } : c)); };

  const agregarHospitalizacion = () => setListaHospitalizaciones([...listaHospitalizaciones, { id: uuidv4(), descripcion: '', fecha: '' }]);
  const eliminarHospitalizacion = (id: string) => setListaHospitalizaciones(listaHospitalizaciones.filter(h => h.id !== id));
  const actualizarHospitalizacion = (id: string, campo: keyof EventoMedico, valor: string) => { if (campo === 'fecha' && !validarFechaNoFutura(valor)) { alert("Fecha futura no permitida"); return; } setListaHospitalizaciones(listaHospitalizaciones.map(h => h.id === id ? { ...h, [campo]: valor } : h)); };

  const agregarAlergia = () => setListaAlergias([...listaAlergias, { id: uuidv4(), descripcion: '', fecha: '' }]);
  const eliminarAlergia = (id: string) => setListaAlergias(listaAlergias.filter(a => a.id !== id));
  const actualizarAlergia = (id: string, campo: keyof EventoMedico, valor: string) => { if (campo === 'fecha' && valor && !validarFechaNoFutura(valor)) { alert("Fecha futura no permitida"); return; } setListaAlergias(listaAlergias.map(a => a.id === id ? { ...a, [campo]: valor } : a)); };

  // D. FAMILIARES
  const [enfermedadesFamiliares, setEnfermedadesFamiliares] = useState<Record<string, boolean>>({ "HTA": false, "Diabetes": false, "Cáncer": false, "Enfermedades Genéticas": false });
  const [listaFamiliaresExtra, setListaFamiliaresExtra] = useState<ComplicacionExtra[]>([]);
  const [mostrarTablaFamiliares, setMostrarTablaFamiliares] = useState(false);
  const [descripcionFamiliares, setDescripcionFamiliares] = useState("");

  const agregarFamiliarExtra = () => { setListaFamiliaresExtra([...listaFamiliaresExtra, { id: uuidv4(), cie10: '', descripcion: '', fecha: '' }]); setMostrarTablaFamiliares(true); };
  const eliminarFamiliarExtra = (id: string) => setListaFamiliaresExtra(listaFamiliaresExtra.filter(c => c.id !== id));
  const actualizarFamiliarExtra = (id: string, campo: keyof ComplicacionExtra, valor: string) => { if (campo === 'fecha' && !validarFechaNoFutura(valor)) { alert("Fecha futura no permitida"); return; } setListaFamiliaresExtra(listaFamiliaresExtra.map(c => c.id === id ? { ...c, [campo]: valor } : c)); };

  // 5. DESARROLLO
  const [desconoceDesarrollo, setDesconoceDesarrollo] = useState(false);
  const [desarrollo, setDesarrollo] = useState({ sostenCefalico: "", sedestacion: "", deambulacion: "", lenguaje: "" });
  const [alimentacion, setAlimentacion] = useState({ lactancia: { checked: false, duracion: "" }, formula: { checked: false, tipo: "" }, ablactacion: { checked: false, edadInicio: "" } });

  // 6. EXAMEN FÍSICO
  const [signosVitales, setSignosVitales] = useState({ peso: "", talla: "", perimetroCefalico: "", temperatura: "", fc: "", fr: "", spo2: "", paSistolica: "", paDiastolica: "" });
  const [esMenor3Anios, setEsMenor3Anios] = useState(false);
  const [resultadoIMC, setResultadoIMC] = useState({ valor: "", categoria: "", color: "" });
  const [zScorePesoEdad, setZScorePesoEdad] = useState({ valor: "", color: "" });
  const [zScorePesoTalla, setZScorePesoTalla] = useState({ valor: "", color: "" });

  const [aspectoGeneralTexto, setAspectoGeneralTexto] = useState("");
  const [aspectoGeneralChecks, setAspectoGeneralChecks] = useState({ consciente: false, alerta: false, activo: false, decaido: false, otros: false });
  const [aspectoGeneralOtros, setAspectoGeneralOtros] = useState("");
  const [pielChecks, setPielChecks] = useState({ ictericia: false, cianosis: false, rash: false, otros: false });
  const [pielOtros, setPielOtros] = useState("");
  const [cabezaChecks, setCabezaChecks] = useState({ fontanela: false, adenopatias: false, otros: false });
  const [cabezaOtros, setCabezaOtros] = useState("");
  const [cardioChecks, setCardioChecks] = useState({ ruidos: false, murmullos: false, soplos: false, crepitantes: false });
  const [abdomenChecks, setAbdomenChecks] = useState({ blando: false, depresible: false, dolor: false, hepatomegalia: false, esplenomegalia: false });
  const [neuroChecks, setNeuroChecks] = useState({ reflejos: false, estadoMental: false, tono: false });
  const [evolucionClinica, setEvolucionClinica] = useState("");

  useEffect(() => {
      const peso = parseFloat(signosVitales.peso);
      const talla = parseFloat(signosVitales.talla);
      if (peso && talla) {
          setResultadoIMC(calcularIMC(peso, talla));
          setZScorePesoEdad(calcularZScore('PesoEdad', peso, talla));
          setZScorePesoTalla(calcularZScore('PesoTalla', peso, talla));
      } else {
          setResultadoIMC({ valor: "", categoria: "", color: "" });
          setZScorePesoEdad({ valor: "", color: "" });
          setZScorePesoTalla({ valor: "", color: "" });
      }
  }, [signosVitales.peso, signosVitales.talla]);

  // 7. DIAGNÓSTICO
  const [diagnosticoPrincipal, setDiagnosticoPrincipal] = useState<DiagnosticoItem>({ id: uuidv4(), cie10: '', descripcion: '', tipo: 'Presuntivo' });
  const [listaDiagnosticosSecundarios, setListaDiagnosticosSecundarios] = useState<DiagnosticoItem[]>([]);

  const agregarSecundario = () => setListaDiagnosticosSecundarios([...listaDiagnosticosSecundarios, { id: uuidv4(), cie10: '', descripcion: '', tipo: 'Presuntivo' }]);
  const eliminarSecundario = (id: string) => setListaDiagnosticosSecundarios(listaDiagnosticosSecundarios.filter(d => d.id !== id));
  const actualizarSecundario = (id: string, campo: keyof DiagnosticoItem, valor: string) => setListaDiagnosticosSecundarios(listaDiagnosticosSecundarios.map(d => d.id === id ? { ...d, [campo]: valor } : d));

  const [impresionDiagnostica, setImpresionDiagnostica] = useState("");
  const [estudiosSolicitados, setEstudiosSolicitados] = useState("");
  const [resultadosRelevantes, setResultadosRelevantes] = useState("");

  const [farmacologicoChecks, setFarmacologicoChecks] = useState({ venosa: false, oral: false, oxigeno: false, nebulizacion: false, intramuscular: false, topico: false, otros: false });
  const [farmacologicoOtros, setFarmacologicoOtros] = useState("");
  
  const [noFarmacologicoChecks, setNoFarmacologicoChecks] = useState({ hidratacion: false, dieta: false, fisioterapia: false, reposo: false, controlTermico: false, educacion: false, otros: false });
  const [noFarmacologicoOtros, setNoFarmacologicoOtros] = useState("");

  const [planManejo, setPlanManejo] = useState(""); 
  const [pronostico, setPronostico] = useState(""); 
  const [proximaCita, setProximaCita] = useState(""); 
  
  // ==================== NUEVO: ESTADO PARA ERROR DE FECHA ====================
  const [errorProximaCita, setErrorProximaCita] = useState("");

  // ==================== NUEVO: HANDLER DE VALIDACIÓN DE FECHA ====================
  const handleProximaCitaChange = (e: any) => {
      const fecha = e.target.value;
      const hoy = new Date().toISOString().split('T')[0];
      
      setProximaCita(fecha);

      if (fecha && fecha < hoy) {
          setErrorProximaCita("Fecha incorrecta: Seleccione una fecha actual o futura.");
      } else {
          setErrorProximaCita("");
      }
  };

  // ================= CARGAR DATOS =================
  useEffect(() => {
    const lista = obtenerPacientes();
    const encontrado = lista.find((p: any) => p.cedula == cedula);
    if (encontrado) {
        setPaciente(encontrado);
        setModoCompleto(!encontrado.historiaClinica || encontrado.historiaClinica.length === 0);
    }

    if (location.state && location.state.consultaAEditar) {
        const c = location.state.consultaAEditar;
        setIdEdicion(c.id); 
        setModoCompleto(true); 
        
        setMotivoConsulta(c.motivo || "");
        setEnfermedadActual(c.enfermedadActual || "");
        
        if (c.antecedentes) {
            const per = c.antecedentes.perinatales || {};
            setProductoGestacion(per.productoGestacion || "");
            setEdadGestacional(per.edadGestacional || "");
            setViaParto(per.viaParto || "");
            setPesoNacimiento(per.pesoNacimiento || "");
            setTallaNacimiento(per.tallaNacimiento || "");
            if (per.apgarDetallado) setApgar(per.apgarDetallado);
            if (per.complicacionesData) {
                setChecksComplicaciones(per.complicacionesData.checks || { sdr: false, ictericia: false, sepsis: false });
                setListaComplicacionesExtra(per.complicacionesData.extras || []);
                setDescripcionComplicaciones(per.complicacionesData.descripcion || "");
                if(per.complicacionesData.extras?.length > 0) setMostrarTablaMas(true);
            }
            setEstadoVacunacion(c.antecedentes.vacunacion || "");
            if(c.antecedentes.cronicasData) {
                 setEnfermedadesCronicas(c.antecedentes.cronicasData.checks);
                 setListaCronicasExtra(c.antecedentes.cronicasData.extras || []);
                 setDescripcionCronicas(c.antecedentes.cronicasData.descripcion || "");
                 if(c.antecedentes.cronicasData.extras?.length > 0) setMostrarTablaCronicas(true);
            } else if(c.antecedentes.cronicas) setEnfermedadesCronicas(c.antecedentes.cronicas);
            
            if (Array.isArray(c.antecedentes.listaAlergias)) setListaAlergias(c.antecedentes.listaAlergias);
            if (Array.isArray(c.antecedentes.listaHospitalizaciones)) setListaHospitalizaciones(c.antecedentes.listaHospitalizaciones);
            if (Array.isArray(c.antecedentes.listaCirugias)) setListaCirugias(c.antecedentes.listaCirugias);

            if(c.antecedentes.familiaresData) {
                setEnfermedadesFamiliares(c.antecedentes.familiaresData.checks);
                setListaFamiliaresExtra(c.antecedentes.familiaresData.extras || []);
                setDescripcionFamiliares(c.antecedentes.familiaresData.descripcion || "");
                if(c.antecedentes.familiaresData.extras?.length > 0) setMostrarTablaFamiliares(true);
            } else if(c.antecedentes.familiares) setEnfermedadesFamiliares(c.antecedentes.familiares);

            const des = c.antecedentes.desarrollo || {};
            setDesconoceDesarrollo(des.desconoce || false);
            setDesarrollo(des.hitos || { sostenCefalico: "", sedestacion: "", deambulacion: "", lenguaje: "" });
            if(des.alimentacionDetallada) setAlimentacion(des.alimentacionDetallada);
        }

        if (c.examenFisico) {
            setSignosVitales(c.examenFisico.vitales || {});
            if(c.examenFisico.vitales?.perimetroCefalico) setEsMenor3Anios(true);
            setEvolucionClinica(c.examenFisico.evolucion || "");
            const seg = c.examenFisico.segmentario || {};
            setAspectoGeneralTexto(seg.aspectoGeneralTexto || seg.aspectoGeneral || ""); 
            
            if(seg.aspectoGeneralChecks) setAspectoGeneralChecks(seg.aspectoGeneralChecks);
            if(seg.pielChecks) setPielChecks(seg.pielChecks);
            if(seg.cabezaChecks) setCabezaChecks(seg.cabezaChecks);
            if(seg.cardioChecks) setCardioChecks(seg.cardioChecks);
            if(seg.abdomenChecks) setAbdomenChecks(seg.abdomenChecks);
            if(seg.neuroChecks) setNeuroChecks(seg.neuroChecks);
            
            if(seg.aspectoGeneralOtros) setAspectoGeneralOtros(seg.aspectoGeneralOtros);
            if(seg.pielOtros) setPielOtros(seg.pielOtros);
            if(seg.cabezaOtros) setCabezaOtros(seg.cabezaOtros);
        }

        if (c.diagnostico) {
            if (c.diagnostico.principal) setDiagnosticoPrincipal(c.diagnostico.principal);
            if (Array.isArray(c.diagnostico.secundarios)) setListaDiagnosticosSecundarios(c.diagnostico.secundarios);
            
            if (!c.diagnostico.principal && Array.isArray(c.diagnostico.cie10) && c.diagnostico.cie10.length > 0) {
                setDiagnosticoPrincipal(c.diagnostico.cie10[0]);
                setListaDiagnosticosSecundarios(c.diagnostico.cie10.slice(1));
            }

            setImpresionDiagnostica(c.diagnostico.impresion || "");
            setEstudiosSolicitados(c.diagnostico.estudios || "");
            setResultadosRelevantes(c.diagnostico.resultadosRelevantes || ""); 
            
            setPlanManejo(c.diagnostico.plan || "");
            setPronostico(c.diagnostico.pronostico || "");
            setProximaCita(c.diagnostico.proximaCita || ""); 

            if(c.diagnostico.farmacologicoChecks) setFarmacologicoChecks(c.diagnostico.farmacologicoChecks);
            if(c.diagnostico.farmacologicoOtros) setFarmacologicoOtros(c.diagnostico.farmacologicoOtros);
            if(c.diagnostico.noFarmacologicoChecks) setNoFarmacologicoChecks(c.diagnostico.noFarmacologicoChecks);
            if(c.diagnostico.noFarmacologicoOtros) setNoFarmacologicoOtros(c.diagnostico.noFarmacologicoOtros);
        }
    }
  }, [cedula, location.state]);

  const handleGuardarHistoria = () => {
    if (!cedula) return alert("Error de cédula");
    
    // BLOQUEAR GUARDADO SI HAY ERROR EN FECHA
    if (errorProximaCita) return alert("Corrija la fecha de próxima cita antes de guardar.");

    const aspectoStr = `${aspectoGeneralTexto} | ${Object.keys(aspectoGeneralChecks).filter((k:any)=>aspectoGeneralChecks[k as keyof typeof aspectoGeneralChecks]).join(', ')} | ${aspectoGeneralChecks.otros ? aspectoGeneralOtros : ''}`;
    
    const farmaStr = Object.keys(farmacologicoChecks).filter((k:any)=>farmacologicoChecks[k as keyof typeof farmacologicoChecks]).join(', ');
    const noFarmaStr = Object.keys(noFarmacologicoChecks).filter((k:any)=>noFarmacologicoChecks[k as keyof typeof noFarmacologicoChecks]).join(', ');
    const planCompleto = `${planManejo} \n Farma: ${farmaStr} ${farmacologicoChecks.otros?farmacologicoOtros:''} \n No Farma: ${noFarmaStr} ${noFarmacologicoChecks.otros?noFarmacologicoOtros:''}`;

    const datosConsulta = {
      id: idEdicion || uuidv4(),
      fecha: idEdicion ? (location.state?.consultaAEditar?.fecha) : new Date().toISOString().split('T')[0],
      hora: idEdicion ? (location.state?.consultaAEditar?.hora) : new Date().toLocaleTimeString(),
      estado: "Finalizada",
      motivo: motivoConsulta,
      enfermedadActual,
      antecedentes: {
          perinatales: { 
              productoGestacion, edadGestacional, viaParto, pesoNacimiento, tallaNacimiento,
              apgarDetallado: apgar, apgarTotal: totalApgar,
              complicacionesData: { checks: checksComplicaciones, extras: listaComplicacionesExtra, descripcion: descripcionComplicaciones },
              complicaciones: descripcionComplicaciones
          },
          vacunacion: estadoVacunacion,
          cronicasData: { checks: enfermedadesCronicas, extras: listaCronicasExtra, descripcion: descripcionCronicas },
          cronicas: enfermedadesCronicas,
          listaAlergias, alergiasDetalle: listaAlergias.map(a => a.descripcion).join(", "),
          listaHospitalizaciones, listaCirugias,
          familiaresData: { checks: enfermedadesFamiliares, extras: listaFamiliaresExtra, descripcion: descripcionFamiliares },
          familiares: enfermedadesFamiliares,
          desarrollo: { desconoce: desconoceDesarrollo, hitos: desarrollo, alimentacionDetallada: alimentacion, alimentacion: "Ver detalle" }
      },
      examenFisico: {
          vitales: signosVitales,
          calculos: { imc: resultadoIMC, zPesoEdad: zScorePesoEdad, zPesoTalla: zScorePesoTalla },
          segmentario: { 
              aspectoGeneralTexto, aspectoGeneralChecks, aspectoGeneralOtros,
              pielChecks, pielOtros, cabezaChecks, cabezaOtros, cardioChecks, abdomenChecks, neuroChecks,
              aspectoGeneral: aspectoStr 
          },
          evolucion: evolucionClinica
      },
      diagnostico: {
          principal: diagnosticoPrincipal,
          secundarios: listaDiagnosticosSecundarios,
          cie10: [diagnosticoPrincipal, ...listaDiagnosticosSecundarios],
          impresion: impresionDiagnostica, 
          estudios: estudiosSolicitados,
          resultadosRelevantes, 
          
          farmacologicoChecks, farmacologicoOtros,
          noFarmacologicoChecks, noFarmacologicoOtros,
          
          plan: planCompleto, 
          pronostico, 
          proximaCita
      }
    };

    let exito = idEdicion ? actualizarConsultaExistente(cedula, datosConsulta) : agregarConsulta(cedula, datosConsulta);
    if (exito) { alert("Consulta guardada exitosamente."); window.location.reload(); }
    else alert("Error al guardar.");
  };

  const handleNuevaConsulta = () => { if(window.confirm("¿Limpiar formulario?")) navigate(0); };
  const consultasPasadas = paciente?.historiaClinica?.filter((c: any) => c.estado !== 'Agendada') || [];
  const tabsVisibles = modoCompleto 
    ? [ { id: "anamnesis", label: "Anamnesis" }, { id: "antecedentesPerinatales", label: "Perinatales" }, { id: "inmunizaciones", label: "Inmunizaciones" }, { id: "antecedentesPersonales", label: "Ant.Personales" }, { id: "antecedentesFamiliares", label: "Ant.Familiares" }, { id: "desarrollo", label: "Desarrollo" }, { id: "examenFisico", label: "Examen Físico" }, { id: "diagnostico", label: "Diagnóstico" } ]
    : [ { id: "anamnesis", label: "Anamnesis" }, { id: "examenFisico", label: "Examen Físico" }, { id: "diagnostico", label: "Diagnóstico" } ];

  return (
    <div className="d-flex flex-column" style={{ height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
      
      {/* HEADER */}
      <div className="bg-white border-bottom flex-shrink-0">
         <div className="px-4 pt-3 d-flex justify-content-between align-items-center">
             <div>
                <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => navigate(-1)}>← Volver</button>
                <h4 className="fw-bold text-primary m-0">{idEdicion ? "Editando Consulta" : "Nueva Consulta Pediátrica"}</h4>
             </div>
             
             {/* --- ENCABEZADO CON NOMBRE DEL DOCTOR (DINÁMICO) --- */}
             <div className="ms-auto d-flex align-items-center gap-3">
                 <div className="d-flex align-items-center bg-light px-3 py-1 rounded-pill border">
                     <div className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center me-2 fw-bold" style={{width: '30px', height: '30px', fontSize: '0.8rem'}}>
                         {nombreDoctor.replace("Dr. ", "").charAt(0)}
                     </div>
                     <span className="fw-bold text-dark small">{nombreDoctor}</span>
                 </div>
                 
                 {/* === BOTÓN DE REPORTE AGREGADO === */}
                 {idEdicion && paciente && (
                     <button className="btn btn-outline-dark btn-sm fw-bold" onClick={() => setMostrarReporte(true)}>
                        <i className="bi bi-printer-fill me-2"></i> Reporte
                     </button>
                 )}
                 {/* ================================== */}

                 <button className="btn btn-outline-primary btn-sm" onClick={() => setModoCompleto(!modoCompleto)}>{modoCompleto ? "👁 Ocultar Antecedentes" : "👁 Ver Antecedentes Completos"}</button>
                 <button className="btn btn-success fw-bold px-4" onClick={handleGuardarHistoria}><i className="bi bi-save me-2"></i> {idEdicion ? "ACTUALIZAR" : "GUARDAR"}</button>
             </div>
             {/* ------------------------------------------------------- */}
         </div>
         <div className="px-4 pb-3 mt-2">
             <div className="card bg-light border-0 shadow-sm">
                 <div className="card-body py-2 px-3">
                     <div className="row small text-secondary">
                         <div className="col-md-3"><strong>Paciente:</strong> {paciente ? `${paciente.nombres} ${paciente.apellidos}` : '...'}</div>
                         <div className="col-md-2"><strong>Cédula:</strong> {cedula}</div>
                         <div className="col-md-2"><strong>F. Nacimiento:</strong> {paciente?.fechaNacimiento || '-'}</div>
                         <div className="col-md-2"><strong>Sexo:</strong> {paciente?.sexo || '-'}</div>
                     </div>
                 </div>
             </div>
         </div>
      </div>

      {/* TABS */}
      <div className="px-4 pt-2 flex-shrink-0 bg-light border-bottom">
        <ul className="nav nav-tabs border-bottom-0">
            {tabsVisibles.map(tab => (
                <li className="nav-item" key={tab.id}>
                    <button className={`nav-link ${activeTab === tab.id ? 'active fw-bold bg-white border-bottom-0 text-primary' : 'text-muted'}`} onClick={() => setActiveTab(tab.id)} style={{fontSize: '0.9rem'}}>{tab.label}</button>
                </li>
            ))}
        </ul>
      </div>

      {/* CONTENIDO */}
      <div className="flex-grow-1 p-4 overflow-auto" style={{ backgroundColor: 'white' }}>
         <div style={{ maxWidth: '100%', margin: '0 auto' }}>
            
            {activeTab === "anamnesis" && (<><div className="alert alert-info py-2 small mb-3"><i className="bi bi-info-circle me-2"></i> Anamnesis y Motivo de Consulta</div><div className="mb-3"><label className="fw-bold">A. Motivo de Consulta</label><textarea className="form-control" rows={2} value={motivoConsulta} onChange={e=>setMotivoConsulta(e.target.value)}/></div><div className="mb-3"><label className="fw-bold">B. Enfermedad Actual</label><textarea className="form-control" rows={10} value={enfermedadActual} onChange={e=>setEnfermedadActual(e.target.value)}/></div></>)}
            
            {/* OTRAS PESTAÑAS (RESUMIDAS PERO PRESENTES) */}
            {activeTab === "antecedentesPerinatales" && modoCompleto && (<div className="row g-3"><div className="col-12 border-bottom pb-2 mb-2"><h6 className="text-primary m-0">Antecedentes Perinatales</h6></div><div className="col-md-3"><label className="small">Producto Gestación</label><select className="form-select" value={productoGestacion} onChange={e=>setProductoGestacion(e.target.value)}><option value="">Seleccione</option><option>Única</option><option>Gemelar</option><option>Múltiple</option></select></div><div className="col-md-3"><label className="small">Edad Gestacional (sem)</label><input type="number" className="form-control" value={edadGestacional} onChange={e=>setEdadGestacional(Number(e.target.value))} /></div><div className="col-md-3"><label className="small">Vía Parto</label><select className="form-select" value={viaParto} onChange={e=>setViaParto(e.target.value)}><option value="">Seleccione</option><option>Vaginal</option><option>Cesárea</option></select></div><div className="col-md-3"><label className="small">Peso Nacer (g)</label><input type="number" className="form-control" value={pesoNacimiento} onChange={e=>setPesoNacimiento(Number(e.target.value))} /></div><div className="col-md-3"><label className="small">Talla Nacer (cm)</label><input type="number" className="form-control" value={tallaNacimiento} onChange={e=>setTallaNacimiento(Number(e.target.value))} /></div><div className="col-12 mt-3 mb-2"><div className="card bg-light border-0"><div className="card-body py-2"><div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1"><label className="fw-bold text-primary small">Test de Apgar (Calculadora)</label><span className="badge bg-primary fs-6">Total: {totalApgar} / 10</span></div><div className="row g-2"><div className="col-md-2"><label className="small">Apariencia</label><select className="form-select form-select-sm" value={apgar.apariencia} onChange={e => setApgar({...apgar, apariencia: Number(e.target.value)})}> <option value={0}>0 - Azul</option><option value={1}>1 - Acrocianosis</option><option value={2}>2 - Rosado</option> </select></div><div className="col-md-2"><label className="small">Pulso</label><select className="form-select form-select-sm" value={apgar.pulso} onChange={e => setApgar({...apgar, pulso: Number(e.target.value)})}> <option value={0}>0 - Ausente</option><option value={1}>1 - &lt; 100</option><option value={2}>2 - &gt; 100</option> </select></div><div className="col-md-3"><label className="small">Gesto</label><select className="form-select form-select-sm" value={apgar.reflejos} onChange={e => setApgar({...apgar, reflejos: Number(e.target.value)})}> <option value={0}>0 - Sin respuesta</option><option value={1}>1 - Mueca</option><option value={2}>2 - Llanto</option> </select></div><div className="col-md-3"><label className="small">Actividad</label><select className="form-select form-select-sm" value={apgar.tonoMuscular} onChange={e => setApgar({...apgar, tonoMuscular: Number(e.target.value)})}> <option value={0}>0 - Flacidez</option><option value={1}>1 - Flexión</option><option value={2}>2 - Activo</option> </select></div><div className="col-md-2"><label className="small">Respiración</label><select className="form-select form-select-sm" value={apgar.respiracion} onChange={e => setApgar({...apgar, respiracion: Number(e.target.value)})}> <option value={0}>0 - Ausente</option><option value={1}>1 - Irregular</option><option value={2}>2 - Llanto</option> </select></div></div></div></div></div><div className="col-12 mt-3"><label className="fw-bold small mb-2 d-block">Complicaciones</label><div className="d-flex gap-4 mb-3"><div className="form-check"><input className="form-check-input" type="checkbox" id="chkSDR" checked={checksComplicaciones.sdr} onChange={(e) => setChecksComplicaciones({...checksComplicaciones, sdr: e.target.checked})} /><label className="form-check-label" htmlFor="chkSDR">SDR</label></div><div className="form-check"><input className="form-check-input" type="checkbox" id="chkIctericia" checked={checksComplicaciones.ictericia} onChange={(e) => setChecksComplicaciones({...checksComplicaciones, ictericia: e.target.checked})} /><label className="form-check-label" htmlFor="chkIctericia">Ictericia</label></div><div className="form-check"><input className="form-check-input" type="checkbox" id="chkSepsis" checked={checksComplicaciones.sepsis} onChange={(e) => setChecksComplicaciones({...checksComplicaciones, sepsis: e.target.checked})} /><label className="form-check-label" htmlFor="chkSepsis">Sepsis</label></div></div><button className="btn btn-sm btn-outline-secondary mb-3" onClick={() => setMostrarTablaMas(!mostrarTablaMas)}>{mostrarTablaMas ? "- Ocultar" : "+ Más (Tabla)"}</button>{mostrarTablaMas && (<div className="card p-3 bg-light border mb-3"><h6 className="small fw-bold text-secondary">Extras</h6>{listaComplicacionesExtra.map((item) => (<div key={item.id} className="row g-2 mb-2"><div className="col-md-2"><input className="form-control form-control-sm" placeholder="CIE-10" value={item.cie10} onChange={e => actualizarFilaComplicacion(item.id, 'cie10', e.target.value)} /></div><div className="col-md-5"><input className="form-control form-control-sm" placeholder="Desc" value={item.descripcion} onChange={e => actualizarFilaComplicacion(item.id, 'descripcion', e.target.value)} /></div><div className="col-md-3"><input type="date" className="form-control form-control-sm" value={item.fecha} onChange={e => actualizarFilaComplicacion(item.id, 'fecha', e.target.value)} /></div><div className="col-md-2"><button className="btn btn-sm btn-danger w-100" onClick={() => eliminarFilaComplicacion(item.id)}>X</button></div></div>))}<button className="btn btn-sm btn-primary mt-1" onClick={agregarFilaComplicacion}>+ Agregar</button></div>)}<textarea className="form-control" rows={2} placeholder="Descripción..." value={descripcionComplicaciones} onChange={e => setDescripcionComplicaciones(e.target.value)} /></div></div>)}
            {activeTab === "inmunizaciones" && modoCompleto && (<div className="mb-3"><h6 className="text-primary border-bottom pb-2">Inmunizaciones</h6><label>Vacunación</label><select className="form-select" value={estadoVacunacion} onChange={e => setEstadoVacunacion(e.target.value)}><option value="">Seleccione...</option><option>Completo</option><option>Incompleto</option><option>No vacunado</option></select></div>)}
            
            {/* === SECCIÓN PERSONALES MODIFICADA (FECHA ALERGIAS) === */}
            {activeTab === "antecedentesPersonales" && modoCompleto && (<><h6 className="fw-bold text-primary mb-3 border-bottom pb-2">Personales</h6><div className="mb-4"><label className="fw-bold small d-block">Crónicas</label><div className="d-flex gap-3 flex-wrap mb-3">{Object.keys(enfermedadesCronicas).map(k=>(<div className="form-check" key={k}><input type="checkbox" className="form-check-input" checked={enfermedadesCronicas[k]} onChange={()=>setEnfermedadesCronicas({...enfermedadesCronicas, [k]: !enfermedadesCronicas[k]})}/><label className="form-check-label small">{k}</label></div>))}</div><button className="btn btn-sm btn-outline-secondary mb-3" onClick={() => setMostrarTablaCronicas(!mostrarTablaCronicas)}>{mostrarTablaCronicas ? "- Ocultar" : "+ Más (Tabla)"}</button>{mostrarTablaCronicas && (<div className="card p-3 bg-light border mb-3"><h6 className="small fw-bold text-secondary mb-2">Otras Enfermedades Crónicas</h6>{listaCronicasExtra.map((item) => (<div key={item.id} className="row g-2 mb-2 align-items-center"><div className="col-md-2"><input className="form-control form-control-sm" placeholder="CIE-10" value={item.cie10} onChange={e => actualizarCronicaExtra(item.id, 'cie10', e.target.value)} /></div><div className="col-md-5"><input className="form-control form-control-sm" placeholder="Desc" value={item.descripcion} onChange={e => actualizarCronicaExtra(item.id, 'descripcion', e.target.value)} /></div><div className="col-md-3"><input type="date" className="form-control form-control-sm" value={item.fecha} onChange={e => actualizarCronicaExtra(item.id, 'fecha', e.target.value)} /></div><div className="col-md-2"><button className="btn btn-sm btn-danger w-100" onClick={() => eliminarCronicaExtra(item.id)}>X</button></div></div>))}<button className="btn btn-sm btn-primary mt-1" onClick={agregarCronicaExtra}>+ Agregar Fila</button></div>)}<div className="mt-2"><textarea className="form-control" rows={1} placeholder="Observaciones..." value={descripcionCronicas} onChange={e => setDescripcionCronicas(e.target.value)} /></div></div>
            <div className="mb-4 p-3 bg-light rounded border">
                <div className="d-flex align-items-center mb-2 gap-3"><label className="fw-bold text-secondary m-0">Alergias</label><button className="btn btn-sm btn-primary" onClick={agregarAlergia}>+ Agregar</button></div>
                {listaAlergias.map((item) => (
                    <div key={item.id} className="row g-2 mb-2 align-items-center">
                        <div className="col-md-7"><input className="form-control form-control-sm" placeholder="Alergeno / Reacción" value={item.descripcion} onChange={e => actualizarAlergia(item.id, 'descripcion', e.target.value)} /></div>
                        {/* === CAMBIO AQUI: type="date" === */}
                        <div className="col-md-4"><input type="date" className="form-control form-control-sm" value={item.fecha} onChange={e => actualizarAlergia(item.id, 'fecha', e.target.value)} /></div>
                        {/* ================================ */}
                        <div className="col-md-1"><button className="btn btn-sm btn-outline-danger w-100" onClick={() => eliminarAlergia(item.id)}>X</button></div>
                    </div>
                ))}
            </div>
            <div className="mb-4 p-3 bg-light rounded border"><div className="d-flex align-items-center mb-2 gap-3"><label className="fw-bold text-secondary m-0">Cirugías</label><button className="btn btn-sm btn-primary" onClick={agregarCirugia}>+ Agregar</button></div>{listaCirugias.map((item) => (<div key={item.id} className="row g-2 mb-2 align-items-center"><div className="col-md-7"><input className="form-control form-control-sm" placeholder="Tipo" value={item.descripcion} onChange={e => actualizarCirugia(item.id, 'descripcion', e.target.value)} /></div><div className="col-md-4"><input type="date" className="form-control form-control-sm" value={item.fecha} onChange={e => actualizarCirugia(item.id, 'fecha', e.target.value)} /></div><div className="col-md-1"><button className="btn btn-sm btn-outline-danger w-100" onClick={() => eliminarCirugia(item.id)}>X</button></div></div>))}</div><div className="mb-3 p-3 bg-light rounded border"><div className="d-flex align-items-center mb-2 gap-3"><label className="fw-bold text-secondary m-0">Hospitalizaciones</label><button className="btn btn-sm btn-primary" onClick={agregarHospitalizacion}>+ Agregar</button></div>{listaHospitalizaciones.map((item) => (<div key={item.id} className="row g-2 mb-2 align-items-center"><div className="col-md-7"><input className="form-control form-control-sm" placeholder="Causa" value={item.descripcion} onChange={e => actualizarHospitalizacion(item.id, 'descripcion', e.target.value)} /></div><div className="col-md-4"><input type="date" className="form-control form-control-sm" value={item.fecha} onChange={e => actualizarHospitalizacion(item.id, 'fecha', e.target.value)} /></div><div className="col-md-1"><button className="btn btn-sm btn-outline-danger w-100" onClick={() => eliminarHospitalizacion(item.id)}>X</button></div></div>))}</div></>)}
            
            {activeTab === "antecedentesFamiliares" && modoCompleto && (<><h6 className="fw-bold text-primary mb-3 border-bottom pb-2">Familiares</h6><div className="d-flex flex-column gap-2 mb-3">{Object.keys(enfermedadesFamiliares).map(k=>(<div className="form-check" key={k}><input type="checkbox" className="form-check-input" checked={enfermedadesFamiliares[k]} onChange={()=>setEnfermedadesFamiliares({...enfermedadesFamiliares, [k]: !enfermedadesFamiliares[k]})}/><label className="form-check-label">{k}</label></div>))}</div><div className="mb-3"><button className="btn btn-sm btn-outline-secondary mb-3" onClick={() => setMostrarTablaFamiliares(!mostrarTablaFamiliares)}>{mostrarTablaFamiliares ? "- Ocultar" : "+ Más (Tabla)"}</button></div>{mostrarTablaFamiliares && (<div className="card p-3 bg-light border mb-3"><h6 className="small fw-bold text-secondary mb-2">Otras Enfermedades Familiares</h6>{listaFamiliaresExtra.map((item) => (<div key={item.id} className="row g-2 mb-2 align-items-center"><div className="col-md-2"><input className="form-control form-control-sm" placeholder="CIE-10" value={item.cie10} onChange={e => actualizarFamiliarExtra(item.id, 'cie10', e.target.value)} /></div><div className="col-md-5"><input className="form-control form-control-sm" placeholder="Desc" value={item.descripcion} onChange={e => actualizarFamiliarExtra(item.id, 'descripcion', e.target.value)} /></div><div className="col-md-3"><input type="date" className="form-control form-control-sm" value={item.fecha} onChange={e => actualizarFamiliarExtra(item.id, 'fecha', e.target.value)} /></div><div className="col-md-2"><button className="btn btn-sm btn-danger w-100" onClick={() => eliminarFamiliarExtra(item.id)}>X</button></div></div>))}<button className="btn btn-sm btn-primary mt-1" onClick={agregarFamiliarExtra}>+ Agregar Fila</button></div>)}<div className="mt-2"><textarea className="form-control" rows={1} placeholder="Observaciones..." value={descripcionFamiliares} onChange={e => setDescripcionFamiliares(e.target.value)} /></div></>)}
            {activeTab === "desarrollo" && modoCompleto && (<div className="row g-3"><div className="col-12 border-bottom pb-2 mb-2"><h6 className="fw-bold text-primary m-0">Desarrollo Psicomotor</h6></div><div className="col-md-3"><label>Sostén Cefálico</label><input type="number" className="form-control" value={desarrollo.sostenCefalico} onChange={e=>setDesarrollo({...desarrollo, sostenCefalico:e.target.value})} /></div><div className="col-md-3"><label>Sedestación</label><input type="number" className="form-control" value={desarrollo.sedestacion} onChange={e=>setDesarrollo({...desarrollo, sedestacion:e.target.value})} /></div><div className="col-md-3"><label>Deambulación</label><input type="number" className="form-control" value={desarrollo.deambulacion} onChange={e=>setDesarrollo({...desarrollo, deambulacion:e.target.value})} /></div><div className="col-md-3"><label>Lenguaje</label><input type="number" className="form-control" value={desarrollo.lenguaje} onChange={e=>setDesarrollo({...desarrollo, lenguaje:e.target.value})} /></div><div className="col-12 mt-3"><h6 className="fw-bold text-secondary border-bottom pb-2">Alimentación</h6><div className="row g-3"><div className="col-md-4"><div className="form-check mb-2"><input className="form-check-input" type="checkbox" checked={alimentacion.lactancia.checked} onChange={e => setAlimentacion({ ...alimentacion, lactancia: { ...alimentacion.lactancia, checked: e.target.checked } })} /><label className="form-check-label fw-bold">Lactancia Materna</label></div>{alimentacion.lactancia.checked && (<input type="text" className="form-control form-control-sm" placeholder="Duración (meses)" value={alimentacion.lactancia.duracion} onChange={e => setAlimentacion({ ...alimentacion, lactancia: { ...alimentacion.lactancia, duracion: e.target.value } })} />)}</div><div className="col-md-4"><div className="form-check mb-2"><input className="form-check-input" type="checkbox" checked={alimentacion.formula.checked} onChange={e => setAlimentacion({ ...alimentacion, formula: { ...alimentacion.formula, checked: e.target.checked } })} /><label className="form-check-label fw-bold">Fórmula</label></div>{alimentacion.formula.checked && (<input type="text" className="form-control form-control-sm" placeholder="Tipo" value={alimentacion.formula.tipo} onChange={e => setAlimentacion({ ...alimentacion, formula: { ...alimentacion.formula, tipo: e.target.value } })} />)}</div><div className="col-md-4"><div className="form-check mb-2"><input className="form-check-input" type="checkbox" checked={alimentacion.ablactacion.checked} onChange={e => setAlimentacion({ ...alimentacion, ablactacion: { ...alimentacion.ablactacion, checked: e.target.checked } })} /><label className="form-check-label fw-bold">Ablactación</label></div>{alimentacion.ablactacion.checked && (<input type="text" className="form-control form-control-sm" placeholder="Edad de inicio" value={alimentacion.ablactacion.edadInicio} onChange={e => setAlimentacion({ ...alimentacion, ablactacion: { ...alimentacion.ablactacion, edadInicio: e.target.value } })} />)}</div></div></div></div>)}
            {activeTab === "examenFisico" && (<><div className="card bg-light mb-4 border-0"><div className="card-body p-3"><h6 className="text-primary mb-3 small fw-bold text-uppercase">A. Signos Vitales</h6><div className="row g-3 text-center mb-3"><div className="col"><label className="small d-block fw-bold">Peso (kg)</label><input type="number" className="form-control form-control-sm text-center fw-bold text-primary" value={signosVitales.peso} onChange={e=>setSignosVitales({...signosVitales, peso:e.target.value})}/></div><div className="col"><label className="small d-block fw-bold">Talla (cm)</label><input type="number" className="form-control form-control-sm text-center fw-bold text-primary" value={signosVitales.talla} onChange={e=>setSignosVitales({...signosVitales, talla:e.target.value})}/></div><div className="col"><div className="form-check form-switch d-flex justify-content-center gap-2 mb-1"><input className="form-check-input" type="checkbox" checked={esMenor3Anios} onChange={e => setEsMenor3Anios(e.target.checked)}/><label className="small" style={{fontSize: '0.7rem'}}>¿≤ 3 años?</label></div>{esMenor3Anios ? (<input type="number" className="form-control form-control-sm text-center" placeholder="P. Cefálico" value={signosVitales.perimetroCefalico} onChange={e=>setSignosVitales({...signosVitales, perimetroCefalico:e.target.value})}/>) : (<input className="form-control form-control-sm text-center bg-light" disabled value="-" />)}</div><div className="col"><label className="small d-block">Temp (°C)</label><input className="form-control form-control-sm text-center" value={signosVitales.temperatura} onChange={e=>setSignosVitales({...signosVitales, temperatura:e.target.value})}/></div><div className="col"><label className="small d-block">FC (lpm)</label><input className="form-control form-control-sm text-center" value={signosVitales.fc} onChange={e=>setSignosVitales({...signosVitales, fc:e.target.value})}/></div><div className="col"><label className="small d-block">FR (rpm)</label><input className="form-control form-control-sm text-center" value={signosVitales.fr} onChange={e=>setSignosVitales({...signosVitales, fr:e.target.value})}/></div><div className="col"><label className="small d-block">SpO2 (%)</label><input className="form-control form-control-sm text-center" value={signosVitales.spo2} onChange={e=>setSignosVitales({...signosVitales, spo2:e.target.value})}/></div></div><div className="row g-3 mb-3 justify-content-center"><div className="col-md-3"><label className="small d-block fw-bold text-secondary">PA Sistólica</label><div className="input-group input-group-sm"><input type="number" className="form-control text-center" value={signosVitales.paSistolica} onChange={e=>setSignosVitales({...signosVitales, paSistolica:e.target.value})}/><span className="input-group-text">mmHg</span></div></div><div className="col-md-3"><label className="small d-block fw-bold text-secondary">PA Diastólica</label><div className="input-group input-group-sm"><input type="number" className="form-control text-center" value={signosVitales.paDiastolica} onChange={e=>setSignosVitales({...signosVitales, paDiastolica:e.target.value})}/><span className="input-group-text">mmHg</span></div></div></div><div className="row g-2 mt-2 pt-2 border-top"><div className="col-12"><h6 className="small fw-bold text-success mb-2">Evaluación Nutricional</h6></div><div className="col-md-4"><div className="border rounded p-2 bg-white text-center h-100"><small className="d-block text-muted">IMC</small><div className="fw-bold fs-5">{resultadoIMC.valor || "--"}</div><span className={resultadoIMC.color || "text-secondary"}>{resultadoIMC.categoria || "Pendiente"}</span></div></div><div className="col-md-4"><div className="border rounded p-2 bg-white text-center h-100"><small className="d-block text-muted">Z-Score Peso/Edad</small><div className={`fw-bold fs-5 ${zScorePesoEdad.color}`}>{zScorePesoEdad.valor || "--"}</div><small className="text-muted" style={{fontSize: '0.7rem'}}>*Referencial</small></div></div><div className="col-md-4"><div className="border rounded p-2 bg-white text-center h-100"><small className="d-block text-muted">Z-Score Peso/Talla</small><div className={`fw-bold fs-5 ${zScorePesoTalla.color}`}>{zScorePesoTalla.valor || "--"}</div><small className="text-muted" style={{fontSize: '0.7rem'}}>*Referencial</small></div></div></div></div></div><h6 className="text-primary mb-3 border-bottom pb-2">B. Examen Físico Segmentario</h6><div className="row g-4"><div className="col-md-6"><div className="card h-100 border-light shadow-sm"><div className="card-header bg-white fw-bold small">Aspecto General</div><div className="card-body"><input className="form-control form-control-sm mb-2" placeholder="Texto libre corto..." value={aspectoGeneralTexto} onChange={e=>setAspectoGeneralTexto(e.target.value)} /><div className="d-flex flex-wrap gap-2 mb-2">{['consciente', 'alerta', 'activo', 'decaido'].map(k => (<div className="form-check" key={k}><input className="form-check-input" type="checkbox" checked={aspectoGeneralChecks[k as keyof typeof aspectoGeneralChecks]} onChange={e => setAspectoGeneralChecks({...aspectoGeneralChecks, [k]: e.target.checked})} /><label className="form-check-label small text-capitalize">{k}</label></div>))}</div><div className="form-check mb-1"><input className="form-check-input" type="checkbox" checked={aspectoGeneralChecks.otros} onChange={e => setAspectoGeneralChecks({...aspectoGeneralChecks, otros: e.target.checked})} /><label className="form-check-label small">Otros</label></div>{aspectoGeneralChecks.otros && <input className="form-control form-control-sm mt-1" placeholder="Especifique..." value={aspectoGeneralOtros} onChange={e=>setAspectoGeneralOtros(e.target.value)} />}</div></div></div><div className="col-md-6"><div className="card h-100 border-light shadow-sm"><div className="card-header bg-white fw-bold small">Piel y Faneras</div><div className="card-body"><div className="d-flex flex-wrap gap-3 mb-2">{['ictericia', 'cianosis', 'rash'].map(k => (<div className="form-check" key={k}><input className="form-check-input" type="checkbox" checked={pielChecks[k as keyof typeof pielChecks]} onChange={e => setPielChecks({...pielChecks, [k]: e.target.checked})} /><label className="form-check-label small text-capitalize">{k}</label></div>))}</div><div className="form-check"><input className="form-check-input" type="checkbox" checked={pielChecks.otros} onChange={e => setPielChecks({...pielChecks, otros: e.target.checked})} /><label className="form-check-label small">Otros</label></div>{pielChecks.otros && <input className="form-control form-control-sm mt-1" placeholder="Especifique..." value={pielOtros} onChange={e=>setPielOtros(e.target.value)} />}</div></div></div><div className="col-md-6"><div className="card h-100 border-light shadow-sm"><div className="card-header bg-white fw-bold small">Cabeza y Cuello</div><div className="card-body"><div className="d-flex flex-wrap gap-3 mb-2"><div className="form-check"><input className="form-check-input" type="checkbox" checked={cabezaChecks.fontanela} onChange={e => setCabezaChecks({...cabezaChecks, fontanela: e.target.checked})} /><label className="form-check-label small">Fontanela anterior</label></div><div className="form-check"><input className="form-check-input" type="checkbox" checked={cabezaChecks.adenopatias} onChange={e => setCabezaChecks({...cabezaChecks, adenopatias: e.target.checked})} /><label className="form-check-label small">Adenopatías</label></div></div><div className="form-check"><input className="form-check-input" type="checkbox" checked={cabezaChecks.otros} onChange={e => setCabezaChecks({...cabezaChecks, otros: e.target.checked})} /><label className="form-check-label small">Otros</label></div>{cabezaChecks.otros && <input className="form-control form-control-sm mt-1" placeholder="Especifique..." value={cabezaOtros} onChange={e=>setCabezaOtros(e.target.value)} />}</div></div></div><div className="col-md-6"><div className="card h-100 border-light shadow-sm"><div className="card-header bg-white fw-bold small">Cardiopulmonar</div><div className="card-body"><div className="row g-2">{['Ruidos cardiacos', 'Murmullos vesiculares', 'Soplos', 'Crepitantes'].map((label, idx) => { const key = ['ruidos', 'murmullos', 'soplos', 'crepitantes'][idx]; return (<div className="col-6" key={key}><div className="form-check"><input className="form-check-input" type="checkbox" checked={cardioChecks[key as keyof typeof cardioChecks]} onChange={e => setCardioChecks({...cardioChecks, [key]: e.target.checked})} /><label className="form-check-label small">{label}</label></div></div>); })}</div></div></div></div><div className="col-md-6"><div className="card h-100 border-light shadow-sm"><div className="card-header bg-white fw-bold small">Abdomen</div><div className="card-body"><div className="row g-2">{['Blando', 'Depresible', 'Dolor a la palpación', 'Hepatomegalia', 'Esplenomegalia'].map((label, idx) => { const key = ['blando', 'depresible', 'dolor', 'hepatomegalia', 'esplenomegalia'][idx]; return (<div className="col-6" key={key}><div className="form-check"><input className="form-check-input" type="checkbox" checked={abdomenChecks[key as keyof typeof abdomenChecks]} onChange={e => setAbdomenChecks({...abdomenChecks, [key]: e.target.checked})} /><label className="form-check-label small">{label}</label></div></div>); })}</div></div></div></div><div className="col-md-6"><div className="card h-100 border-light shadow-sm"><div className="card-header bg-white fw-bold small">Neurológico</div><div className="card-body"><div className="d-flex flex-column gap-2"><div className="form-check"><input className="form-check-input" type="checkbox" checked={neuroChecks.reflejos} onChange={e => setNeuroChecks({...neuroChecks, reflejos: e.target.checked})} /><label className="form-check-label small">Reflejos osteotendinosos</label></div><div className="form-check"><input className="form-check-input" type="checkbox" checked={neuroChecks.estadoMental} onChange={e => setNeuroChecks({...neuroChecks, estadoMental: e.target.checked})} /><label className="form-check-label small">Estado mental</label></div><div className="form-check"><input className="form-check-input" type="checkbox" checked={neuroChecks.tono} onChange={e => setNeuroChecks({...neuroChecks, tono: e.target.checked})} /><label className="form-check-label small">Tono muscular</label></div></div></div></div></div><div className="col-12 mt-2"><label className="fw-bold text-success">Evolución Clínica</label><textarea className="form-control border-success" rows={3} value={evolucionClinica} onChange={e=>setEvolucionClinica(e.target.value)}/></div></div></>)}

            {activeTab === "diagnostico" && (
               <>
                   <div className="mb-4 p-4 bg-light rounded border">
                       <h6 className="text-primary border-bottom pb-2 mb-3 fw-bold">A. Diagnósticos (CIE-10)</h6>
                       
                       {/* 1. PRINCIPAL */}
                       <div className="mb-4">
                           <label className="fw-bold text-danger small mb-1">DIAGNÓSTICO PRINCIPAL (Obligatorio)</label>
                           <div className="card border-danger shadow-sm">
                               <div className="card-body p-2">
                                   <div className="row g-2 align-items-center">
                                       <div className="col-md-2"><input className="form-control fw-bold" placeholder="CIE-10" value={diagnosticoPrincipal.cie10} onChange={e => setDiagnosticoPrincipal({...diagnosticoPrincipal, cie10: e.target.value})} /></div>
                                       <div className="col-md-7"><input className="form-control fw-bold" placeholder="Descripción del Diagnóstico Principal" value={diagnosticoPrincipal.descripcion} onChange={e => setDiagnosticoPrincipal({...diagnosticoPrincipal, descripcion: e.target.value})} /></div>
                                       <div className="col-md-3"><select className="form-select fw-bold" value={diagnosticoPrincipal.tipo} onChange={e => setDiagnosticoPrincipal({...diagnosticoPrincipal, tipo: e.target.value as any})}><option>Presuntivo</option><option>Definitivo</option></select></div>
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* 2. SECUNDARIOS */}
                       <div>
                           <div className="d-flex justify-content-between align-items-center mb-2">
                               <label className="fw-bold text-secondary small m-0">DIAGNÓSTICOS SECUNDARIOS (Opcionales)</label>
                               <button className="btn btn-sm btn-outline-primary" onClick={agregarSecundario}>+ Agregar Secundario</button>
                           </div>
                           
                           {listaDiagnosticosSecundarios.length === 0 && <div className="text-muted small fst-italic mb-3">No hay diagnósticos secundarios registrados.</div>}

                           {listaDiagnosticosSecundarios.map((diag) => (
                               <div key={diag.id} className="row g-2 mb-2 align-items-center">
                                   <div className="col-md-2"><input className="form-control form-control-sm" placeholder="CIE-10" value={diag.cie10} onChange={e => actualizarSecundario(diag.id, 'cie10', e.target.value)} /></div>
                                   <div className="col-md-6"><input className="form-control form-control-sm" placeholder="Descripción" value={diag.descripcion} onChange={e => actualizarSecundario(diag.id, 'descripcion', e.target.value)} /></div>
                                   <div className="col-md-3"><select className="form-select form-select-sm" value={diag.tipo} onChange={e => actualizarSecundario(diag.id, 'tipo', e.target.value as any)}><option>Presuntivo</option><option>Definitivo</option></select></div>
                                   <div className="col-md-1"><button className="btn btn-outline-danger btn-sm w-100" onClick={() => eliminarSecundario(diag.id)}>X</button></div>
                               </div>
                           ))}
                       </div>
                   </div>

                   <div className="mb-3"><label className="fw-bold">Impresión Diagnóstica</label><textarea className="form-control" rows={3} value={impresionDiagnostica} onChange={e => setImpresionDiagnostica(e.target.value)}></textarea></div>
                   
                   <div className="row g-3">
                       <div className="col-12"><h6 className="text-primary border-bottom pb-2 mt-2">B. Estudios y Laboratorios</h6></div>
                       <div className="col-md-6"><label className="fw-bold small">Solicitados</label><textarea className="form-control" rows={2} value={estudiosSolicitados} onChange={e => setEstudiosSolicitados(e.target.value)} /></div>
                       <div className="col-md-6"><label className="fw-bold small">Resultados Relevantes</label><textarea className="form-control" rows={2} value={resultadosRelevantes} onChange={e => setResultadosRelevantes(e.target.value)} /></div>
                       
                       <div className="col-12"><h6 className="text-primary border-bottom pb-2 mt-2">C. Plan de Tratamiento</h6></div>
                       
                       {/* PLAN FARMACOLÓGICO */}
                       <div className="col-md-6">
                           <div className="card h-100 border-light shadow-sm">
                               <div className="card-header bg-white fw-bold small text-success">Manejo Farmacológico</div>
                               <div className="card-body">
                                   <div className="d-flex flex-wrap gap-2 mb-2">
                                       {['venosa', 'oral', 'oxigeno', 'nebulizacion', 'intramuscular', 'topico'].map(k => (
                                           <div className="form-check" key={k}>
                                               <input className="form-check-input" type="checkbox" checked={farmacologicoChecks[k as keyof typeof farmacologicoChecks]} onChange={e => setFarmacologicoChecks({...farmacologicoChecks, [k]: e.target.checked})} /><label className="form-check-label small text-capitalize">{k}</label>
                                           </div>
                                       ))}
                                   </div>
                                   <div className="form-check mb-1">
                                       <input className="form-check-input" type="checkbox" checked={farmacologicoChecks.otros} onChange={e => setFarmacologicoChecks({...farmacologicoChecks, otros: e.target.checked})} />
                                       <label className="form-check-label small">Otros</label>
                                   </div>
                                   {farmacologicoChecks.otros && <input className="form-control form-control-sm" placeholder="Especifique..." value={farmacologicoOtros} onChange={e=>setFarmacologicoOtros(e.target.value)} />}
                               </div>
                           </div>
                       </div>

                       {/* PLAN NO FARMACOLÓGICO */}
                       <div className="col-md-6">
                           <div className="card h-100 border-light shadow-sm">
                               <div className="card-header bg-white fw-bold small text-info">Manejo No Farmacológico</div>
                               <div className="card-body">
                                   <div className="d-flex flex-wrap gap-2 mb-2">
                                       {['hidratacion', 'dieta', 'fisioterapia', 'reposo', 'controlTermico', 'educacion'].map(k => (
                                           <div className="form-check" key={k}>
                                               <input className="form-check-input" type="checkbox" checked={noFarmacologicoChecks[k as keyof typeof noFarmacologicoChecks]} onChange={e => setNoFarmacologicoChecks({...noFarmacologicoChecks, [k]: e.target.checked})} /><label className="form-check-label small text-capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</label>
                                           </div>
                                       ))}
                                   </div>
                                   <div className="form-check mb-1">
                                       <input className="form-check-input" type="checkbox" checked={noFarmacologicoChecks.otros} onChange={e => setNoFarmacologicoChecks({...noFarmacologicoChecks, otros: e.target.checked})} /><label className="form-check-label small">Otros</label>
                                   </div>
                                   {noFarmacologicoChecks.otros && <input className="form-control form-control-sm" placeholder="Especifique..." value={noFarmacologicoOtros} onChange={e=>setNoFarmacologicoOtros(e.target.value)} />}
                               </div>
                           </div>
                       </div>

                       <div className="col-12 mt-2"><label className="fw-bold small">Detalle Plan / Receta</label><textarea className="form-control" rows={3} value={planManejo} onChange={e => setPlanManejo(e.target.value)} /></div>
                       <div className="col-md-6"><label className="fw-bold small">Pronóstico</label><select className="form-select" value={pronostico} onChange={e => setPronostico(e.target.value)}><option value="">Seleccione...</option><option>Bueno</option><option>Reservado</option><option>Malo</option></select></div>
                       
                       {/* ================= MODIFICADO: INPUT CON VALIDACIÓN VISUAL Y MENSAJE DE ERROR ================= */}
                       <div className="col-md-6">
                           <label className="fw-bold small">Próxima Cita</label>
                           <input 
                               type="date" 
                               className={`form-control ${errorProximaCita ? 'is-invalid' : ''}`} 
                               value={proximaCita} 
                               min={new Date().toISOString().split('T')[0]} 
                               onChange={handleProximaCitaChange} 
                           />
                           {errorProximaCita && <div className="text-danger small mt-1">{errorProximaCita}</div>}
                       </div>
                       {/* ============================================================================================== */}

                   </div>
               </>
            )}
         </div>
      </div>

      {/* FOOTER */}
      <div className="bg-white border-top shadow-sm p-4 d-flex flex-column flex-shrink-0" style={{ height: '280px' }}><div className="d-flex justify-content-between align-items-center mb-2"><h6 className="text-success fw-bold m-0"><i className="bi bi-clock-history me-2"></i>HISTORIAL PREVIO</h6><button className="btn btn-success fw-bold btn-sm" onClick={handleNuevaConsulta}>+ NUEVA CONSULTA</button></div><div className="flex-grow-1 overflow-auto"><div className="row g-3">{consultasPasadas.slice().reverse().map((hist: any, i: number) => (<div key={i} className="col-md-4 col-lg-3"><div className={`p-3 rounded border h-100 bg-white shadow-sm ${idEdicion === hist.id ? 'border-warning bg-warning bg-opacity-10' : ''}`}><div className="d-flex justify-content-between mb-1"><span className="fw-bold small">{hist.fecha}</span><button className="btn btn-sm btn-link p-0 small" onClick={() => { navigate('.', { state: { consultaAEditar: hist } }); window.location.reload(); }}>Editar</button></div><strong className="d-block text-primary small text-truncate">{hist.motivo}</strong></div></div>))}</div></div></div>
      
      {/* MODAL DE REPORTE */}
      {mostrarReporte && paciente && (
        <ReporteMedico 
            paciente={paciente}
            consulta={{
                id: idEdicion,
                fecha: location.state?.consultaAEditar?.fecha || new Date().toISOString().split('T')[0],
                hora: location.state?.consultaAEditar?.hora || new Date().toLocaleTimeString(),
                motivo: motivoConsulta,
                enfermedadActual: enfermedadActual,
                antecedentes: {
                    perinatales: { complicaciones: descripcionComplicaciones },
                    vacunacion: estadoVacunacion,
                    alergiasDetalle: listaAlergias.map(a => a.descripcion).join(", "),
                    cronicasData: { descripcion: descripcionCronicas },
                    familiaresData: { descripcion: descripcionFamiliares }
                },
                examenFisico: {
                    vitales: signosVitales,
                    calculos: { imc: resultadoIMC },
                    segmentario: { aspectoGeneral: aspectoGeneralTexto, abdomen: abdomenChecks.blando ? 'Blando' : '', cardiopulmonar: cardioChecks.ruidos ? 'Ruidos rítmicos' : '' }
                },
                diagnostico: {
                    cie10: [diagnosticoPrincipal, ...listaDiagnosticosSecundarios],
                    plan: planManejo,
                    proximaCita: proximaCita,
                    pronostico: pronostico
                }
            }}
            nombreDoctor={nombreDoctor}
            onClose={() => setMostrarReporte(false)}
        />
      )}
    </div>
  );
}