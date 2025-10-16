-- =============================================
--  Spikeshop - Datos iniciales de la base
--  Archivo: data.sql
--  Compatible con MySQL / XAMPP
-- =============================================

USE spikeshop;

-- =======================
-- Usuarios
-- =======================
INSERT INTO users (first_name, last_name, email, password, role, image, created_at, updated_at)
VALUES
('Admin', 'Spikeshop', 'admin@spikeshop.com', '$2a$10$FzUHPjknz2blE1v6j7qj7eTqvAtA4K3mXOaSkyeK8uHcJ/V79hQYq', 'admin', '/img/users/admin.jpg', NOW(), NOW()),
('Lucía', 'Pérez', 'lucia@correo.com', '$2a$10$FzUHPjknz2blE1v6j7qj7eTqvAtA4K3mXOaSkyeK8uHcJ/V79hQYq', 'customer', '/img/users/default.jpg', NOW(), NOW()),
('Matías', 'Rodríguez', 'mati@correo.com', '$2a$10$FzUHPjknz2blE1v6j7qj7eTqvAtA4K3mXOaSkyeK8uHcJ/V79hQYq', 'customer', '/img/users/default.jpg', NOW(), NOW());

-- (Contraseña: 123456)

-- =======================
-- Categorías
-- =======================
INSERT INTO categories (name, created_at, updated_at)
VALUES
('Indumentaria', NOW(), NOW()),
('Accesorios', NOW(), NOW()),
('Calzado', NOW(), NOW()),
('Equipamiento', NOW(), NOW());

-- =======================
-- Marcas
-- =======================
INSERT INTO brands (name, created_at, updated_at)
VALUES
('Mikasa', NOW(), NOW()),
('Molten', NOW(), NOW()),
('Nike', NOW(), NOW()),
('Adidas', NOW(), NOW()),
('ASICS', NOW(), NOW());

-- =======================
-- Productos
-- =======================
INSERT INTO products (name, description, price, stock, image, category_id, brand_id, user_id, created_at, updated_at)
VALUES
('Pelota Mikasa V200W', 'Pelota oficial de vóley FIVB, diseñada para competencias profesionales.', 52000.00, 15, '/img/products/mikasa-v200w.jpg', 4, 1, 1, NOW(), NOW()),
('Rodilleras Molten Pro', 'Rodilleras acolchadas con ventilación lateral para máxima comodidad.', 8500.00, 30, '/img/products/molten-rodilleras.jpg', 2, 2, 1, NOW(), NOW()),
('Zapatillas ASICS Sky Elite', 'Zapatillas profesionales para voleibol, con suela antideslizante.', 72000.00, 10, '/img/products/asics-skyelite.jpg', 3, 5, 1, NOW(), NOW()),
('Camiseta Nike Volley Team', 'Camiseta liviana y transpirable, ideal para entrenamiento y juego.', 18000.00, 25, '/img/products/nike-camiseta.jpg', 1, 3, 1, NOW(), NOW()),
('Short Adidas Volley Pro', 'Short con tecnología Climalite, ideal para alto rendimiento.', 16000.00, 20, '/img/products/adidas-short.jpg', 1, 4, 1, NOW(), NOW()),
('Pelota Molten FLISTATEC', 'Pelota de entrenamiento con textura antideslizante y vuelo estable.', 41000.00, 18, '/img/products/molten-flistatec.jpg', 4, 2, 1, NOW(), NOW());
