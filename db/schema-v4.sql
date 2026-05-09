-- Della Pace - Schema additions (v4 - 2026-05-09)
-- Senha no admin + catálogo de produtos + compras por ciclo.
-- Roda no phpMyAdmin (banco u987145980_della_pace).

SET NAMES utf8mb4;

-- 1. Login com senha (mantendo magic-link como recuperação)
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT NULL;

-- 2. Catálogo de produtos (ingredientes)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category ENUM('massa', 'molho', 'cobertura', 'operacao') NOT NULL DEFAULT 'cobertura',
  default_unit VARCHAR(16) NOT NULL DEFAULT 'kg',
  notes VARCHAR(255) DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_name (name),
  INDEX idx_category (category, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Compras (cada lote comprado, amarrado a UM domingo de produção)
CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity DECIMAL(10, 3) NOT NULL,
  unit VARCHAR(16) NOT NULL DEFAULT 'kg',
  brand VARCHAR(120) DEFAULT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  purchase_date DATE NOT NULL,
  production_date DATE NOT NULL,
  status ENUM('pending', 'used', 'kept', 'discarded', 'personal') NOT NULL DEFAULT 'pending',
  closed_at DATETIME DEFAULT NULL,
  notes VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_production (production_date, status),
  INDEX idx_status (status),
  CONSTRAINT fk_purchases_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Seed do catálogo (16 itens iniciais que Aurélio já usa)
INSERT IGNORE INTO products (name, category, default_unit, notes) VALUES
  ('Farinha 00',         'massa',     'kg',  'Farinha italiana de moagem fina'),
  ('Fermento biológico', 'massa',     'g',   'Seco ou fresco'),
  ('Tomate San Marzano', 'molho',     'kg',  'Pelado em lata, base do molho'),
  ('Manjericão',         'molho',     'maço', 'Folhas frescas'),
  ('Sal',                'operacao',  'kg',  'Sal grosso ou refinado'),
  ('Azeite de oliva',    'operacao',  'L',   'Extra virgem'),
  ('Mussarela',          'cobertura', 'kg',  'Lasqueada ou em bolas'),
  ('Calabresa',          'cobertura', 'kg',  'Defumada'),
  ('Presunto cozido',    'cobertura', 'kg',  ''),
  ('Azeitona',           'cobertura', 'kg',  'Preta ou verde'),
  ('Orégano',            'cobertura', 'g',   'Folhas secas'),
  ('Parmesão',           'cobertura', 'kg',  'Ralado ou em peça'),
  ('Gorgonzola',         'cobertura', 'kg',  ''),
  ('Brie',               'cobertura', 'kg',  ''),
  ('Alho-poró',          'cobertura', 'maço', ''),
  ('Embalagens',         'operacao',  'un',  'Caixas de pizza');
