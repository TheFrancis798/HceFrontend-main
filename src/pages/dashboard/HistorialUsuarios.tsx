import { useState, useEffect } from "react";
import { obtenerLogs } from "../../services/logStorage";

export default function HistorialUsuarios() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const data = obtenerLogs();
    setLogs(Array.isArray(data) ? data : []);
  }, []);

  const formatearFecha = (fecha: any) => {
    if (!fecha) return "—";
    try {
      return new Date(fecha).toLocaleString();
    } catch {
      return "—";
    }
  };

  return (
    <div>
      <h4>Historial de Actividad</h4>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Acción</th>
            <th>Paciente</th>
            <th>Fecha / Hora</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center" }}>
                No hay actividad registrada
              </td>
            </tr>
          ) : (
            logs.map((log, i) => (
              <tr key={i}>
                <td>{log?.usuario || "Desconocido"}</td>
                <td>{log?.accion || "—"}</td>
                <td>{log?.paciente || "—"}</td>
                <td>{formatearFecha(log?.fecha)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
