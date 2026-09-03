# CRM Backend

API REST del sistema CRM: clientes, interacciones, usuarios (auth con roles) y métricas.

## Stack

- Node.js + Express
- Sequelize (ORM) + MySQL
- JWT para autenticación, bcrypt para contraseñas

## 1. Requisitos previos

- Node.js instalado (v18+)
- MySQL instalado (puedes usar **XAMPP** si quieres algo simple con interfaz gráfica, o MySQL Workbench)

## 2. Instalación

Abre esta carpeta en VS Code, luego en la terminal integrada:

```bash
npm install
```

## 3. Configurar variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` con los datos de tu MySQL local (usuario, password, nombre de la BD).
Luego crea la base de datos vacía en MySQL:

```sql
CREATE DATABASE crm_db;
```

(No necesitas correr `schema.sql` a mano: Sequelize crea las tablas automáticamente
al iniciar el servidor gracias a `sequelize.sync()`. El archivo `database/schema.sql`
solo queda como referencia/documentación.)

## 4. Levantar el servidor

```bash
npm run dev
```

Deberías ver:

```
✅ Conexión a la base de datos establecida.
✅ Modelos sincronizados con la base de datos.
🚀 Servidor CRM corriendo en http://localhost:4000
```

## 5. Probar la API (con Postman, Thunder Client o curl)

### Registrar un usuario admin

```
POST http://localhost:4000/auth/register
Body: { "nombre": "Jose", "correo": "jose@crm.com", "password": "123456", "rol": "admin" }
```

### Iniciar sesión (te devuelve un token)

```
POST http://localhost:4000/auth/login
Body: { "correo": "jose@crm.com", "password": "123456" }
```

Copia el `token` de la respuesta. En todas las siguientes peticiones agrega el header:

```
Authorization: Bearer <token>
```

### Crear un cliente

```
POST http://localhost:4000/clientes
Body: { "nombre": "Empresa X", "correo": "contacto@empresax.com", "telefono": "4491234567", "empresa": "Empresa X" }
```

### Listar clientes (con búsqueda y filtro)

```
GET http://localhost:4000/clientes?busqueda=empresa&estado=activo&etapa_crm=Prospecto
```

### Registrar una interacción

```
POST http://localhost:4000/interacciones
Body: { "cliente_id": 1, "tipo": "llamada", "descripcion": "Primer contacto" }
```

### Ver historial de un cliente

```
GET http://localhost:4000/clientes/1/interacciones
```

### Cambiar etapa CRM

```
PUT http://localhost:4000/clientes/1/etapa
Body: { "etapa_crm": "Activo" }
```

### Ver métricas

```
GET http://localhost:4000/metricas
```

## Endpoints completos

| Método | Ruta                          | Descripción                          | Auth requerida |
|--------|-------------------------------|---------------------------------------|-----------------|
| POST   | /auth/register                | Crear usuario                        | No |
| POST   | /auth/login                   | Iniciar sesión                       | No |
| POST   | /clientes                     | Crear cliente                        | Sí |
| GET    | /clientes                     | Listar clientes (busqueda/estado/etapa)| Sí |
| GET    | /clientes/:id                 | Detalle de cliente                   | Sí |
| PUT    | /clientes/:id                 | Editar cliente                       | Sí |
| DELETE | /clientes/:id                 | Eliminar cliente                     | Sí (solo admin) |
| PUT    | /clientes/:id/etapa           | Cambiar etapa CRM                    | Sí |
| GET    | /clientes/:id/interacciones   | Historial de interacciones           | Sí |
| POST   | /interacciones                | Registrar interacción                | Sí |
| GET    | /metricas                     | Indicadores generales del CRM        | Sí |

## Siguientes pasos (frontend)

Cuando compartas las capturas o el código exportado de tu diseño en Figma, conecto
estos endpoints directamente a tus formularios, tabla de clientes y dashboard.
