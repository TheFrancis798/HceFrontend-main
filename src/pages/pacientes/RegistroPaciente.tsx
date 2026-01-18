import { useState } from 'react';
import { registrarPaciente } from "../../services/pacienteStorage";
import { v4 as uuidv4 } from "uuid";

export default function RegistroPaciente() {
  const [activeTab, setActiveTab] = useState<'identificacion' | 'filiacion'>('identificacion');

  // ================= 1. DATOS DE IDENTIFICACIÓN DEL PACIENTE =================
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fechaAtencion, setFechaAtencion] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  
  // ESTADO PARA LA EDAD
  const [edad, setEdad] = useState<{ años: number; meses: number } | null>(null);
  
  const [sexo, setSexo] = useState('');
  const [grupoEtnico, setGrupoEtnico] = useState('');
  const [provincia, setProvincia] = useState('');
  const [canton, setCanton] = useState('');
  const [parroquia, setParroquia] = useState('');
  const [tipoSangre, setTipoSangre] = useState('');

  // ================= 2. DATOS DE FILIACIÓN =================
  const [nombreResponsable, setNombreResponsable] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [domicilioActual, setDomicilioActual] = useState('');
  const [nivelEducativoResponsable, setNivelEducativoResponsable] = useState('');

  // ================= LÓGICA DE CÁLCULO DE EDAD (INTEGRADA) =================
  const manejarFechaNacimiento = (fecha: string) => {
    setFechaNacimiento(fecha);
    
    if (!fecha) {
      setEdad(null);
      return;
    }

    const nacimiento = new Date(fecha);
    const hoy = new Date();

    // Validar que la fecha no sea futura
    if (nacimiento > hoy) {
      setEdad(null);
      return;
    }

    let anos = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();

    // Ajuste si el mes actual es menor al mes de nacimiento
    // o si es el mismo mes pero el día actual es menor al día de nacimiento
    if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) {
      anos--;
      meses += 12;
    }

    // Ajuste fino de meses si el día actual es menor al de nacimiento
    if (hoy.getDate() < nacimiento.getDate()) {
        meses--;
    }
    
    // Si meses quedó negativo tras el ajuste de días, corregir
    if (meses < 0) {
        meses += 12;
        // (Nota: años ya se restó arriba si era necesario)
    }

    setEdad({ años: anos, meses: meses });
  };

  // ================= LISTAS =================
  const provincias = ["Azuay", "Pichincha", "Guayas", "Manabí", "Loja", "Imbabura", "Cotopaxi"];
  const cantonesPorProvincia: Record<string, string[]> = {
    "Azuay": ["Cuenca", "Gualaceo", "Paute"],
    "Pichincha": ["Quito", "Cayambe", "Rumiñahui"],
    "Guayas": ["Guayaquil", "Daule", "Samborondón"]
  };
  const parroquiasPorCanton: Record<string, string[]> = {
    "Cuenca": ["El Vecino", "Tarqui", "Baños", "Totoracocha"],
    "Quito": ["Centro Histórico", "Carcelén", "Iñaquito"],
    "Guayaquil": ["Tarqui", "Ximena", "Kennedy"]
  };

  const parentescos = ["Madre", "Padre", "Abuelo/a", "Tío/a", "Hermano/a", "Otro/Tutor"];
  const nivelesEducativos = ["Ninguno", "Primaria", "Secundaria", "Superior / Universitario", "Postgrado"];

  // ================= ERRORES Y VALIDACIÓN =================
  const [errores, setErrores] = useState<Record<string, string>>({});

  const validarFormulario = () => {
    const e: Record<string, string> = {};
    if (!nombres) e.nombres = 'Campo obligatorio';
    if (!apellidos) e.apellidos = 'Campo obligatorio';
    if (!fechaAtencion) e.fechaAtencion = 'Campo obligatorio';
    if (!fechaNacimiento) e.fechaNacimiento = 'Campo obligatorio';
    if (!nombreResponsable) e.nombreResponsable = 'Campo obligatorio';
    if (!telefonoContacto) e.telefonoContacto = 'Campo obligatorio';

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // ================= GUARDAR =================
  const handleGuardarPaciente = () => {
    if (!validarFormulario()) {
      alert("Por favor complete los campos obligatorios.");
      return;
    }

    const nuevoId = uuidv4();

    const paciente = {
      id: nuevoId,
      cedula: nuevoId, 
      nombres, apellidos, fechaAtencion, fechaNacimiento,
      edad: edad ? `${edad.años} años, ${edad.meses} meses` : '',
      sexo, grupoEtnico, provincia, canton, parroquia, tipoSangre,
      filiacion: {
        nombreResponsable, parentesco, telefonoContacto,
        domicilioActual, nivelEducativoResponsable
      },
      historiaClinica: [] 
    };

    try {
      registrarPaciente(paciente as any);
      alert('Paciente registrado correctamente.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <>
      <h4 className="mb-4 text-primary"><i className="bi bi-person-lines-fill me-2"></i> Registro de Historia Clínica Pediátrica</h4>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'identificacion' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('identificacion')}>
            1. Datos de Identificación
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'filiacion' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('filiacion')}>
            2. Filiación y Contacto
          </button>
        </li>
      </ul>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          
          {/* ================= PESTAÑA 1: IDENTIFICACIÓN ================= */}
          {activeTab === 'identificacion' && (
            <div className="row g-3">
              <div className="col-12"><h6 className="text-muted border-bottom pb-2">Datos Personales</h6></div>
              
              <div className="col-md-6">
                <label className="form-label fw-bold small">NOMBRES</label>
                <input className={`form-control ${errores.nombres ? 'is-invalid' : ''}`} value={nombres} onChange={e => setNombres(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">APELLIDOS</label>
                <input className={`form-control ${errores.apellidos ? 'is-invalid' : ''}`} value={apellidos} onChange={e => setApellidos(e.target.value)} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-bold small">Fecha de Atención</label>
                <input type="date" className={`form-control ${errores.fechaAtencion ? 'is-invalid' : ''}`} value={fechaAtencion} onChange={e => setFechaAtencion(e.target.value)} />
              </div>
              
              {/* AQUÍ ESTÁ EL CAMBIO IMPORTANTE */}
              <div className="col-md-4">
                <label className="form-label fw-bold small">Fecha de Nacimiento</label>
                <input type="date" className={`form-control ${errores.fechaNacimiento ? 'is-invalid' : ''}`} value={fechaNacimiento} onChange={e => manejarFechaNacimiento(e.target.value)} />
              </div>
              
              <div className="col-md-4">
                <label className="form-label fw-bold small">Edad (Calculada)</label>
                <input 
                    className="form-control bg-light" 
                    disabled 
                    value={edad ? `${edad.años} años, ${edad.meses} meses` : 'Seleccione fecha...'} 
                    style={{ fontWeight: 'bold', color: '#0d6efd' }}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-bold small">Sexo</label>
                <select className="form-select" value={sexo} onChange={e => setSexo(e.target.value)}>
                  <option value="">Seleccione...</option>
                  <option>Masculino</option>
                  <option>Femenino</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold small">Tipo de Sangre</label>
                <select className="form-select" value={tipoSangre} onChange={e => setTipoSangre(e.target.value)}>
                  <option value="">Seleccione...</option>
                  <option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold small">Grupo Étnico / Raza</label>
                <select className="form-select" value={grupoEtnico} onChange={e => setGrupoEtnico(e.target.value)}>
                  <option value="">Seleccione...</option>
                  <option>Mestizo</option><option>Blanco</option><option>Indígena</option>
                  <option>Afroecuatoriano</option><option>Montubio</option><option>Otro</option>
                </select>
              </div>

              <div className="col-12 mt-4"><h6 className="text-muted border-bottom pb-2">Ubicación Geográfica</h6></div>
              
              <div className="col-md-4">
                <label className="form-label fw-bold small">Provincia</label>
                <select className="form-select" value={provincia} onChange={e => { setProvincia(e.target.value); setCanton(''); setParroquia('') }}>
                  <option value="">Seleccione...</option>
                  {provincias.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold small">Cantón</label>
                <select className="form-select" value={canton} onChange={e => { setCanton(e.target.value); setParroquia('') }} disabled={!provincia}>
                  <option value="">Seleccione...</option>
                  {provincia && cantonesPorProvincia[provincia]?.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold small">Parroquia</label>
                <select className="form-select" value={parroquia} onChange={e => setParroquia(e.target.value)} disabled={!canton}>
                  <option value="">Seleccione...</option>
                  {canton && parroquiasPorCanton[canton]?.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* ================= PESTAÑA 2: FILIACIÓN Y CONTACTO ================= */}
          {activeTab === 'filiacion' && (
            <div className="row g-3">
              <div className="col-12"><h6 className="text-muted border-bottom pb-2">Datos del Responsable / Tutor</h6></div>

              <div className="col-md-8">
                <label className="form-label fw-bold small">Nombre Completo del Padre/Madre/Tutor</label>
                <input className={`form-control ${errores.nombreResponsable ? 'is-invalid' : ''}`} value={nombreResponsable} onChange={e => setNombreResponsable(e.target.value)} placeholder="Nombres y Apellidos" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold small">Parentesco con el Paciente</label>
                <select className="form-select" value={parentesco} onChange={e => setParentesco(e.target.value)}>
                  <option value="">Seleccione...</option>
                  {parentescos.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold small">Número de Teléfono de Contacto</label>
                <input type="number" className={`form-control ${errores.telefonoContacto ? 'is-invalid' : ''}`} value={telefonoContacto} onChange={e => setTelefonoContacto(e.target.value)} placeholder="09..." />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold small">Nivel Educativo del Responsable</label>
                <select className="form-select" value={nivelEducativoResponsable} onChange={e => setNivelEducativoResponsable(e.target.value)}>
                  <option value="">Seleccione...</option>
                  {nivelesEducativos.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label fw-bold small">Domicilio Actual (Dirección Completa / Barrio)</label>
                <textarea className="form-control" rows={3} value={domicilioActual} onChange={e => setDomicilioActual(e.target.value)} placeholder="Ej: Calle Larga y Benigno Malo, Sector Centro Histórico..."></textarea>
              </div>
            </div>
          )}

        </div>
        
        <div className="card-footer bg-white text-end py-3">
          <button className="btn btn-success px-4 fw-bold" onClick={handleGuardarPaciente}>
            <i className="bi bi-save me-2"></i> GUARDAR PACIENTE
          </button>
        </div>
      </div>
    </>
  );
}