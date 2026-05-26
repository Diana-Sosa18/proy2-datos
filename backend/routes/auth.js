const router   = require('express').Router();
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const { Empleado } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña requeridos' });

  try {
    // ORM: findOne en lugar de query raw
    const empleado = await Empleado.findOne({ where: { email } });
    if (!empleado)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const match = await bcrypt.compare(password, empleado.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: empleado.id_empleado, rol: empleado.rol, nombre: empleado.nombre },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      empleado: { id: empleado.id_empleado, nombre: empleado.nombre, rol: empleado.rol },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/logout', (req, res) => {
  // JWT es stateless; el cliente elimina el token
  res.json({ message: 'Sesión cerrada' });
});

// Middleware de autenticación
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Middleware de autorización por roles
function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (!roles.includes(req.user.rol))
      return res.status(403).json({ error: `Acceso denegado. Roles permitidos: ${roles.join(', ')}` });
    next();
  };
}

module.exports = { router, authMiddleware, requireRol };
