@AGENTS.md

# SICEI: regras do projeto

SICEI, Sistema Inteligente de Controle de Estoques Industriais: controle de estoque de pastilhas industriais. O SICEI é propriedade da Benevides Soluções Industriais (nome fictício, em `src/lib/produto.ts`); a DDA Metalúrgica é cliente e usa o sistema sob licença. Contato comercial e créditos são sempre do titular, nunca da DDA. Cada empresa cliente tem a própria instalação (`sicei-<empresa>.vercel.app`, banco `sicei_<sigla>`, usuários `sicei_<sigla>_owner` e `sicei_<sigla>_app`; doc 03, seção 7, ADR-12), e o nome dela vem da variável `SICEI_LICENCIADA`. O projeto se chamava SIMI; só a primeira migration guarda o nome antigo. **Trabalho acadêmico**: um professor vai avaliar o código, os testes e a documentação.

## Fonte da verdade

A documentação manda no código. Antes de implementar qualquer coisa, leia a parte que toca no assunto:

| Documento | Conteúdo |
|---|---|
| `docs/01-regras-de-negocio.md` | Regras de negócio RN-01 a RN-26, glossário, perfis, decisões validadas |
| `docs/02-requisitos.md` | Requisitos RF/RNF, critérios de aceite, matriz de permissões, rastreabilidade |
| `docs/03-system-design.md` | Stack, arquitetura, modelo de dados, fluxos críticos, segurança, testes, ADRs |

Mudou uma regra, um requisito ou uma decisão técnica? Atualize o documento no mesmo commit: o texto, a tabela de rastreabilidade quando for o caso e o **histórico de versões** no fim do arquivo. Código e documento nunca ficam em desacordo.

## Idioma e escrita

- Tudo em **português do Brasil**: interface, mensagens de erro, nomes de testes, documentação, commits. Nomes de código também em português quando forem termos do negócio (`registrarSaida`, `pontoDeReposicao`, `saldo`).
- A prosa de documentos segue a skill `humanizar-texto`: frases diretas, sem jargão de marketing, sem negrito decorativo.
- Identificadores (RN-15, RF-08, RNF-13, ADR-04) nunca mudam de número. Item removido não tem o número reaproveitado.

## Regras de negócio que não podem ser quebradas

- **Saldo nunca fica negativo** (RN-08). Toda movimentação usa `SELECT ... FOR UPDATE` na linha do item, dentro de transação. O `CHECK (saldo >= 0)` do banco é a última defesa, não a primeira.
- **O saldo vem das movimentações** (RN-06). Ninguém edita saldo direto.
- **Movimentação e log de auditoria são imutáveis** (RN-09a, RN-12). Não existe UPDATE nem DELETE nessas tabelas, nem no código nem em migration. Erro se corrige com `ESTORNO`.
- **Nada com histórico é apagado**, só inativado (RN-02).
- **Rastreabilidade total** (RN-09, RN-23): toda escrita grava usuário, data/hora do servidor, IP e dispositivo, e gera registro no `audit_log` na mesma transação.
- **Login não usa e-mail** (RN-21). O Admin informa nome e sobrenome, o sistema gera login (`nome.sobrenome`) e senha provisória, e a troca é obrigatória no primeiro acesso.
- **O sistema trabalha só com quantidades.** Preço serve para comparar fornecedores, não para valorar estoque.
- **Fora do escopo:** API REST pública e integração com ERP (RF-23, RF-24).

## Arquitetura (doc 03, seção 3)

- `src/domain/`: funções **puras**. Não importa nada de `server/`, `app/`, Prisma ou Next. Só usa recursos que existem no Node **e** no navegador (ex.: `crypto.subtle`, nunca `node:crypto`), porque o Laboratório de testes roda essas funções no navegador.
- `src/server/services/`: casos de uso. Sempre nesta ordem: `exigirPermissao` → validação Zod → transação → decisão (chamando `domain/`) → gravação → auditoria → commit.
- `src/server/consultas/`: leitura do banco.
- `src/app/`: telas e Server Actions. Server Action é fina: confere a sessão **de novo**, chama o service e devolve o resultado. Tela nunca acessa o Prisma.
- Toda decisão que puder ser tirada do service vai para `domain/`, para ser testável em unidade.
- Permissão é conferida **no servidor**. Esconder botão na tela não é proteção.

## Testes (doc 03, seção 9, e RNF-08/RNF-13)

- **Todo código testável em unidade tem teste unitário.** Código novo só entra junto com os testes dele.
- Meta: toda RN com pelo menos um teste; ≥ 90% de cobertura de linhas em `src/domain/`.
- Casos de teste das regras são **dados**, num arquivo `nome.casos.ts` ao lado do módulo. O `nome.test.ts` usa esses casos com `it.each`, e o Laboratório (`/testes`) importa os mesmos arquivos para rodar no navegador do professor.
- Nome do `describe` começa pelo identificador: `describe('RN-15 · Ponto de reposição', ...)`. Descrição de cada caso em português, dizendo entrada e resultado.
- Os exemplos numéricos do doc 01 são obrigatoriamente casos de teste.
- Escreva o teste antes ou junto com o código, e rode antes de dizer que terminou. Não diga que algo funciona sem ter executado.
- Componentes React: Testing Library, com `// @vitest-environment jsdom` no topo do arquivo.
- O que depende do banco (lock, triggers, sessão) vai para testes de integração com PostgreSQL real.

## Comandos

```bash
npm run dev             # servidor de desenvolvimento
npm test                # testes unitários
npm run test:ui         # Vitest UI no navegador
npm run test:cobertura  # testes + cobertura
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm run format          # Prettier
npm run build           # testes + relatório HTML + next build
npm run pastilhas       # recorta o fundo das fotos de CC/imagens e publica em public/pastilhas
```

Antes de cada commit: `npm run lint && npm run typecheck && npm test`.

## Next.js 16

Esta versão tem mudanças grandes em relação ao que você conhece (ver `AGENTS.md`). Antes de usar uma API do Next, confira a documentação em `node_modules/next/dist/docs/`. Exemplos: `middleware.ts` virou `proxy.ts`; Server Actions checam a origem sozinhas.

## Segurança

- Nenhum segredo no repositório. Variáveis ficam em `.env` (ignorado pelo Git), e o `.env.example` lista os nomes sem valores.
- SQL manual só com template parametrizado (`$queryRaw\`...${valor}\``), nunca concatenação.
- Toda entrada do usuário passa por schema Zod no servidor.
- Senha em texto nunca vai para log, banco ou auditoria. Só hash Argon2id.
- Mensagem de erro de login é sempre a mesma, exista o login ou não.

## Git

- Trabalhe na branch indicada na sessão. Commits pequenos, em português, com prefixo: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`, `ci:`.
- Cada commit deixa lint, typecheck e testes passando.
