-- Substitui TEMP-VINICIUS pelo CPF real do Marcus Vinícius
-- + atualiza nome (com acentos) e telefone.
--
-- Por que SET FOREIGN_KEY_CHECKS=0?
--   customers.cpf é PK e orders.customer_cpf tem FK pra ele.
--   Não há ON UPDATE CASCADE, então o UPDATE da PK falharia se
--   houvesse linhas em orders apontando pra ela.
--   Desabilitamos a checagem temporariamente, atualizamos as 2
--   tabelas, e restauramos.
--
-- Idempotente: após rodar uma vez, o CPF 322.236.118-50 já existe
-- e UPDATE WHERE cpf='TEMP-VINICIUS' não afeta nenhuma linha.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

UPDATE customers
SET cpf = '322.236.118-50',
    full_name = 'Marcus Vinícius Macêdo Rôxo de Carvalho',
    phone = '71999005639'
WHERE cpf = 'TEMP-VINICIUS';

UPDATE orders
SET customer_cpf = '322.236.118-50'
WHERE customer_cpf = 'TEMP-VINICIUS';

SET FOREIGN_KEY_CHECKS = 1;

-- Verificação:
-- SELECT cpf, full_name, phone FROM customers WHERE cpf = '322.236.118-50';
-- SELECT id, customer_cpf, delivery_date FROM orders WHERE customer_cpf = '322.236.118-50';
