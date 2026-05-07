-- Della Pace - Schema inicial
-- Execute este arquivo no phpMyAdmin (aba SQL) com o banco u987145980_della_pace selecionado.
-- Charset: utf8mb4 (suporta emojis e acentos). Engine: InnoDB (transações + foreign keys).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────
-- 1. Clientes (CPF como identificador único)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  cpf VARCHAR(14) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  address TEXT NOT NULL,
  block_apt VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- 2. Cardápio (sabores de pizza)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- 3. Estoque (ingredientes)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) DEFAULT '',
  supplier VARCHAR(255) DEFAULT '',
  unit_price DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  unit VARCHAR(10) NOT NULL DEFAULT 'un',
  min_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- 4. Receitas (ingredientes de cada pizza)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id VARCHAR(50) NOT NULL,
  stock_item_id VARCHAR(50) NOT NULL,
  amount DECIMAL(10,3) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  CONSTRAINT fk_recipe_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_recipe_stock FOREIGN KEY (stock_item_id) REFERENCES stock_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- 5. Pedidos
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_cpf VARCHAR(14) NOT NULL,
  delivery_date DATE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  status ENUM('pendente','confirmado','pago','cancelado') NOT NULL DEFAULT 'pendente',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_customer FOREIGN KEY (customer_cpf) REFERENCES customers(cpf) ON DELETE RESTRICT,
  INDEX idx_status (status),
  INDEX idx_delivery_date (delivery_date),
  INDEX idx_customer (customer_cpf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- 6. Itens do pedido (cada pizza individual)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  time_slot VARCHAR(5) NOT NULL,
  flavor VARCHAR(100) NOT NULL,
  finish ENUM('Assada','Pré-assada','Congelada') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_orderitem_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order (order_id),
  INDEX idx_flavor (flavor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- 7. Despesas
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(50) PRIMARY KEY,
  date DATE NOT NULL,
  category ENUM('gas','entrega','funcionario','aluguel','embalagem','marketing','outros') NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  recurring TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_date (date),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- 8. Disponibilidade (domingos abertos pra produção)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS availability (
  date DATE PRIMARY KEY,
  capacity INT NOT NULL DEFAULT 8,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────
-- Seed: cardápio inicial (4 sabores oficiais do Aurélio)
-- ─────────────────────────────────────────────────────────
INSERT INTO menu_items (id, name, description, price, cost, active) VALUES
  ('marguerita', 'Marguerita', 'Molho de tomate San Marzano, mussarela, tomate cereja, pesto de manjericão e parmesão.', 58, 18, 1),
  ('calabria', 'Calabria', 'Molho de tomate San Marzano, mussarela, calabresa, cebola e azeitonas pretas.', 60, 19, 1),
  ('portuguesa', 'Portuguesa', 'Molho de tomate San Marzano, mussarela, presunto cozido, cebola, tomate, ovos, ervilhas e azeitonas pretas.', 62, 22, 1),
  ('toscana', 'Toscana', 'Molho de tomate San Marzano, mussarela, cogumelos refogados, bacon e azeitona.', 62, 24, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Pronto! 8 tabelas criadas + 4 sabores cadastrados.
