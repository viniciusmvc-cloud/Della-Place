-- Della Pace - Schema additions (v10 - 2026-05-09)
-- Telefone do administrador (pra contato e identificação).
-- Roda no phpMyAdmin (banco u987145980_della_pace).

SET NAMES utf8mb4;

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL;
