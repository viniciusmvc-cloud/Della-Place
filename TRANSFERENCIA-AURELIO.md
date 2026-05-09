# Guia de Transferência · Della Pace para Aurélio

> Documento para transferência total de propriedade do sistema Della Pace.
> Após executar todos os passos, o Vinícius sai do circuito completamente
> e o Aurélio fica com 100% do controle: domínio, código, banco e dados.
>
> Atualizado: 9 de Maio de 2026

---

## 🎯 Visão geral

O sistema da Della Pace tem **5 partes** que precisam ser transferidas:

| # | Parte | O que é | Onde está hoje | Custo mensal |
|---|---|---|---|---|
| 1 | **Domínio** | `dellapace.com.br` | registro.br (no nome do Vinícius) | ~R$ 4 / mês |
| 2 | **Código-fonte** | Arquivos do programa | GitHub (vinicius) | Grátis |
| 3 | **Hospedagem** | Onde o site roda | Vercel (vinicius) | Grátis (free tier) |
| 4 | **Banco de dados** | Tabelas com pedidos, clientes, etc | Hostinger MySQL | ~R$ 35 / mês |
| 5 | **Email SMTP** | Mandar emails de login | Hostinger Email | Incluso na hospedagem |

> **Custo total estimado pra Aurélio**: ~R$ 50/mês (domínio + hospedagem). Pode reduzir se trocar de provedor.

---

## ✅ Pré-requisitos (Aurélio precisa criar contas)

Antes de qualquer transferência, Aurélio precisa criar **5 contas pessoais**:

### 1. Email principal

Pode ser Gmail, Outlook, ou o que preferir. **Esse email vai ser dono de tudo**, então use um pessoal e seguro.

Sugestão: `aurelio.dellapace@gmail.com` (ou similar) — separado do email pessoal pra organizar.

### 2. Conta no GitHub

- Acesse https://github.com/signup
- Email: o email principal acima
- Username: `aureliopaz` (ou similar — fica como autor do código)
- Senha forte, 2FA habilitado

### 3. Conta na Vercel

- Acesse https://vercel.com/signup
- **Importante**: faça login **com a conta GitHub** que acabou de criar (Vercel pega seu repo direto)
- Plano: Hobby (grátis, suficiente pra Della Pace)

### 4. Conta na Hostinger

- Acesse https://hostinger.com.br
- Plano: o que já tem hoje (compartilhado com banco MySQL e email).
  Custo: ~R$ 35/mês. Renova anual ou mensal.
- **Importante**: registre com CPF do Aurélio

### 5. Conta no registro.br

- Acesse https://registro.br
- Cadastre com CPF do Aurélio
- Esse é o registrador do domínio `.com.br`

> **Tudo isso o Aurélio faz sozinho. Vinícius só fornece os passos.**

---

## 🔄 Ordem de transferência (executar nessa sequência)

A ordem importa: precisa garantir que cada parte esteja independente do Vinícius antes da próxima.

### Etapa 1 — Aurélio prepara o terreno (sem mexer no Vinícius)

1.1. Cria conta GitHub
1.2. Cria conta Vercel (login via GitHub)
1.3. Cria conta Hostinger (compra hospedagem com banco MySQL + email)
1.4. Cria conta registro.br

### Etapa 2 — Transferir o código

**Opção A: Transfer ownership (preferida)**

Vinícius:
1. Vai em https://github.com/viniciusmvc-cloud/Della-Place
2. **Settings** → role até **Danger Zone** → **Transfer ownership**
3. Digita: `Della-Place`
4. New owner: username do GitHub do Aurélio
5. Confirma

Aurélio:
6. Recebe email pedindo aceite
7. Aceita

✅ **Pronto.** O repositório agora é `https://github.com/aureliopaz/Della-Place` (substitua pelo username dele).

**Opção B: Aurélio faz fork (caso transfer dê problema)**

Aurélio:
1. Vai no repo `viniciusmvc-cloud/Della-Place`
2. Clica em **Fork** (canto superior direito)
3. O fork vira `aureliopaz/Della-Place`

### Etapa 3 — Aurélio cria o projeto Vercel

Aurélio:
1. Vai em https://vercel.com/new
2. Importa o repositório dele (`aureliopaz/Della-Place`)
3. Framework Preset: **Next.js** (Vercel detecta sozinho)
4. Antes de "Deploy", clica em **Environment Variables** e cola TODAS:

```
DB_HOST                       = (preencher na etapa 4)
DB_PORT                       = 3306
DB_USER                       = (preencher na etapa 4)
DB_PASSWORD                   = (preencher na etapa 4)
DB_NAME                       = (preencher na etapa 4)

NEXTAUTH_SECRET               = gere com `openssl rand -hex 32` ou
                                copie do .env do Vinícius
NEXT_PUBLIC_APP_URL           = https://dellapace.com.br
NEXT_PUBLIC_APP_NAME          = Della Pace - Pizzeria Artigianale
NEXT_PUBLIC_WHATSAPP_PHONE    = 5521986668009

EMAIL_SERVER_HOST             = smtp.hostinger.com
EMAIL_SERVER_PORT             = 587
EMAIL_SERVER_USER             = contato@dellapace.com.br
EMAIL_SERVER_PASSWORD         = (preencher na etapa 4)
EMAIL_FROM                    = contato@dellapace.com.br

NEXT_PUBLIC_VAPID_PUBLIC_KEY  = (gerar novas com `npx web-push generate-vapid-keys`)
VAPID_PRIVATE_KEY             = (idem)
VAPID_SUBJECT                 = mailto:contato@dellapace.com.br
```

5. Clica **Deploy**. Vai dar erro de conexão com banco (normal, ainda não foi configurado). Continua na etapa 4.

### Etapa 4 — Aurélio configura banco + email na Hostinger

Aurélio:

**4.1. Cria o banco MySQL**

1. Login no painel Hostinger → **Banco de dados** → **MySQL**
2. **Criar novo banco**:
   - Nome do banco: `dellapace_main` (ou similar)
   - Usuário: criar novo, senha forte
3. Anote: `host`, `port` (3306), `database name`, `user`, `password`
4. Volta no Vercel → Settings → Environment Variables → preenche:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

**4.2. Importa o schema (estrutura das tabelas)**

1. Vinícius envia o arquivo `db/migrate-all.sql` (que está no repo, em `Della-Place/db/`)
2. No phpMyAdmin → seleciona banco recém-criado → aba **SQL** → cola conteúdo do arquivo → **Executar**
3. Verifica em **Estrutura** que tem todas as tabelas: `customers`, `orders`, `products`, `purchases`, etc.

**4.3. Importa os dados (se quiser começar com histórico)**

Se Aurélio quiser começar **do zero** (sem histórico de testes), pula essa etapa. As tabelas já estão criadas vazias.

Se Aurélio quiser **manter os dados**:
1. Vinícius exporta um dump do banco atual (Hostinger panel → exportar SQL)
2. Envia o arquivo ao Aurélio
3. Aurélio importa via phpMyAdmin → **Importar**

> **Recomendação**: começar do zero é mais limpo. Os dados de teste eram pra desenvolvimento.

**4.4. Configura email SMTP**

1. Painel Hostinger → **Emails** → **Conta de email**
2. Cria `contato@dellapace.com.br` com senha
3. Anota a senha. Volta no Vercel → preenche `EMAIL_SERVER_PASSWORD`

**4.5. Gera novas VAPID keys (push notifications)**

No terminal do Aurélio (ou no Vercel CLI, ou peça pra você gerar e ele só copiar):
```bash
npx web-push generate-vapid-keys
```

Saída:
```
Public Key: BPQ9-...
Private Key: ezE6t...
```

Cola no Vercel:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = a Public Key
- `VAPID_PRIVATE_KEY` = a Private Key
- `VAPID_SUBJECT` = `mailto:contato@dellapace.com.br`

**4.6. Redeploy**

Vercel → último deployment → **Redeploy**. Agora deve funcionar.

### Etapa 5 — Transferir o domínio `dellapace.com.br`

Esse é o passo mais delicado. Faça quando tudo o mais já estiver OK.

**No Vercel (Aurélio)**:
1. Settings → **Domains** → **Add**
2. Digita: `dellapace.com.br`
3. Vercel mostra os valores de DNS pra apontar (vai usar na etapa abaixo)
4. Tira screenshot dos valores

**No registro.br (Vinícius)**:
1. Login em registro.br com a conta atual
2. Vai em **Meus domínios** → `dellapace.com.br`
3. **Liberar** (Vinícius solicita liberação) — gera código de transferência
4. Anota o código (ex: `XXXX-YYYY-ZZZZ`)
5. Manda código pro Aurélio

**No registro.br (Aurélio)**:
1. Login com a nova conta dele
2. **Transferir domínio** → digita `dellapace.com.br` + código
3. Aceita transferência (pode levar 24-72h pra propagação)
4. Quando o domínio aparecer em "Meus domínios" do Aurélio, ele edita os **DNS**:
   - **Não usar Hostinger DNS**
   - **Apontar pra Vercel**:
     - Tipo `A` → host `@` → valor `76.76.21.21`
     - Tipo `CNAME` → host `www` → valor `cname.vercel-dns.com`
   - (Os valores exatos vêm da Vercel quando adicionar o domínio lá)

5. Aguarda propagação DNS (até 48h). Pode testar com https://dnschecker.org.

### Etapa 6 — Smoke test final

Aurélio testa tudo:

- [ ] `https://dellapace.com.br` carrega o site
- [ ] `https://dellapace.com.br/admin` redireciona pra login
- [ ] Login com email + senha funciona
- [ ] Criar pedido pelo site funciona (push notifica admin)
- [ ] Marcar pedido como pago funciona
- [ ] Push notification chega no celular
- [ ] Cardápio mostra os sabores
- [ ] BI mostra gráficos (mesmo sem dados, deve carregar)

### Etapa 7 — Vinícius limpa as próprias contas

Depois que tudo funcionar com Aurélio:

1. Vinícius **deleta** o projeto antigo na Vercel (o seu)
2. Vinícius **deleta** o repositório antigo no GitHub (se foi fork; se foi transfer, já é do Aurélio)
3. Vinícius **encerra** o banco MySQL antigo na Hostinger
4. Vinícius **revoga** seus acessos como admin no painel:
   - Aurélio entra em `dellapace.com.br/admin/configuracoes`
   - Em "Administradores cadastrados", clica em 🗑 Remover ao lado do email do Vinícius

✅ **Transferência total concluída.**

---

## 🛡️ Manutenção pós-transferência

Aurélio NÃO precisa saber programar. Só precisa saber:

### Para mudar algo no código

Opções:
- **Contratar um dev** (R$ 100-200/h, projeto pequeno = poucas horas) pra ajustes pontuais
- **Pedir favor a um amigo** (Vinícius pode ser um, mas SEM acesso permanente)
- **Manter como está** se o sistema atende as necessidades

### Para voltar a ter o Vinícius como suporte

Se algum dia Aurélio quiser, adiciona o email do Vinícius como **colaborador no GitHub** (Settings → Collaborators → Add people). Vinícius pode propor mudanças via Pull Request, mas só Aurélio aprova.

Pode ser revogado a qualquer momento.

### Para pagar conta

- **Hostinger**: cartão recorrente OU boleto a cada 12 meses
- **registro.br**: anual, ~R$ 40
- **Vercel**: grátis (free tier suficiente)

### Para ver os dados crus

Painel Hostinger → phpMyAdmin → escolhe o banco `dellapace_*`. Lá Aurélio vê todas as tabelas, pedidos, etc.

### Para fazer backup

Painel Hostinger → **Bancos de dados** → **Exportar**. Faz isso a cada 1-3 meses. Salva o arquivo `.sql` no Drive/Dropbox.

---

## 🆘 Suporte de emergência

Se algo quebrar e Aurélio não souber resolver, pode:

1. **Status check**: `https://www.vercel-status.com/` (Vercel) e `https://www.hostinger.com.br/status` (Hostinger). Se algum estiver vermelho, é deles, espera resolver.

2. **Restaurar de backup**: phpMyAdmin → **Importar** → escolhe o último backup. Volta tudo ao estado anterior.

3. **Reverter código**: GitHub → repositório → **Releases** ou **Tags** → escolhe versão anterior → Vercel → **Redeploy**.

4. **Pedir ajuda**: dev pode olhar e resolver em 1-2h por R$ 200-400.

---

## 📋 Checklist final

Use isso pra acompanhar:

### Aurélio prepara
- [ ] Cria email principal
- [ ] Cria conta GitHub
- [ ] Cria conta Vercel
- [ ] Compra Hostinger (com MySQL + email)
- [ ] Cria conta registro.br

### Transferência do código
- [ ] Vinícius transfere o repo no GitHub
- [ ] Aurélio aceita transferência

### Vercel + banco
- [ ] Aurélio importa o repo no Vercel
- [ ] Aurélio cria banco MySQL na Hostinger
- [ ] Aurélio roda `migrate-all.sql` no phpMyAdmin
- [ ] Aurélio configura SMTP de email
- [ ] Aurélio gera novas VAPID keys
- [ ] Aurélio preenche todas as env vars no Vercel
- [ ] Vercel deploy: Ready (verde)

### Domínio
- [ ] Vinícius solicita liberação no registro.br
- [ ] Aurélio aceita transferência
- [ ] DNS apontado pra Vercel
- [ ] Domínio propaga (24-48h)

### Validação
- [ ] Site carrega em `dellapace.com.br`
- [ ] Login funciona
- [ ] Pedido + push funcionam
- [ ] Aurélio remove o admin Vinícius do painel

### Limpeza
- [ ] Vinícius deleta projeto antigo Vercel
- [ ] Vinícius deleta repo antigo GitHub
- [ ] Vinícius encerra MySQL antigo Hostinger

---

## 📞 Ao final

Quando todos os checks acima estiverem ✅:

- Della Pace é 100% do Aurélio.
- Vinícius não tem mais nenhum acesso técnico ao sistema.
- Aurélio paga ~R$ 50/mês de hospedagem + domínio.
- Sistema continua funcionando normalmente — clientes não notam diferença.

> Tempo total estimado de transferência: **3-5 dias** (a maior parte é esperar o DNS propagar). Trabalho ativo: ~4-6h.

---

*Documento atualizado em 9 de Maio de 2026.*
