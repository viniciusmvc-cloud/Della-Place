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

-- ═══ v8: marca como campo do produto ════════════════════════════════

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand VARCHAR(120) DEFAULT NULL;

-- ═══ v9: liga ingredientes da receita aos produtos ══════════════════

ALTER TABLE recipe_ingredients
  ADD COLUMN IF NOT EXISTS product_id INT DEFAULT NULL,
  ADD INDEX IF NOT EXISTS idx_product (product_id);

-- ═══ v10: telefone do administrador ═════════════════════════════════

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL;

-- ═══ v11: deadline de pedidos + receita com productId ════════════════
-- Ver db/schema-v11.sql para detalhes. Embarcado aqui para ficar idempotente.

ALTER TABLE availability
  ADD COLUMN IF NOT EXISTS order_deadline_at DATETIME NULL
  COMMENT 'Após esse instante, pedidos novos para essa data são bloqueados.';

-- Tornar stock_item_id da receita NULLABLE. Bloco protegido: tenta DROP da FK
-- existente; se já não existir (rerun) o erro é ignorado por outro caminho.
-- MySQL não tem IF EXISTS pra DROP FOREIGN KEY antes da 8.0.19; usar PROCEDURE.

DROP PROCEDURE IF EXISTS della_v11_drop_recipe_stock_fk;
DELIMITER //
CREATE PROCEDURE della_v11_drop_recipe_stock_fk()
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'recipe_ingredients'
       AND CONSTRAINT_NAME = 'fk_recipe_stock'
  ) THEN
    ALTER TABLE recipe_ingredients DROP FOREIGN KEY fk_recipe_stock;
  END IF;
END//
DELIMITER ;
CALL della_v11_drop_recipe_stock_fk();
DROP PROCEDURE della_v11_drop_recipe_stock_fk;

ALTER TABLE recipe_ingredients
  MODIFY stock_item_id VARCHAR(50) NULL;

-- Recriar FK como ON DELETE SET NULL (só se ainda não existir)
DROP PROCEDURE IF EXISTS della_v11_add_recipe_stock_fk;
DELIMITER //
CREATE PROCEDURE della_v11_add_recipe_stock_fk()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'recipe_ingredients'
       AND CONSTRAINT_NAME = 'fk_recipe_stock'
  ) THEN
    ALTER TABLE recipe_ingredients
      ADD CONSTRAINT fk_recipe_stock
        FOREIGN KEY (stock_item_id) REFERENCES stock_items(id) ON DELETE SET NULL;
  END IF;
END//
DELIMITER ;
CALL della_v11_add_recipe_stock_fk();
DROP PROCEDURE della_v11_add_recipe_stock_fk;

-- ═══ v12: motivo de cancelamento de pedido ══════════════════════════

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL
  COMMENT 'Motivo do cancelamento informado pelo admin.';

-- ═══ v13: cadastro simplificado (telefone como chave) ════════════════
-- Ver db/schema-v13.sql para a versão standalone com normalização de
-- telefones e tratamento de duplicados. Aqui embutimos o essencial.

ALTER TABLE customers
  MODIFY block_apt VARCHAR(100) NULL;

-- Normaliza telefones (remove não-dígitos) antes de criar UNIQUE
UPDATE customers
SET phone = REGEXP_REPLACE(phone, '[^0-9]', '')
WHERE phone REGEXP '[^0-9]';

-- Sufixa duplicados pra não violar UNIQUE
DROP TEMPORARY TABLE IF EXISTS _phone_dups;
CREATE TEMPORARY TABLE _phone_dups AS
SELECT phone, MAX(updated_at) AS keep_at
  FROM customers
 WHERE phone <> ''
 GROUP BY phone
HAVING COUNT(*) > 1;

UPDATE customers c
  JOIN _phone_dups d ON c.phone = d.phone
   SET c.phone = CONCAT(c.phone, '-DUP-', c.cpf)
 WHERE c.updated_at < d.keep_at OR c.updated_at IS NULL;

DROP TEMPORARY TABLE IF EXISTS _phone_dups;

DROP PROCEDURE IF EXISTS della_v13_add_phone_unique;
DELIMITER //
CREATE PROCEDURE della_v13_add_phone_unique()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'customers'
       AND INDEX_NAME = 'uniq_phone'
  ) THEN
    ALTER TABLE customers ADD UNIQUE KEY uniq_phone (phone);
  END IF;
END//
DELIMITER ;
CALL della_v13_add_phone_unique();
DROP PROCEDURE della_v13_add_phone_unique;

-- ════════════════════════════════════════════════════════════════════
-- ✓ Pronto. Agora pode fazer o deploy do código.
-- ════════════════════════════════════════════════════════════════════
