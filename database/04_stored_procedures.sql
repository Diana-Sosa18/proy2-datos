-- ============================================================
-- Stored Procedures – Proyecto 3
-- ============================================================

-- ============================================================
-- SP 1: registrar_venta
--   Registra una venta completa con sus detalles.
--   Incluye transacción explícita con ROLLBACK ante stock
--   insuficiente o producto inexistente.
--   Parámetros IN:  p_id_cliente, p_id_empleado, p_items (JSON)
--   Parámetro OUT: p_id_venta
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_venta(
  p_id_cliente  INTEGER,
  p_id_empleado INTEGER,
  p_items       JSONB,
  OUT p_id_venta INTEGER,
  OUT p_total    NUMERIC(10,2),
  OUT p_error    TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
  v_item        JSONB;
  v_producto    RECORD;
  v_cantidad    INTEGER;
  v_id_producto INTEGER;
  v_total       NUMERIC(10,2) := 0;
BEGIN
  p_error := NULL;

  -- Validar que existan items
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    p_error := 'La venta debe tener al menos un producto';
    p_id_venta := NULL;
    p_total := 0;
    RETURN;
  END IF;

  BEGIN
    -- Verificar stock y calcular total
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_id_producto := (v_item->>'id_producto')::INTEGER;
      v_cantidad    := (v_item->>'cantidad')::INTEGER;

      SELECT id_producto, nombre, precio, stock
        INTO v_producto
        FROM productos
       WHERE id_producto = v_id_producto
         FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto % no existe', v_id_producto;
      END IF;

      IF v_producto.stock < v_cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para "%": disponible %, solicitado %',
          v_producto.nombre, v_producto.stock, v_cantidad;
      END IF;

      v_total := v_total + (v_producto.precio * v_cantidad);
    END LOOP;

    -- Crear cabecera de venta
    INSERT INTO ventas (total, id_cliente, id_empleado)
    VALUES (v_total, p_id_cliente, p_id_empleado)
    RETURNING id_venta INTO p_id_venta;

    -- Insertar detalles y actualizar stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_id_producto := (v_item->>'id_producto')::INTEGER;
      v_cantidad    := (v_item->>'cantidad')::INTEGER;

      SELECT precio INTO v_producto FROM productos WHERE id_producto = v_id_producto;

      INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario)
      VALUES (p_id_venta, v_id_producto, v_cantidad, v_producto.precio);

      UPDATE productos SET stock = stock - v_cantidad
       WHERE id_producto = v_id_producto;
    END LOOP;

    p_total := v_total;

  EXCEPTION WHEN OTHERS THEN
    p_error    := SQLERRM;
    p_id_venta := NULL;
    p_total    := 0;
    RAISE;  -- propaga para que el caller haga ROLLBACK
  END;
END;
$$;


-- ============================================================
-- SP 2: crear_producto
--   Crea un producto nuevo con validación de precio y stock.
--   Parámetros IN: todos los campos del producto
--   Parámetro OUT: id del producto creado
-- ============================================================
CREATE OR REPLACE FUNCTION crear_producto(
  p_nombre       VARCHAR(150),
  p_descripcion  TEXT,
  p_precio       NUMERIC(10,2),
  p_stock        INTEGER,
  p_id_categoria INTEGER,
  p_id_proveedor INTEGER,
  OUT p_id_producto INTEGER,
  OUT p_error       TEXT
)
LANGUAGE plpgsql AS $$
BEGIN
  p_error := NULL;

  IF p_precio < 0 THEN
    p_error := 'El precio no puede ser negativo';
    p_id_producto := NULL;
    RETURN;
  END IF;

  IF p_stock < 0 THEN
    p_error := 'El stock no puede ser negativo';
    p_id_producto := NULL;
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM categorias WHERE id_categoria = p_id_categoria) THEN
    p_error := 'Categoría no existe';
    p_id_producto := NULL;
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM proveedores WHERE id_proveedor = p_id_proveedor) THEN
    p_error := 'Proveedor no existe';
    p_id_producto := NULL;
    RETURN;
  END IF;

  INSERT INTO productos (nombre, descripcion, precio, stock, id_categoria, id_proveedor)
  VALUES (p_nombre, p_descripcion, p_precio, p_stock, p_id_categoria, p_id_proveedor)
  RETURNING id_producto INTO p_id_producto;

EXCEPTION WHEN OTHERS THEN
  p_error := SQLERRM;
  p_id_producto := NULL;
END;
$$;


-- ============================================================
-- SP 3: actualizar_stock
--   Ajusta el stock de un producto.
--   Rechaza si el resultado sería negativo (ROLLBACK implícito).
--   Parámetros IN/OUT: id_producto, delta (positivo=entrada, negativo=salida)
-- ============================================================
CREATE OR REPLACE FUNCTION actualizar_stock(
  p_id_producto INTEGER,
  p_delta       INTEGER,
  OUT p_stock_nuevo INTEGER,
  OUT p_error       TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
  v_stock_actual INTEGER;
BEGIN
  p_error := NULL;

  SELECT stock INTO v_stock_actual
    FROM productos
   WHERE id_producto = p_id_producto
     FOR UPDATE;

  IF NOT FOUND THEN
    p_error := 'Producto no encontrado';
    p_stock_nuevo := NULL;
    RETURN;
  END IF;

  IF v_stock_actual + p_delta < 0 THEN
    p_error := format('Stock insuficiente: actual=%s, ajuste=%s', v_stock_actual, p_delta);
    p_stock_nuevo := v_stock_actual;
    RAISE EXCEPTION '%', p_error;
  END IF;

  UPDATE productos SET stock = stock + p_delta
   WHERE id_producto = p_id_producto
  RETURNING stock INTO p_stock_nuevo;

EXCEPTION WHEN OTHERS THEN
  p_error := SQLERRM;
  p_stock_nuevo := NULL;
END;
$$;


-- ============================================================
-- SP 4: anular_venta
--   Cambia el estado de una venta a 'anulada' y devuelve
--   el stock de los productos. Usa transacción con ROLLBACK.
--   Parámetro IN:  p_id_venta
--   Parámetro OUT: p_error
-- ============================================================
CREATE OR REPLACE FUNCTION anular_venta(
  p_id_venta INTEGER,
  OUT p_error TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
  v_detalle RECORD;
  v_estado  VARCHAR(30);
BEGIN
  p_error := NULL;

  BEGIN
    SELECT estado INTO v_estado
      FROM ventas
     WHERE id_venta = p_id_venta
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Venta % no existe', p_id_venta;
    END IF;

    IF v_estado = 'anulada' THEN
      RAISE EXCEPTION 'La venta % ya está anulada', p_id_venta;
    END IF;

    -- Devolver stock
    FOR v_detalle IN
      SELECT id_producto, cantidad FROM detalle_ventas WHERE id_venta = p_id_venta
    LOOP
      UPDATE productos
         SET stock = stock + v_detalle.cantidad
       WHERE id_producto = v_detalle.id_producto;
    END LOOP;

    UPDATE ventas SET estado = 'anulada' WHERE id_venta = p_id_venta;

  EXCEPTION WHEN OTHERS THEN
    p_error := SQLERRM;
    RAISE;  -- fuerza ROLLBACK en el caller
  END;
END;
$$;


-- ============================================================
-- SP 5: reporte_ventas_periodo
--   Genera un resumen de ventas en un rango de fechas.
--   Solo lectura; útil para el rol_reportes y rol_gerente.
--   Parámetros IN: p_desde, p_hasta
-- ============================================================
CREATE OR REPLACE FUNCTION reporte_ventas_periodo(
  p_desde TIMESTAMPTZ,
  p_hasta TIMESTAMPTZ
)
RETURNS TABLE (
  mes              TEXT,
  total_ventas     BIGINT,
  ingresos         NUMERIC(12,2),
  ticket_promedio  NUMERIC(12,2),
  productos_vendidos BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(v.fecha, 'YYYY-MM')          AS mes,
    COUNT(DISTINCT v.id_venta)           AS total_ventas,
    SUM(v.total)                         AS ingresos,
    ROUND(AVG(v.total), 2)               AS ticket_promedio,
    SUM(dv.cantidad)                     AS productos_vendidos
  FROM ventas v
  JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
  WHERE v.fecha BETWEEN p_desde AND p_hasta
    AND v.estado != 'anulada'
  GROUP BY TO_CHAR(v.fecha, 'YYYY-MM')
  ORDER BY mes;
END;
$$;


-- ============================================================
-- SP 6: crear_empleado (bonus – usado en seed de roles)
--   Crea un empleado con validación de rol permitido.
--   Parámetros IN: campos del empleado
--   Parámetro OUT: id creado
-- ============================================================
CREATE OR REPLACE FUNCTION crear_empleado(
  p_nombre        VARCHAR(100),
  p_apellido      VARCHAR(100),
  p_email         VARCHAR(150),
  p_rol           VARCHAR(50),
  p_password_hash VARCHAR(255),
  OUT p_id_empleado INTEGER,
  OUT p_error       TEXT
)
LANGUAGE plpgsql AS $$
BEGIN
  p_error := NULL;

  IF p_rol NOT IN ('admin', 'gerente', 'cajero', 'inventario', 'reportes') THEN
    p_error := format('Rol "%s" no es válido', p_rol);
    p_id_empleado := NULL;
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM empleados WHERE email = p_email) THEN
    p_error := 'Ya existe un empleado con ese email';
    p_id_empleado := NULL;
    RETURN;
  END IF;

  INSERT INTO empleados (nombre, apellido, email, rol, password_hash)
  VALUES (p_nombre, p_apellido, p_email, p_rol, p_password_hash)
  RETURNING id_empleado INTO p_id_empleado;

EXCEPTION WHEN OTHERS THEN
  p_error := SQLERRM;
  p_id_empleado := NULL;
END;
$$;
