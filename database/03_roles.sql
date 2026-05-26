-- ============================================================
-- Roles y permisos del sistema (Proyecto 3)
-- Credenciales fijas de calificación: proy3 / secret
-- ============================================================

-- Usuario principal de la aplicación
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'proy3') THEN
    CREATE USER proy3 WITH PASSWORD 'secret';
  END IF;
END $$;

-- ============================================================
-- REVOKE permisos públicos por defecto antes de asignar
-- granularmente (buena práctica de seguridad + requerido)
-- ============================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- ============================================================
-- 1. rol_admin  – acceso total a todas las tablas
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_admin') THEN
    CREATE ROLE rol_admin;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rol_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO rol_admin;

-- ============================================================
-- 2. rol_gerente – lectura total + modificar productos/ventas;
--                  NO puede borrar empleados ni alterar roles
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_gerente') THEN
    CREATE ROLE rol_gerente;
  END IF;
END $$;

GRANT SELECT ON categorias, proveedores, productos, clientes,
               ventas, detalle_ventas, empleados, vista_resumen_ventas TO rol_gerente;
GRANT INSERT, UPDATE ON productos TO rol_gerente;
GRANT INSERT, UPDATE ON ventas, detalle_ventas TO rol_gerente;
GRANT INSERT, UPDATE ON clientes TO rol_gerente;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_gerente;
-- REVOKE explícito: gerente no puede eliminar productos ni empleados
REVOKE DELETE ON productos   FROM rol_gerente;
REVOKE DELETE ON empleados   FROM rol_gerente;
REVOKE DELETE ON clientes    FROM rol_gerente;
REVOKE DELETE ON ventas      FROM rol_gerente;
REVOKE DELETE ON detalle_ventas FROM rol_gerente;

-- ============================================================
-- 3. rol_cajero – puede registrar ventas y ver productos/clientes;
--                 no puede ver reportes ni gestionar empleados
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_cajero') THEN
    CREATE ROLE rol_cajero;
  END IF;
END $$;

GRANT SELECT ON productos, categorias, clientes, ventas, detalle_ventas TO rol_cajero;
GRANT INSERT ON ventas, detalle_ventas TO rol_cajero;
GRANT UPDATE (stock) ON productos TO rol_cajero;
GRANT INSERT ON clientes TO rol_cajero;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_cajero;
-- REVOKE explícito: cajero no accede a empleados ni puede borrar nada
REVOKE ALL ON empleados   FROM rol_cajero;
REVOKE ALL ON proveedores FROM rol_cajero;
REVOKE DELETE ON clientes FROM rol_cajero;

-- ============================================================
-- 4. rol_inventario – gestión de productos, categorías y proveedores;
--                     no accede a ventas ni empleados
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_inventario') THEN
    CREATE ROLE rol_inventario;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON productos, categorias, proveedores TO rol_inventario;
GRANT SELECT ON ventas, detalle_ventas TO rol_inventario;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_inventario;
-- REVOKE explícito: inventario no puede modificar ventas ni ver empleados
REVOKE INSERT, UPDATE, DELETE ON ventas         FROM rol_inventario;
REVOKE INSERT, UPDATE, DELETE ON detalle_ventas FROM rol_inventario;
REVOKE ALL ON empleados FROM rol_inventario;
REVOKE ALL ON clientes  FROM rol_inventario;

-- ============================================================
-- 5. rol_reportes – solo lectura de datos para generar reportes
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_reportes') THEN
    CREATE ROLE rol_reportes;
  END IF;
END $$;

GRANT SELECT ON categorias, proveedores, productos, clientes,
               ventas, detalle_ventas, empleados, vista_resumen_ventas TO rol_reportes;
-- REVOKE explícito: reportes es estrictamente solo lectura
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM rol_reportes;

-- ============================================================
-- Asignar rol_admin al usuario proy3 (conexión de la app)
-- ============================================================
GRANT rol_admin TO proy3;
GRANT ALL PRIVILEGES ON DATABASE tienda_db TO proy3;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO proy3;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO proy3;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO proy3;
