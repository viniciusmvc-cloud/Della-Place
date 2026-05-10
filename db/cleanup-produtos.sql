-- ════════════════════════════════════════════════════════════════════
-- Della Pace · Cleanup de produtos (Title Case + remove lixo + lista duplicados)
-- ────────────────────────────────────────────────────────────────────
-- Idempotente. Roda quantas vezes quiser.
-- Estratégia:
--   1. Remove lixo (Rend. da Receita:, etc.)
--   2. UPDATE IGNORE: vira Title Case quando seguro (sem conflito)
--   3. SELECT no final lista os duplicados que ainda restam pra você
--      decidir como mesclar (Mussarela vs Mozzarela vs Mozzarella, etc.)
-- ════════════════════════════════════════════════════════════════════
SET NAMES utf8mb4;

-- ═══ 1. REMOVE LIXO ═════════════════════════════════════════════════
DELETE FROM products WHERE name LIKE 'Rend.%' OR name LIKE 'CLASSIFICAÇÃO%';

-- ═══ 2. TITLE CASE (UPDATE IGNORE pra pular conflitos) ═════════════
-- Cobertura
UPDATE IGNORE products SET name = 'Abobrinha'           WHERE LOWER(name) = 'abobrinha';
UPDATE IGNORE products SET name = 'Açúcar'              WHERE LOWER(name) = 'açúcar';
UPDATE IGNORE products SET name = 'Alecrim'             WHERE LOWER(name) = 'alecrim';
UPDATE IGNORE products SET name = 'Alho'                WHERE LOWER(name) = 'alho';
UPDATE IGNORE products SET name = 'Atum'                WHERE LOWER(name) = 'atum';
UPDATE IGNORE products SET name = 'Bacon'               WHERE LOWER(name) = 'bacon';
UPDATE IGNORE products SET name = 'Banana'              WHERE LOWER(name) = 'banana';
UPDATE IGNORE products SET name = 'Cebola'              WHERE LOWER(name) = 'cebola';
UPDATE IGNORE products SET name = 'Champignon'          WHERE LOWER(name) = 'champignon';
UPDATE IGNORE products SET name = 'Ervilha'             WHERE LOWER(name) = 'ervilha';
UPDATE IGNORE products SET name = 'Escarola'            WHERE LOWER(name) = 'escarola';
UPDATE IGNORE products SET name = 'Frango'              WHERE LOWER(name) = 'frango';
UPDATE IGNORE products SET name = 'Hortifruti'          WHERE LOWER(name) = 'hortifruti';
UPDATE IGNORE products SET name = 'Lombinho Canadense'  WHERE LOWER(name) = 'lombinho canadense';
UPDATE IGNORE products SET name = 'Ovo'                 WHERE LOWER(name) = 'ovo';
UPDATE IGNORE products SET name = 'Parmesão Ralado'     WHERE LOWER(name) = 'parmesão ralado';
UPDATE IGNORE products SET name = 'Pimenta do Reino'    WHERE LOWER(name) = 'pimenta do reino';
UPDATE IGNORE products SET name = 'Presunto'            WHERE LOWER(name) = 'presunto';
UPDATE IGNORE products SET name = 'Presunto Parma'      WHERE LOWER(name) = 'presunto parma';
UPDATE IGNORE products SET name = 'Presunto Cozido'     WHERE LOWER(name) = 'presunto cozido';
UPDATE IGNORE products SET name = 'Rúcula'              WHERE LOWER(name) = 'rucula';
UPDATE IGNORE products SET name = 'Manjericão'          WHERE LOWER(name) = 'manjericão';
UPDATE IGNORE products SET name = 'Mussarela'           WHERE LOWER(name) = 'mussarela';
UPDATE IGNORE products SET name = 'Gorgonzola'          WHERE LOWER(name) = 'gorgonzola';
UPDATE IGNORE products SET name = 'Calabresa'           WHERE LOWER(name) = 'calabresa';
UPDATE IGNORE products SET name = 'Catupiry'            WHERE LOWER(name) = 'catupiry';
UPDATE IGNORE products SET name = 'Azeitona'            WHERE LOWER(name) = 'azeitona';
UPDATE IGNORE products SET name = 'Orégano'             WHERE LOWER(name) = 'orégano';

-- Massa
UPDATE IGNORE products SET name = 'Farinha de Trigo'    WHERE LOWER(name) = 'farinha de trigo';
UPDATE IGNORE products SET name = 'Farinha 00'          WHERE LOWER(name) = 'farinha 00';
UPDATE IGNORE products SET name = 'Sêmola'              WHERE LOWER(name) IN ('semola', 'sêmola');
UPDATE IGNORE products SET name = 'Fermento Seco'       WHERE LOWER(name) = 'fermento seco';
UPDATE IGNORE products SET name = 'Fermento Biológico'  WHERE LOWER(name) = 'fermento biológico';

-- Molho
UPDATE IGNORE products SET name = 'Molho de Tomate'     WHERE LOWER(name) = 'molho de tomate';
UPDATE IGNORE products SET name = 'Tomate Cereja'       WHERE LOWER(name) = 'tomate cereja';
UPDATE IGNORE products SET name = 'Tomate Seco'         WHERE LOWER(name) = 'tomate seco';
UPDATE IGNORE products SET name = 'Tomate San Marzano'  WHERE LOWER(name) = 'tomate san marzano';

-- Operação
UPDATE IGNORE products SET name = 'Sal'                 WHERE LOWER(name) = 'sal';
UPDATE IGNORE products SET name = 'Azeite'              WHERE LOWER(name) = 'azeite';
UPDATE IGNORE products SET name = 'Azeite Trufado'      WHERE LOWER(name) = 'azeite trufado';
UPDATE IGNORE products SET name = 'Azeite de Oliva'     WHERE LOWER(name) = 'azeite de oliva';
UPDATE IGNORE products SET name = 'Embalagem'           WHERE LOWER(name) IN ('embalagem', 'embalagens');
UPDATE IGNORE products SET name = 'Embalagem Disco'     WHERE LOWER(name) = 'embalagem disco';
UPDATE IGNORE products SET name = 'Salsinha'            WHERE LOWER(name) = 'salsinha';
UPDATE IGNORE products SET name = 'Água'                WHERE LOWER(name) = 'água';
UPDATE IGNORE products SET name = 'Alho Poró'           WHERE LOWER(name) IN ('alho poró', 'alho-poró');

-- ═══ 3. DUPLICADOS — listar pra você decidir merge ══════════════════
-- Quando rodar, vai aparecer uma tabela com os produtos duplicados.
-- Aí me manda a lista e eu te dou o SQL de merge específico.
SELECT
  LOWER(name) AS nome_normalizado,
  GROUP_CONCAT(CONCAT(id, ':', name) ORDER BY id SEPARATOR ' | ') AS variantes,
  COUNT(*) AS qtd
FROM products
GROUP BY LOWER(name)
HAVING qtd > 1
ORDER BY qtd DESC, nome_normalizado;
