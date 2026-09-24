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

```bash
npm run dev
```

## Permisos

**Todo el módulo SCM es exclusivo del rol `admin`** (igual que Clientes,
Interacciones y Métricas del CRM). El rol `usuario` solo tiene acceso a
`/auth/me` y `/interacciones/mias`. Si más adelante quieres que el rol
`usuario` vea, por ejemplo, el inventario en modo lectura, es un cambio
pequeño (agregar la ruta a la lista de excepciones en `routes/`).

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

## Siguientes pasos

El front-end (14 pantallas del módulo SCM) todavía no está conectado — lo hacemos en la próxima sesión,
siguiendo el mismo patrón que usamos para el CRM.
