-- ════════════════════════════════════════════════════════════════════
-- Della Pace · v13 · cadastro simplificado (telefone como chave)
-- ════════════════════════════════════════════════════════════════════
-- Rodar no phpMyAdmin (banco u987145980_della_pace, aba SQL).
-- Idempotente: pode rodar várias vezes.
-- ════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- bloco/apto opcional (NOT NULL → NULL)
ALTER TABLE customers
  MODIFY block_apt VARCHAR(100) NULL;

-- Garante UNIQUE no telefone pra lookup rápido.
-- Antes de adicionar, normaliza telefones existentes pra digits-only,
-- e remove duplicados (mantém o mais recente).

-- 1) Normalizar telefones (remove tudo que não for dígito)
UPDATE customers
SET phone = REGEXP_REPLACE(phone, '[^0-9]', '')
WHERE phone REGEXP '[^0-9]';

-- 2) Identificar duplicados (mesmos dígitos de telefone, CPFs diferentes).
--    Estratégia conservadora: mantém o de updated_at mais recente, sufixa o
--    telefone dos outros com "-DUP-{cpf}" pra preservar o registro sem violar
--    o futuro UNIQUE. O admin pode resolver depois.
DROP TEMPORARY TABLE IF EXISTS _phone_dups;
CREATE TEMPORARY TABLE _phone_dups AS
SELECT phone, MAX(updated_at) AS keep_at
  FROM customers
 WHERE phone <> ''
 GROUP BY phone
HAVING COUNT(*) > 1;

UPDATE customers c
  JOIN _phone_dups d ON c.phone = d.phone
   SET c.phone = CONCAT(c.phone, '-DUP-', c.cpf)
 WHERE c.updated_at < d.keep_at OR c.updated_at IS NULL;

DROP TEMPORARY TABLE IF EXISTS _phone_dups;

-- 3) Adicionar UNIQUE (idempotente via PROCEDURE)
DROP PROCEDURE IF EXISTS della_v13_add_phone_unique;
DELIMITER //
CREATE PROCEDURE della_v13_add_phone_unique()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'customers'
       AND INDEX_NAME = 'uniq_phone'
  ) THEN
    ALTER TABLE customers ADD UNIQUE KEY uniq_phone (phone);
  END IF;
END//
DELIMITER ;
CALL della_v13_add_phone_unique();
DROP PROCEDURE della_v13_add_phone_unique;

-- ════════════════════════════════════════════════════════════════════
-- ✓ Pronto.
-- ════════════════════════════════════════════════════════════════════
