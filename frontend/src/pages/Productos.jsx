import { useEffect, useState, useContext } from 'react';
import { apiFetch } from '../api.js';
import { AuthCtx } from '../AuthContext.js';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

const empty = { nombre:'', descripcion:'', precio:'', stock:'0', id_categoria:'', id_proveedor:'' };

export default function Productos() {
  const { user } = useContext(AuthCtx);
  const puedeEditar   = ['admin', 'gerente', 'inventario'].includes(user?.rol);
  const puedeEliminar = user?.rol === 'admin';

  const [productos,   setProductos]   = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [modal, setModal]             = useState(null); // null | 'create' | 'edit'
  const [form,  setForm]              = useState(empty);
  const [editId, setEditId]           = useState(null);
  const [msg, setMsg]                 = useState({ type:'', text:'' });
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);

  const load = () =>
    Promise.all([
      apiFetch('/productos'),
      apiFetch('/categorias'),
      apiFetch('/proveedores'),
    ]).then(([p, c, pr]) => { setProductos(p); setCategorias(c); setProveedores(pr); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(empty); setEditId(null); setModal('form'); setMsg({ type:'', text:'' }); };
  const openEdit   = (p)  => {
    setForm({ nombre: p.nombre, descripcion: p.descripcion||'', precio: p.precio, stock: p.stock, id_categoria: p.id_categoria, id_proveedor: p.id_proveedor });
    setEditId(p.id_producto); setModal('form'); setMsg({ type:'', text:'' });
  };

  const handleSave = async () => {
    if (!form.nombre || !form.precio || !form.id_categoria || !form.id_proveedor)
      return setMsg({ type:'error', text:'Nombre, precio, categoría y proveedor son requeridos' });
    try {
      if (editId) await apiFetch(`/productos/${editId}`, { method:'PUT', body: form });
      else        await apiFetch('/productos', { method:'POST', body: form });
      setMsg({ type:'success', text: editId ? 'Producto actualizado' : 'Producto creado' });
      load();
      setTimeout(() => setModal(null), 800);
    } catch (e) { setMsg({ type:'error', text: e.message }); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await apiFetch(`/productos/${id}`, { method:'DELETE' });
      load();
    } catch (e) { alert(e.message); }
  };

  const filtered = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p style={{ color:'var(--text2)' }}>Cargando…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:600 }}>📦 Productos</h1>
        {puedeEditar && <button className="btn-primary" onClick={openCreate}>+ Nuevo producto</button>}
      </div>

      <div className="card" style={{ marginBottom:'1rem' }}>
        <input placeholder="Buscar por nombre o categoría…" value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nombre</th><th>Categoría</th><th>Proveedor</th><th>Precio</th><th>Stock</th>
              {(puedeEditar || puedeEliminar) && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id_producto}>
                <td style={{ fontWeight:500 }}>{p.nombre}</td>
                <td><span className="badge badge-info">{p.categoria}</span></td>
                <td style={{ color:'var(--text2)' }}>{p.proveedor}</td>
                <td>Q {parseFloat(p.precio).toFixed(2)}</td>
                <td>
                  <span className={`badge ${p.stock < 10 ? 'badge-danger' : p.stock < 30 ? 'badge-warning' : 'badge-success'}`}>
                    {p.stock}
                  </span>
                </td>
                {(puedeEditar || puedeEliminar) && (
                  <td style={{ display:'flex', gap:'.5rem' }}>
                    {puedeEditar && (
                      <button className="btn-ghost" style={{ padding:'.3rem .6rem', fontSize:'.8rem' }} onClick={() => openEdit(p)}>Editar</button>
                    )}
                    {puedeEliminar && (
                      <button className="btn-danger" style={{ padding:'.3rem .6rem', fontSize:'.8rem' }} onClick={() => handleDelete(p.id_producto)}>Eliminar</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Editar producto' : 'Nuevo producto'} onClose={() => setModal(null)}>
          {['nombre','descripcion','precio','stock'].map(f => (
            <div key={f} className="form-row">
              <label style={{ textTransform:'capitalize' }}>{f}</label>
              <input type={['precio','stock'].includes(f) ? 'number' : 'text'}
                value={form[f]} onChange={e => setForm({...form, [f]: e.target.value})} />
            </div>
          ))}
          <div className="form-row">
            <label>Categoría</label>
            <select value={form.id_categoria} onChange={e => setForm({...form, id_categoria: e.target.value})}>
              <option value="">Seleccionar…</option>
              {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Proveedor</label>
            <select value={form.id_proveedor} onChange={e => setForm({...form, id_proveedor: e.target.value})}>
              <option value="">Seleccionar…</option>
              {proveedores.map(p => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>)}
            </select>
          </div>
          {msg.text && <p className={msg.type === 'error' ? 'error-msg' : 'success-msg'}>{msg.text}</p>}
          <div className="form-actions">
            <button className="btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave}>Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
