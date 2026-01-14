import { useState } from 'react'
import { calcularEdad } from '../../utils/date.utils'
import type { Apgar } from '../../utils/apgar.utils'
import { calcularApgar } from '../../utils/apgar.utils'
import { validarCedulaEcuatoriana } from '../../utils/cedula.utils'
import { registrarPaciente } from "../../services/pacienteStorage";
import { v4 as uuidv4 } from "uuid";

export default function RegistroPacienteTabs() {
  const [activeTab, setActiveTab] = useState<'identificacion' | 'apgar' | 'clinicos'>('identificacion');

  // ================= ESTADOS IDENTIFICACIÓN =================
  const [cedula, setCedula] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [edad, setEdad] = useState<{ años: number; meses: number } | null>(null)
  const [sexo, setSexo] = useState('')
  const [tipoSangre, setTipoSangre] = useState('')
  const [fechaAtencion, setFechaAtencion] = useState('');
  const [grupoEtnico, setGrupoEtnico] = useState('');
  const [provincia, setProvincia] = useState('');
  const [canton, setCanton] = useState('');
  const [parroquia, setParroquia] = useState('');

  const manejarFechaNacimiento = (fecha: string) => {
    setFechaNacimiento(fecha)
    setEdad(calcularEdad(fecha))
  }

  const provincias = ["Azuay","Pichincha","Guayas","Manabí","Loja","Imbabura","Cotopaxi"];
  const cantonesPorProvincia: Record<string, string[]> = {
    "Azuay": ["Cuenca","Gualaceo","Paute"],
    "Pichincha": ["Quito","Cayambe","Rumiñahui"],
    "Guayas": ["Guayaquil","Daule","Samborondón"],
    "Manabí": ["Manta","Portoviejo","Jipijapa"]
  };
  const parroquiasPorCanton: Record<string, string[]> = {
    "Cuenca": ["El Vecino","Tarqui","Baños"],
    "Quito": ["Centro Histórico","Carcelén","Iñaquito"],
    "Guayaquil": ["Tarqui","Ximena","Kennedy"],
    "Manta": ["Tarqui","San Mateo","Santa Marianita"]
  };

  // ================= APGAR =================
  const [apgar, setApgar] = useState<Apgar>({
    apariencia: 0,
    pulso: 0,
    reflejos: 0,
    tonoMuscular: 0,
    respiracion: 0
  })
  const totalApgar = Object.values(apgar).some(v => v === null) ? null : calcularApgar(apgar)

  // ================= CONDICIONALES =================
  const [hospitalizacion, setHospitalizacion] = useState(false)
  const [cirugias, setCirugias] = useState(false)
  const [alergias, setAlergias] = useState(false)

  // ================= DATOS CLÍNICOS =================
  const [datosIdentificacion, setDatosIdentificacion] = useState({ ocupacion:'', direccion:'', telefono:'' })
  const [filiacion, setFiliacion] = useState({ padre:'', madre:'', hermanos:'' })
  const [antecedentes, setAntecedentes] = useState({ patologicos:'', familiares:'', alergicos:'' })
  const [examenFisico, setExamenFisico] = useState({ peso:'', talla:'', presion:'' })
  const [diagnostico, setDiagnostico] = useState({ problemaPrincipal:'', codigosCie:'' })

  // ================= ERRORES =================
  const [errores, setErrores] = useState<Record<string,string>>({})

  // ================= VALIDACIÓN =================
  const validarFormulario = () => {
    const e: Record<string,string> = {}
    if (!cedula) e.cedula = 'La cédula es obligatoria'
    else if (!validarCedulaEcuatoriana(cedula)) e.cedula='Cédula inválida'
    if (!nombres) e.nombres='Nombres obligatorios'
    if (!apellidos) e.apellidos='Apellidos obligatorios'
    if (!fechaNacimiento) e.fechaNacimiento='Fecha obligatoria'
    else if (!edad) e.fechaNacimiento='Fecha futura o inválida'
    if (!sexo) e.sexo='Seleccione sexo'
    if (!tipoSangre) e.tipoSangre='Seleccione tipo sangre'
    if (!fechaAtencion) e.fechaAtencion='Seleccione fecha atención'
    if (!grupoEtnico) e.grupoEtnico='Seleccione grupo étnico'
    if (!provincia) e.provincia='Seleccione provincia'
    if (!canton) e.canton='Seleccione cantón'
    if (!parroquia) e.parroquia='Seleccione parroquia'
    if (Object.values(apgar).some(v=>v===null)) e.apgar='Complete APGAR'
    setErrores(e)
    return Object.keys(e).length===0
  }

  // ================= GUARDAR =================
  const handleGuardarPaciente = () => {
    if(!validarFormulario()) return
    const paciente = {
      id: uuidv4(),
      cedula,nombres,apellidos,fechaNacimiento,edad,sexo,tipoSangre,
      fechaAtencion,grupoEtnico,provincia,canton,parroquia,
      datosIdentificacion,filiacion,antecedentes,examenFisico,diagnostico,
      hospitalizacion,cirugias,alergias,apgar:totalApgar
    }
    try { registrarPaciente(paciente); alert('Paciente registrado correctamente') }
    catch(err:any){ alert(err.message) }
  }

  // ================= RENDER =================
  return (
    <>
      <h4 className="mb-4"><i className="bi bi-person-vcard me-2"></i> Registro de Paciente</h4>

      {/* ================= TABS ================= */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab==='identificacion'?'active':''}`} onClick={()=>setActiveTab('identificacion')}>Identificación</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab==='apgar'?'active':''}`} onClick={()=>setActiveTab('apgar')}>APGAR</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab==='clinicos'?'active':''}`} onClick={()=>setActiveTab('clinicos')}>Datos Clínicos</button>
        </li>
      </ul>

      {/* ================= TAB IDENTIFICACIÓN ================= */}
      {activeTab==='identificacion' && (
        <div className="card p-3 mb-3">
          <div className="row g-3">
            <div className="col-md-4">
              <label>Cédula</label>
              <input className={`form-control ${errores.cedula?'is-invalid':''}`} value={cedula} onChange={e=>setCedula(e.target.value)}/>
              <div className="invalid-feedback">{errores.cedula}</div>
            </div>
            <div className="col-md-4">
              <label>Nombres</label>
              <input className={`form-control ${errores.nombres?'is-invalid':''}`} value={nombres} onChange={e=>setNombres(e.target.value)}/>
              <div className="invalid-feedback">{errores.nombres}</div>
            </div>
            <div className="col-md-4">
              <label>Apellidos</label>
              <input className={`form-control ${errores.apellidos?'is-invalid':''}`} value={apellidos} onChange={e=>setApellidos(e.target.value)}/>
              <div className="invalid-feedback">{errores.apellidos}</div>
            </div>

            <div className="col-md-4">
              <label>Fecha nacimiento</label>
              <input type="date" className={`form-control ${errores.fechaNacimiento?'is-invalid':''}`} value={fechaNacimiento} onChange={e=>manejarFechaNacimiento(e.target.value)}/>
              <div className="invalid-feedback">{errores.fechaNacimiento}</div>
            </div>

            <div className="col-md-4">
              <label>Edad</label>
              <input disabled className="form-control" value={edad?`${edad.años} años, ${edad.meses} meses`:'—'}/>
            </div>

            <div className="col-md-4">
              <label>Sexo</label>
              <select className={`form-select ${errores.sexo?'is-invalid':''}`} value={sexo} onChange={e=>setSexo(e.target.value)}>
                <option value="">Seleccione</option><option>Masculino</option><option>Femenino</option>
              </select>
              <div className="invalid-feedback">{errores.sexo}</div>
            </div>

            <div className="col-md-4">
              <label>Tipo de sangre</label>
              <select className={`form-select ${errores.tipoSangre?'is-invalid':''}`} value={tipoSangre} onChange={e=>setTipoSangre(e.target.value)}>
                <option value="">Seleccione</option>
                <option>O+</option><option>O-</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option>
              </select>
              <div className="invalid-feedback">{errores.tipoSangre}</div>
            </div>

            <div className="col-md-4">
              <label>Fecha de atención</label>
              <input type="date" className={`form-control ${errores.fechaAtencion?'is-invalid':''}`} value={fechaAtencion} onChange={e=>setFechaAtencion(e.target.value)}/>
              <div className="invalid-feedback">{errores.fechaAtencion}</div>
            </div>

            <div className="col-md-4">
              <label>Grupo étnico / Raza</label>
              <select className={`form-select ${errores.grupoEtnico?'is-invalid':''}`} value={grupoEtnico} onChange={e=>setGrupoEtnico(e.target.value)}>
                <option value="">Seleccione</option>
                <option>Montubio</option><option>Mestizo</option><option>Afroecuatoriano</option>
                <option>Indígena</option><option>Blanco</option><option>Otro</option>
              </select>
              <div className="invalid-feedback">{errores.grupoEtnico}</div>
            </div>

            <div className="col-md-4">
              <label>Provincia</label>
              <select className={`form-select ${errores.provincia?'is-invalid':''}`} value={provincia} onChange={e=>{setProvincia(e.target.value); setCanton(''); setParroquia('')}}>
                <option value="">Seleccione</option>
                {provincias.map(p=><option key={p}>{p}</option>)}
              </select>
              <div className="invalid-feedback">{errores.provincia}</div>
            </div>

            <div className="col-md-4">
              <label>Cantón</label>
              <select className={`form-select ${errores.canton?'is-invalid':''}`} value={canton} onChange={e=>{setCanton(e.target.value); setParroquia('')}} disabled={!provincia}>
                <option value="">Seleccione</option>
                {provincia && cantonesPorProvincia[provincia]?.map(c=><option key={c}>{c}</option>)}
              </select>
              <div className="invalid-feedback">{errores.canton}</div>
            </div>

            <div className="col-md-4">
              <label>Parroquia</label>
              <select className={`form-select ${errores.parroquia?'is-invalid':''}`} value={parroquia} onChange={e=>setParroquia(e.target.value)} disabled={!canton}>
                <option value="">Seleccione</option>
                {canton && parroquiasPorCanton[canton]?.map(p=><option key={p}>{p}</option>)}
              </select>
              <div className="invalid-feedback">{errores.parroquia}</div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB APGAR ================= */}
      {activeTab==='apgar' && (
        <div className="card p-3 mb-3">
          {Object.keys(apgar).map(key=>(
            <div className="row mb-2" key={key}>
              <div className="col-md-4 text-capitalize">{key}</div>
              <div className="col-md-8">
                <select className="form-select" value={apgar[key as keyof Apgar]} onChange={e=>setApgar({...apgar,[key]:Number(e.target.value)})}>
                  <option value={0}>0</option><option value={1}>1</option><option value={2}>2</option>
                </select>
              </div>
            </div>
          ))}
          <div className={`alert ${errores.apgar?'alert-warning':'alert-info'}`}>
            <strong>APGAR Total:</strong> {errores.apgar??totalApgar}
          </div>
        </div>
      )}

      {/* ================= TAB DATOS CLÍNICOS ================= */}
      {activeTab==='clinicos' && (
        <div className="card p-3 mb-3">
          {/* Datos Identificación */}
          <h6>Datos Identificación</h6>
          <div className="row g-3 mb-3">
            <div className="col-md-4"><label>Ocupación</label><input className="form-control" value={datosIdentificacion.ocupacion} onChange={e=>setDatosIdentificacion({...datosIdentificacion,ocupacion:e.target.value})}/></div>
            <div className="col-md-4"><label>Dirección</label><input className="form-control" value={datosIdentificacion.direccion} onChange={e=>setDatosIdentificacion({...datosIdentificacion,direccion:e.target.value})}/></div>
            <div className="col-md-4"><label>Teléfono</label><input className="form-control" value={datosIdentificacion.telefono} onChange={e=>setDatosIdentificacion({...datosIdentificacion,telefono:e.target.value})}/></div>
          </div>

          {/* Filiación */}
          <h6>Filiación</h6>
          <div className="row g-3 mb-3">
            <div className="col-md-4"><label>Padre</label><input className="form-control" value={filiacion.padre} onChange={e=>setFiliacion({...filiacion,padre:e.target.value})}/></div>
            <div className="col-md-4"><label>Madre</label><input className="form-control" value={filiacion.madre} onChange={e=>setFiliacion({...filiacion,madre:e.target.value})}/></div>
            <div className="col-md-4"><label>Hermanos</label><input className="form-control" value={filiacion.hermanos} onChange={e=>setFiliacion({...filiacion,hermanos:e.target.value})}/></div>
          </div>

          {/* Antecedentes */}
          <h6>Antecedentes</h6>
          <div className="row g-3 mb-3">
            <div className="col-md-4"><label>Patológicos</label><input className="form-control" value={antecedentes.patologicos} onChange={e=>setAntecedentes({...antecedentes,patologicos:e.target.value})}/></div>
            <div className="col-md-4"><label>Familiares</label><input className="form-control" value={antecedentes.familiares} onChange={e=>setAntecedentes({...antecedentes,familiares:e.target.value})}/></div>
            <div className="col-md-4"><label>Alergicos</label><input className="form-control" value={antecedentes.alergicos} onChange={e=>setAntecedentes({...antecedentes,alergicos:e.target.value})}/></div>
          </div>

          {/* Examen físico */}
          <h6>Examen Físico</h6>
          <div className="row g-3 mb-3">
            <div className="col-md-4"><label>Peso</label><input className="form-control" value={examenFisico.peso} onChange={e=>setExamenFisico({...examenFisico,peso:e.target.value})}/></div>
            <div className="col-md-4"><label>Talla</label><input className="form-control" value={examenFisico.talla} onChange={e=>setExamenFisico({...examenFisico,talla:e.target.value})}/></div>
            <div className="col-md-4"><label>Presión</label><input className="form-control" value={examenFisico.presion} onChange={e=>setExamenFisico({...examenFisico,presion:e.target.value})}/></div>
          </div>

          {/* Diagnóstico */}
          <h6>Diagnóstico</h6>
          <div className="row g-3 mb-3">
            <div className="col-md-6"><label>Problema Principal</label><input className="form-control" value={diagnostico.problemaPrincipal} onChange={e=>setDiagnostico({...diagnostico,problemaPrincipal:e.target.value})}/></div>
            <div className="col-md-6"><label>Códigos CIE</label><input className="form-control" value={diagnostico.codigosCie} onChange={e=>setDiagnostico({...diagnostico,codigosCie:e.target.value})}/></div>
          </div>

          {/* Condicionales */}
          <h6>Condicionales</h6>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="checkbox" checked={hospitalizacion} onChange={e=>setHospitalizacion(e.target.checked)}/>
            <label className="form-check-label">Hospitalización</label>
          </div>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="checkbox" checked={cirugias} onChange={e=>setCirugias(e.target.checked)}/>
            <label className="form-check-label">Cirugías</label>
          </div>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="checkbox" checked={alergias} onChange={e=>setAlergias(e.target.checked)}/>
            <label className="form-check-label">Alergias</label>
          </div>
        </div>
      )}

      <div className="text-end">
        <button className="btn btn-success mt-3" onClick={handleGuardarPaciente}><i className="bi bi-save me-2"></i> Guardar Paciente</button>
      </div>
    </>
  )
}
