import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { Link } from 'react-router-dom';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/ventas').then(setVentas).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color:'var(--text2)' }}>Cargando…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:600 }}>🧾 Ventas</h1>
        <Link to="/ventas/nueva"><button className="btn-primary">+ Nueva venta</button></Link>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Empleado</th><th>Productos</th><th>Total</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {ventas.map(v => (
              <tr key={v.id_venta}>
                <td style={{ color:'var(--text2)', fontFamily:'DM Mono, monospace', fontSize:'.85rem' }}>{v.id_venta}</td>
                <td>{new Date(v.fecha).toLocaleString('es-GT', { dateStyle:'short', timeStyle:'short' })}</td>
                <td style={{ fontWeight:500 }}>{v.cliente}</td>
                <td style={{ color:'var(--text2)' }}>{v.empleado}</td>
                <td><span className="badge badge-info">{v.num_productos}</span></td>
                <td style={{ fontWeight:600, color:'var(--success)' }}>Q {parseFloat(v.total).toFixed(2)}</td>
                <td><span className="badge badge-success">{v.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
