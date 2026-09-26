# SIMI: Operação

| | |
|---|---|
| **Documento** | 06, Operação (instalação, execução, testes, publicação, backup) |
| **Versão** | 1.0 |
| **Base** | [03, System Design](03-system-design.md) |

## 1. Pré-requisitos

- Node.js 22 ou mais novo
- PostgreSQL 16 ou mais novo (local, Docker ou Neon)

## 2. Banco de dados: dois usuários

O SIMI usa dois usuários no PostgreSQL (doc 03, seção 5.2):

| Usuário | Para quê | Pode alterar o histórico? |
|---|---|---|
| `simi_owner` | Dono do banco. Roda as migrations. | Não pelo sistema: os triggers barram UPDATE, DELETE e TRUNCATE em `movimentacao` e `audit_log`. |
| `simi_app` | Usado pela aplicação em execução. | Não: só tem SELECT e INSERT nessas tabelas. |

Criação, uma única vez, como superusuário:

```sql
CREATE ROLE simi_owner LOGIN PASSWORD 'troque-esta-senha' CREATEDB;
CREATE ROLE simi_app   LOGIN PASSWORD 'troque-esta-senha';
CREATE DATABASE simi OWNER simi_owner;
```

`CREATEDB` só é necessário no desenvolvimento, porque o `prisma migrate dev` cria um banco temporário.

## 3. Rodar localmente

```bash
cp .env.example .env         # preencha DATABASE_URL (simi_app) e DIRECT_URL (simi_owner)
npm install                  # também gera o cliente do Prisma
npm run db:migrate           # aplica as migrations com o simi_owner
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
| `npm run verificar` | Lint, tipos, formatação e testes unitários (rode antes de cada commit) |

Os testes de integração usam o banco `simi_teste`, que é apagado e recriado a cada execução. As URLs podem ser trocadas com `DATABASE_URL_TESTE` e `DIRECT_URL_TESTE`.

Para o avaliador, os testes das regras também rodam no navegador, sem instalar nada, em `/testes` (RNF-13). O relatório completo da suíte, com a cobertura, fica em `/relatorio-testes/index.html` depois do `npm run build`.

## 5. Publicação (Vercel + Neon)

1. No Neon, crie o projeto e os usuários `simi_owner` e `simi_app` (seção 2).
2. Na Vercel, importe o repositório e configure as variáveis:
   - `DATABASE_URL`: URL com pooling, usuário `simi_app`
   - `DIRECT_URL`: URL direta, usuário `simi_owner`
   - `APP_URL`: endereço público (usado no QR das etiquetas e nos e-mails)
   - `CRON_SECRET`: texto aleatório longo (a Vercel manda no cabeçalho da rotina diária)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: e-mail corporativo, se houver
3. Aplique as migrations e o seed a partir de uma máquina com acesso ao banco:
   `DIRECT_URL=... npx prisma migrate deploy` e `DIRECT_URL=... DATABASE_URL=... npm run db:seed`.
4. O `npm run build` roda os testes unitários antes do `next build`. Se algum teste falhar, a versão não é publicada.
5. A rotina diária (`vercel.json`) roda às 06:00 UTC: recalcula consumo, ponto de reposição, status e alertas, e reenvia avisos que falharam.

## 6. Backup e restauração (RNF-04)

Backup diário com `pg_dump` (agendado no GitHub Actions ou num servidor):

```bash
pg_dump "$DIRECT_URL" --format=custom --file=simi-$(date +%F).dump
```

Restauração num banco vazio:

```bash
pg_restore --no-owner --role=simi_owner --dbname="$DIRECT_URL" simi-AAAA-MM-DD.dump
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
