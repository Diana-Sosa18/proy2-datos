CREATE TABLE IF NOT EXISTS categorias (
    id_categoria  SERIAL       PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    descripcion   TEXT
);

CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor SERIAL       PRIMARY KEY,
    nombre       VARCHAR(150) NOT NULL,
    telefono     VARCHAR(20),
    email        VARCHAR(150),
    direccion    TEXT
);

CREATE TABLE IF NOT EXISTS productos (
    id_producto  SERIAL          PRIMARY KEY,
    nombre       VARCHAR(150)    NOT NULL,
    descripcion  TEXT,
    precio       NUMERIC(10,2)   NOT NULL CHECK (precio >= 0),
    stock        INTEGER         NOT NULL DEFAULT 0 CHECK (stock >= 0),
    id_categoria INTEGER         NOT NULL REFERENCES categorias(id_categoria),
    id_proveedor INTEGER         NOT NULL REFERENCES proveedores(id_proveedor)
);

CREATE TABLE IF NOT EXISTS empleados (
    id_empleado   SERIAL       PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    apellido      VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    rol           VARCHAR(50)  NOT NULL DEFAULT 'cajero'
                               CHECK (rol IN ('admin','gerente','cajero','inventario','reportes')),
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS clientes (
    id_cliente SERIAL       PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    apellido   VARCHAR(100) NOT NULL,
    email      VARCHAR(150),
    telefono   VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS ventas (
    id_venta    SERIAL          PRIMARY KEY,
    fecha       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    total       NUMERIC(10,2)   NOT NULL DEFAULT 0,
    estado      VARCHAR(30)     NOT NULL DEFAULT 'completada',
    id_cliente  INTEGER         NOT NULL REFERENCES clientes(id_cliente),
    id_empleado INTEGER         NOT NULL REFERENCES empleados(id_empleado)
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
    id_detalle      SERIAL        PRIMARY KEY,
    id_venta        INTEGER       NOT NULL REFERENCES ventas(id_venta),
    id_producto     INTEGER       NOT NULL REFERENCES productos(id_producto),
    cantidad        INTEGER       NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal        NUMERIC(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(id_categoria);
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(id_proveedor);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(id_cliente);

CREATE OR REPLACE VIEW vista_resumen_ventas AS
SELECT
    v.id_venta,
    v.fecha,
    v.total,
    v.estado,
    c.nombre     || ' ' || c.apellido  AS cliente,
    e.nombre     || ' ' || e.apellido  AS empleado,
    COUNT(dv.id_detalle)               AS num_productos
FROM ventas v
JOIN clientes  c  ON c.id_cliente  = v.id_cliente
JOIN empleados e  ON e.id_empleado = v.id_empleado
JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
GROUP BY v.id_venta, v.fecha, v.total, v.estado, cliente, empleado
ORDER BY v.fecha DESC;