# SIMI: Regras de Negócio

| | |
|---|---|
| **Projeto** | SIMI, controle de estoque de pastilhas industriais |
| **Cliente** | DDA Metalúrgica (Santa Catarina) |
| **Documento** | 01, Regras de Negócio |
| **Versão** | 0.1 (rascunho, aguardando validação da DDA) |
| **Próximo documento** | [02, Requisitos](02-requisitos.md) |

## 1. Problema

A DDA usa vários modelos de pastilhas industriais na usinagem. O consumo é alto e, se uma pastilha faltar, a máquina para. Hoje o estoque é controlado em planilhas preenchidas à mão. As entradas e saídas às vezes não são lançadas, ou são lançadas com atraso, e ninguém sabe ao certo quanto tem na prateleira. A compra acaba sendo feita quando alguém percebe que acabou.

O SIMI substitui a planilha. Cada entrada e saída é registrada no momento em que acontece, o saldo fica sempre atualizado e o sistema avisa antes de o item acabar. Com o histórico gravado, dá para planejar as compras com base no consumo real.

Este documento define **o que o sistema precisa respeitar**, sem entrar em como ele vai ser construído. As regras valem para qualquer tecnologia escolhida depois.

## 2. Glossário

| Termo | Significado no SIMI |
|---|---|
| **Pastilha (item)** | Inserto intercambiável de metal duro, cermet ou cerâmica, usado em torneamento, fresamento, furação ou rosqueamento. Cada modelo é um item. |
| **Código interno** | Identificador único do item dentro da DDA. É por ele que o almoxarife procura. |
| **Especificação ISO** | Código padronizado da geometria da pastilha, como `CNMG 120408` ou `WNMG 080408`. |
| **Classe (grade)** | Material e cobertura da pastilha, como P25 ou M15. Dois itens com a mesma ISO e classes diferentes são itens diferentes. |
| **Fabricante** | Quem produz a pastilha (Sandvik, Iscar, Kennametal, Mitsubishi etc.). |
| **Fornecedor** | Empresa que vende a pastilha para a DDA, identificada por CNPJ. Um item pode ser comprado de vários fornecedores. |
| **Fornecedor preferencial** | O fornecedor que o Gestor marca como primeira opção de compra de um item. Entra no cálculo do ponto de reposição. |
| **Lead time** | Prazo, em dias corridos, entre o pedido e a chegada da pastilha, informado para cada par item + fornecedor. |
| **Embalagem** | Quantidade de unidades por caixa (normalmente 10). O estoque é controlado em unidades. |
| **Movimentação** | Qualquer evento que muda o saldo: entrada, saída, ajuste ou estorno. |
| **Destino** | Setor, máquina ou centro de custo que recebeu a pastilha numa saída. |
| **Saldo** | Quantidade disponível do item, calculada a partir das movimentações. |
| **Estoque mínimo** | Quantidade abaixo da qual o item é considerado crítico. |
| **Ponto de reposição** | Quantidade em que já é hora de comprar, para a pastilha chegar antes de o saldo cair ao mínimo. |
| **Estoque máximo** | Teto opcional, usado para calcular quanto comprar. |
| **Inventário** | Contagem física das pastilhas para conferir se o saldo do sistema bate com a prateleira. |
| **Log de auditoria** | Registro permanente de tudo o que foi feito no sistema, por quem, quando e de onde. |

## 3. Perfis de acesso

| Perfil | Quem é | O que faz |
|---|---|---|
| **Administrador** | TI ou responsável pelo sistema na DDA | Cria e gerencia usuários, gera senhas provisórias, define parâmetros do sistema. Tem acesso a todos os cadastros e ao log. |
| **Gestor** | Compras, PCP, supervisão | Cadastra itens, fabricantes, fornecedores e destinos. Define mínimos e máximos, faz estornos, ajustes e inventário. Vê relatórios, sugestões de compra e o log. |
| **Almoxarife** | Quem opera o almoxarifado | Registra entradas e saídas, consulta saldo, histórico e localização. |
| **Consulta** | Operador, líder de produção | Só consulta: saldo, localização do item e painel. Não registra nada. |

A matriz completa de permissões por funcionalidade está no [documento de requisitos](02-requisitos.md#5-matriz-de-permissões).

## 4. Entidades principais

Este é um modelo conceitual. O modelo de dados de verdade sai na etapa de system design.

- **Item (pastilha):** código interno, descrição, especificação ISO, classe, cobertura, aplicação, fabricante, embalagem (unidades por caixa), localização física (texto livre, como "Armário 2, gaveta 5"), estoque mínimo, estoque máximo (opcional), situação (ativo ou inativo).
- **Fabricante:** nome, situação.
- **Fornecedor:** razão social, nome fantasia, CNPJ, telefone, contato, situação.
- **Vínculo item ↔ fornecedor:** código do item no fornecedor, lead time, marcação de preferencial, último preço pago, data da última compra.
- **Histórico de preço:** item, fornecedor, data, preço unitário, quantidade, nota fiscal, usuário, movimentação de origem.
- **Destino:** tipo (setor, máquina ou centro de custo), código, nome, situação.
- **Movimentação:** item, tipo, quantidade, saldo anterior, saldo posterior, fornecedor e preço (em compras), destino (em saídas), ordem de produção, nota fiscal, motivo, movimentação estornada (em estornos), usuário, data e hora, origem (IP e dispositivo).
- **Alerta:** item, nível, data de abertura, data de fechamento, quem marcou como ciente.
- **Usuário:** nome, login interno, setor, perfil, situação, obrigação de trocar a senha, tentativas de login sem sucesso.
- **Registro de auditoria:** ação, entidade afetada, valor anterior, valor novo, usuário, data e hora, origem, hash do registro anterior.

### Tipos de movimentação

| Tipo | Efeito no saldo | Quem pode lançar | Campos obrigatórios além do básico |
|---|---|---|---|
| `COMPRA` | soma | Almoxarife, Gestor, Admin | fornecedor, preço unitário |
| `DEVOLUCAO_PRODUCAO` | soma | Almoxarife, Gestor, Admin | destino que devolveu, motivo |
| `AJUSTE_POSITIVO` | soma | Gestor, Admin | justificativa |
| `CONSUMO_PRODUCAO` | subtrai | Almoxarife, Gestor, Admin | destino |
| `PERDA_QUEBRA` | subtrai | Almoxarife, Gestor, Admin | motivo |
| `AJUSTE_NEGATIVO` | subtrai | Gestor, Admin | justificativa |
| `ESTORNO` | inverso da original | Gestor, Admin | movimentação original, justificativa |

## 5. Regras de negócio

### 5.1 Cadastros

**RN-01. Código interno único.** Todo item tem um código interno obrigatório, e dois itens não podem ter o mesmo código. Depois da primeira movimentação do item, o código fica travado, porque o histórico e os relatórios dependem dele.

**RN-02. Nada com histórico é apagado.** Item, fabricante, fornecedor, destino ou usuário que já aparece em alguma movimentação ou registro de log não pode ser excluído. O que existe é a **inativação**. Um cadastro criado por engano e que nunca foi usado pode ser excluído, e a exclusão fica no log.

**RN-03. Item inativo fica congelado.** Um item inativo não recebe movimentação, não gera alerta e não entra na sugestão de compra, mas continua aparecendo no histórico e nos relatórios de períodos antigos. Só dá para inativar um item com saldo zero. Um item inativo pode ser reativado pelo Gestor.

**RN-04. Documentos válidos e sem duplicidade.** O CNPJ do fornecedor precisa ter dígitos verificadores válidos e não pode se repetir. O nome do fabricante também é único, sem diferenciar maiúsculas de minúsculas.

**RN-05. Todos os fornecedores do item ficam cadastrados.** A DDA pode comprar a mesma pastilha de fornecedores diferentes, e todos eles precisam estar no sistema, ligados ao item. Um item ativo precisa ter pelo menos um fornecedor vinculado. Em cada vínculo ficam o código que o fornecedor usa para aquele item, o lead time e o **último preço unitário pago**. Um dos fornecedores pode ser marcado como preferencial.

**RN-05a. Histórico de preços permanente.** Toda entrada do tipo `COMPRA` registra o preço unitário, que é obrigatório nesse tipo de entrada. O preço vai para o histórico daquele item com aquele fornecedor e **nunca é sobrescrito nem apagado**. O "último preço" exibido no vínculo é sempre o da compra mais recente. Se uma compra for estornada, o último preço volta a ser o da compra anterior que não foi estornada, e o registro estornado continua no histórico, marcado como estornado.

**RN-05b. Comparar fornecedores na consulta do item.** Ao abrir um item, o usuário vê a lista de fornecedores com último preço, data da última compra e lead time de cada um, ordenada do menor para o maior preço. Fornecedores que ainda não tiveram compra aparecem no fim, com a indicação "sem compras". Ao expandir um fornecedor, abre o histórico completo de preços (data, preço unitário, quantidade, nota fiscal e quem lançou), com a variação percentual em relação à compra anterior.

> Exemplo: a pastilha `CNMG 120408 P25` tem três fornecedores. A lista mostra Fornecedor A a R$ 38,90 (compra de 02/09, lead time 5 dias), Fornecedor B a R$ 41,20 (compra de 15/08, 3 dias) e Fornecedor C, sem compras. Ao expandir o A, aparecem as compras de 02/09 (R$ 38,90, +4,0%), 10/07 (R$ 37,40, +1,1%) e 03/05 (R$ 37,00).

### 5.2 Movimentações e saldo

**RN-06. O saldo vem das movimentações.** Ninguém digita o saldo. Ele é sempre o resultado da soma das entradas menos as saídas, com os estornos considerados. Qualquer tela ou relatório que mostre saldo usa esse mesmo cálculo.

**RN-07. Quantidades inteiras e positivas.** Pastilha se conta em unidades, então toda quantidade é um número inteiro maior que zero. A entrada pode ser informada em caixas (por exemplo, 3 caixas de 10), e o sistema converte e grava 30 unidades.

**RN-08. Saldo nunca fica negativo.** Uma saída maior que o saldo disponível é recusada, com a mensagem mostrando quanto existe. Isso vale mesmo quando duas pessoas registram saídas do mesmo item ao mesmo tempo: o sistema processa uma de cada vez e a segunda é conferida contra o saldo já atualizado. A mesma regra vale para estornos de entrada.

**RN-09. Rastreabilidade total.** Cada movimentação gera um registro com usuário, data e hora do servidor (fuso America/Sao_Paulo), tipo, item, quantidade, saldo anterior e posterior, endereço IP, dispositivo de origem e observação. A data e a hora vêm sempre do servidor, nunca do aparelho do usuário. Movimentação sem usuário identificado não existe.

**RN-09a. Log inalterável.** O log só recebe novos registros. Nenhum perfil, nem o Administrador, consegue alterar ou apagar um registro pelo sistema. Cada registro guarda o hash do registro anterior, formando uma cadeia; se alguém mexer num registro direto no banco, a cadeia quebra e a verificação de integridade aponta onde.

**RN-09b. Reconstrução e conferência do saldo.** O saldo de qualquer item pode ser reconstruído para qualquer data, somando as movimentações até aquele momento. O Gestor e o Administrador podem rodar uma conferência que compara o saldo atual de cada item com a soma do log. Qualquer diferença aparece como divergência a ser investigada.

**RN-10. Regras da entrada por compra.** Uma `COMPRA` exige o fornecedor, que precisa estar vinculado ao item (RN-05), e o preço unitário, maior que zero. O número da nota fiscal é recomendado; se vai ser obrigatório, depende da resposta da DDA (seção 6, ponto 9).

**RN-11. Regras da saída.** Um `CONSUMO_PRODUCAO` exige o destino (setor, máquina ou centro de custo). A ordem de produção é opcional. Uma `PERDA_QUEBRA` exige o motivo (quebra no manuseio, defeito de fábrica, extravio etc.).

**RN-12. Movimentação não se edita, se estorna.** Depois de gravada, uma movimentação não muda. Se houve erro, o Gestor ou o Administrador faz um `ESTORNO`, que aponta para a movimentação original, exige justificativa e lança o efeito contrário no saldo. Cada movimentação pode ser estornada uma única vez, e um estorno não pode ser estornado. Para corrigir, estorna-se o lançamento errado e lança-se o certo.

**RN-13. Ajuste por inventário.** No inventário, o Gestor informa a quantidade contada na prateleira. O sistema compara com o saldo e, se houver diferença, gera sozinho um `AJUSTE_POSITIVO` ou `AJUSTE_NEGATIVO` com a diferença exata. A justificativa é obrigatória. Se a contagem bate com o saldo, nada é lançado, mas a conferência fica registrada no log.

### 5.3 Níveis de estoque e alertas

**RN-14. Estoque mínimo obrigatório.** Todo item ativo tem um estoque mínimo, que pode ser zero mas precisa estar preenchido. O estoque máximo é opcional e, se informado, precisa ser maior que o mínimo. Mudanças nesses valores vão para o log (RN-23).

**RN-15. Ponto de reposição.**

```
ponto de reposição = estoque mínimo + (consumo médio diário × lead time)
```

O lead time usado é o do fornecedor preferencial. Se não há preferencial, usa-se o do fornecedor com o menor último preço. Se o item não tem consumo registrado ou nenhum fornecedor tem lead time informado, o ponto de reposição é igual ao mínimo. O resultado é arredondado para cima.

**RN-16. Consumo médio diário.**

```
consumo médio diário = soma das saídas CONSUMO_PRODUCAO nos últimos N dias ÷ N
```

Saídas estornadas não entram na conta. Perdas e ajustes também ficam de fora, porque não representam consumo da produção. N é um parâmetro do sistema, com padrão de 90 dias.

> Exemplo: nos últimos 90 dias saíram 270 unidades de um item para a produção. O consumo médio é 270 ÷ 90 = 3 unidades por dia. Com mínimo de 20 e lead time de 7 dias, o ponto de reposição fica em 20 + (3 × 7) = 41 unidades.

**RN-17. Status do item.** O status é calculado sempre que o saldo muda, na ordem abaixo (vale o primeiro que se aplicar):

| Status | Condição |
|---|---|
| `ZERADO` | saldo = 0 |
| `CRITICO` | saldo ≤ estoque mínimo |
| `ATENCAO` | saldo ≤ ponto de reposição |
| `OK` | saldo acima do ponto de reposição |

**RN-18. Alertas sem repetição.** Quando um item entra em `ATENCAO`, `CRITICO` ou `ZERADO`, o sistema abre um alerta. Enquanto esse alerta estiver aberto, não surge outro para o mesmo item: se a situação piorar (de `ATENCAO` para `CRITICO`, por exemplo), o nível do alerta existente sobe e a mudança fica registrada. Quando o saldo volta para `OK`, o alerta fecha sozinho. O Gestor pode marcar o alerta como "ciente" (por exemplo, quando o pedido já foi feito), e o alerta continua aberto até o saldo se normalizar.

**RN-19. Onde os alertas aparecem.** Os alertas ficam no painel do sistema, visíveis para todos os perfis, com um contador no topo da tela e destaque para o Gestor. Uma notificação externa, por e-mail corporativo da DDA por exemplo, é opcional e configurada pelo Administrador. Esse canal serve só para avisar e **nunca é usado para login ou recuperação de senha** (RN-21).

**RN-20. Sugestão de compra.**

```
quantidade alvo = estoque máximo
                  (ou, sem máximo: ponto de reposição + consumo médio diário × 30)
sugestão        = quantidade alvo − saldo, arredondada para cima em múltiplos da embalagem
```

Só entram na sugestão os itens ativos em `ATENCAO`, `CRITICO` ou `ZERADO`. A sugestão mostra também o fornecedor preferencial, o de menor último preço e o custo estimado. A decisão de comprar continua sendo do Gestor, porque o SIMI não emite pedidos na primeira versão.

> Exemplo: saldo de 35, ponto de reposição de 41, sem máximo, consumo de 3 por dia e caixas de 10. Quantidade alvo = 41 + 90 = 131. Sugestão = 131 − 35 = 96, arredondada para 100 (10 caixas).

### 5.4 Acesso e auditoria

**RN-21. Contas geridas pela própria empresa.** Não existe autocadastro nem login com e-mail pessoal (Gmail, Hotmail etc.). Um e-mail externo pode ser perdido quando o funcionário sai ou ser invadido por alguém de fora, e aí o acesso ao estoque ficaria exposto. Por isso, só o Administrador cria usuários, informando nome, **login interno** (a matrícula, por exemplo), setor e perfil. O sistema gera uma **senha provisória**, que o Administrador entrega ao funcionário.

**RN-21a. Troca de senha obrigatória.** No primeiro acesso, e sempre que a senha for redefinida, o usuário só consegue usar o sistema depois de criar uma senha nova. Não há "esqueci minha senha" por e-mail: quem esqueceu pede ao Administrador, que gera uma nova senha provisória. Essa redefinição fica no log.

**RN-21b. Login único e desligamento.** O login interno não se repete e não é reaproveitado, nem depois que o usuário é inativado, para que o histórico nunca fique ambíguo. Quando um funcionário sai da empresa, o Administrador inativa a conta e todas as sessões abertas daquela pessoa são encerradas na hora.

**RN-22. Senha e bloqueio.** Depois de 5 tentativas de login seguidas sem sucesso, a conta é bloqueada e só o Administrador desbloqueia. A senha precisa ter pelo menos 10 caracteres, não pode ser igual ao login e não pode repetir nenhuma das 3 últimas senhas do usuário. Sessões paradas expiram depois de um tempo definido nos parâmetros do sistema.

**RN-23. Tudo o que importa vai para o log.** Além das movimentações (RN-09), o log de auditoria registra:

- login, logout e tentativas sem sucesso;
- criação, alteração, inativação e reativação de qualquer cadastro, com o valor anterior e o novo (por exemplo, "estoque mínimo: 20 → 30");
- criação de usuário, redefinição de senha, bloqueio e desbloqueio;
- estornos, ajustes e inventários;
- mudança de parâmetros do sistema;
- exportação de relatórios;
- execução da conferência de saldo (RN-09b) e o resultado dela.

O log segue as mesmas garantias da RN-09a.

**RN-24. Retenção de 7 anos.** Movimentações, histórico de preços e log de auditoria ficam guardados por pelo menos **7 anos**. A exigência legal costuma ser de 5 anos, e a DDA preferiu manter uma margem. Depois desse prazo, os registros só saem do banco por uma rotina de arquivamento aprovada pelo Administrador, e a própria rotina fica registrada no log.

## 6. Premissas e pontos a validar com a DDA

As regras acima partem de algumas premissas que precisam ser confirmadas antes da etapa de design.

| # | Pergunta | Proposta atual |
|---|---|---|
| 1 | O controle é por unidade ou por aresta de corte? Existe pastilha usada ou reafiada que volta ao estoque? | Por unidade. Sem controle de pastilha usada na V1. |
| 2 | Existe um só almoxarifado ou vários depósitos? | Um almoxarifado, com a localização em texto livre. |
| 3 | A saída precisa registrar a máquina e a ordem de produção? | Destino obrigatório (setor, máquina ou centro de custo). Ordem de produção opcional. |
| 4 | O valor do estoque em reais interessa, ou só a quantidade? | O preço é registrado nas compras (RN-05a), os relatórios mostram quantidade e custo estimado. |
| 5 | Quantos usuários vão usar o sistema, e em quais perfis? | Estimativa: até 30 usuários. |
| 6 | As pastilhas ou as gavetas têm código de barras ou etiqueta? | Não. Leitura de código é opcional para uma versão futura. |
| 7 | Quem recebe os alertas? O painel basta, ou a DDA tem e-mail corporativo para notificações? | Painel obrigatório, e-mail corporativo opcional. |
| 8 | A planilha atual vai ser importada na implantação? | Sim. Importação de itens e saldo inicial por CSV, com o saldo lançado como `AJUSTE_POSITIVO` com a justificativa "saldo inicial da implantação". |
| 9 | O número da nota fiscal deve ser obrigatório nas compras? | Recomendado, não obrigatório. |
| 10 | O perfil Consulta (operador, líder de produção) pode ver os preços pagos aos fornecedores? | Não. Vê os fornecedores, mas sem preços. |

## 7. Histórico do documento

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 25/09/2026 | Primeira versão. Inclui os ajustes pedidos na revisão: vários fornecedores por item com histórico de preços, log inalterável, contas geridas internamente e retenção de 7 anos. |
