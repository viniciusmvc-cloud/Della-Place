-- ════════════════════════════════════════════════════════════════════
-- Della Pace · Importação histórica (Title Case + todos produtos)
-- Idempotente. Roda quantas vezes quiser.
-- ════════════════════════════════════════════════════════════════════
SET NAMES utf8mb4;

-- ═══ 1. CARDÁPIO (8 sabores · Title Case) ════════════════════════
INSERT INTO menu_items (id, name, description, price, cost, active) VALUES
  ('margueritha', 'Margueritha', NULL, 58.0, 18.23, 1),
  ('calabria', 'Calabria', NULL, 60.0, 18.62, 1),
  ('zucchinni-e-bacon', 'Zucchinni e Bacon', NULL, 58.0, 19.12, 1),
  ('4-fromaggio', '4 Fromaggio', NULL, 58.0, 19.82, 1),
  ('lombinho-com-alho-poro', 'Lombinho com Alho Poró', NULL, 62.0, 18.97, 1),
  ('frango-com-catupiry', 'Frango com Catupiry', NULL, 60.0, 19.76, 1),
  ('portuguesa', 'Portuguesa', NULL, 62.0, 20.16, 1),
  ('toscana', 'Toscana', NULL, 62.0, 21.58, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), cost=VALUES(cost), active=1;

-- ═══ 2. INGREDIENTES (52 produtos · Title Case) ═══════
INSERT INTO products (name, category, default_unit, notes, active) VALUES
  ('Farinha de Trigo', 'massa', 'kg', NULL, 1),
  ('Semola', 'massa', 'kg', NULL, 1),
  ('Molho de Tomate', 'molho', 'kg', NULL, 1),
  ('Fermento Seco', 'massa', 'kg', NULL, 1),
  ('Sal', 'operacao', 'kg', NULL, 1),
  ('Azeite', 'operacao', 'L', NULL, 1),
  ('Azeite Trufado', 'operacao', 'L', NULL, 1),
  ('Mussarela', 'cobertura', 'kg', NULL, 1),
  ('Calabresa', 'cobertura', 'kg', NULL, 1),
  ('Orégano', 'cobertura', 'kg', NULL, 1),
  ('Azeitona', 'cobertura', 'kg', NULL, 1),
  ('Manjericão', 'cobertura', 'kg', NULL, 1),
  ('Pimenta do Reino', 'cobertura', 'kg', NULL, 1),
  ('Abobrinha', 'cobertura', 'kg', NULL, 1),
  ('Açúcar', 'operacao', 'kg', NULL, 1),
  ('Rucula', 'cobertura', 'maço', NULL, 1),
  ('Presunto', 'cobertura', 'kg', NULL, 1),
  ('Ovo', 'cobertura', 'un', NULL, 1),
  ('Gorgonzola', 'cobertura', 'kg', NULL, 1),
  ('Parmesão Ralado', 'cobertura', 'kg', NULL, 1),
  ('Bacon', 'cobertura', 'kg', NULL, 1),
  ('Champignon', 'cobertura', 'kg', NULL, 1),
  ('Presunto Parma', 'cobertura', 'kg', NULL, 1),
  ('Lombinho Canadense', 'cobertura', 'kg', NULL, 1),
  ('Alho Poró', 'cobertura', 'kg', NULL, 1),
  ('Atum', 'cobertura', 'lata', NULL, 1),
  ('Frango', 'cobertura', 'kg', NULL, 1),
  ('Cebola', 'cobertura', 'kg', NULL, 1),
  ('Catupiry', 'cobertura', 'kg', NULL, 1),
  ('Ervilha', 'cobertura', 'kg', NULL, 1),
  ('Embalagem', 'operacao', 'un', NULL, 1),
  ('Tomate Cereja', 'molho', 'kg', NULL, 1),
  ('Embalagem Disco', 'operacao', 'un', NULL, 1),
  ('Água', 'cobertura', 'L', NULL, 1),
  ('Hortifruti', 'cobertura', 'medida', NULL, 1),
  ('Alho', 'cobertura', 'kg', NULL, 1),
  ('Alecrim', 'cobertura', 'maço', NULL, 1),
  ('Banana', 'cobertura', 'kg', NULL, 1),
  ('Escarola', 'cobertura', 'maço', NULL, 1),
  ('Salsinha', 'operacao', 'maço', NULL, 1),
  ('Mozzarela', 'cobertura', 'kg', NULL, 1),
  ('Mozzarella', 'cobertura', 'kg', NULL, 1),
  ('Parmesão', 'cobertura', 'kg', NULL, 1),
  ('Aliche', 'cobertura', 'kg', NULL, 1),
  ('Leite Condensado', 'cobertura', 'lata', NULL, 1),
  ('Açucar', 'cobertura', 'kg', NULL, 1),
  ('Chocolate Para Pizza', 'cobertura', 'kg', NULL, 1),
  ('Porção de Frango', 'cobertura', '1 porção', NULL, 1),
  ('Goiabada Artesanal', 'cobertura', 'kg', NULL, 1),
  ('Parma', 'cobertura', 'kg', NULL, 1),
  ('Tomate Seco', 'molho', 'kg', NULL, 1),
  ('Rend. da Receita:', 'cobertura', 'un', NULL, 1)
ON DUPLICATE KEY UPDATE category=VALUES(category), default_unit=VALUES(default_unit), active=1;

-- ═══ 3. CLIENTES (10) ═════════════════════════════════════════════
-- Vinícius usa TEMP-VINICIUS — após rodar, atualize com:
--   UPDATE orders SET customer_cpf='<CPF real>' WHERE customer_cpf='TEMP-VINICIUS';
--   UPDATE customers SET cpf='<CPF real>' WHERE cpf='TEMP-VINICIUS';
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

-- ═══ 4. PEDIDOS (passados=pago · 10/05=confirmado) ═══════════════
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
DELETE oi FROM order_items oi WHERE oi.order_id LIKE 'IMP-%';
INSERT INTO order_items (order_id, time_slot, flavor, finish, price) VALUES
  ('IMP-260315-1800-marcos-c', '18:00', 'Margueritha', 'Congelada', 55.0),
  ('IMP-260315-1800-marcos-c', '18:00', 'Calabria', 'Congelada', 58.0),
  ('IMP-260315-1830-tatiana-', '18:30', 'Calabria', 'Assada', 58.0),
  ('IMP-260315-1830-tatiana-', '18:30', 'Margueritha', 'Assada', 55.0),
  ('IMP-260315-1835-gustavo', '18:35', 'Calabria', 'Assada', 58.0),
  ('IMP-260315-1840-pedro', '18:40', 'Zucchinni e Bacon', 'Assada', 58.0),
  ('IMP-260315-1840-pedro', '18:40', 'Margueritha', 'Assada', 55.0),
  ('IMP-260315-1845-danilo', '18:45', 'Calabria', 'Assada', 58.0),
  ('IMP-260315-1850-lorena', '18:50', 'Calabria', 'Assada', 58.0),
  ('IMP-260315-1850-lorena', '18:50', '4 Fromaggio', 'Assada', 58.0),
  ('IMP-260315-1900-marcos-c', '19:00', 'Zucchinni e Bacon', 'Assada', 58.0),
  ('IMP-260315-1900-marcos-c', '19:00', 'Calabria', 'Assada', 58.0),
  ('IMP-260315-1905-arthur', '19:05', 'Zucchinni e Bacon', 'Assada', 58.0),
  ('IMP-260315-1915-vinicius', '19:15', 'Calabria', 'Assada', 58.0),
  ('IMP-260315-1915-vinicius', '19:15', 'Margueritha', 'Assada', 55.0),
  ('IMP-260403-1815-arthur', '18:15', 'Calabria', 'Assada', 60.0),
  ('IMP-260403-1830-gustavo', '18:30', 'Lombinho com Alho Poró', 'Assada', 62.0),
  ('IMP-260403-1845-marcos-c', '18:45', 'Margueritha', 'Assada', 58.0),
  ('IMP-260403-1900-marcos-c', '19:00', 'Calabria', 'Assada', 60.0),
  ('IMP-260403-1900-marcos-c', '19:00', 'Frango com Catupiry', 'Assada', 60.0),
  ('IMP-260403-1915-tatiana-', '19:15', 'Margueritha', 'Congelada', 58.0),
  ('IMP-260403-1930-tatiana-', '19:30', 'Lombinho com Alho Poró', 'Assada', 62.0),
  ('IMP-260403-1945-pollyana', '19:45', 'Margueritha', 'Assada', 58.0),
  ('IMP-260403-2000-pollyana', '20:00', 'Frango com Catupiry', 'Assada', 60.0),
  ('IMP-260403-2030-junior', '20:30', 'Frango com Catupiry', 'Assada', 60.0),
  ('IMP-260403-2030-junior', '20:30', 'Frango com Catupiry', 'Assada', 60.0),
  ('IMP-260403-2030-junior', '20:30', 'Calabria', 'Assada', 60.0),
  ('IMP-260503-1800-pedro', '18:00', 'Frango com Catupiry', 'Assada', 60.0),
  ('IMP-260510-1800-vinicius', '18:00', 'Calabria', 'Congelada', 60.0),
  ('IMP-260510-1800-vinicius', '18:00', 'Toscana', 'Congelada', 62.0),
  ('IMP-260510-1815-vinicius', '18:15', 'Margueritha', 'Assada', 58.0),
  ('IMP-260510-1830-vinicius', '18:30', 'Portuguesa', 'Assada', 62.0),
  ('IMP-260510-1845-lorena', '18:45', 'Calabria', 'Assada', 60.0),
  ('IMP-260510-1900-lorena', '19:00', 'Portuguesa', 'Assada', 62.0),
  ('IMP-260510-1915-lorena', '19:15', 'Calabria', 'Assada', 60.0),
  ('IMP-260510-1930-pollyana', '19:30', 'Margueritha', 'Assada', 58.0),
  ('IMP-260510-1945-pollyana', '19:45', 'Portuguesa', 'Assada', 62.0);

-- ═══ 6. COMPRAS HISTÓRICAS (DELIVERY 1 · 2026-03-15) ══════════════
DELETE FROM purchases WHERE notes = 'IMP-DELIVERY-1';
INSERT INTO purchases (product_id, quantity, unit, brand, total_cost, purchase_date, production_date, status, closed_at, notes) VALUES
  ((SELECT id FROM products WHERE LOWER(name) = LOWER('Mussarela') LIMIT 1), 3.036, 'kg', 'Queijo da Vaca', 130.49, '2026-03-13', '2026-03-15', 'used', NOW(), 'IMP-DELIVERY-1'),
  ((SELECT id FROM products WHERE LOWER(name) = LOWER('Farinha de Trigo') LIMIT 1), 3.0, 'un', 'Venturelli Alma Italiana', 30.0, '2026-03-13', '2026-03-15', 'used', NOW(), 'IMP-DELIVERY-1'),
  ((SELECT id FROM products WHERE LOWER(name) = LOWER('Abobrinha') LIMIT 1), 1.045, 'kg', NULL, 6.26, '2026-03-13', '2026-03-15', 'used', NOW(), 'IMP-DELIVERY-1'),
  ((SELECT id FROM products WHERE LOWER(name) = LOWER('Calabresa') LIMIT 1), 1.0, 'kg', NULL, 32.9, '2026-03-13', '2026-03-15', 'used', NOW(), 'IMP-DELIVERY-1'),
  ((SELECT id FROM products WHERE LOWER(name) = LOWER('Gorgonzola') LIMIT 1), 0.186, 'kg', NULL, 11.14, '2026-03-13', '2026-03-15', 'used', NOW(), 'IMP-DELIVERY-1'),
  ((SELECT id FROM products WHERE LOWER(name) = LOWER('Tomate Cereja') LIMIT 1), 0.6, 'kg', NULL, 20.97, '2026-03-13', '2026-03-15', 'used', NOW(), 'IMP-DELIVERY-1');

-- ════════════════════════════════════════════════════════════════════
-- ✓ Resumo: 8 sabores, 52 produtos, 10 clientes,
--          27 pedidos, 6 compras DELIVERY 1.
-- ════════════════════════════════════════════════════════════════════
