import { useState, useContext } from 'react';
import { AuthCtx } from '../App.jsx';

export default function Login() {
  const { login } = useContext(AuthCtx);
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div className="card" style={{ width: 360 }}>
        <h1 style={{ fontSize:'1.4rem', marginBottom:'.4rem' }}>🏪 TiendaApp</h1>
        <p style={{ color:'var(--text2)', fontSize:'.9rem', marginBottom:'1.8rem' }}>Inicia sesión para continuar</p>

        <div className="form-row">
          <label>Correo electrónico</label>
          <input type="email" placeholder="usuario@tienda.com"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div className="form-row">
          <label>Contraseña</label>
          <input type="password" placeholder="••••••••"
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button className="btn-primary" style={{ width:'100%', marginTop:'1.2rem', padding:'.7rem' }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>

        <p style={{ color:'var(--text2)', fontSize:'.8rem', marginTop:'1rem', textAlign:'center' }}>
          Demo: cmendoza@tienda.com / password123
        </p>
      </div>
    </div>
  );
}
