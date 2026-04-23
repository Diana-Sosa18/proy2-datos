const router  = require('express').Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña requeridos' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM empleados WHERE email = $1',
      [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const empleado = rows[0];
    const match = await bcrypt.compare(password, empleado.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: empleado.id_empleado, rol: empleado.rol, nombre: empleado.nombre },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, empleado: { id: empleado.id_empleado, nombre: empleado.nombre, rol: empleado.rol } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

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

module.exports = { router, authMiddleware };