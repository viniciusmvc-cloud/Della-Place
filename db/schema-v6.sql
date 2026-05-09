-- Della Pace - Schema additions (v6 - 2026-05-09)
-- Separação customer/admin nas push subscriptions.
-- Roda no phpMyAdmin (banco u987145980_della_pace).

SET NAMES utf8mb4;

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS role ENUM('customer','admin') NOT NULL DEFAULT 'customer';
