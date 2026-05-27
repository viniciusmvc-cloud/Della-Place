-- ════════════════════════════════════════════════════════════════════
-- Della Pace · v12 · motivo de cancelamento de pedido
-- ════════════════════════════════════════════════════════════════════
-- Rodar no phpMyAdmin (banco u987145980_della_pace, aba SQL).
-- Idempotente: pode rodar várias vezes.
-- ════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL
  COMMENT 'Motivo do cancelamento informado pelo admin. NULL = pedido não cancelado ou cancelado sem motivo (legado).';

-- ════════════════════════════════════════════════════════════════════
-- ✓ Pronto.
-- ════════════════════════════════════════════════════════════════════
