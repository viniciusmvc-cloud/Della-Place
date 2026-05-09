# Manual de Uso · Della Pace Admin

> Pizzaria artesanal · Sistema de gestão completo
> dellapace.com.br · Versão 1.0 · Maio/2026

---

## 📲 Como instalar o app no celular

Os "apps" da Della Pace são **PWAs** (Progressive Web Apps). Eles funcionam como apps normais (ícone na tela inicial, push notifications, modo offline parcial), mas são instalados direto pelo navegador, sem passar pela App Store ou Play Store.

> **Importante:** Não existe um link tipo `.apk` ou `.exe` pra baixar. Você instala visitando o site no navegador e clicando em "Adicionar à tela inicial".

### App do cliente (público)

**Onde:** https://dellapace.com.br

**Android (Chrome):**
1. Abra `dellapace.com.br` no Chrome.
2. Toque no menu (3 pontinhos) no canto superior direito.
3. Escolha **"Adicionar à tela inicial"** ou **"Instalar app"**.
4. Confirme. O ícone aparece na tela inicial.

**iPhone (Safari):**
1. Abra `dellapace.com.br` no **Safari** (não funciona no Chrome do iPhone).
2. Toque no botão de compartilhar (quadrado com seta pra cima).
3. Role até **"Adicionar à Tela de Início"**.
4. Confirme com **"Adicionar"**.

### App do admin (Aurélio)

**Onde:** https://dellapace.com.br/admin

Mesmo processo do app do cliente, mas começando pela página de admin (após fazer login).

> **Dica:** Pra receber notificações de novos pedidos no celular, depois de instalar o app:
> 1. Abra o app instalado.
> 2. Vá em **Configurações** → **Notificações de novos pedidos**.
> 3. Clique em **"🔔 Ativar avisos neste celular"**.
> 4. Permita as notificações quando o celular pedir.

---

## 🔐 Como fazer login

**Endereço:** https://dellapace.com.br/login

**Primeiro acesso:**
1. Clique em **"Esqueci a senha · receber link por email"**.
2. Digite seu email cadastrado (`marcus.movil@gmail.com` ou outro autorizado).
3. Verifique sua caixa de email (pode demorar até 1 minuto).
4. Clique no link recebido. Entra direto.
5. Vá em **Configurações** → **Definir/alterar senha**.
6. Senha atual: deixe em branco. Nova senha: ≥8 caracteres.
7. Salve.

**Próximos acessos:** email + senha direto na tela de login.

**Esqueceu a senha de novo?** O botão "receber link por email" continua funcionando como recuperação.

---

## 🕐 Linha do tempo da operação

```
SEGUNDA ─ QUINTA  ·  Cliente reserva
─────────────────────────────────────────────────────────────────
   Cliente abre dellapace.com.br
   ↓
   Escolhe data, sabor, horário, finish, preenche cadastro
   ↓
   Sistema salva: 1 pedido com status "Pendente"
   Sistema envia: 1 push pra você ("🍕 Novo pedido")
   ↓
   Você confere, conversa pelo WhatsApp (clica no telefone do
   cliente em /admin/pedidos), confirma → clica badge
   "Pendente" da coluna Confirmação → vira "Confirmado"
   ↓
   Mise en place atualiza sozinha:
   "Total da semana: 2.4kg mussarela, 0.8kg calabresa, ..."


SEXTA ─ SÁBADO  ·  Você compra
─────────────────────────────────────────────────────────────────
   Olha Mise en place pra saber o que precisa
   Confere "Estoque carregado" no topo de Compras (sobras da
   semana passada que foram marcadas "Guardar")
   ↓
   Vai ao mercado
   ↓
   Volta e abre /admin/compras
   ↓
   Pra cada item comprado: produto (do catálogo de Produtos),
   quantidade, marca, valor, data → "Adicionar compra"


DOMINGO  ·  Produção e venda
─────────────────────────────────────────────────────────────────
   18:00 (ou horário definido em Disponibilidade) começa
   ↓
   Pra cada pizza pronta:
     - cliente paga (pix, dinheiro, na entrega)
     - você clica badge "Pendente" da coluna Pagamento
       → vira "Recebido"
   ↓
   Faturamento aparece em tempo real no Dashboard


DOMINGO 22:00 (ou segunda manhã)  ·  Encerramento
─────────────────────────────────────────────────────────────────
   Banner amarelo aparece sozinho no Dashboard:
   "⏰ Encerrar ciclo de 11/05 (8 compras)"
   ↓
   Click → /admin/compras/encerrar/2026-05-11
   ↓
   Pra cada compra desse domingo:
     ✓ Acabou       (caso normal: virou pizza, foi vendido)
     📦 Guardar     (sobrou bom: vira estoque pra próxima)
     🍽 Uso pessoal (levou pra casa: prejuízo)
     🗑 Descarte    (estragou: prejuízo)
   ↓
   Os "Guardar" aparecem na semana seguinte como
   "Estoque carregado" no topo de Compras. Ciclo recomeça.
```

---

## 📑 Aba por aba

### Dashboard

**O que faz:** Tela inicial. Resumo de tudo: faturamento, lucro, pedidos, pendências, custo de pizzas, despesas, sabor mais vendido.

**O que preencher:** Nada. É só leitura.

**Como ler:**
- **8 KPIs** no topo: faturamento, lucro, pedidos, pendentes, etc.
- **Banner amarelo** aparece sozinho quando há ciclo pra encerrar.
- **"Próximos pedidos"**: lista cronológica de quem reservou.
- **"Top clientes"**: quem mais comprou.
- **"Distribuição de sabores"**: barras com os mais vendidos.

---

### Pedidos

**O que faz:** Lista todas as reservas, em ordem cronológica de produção (horário primeiro).

**O que preencher:** Nada. Pedidos chegam automaticamente quando o cliente reserva pelo site.

**O que fazer:**
- **Confirmar pedido**: clique no badge "Pendente" da coluna Confirmação. Vira "Confirmado".
- **Marcar pago**: na entrega, clique no badge "Pendente" da coluna Pagamento. Vira "Recebido".
- **WhatsApp do cliente**: clique no telefone do cliente para abrir conversa direto.
- **Cancelar**: use o menu ⋯ → "Cancelar pedido". O horário fica disponível pra outro cliente.

**Não confunda:**
- Custos de ingredientes vão em Compras, não aqui.
- Despesas operacionais (gás, luz) vão em Financeiro.

---

### Mise en place

**O que faz:** Lista automática do que comprar pra um domingo de produção.

**O que preencher:** Nada. É calculado dos pedidos × receitas do Cardápio.

**Como ler:**
- Selecione a data no topo (próximo domingo).
- A tela mostra: total de pizzas + lista de ingredientes necessários.
- **Use essa lista pra fazer o mercado na sexta/sábado.**
- Depois de comprar, lance cada item em **Compras**.

> A tela não desconta automaticamente o que você tem em estoque. Confronte com "Estoque carregado" da aba Compras.

---

### Compras

**O que faz:** Onde você lança cada compra real, amarrada a um domingo de produção. Domingo à noite, encerra o ciclo.

**Quando preencher:** Sexta e sábado, conforme for fazendo o mercado. Cada item vira uma linha.

**Como usar:**
1. Escolha o produto no dropdown (vem do catálogo de **Produtos**, agrupado por categoria).
2. Quantidade, valor pago, data da compra.
3. Confirme o "Domingo de produção" (default: próximo domingo).
4. **"Adicionar compra"**.

**Estoque carregado:** Topo da página. Mostra o que sobrou de ciclos passados (status "Guardar"). Use o botão **Consumir** quando usar.

**Encerramento:** Botão amarelo "Encerrar ciclo" no rodapé da tela ou banner do Dashboard. Pra cada compra do dia, escolha:
- **✓ Acabou**: foi tudo consumido (caso normal).
- **📦 Guardar**: sobrou bom, vira estoque.
- **🍽 Uso pessoal**: foi pra casa.
- **🗑 Descarte**: estragou.

**Não confunda:** Gás, luz, água, limpeza NÃO vão aqui. Vão em **Financeiro**.

---

### Disponibilidade

**O que faz:** Calendário onde você abre os dias de produção.

**Quando preencher:** Sempre que decidir abrir um novo dia ou ajustar um já aberto.

**Como usar:**
1. Clique no dia do calendário em que vai produzir.
2. No modal: horário de início (default 18:00), capacidade (quantas pizzas), sabores ativos.
3. Salve. Dia fica verde, clientes começam a reservar.

**Avisar clientes:** Após abrir, clique em **"📣 Avisar clientes"** na lista de datas abertas. Manda WhatsApp em massa pré-formatado E push pros que assinaram.

**Capacity** é só referência (não bloqueia automaticamente).

---

### Cardápio

**O que faz:** Catálogo de SABORES (Marguerita, Calabria, etc).

**Quando preencher:** Quando criar/alterar um sabor.

**Como usar:**
- **+ Adicionar sabor**: cria novo.
- **Clique no sabor**: abre o editor (nome, descrição, preço, ingredientes).
- **Excluir sabor**: botão vermelho 🗑 no header ou no rodapé do editor.
- **Inativo**: tira do site público mas mantém histórico.

**Margem:** ≥50% verde, ≥30% amarelo, abaixo vermelho.

---

### Produtos

**O que faz:** Catálogo de INGREDIENTES (Mussarela, Calabresa, Farinha, etc).

**Quando preencher:** Quando comprar um ingrediente NOVO. Os 16 iniciais já vêm cadastrados.

**Como usar:**
1. Clique numa das **4 abas coloridas** no topo (Massa, Molho, Cobertura, Operação).
2. **Adicionar produto**: nome, unidade, observação, **categorias (uma OU mais)**.
3. **Editar**: clique em "Editar" no item.
4. **⊘**: desativa. **🗑**: apaga.

**Multi-categoria:** Um produto pode estar em mais de uma categoria. Ex: Tomate San Marzano vai em Molho E Cobertura. Marque ambas.

---

### Financeiro

**O que faz:** Despesas operacionais (NÃO ingredientes).

**Quando preencher:** Sempre que pagar conta de gás, luz, água, limpeza, manutenção, transporte.

**Como usar:**
- **+ Adicionar despesa**: categoria, valor, data, descrição.
- KPIs no topo somam tudo: receita (de Pedidos pagos), custo de pizzas (de Compras), despesas operacionais, lucro líquido.

**Regra de bolso:**
- Se vira pizza → **Compras**.
- Se faz a pizzaria funcionar → **Despesa Financeiro**.

---

### Relatórios

**O que faz:** Métricas detalhadas.

**O que ver:**
- KPIs gerais com seletor de período.
- **Custo por pizza · breakdown**: quanto cada sabor custa por bloco (massa, molho, cobertura).
- **Custo total da produção**: soma do custo de todas as pizzas vendidas no período.
- Faturamento por domingo.
- Pizzas mais vendidas.
- Acabamento preferido.

---

### Clientes

**O que faz:** CRM com histórico de cada cliente.

**Como usar:**
- Filtro A-Z na barra superior.
- Busca por nome, CPF ou telefone.
- Cada linha mostra: tier (Ouro/Prata/Iniciante/Novo), pizzas, gasto total, frequência, sabor favorito, última compra.
- Clique no telefone pra abrir WhatsApp.
- Cards de alertas: Top clientes, Inativos 30+ dias, Novos clientes.

---

### Sugestões

**O que faz:** Lê as sugestões deixadas pelos clientes pelo formulário do site.

**Como usar:**
- Filtros: Todas, Novas, Lidas, Resolvidas, Arquivadas.
- Pra cada sugestão, mude o status com 1 clique.
- Apague depois que processar.

---

### Comunidade

**O que faz:** Modera os posts dos clientes (com fotos) que aparecem no site.

**Como usar:**
- Filtro padrão: "Aguardando".
- Pra cada post: aprove, oculte ou apague.
- Marque "Mostrar no Hero" para os melhores aparecerem rotacionando no topo da home.

---

### Configurações

**O que faz:**
- Adicionar/remover administradores.
- Definir/alterar sua senha.
- Ativar avisos push de novos pedidos no celular.

---

## 🆘 Problemas comuns

**"Não recebo o link por email"**
- Verifica spam.
- Confirma que o email cadastrado em Configurações é o seu.

**"O badge de Confirmação/Pagamento não muda"**
- Verifica conexão com internet.
- Atualiza a página (Cmd/Ctrl+R).

**"Push não chega no celular"**
- Vai em Configurações → "Ativar avisos neste celular".
- Garanta que o celular tem permissão de notificação pro app.
- iPhone: precisa estar instalado como PWA (não funciona no Safari aberto).

**"Esqueci o que cada aba faz"**
- Cada aba tem um banner azul **"📖 Como usar"** no topo. Clique pra expandir.

---

## 📞 Contato

- **Site público:** https://dellapace.com.br
- **Painel admin:** https://dellapace.com.br/admin
- **WhatsApp Aurélio:** (21) 98666-8009

---

*Manual atualizado em 9 de Maio de 2026.*
