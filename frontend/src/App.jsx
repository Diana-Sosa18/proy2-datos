import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useState, useContext } from 'react';
import { AuthCtx } from './AuthContext.js';
import Login      from './pages/Login.jsx';
import Dashboard  from './pages/Dashboard.jsx';
import Productos  from './pages/Productos.jsx';
import Clientes   from './pages/Clientes.jsx';
import Ventas     from './pages/Ventas.jsx';
import NuevaVenta from './pages/NuevaVenta.jsx';
import Reportes   from './pages/Reportes.jsx';
import Empleados  from './pages/Empleados.jsx';


// Permisos de navegación por rol
const NAV_ITEMS = [
  { to: '/',          label: '📊 Dashboard',  roles: ['admin','gerente','cajero','inventario','reportes'] },
  { to: '/productos', label: '📦 Productos',  roles: ['admin','gerente','cajero','inventario','reportes'] },
  { to: '/clientes',  label: '👥 Clientes',   roles: ['admin','gerente','cajero'] },
  { to: '/ventas',    label: '🧾 Ventas',     roles: ['admin','gerente','cajero','reportes'] },
  { to: '/reportes',  label: '📈 Reportes',   roles: ['admin','gerente','reportes'] },
  { to: '/empleados', label: '👤 Empleados',  roles: ['admin'] },
];

function Layout({ children }) {
  const { user, logout } = useContext(AuthCtx);
  const navVisible = NAV_ITEMS.filter(item => item.roles.includes(user?.rol));

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <nav style={{
        width: 220, background:'var(--bg2)', borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column', padding:'1.5rem 1rem', gap:'.25rem', flexShrink:0
      }}>
        <div style={{ fontSize:'1.1rem', fontWeight:600, color:'var(--accent)', marginBottom:'2rem', paddingLeft:'.5rem' }}>
          🏪 TiendaApp
        </div>
        {navVisible.map(({ to, label }) => (
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
            {user?.nombre} · <span style={{ color:'var(--accent)', textTransform:'capitalize' }}>{user?.rol}</span>
          </div>
          <button className="btn-ghost" style={{ width:'100%' }} onClick={logout}>Cerrar sesión</button>
        </div>
      </nav>
      <main style={{ flex:1, padding:'2rem', overflowY:'auto' }}>{children}</main>
    </div>
  );
}

// Ruta privada: requiere login
function PrivateRoute({ children }) {
  const { user } = useContext(AuthCtx);
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

// Ruta protegida por rol
function RoleRoute({ children, roles }) {
  const { user } = useContext(AuthCtx);
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.rol)) return <Forbidden />;
  return <Layout>{children}</Layout>;
}

function Forbidden() {
  return (
    <div style={{ textAlign:'center', padding:'4rem' }}>
      <h2 style={{ color:'var(--danger, #e53e3e)' }}>⛔ Acceso denegado</h2>
      <p style={{ color:'var(--text2)' }}>Tu rol no tiene permiso para ver esta página.</p>
    </div>
  );
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

          {/* Accesible por todos los roles autenticados */}
          <Route path="/"          element={<PrivateRoute><Dashboard  /></PrivateRoute>} />
          <Route path="/productos" element={<PrivateRoute><Productos  /></PrivateRoute>} />

          {/* Solo cajero, gerente y admin pueden ver/crear clientes */}
          <Route path="/clientes"  element={
            <RoleRoute roles={['admin','gerente','cajero']}><Clientes /></RoleRoute>
          } />

          {/* Ventas: cajero, gerente, admin y reportes */}
          <Route path="/ventas"    element={
            <RoleRoute roles={['admin','gerente','cajero','reportes']}><Ventas /></RoleRoute>
          } />
          <Route path="/ventas/nueva" element={
            <RoleRoute roles={['admin','gerente','cajero']}><NuevaVenta /></RoleRoute>
          } />

          {/* Reportes: solo admin, gerente y reportes */}
          <Route path="/reportes"  element={
            <RoleRoute roles={['admin','gerente','reportes']}><Reportes /></RoleRoute>
          } />

          {/* Empleados: solo admin */}
          <Route path="/empleados" element={
            <RoleRoute roles={['admin']}><Empleados /></RoleRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthCtx.Provider>
  );
}
