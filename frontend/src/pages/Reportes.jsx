import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

function exportCSV(data, filename) {
  if (!data.length) return alert('Sin datos para exportar');
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(r => Object.values(r).map(v => `"${v}"`).join(','));
  const csv  = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reportes() {
  const [tab, setTab] = useState('categorias');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const endpoints = {
    categorias: { path:'/reportes/ventas-por-categoria', label:'Ventas por categoría',  desc:'GROUP BY + HAVING + agregación', filename:'ventas_categoria.csv' },
    top:        { path:'/reportes/top-productos',        label:'Top 10 productos',       desc:'CTE (WITH)',                    filename:'top_productos.csv' },
    clientes:   { path:'/reportes/clientes-activos',     label:'Clientes activos 90d',   desc:'Subquery EXISTS',               filename:'clientes_activos.csv' },
    empleados:  { path:'/reportes/ventas-por-empleado',  label:'Ventas por empleado',    desc:'JOIN múltiple + agregación',    filename:'ventas_empleado.csv' },
  };

  useEffect(() => {
    setLoading(true); setData([]);
    apiFetch(endpoints[tab].path).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [tab]);

  const current = endpoints[tab];

  const renderTable = () => {
    if (!data.length) return <p style={{ color:'var(--text2)' }}>Sin datos</p>;
    const keys = Object.keys(data[0]);
    return (
      <table>
        <thead><tr>{keys.map(k => <th key={k}>{k.replace(/_/g,' ')}</th>)}</tr></thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {keys.map(k => (
                <td key={k}>
                  {typeof row[k] === 'number' && k.includes('ingreso') || k.includes('total') || k.includes('gastado') || k.includes('promedio') || k.includes('facturado')
                    ? `Q ${parseFloat(row[k]).toFixed(2)}`
                    : row[k] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:600 }}>📈 Reportes</h1>
        <button className="btn-success" onClick={() => exportCSV(data, current.filename)}>
          ⬇ Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'.5rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        {Object.entries(endpoints).map(([key, val]) => (
          <button key={key}
            className={tab === key ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setTab(key)}
            style={{ padding:'.45rem .9rem', fontSize:'.85rem' }}>
            {val.label}
          </button>
        ))}
      </div>

      {/* Info de la query */}
      <div className="card" style={{ marginBottom:'1rem', borderColor:'rgba(79,142,247,.3)' }}>
        <p style={{ fontSize:'.85rem', color:'var(--accent)' }}>
          <strong>SQL usado:</strong> {current.desc}
        </p>
      </div>

      <div className="card">
        {loading ? <p style={{ color:'var(--text2)' }}>Cargando…</p> : renderTable()}
      </div>
    </div>
  );
}
