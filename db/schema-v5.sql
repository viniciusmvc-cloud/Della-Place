-- Della Pace - Schema additions (v5 - 2026-05-09)
-- Sabores ativos por data de produção.
-- Roda no phpMyAdmin (banco u987145980_della_pace).

SET NAMES utf8mb4;

-- Lista JSON dos IDs do menu ativos para aquela data.
-- NULL ou '[]' = todos os sabores ativos do cardápio aparecem.
ALTER TABLE availability
  ADD COLUMN IF NOT EXISTS flavors_json TEXT DEFAULT NULL;
