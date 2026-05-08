-- Della Pace - Schema additions (v2 - 2026-05-08)
-- Roda no phpMyAdmin (banco u987145980_della_pace).

SET NAMES utf8mb4;

-- Add start_hour to availability (horário do primeiro pedido)
ALTER TABLE availability
  ADD COLUMN IF NOT EXISTS start_hour TIME NOT NULL DEFAULT '18:00:00';

-- Push subscriptions (PWA Web Push)
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
