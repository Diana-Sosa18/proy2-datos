import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { useNavigate } from 'react-router-dom';

export default function NuevaVenta() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [clientes,  setClientes]  = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [carrito,   setCarrito]   = useState([]); // [{id_producto, nombre, precio, cantidad, stock}]
  const [selProd,   setSelProd]   = useState('');
  const [cantidad,  setCantidad]  = useState(1);
  const [msg, setMsg]             = useState({ type:'', text:'' });
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    Promise.all([apiFetch('/productos'), apiFetch('/clientes')])
      .then(([p, c]) => { setProductos(p); setClientes(c); });
  }, []);

  const addItem = () => {
    if (!selProd) return setMsg({ type:'error', text:'Selecciona un producto' });
    const prod = productos.find(p => p.id_producto == selProd);
    if (!prod) return;
    if (cantidad < 1) return setMsg({ type:'error', text:'Cantidad mínima: 1' });
    if (cantidad > prod.stock) return setMsg({ type:'error', text:`Stock insuficiente (máx ${prod.stock})` });

    setCarrito(prev => {
      const idx = prev.findIndex(i => i.id_producto === prod.id_producto);
      if (idx >= 0) {
        const updated = [...prev];
        const newCant = updated[idx].cantidad + parseInt(cantidad);
        if (newCant > prod.stock)
          return setMsg({ type:'error', text:`Stock insuficiente (máx ${prod.stock})` }) || prev;
        updated[idx] = { ...updated[idx], cantidad: newCant };
        return updated;
      }
      return [...prev, { id_producto: prod.id_producto, nombre: prod.nombre, precio: parseFloat(prod.precio), cantidad: parseInt(cantidad), stock: prod.stock }];
    });
    setMsg({ type:'', text:'' }); setSelProd(''); setCantidad(1);
  };

  const removeItem = (id) => setCarrito(prev => prev.filter(i => i.id_producto !== id));

  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const handleSubmit = async () => {
    if (!idCliente) return setMsg({ type:'error', text:'Selecciona un cliente' });
    if (carrito.length === 0) return setMsg({ type:'error', text:'Agrega al menos un producto' });
    setLoading(true); setMsg({ type:'', text:'' });
    try {
      const res = await apiFetch('/ventas', {
        method: 'POST',
        body: { id_cliente: parseInt(idCliente), items: carrito.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad })) },
      });
      setMsg({ type:'success', text:`✅ Venta #${res.id_venta} registrada por Q ${parseFloat(res.total).toFixed(2)}` });
      setTimeout(() => navigate('/ventas'), 1500);
    } catch (e) {
      // Muestra el error del ROLLBACK al usuario
      setMsg({ type:'error', text:`❌ Error (ROLLBACK): ${e.message}` });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 800, margin:'0 auto' }}>
      <h1 style={{ fontSize:'1.4rem', fontWeight:600, marginBottom:'1.5rem' }}>🧾 Nueva Venta</h1>

      {/* Cliente */}
      <div className="card" style={{ marginBottom:'1rem' }}>
        <h2 style={{ fontSize:'.95rem', marginBottom:'.8rem', color:'var(--text2)' }}>Cliente</h2>
        <select value={idCliente} onChange={e => setIdCliente(e.target.value)} style={{ maxWidth:360 }}>
          <option value="">Seleccionar cliente…</option>
          {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} {c.apellido}</option>)}
        </select>
      </div>

      {/* Agregar producto */}
      <div className="card" style={{ marginBottom:'1rem' }}>
        <h2 style={{ fontSize:'.95rem', marginBottom:'.8rem', color:'var(--text2)' }}>Agregar producto</h2>
        <div style={{ display:'flex', gap:'.75rem', flexWrap:'wrap' }}>
          <select value={selProd} onChange={e => setSelProd(e.target.value)} style={{ flex:2, minWidth:200 }}>
            <option value="">Seleccionar producto…</option>
            {productos.map(p => (
              <option key={p.id_producto} value={p.id_producto}>
                {p.nombre} — Q{parseFloat(p.precio).toFixed(2)} (stock: {p.stock})
              </option>
            ))}
          </select>
          <input type="number" min={1} value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            style={{ width:90 }} />
          <button className="btn-primary" onClick={addItem}>Agregar</button>
        </div>
      </div>

      {/* Carrito */}
      <div className="card" style={{ marginBottom:'1rem' }}>
        <h2 style={{ fontSize:'.95rem', marginBottom:'.8rem', color:'var(--text2)' }}>Carrito</h2>
        {carrito.length === 0
          ? <p style={{ color:'var(--text2)', fontSize:'.9rem' }}>Sin productos aún…</p>
          : (
            <table>
              <thead>
                <tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr>
              </thead>
              <tbody>
                {carrito.map(i => (
                  <tr key={i.id_producto}>
                    <td>{i.nombre}</td>
                    <td>Q {i.precio.toFixed(2)}</td>
                    <td>{i.cantidad}</td>
                    <td style={{ fontWeight:600 }}>Q {(i.precio * i.cantidad).toFixed(2)}</td>
                    <td><button className="btn-danger" style={{ padding:'.2rem .5rem', fontSize:'.8rem' }} onClick={() => removeItem(i.id_producto)}>✕</button></td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} style={{ textAlign:'right', fontWeight:600, paddingTop:'1rem' }}>Total:</td>
                  <td colSpan={2} style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--success)', paddingTop:'1rem' }}>Q {total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          )}
      </div>

      {msg.text && (
        <div className={`card ${msg.type==='error'?'':''}` } style={{ marginBottom:'1rem', borderColor: msg.type==='error'?'var(--danger)':'var(--success)' }}>
          <p className={msg.type==='error'?'error-msg':'success-msg'} style={{ fontSize:'1rem' }}>{msg.text}</p>
        </div>
      )}

      <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end' }}>
        <button className="btn-ghost" onClick={() => navigate('/ventas')}>Cancelar</button>
        <button className="btn-success" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Procesando…' : 'Confirmar venta'}
        </button>
      </div>
    </div>
  );
}
