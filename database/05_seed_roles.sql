-- ============================================================
-- Usuarios de prueba – uno por cada rol (Proyecto 3)
-- Password para todos: "password123"
-- Hash generado con bcrypt rounds=10
-- ============================================================

INSERT INTO empleados (nombre, apellido, email, rol, password_hash)
VALUES
  ('Admin',      'Sistema',   'admin@tienda.com',      'admin',      '$2b$10$/FArhJlbFXLmdo/p4LK3V..XPUSKH0Hk0L5NG3iotrVPw8oifb956'),
  ('Gerente',    'Prueba',    'gerente@tienda.com',    'gerente',    '$2b$10$/FArhJlbFXLmdo/p4LK3V..XPUSKH0Hk0L5NG3iotrVPw8oifb956'),
  ('Cajero',     'Prueba',    'cajero@tienda.com',     'cajero',     '$2b$10$/FArhJlbFXLmdo/p4LK3V..XPUSKH0Hk0L5NG3iotrVPw8oifb956'),
  ('Inventario', 'Prueba',    'inventario@tienda.com', 'inventario', '$2b$10$/FArhJlbFXLmdo/p4LK3V..XPUSKH0Hk0L5NG3iotrVPw8oifb956'),
  ('Reportes',   'Prueba',    'reportes@tienda.com',   'reportes',   '$2b$10$/FArhJlbFXLmdo/p4LK3V..XPUSKH0Hk0L5NG3iotrVPw8oifb956')
ON CONFLICT (email) DO NOTHING;
