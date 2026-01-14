import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="card p-4 shadow" style={{ width: 400 }}>
        <h4 className="text-center mb-3">Ingreso al Sistema HCE</h4>

        <input className="form-control mb-2" placeholder="Usuario" />
        <input className="form-control mb-3" type="password" placeholder="Contraseña" />

        <button className="btn btn-primary w-100" onClick={() => navigate('/dashboard')}>
          Ingresar
        </button>
      </div>
    </div>
  )
}
