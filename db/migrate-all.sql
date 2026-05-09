-- ════════════════════════════════════════════════════════════════════
-- Della Pace · Migração consolidada (v2 + v3 + v4 + v5)
-- ════════════════════════════════════════════════════════════════════
-- Como rodar:
--   1. Acesse phpMyAdmin do Hostinger
--   2. Selecione o banco u987145980_della_pace
--   3. Aba "SQL"
--   4. Cole TODO este arquivo
--   5. Clique "Executar"
--
-- Idempotente: pode rodar quantas vezes quiser, não dá erro nem duplica.
-- ════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ═══ v2: start_hour em availability + push_subscriptions ════════════

ALTER TABLE availability
  ADD COLUMN IF NOT EXISTS start_hour TIME NOT NULL DEFAULT '18:00:00';

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  endpoint TEXT NOT NULL,
  endpoint_hash CHAR(64) UNIQUE NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  customer_cpf VARCHAR(14) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  INDEX idx_customer (customer_cpf),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══ v3: community_posts (parede da comunidade) ═════════════════════

CREATE TABLE IF NOT EXISTS community_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  image_data MEDIUMTEXT DEFAULT NULL,
  status ENUM('pending','approved','hidden') NOT NULL DEFAULT 'pending',
  show_in_hero TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_hero (show_in_hero, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══ v4: senha + produtos + compras + seed ══════════════════════════

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT NULL;

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

-- ═══ v5: sabores ativos por data de produção ════════════════════════

ALTER TABLE availability
  ADD COLUMN IF NOT EXISTS flavors_json TEXT DEFAULT NULL;

-- ═══ v6: separação customer/admin nas push subscriptions ════════════

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS role ENUM('customer','admin') NOT NULL DEFAULT 'customer';

-- ═══ v7: produto pode ter múltiplas categorias ══════════════════════

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS categories_json TEXT DEFAULT NULL;

-- ════════════════════════════════════════════════════════════════════
-- ✓ Pronto. Agora pode fazer o deploy do código.
-- ════════════════════════════════════════════════════════════════════
