-- Della Pace - Schema de autenticação (Onda 2.3)
-- Execute este SQL no phpMyAdmin (banco u987145980_della_pace)

SET NAMES utf8mb4;

-- ─────────────────────────────────────────────────────────
-- admin_users — emails autorizados a logar no /admin
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME DEFAULT NULL,
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- verification_tokens — tokens de magic link (1 uso, expiram em 15min)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_tokens (
  token VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Seed: adicione os emails dos administradores aqui
-- (Aurélio + Vinicius + outros que você quiser dar acesso)
-- Substitua os emails abaixo pelos reais.
-- ─────────────────────────────────────────────────────────
INSERT INTO admin_users (email, name, active) VALUES
  ('aurelio@dellapace.com.br', 'Aurélio Paz', 1),
  ('vinicius@example.com', 'Vinícius Carvalho', 1)
ON DUPLICATE KEY UPDATE active = VALUES(active);
