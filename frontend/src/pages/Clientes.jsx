import { useEffect, useState, useContext } from 'react';
import { apiFetch } from '../api.js';
import { AuthCtx } from '../AuthContext.js';

const empty = { nombre:'', apellido:'', email:'', telefono:'' };

export default function Clientes() {
  const { user } = useContext(AuthCtx);
  const [clientes, setClientes] = useState([]);
  const [modal, setModal]       = useState(false);
  const [form,  setForm]        = useState(empty);
  const [editId, setEditId]     = useState(null);
  const [msg, setMsg]           = useState({ type:'', text:'' });
  const [search, setSearch]     = useState('');

  const puedeEditar  = ['admin', 'gerente', 'cajero'].includes(user?.rol);
  const puedeEliminar = user?.rol === 'admin';

  const load = () => apiFetch('/clientes').then(setClientes);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(empty); setEditId(null); setModal(true); setMsg({ type:'', text:'' }); };
  const openEdit   = c  => {
    setForm({ nombre:c.nombre, apellido:c.apellido, email:c.email||'', telefono:c.telefono||'' });
    setEditId(c.id_cliente); setModal(true); setMsg({ type:'', text:'' });
  };

  const handleSave = async () => {
    if (!form.nombre || !form.apellido)
      return setMsg({ type:'error', text:'Nombre y apellido son requeridos' });
    try {
      if (editId) await apiFetch(`/clientes/${editId}`, { method:'PUT', body: form });
      else        await apiFetch('/clientes', { method:'POST', body: form });
      setMsg({ type:'success', text: editId ? 'Cliente actualizado' : 'Cliente creado' });
      load(); setTimeout(() => setModal(false), 700);
    } catch (e) { setMsg({ type:'error', text: e.message }); }
  };

  const handleDelete = async id => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try { await apiFetch(`/clientes/${id}`, { method:'DELETE' }); load(); }
    catch (e) { alert(e.message); }
  };

  const filtered = clientes.filter(c =>
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.email||'').toLowerCase().includes(search.toLowerCase())
  );

  const hayAcciones = puedeEditar || puedeEliminar;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:600 }}>👥 Clientes</h1>
        {puedeEditar && (
          <button className="btn-primary" onClick={openCreate}>+ Nuevo cliente</button>
        )}
      </div>

      <div className="card" style={{ marginBottom:'1rem' }}>
        <input placeholder="Buscar por nombre o correo…" value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nombre</th><th>Correo</th><th>Teléfono</th>
              {hayAcciones && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id_cliente}>
                <td style={{ fontWeight:500 }}>{c.nombre} {c.apellido}</td>
                <td style={{ color:'var(--text2)' }}>{c.email || '—'}</td>
                <td>{c.telefono || '—'}</td>
                {hayAcciones && (
                  <td style={{ display:'flex', gap:'.5rem' }}>
                    {puedeEditar && (
                      <button className="btn-ghost" style={{ padding:'.3rem .6rem', fontSize:'.8rem' }} onClick={() => openEdit(c)}>
                        Editar
                      </button>
                    )}
                    {puedeEliminar && (
                      <button className="btn-danger" style={{ padding:'.3rem .6rem', fontSize:'.8rem' }} onClick={() => handleDelete(c.id_cliente)}>
                        Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            {[['nombre','Nombre'],['apellido','Apellido'],['email','Correo'],['telefono','Teléfono']].map(([f,l]) => (
              <div key={f} className="form-row">
                <label>{l}</label>
                <input type={f==='email'?'email':'text'} value={form[f]} onChange={e => setForm({...form,[f]:e.target.value})} />
              </div>
            ))}
            {msg.text && <p className={msg.type==='error'?'error-msg':'success-msg'}>{msg.text}</p>}
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
