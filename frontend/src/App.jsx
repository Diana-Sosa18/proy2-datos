import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import Login      from './pages/Login.jsx';
import Dashboard  from './pages/Dashboard.jsx';
import Productos  from './pages/Productos.jsx';
import Clientes   from './pages/Clientes.jsx';
import Ventas     from './pages/Ventas.jsx';
import NuevaVenta from './pages/NuevaVenta.jsx';
import Reportes   from './pages/Reportes.jsx';

export const AuthCtx = createContext(null);

function Layout({ children }) {
  const { user, logout } = useContext(AuthCtx);
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <nav style={{
        width: 220, background:'var(--bg2)', borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column', padding:'1.5rem 1rem', gap:'.25rem', flexShrink:0
      }}>
        <div style={{ fontSize:'1.1rem', fontWeight:600, color:'var(--accent)', marginBottom:'2rem', paddingLeft:'.5rem' }}>
          🏪 TiendaApp
        </div>
        {[
          ['/', '📊 Dashboard'],
          ['/productos', '📦 Productos'],
          ['/clientes', '👥 Clientes'],
          ['/ventas', '🧾 Ventas'],
          ['/reportes', '📈 Reportes'],
        ].map(([to, label]) => (
          <NavLink key={to} to={to} end={to==='/'} style={({ isActive }) => ({
            padding:'.6rem .75rem', borderRadius:'var(--radius)', fontSize:'.9rem',
            color: isActive ? 'var(--accent)' : 'var(--text2)',
            background: isActive ? 'rgba(79,142,247,.12)' : 'transparent',
            display:'block'
          })}>
            {label}
          </NavLink>
        ))}
        <div style={{ marginTop:'auto', paddingTop:'1rem', borderTop:'1px solid var(--border)' }}>
          <div style={{ fontSize:'.8rem', color:'var(--text2)', marginBottom:'.5rem', paddingLeft:'.5rem' }}>
            {user?.nombre} · <span style={{ color:'var(--accent)' }}>{user?.rol}</span>
          </div>
          <button className="btn-ghost" style={{ width:'100%' }} onClick={logout}>Cerrar sesión</button>
        </div>
      </nav>
      <main style={{ flex:1, padding:'2rem', overflowY:'auto' }}>{children}</main>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user } = useContext(AuthCtx);
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tienda_user')); } catch { return null; }
  });

  const login = (data) => {
    localStorage.setItem('tienda_token', data.token);
    localStorage.setItem('tienda_user', JSON.stringify(data.empleado));
    setUser(data.empleado);
  };
  const logout = () => {
    localStorage.removeItem('tienda_token');
    localStorage.removeItem('tienda_user');
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/"          element={<PrivateRoute><Dashboard  /></PrivateRoute>} />
          <Route path="/productos" element={<PrivateRoute><Productos  /></PrivateRoute>} />
          <Route path="/clientes"  element={<PrivateRoute><Clientes   /></PrivateRoute>} />
          <Route path="/ventas"    element={<PrivateRoute><Ventas     /></PrivateRoute>} />
          <Route path="/ventas/nueva" element={<PrivateRoute><NuevaVenta /></PrivateRoute>} />
          <Route path="/reportes"  element={<PrivateRoute><Reportes   /></PrivateRoute>} />
          <Route path="*"          element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthCtx.Provider>
  );
}
