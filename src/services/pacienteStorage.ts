import type { Paciente } from "../models/Paciente";

const STORAGE_KEY = "hce_pacientes";

/* Obtener pacientes */
export const obtenerPacientes = (): Paciente[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

/* Guardar lista completa */
const guardarPacientes = (pacientes: Paciente[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes));
};

/* Registrar paciente nuevo */
export const registrarPaciente = (paciente: Paciente) => {
  const pacientes = obtenerPacientes();

  // Evitar duplicados por cédula
  const existe = pacientes.some(p => p.cedula === paciente.cedula);
  if (existe) {
    throw new Error("El paciente ya está registrado");
  }

  pacientes.push(paciente);
  guardarPacientes(pacientes);
};

/* Buscar paciente por cédula */
export const buscarPacientePorCedula = (cedula: string): Paciente | undefined => {
  return obtenerPacientes().find(p => p.cedula === cedula);
};

// --- ESTA ES LA FUNCIÓN QUE TE FALTA Y CAUSA EL ERROR ROJO ---
export const agregarConsulta = (cedula: string, nuevaConsulta: any) => {
  const pacientes = obtenerPacientes();
  const index = pacientes.findIndex((p: any) => p.cedula == cedula);

  if (index !== -1) {
    // Si no tiene historial, lo inicializamos como array vacío
    if (!pacientes[index].historiaClinica) {
      pacientes[index].historiaClinica = [];
    }
    
    // Agregamos la nueva consulta
    pacientes[index].historiaClinica.push(nuevaConsulta);
    
    // Guardamos en localStorage
    guardarPacientes(pacientes);
    return true;
  }
  return false;
};