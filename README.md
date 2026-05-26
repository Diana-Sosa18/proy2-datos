# Tienda App – Proyecto 3 (cc3088 Bases de Datos 1)

Aplicación web de gestión de inventario y ventas con seguridad a nivel de base de datos: roles, permisos granulares, stored procedures y ORM (Sequelize).

## Levantar el proyecto

```bash
# 1. Copiar variables de entorno
cp .env.example .env   # ya tiene las credenciales fijas: proy3 / secret

# 2. Levantar todo con Docker
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5432

## Credenciales de calificación

| Variable | Valor |
|---|---|
| DB_USER | proy3 |
| DB_PASSWORD | secret |
| DB_NAME | tienda_db |

## Usuarios de prueba (uno por rol)

| Email | Contraseña | Rol |
|---|---|---|
| admin@tienda.com | password123 | admin |
| gerente@tienda.com | password123 | gerente |
| cajero@tienda.com | password123 | cajero |
| inventario@tienda.com | password123 | inventario |
| reportes@tienda.com | password123 | reportes |

## Roles y permisos (Proyecto 3)

| Rol | Tablas con acceso completo | Restricciones |
|---|---|---|
| **rol_admin** | Todas | Ninguna |
| **rol_gerente** | productos, ventas, clientes, categorias, proveedores, empleados (lectura) | No puede borrar empleados |
| **rol_cajero** | productos (solo stock), ventas, detalle_ventas, clientes | No accede a reportes ni empleados |
| **rol_inventario** | productos, categorias, proveedores | No accede a ventas ni empleados |
| **rol_reportes** | Todas (solo SELECT) | Solo lectura |

## Stored Procedures

| SP | Descripción |
|---|---|
| `registrar_venta(id_cliente, id_empleado, items JSON)` | Registra venta con transacción + ROLLBACK en stock insuficiente |
| `crear_producto(...)` | Crea producto con validación de integridad |
| `actualizar_stock(id_producto, delta)` | Ajusta stock con validación (IN/OUT + excepciones) |
| `anular_venta(id_venta)` | Anula venta y restaura stock (ROLLBACK si ya anulada) |
| `reporte_ventas_periodo(desde, hasta)` | Resumen de ventas por período |
| `crear_empleado(...)` | Crea empleado con validación de rol y email único |

## Tecnologías

- **Backend**: Node.js + Express + Sequelize ORM + pg
- **Frontend**: React + Vite
- **DB**: PostgreSQL 16
- **Infraestructura**: Docker Compose
