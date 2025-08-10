# 🛠️ Sprint 4 - Avances y Mejoras

## 🚀 Decisión de avanzar directamente
Me emocione y me puse a trabajar directamente en el Sprint 4. Antes había simulado una base de datos dentro de `app.js` para que funcione la edición de productos, pero al leer el Sprint 4, me di cuenta de que podía usar archivos `.json` para manejar los datos de forma más ordenada y eficiente.

---

## 📦 Mejora en la gestión de productos

- Reemplacé la creación manual de archivos `.ejs` para cada producto por una **plantilla dinámica**.
- Ahora uso una sola vista que se **rellena con los datos del producto**, tanto para:
  - Detalle de producto
  - Edición de producto

Esto hizo que todo sea mucho más cómodo y eficiente.

---

## 🛒 Funcionalidades implementadas

- ✅ **Carrito de compras** funcionando  
- 🔍 **Barra de búsqueda** activa  
- 👤 **Registro de usuarios** guardado en `users.json`  
- 📤 **Subida de productos** guardada en `products.json` y visible en la página de productos  
- 🗑️ **Eliminación de productos** funcionando correctamente  
- ✏️ **Edición de productos** funcionando al 100% (99% seguro 😅)

---

## 📁 Archivos utilizados

- `users.json` → para guardar usuarios registrados  
- `products.json` → para guardar productos subidos  

---

## 🧩 Implementación del patrón MVC

Para mejorar la estructura del proyecto y facilitar la escalabilidad, implementé el patrón **Modelo-Vista-Controlador (MVC)**:

- 📂 **routes/**  
  - `mainRoutes.js`  
  - `productsRoutes.js`  
  - `usersRoutes.js`

- 📂 **controllers/**  
  - `mainController.js`  
  - `productsController.js`  
  - `usersController.js`

Además, modifiqué `app.js` para que integre correctamente las rutas y controladores, manteniendo todo más modular y ordenado.

---

## ✅ Estado actual

Todo lo mencionado está funcionando correctamente. La edición de productos está completamente operativa y el flujo general de la app es mucho más dinámico y ordenado.

---

> Próximo paso: revisar detalles menores y seguir con el Sprint 5 👀