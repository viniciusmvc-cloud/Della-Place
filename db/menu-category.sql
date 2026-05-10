-- ════════════════════════════════════════════════════════════════════
-- Della Pace · Adiciona coluna 'category' em menu_items (Clássica/Especial)
-- ────────────────────────────────────────────────────────────────────
-- Antes: BI usava um map hardcoded em /lib (FLAVOR_CATEGORY).
-- Agora: persiste no banco, Aurélio edita pelo painel.
--
-- Idempotente. Roda quantas vezes quiser.
-- ════════════════════════════════════════════════════════════════════
SET NAMES utf8mb4;

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT NULL;

-- Popula com as categorias do cardápio do Aurélio (planilha)
UPDATE menu_items SET category='Clássica' WHERE id IN ('margueritha','marguerita','calabria','frango-com-catupiry','portuguesa');
UPDATE menu_items SET category='Especial' WHERE id IN ('zucchinni-e-bacon','4-fromaggio','lombinho-com-alho-poro','toscana');

-- Bases (Disco/Concha) ficam sem categoria — não vendem
UPDATE menu_items SET category=NULL WHERE type='base';

-- Verificação:
-- SELECT id, name, category, type, active FROM menu_items ORDER BY type, name;
