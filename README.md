# SICEI

[![CI](https://github.com/rafaelbenevidess/SICEI/actions/workflows/ci.yml/badge.svg)](https://github.com/rafaelbenevidess/SICEI/actions/workflows/ci.yml)

Sistema Inteligente de Controle de Estoques Industriais. Controla o estoque de pastilhas de usinagem: quanto tem, onde está, quem tirou, para qual máquina e quando é hora de comprar. Trabalho acadêmico de Rafael Benevides, feito a partir da demanda real da DDA Metalúrgica (Santa Catarina), primeira empresa a usar o sistema.

Em produção: https://sicei-ddametalurgica.vercel.app

## O problema

A DDA controla as pastilhas em planilhas preenchidas à mão. Entrada e saída às vezes não são lançadas, ou entram atrasadas, e ninguém sabe ao certo quanto tem na gaveta. A compra acontece quando alguém percebe que acabou, e aí a máquina já parou.

## O que o sistema faz

- Mostra o saldo de cada pastilha em tempo real, com status (OK, Atenção, Crítico, Zerado) e a posição exata no almoxarifado (armário, gaveta, compartimento).
- Registra entrada por compra (com nota fiscal e preço), saída para a produção (com destino, ordem de produção e quem retirou), devolução, perda, inventário e estorno. O saldo nunca fica negativo, nem com duas saídas ao mesmo tempo.
- Guarda todos os fornecedores de cada item, com o último preço de cada um e o histórico de preços.
- Avisa no painel e por e-mail quando um item chega ao ponto de reposição, e sugere quanto comprar. Ao entrar, Gestor e Administrador veem um pop-up com os alertas ainda sem ciente.
- Gera relatórios de consumo, movimentação e reposição, com exportação em CSV e impressão em PDF.
- Imprime etiquetas QR para as gavetas. A tela "Ler QR" abre a câmera de qualquer celular (Android ou iPhone) dentro do próprio SICEI, lê a etiqueta, abre o item e a saída é registrada numa tela só.
- Acha o que foi digitado de qualquer jeito: "pst1", "Pst 001" e "PST-1" são o PST-001, "a1g3c4" é a posição A01-G03-C04 e o CNPJ pode ir só com números. Vale na busca do topo (com sugestões), nas listas de fornecedor, fabricante, colaborador, destino e posição, nos filtros do histórico e do log, no Ler QR e na importação. O código de item novo entra no padrão da sequência, e o mesmo código escrito de outro jeito é recusado.
- Tema claro e escuro, e telas pensadas para o celular do almoxarife e para o computador do escritório.
- Cria usuários a partir do nome e sobrenome: o sistema gera o login e a senha provisória, sem e-mail.
- Registra cada operação num log de auditoria encadeado por hash. Uma verificação aponta qualquer registro adulterado, e o banco recusa alteração e exclusão do histórico.

## Tecnologia

Next.js 16 com React 19 e TypeScript, PostgreSQL 17 com Prisma 7, Tailwind 4 e Zod. Senhas com Argon2id. Testes com Vitest, Testing Library e Playwright. Hospedagem na Vercel (região São Paulo) e banco no Neon, com integração contínua no GitHub Actions. As escolhas e as alternativas descartadas estão no [doc 03](docs/03-system-design.md).

## Testes

| Tipo | Quantidade | O que cobre |
|---|---|---|
| Unitários | 665 | Regras de negócio, validações, telas e componentes (99% das linhas) |
| Integração | 80 | Serviços contra PostgreSQL real: concorrência, estorno, triggers, permissões, cadeia de hash, filtros de busca |
| Ponta a ponta | 20 | Fluxos no navegador, no celular (360 px) e no computador (1366 px): troca de senha, leitura do QR pela câmera, saída pela etiqueta, estorno, usuários, compra com fornecedor novo, parâmetros, importação, CSV |

```bash
npm test                  # unitários
npm run test:integracao   # integração (precisa de PostgreSQL)
npm run test:e2e          # ponta a ponta (rode npm run build:app antes)
```

Para o professor: em [/testes](https://sicei-ddametalurgica.vercel.app/testes) os testes das regras rodam no próprio navegador, sem instalar nada, e dá para criar casos novos. O relatório completo da suíte, com a cobertura, fica em [/relatorio-testes](https://sicei-ddametalurgica.vercel.app/relatorio-testes/index.html). O build só publica uma versão se todos os testes passarem.

## Como rodar

```bash
cp .env.example .env          # preencha as URLs do banco
npm install
npm run db:migrate
SEED_DEMO=1 npm run db:seed   # mostra a senha provisória do admin
npm run dev
```

Os usuários do banco, a publicação e o backup estão no [doc 06](docs/06-operacao.md).

## Uma instalação por empresa

Cada empresa que licencia o SICEI recebe uma instalação separada, sem nada em comum com as outras: projeto próprio na Vercel e no Neon, endereço `sicei-<empresa>.vercel.app` e banco `sicei_<sigla>`. O código é o mesmo. O nome da empresa no login e no rodapé vem da variável `SICEI_LICENCIADA`. O passo a passo para instalar uma empresa nova está no doc 06, seção 5, e a decisão está registrada no doc 03 (ADR-12).

## Documentação

| # | Documento | Versão |
|---|---|---|
| 01 | [Regras de negócio](docs/01-regras-de-negocio.md) | 1.5 |
| 02 | [Requisitos](docs/02-requisitos.md) | 1.8 |
| 03 | [System design e stack](docs/03-system-design.md) | 1.11 |
| 04 | [Segurança](docs/04-seguranca.md) | 1.5 |
| 05 | [Plano de testes e QA](docs/05-plano-de-testes.md) | 1.5 |
| 06 | [Operação](docs/06-operacao.md) | 1.1 |

As regras de trabalho do projeto (arquitetura, testes, segurança, convenções) estão em [CLAUDE.md](CLAUDE.md).

## Uso de IA e autoria

Este projeto foi feito com o Claude Code, assistente de programação da Anthropic. Os commits feitos pelo assistente trazem a linha `Co-Authored-By: Claude`.

Decisões do autor:

- O problema, o escopo e as regras de negócio: vários fornecedores por item com histórico de preços, rastreabilidade total de cada movimentação, retenção de 7 anos, controle só por quantidade, nota fiscal obrigatória.
- Tirar do escopo a API pública e a integração com ERP.
- Login gerado pelo Administrador a partir do nome e sobrenome, sem e-mail.
- Endereçamento em três níveis (armário, gaveta, compartimento) e saída com destino, ordem de produção e colaborador.
- Stack Next.js com PostgreSQL, publicação na Vercel e no Neon.
- Testes unitários em todo o sistema, com um laboratório na web para o professor executar e criar testes.
- O SICEI como produto próprio, licenciado por empresa, com uma instalação para cada cliente.
- O design da interface: as telas, o tema escuro, a versão de celular e a marca, entregues como protótipo em `design_handoff_sicei/`.

Feito pelo assistente, a partir dessas decisões: a redação dos documentos, o código (incluindo a implementação do design do autor), os testes, a integração contínua, a publicação e as revisões de código e de segurança.

Como o autor acompanhou: aprovou cada etapa (regras, requisitos, system design) antes de a próxima começar, respondeu às dúvidas de negócio levantadas no caminho, testou o sistema publicado e pediu as mudanças de nome, licença e modelo de instalação.

## Propriedade e licença

O SICEI é propriedade da Benevides Soluções Industriais. Todos os direitos reservados. A DDA Metalúrgica usa o sistema sob licença e não é dona do código. Os termos estão em [LICENSE](LICENSE).

Contato comercial: comercial@sicei.exemplo.com.br

O nome do titular e o contato ainda são fictícios. Para trocar, edite `src/lib/produto.ts` (rodapé do sistema), este README, o `LICENSE` e o campo `author` do `package.json`.
