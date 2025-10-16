# 🏐 Spikeshop – E-commerce de Vóley

## 📋 Descripción General

**Spikeshop** es un sitio e-commerce especializado en productos de vóley, desarrollado como parte del **Desafío Profesional Fullstack (Sprint 6)**.  
Durante esta iteración se migró completamente el proyecto desde archivos JSON a una **base de datos relacional MySQL**, utilizando **Sequelize ORM** para la gestión de modelos, migraciones, seeders y CRUDs.

---

## 🧠 Objetivo del Sprint

- Implementar la base de datos `spikeshop` en MySQL.
- Crear y relacionar las tablas `users`, `products`, `categories` y `brands`.
- Conectar los controladores del sitio al ORM **Sequelize**.
- Implementar CRUDs reales para **usuarios** y **productos**.
- Incorporar un sistema de **roles** (`admin`, `customer`) y autenticación completa.
- Proteger rutas administrativas con middlewares.

---

## ⚙️ Tecnologías utilizadas

| Área | Tecnología |
|------|-------------|
| Lenguaje principal | JavaScript (Node.js / Express) |
| Base de datos | MySQL (XAMPP) |
| ORM | Sequelize |
| Autenticación | express-session, bcryptjs, cookie-parser |
| Motor de vistas | EJS |
| Front-end | Tailwind CSS |
| Control de archivos | Multer |
| Diagrama DER | draw.io / dbdiagram.io |

---

## 🧩 Estructura del Proyecto

```
Spikeshop/
├── config/
│   └── config.json
├── controllers/
│   ├── productsController.js
│   └── usersController.js
├── database/
│   ├── migrations/
│   ├── models/
│   └── seeders/
├── middlewares/
│   ├── isAdmin.js
│   ├── multerProducts.js
│   └── multerUsers.js
├── public/
│   ├── img/
│   └── css/
├── routes/
│   ├── productsRoutes.js
│   └── usersRoutes.js
├── views/
│   ├── users/
│   ├── productos/
│   └── partials/
├── structure.sql
├── DER-Spikeshop.pdf
└── README.md
```

---

## 🧱 Base de Datos

### Tablas principales:
- **users**
  - id, first_name, last_name, email, password, role, image, timestamps
- **categories**
  - id, name, timestamps
- **brands**
  - id, name, timestamps
- **products**
  - id, name, description, price, stock, image, category_id, brand_id, user_id, timestamps

### Relaciones:
- 1️⃣ Un **usuario** puede crear muchos **productos**.  
- 1️⃣ Una **categoría** tiene muchos **productos**.  
- 1️⃣ Una **marca** tiene muchos **productos**.

Relaciones implementadas en Sequelize:
```js
User.hasMany(Product, { as: 'products', foreignKey: 'user_id' });
Product.belongsTo(User, { as: 'creator', foreignKey: 'user_id' });
Category.hasMany(Product, { as: 'products', foreignKey: 'category_id' });
Brand.hasMany(Product, { as: 'products', foreignKey: 'brand_id' });
```

---

## 💽 Scripts principales

### 1️⃣ Crear base de datos
```bash
npx sequelize-cli db:create
```

### 2️⃣ Ejecutar migraciones
```bash
npx sequelize-cli db:migrate
```

### 3️⃣ Cargar datos iniciales (seeders)
```bash
npx sequelize-cli db:seed:all
```

### 4️⃣ Iniciar el servidor
```bash
npm start
```

Luego ingresá en tu navegador a:
```
http://localhost:3000
```

---

## 👤 Usuarios de prueba

| Rol | Email | Contraseña |
|------|--------|-------------|
| 🛠️ Administrador | admin@spikeshop.com | 123456 |
| 👟 Cliente | cliente@spikeshop.com | 123456 |

---

## 🔒 Roles y permisos

| Rol | Permisos |
|-----|-----------|
| **Admin** | Puede crear, editar y eliminar productos. Accede a rutas protegidas. |
| **Customer** | Puede navegar, ver productos, y acceder a su perfil. |

Middleware `isAdmin.js` protege las rutas administrativas:
```js
if (req.session.userLogged.role !== 'admin') {
  return res.status(403).render('users/error', {
    message: 'No tienes permisos para acceder a esta sección.'
  });
}
```

---

## 🎨 Vistas Principales

| Vista | Descripción |
|--------|--------------|
| `/users/register` | Registro de usuario con validaciones y subida de imagen. |
| `/users/login` | Inicio de sesión con bcrypt y cookie “Recuérdame”. |
| `/users/profile` | Perfil dinámico (muestra rol e imagen). |
| `/productos` | Listado de productos desde MySQL. |
| `/productos/create` | Formulario de creación (solo admin). |
| `/productos/edit/:id` | Edición de producto (solo admin). |
| `/productos/:slug` | Detalle del producto. |

---

## 🧾 Entregables del Sprint

| Archivo | Descripción |
|----------|--------------|
| `DER-Spikeshop.pdf` | Diagrama Entidad–Relación completo. |
| `structure.sql` | Script de creación de la base. |
| `seeders/` | Datos iniciales. |
| `models/` | Modelos Sequelize. |
| `controllers/` | CRUDs con Sequelize. |
| `README.md` | Documentación del proyecto. |

---

## 🧠 Autor

**Desarrollado por:**  
👤 *Esteban Cejas – Spikeshop Project*  
🎓 Curso: *Desarrollo Fullstack (Sprint 6 – Base de Datos con Sequelize)*  
🏫 Universidad Católica de Santiago del Estero  

---

## 🏁 Estado del Proyecto

✅ Base de datos migrada a Sequelize  
✅ CRUDs de usuarios y productos funcionando  
✅ Roles (admin / customer) implementados  
✅ Middlewares y autenticación activa  
✅ Documentación completa  
✅ Listo para entrega del Sprint 6 🚀
