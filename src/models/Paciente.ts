export interface Paciente {
  id: string;               // UUID o cédula
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: string;

  // 👇 todo lo que ya tienes en RegistroPaciente
  // NO CAMBIES NOMBRES, SOLO SE USA COMO CONTENEDOR
  [key: string]: any;
}
