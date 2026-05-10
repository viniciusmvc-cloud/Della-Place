-- ════════════════════════════════════════════════════════════════════
-- Della Pace · Compras INFERIDAS dos ciclos passados
-- ────────────────────────────────────────────────────────────────────
-- Calculado: receita × pizzas pagas × preço unitário do INGREDIENTES.
-- Status=used (já consumido). Marcador notes=IMP-INFERRED.
-- Idempotente: DELETE prévio + INSERT.
-- ════════════════════════════════════════════════════════════════════
SET NAMES utf8mb4;

-- Limpa imports anteriores pra evitar duplicidade
DELETE FROM purchases WHERE notes LIKE 'IMP-INFERRED%';
DELETE FROM purchases WHERE notes = 'IMP-DELIVERY-1';

INSERT INTO purchases (product_id, quantity, unit, brand, total_cost, purchase_date, production_date, status, closed_at, notes) VALUES
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Farinha de Trigo') LIMIT 1), 3.15, 'kg', NULL, 31.5, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Água') LIMIT 1), 1.8, 'L', NULL, 1.17, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Fermento Seco') LIMIT 1), 0.009, 'kg', NULL, 2.24, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Sal') LIMIT 1), 0.075, 'kg', NULL, 0.19, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Azeite') LIMIT 1), 0.09, 'L', NULL, 6.1, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Molho de Tomate') LIMIT 1), 0.75, 'kg', NULL, 45.0, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Mussarela') LIMIT 1), 2.37, 'kg', NULL, 101.86, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Tomate Cereja') LIMIT 1), 0.2, 'kg', NULL, 4.78, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Parmesão Ralado') LIMIT 1), 0.06, 'kg', NULL, 8.04, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Manjericão') LIMIT 1), 0.02, 'kg', NULL, 1.3, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Embalagem') LIMIT 1), 15.0, 'un', NULL, 33.0, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Calabresa') LIMIT 1), 0.7, 'kg', NULL, 23.03, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Cebola') LIMIT 1), 0.35, 'kg', NULL, 1.74, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Azeitona') LIMIT 1), 0.07, 'kg', NULL, 1.96, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Orégano') LIMIT 1), 0.0, 'kg', NULL, 0.0, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Abobrinha') LIMIT 1), 0.3, 'kg', NULL, 1.79, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Bacon') LIMIT 1), 0.15, 'kg', NULL, 7.5, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Gorgonzola') LIMIT 1), 0.09, 'kg', NULL, 5.39, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Catupiry') LIMIT 1), 0.02, 'kg', NULL, 1.81, '2026-03-15', '2026-03-15', 'used', NOW(), 'IMP-INFERRED-2026-03-15'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Farinha de Trigo') LIMIT 1), 2.73, 'kg', NULL, 27.3, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Água') LIMIT 1), 1.56, 'L', NULL, 1.01, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Fermento Seco') LIMIT 1), 0.0078, 'kg', NULL, 1.94, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Sal') LIMIT 1), 0.065, 'kg', NULL, 0.17, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Azeite') LIMIT 1), 0.078, 'L', NULL, 5.29, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Molho de Tomate') LIMIT 1), 0.65, 'kg', NULL, 39.0, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Mussarela') LIMIT 1), 1.66, 'kg', NULL, 71.35, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Frango') LIMIT 1), 0.6, 'kg', NULL, 15.0, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Catupiry') LIMIT 1), 0.25, 'kg', NULL, 22.59, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Embalagem') LIMIT 1), 13.0, 'un', NULL, 28.6, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Calabresa') LIMIT 1), 0.3, 'kg', NULL, 9.87, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Cebola') LIMIT 1), 0.15, 'kg', NULL, 0.75, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Azeitona') LIMIT 1), 0.03, 'kg', NULL, 0.84, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Orégano') LIMIT 1), 0.0, 'kg', NULL, 0.0, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Lombinho Canadense') LIMIT 1), 0.16, 'kg', NULL, 10.55, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Alho Poró') LIMIT 1), 0.08, 'kg', NULL, 2.91, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Tomate Cereja') LIMIT 1), 0.15, 'kg', NULL, 3.59, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Parmesão Ralado') LIMIT 1), 0.03, 'kg', NULL, 4.02, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03'),
  ((SELECT id FROM products WHERE LOWER(name)=LOWER('Manjericão') LIMIT 1), 0.015, 'kg', NULL, 0.97, '2026-04-03', '2026-04-03', 'used', NOW(), 'IMP-INFERRED-2026-04-03');

-- Total inferido: 38 compras, R$ 524.15
-- ════════════════════════════════════════════════════════════════════
