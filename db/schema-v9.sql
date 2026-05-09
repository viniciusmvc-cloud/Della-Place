-- Della Pace - Schema additions (v9 - 2026-05-09)
-- Liga ingredientes da receita aos produtos novos.
-- Roda no phpMyAdmin (banco u987145980_della_pace).

SET NAMES utf8mb4;

ALTER TABLE recipe_ingredients
  ADD COLUMN IF NOT EXISTS product_id INT DEFAULT NULL,
  ADD INDEX IF NOT EXISTS idx_product (product_id);
