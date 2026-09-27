# SICEI

[![CI](https://github.com/rafaelbenevidess/SIMI/actions/workflows/ci.yml/badge.svg)](https://github.com/rafaelbenevidess/SIMI/actions/workflows/ci.yml)

**Sistema Inteligente de Controle de Estoques Industriais.** Controle de estoque de pastilhas industriais. Trabalho acadêmico baseado na demanda da **DDA Metalúrgica** (Santa Catarina).

Hoje a DDA controla as pastilhas usadas na usinagem em planilhas preenchidas à mão, o que gera erro de saldo e compra atrasada. O SICEI registra cada entrada e saída na hora, mantém o saldo atualizado, avisa quando um item chega ao nível de reposição e guarda o histórico completo, inalterável e verificável, para apoiar as compras.

## O que o sistema faz

- Saldo em tempo real de cada pastilha, com status (OK, Atenção, Crítico, Zerado) e posição no almoxarifado.
- Entrada por compra (com nota fiscal e preço), saída para a produção (com destino, ordem de produção e quem retirou), devolução, perda, inventário e estorno. O saldo nunca fica negativo, nem com duas saídas ao mesmo tempo.
- Vários fornecedores por item, com o último preço de cada um e o histórico de preços.
- Alertas de estoque baixo no painel e por e-mail corporativo, e sugestão de compra.
- Relatórios de consumo, movimentação e reposição, com exportação em CSV e PDF.
- Etiquetas QR para as gavetas: a câmera do celular abre o item.
- Usuários criados pelo Administrador, com login e senha gerados pelo sistema.
- Log de auditoria encadeado por hash, com verificação que aponta qualquer adulteração.

## Como rodar

```bash
cp .env.example .env
npm install
npm run db:migrate
SEED_DEMO=1 npm run db:seed   # mostra a senha provisória do admin
npm run dev
```

Detalhes (usuários do banco, publicação, backup) em [docs/06-operacao.md](docs/06-operacao.md).

## Testes

```bash
npm test                  # testes unitários
npm run test:integracao   # testes com PostgreSQL real
npm run test:ui           # Vitest UI no navegador
```

Para o professor: em `/testes` os testes das regras de negócio rodam no próprio navegador, e dá para criar os seus próprios casos. O relatório completo, com a cobertura, fica em `/relatorio-testes/index.html`.

## Documentação

| # | Documento | Situação |
|---|---|---|
| 01 | [Regras de negócio](docs/01-regras-de-negocio.md) | v1.0, validado |
| 02 | [Requisitos](docs/02-requisitos.md) | v1.1, validado |
| 03 | [System design e stack](docs/03-system-design.md) | v1.1 |
| 04 | [Segurança](docs/04-seguranca.md) | v1.0 |
| 05 | [Plano de testes e QA](docs/05-plano-de-testes.md) | v1.0 |
| 06 | [Operação](docs/06-operacao.md) | v1.0 |

As regras de trabalho do projeto (arquitetura, testes, segurança, convenções) estão em [CLAUDE.md](CLAUDE.md).

## Etapas do projeto

1. Regras de negócio e requisitos ✔
2. System design e escolha da stack ✔
3. Implementação do MVP ✔
4. Revisão de código, testes e QA ✔
5. Revisão de segurança ✔
6. Implantação e demonstração ← **etapa atual**
