import { useEffect, useState, useContext } from 'react';
import { apiFetch } from '../api.js';
import { Link } from 'react-router-dom';
import { AuthCtx } from '../App.jsx';

export default function Ventas() {
  const { user } = useContext(AuthCtx);
  const [ventas, setVentas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState('');

  const puedeCrear  = ['admin', 'gerente', 'cajero'].includes(user?.rol);
  const puedeAnular = ['admin', 'gerente'].includes(user?.rol);

  const load = () =>
    apiFetch('/ventas').then(setVentas).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleAnular = async (id) => {
    if (!confirm(`¿Anular la venta #${id}? Se restaurará el stock de los productos.`)) return;
    try {
      await apiFetch(`/ventas/${id}/anular`, { method: 'POST' });
      setMsg(`Venta #${id} anulada. Stock restaurado.`);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      alert(e.message);
    }
  };

  const badgeEstado = (estado) =>
    estado === 'anulada' ? 'badge-danger' : 'badge-success';

  if (loading) return <p style={{ color:'var(--text2)' }}>Cargando…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:600 }}>🧾 Ventas</h1>
        {puedeCrear && (
          <Link to="/ventas/nueva"><button className="btn-primary">+ Nueva venta</button></Link>
        )}
      </div>

      {msg && (
        <div className="card" style={{ marginBottom:'1rem', color:'var(--success)', fontWeight:500 }}>
          {msg}
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Fecha</th><th>Cliente</th><th>Empleado</th>
              <th>Productos</th><th>Total</th><th>Estado</th>
              {puedeAnular && <th>Acción</th>}
            </tr>
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
                <td><span className={`badge ${badgeEstado(v.estado)}`}>{v.estado}</span></td>
                {puedeAnular && (
                  <td>
                    {v.estado !== 'anulada' && (
                      <button
                        className="btn-danger"
                        style={{ padding:'.3rem .6rem', fontSize:'.8rem' }}
                        onClick={() => handleAnular(v.id_venta)}
                      >
                        Anular
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
