-- ════════════════════════════════════════════════════════════════════
-- Della Pace · v11 · deadline de pedidos + cardápio com productId direto
-- ════════════════════════════════════════════════════════════════════
-- Rodar no phpMyAdmin (banco u987145980_della_pace, aba SQL).
-- Idempotente: pode rodar várias vezes.
-- ════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ═══ v11.1: deadline de pedidos por dia de produção ═════════════════
-- Datetime opcional. Quando preenchido, pedidos NOVOS para essa data
-- são bloqueados após o deadline. Pedidos já existentes não são afetados.

ALTER TABLE availability
  ADD COLUMN IF NOT EXISTS order_deadline_at DATETIME NULL
  COMMENT 'Após esse instante, pedidos novos para essa data são bloqueados. NULL = sem deadline.';

-- ═══ v11.2: receita vinculada a produto, não mais a stock_item ═══════
-- O cardápio agora seleciona ingrediente direto do catálogo de Produtos
-- (com quantidade + unidade). O stock_item_id antigo vira opcional pra
-- manter compatibilidade com sub-receitas (Disco/Concha) e dados antigos.

-- Tornar stock_item_id NULLABLE primeiro (DROP FK porque era NOT NULL FK)
ALTER TABLE recipe_ingredients
  DROP FOREIGN KEY fk_recipe_stock;

ALTER TABLE recipe_ingredients
  MODIFY stock_item_id VARCHAR(50) NULL;

-- Recriar FK como ON DELETE SET NULL (não bloquear remoção de stock antigo)
ALTER TABLE recipe_ingredients
  ADD CONSTRAINT fk_recipe_stock
    FOREIGN KEY (stock_item_id) REFERENCES stock_items(id) ON DELETE SET NULL;

-- product_id já existe (v9 do migrate-all.sql), só garantir FK consistente
-- Sem ON DELETE: se o produto for removido, a linha permanece (admin precisa resolver)

-- ════════════════════════════════════════════════════════════════════
-- ✓ Pronto. Deploy do código pode subir.
-- ════════════════════════════════════════════════════════════════════
