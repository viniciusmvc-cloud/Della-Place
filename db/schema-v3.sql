-- Della Pace - Schema additions (v3 - 2026-05-09)
-- Roda no phpMyAdmin (banco u987145980_della_pace).

SET NAMES utf8mb4;

-- Community posts (comentários e fotos da comunidade)
CREATE TABLE IF NOT EXISTS community_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  image_data MEDIUMTEXT DEFAULT NULL,
  status ENUM('pending','approved','hidden') NOT NULL DEFAULT 'pending',
  show_in_hero TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_hero (show_in_hero, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
