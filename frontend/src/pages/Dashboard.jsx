import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [ventas, setVentas]       = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([apiFetch('/ventas'), apiFetch('/productos')])
      .then(([v, p]) => { setVentas(v); setProductos(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalMes  = ventas.filter(v => {
    const d = new Date(v.fecha);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, v) => s + parseFloat(v.total), 0);

  const bajoStock = productos.filter(p => p.stock < 30).length;

  const stats = [
    { label: 'Ventas totales', value: ventas.length, icon: '🧾', color: 'var(--accent)' },
    { label: 'Ingresos este mes', value: `Q ${totalMes.toFixed(2)}`, icon: '💰', color: 'var(--success)' },
    { label: 'Productos', value: productos.length, icon: '📦', color: 'var(--accent2)' },
    { label: 'Bajo stock', value: bajoStock, icon: '⚠️', color: 'var(--warning)' },
  ];

  if (loading) return <p style={{ color:'var(--text2)' }}>Cargando…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:600 }}>Dashboard</h1>
        <Link to="/ventas/nueva"><button className="btn-primary">+ Nueva venta</button></Link>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
            <span style={{ fontSize:'1.8rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:'1.4rem', fontWeight:600, color: s.color }}>{s.value}</div>
              <div style={{ fontSize:'.8rem', color:'var(--text2)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ fontSize:'1rem', marginBottom:'1rem' }}>Últimas ventas</h2>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Fecha</th><th>Cliente</th><th>Empleado</th><th>Total</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ventas.slice(0,8).map(v => (
              <tr key={v.id_venta}>
                <td style={{ color:'var(--text2)' }}>{v.id_venta}</td>
                <td>{new Date(v.fecha).toLocaleDateString('es-GT')}</td>
                <td>{v.cliente}</td>
                <td>{v.empleado}</td>
                <td style={{ fontWeight:500 }}>Q {parseFloat(v.total).toFixed(2)}</td>
                <td><span className="badge badge-success">{v.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
