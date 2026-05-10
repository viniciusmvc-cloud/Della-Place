-- ════════════════════════════════════════════════════════════════════
-- Della Pace · Sub-receitas (Disco de Pizza + Concha de Molho)
-- ────────────────────────────────────────────────────────────────────
-- Cria 2 receitas-base que outras receitas (sabores) podem referenciar.
-- O Aurélio edita Disco/Concha em UM lugar e a mudança propaga pra
-- todos os 8 sabores.
--
-- Idempotente. Roda quantas vezes quiser.
-- ════════════════════════════════════════════════════════════════════
SET NAMES utf8mb4;

-- ═══ 1. SCHEMA: type em menu_items + component_menu_id em recipe_ingredients ═══

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'pizza';

ALTER TABLE recipe_ingredients
  ADD COLUMN IF NOT EXISTS component_menu_id VARCHAR(50) DEFAULT NULL;

-- Componentes não têm stock_item_id real — relaxa o FK e permite NULL.
-- (idempotente: roda só se a constraint ainda existe)
SET @drop_fk := (
  SELECT IF(COUNT(*) > 0,
    'ALTER TABLE recipe_ingredients DROP FOREIGN KEY fk_recipe_stock',
    'SELECT 1')
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'recipe_ingredients'
    AND CONSTRAINT_NAME = 'fk_recipe_stock'
);
PREPARE stmt FROM @drop_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE recipe_ingredients
  MODIFY COLUMN stock_item_id VARCHAR(50) NULL;

-- ═══ 2. INSERE OS 2 ITENS-BASE em menu_items ═══════════════════════
-- active=0 → não aparecem no cardápio do cliente
-- type='base' → marca como sub-receita

INSERT INTO menu_items (id, name, description, price, cost, active, type) VALUES
  ('base-disco',  'Disco de Pizza',   'Massa base — 1 disco = 1 pizza. Edite aqui pra atualizar todas.',  0, 0, 0, 'base'),
  ('base-concha', 'Concha de Molho',  'Molho base — 1 concha por pizza. Edite aqui pra atualizar todas.', 0, 0, 0, 'base')
ON DUPLICATE KEY UPDATE type='base', active=0, description=VALUES(description);

-- ═══ 3. RECEITAS DAS BASES ═══════════════════════════════════════════
-- Limpa as antigas se já existem (idempotência)
DELETE FROM recipe_ingredients WHERE menu_item_id IN ('base-disco','base-concha');

-- Disco de Pizza (massa)
INSERT INTO recipe_ingredients (menu_item_id, stock_item_id, product_id, amount, unit) VALUES
  ('base-disco', 'stk-farinha-de-trigo', (SELECT id FROM products WHERE LOWER(name)=LOWER('Farinha de Trigo') LIMIT 1), 210, 'g'),
  ('base-disco', 'stk-agua',             (SELECT id FROM products WHERE LOWER(name)=LOWER('Água') LIMIT 1),            120, 'g'),
  ('base-disco', 'stk-fermento-seco',    (SELECT id FROM products WHERE LOWER(name)=LOWER('Fermento Seco') LIMIT 1),    0.6, 'g'),
  ('base-disco', 'stk-sal',              (SELECT id FROM products WHERE LOWER(name)=LOWER('Sal') LIMIT 1),                5, 'g'),
  ('base-disco', 'stk-azeite',           (SELECT id FROM products WHERE LOWER(name)=LOWER('Azeite') LIMIT 1),             6, 'g');

-- Concha de Molho (molho)
INSERT INTO recipe_ingredients (menu_item_id, stock_item_id, product_id, amount, unit) VALUES
  ('base-concha', 'stk-molho-de-tomate', (SELECT id FROM products WHERE LOWER(name)=LOWER('Molho de Tomate') LIMIT 1), 50, 'g');

-- ═══ 4. ATUALIZA AS 8 PIZZAS PARA USAR 1 DISCO + 1 CONCHA ═══════════
-- Remove ingredientes que agora estão dentro do disco/concha
DELETE FROM recipe_ingredients
 WHERE menu_item_id IN ('margueritha','calabria','zucchinni-e-bacon','4-fromaggio','lombinho-com-alho-poro','frango-com-catupiry','portuguesa','toscana')
   AND stock_item_id IN ('stk-farinha-de-trigo','stk-agua','stk-fermento-seco','stk-sal','stk-azeite','stk-molho-de-tomate');

-- Adiciona 1 disco + 1 concha em cada uma das 8 pizzas
INSERT INTO recipe_ingredients (menu_item_id, stock_item_id, product_id, amount, unit, component_menu_id)
SELECT mi.id, NULL, NULL, 1, 'un', 'base-disco'
FROM menu_items mi
WHERE mi.id IN ('margueritha','calabria','zucchinni-e-bacon','4-fromaggio','lombinho-com-alho-poro','frango-com-catupiry','portuguesa','toscana')
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.menu_item_id = mi.id AND ri.component_menu_id = 'base-disco'
  );

INSERT INTO recipe_ingredients (menu_item_id, stock_item_id, product_id, amount, unit, component_menu_id)
SELECT mi.id, NULL, NULL, 1, 'un', 'base-concha'
FROM menu_items mi
WHERE mi.id IN ('margueritha','calabria','zucchinni-e-bacon','4-fromaggio','lombinho-com-alho-poro','frango-com-catupiry','portuguesa','toscana')
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.menu_item_id = mi.id AND ri.component_menu_id = 'base-concha'
  );

-- ════════════════════════════════════════════════════════════════════
-- Verificação:
-- SELECT mi.name AS pizza, ri.component_menu_id AS componente, ri.amount, ri.unit, p.name AS produto
-- FROM recipe_ingredients ri
-- JOIN menu_items mi ON mi.id = ri.menu_item_id
-- LEFT JOIN products p ON p.id = ri.product_id
-- ORDER BY mi.name, ri.component_menu_id, p.name;
-- ════════════════════════════════════════════════════════════════════
