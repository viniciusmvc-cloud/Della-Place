-- Della Pace - Schema additions (v8 - 2026-05-09)
-- Marca como campo do produto (não da compra individual).
-- Roda no phpMyAdmin (banco u987145980_della_pace).

SET NAMES utf8mb4;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand VARCHAR(120) DEFAULT NULL;
