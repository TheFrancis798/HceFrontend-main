import type { Paciente } from "../models/Paciente";

const STORAGE_KEY = "hce_pacientes";


export const obtenerPacientes = (): Paciente[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};


const guardarPacientes = (pacientes: Paciente[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes));
};


export const registrarPaciente = (paciente: Paciente) => {
  const pacientes = obtenerPacientes();
  const existe = pacientes.some(p => p.cedula === paciente.cedula);
  if (existe) {
    throw new Error("El paciente ya está registrado");
  }
  pacientes.push(paciente);
  guardarPacientes(pacientes);
};


export const buscarPacientePorCedula = (cedula: string): Paciente | undefined => {
  return obtenerPacientes().find(p => p.cedula === cedula);
};


export const agregarConsulta = (cedula: string, nuevaConsulta: any) => {
  const pacientes = obtenerPacientes();
  const index = pacientes.findIndex(p => p.cedula === cedula);

  if (index !== -1) {
    const pacienteActual: any = pacientes[index];
    if (!pacienteActual.historiaClinica) {
        pacienteActual.historiaClinica = [];
    }
    pacienteActual.historiaClinica.push(nuevaConsulta);
    guardarPacientes(pacientes);
    return true;
  }
  return false;
};


export const actualizarConsultaExistente = (cedula: string, consultaEditada: any) => {
  const pacientes = obtenerPacientes();
  const index = pacientes.findIndex(p => p.cedula === cedula);

  if (index !== -1) {
    const paciente = pacientes[index];
    
    if (paciente.historiaClinica) {
     
      const consultaIndex = paciente.historiaClinica.findIndex((c: any) => c.id === consultaEditada.id);
      
      if (consultaIndex !== -1) {
        
        paciente.historiaClinica[consultaIndex] = consultaEditada;
        guardarPacientes(pacientes);
        return true;
      }
    }
  }
  return false;
};