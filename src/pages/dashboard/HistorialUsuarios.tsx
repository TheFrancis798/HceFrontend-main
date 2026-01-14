import { useState, useEffect } from "react";
import { obtenerLogs } from "../../services/logStorage";

export default function HistorialUsuarios() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    setLogs(obtenerLogs());
  }, []);

  return (
    <div>
      <h4>Historial de Actividad</h4>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Acción</th>
            <th>Paciente</th>
            <th>Fecha/Hora</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <tr key={i}>
              <td>{log.usuario}</td>
              <td>{log.accion}</td>
              <td>{log.paciente}</td>
              <td>{log.fecha}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
