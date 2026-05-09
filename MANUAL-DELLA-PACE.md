# Manual de Uso · Della Pace Admin

> Pizzaria artesanal · Sistema de gestão completo
> Atualizado: 9 de Maio de 2026 · Versão 2.0

---

## 📲 Como instalar o app no celular

Os "apps" da Della Pace são **PWAs** (Progressive Web Apps). Funcionam como apps comuns (ícone na home, push notifications, modo offline parcial), mas instalam direto pelo navegador.

> **Importante:** Não há link `.apk` ou `.exe` pra baixar. Você instala visitando o site no navegador e adicionando à tela inicial.

### App do cliente

**Endereço:** https://dellapace.com.br

**Android (Chrome):**
1. Abra `dellapace.com.br` no Chrome
2. Toque no menu (3 pontinhos no topo direito)
3. Escolha **"Adicionar à tela inicial"** ou **"Instalar app"**
4. Confirme. Ícone aparece na home

**iPhone (Safari):**
1. Abra `dellapace.com.br` no **Safari** (não funciona no Chrome do iPhone)
2. Toque no botão de compartilhar (quadrado com seta pra cima)
3. Role até **"Adicionar à Tela de Início"**
4. Confirme

> **Cliente já cadastrado**: o app abre direto na tela `/pedido`, simplificada, com saudação "Olá, {nome}, qual o seu pedido hoje?" e o formulário de reserva.

### App do admin

**Endereço:** https://dellapace.com.br/admin

Mesmo processo, depois de fazer login.

### 🔔 Ativar notificações de novos pedidos

Depois de instalar o app admin:
1. Abra o app
2. **Configurações** → **Notificações de novos pedidos**
3. Clique em **"🔔 Ativar avisos neste celular"**
4. Permita as notificações no popup do celular

A partir daí, toda vez que um cliente reservar uma pizza, você recebe um push: "🍕 Novo pedido na Della Pace · {Nome} reservou X pizzas pra DD/MM às HH:MM. Total: R$ XX".

---

## 🔐 Como fazer login

**Endereço:** https://dellapace.com.br/login

### Primeira vez (sem senha definida)

1. Clique em **"Esqueci a senha · receber link por email"**
2. Digite seu email cadastrado
3. Verifique sua caixa de email (até 1 minuto)
4. Clique no link recebido. Entra direto.
5. Vá em **Configurações** → **Definir/alterar senha**
6. Senha atual: deixe em branco (ainda não tem). Nova senha: ≥8 caracteres
7. Salve

### Próximas vezes

Email + senha direto na tela de login.

### Esqueceu a senha

Botão **"Receber link por email"** continua funcionando como recuperação. Você ou outro admin pode também resetar manualmente em **Configurações → Administradores → 🔑 Resetar senha**.

---

## 🕐 Linha do tempo da operação semanal

```
SEGUNDA ─ QUINTA  ·  Cliente reserva
─────────────────────────────────────────────────────
   Cliente abre dellapace.com.br
   ↓
   Escolhe data, sabor, horário, finish, preenche cadastro
   ↓
   Sistema salva: 1 pedido com status "Pendente"
   Sistema envia: 1 push pro Aurélio ("🍕 Novo pedido")
   ↓
   Aurélio confere, conversa pelo WhatsApp,
   confirma → clica badge "Pendente" da coluna
   Confirmação → vira "Confirmado"
   ↓
   Mise en place atualiza sozinha:
   "Total da semana: 2.4kg mussarela, 0.8kg calabresa..."


SEXTA ─ SÁBADO  ·  Aurélio compra
─────────────────────────────────────────────────────
   Olha Mise en place pra saber o que precisa
   Confere "Estoque carregado" no topo de Compras
   (sobras de ciclos passados marcadas "Guardar")
   ↓
   Vai ao mercado
   ↓
   Volta e abre /admin/compras
   ↓
   Pra cada item comprado: produto (do catálogo),
   quantidade, valor, data → "Adicionar compra"


DOMINGO  ·  Produção e venda
─────────────────────────────────────────────────────
   Horário definido em Disponibilidade (default 18:00)
   ↓
   Pra cada pizza pronta:
     - cliente paga (pix, dinheiro)
     - Aurélio clica badge "Pendente" da coluna
       Pagamento → vira "Recebido"
   ↓
   Faturamento aparece em tempo real no Dashboard


DOMINGO 22:00 (ou segunda manhã)  ·  Encerramento
─────────────────────────────────────────────────────
   Banner amarelo aparece no Dashboard:
   "⏰ Encerrar ciclo de DD/MM"
   ↓
   2 tarefas pra completar:
     📦 Estoque: pra cada compra, escolha
        Acabou / Guardar / Pessoal / Descarte
     💰 Pagamentos: cobre quem ainda não pagou,
        marque "Recebi" ou cancele
   ↓
   Quando ambas zeradas, botão verde
   "🎉 Encerrar ciclo definitivamente"
   ↓
   Modal mostra resumo financeiro:
     Receita - Custo - Prejuízo + Estoque guardado
       = Lucro líquido
   ↓
   Confirma → ciclo encerrado
   Os "Guardar" aparecem na semana seguinte
   como "Estoque carregado" no topo de Compras


QUALQUER MOMENTO  ·  Despesas operacionais
─────────────────────────────────────────────────────
   Pagou conta de gás / luz / água / limpeza?
   /admin/financeiro → "Adicionar despesa"
```

---

## 📑 Aba por aba

### Dashboard

Tela inicial. Resumo de tudo + **único lugar onde você encerra ciclos**.

**O que faz:**
- 8 KPIs no topo (faturamento, lucro, pedidos, custo etc)
- Widget central "Encerrar ciclo" — quando há ciclo a fechar, mostra 2 caixinhas (estoque + pagamentos) e botão final

**O que preencher:** Nada. É só leitura + ação de encerramento.

**Como ler:**
- Selecione período (Hoje / Semana / Mês / Tudo) no canto superior direito
- Quando todas as 2 caixinhas do widget ficarem verdes ✓✓, aparece o botão final "🎉 Encerrar ciclo definitivamente"
- Clique nele pra ver o lucro líquido do ciclo

---

### Pedidos

Lista todas as reservas, em ordem cronológica de produção (horário primeiro).

**O que preencher:** Nada. Pedidos chegam automaticamente quando o cliente reserva pelo site.

**O que fazer:**
- **Confirmar pedido**: clique no badge "Pendente" da coluna Confirmação. Vira "Confirmado".
- **Marcar pago**: na entrega, clique no badge "Pendente" da coluna Pagamento. Vira "Recebido".
- **WhatsApp do cliente**: clique no telefone do cliente pra abrir conversa
- **Cancelar / outras ações**: use o menu ⋯ na última coluna

**O horário libera automaticamente** quando você cancela um pedido — outro cliente pode reservar aquele slot.

> Se você quiser cobrar pagamentos em massa de um domingo específico, vá pelo Dashboard → caixinha "💰 Pagamentos" do ciclo.

---

### Mise en place

Lista automática do que comprar pra um domingo de produção.

**O que preencher:** Nada. É calculado dos pedidos × receitas do Cardápio.

**Como ler:**
- Selecione a data no topo
- Mostra: total de pizzas + lista de ingredientes necessários
- Use essa lista pra fazer o mercado na sexta/sábado
- Depois de comprar, lance cada item em **Compras**

> A tela não desconta automaticamente o que você tem em estoque. Confronte com **Estoque** pra ver o que sobrou.

---

### Compras

Onde você lança cada compra real, amarrada a um domingo de produção.

**Quando preencher:** Sexta e sábado, conforme for fazendo o mercado.

**Como usar:**
1. Escolha o produto no dropdown (vem do catálogo de **Produtos**, agrupado por categoria)
2. Quantidade, valor pago, data da compra
3. Confirme o "Domingo de produção" (default: próximo domingo)
4. Clique **"Adicionar compra"**

> A marca do produto já está cadastrada em **Produtos**, não precisa repetir aqui.

**Não confunda:** Gás, luz, água, limpeza NÃO vão aqui. Vão em **Financeiro**.

---

### Estoque

Lista atual do que existe pra produzir, agregado por tipo de produto.

**O que preencher:** Nada. É calculado automaticamente das compras.

**Como ler:**
- "Ciclo atual · próximo domingo" no topo: o que foi comprado pra esse fim de semana
- KPIs: itens, valor investido, quantos vêm de carryover
- Tabela: cada produto com quantidade total e origem
- **Auto-decremento**: quando você marca um pedido como "Recebido", o sistema desconta os ingredientes da receita do estoque automaticamente (precisa ter ingrediente vinculado a um produto no Cardápio)

---

### Disponibilidade

Calendário onde você abre os dias de produção.

**Quando preencher:** Sempre que decidir abrir um novo dia de produção.

**Como usar:**
1. Clique no dia do calendário em que vai produzir
2. No modal: horário de início (default 18:00), capacidade, sabores ativos
3. Salve. Dia fica verde, clientes começam a reservar pelo site

**Avisar clientes:** Após abrir, clique em **"📣 Avisar clientes"**. Manda WhatsApp em massa pré-formatado E push pros que assinaram.

---

### Cardápio

Catálogo de SABORES (Marguerita, Calabria, etc).

**Quando preencher:** Quando criar/alterar um sabor.

**Como usar:**
- **+ Adicionar sabor**: cria novo
- **Clique no sabor**: abre o editor (nome, descrição, preço, ingredientes)
- **Excluir sabor**: botão vermelho 🗑 no header ou no rodapé
- **Inativo**: tira do site público mas mantém histórico
- **Ligar ingredientes a produtos**: pra que o auto-decremento funcione, em cada ingrediente da receita escolha o produto correspondente no dropdown "↳ Liga ao produto"

**Margem:** ≥50% verde, ≥30% amarelo, abaixo vermelho.

---

### Produtos

Catálogo de INGREDIENTES (Mussarela Tirolez, Calabresa Sadia, Farinha 00).

**Quando preencher:** Quando começar a usar um ingrediente novo. Os 16 iniciais já vêm cadastrados.

**Como usar:**
- 4 abas coloridas no topo: Massa, Molho, Cobertura, Operação
- **Adicionar produto**: nome, marca, unidade, observação
- Marque **uma OU mais categorias** (ex: tomate vai em molho + cobertura)
- **Editar**: clique em "Editar" no item — só altera marca, nome, unidade, observação. **Categoria é fixa** (pra mudar, apaga e cadastra de novo)
- **Apresentações diferentes** = produtos diferentes (ex: "Mussarela Fatiada" e "Mussarela Triturada")

---

### Financeiro

Despesas operacionais (NÃO ingredientes).

**Quando preencher:** Sempre que pagar conta de gás, luz, água, limpeza, manutenção, transporte.

**Como usar:**
- **+ Adicionar despesa**: categoria, valor, data, descrição
- KPIs no topo somam tudo: receita (de Pedidos pagos), custo (de Compras), despesas, lucro líquido

**Regra de bolso:**
- Se vira pizza → **Compras**
- Se faz a pizzaria funcionar → **Despesa Financeiro**

---

### Relatórios

Métricas detalhadas. Dois modos no topo: **Resumo** e **BI**.

**Resumo:**
- KPIs gerais com seletor de período
- Custo por pizza · breakdown por bloco
- Custo total da produção
- Faturamento por domingo
- Pizzas mais vendidas
- Acabamento preferido

**BI** (`/admin/relatorios/bi`):
- Faturamento por dia (linha, 60 dias)
- Saúde dos ciclos (barras empilhadas, 12 domingos)
- Pizzas mais vendidas
- Custo de produção por bloco (donut)
- Pedidos por horário
- Perfil dos clientes (donut por tier)
- Margem por sabor

---

### Clientes

CRM com histórico de cada cliente.

**Como usar:**
- Filtro A-Z na barra superior
- Busca por nome, CPF ou telefone
- Cada linha: tier (Ouro/Prata/Iniciante/Novo), pizzas, gasto total, frequência, sabor favorito
- Clique no telefone pra abrir WhatsApp
- Cards de alertas: Top, Inativos, Novos

---

### Sugestões

Lê as sugestões deixadas pelos clientes pelo formulário do site.

**Como usar:**
- Filtros: Todas / Novas / Lidas / Resolvidas / Arquivadas
- Pra cada sugestão, mude o status com 1 clique
- Apague depois que processar

---

### Comunidade

Modera os posts dos clientes (com fotos) que aparecem no site.

**Como usar:**
- Filtro padrão: "Aguardando"
- Pra cada post: aprove, oculte ou apague
- Marque **"Mostrar no Hero"** para os melhores aparecerem rotacionando no topo da home

---

### Configurações

Onde você gerencia administradores, sua senha e notificações.

**Seções:**
- **Definir/alterar senha** — sua senha pessoal
- **Notificações de novos pedidos** — ative no celular onde quer receber pushes de pedidos novos
- **Adicionar administrador** — cria novo admin (email, nome, telefone)
- **Administradores cadastrados** — lista com:
  - 📧 email · 📱 telefone (clique pra WhatsApp)
  - **Editar**: troca nome, email, telefone
  - **🔑 Resetar senha**: limpa a senha do outro admin (ele vai precisar entrar com link por email e definir nova)
  - **Desativar / Reativar**
  - **🗑 Remover**: apaga o admin

> Você não consegue desativar nem remover a si mesmo. Pra perder seu próprio acesso, primeiro adicione outro admin e peça pra ele te remover.

---

## 🆘 Problemas comuns

**"Não recebo o link por email"**
- Verifique spam.
- Confirme que o email cadastrado em Configurações está correto.

**"O badge de Confirmação/Pagamento não muda"**
- Verifique conexão com internet.
- Atualize a página (Cmd/Ctrl+R).

**"Push não chega no celular"**
- Configurações → "Ativar avisos neste celular".
- Permissão de notificação pro app no celular.
- iPhone: precisa estar instalado como PWA (não funciona no Safari aberto).

**"Esqueci o que cada aba faz"**
- Cada aba tem um banner azul **"📖 Como usar"** no topo. Clique pra expandir.

**"App não atualiza"**
- Hard refresh: `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows).
- PWA instalado: feche completamente e reabra.

---

## 📞 Contato

- **Site público:** https://dellapace.com.br
- **App cliente:** https://dellapace.com.br/pedido
- **Painel admin:** https://dellapace.com.br/admin
- **WhatsApp Aurélio:** (21) 98666-8009

---

*Manual atualizado em 9 de Maio de 2026.*
