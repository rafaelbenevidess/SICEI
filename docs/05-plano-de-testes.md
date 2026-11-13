# SICEI: Plano de Testes e QA

| | |
|---|---|
| **Documento** | 05, Plano de testes |
| **Versão** | 1.13 |
| **Base** | [02, Requisitos](02-requisitos.md) · [03, System Design, seção 9](03-system-design.md#9-estratégia-de-testes) |

## 1. Como os testes estão organizados

| Nível | Onde fica | Ferramenta | Roda na CI |
|---|---|---|---|
| Unidade: regras de negócio | `src/domain/*.test.ts`, com os casos em `*.casos.ts` | Vitest | Sim, em todo push |
| Unidade: laboratório, formatação, tema, filtros, resumo do log, proxy | `src/lab`, `src/lib`, `src/components/shell/menu.test.ts`, `src/proxy.test.ts` | Vitest | Sim |
| Unidade: componentes | `src/components/componentes.test.tsx`, `src/app/testes/Laboratorio.test.tsx` | Vitest + Testing Library | Sim |
| Integração | `tests/integracao/*.test.ts` | Vitest + PostgreSQL real | Sim, com PostgreSQL como serviço |
| Ponta a ponta | `tests/e2e/fluxos.spec.ts` (celular, 360 px) e `tests/e2e/computador.spec.ts` (1366 px), roteiros da seção 4, contra o build de produção | Playwright | Sim, com PostgreSQL como serviço |

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
| RN-21c Administrador principal | `hierarquia.test.ts` (casos em `hierarquia.casos.ts`, também no Laboratório) | `principal.test.ts` (senha, inativação e perfil do principal recusados e no log; só o principal cuida de Administradores; trigger recusa SQL direto) |
| RN-21d matrícula e edição | `pessoa.test.ts` (casos em `pessoa.casos.ts`, também no Laboratório), `schemas/cadastros.test.ts` | `usuarios.test.ts` (matrícula repetida, mesmo com a conta inativa; nome em caixa alta formatado; edição sem mudar o login e com o log) |
| RN-22 senha e bloqueio | `senha.test.ts` | `usuarios.test.ts` (5ª falha bloqueia, rate limit por IP) |
| RN-23 login inexistente fora do log | `login.test.ts` (`loginParaRegistro`) | `usuarios.test.ts` (senha digitada no campo login não aparece no log) |
| RN-25 posições | `posicao.test.ts` | `cadastros.test.ts` |
| RF-03 próximo código | `codigo.test.ts` (casos em `codigo.casos.ts`, também no Laboratório) | E2E do novo item |
| RN-26 etiqueta pendente | `schemas/cadastros.test.ts` (códigos mandados para a impressora) | `cadastros.test.ts` (troca marca a nova e limpa a antiga; impressão limpa e vai para o log; Consulta não registra) |
| RF-16 painel e desenho da pastilha | `painel.test.ts` (casos em `painel.casos.ts`, também no Laboratório: saúde do estoque, traços do medidor, pontos por dia, barra de comparação, variação e média do mês, dias do mês, tempo do alerta), `pastilha.test.ts` (casos em `pastilha.casos.ts`, também no Laboratório: formato pela ISO 1832, ângulos de ponta, raio inscrito, contorno arredondado, vista em perspectiva), `painel.test.tsx` (desenho com e sem furo, gravação, item sem ISO, arco, barra, pontos por dia, hachura da barra de nível) | E2E do painel em 360 px e das telas principais em 1366 px sem rolagem lateral |
| RNF-14 navegação integrada | `menu.test.ts` (12 itens, nenhuma aba como item solto, abas de Relatórios e de Cadastros mantêm o item aceso), `pastilha.test.ts` (chave e escolha da foto do item, casos também no Laboratório), `painel.test.tsx` (foto no lugar do desenho quando existe), `Gaveta.test.tsx` (diálogo com o título, fechar com Esc, com o X e clicando fora, volta no histórico ou ao endereço dado, largura estreita) | E2E do computador: as quatro abas de Relatórios com o mesmo título e o item do menu aceso; saída pela gaveta a partir da lista de itens, com o saldo da linha atualizado ao fechar; detalhe da movimentação na gaveta; item novo cadastrado na gaveta aberta pelos Cadastros; fabricante cadastrado e corrigido na gaveta, com a tabela atualizada. E2E do celular: usuário criado e editado na gaveta. E2E do celular: saída pela etiqueta QR com a gaveta em tela cheia |
| RF-13 pop-up de alertas | `avisoDeAlertas.test.ts`, `AvisoDeAlertas.test.tsx` | E2E do primeiro acesso |
| RF-21 filtro de ações | `acoesDoLog.test.ts` (toda ação gravada pelos services está no catálogo) | — |
| RN-26 leitura do QR | `posicao.test.ts` (`codigoDoQr`, casos em `posicao.casos.ts`, também no Laboratório), `camera.test.ts`, `LeitorQr.test.tsx` (câmera e leitor simulados) | E2E com câmera falsa (abaixo) |
| Matriz de permissões | `permissoes.test.ts` (72 casos) | cada service testado com o perfil sem permissão |
| RF-25 importação | `importacao.test.ts` (inclui o resumo de cada linha da prévia) | `cadastros.test.ts` (prévia sem gravar, gravação tudo ou nada) |
| RF-21 log e conferência | `lib/mudanca.test.ts` (antes → depois, hash encurtado) | `seguranca.test.ts` (conferência registrada no log; Consulta não executa) |
| RF-26 parâmetros | `parametros.test.ts` (limites e últimas alterações) | `cadastros.test.ts` |
| RN-22 checklist da senha na tela | `senha.test.ts` (`checklistDaSenha`) | — |
| RF-11 busca tolerante | `busca.test.ts` (casos em `busca.casos.ts`, também no Laboratório), `EscolhaDeItem.test.tsx` (autocompletar com o "Pst001" do print), `BuscaDoTopo.test.tsx` (sugestões, setas, Enter, "/"), `SelecaoComBusca.test.tsx` (CNPJ só com números, posição sem traços, opção vazia, limpar o formulário) | `busca.test.ts` (OP sem traços, código de outro jeito, login com espaço, sugestões do topo); E2E da saída pelo computador |
| RN-01 código equivalente e padronizado | `codigo.test.ts` (casos em `codigo.casos.ts`, também no Laboratório), `importacao.test.ts` ("PST1" e PST-001 no mesmo arquivo) | `cadastros.test.ts` (criar e editar recusam o equivalente, "pst 2" grava PST-002, prévia da planilha) |
| RN-25 posição digitada | `posicao.test.ts` (casos em `posicao.casos.ts`, também no Laboratório), `importacao.test.ts` ("a1g3c4" entra como A01-G03-C04) | E2E da posição do item novo |
| RF-02 prévia do login | `login.test.ts` (`previaDoLogin`) | — |
| RF-17a análise personalizada | `analise.test.ts` (casos em `analise.casos.ts`, também no Laboratório: dia, semana ou mês, período anterior, variação, maiores e "Outros", eixo, escolhidos, comparação lado a lado, nomes na ponta das linhas), `schemas/analise.test.ts` (filtros da URL, casos em `schemas/analise.casos.ts`), `PainelAnalitico.test.tsx` (números, ranking, foco pelo clique, comparação, escolhido com zero, tabela de detalhe, colaborador pelo nome, seis itens cada um na sua cor, sem cinza), `SelecaoMultipla.test.tsx` (busca, marcar vários, "×", Backspace, limite), `menu.test.ts` (Análise em Gestão) | `analise.test.ts` (filtros que se somam, cada dimensão e medida, perda "Sem destino", sem a saída estornada, hora de São Paulo, entradas e saídas e alertas só dos itens filtrados, opções, CSV); E2E do computador |
| Interface | `componentes.test.tsx` (selo com texto, campo de senha, toast, rótulos do gauge), `tema.test.ts`, `menu.test.ts` | — |
| Segurança web | `proxy.test.ts` (CSP), `redirecionamento.test.ts` (open redirect) | — |

## 3. Metas

- Toda regra de negócio com pelo menos um teste.
- Cobertura de linhas ≥ 90% em `src/domain` (hoje: 100%).
- Build de produção bloqueado se qualquer teste unitário falhar.

## 4. Roteiros de aceitação no navegador

Automatizados com Playwright (`npm run test:e2e`), com os dados de demonstração (`SEED_DEMO=1`). O projeto do computador roda depois do celular, porque o primeiro teste troca a senha provisória do Admin.

### 4.1 Celular, 360 px (`fluxos.spec.ts`)

1. Entrar com a senha provisória → o sistema exige a troca → com a senha curta a checklist fica pendente e o botão bloqueado → senha válida leva ao painel → o pop-up "Existem N alertas sem ciente" aparece, continua em outra página e só sai com VER, que leva aos alertas. Os demais testes do Admin passam pelo VER depois de entrar.
2. Painel sem rolagem horizontal em 360 px.
3. Abrir `/p/A01-G01-C02` (URL do QR) → item com a faixa "lida pela câmera" → "Registrar saída" na barra fixa → 9999 unidades: "Saída recusada" e botão bloqueado → 2 unidades com o botão +, destino em botão, OP e quem retirou (achado pela matrícula 1045) → tela "Saída registrada" com "Ler outra etiqueta".
4. Histórico filtrado pela OP → estornar com justificativa → a original aparece como estornada.
5. Tocar em "Ler QR" na barra inferior → a câmera abre dentro do SICEI → a etiqueta de A01-G01-C02 leva ao item. A câmera é um vídeo gerado com o QR da etiqueta (`tests/e2e/camera.ts`), passado ao Chromium como câmera falsa; como o Chromium de teste não tem leitor nativo, o teste passa pelo jsQR, o mesmo caminho do iPhone.
6. Criar usuário "PEDRO" "DA CONSULTA" com matrícula: gravado como "Pedro da Consulta"; a mesma matrícula não cria um segundo login; Editar muda o setor sem mudar o login; o login aparece enquanto digita → senha provisória mostrada uma vez → "Já repassei" some com ela → o novo usuário troca a senha e, como Consulta, não vê o pop-up de alertas, nem preços, nem o botão de saída, e não abre a gestão de usuários.
7. Auditoria → Verificar agora → três resultados (cadeia, movimentações, saldos) e o registro da conferência.
8. Relatório de reposição → exportar CSV.
9. `/testes` → Executar todos → todos os casos passam.

A suíte também confere a rotina diária (recusa sem o segredo) e os cabeçalhos de segurança, incluindo a câmera liberada só para o próprio SICEI.

### 4.2 Computador, 1366 px (`computador.spec.ts`)

1. Tema escuro guardado ao navegar e ao recarregar.
2. Compra com fornecedor novo: CNPJ inválido avisado na hora, CNPJ válido aceito, fornecedor já escolhido na compra, entrada confirmada.
3. Parâmetros: janela de 400 dias avisada e bloqueada; 60 dias salvos e listados em "Últimas alterações"; volta para 90.
4. Log com o antes → depois dessa mudança.
5. Importação: prévia com a linha 3 errada e importação bloqueada; arquivo corrigido importa 1 item.
6. CSV de itens e de movimentações.
7. Novo item a partir da aba Itens de Cadastros: código PST-007 já sugerido, PST-001 avisado como em uso e bloqueado, fabricante e fornecedor cadastrados na hora e já escolhidos, item gravado.
8. O item novo vai para A04-G02-C01, digitada como "a4g2c1" no campo com busca → aviso de etiqueta não impressa → "Imprimir etiqueta" → mandar imprimir registra a impressão → o aviso some → o filtro de ação da auditoria acha "Etiqueta QR impressa" com a posição e o item.
9. Registrar saída: "pst" lista os PST, "Pst 2" é reconhecido como PST-002 e o Enter abre a saída; a lista de itens acha o PST-002 por "a01g01c02"; a busca do topo sugere o PST-002 para "pst2" e abre o item; o histórico acha a OP-E2E-1 por "ope2e1".
10. O endereço antigo `/relatorios?tipo=analise` leva a `/analise` → Análise pelo menu → "pst1" e "apmt" escolhem PST-001 e PST-004 → Aplicar: a URL leva os dois, a linha "Filtros:" os mostra, a evolução fica lado a lado e o ranking tem só os dois → clicar em PST-004 põe em foco e "Tirar o foco" volta → comparar por colaborador mantém o filtro de itens → o CSV sai como `sicei-analise-<data>.csv` → na mídia de impressão, o conteúdo ocupa a página inteira (sem a coluna do menu), as barras mantêm a cor e nenhum gráfico passa da largura da folha.
11. Painel, itens, alertas, movimentações, relatórios, análise, cadastros, usuários e auditoria sem rolagem horizontal na página e sem tabela rolando de lado em 1366 px.

Resultado da última execução: 21 de 21 passaram.

## 5. Histórico do documento

| Versão | Data | Mudança |
|---|---|---|
| 1.0 | 26/09/2026 | Primeira versão. |
| 1.1 | 27/09/2026 | Redesign: E2E em dois projetos (celular 360 px e computador 1366 px), roteiros novos e testes da interface na rastreabilidade. |
| 1.2 | 27/09/2026 | Leitura do QR dentro do SICEI: testes unitários, de componente e E2E com câmera falsa. |
| 1.3 | 27/09/2026 | Testes do pop-up de alertas, do próximo código, da etiqueta pendente e do catálogo de ações; E2E com 19 fluxos. |
| 1.4 | 27/09/2026 | Busca tolerante e autocompletar ao registrar: testes de unidade, de componente e E2E. |
| 1.5 | 27/09/2026 | A mesma busca em todos os campos: testes do campo de escolha com busca, das sugestões do topo, dos filtros de texto (integração), do código equivalente e da posição digitada; roteiros E2E atualizados. |
| 1.6 | 28/09/2026 | Testes do Administrador principal (RN-21c) e do login inexistente fora do log. Cabeçalho de versão corrigido. |
| 1.7 | 28/09/2026 | Testes da matrícula e da edição de usuários (RN-21d); E2E confere tabelas sem rolagem lateral em 1366 px. |
| 1.8 | 28/09/2026 | Testes do painel de análise (RF-17a): unidade, componente, integração e E2E; suítes novas no Laboratório. E2E com 21 fluxos. |
| 1.9 | 28/09/2026 | Análise personalizada em página própria: testes dos filtros da URL, da escolha de vários, da comparação lado a lado, da tabela de detalhe e das consultas com filtros combinados; E2E refeito. |
| 1.10 | 28/09/2026 | Teste de componente com seis itens: cada um com cor própria no ranking, na composição e na evolução lado a lado. |
| 1.11 | 28/09/2026 | E2E confere a Análise na mídia de impressão (largura, cores mantidas, gráficos dentro da folha). A verificação fica no teste da Análise, porque o limite de 20 logins por IP a cada 15 minutos vale também para a suíte. |
| 1.12 | 12/11/2026 | Testes da versão 2 da interface: contas do painel e formato da pastilha (unidade, com suítes novas no Laboratório) e componentes do painel. |
| 1.13 | 13/11/2026 | Testes da versão 3 da interface (RNF-14): menu, abas, gaveta de registro e de detalhe, foto da pastilha. |
| 1.14 | 13/11/2026 | Testes da segunda parte da versão 3 (RNF-14): componente Gaveta e cadastros de item, de fabricante e de usuário pela gaveta. |
