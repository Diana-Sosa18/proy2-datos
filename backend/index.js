const express = require('express');
const cors    = require('cors');
const { sequelize } = require('./models');

const { router: authRouter } = require('./routes/auth');
const productosRouter        = require('./routes/productos');
const ventasRouter           = require('./routes/ventas');
const reportesRouter         = require('./routes/reportes');
const entidadesRouter        = require('./routes/entidades');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth',      authRouter);
app.use('/api/productos', productosRouter);
app.use('/api/ventas',    ventasRouter);
app.use('/api/reportes',  reportesRouter);
app.use('/api',           entidadesRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

sequelize.authenticate()
  .then(() => {
    console.log('Conexión ORM (Sequelize) establecida correctamente.');
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('No se pudo conectar a la base de datos:', err);
    process.exit(1);
  });
