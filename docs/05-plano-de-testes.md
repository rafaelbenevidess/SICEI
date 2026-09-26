# SIMI: Plano de Testes e QA

| | |
|---|---|
| **Documento** | 05, Plano de testes |
| **Versão** | 1.0 |
| **Base** | [02, Requisitos](02-requisitos.md) · [03, System Design, seção 9](03-system-design.md#9-estratégia-de-testes) |

## 1. Como os testes estão organizados

| Nível | Onde fica | Ferramenta | Roda na CI |
|---|---|---|---|
| Unidade: regras de negócio | `src/domain/*.test.ts`, com os casos em `*.casos.ts` | Vitest | Sim, em todo push |
| Unidade: laboratório, formatação, proxy | `src/lab`, `src/lib`, `src/proxy.test.ts` | Vitest | Sim |
| Unidade: componentes | `src/app/testes/Laboratorio.test.tsx` | Vitest + Testing Library | Sim |
| Integração | `tests/integracao/*.test.ts` | Vitest + PostgreSQL real | Sim, com PostgreSQL como serviço |
| Ponta a ponta | `tests/e2e/fluxos.spec.ts` (roteiro da seção 4, no celular 390 px, contra o build de produção) | Playwright | Sim, com PostgreSQL como serviço |

A regra do projeto (RNF-08) é: tudo o que pode ser testado em unidade tem teste unitário, e código novo só entra com os testes dele. As decisões de negócio ficam em funções puras em `src/domain`, e por isso quase tudo é testável sem banco.

## 2. Rastreabilidade: regra → teste

Cada `describe` começa pelo identificador da regra, então basta procurar pelo número.

| Regra | Teste unitário | Teste de integração |
|---|---|---|
| RN-04 CNPJ | `cnpj.test.ts` (inclui o formato alfanumérico) | `cadastros.test.ts` (CNPJ repetido) |
| RN-05a / RN-05b preços | `precos.test.ts` | `movimentacoes.test.ts` (estorno devolve o preço anterior) |
| RN-07 unidades | `estoque.test.ts` | `movimentacoes.test.ts` (compra em caixas) |
| RN-08 saldo nunca negativo | `movimentacao.test.ts` | `movimentacoes.test.ts` (2 e 10 saídas simultâneas); `seguranca.test.ts` (CHECK do banco) |
| RN-09a log inalterável | `auditoria.test.ts` | `seguranca.test.ts` (permissão, trigger, fraude no log e na movimentação) |
| RN-09b conferência de saldo | `movimentacao.test.ts` | `seguranca.test.ts` (saldo alterado no banco é detectado) |
| RN-10 / RN-11 campos obrigatórios | `schemas/movimentacao.test.ts` | `movimentacoes.test.ts`; `seguranca.test.ts` (CHECK por tipo) |
| RN-12 estorno | `movimentacao.test.ts` | `movimentacoes.test.ts` (estorno duplo simultâneo, entrada consumida) |
| RN-13 inventário | `movimentacao.test.ts` | `movimentacoes.test.ts` |
| RN-14 a RN-17 níveis e status | `estoque.test.ts` | `cadastros.test.ts` (mudar o mínimo recalcula) |
| RN-18 / RN-19 alertas | `alertas.test.ts` | `movimentacoes.test.ts` (um alerta por item, escala, fecha, outbox de e-mail) |
| RN-20 sugestão de compra | `estoque.test.ts` | — |
| RN-21 / RN-21a / RN-21b usuários | `login.test.ts`, `senha.test.ts` | `usuarios.test.ts` (login gerado, homônimo, troca obrigatória, inativação derruba sessão) |
| RN-22 senha e bloqueio | `senha.test.ts` | `usuarios.test.ts` (5ª falha bloqueia, rate limit por IP) |
| RN-25 posições | `posicao.test.ts` | `cadastros.test.ts` |
| Matriz de permissões | `permissoes.test.ts` (72 casos) | cada service testado com o perfil sem permissão |
| RF-25 importação | `importacao.test.ts` | `cadastros.test.ts` (prévia sem gravar, gravação tudo ou nada) |
| Segurança web | `proxy.test.ts` (CSP), `redirecionamento.test.ts` (open redirect) | — |

## 3. Metas

- Toda regra de negócio com pelo menos um teste.
- Cobertura de linhas ≥ 90% em `src/domain` (hoje: 100%).
- Build de produção bloqueado se qualquer teste unitário falhar.

## 4. Roteiro de aceitação no navegador (celular 390 px)

Automatizado em `tests/e2e/fluxos.spec.ts` (`npm run test:e2e`), com os dados de demonstração (`SEED_DEMO=1`):

1. Entrar com a senha provisória → o sistema exige a troca → senha curta é recusada → senha válida leva ao painel.
2. Painel mostra itens por status, alertas, consumo do mês e últimas movimentações, sem rolagem horizontal.
3. Abrir um item → registrar saída acima do saldo → mensagem "Saldo disponível: N" → saída válida atualiza o saldo.
4. Abrir a movimentação → estornar com justificativa → a original aparece como estornada.
5. Criar usuário "Ana dos Santos" → o sistema mostra `ana.santos` e a senha provisória uma única vez.
6. Relatório de reposição → exportar CSV.
7. Abrir `/p/A01-G01-C01` (URL do QR) → cai na página do item guardado nessa posição.
8. Auditoria → Verificar agora → cadeia íntegra, movimentações e saldos batem.
9. `/testes` → Executar todos → todos os casos passam.

A suíte também confere a rotina diária (recusa sem o segredo) e os cabeçalhos de segurança. Resultado da última execução: 9 de 9 passaram.
