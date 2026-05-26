import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const ROLES = ['admin', 'gerente', 'cajero', 'inventario', 'reportes'];
const empty = { nombre:'', apellido:'', email:'', rol:'cajero' };

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

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(empty);
  const [msg, setMsg]             = useState({ type:'', text:'' });
  const [loading, setLoading]     = useState(true);

  const load = () =>
    apiFetch('/empleados')
      .then(setEmpleados)
      .catch(e => setMsg({ type:'error', text: e.message }))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(empty); setModal('form'); setMsg({ type:'', text:'' }); };

  const handleSave = async () => {
    if (!form.nombre || !form.apellido || !form.email || !form.rol)
      return setMsg({ type:'error', text: 'Todos los campos son requeridos' });
    try {
      await apiFetch('/empleados', { method: 'POST', body: form });
      setMsg({ type:'success', text: 'Empleado creado' });
      load();
      setTimeout(() => setModal(null), 800);
    } catch (e) { setMsg({ type:'error', text: e.message }); }
  };

  const badgeColor = (rol) => ({
    admin:      '#e53e3e',
    gerente:    '#dd6b20',
    cajero:     '#3182ce',
    inventario: '#319795',
    reportes:   '#6b46c1',
  }[rol] || '#718096');

  if (loading) return <p style={{ color:'var(--text2)' }}>Cargando…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:600 }}>👤 Empleados</h1>
        <button className="btn-primary" onClick={openCreate}>+ Nuevo empleado</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Email</th><th>Rol</th></tr>
          </thead>
          <tbody>
            {empleados.map(e => (
              <tr key={e.id_empleado}>
                <td style={{ fontWeight:500 }}>{e.nombre} {e.apellido}</td>
                <td style={{ color:'var(--text2)' }}>{e.email}</td>
                <td>
                  <span style={{
                    padding:'.25rem .6rem', borderRadius:'9999px', fontSize:'.75rem',
                    fontWeight:600, color:'#fff', background: badgeColor(e.rol), textTransform:'capitalize'
                  }}>
                    {e.rol}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'form' && (
        <Modal title="Nuevo empleado" onClose={() => setModal(null)}>
          {[
            { key:'nombre',   label:'Nombre' },
            { key:'apellido', label:'Apellido' },
            { key:'email',    label:'Email' },
          ].map(({ key, label }) => (
            <div key={key} className="form-row">
              <label>{label}</label>
              <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div className="form-row">
            <label>Rol</label>
            <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
              {ROLES.map(r => <option key={r} value={r} style={{ textTransform:'capitalize' }}>{r}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Contraseña temporal</label>
            <input type="password" placeholder="Mínimo 6 caracteres"
              value={form.password || ''}
              onChange={e => setForm({ ...form, password: e.target.value })} />
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
