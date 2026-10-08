# CRM + SCM Backend

API REST del sistema: CRM (clientes, interacciones, usuarios) + módulo SCM
(productos, proveedores, inventario, pedidos, métricas, madurez).

## Stack

- Node.js + Express
- Sequelize (ORM) + MySQL
- JWT para autenticación, bcrypt para contraseñas

## Instalación

```bash
npm install
cp .env.example .env     # ajusta usuario/contraseña de tu MySQL
```

Crea la base de datos vacía en MySQL (por ejemplo desde phpMyAdmin): `CREATE DATABASE crm_db;`
Las tablas las crea Sequelize automáticamente al iniciar.
Al iniciar el backend, los productos existentes se actualizan automáticamente para tener
un stock mínimo de cinco unidades. El SQL `database/20261007_stock_minimo.sql` está disponible
para aplicar ese ajuste manualmente si se requiere.
Para reemplazar las categorías antiguas por categorías de productos de limpieza en una base
existente, ejecuta `database/20261007_categorias_limpieza.sql` una sola vez.

Para establecer una sola vez el stock actual de todos los productos en diez unidades y registrar
el ajuste en movimientos, ejecuta `npm run ajustar:stock10` desde `crm-backend` con la conexión
a la base de datos configurada en `.env`.

```bash
npm run dev
```

## Permisos

**Las operaciones de escritura SCM son exclusivas del rol `admin`**. Los usuarios
autenticados también pueden consultar `GET /productos` y `GET /productos/:id` para
mostrar el catálogo; las demás operaciones SCM requieren rol `admin`.

## Endpoints — CRM

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| POST | /auth/register | Crear usuario | — |
| POST | /auth/login | Iniciar sesión | — |
| GET | /auth/me | Mi perfil | cualquiera |
| POST/GET | /clientes | Crear / listar clientes | admin |
| GET/PUT/DELETE | /clientes/:id | Detalle / editar / eliminar | admin |
| PUT | /clientes/:id/etapa | Cambiar etapa CRM | admin |
| GET | /clientes/:id/interacciones | Historial del cliente | admin |
| POST | /interacciones | Registrar interacción | admin |
| GET | /interacciones/mias | Mi actividad | cualquiera |
| GET | /metricas | Métricas del CRM | admin |

## Endpoints — SCM (nuevo)

| Método | Ruta | Descripción |
|---|---|---|
| POST/GET | /proveedores | Crear / listar proveedores (`?busqueda=`) |
| GET/PUT/DELETE | /proveedores/:id | Detalle / editar / eliminar |
| POST/GET | /productos | Crear / listar productos (`?busqueda=&categoria=&estrategia_logistica=`) |
| GET/PUT/DELETE | /productos/:id | Detalle / editar / eliminar |
| PUT | /productos/:id/estrategia | Cambiar PUSH/PULL |
| POST/GET | /movimientos | Registrar / listar movimientos (`?tipo=&producto_id=`) — ajusta el stock automáticamente |
| POST/GET | /pedidos | Crear / listar pedidos (`?estado=&tipo=`) — folio autogenerado `PC-001`, `PC-002`... |
| PUT | /pedidos/:id | Editar cantidad/tipo/notas |
| PUT | /pedidos/:id/estado | Cambiar estado (pendiente/en_proceso/surtido/cancelado) |
| DELETE | /pedidos/:id | Eliminar |
| GET | /scm/metricas | Dashboard SCM: totales, stock bajo, más vendidos, rotación, push vs pull |
| GET/PUT | /scm/madurez | Checklist y nivel de madurez SCM |

### Notas sobre las métricas SCM

- **Rotación de inventario**: se calcula por producto como `salidas / (stock_actual + salidas)`.
  Es una definición simplificada y ajustable — te la señalo por si tu profesor pide una fórmula distinta.
- **Comparativa PUSH vs PULL mensual** (la gráfica de barras por mes del diseño): no está incluida
  todavía porque requiere guardar un histórico mensual que el modelo actual no lleva. Si la necesitas,
  es un módulo adicional pequeño (una tabla de snapshots mensuales).
- **stock_actual de un producto NO se edita directamente** desde `PUT /productos/:id` — solo cambia
  a través de `/movimientos`, para que el historial de inventario sea siempre la fuente de verdad.
- Todos los productos tienen un stock mínimo de cinco unidades y deben estar ligados a un proveedor.
- Al eliminar un producto o proveedor se eliminan también sus pedidos y movimientos relacionados; al eliminar
  un proveedor también se eliminan los productos que dependen de él, previa confirmación en la interfaz.
- Una salida que deje un producto PUSH por debajo del mínimo crea un pedido automático, evitando duplicarlo
  mientras haya otro pedido abierto. Los pedidos de reposición PULL se capturan manualmente.
- El pedido queda registrado en movimientos como pendiente; al cambiarlo a `surtido`, se registra la entrada
  real y se actualiza el stock.
