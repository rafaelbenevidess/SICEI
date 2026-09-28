# SICEI: Operação

| | |
|---|---|
| **Documento** | 06, Operação (instalação, execução, testes, publicação, backup) |
| **Versão** | 1.1 |
| **Base** | [03, System Design](03-system-design.md) |

## 1. Pré-requisitos

- Node.js 22 ou mais novo
- PostgreSQL 16 ou mais novo (local, Docker ou Neon)

## 2. Banco de dados: dois usuários

O SICEI usa dois usuários no PostgreSQL (doc 03, seção 5.2). Cada empresa cliente tem a própria instalação, e os nomes levam a sigla da empresa (doc 03, seção 7). No desenvolvimento e na CI a sigla é `dev`.

| Usuário | Para quê | Pode alterar o histórico? |
|---|---|---|
| `sicei_<sigla>_owner` | Dono do banco. Roda as migrations. | Não pelo sistema: os triggers barram UPDATE, DELETE e TRUNCATE em `movimentacao` e `audit_log`. |
| `sicei_<sigla>_app` | Usado pela aplicação em execução. | Não: só tem SELECT e INSERT nessas tabelas. |

Criação local, uma única vez, como superusuário:

```sql
CREATE ROLE sicei_dev_owner LOGIN PASSWORD 'troque-esta-senha' CREATEDB;
CREATE ROLE sicei_dev_app   LOGIN PASSWORD 'troque-esta-senha';
CREATE DATABASE sicei_dev OWNER sicei_dev_owner;
```

As permissões do `sicei_<sigla>_app` são dadas pelas migrations, então o usuário precisa existir antes do primeiro `db:migrate`.

`CREATEDB` só é necessário no desenvolvimento, porque o `prisma migrate dev` cria um banco temporário.

## 3. Rodar localmente

```bash
cp .env.example .env         # preencha DATABASE_URL (sicei_dev_app) e DIRECT_URL (sicei_dev_owner)
npm install                  # também gera o cliente do Prisma
npm run db:migrate           # aplica as migrations com o sicei_dev_owner
npm run db:seed              # parâmetros + usuário admin (senha provisória aparece no terminal)
SEED_DEMO=1 npm run db:seed  # opcional: dados de demonstração e 3 usuários de exemplo
npm run dev                  # http://localhost:3000
```

No primeiro acesso, entre com `admin` e a senha provisória mostrada pelo seed. O sistema obriga a troca da senha.

## 4. Testes

| Comando | O que faz |
|---|---|
| `npm test` | Testes unitários (regras de negócio, schemas, laboratório, componentes) |
| `npm run test:cobertura` | Unitários com cobertura (meta ≥ 90% em `src/domain`) |
| `npm run test:ui` | Vitest UI no navegador, para rodar ao vivo na apresentação |
| `npm run test:integracao` | Testes com PostgreSQL real: concorrência, triggers, permissões, sessões, fraude detectada |
| `npm run test:e2e` | Ponta a ponta com Playwright no build de produção (banco `sicei_e2e`; rode `npm run build:app` antes) |
| `npm run verificar` | Lint, tipos, formatação e testes unitários (rode antes de cada commit) |

Os testes de integração usam o banco `sicei_teste`, que é apagado e recriado a cada execução. As URLs podem ser trocadas com `DATABASE_URL_TESTE` e `DIRECT_URL_TESTE`.

Para o avaliador, os testes das regras também rodam no navegador, sem instalar nada, em `/testes` (RNF-13). O relatório completo da suíte, com a cobertura, fica em `/relatorio-testes/index.html` depois do `npm run build`.

## 5. Publicação de uma empresa cliente (Vercel + Neon)

Cada empresa que licencia o SICEI ganha uma instalação própria (doc 03, seção 7, ADR-12). O exemplo usa a DDA Metalúrgica, com sigla `dda`.

1. No Neon, crie um projeto `sicei-<empresa>` (ex.: `sicei-ddametalurgica`), com o banco `sicei_<sigla>` (`sicei_dda`) e o dono `sicei_<sigla>_owner` (`sicei_dda_owner`), pelo console ou pela API.
2. **O `sicei_<sigla>_app` precisa ser criado por SQL**, conectado como o dono: `CREATE ROLE sicei_dda_app LOGIN PASSWORD '...'`. Não crie pelo console nem pela API: papéis criados assim entram no grupo `neon_superuser`, que tem `pg_write_all_data` e anularia a proteção do histórico.
3. Na Vercel, crie um projeto `sicei-<empresa>` ligado ao repositório, adicione o domínio `sicei-<empresa>.vercel.app` e configure as variáveis:
   - `SICEI_LICENCIADA`: nome da empresa, como aparece no login e no rodapé. Se a empresa tiver logo, coloque o arquivo com fundo transparente em `public/licenciadas/<chave>.png`, em que a chave é o nome em minúsculas, sem acentos e com hífens (DDA Metalúrgica → `dda-metalurgica`), e registre o arquivo e o tamanho em `LOGOS_DAS_LICENCIADAS` (`src/lib/produto.ts`). A logo aparece só na tela de login; sem ela, o login mostra só a marca do SICEI.
   - `DATABASE_URL`: URL com pooling, usuário `sicei_<sigla>_app`
   - `DIRECT_URL`: URL direta, usuário `sicei_<sigla>_owner`
   - `APP_URL`: `https://sicei-<empresa>.vercel.app` (usado no QR das etiquetas e nos e-mails)
   - `CRON_SECRET`: texto aleatório longo (a Vercel manda no cabeçalho da rotina diária)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: e-mail corporativo, se houver
   - `SEED_SENHA_ADMIN`: senha provisória do `admin` no primeiro deploy (a troca é obrigatória no primeiro acesso)
   - `SEED_DEMO`: `1` para carregar os dados de demonstração no primeiro deploy

   Se a integração Neon da Vercel estiver ligada, ela cria sozinha um `DATABASE_URL` com o usuário dono do banco. Troque o valor de produção pela URL do `sicei_<sigla>_app`; o `DATABASE_URL_UNPOOLED` que ela cria não é usado pelo SICEI.
4. O build da Vercel (`npm run vercel-build`, definido no `vercel.json`) roda `prisma migrate deploy`, depois o seed e depois o build com os testes. O seed é idempotente: cria o `admin` só se não houver Administrador, com a senha de `SEED_SENHA_ADMIN` (ou uma aleatória, mostrada no log do build), e os dados de demonstração só se `SEED_DEMO=1` e o banco não tiver itens.
5. As senhas provisórias dos usuários de demonstração aparecem no log do build. Todas exigem troca no primeiro acesso.
6. O `npm run build` roda os testes unitários antes do `next build`. Se algum teste falhar, a versão não é publicada.
7. A rotina diária (`vercel.json`) roda às 06:00 UTC: recalcula consumo, ponto de reposição, status e alertas, e reenvia avisos que falharam.

## 6. Backup e restauração (RNF-04)

Backup diário com `pg_dump` (agendado no GitHub Actions ou num servidor):

```bash
pg_dump "$DIRECT_URL" --format=custom --file=sicei_dda-$(date +%F).dump
```

Restauração num banco vazio:

```bash
pg_restore --no-owner --role=sicei_dda_owner --dbname="$DIRECT_URL" sicei_dda-AAAA-MM-DD.dump
```

Depois de restaurar, entre como Administrador e abra **Auditoria → Verificar agora**. A verificação recalcula a cadeia de hash do log, confere cada movimentação com o log e cada saldo com a soma das movimentações. Se tudo estiver certo, o backup está íntegro.

O dump tem dados pessoais (nomes e logins), então só deve ficar em local privado.

## 7. Rotinas do Administrador

| Situação | Onde |
|---|---|
| Funcionário novo | Usuários → Novo usuário. Entregue login e senha provisória. |
| Esqueceu a senha ou foi bloqueado | Usuários → Redefinir senha (também desbloqueia) |
| Funcionário saiu da empresa | Usuários → Inativar (as sessões caem na hora) |
| Conferir se alguém mexeu no banco | Auditoria → Verificar agora |
| Ligar os avisos por e-mail | Parâmetros → E-mail corporativo para avisos |
| Carga inicial da planilha | Importação (baixe o modelo CSV) |
| O próprio Administrador foi bloqueado | No servidor, com acesso ao banco: `npm run admin:recuperar -- admin` (gera nova senha provisória e registra no log) |

## Histórico do documento

| Versão | Data | Mudança |
|---|---|---|
| 1.0 | 26/09/2026 | Primeira versão. |
| 1.1 | 28/09/2026 | Seção 5: logo da licenciada na tela de login. |
