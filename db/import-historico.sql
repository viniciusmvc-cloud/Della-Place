-- ════════════════════════════════════════════════════════════════════
-- Della Pace · Importação de dados históricos do Excel do Aurélio
-- Gerado automaticamente. Idempotente — pode rodar várias vezes.
-- ════════════════════════════════════════════════════════════════════
SET NAMES utf8mb4;

-- ═══ 1. CARDÁPIO (8 sabores) ═══════════════════════════════════════
INSERT INTO menu_items (id, name, description, price, cost, active) VALUES
  ('margueritha', 'MARGUERITHA', NULL, 58, 18.23, 1),
  ('calabria', 'CALABRIA', NULL, 60, 18.62, 1),
  ('zucchinni-e-bacon', 'ZUCCHINNI E BACON', NULL, 58, 19.12, 1),
  ('4-fromaggio', '4 FROMAGGIO', NULL, 58, 19.82, 1),
  ('lombinho-com-alho-poro', 'LOMBINHO COM ALHO PORÓ', NULL, 62, 18.97, 1),
  ('frango-com-catupiry', 'FRANGO COM CATUPIRY', NULL, 60, 19.76, 1),
  ('portuguesa', 'PORTUGUESA', NULL, 62, 20.16, 1),
  ('toscana', 'TOSCANA', NULL, 62, 21.58, 1)
ON DUPLICATE KEY UPDATE price = VALUES(price), cost = VALUES(cost), active = 1;

-- ═══ 2. INGREDIENTES (45 produtos + extras de COMPRAS) ════════════
INSERT IGNORE INTO products (name, category, default_unit, notes, active) VALUES
  ('farinha de trigo', 'massa', 'kg', NULL, 1),
  ('semola', 'massa', 'kg', NULL, 1),
  ('molho de tomate', 'molho', 'kg', NULL, 1),
  ('fermento seco', 'massa', 'kg', NULL, 1),
  ('sal', 'operacao', 'kg', NULL, 1),
  ('azeite', 'operacao', 'L', NULL, 1),
  ('azeite trufado', 'operacao', 'L', NULL, 1),
  ('mussarela', 'cobertura', 'kg', NULL, 1),
  ('calabresa', 'cobertura', 'kg', NULL, 1),
  ('orégano', 'cobertura', 'kg', NULL, 1),
  ('azeitona', 'cobertura', 'kg', NULL, 1),
  ('manjericão', 'cobertura', 'kg', NULL, 1),
  ('pimenta do reino', 'cobertura', 'kg', NULL, 1),
  ('abobrinha', 'cobertura', 'kg', NULL, 1),
  ('açúcar', 'operacao', 'kg', NULL, 1),
  ('rucula', 'cobertura', 'maço', NULL, 1),
  ('presunto', 'cobertura', 'kg', NULL, 1),
  ('ovo', 'cobertura', 'un', NULL, 1),
  ('gorgonzola', 'cobertura', 'kg', NULL, 1),
  ('parmesão ralado', 'cobertura', 'kg', NULL, 1),
  ('bacon', 'cobertura', 'kg', NULL, 1),
  ('champignon', 'cobertura', 'kg', NULL, 1),
  ('presunto parma', 'cobertura', 'kg', NULL, 1),
  ('lombinho canadense', 'cobertura', 'kg', NULL, 1),
  ('Alho Poró', 'cobertura', 'kg', NULL, 1),
  ('atum', 'cobertura', 'lata', NULL, 1),
  ('frango', 'cobertura', 'kg', NULL, 1),
  ('cebola', 'cobertura', 'kg', NULL, 1),
  ('Catupiry', 'cobertura', 'kg', NULL, 1),
  ('ervilha', 'cobertura', 'kg', NULL, 1),
  ('embalagem', 'operacao', 'un', NULL, 1),
  ('tomate cereja', 'molho', 'kg', NULL, 1),
  ('embalagem disco', 'operacao', 'un', NULL, 1),
  ('água', 'cobertura', 'L', NULL, 1),
  ('HORTIFRUTI', 'cobertura', 'medida', NULL, 1),
  ('alho', 'cobertura', 'kg', NULL, 1),
  ('alecrim', 'cobertura', 'maço', NULL, 1),
  ('banana', 'cobertura', 'kg', NULL, 1),
  ('escarola', 'cobertura', 'maço', NULL, 1),
  ('salsinha', 'operacao', 'maço', NULL, 1);

-- ═══ 3. CLIENTES (10) ═════════════════════════════════════════════
-- Vinícius usa TEMP-VINICIUS — após rodar, atualize com:
--   UPDATE orders SET customer_cpf = '<CPF real>' WHERE customer_cpf = 'TEMP-VINICIUS';
--   UPDATE customers SET cpf = '<CPF real>' WHERE cpf = 'TEMP-VINICIUS';
INSERT IGNORE INTO customers (cpf, full_name, phone, email, address, block_apt) VALUES
  ('T-IMP-001', 'Arthur', '', NULL, '', ''),
  ('T-IMP-002', 'Danilo', '', NULL, '', ''),
  ('T-IMP-003', 'Gustavo', '', NULL, '', ''),
  ('T-IMP-004', 'Júnior', '', NULL, '', ''),
  ('T-IMP-005', 'Lorena', '', NULL, '', ''),
  ('T-IMP-006', 'Marcos Cassa', '', NULL, '', ''),
  ('T-IMP-007', 'Pedro', '', NULL, '', ''),
  ('T-IMP-008', 'Pollyana', '', NULL, '', ''),
  ('T-IMP-009', 'Tatiana Smera', '', NULL, '', ''),
  ('TEMP-VINICIUS', 'Marcus Vinícius Macedo Roxo de Carvalho', '', NULL, '', '');

-- ═══ 4. PEDIDOS (37 ordens, agrupadas por cliente+data+horário) ═══
INSERT IGNORE INTO orders (id, customer_cpf, delivery_date, total, notes, status) VALUES
  ('IMP-260315-1800-marcos-c', 'T-IMP-006', '2026-03-15', 113.0, 'CONGELADA', 'pago'),
  ('IMP-260315-1830-tatiana-', 'T-IMP-009', '2026-03-15', 113.0, NULL, 'pago'),
  ('IMP-260315-1835-gustavo', 'T-IMP-003', '2026-03-15', 58.0, NULL, 'pago'),
  ('IMP-260315-1840-pedro', 'T-IMP-007', '2026-03-15', 113.0, NULL, 'pago'),
  ('IMP-260315-1845-danilo', 'T-IMP-002', '2026-03-15', 58.0, NULL, 'pago'),
  ('IMP-260315-1850-lorena', 'T-IMP-005', '2026-03-15', 116.0, NULL, 'pago'),
  ('IMP-260315-1900-marcos-c', 'T-IMP-006', '2026-03-15', 116.0, NULL, 'pago'),
  ('IMP-260315-1905-arthur', 'T-IMP-001', '2026-03-15', 58.0, NULL, 'pago'),
  ('IMP-260315-1915-vinicius', 'TEMP-VINICIUS', '2026-03-15', 113.0, NULL, 'pago'),
  ('IMP-260403-1815-arthur', 'T-IMP-001', '2026-04-03', 60.0, NULL, 'pago'),
  ('IMP-260403-1830-gustavo', 'T-IMP-003', '2026-04-03', 62.0, NULL, 'pago'),
  ('IMP-260403-1845-marcos-c', 'T-IMP-006', '2026-04-03', 58.0, NULL, 'pago'),
  ('IMP-260403-1900-marcos-c', 'T-IMP-006', '2026-04-03', 120.0, NULL, 'pago'),
  ('IMP-260403-1915-tatiana-', 'T-IMP-009', '2026-04-03', 58.0, 'CONGELADA', 'pago'),
  ('IMP-260403-1930-tatiana-', 'T-IMP-009', '2026-04-03', 62.0, NULL, 'pago'),
  ('IMP-260403-1945-pollyana', 'T-IMP-008', '2026-04-03', 58.0, NULL, 'pago'),
  ('IMP-260403-2000-pollyana', 'T-IMP-008', '2026-04-03', 60.0, NULL, 'pago'),
  ('IMP-260403-2030-junior', 'T-IMP-004', '2026-04-03', 180.0, NULL, 'pago'),
  ('IMP-260503-1800-pedro', 'T-IMP-007', '2026-05-03', 60.0, NULL, 'pago'),
  ('IMP-260510-1800-vinicius', 'TEMP-VINICIUS', '2026-05-10', 122.0, 'CONGELADA', 'confirmado'),
  ('IMP-260510-1815-vinicius', 'TEMP-VINICIUS', '2026-05-10', 58.0, NULL, 'confirmado'),
  ('IMP-260510-1830-vinicius', 'TEMP-VINICIUS', '2026-05-10', 62.0, NULL, 'confirmado'),
  ('IMP-260510-1845-lorena', 'T-IMP-005', '2026-05-10', 60.0, NULL, 'confirmado'),
  ('IMP-260510-1900-lorena', 'T-IMP-005', '2026-05-10', 62.0, NULL, 'confirmado'),
  ('IMP-260510-1915-lorena', 'T-IMP-005', '2026-05-10', 60.0, NULL, 'confirmado'),
  ('IMP-260510-1930-pollyana', 'T-IMP-008', '2026-05-10', 58.0, NULL, 'confirmado'),
  ('IMP-260510-1945-pollyana', 'T-IMP-008', '2026-05-10', 62.0, NULL, 'confirmado');

-- ═══ 5. ITENS DOS PEDIDOS ═════════════════════════════════════════
-- limpa items órfãos antes (caso esteja rodando 2ª vez)
DELETE oi FROM order_items oi WHERE oi.order_id LIKE 'IMP-%';
INSERT INTO order_items (order_id, time_slot, flavor, finish, price) VALUES
  ('IMP-260315-1800-marcos-c', '18:00', 'MARGUERITHA', 'Congelada', 55.0),
  ('IMP-260315-1800-marcos-c', '18:00', 'CALABRIA', 'Congelada', 58.0),
  ('IMP-260315-1830-tatiana-', '18:30', 'CALABRIA', 'Assada', 58.0),
  ('IMP-260315-1830-tatiana-', '18:30', 'MARGUERITHA', 'Assada', 55.0),
  ('IMP-260315-1835-gustavo', '18:35', 'CALABRIA', 'Assada', 58.0),
  ('IMP-260315-1840-pedro', '18:40', 'ZUCCHINNI E BACON', 'Assada', 58.0),
  ('IMP-260315-1840-pedro', '18:40', 'MARGUERITHA', 'Assada', 55.0),
  ('IMP-260315-1845-danilo', '18:45', 'CALABRIA', 'Assada', 58.0),
  ('IMP-260315-1850-lorena', '18:50', 'CALABRIA', 'Assada', 58.0),
  ('IMP-260315-1850-lorena', '18:50', '4 FROMAGGIO', 'Assada', 58.0),
  ('IMP-260315-1900-marcos-c', '19:00', 'ZUCCHINNI E BACON', 'Assada', 58.0),
  ('IMP-260315-1900-marcos-c', '19:00', 'CALABRIA', 'Assada', 58.0),
  ('IMP-260315-1905-arthur', '19:05', 'ZUCCHINNI E BACON', 'Assada', 58.0),
  ('IMP-260315-1915-vinicius', '19:15', 'CALABRIA', 'Assada', 58.0),
  ('IMP-260315-1915-vinicius', '19:15', 'MARGUERITHA', 'Assada', 55.0),
  ('IMP-260403-1815-arthur', '18:15', 'CALABRIA', 'Assada', 60.0),
  ('IMP-260403-1830-gustavo', '18:30', 'LOMBINHO COM ALHO PORÓ', 'Assada', 62.0),
  ('IMP-260403-1845-marcos-c', '18:45', 'MARGUERITHA', 'Assada', 58.0),
  ('IMP-260403-1900-marcos-c', '19:00', 'CALABRIA', 'Assada', 60.0),
  ('IMP-260403-1900-marcos-c', '19:00', 'FRANGO COM CATUPIRY', 'Assada', 60.0),
  ('IMP-260403-1915-tatiana-', '19:15', 'MARGUERITHA', 'Congelada', 58.0),
  ('IMP-260403-1930-tatiana-', '19:30', 'LOMBINHO COM ALHO PORÓ', 'Assada', 62.0),
  ('IMP-260403-1945-pollyana', '19:45', 'MARGUERITHA', 'Assada', 58.0),
  ('IMP-260403-2000-pollyana', '20:00', 'FRANGO COM CATUPIRY', 'Assada', 60.0),
  ('IMP-260403-2030-junior', '20:30', 'FRANGO COM CATUPIRY', 'Assada', 60.0),
  ('IMP-260403-2030-junior', '20:30', 'FRANGO COM CATUPIRY', 'Assada', 60.0),
  ('IMP-260403-2030-junior', '20:30', 'CALABRIA', 'Assada', 60.0),
  ('IMP-260503-1800-pedro', '18:00', 'FRANGO COM CATUPIRY', 'Assada', 60.0),
  ('IMP-260510-1800-vinicius', '18:00', 'CALABRIA', 'Congelada', 60.0),
  ('IMP-260510-1800-vinicius', '18:00', 'TOSCANA', 'Congelada', 62.0),
  ('IMP-260510-1815-vinicius', '18:15', 'MARGUERITHA', 'Assada', 58.0),
  ('IMP-260510-1830-vinicius', '18:30', 'PORTUGUESA', 'Assada', 62.0),
  ('IMP-260510-1845-lorena', '18:45', 'CALABRIA', 'Assada', 60.0),
  ('IMP-260510-1900-lorena', '19:00', 'PORTUGUESA', 'Assada', 62.0),
  ('IMP-260510-1915-lorena', '19:15', 'CALABRIA', 'Assada', 60.0),
  ('IMP-260510-1930-pollyana', '19:30', 'MARGUERITHA', 'Assada', 58.0),
  ('IMP-260510-1945-pollyana', '19:45', 'PORTUGUESA', 'Assada', 62.0);

-- ═══ 6. COMPRAS HISTÓRICAS (DELIVERY 1 · 2026-03-15) ══════════════
-- limpa imports antigos antes (caso esteja rodando 2ª vez)
DELETE FROM purchases WHERE notes = 'IMP-DELIVERY-1';
INSERT INTO purchases (product_id, quantity, unit, brand, total_cost, purchase_date, production_date, status, closed_at, notes) VALUES
  ((SELECT id FROM products WHERE name = 'mussarela' LIMIT 1), 3.036, 'kg', 'Queijo da Vaca', 130.48728, '2026-03-13', '2026-03-15', 'used', NOW(), 'IMP-DELIVERY-1'),
  ((SELECT id FROM products WHERE name = 'farinha de trigo' LIMIT 1), 3.0, 'un', 'Venturelli Alma Italiana', 30.0, '2026-03-13', '2026-03-15', 'used', NOW(), 'IMP-DELIVERY-1'),
  ((SELECT id FROM products WHERE name = 'abobrinha' LIMIT 1), 1.045, 'kg', NULL, 6.25955, '2026-03-13', '2026-03-15', 'used', NOW(), 'IMP-DELIVERY-1'),
  ((SELECT id FROM products WHERE name = 'calabresa' LIMIT 1), 1.0, 'kg', NULL, 32.9, '2026-03-13', '2026-03-15', 'used', NOW(), 'IMP-DELIVERY-1'),
  ((SELECT id FROM products WHERE name = 'gorgonzola' LIMIT 1), 0.186, 'kg', NULL, 11.141399999999999, '2026-03-13', '2026-03-15', 'used', NOW(), 'IMP-DELIVERY-1'),
  ((SELECT id FROM products WHERE name = 'Tomate cereja' LIMIT 1), 0.6, 'kg', NULL, 20.970000000000002, '2026-03-13', '2026-03-15', 'used', NOW(), 'IMP-DELIVERY-1');

-- ════════════════════════════════════════════════════════════════════
-- ✓ Importação completa.
-- ────────────────────────────────────────────────────────────────────
-- Resumo: 8 sabores, 40 produtos, 10 clientes,
--        27 pedidos (8 futuros, 19 encerrados)
--        6 compras históricas (DELIVERY 1)
-- ════════════════════════════════════════════════════════════════════
