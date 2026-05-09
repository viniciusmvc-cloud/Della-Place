-- Della Pace - Schema additions (v7 - 2026-05-09)
-- Produto pode ter múltiplas categorias (ex: tomate vai em molho E cobertura).
-- Roda no phpMyAdmin (banco u987145980_della_pace).

SET NAMES utf8mb4;

-- Lista JSON de categorias adicionais (a coluna `category` continua sendo
-- a primária para sort/group; categories_json é leitura adicional).
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS categories_json TEXT DEFAULT NULL;
