# Quatro Patas — Plataforma de Resgate, Adoção e Proteção Animal

> *"Cada vida importa. Cada gesto transforma."*

Plataforma full-stack desenvolvida em **React + TypeScript + Tailwind CSS + Express + SQLite/PostgreSQL**, dedicada ao resgate, cuidado veterinário, adoção responsável, apadrinhamento, voluntariado e arrecadação transparente para cães abandonados.

---

## Rotas Implementadas

| Rota | Descrição |
| --- | --- |
| `/` | Página inicial com banner, números reais do banco, cães, campanhas, como ajudar, histórias, depoimentos, voluntariado e newsletter |
| `/sobre` | Missão, história, valores, protocolo de resgate e equipe/parceiros |
| `/doar` | Fluxo de doação única, mensal ou recorrente via PIX ou Cartão (integrado ao Mercado Pago) |
| `/doar/confirmacao` | Página de protocolo e status real da doação (QR Code PIX / link Checkout Pro ou aviso quando gateway não está configurado) |
| `/adocao` | Catálogo de cães com filtros por idade, porte, sexo, localização e busca |
| `/adocao/:id` | Perfil completo do cão e formulário de interesse em adoção |
| `/campanhas` | Campanhas com progresso calculado exclusivamente de doações confirmadas |
| `/campanhas/:id` | Detalhes da campanha e histórico anonimizado de contribuições |
| `/apadrinhar` | Cães disponíveis para apadrinhamento mensal e atualizações |
| `/voluntariado` | Oportunidades presenciais/remotas e formulário de inscrição |
| `/historias` | Blog de resgates e adoções |
| `/historias/:id` | Leitura completa, compartilhamento social e comentários moderados |
| `/transparencia` | Prestação de contas com doações confirmadas, despesas verificadas, relatórios e comprovantes |
| `/contato` | Formulário de contato e canais oficiais |
| `/privacidade` | Política de Privacidade e adequação à LGPD |
| `/login` | Autenticação da equipe (JWT + bcrypt) |
| `/admin` | Painel administrativo com níveis de acesso (`Administrador` e `Colaborador`) e upload de imagens/comprovantes |

---

## Estrutura de Pastas

```
├── database/
│   └── schema.sql            # Script DDL completo para PostgreSQL / Supabase
├── src/
│   ├── assets/images/        # Fotografias geradas localmente
│   ├── components/           # Layout, cabeçalho, rodapé, pesquisa global e imagens resilientes
│   ├── context/              # AuthContext e configurações institucionais
│   ├── lib/                  # Formatação BRL, datas e estados
│   ├── pages/                # Todas as páginas públicas e painel administrativo
│   ├── server/
│   │   ├── db.ts             # Banco SQLite local (node:sqlite) e seed demonstrativo identificado
│   │   ├── auth.ts           # JWT, RBAC e proteção anti-spam (honeypot + rate limit)
│   │   └── payments.ts       # Integração real Mercado Pago (PIX + Checkout Pro + Webhook HMAC)
│   └── types/                # Interfaces TypeScript compartilhadas
├── uploads/                  # Arquivos enviados pelo painel administrativo
├── server.ts                 # Servidor Express + APIs REST + Vite
└── .env.example              # Modelo de variáveis de ambiente
```

---

## Instalação Local

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente**:
   Copie `.env.example` para `.env` e ajuste os valores:
   ```bash
   cp .env.example .env
   ```

3. **Inicie em modo de desenvolvimento**:
   ```bash
   npm run dev
   ```
   A plataforma estará disponível em `http://localhost:3000`.

### Credenciais Iniciais do Painel (`/login`)
Na primeira execução (quando a tabela `users` está vazia), é criado o administrador inicial usando `ADMIN_INITIAL_EMAIL` e `ADMIN_INITIAL_PASSWORD`:
- **E-mail**: `admin@quatropatas.org`
- **Senha**: `QuatroPatas@2026`

> Em produção, defina uma senha forte em `.env` e crie contas específicas para colaboradores (`role: collaborator`) em `/admin` -> **Equipe & Config.**

---

## Configuração de Pagamentos Reais (Mercado Pago)

Esta plataforma **nunca simula pagamentos aprovados** e **nunca armazena dados de cartão**.

1. Crie uma aplicação no painel de desenvolvedores do **Mercado Pago**.
2. Defina no `.env` ou nas variáveis do servidor:
   - `MERCADOPAGO_ACCESS_TOKEN`: seu token de produção (ou sandbox oficial de testes do Mercado Pago).
   - `MERCADOPAGO_WEBHOOK_SECRET`: segredo da assinatura `x-signature` configurada no painel de Webhooks.
   - `APP_URL`: URL pública HTTPS do seu site (ex: `https://quatropatas.org.br`).
3. Configure o Webhook no Mercado Pago apontando para:
   ```
   https://seu-dominio.com/api/webhooks/mercadopago
   ```
4. Somente após a confirmação oficial pelo webhook (ou conferência manual de comprovante pelo Administrador em `/admin`), a doação recebe `status = 'confirmed'` e passa a somar nas barras de campanha e na página de Transparência Financeira.

---

## Banco de Dados para Produção (PostgreSQL / Supabase)

O servidor inicia automaticamente com **SQLite nativo** (`data/quatropatas.db`) para funcionamento imediato sem dependências externas. Caso deseje migrar para **PostgreSQL** ou **Supabase**, execute o script completo disponível em `database/schema.sql`.

---

## Publicação Online (Deploy)

1. Gere o build do frontend:
   ```bash
   npm run build
   ```
2. Defina `NODE_ENV=production`, `PORT=3000`, `JWT_SECRET` seguro e `APP_URL` no provedor (Cloud Run, Render, Railway, VPS Ubuntu/Nginx ou Fly.io).
3. Inicie o servidor em produção:
   ```bash
   npm start
   ```
4. Em servidores com disco efêmero, monte um volume persistente para `/data` (banco) e `/uploads` (imagens/comprovantes), ou conecte ao PostgreSQL utilizando `database/schema.sql`.
