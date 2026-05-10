-- Atualiza o endereço dos 10 clientes importados (todos moram no
-- mesmo prédio segundo Aurélio).
-- Roda no phpMyAdmin → SQL → Executar.
SET NAMES utf8mb4;

UPDATE customers
SET address = 'Alameda Pádua, 470, Pituba',
    block_apt = ''
WHERE cpf LIKE 'T-IMP-%' OR cpf = 'TEMP-VINICIUS';

-- Verificação:
-- SELECT cpf, full_name, address FROM customers WHERE cpf LIKE 'T-IMP-%' OR cpf = 'TEMP-VINICIUS';
