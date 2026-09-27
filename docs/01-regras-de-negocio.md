# SICEI: Regras de Negócio

| | |
|---|---|
| **Projeto** | SICEI (Sistema Inteligente de Controle de Estoques Industriais), controle de estoque de pastilhas industriais |
| **Titular** | Benevides Soluções Industriais, dona do SICEI e responsável pelo contato comercial |
| **Cliente** | DDA Metalúrgica (Santa Catarina), que usa o sistema sob licença. Trabalho acadêmico baseado na demanda da empresa |
| **Documento** | 01, Regras de Negócio |
| **Versão** | 1.4 (validada) |
| **Próximo documento** | [02, Requisitos](02-requisitos.md) |

## 1. Problema

A DDA usa vários modelos de pastilhas industriais na usinagem. O consumo é alto e, se uma pastilha faltar, a máquina para. Hoje o estoque é controlado em planilhas preenchidas à mão. As entradas e saídas às vezes não são lançadas, ou são lançadas com atraso, e ninguém sabe ao certo quanto tem na prateleira. A compra acaba sendo feita quando alguém percebe que acabou.

O SICEI substitui a planilha. Cada entrada e saída é registrada no momento em que acontece, o saldo fica sempre atualizado e o sistema avisa antes de o item acabar. Com o histórico gravado, dá para planejar as compras com base no consumo real.

Este documento define **o que o sistema precisa respeitar**, sem entrar em como ele vai ser construído. A parte técnica está no [documento 03](03-system-design.md).

## 2. Glossário

| Termo | Significado no SICEI |
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
| **Posição** | Endereço físico de um compartimento no almoxarifado, no formato Armário → Gaveta → Compartimento (ex.: `A01-G03-C04`). |
| **Colaborador** | Funcionário que retira ou devolve pastilhas no almoxarifado. Está cadastrado no SICEI, mas não precisa ter login. |
| **Movimentação** | Qualquer evento que muda o saldo: entrada, saída, ajuste ou estorno. |
| **Destino** | Setor, máquina ou centro de custo que recebeu a pastilha numa saída. |
| **Ordem de produção (OP)** | Número da ordem de fabricação para a qual a pastilha foi retirada. |
| **Saldo** | Quantidade disponível do item, calculada a partir das movimentações. |
| **Estoque mínimo** | Quantidade a partir da qual (igual ou abaixo) o item é considerado crítico. |
| **Ponto de reposição** | Quantidade em que já é hora de comprar, para a pastilha chegar antes de o saldo cair ao mínimo. |
| **Estoque máximo** | Teto opcional, usado para calcular quanto comprar. |
| **Inventário** | Contagem física das pastilhas para conferir se o saldo do sistema bate com a prateleira. |
| **Log de auditoria** | Registro permanente de tudo o que foi feito no sistema, por quem, quando e de onde. |

## 3. Perfis de acesso

| Perfil | Quem é | O que faz |
|---|---|---|
| **Administrador** | TI ou responsável pelo sistema na DDA | Cria e gerencia usuários (o sistema gera login e senha), define parâmetros do sistema, faz a importação inicial. Tem acesso a todos os cadastros e ao log. |
| **Gestor** | Compras, PCP, supervisão | Cadastra itens, fabricantes, fornecedores, destinos, colaboradores e posições. Define mínimos e máximos, faz estornos, ajustes e inventário. Vê relatórios, sugestões de compra e o log. |
| **Almoxarife** | Quem opera o almoxarifado | Registra entradas e saídas, consulta saldo, histórico e localização, imprime etiquetas. |
| **Consulta** | Operador, líder de produção | Só consulta saldo, localização do item e painel. Não registra nada e não vê preços. |

Os colaboradores que retiram pastilhas no balcão não precisam de login. Quem registra a saída no sistema é o almoxarife, informando quem retirou.

A matriz completa de permissões por funcionalidade está no [documento de requisitos](02-requisitos.md#5-matriz-de-permissões).

## 4. Entidades principais

Este é um modelo conceitual. O modelo de dados de verdade está no [documento 03](03-system-design.md).

- **Item (pastilha):** código interno, descrição, especificação ISO, classe, cobertura, aplicação, fabricante, embalagem (unidades por caixa), posição, estoque mínimo, estoque máximo (opcional), situação (ativo ou inativo).
- **Fabricante:** nome, situação.
- **Fornecedor:** razão social, nome fantasia, CNPJ, telefone, contato, situação.
- **Vínculo item ↔ fornecedor:** código do item no fornecedor, lead time, marcação de preferencial, último preço pago, data da última compra.
- **Histórico de preço:** item, fornecedor, data, preço unitário, quantidade, nota fiscal, usuário. Vem das entradas por compra.
- **Posição:** armário, gaveta, compartimento, código (`A01-G03-C04`), item guardado, situação.
- **Destino:** tipo (setor, máquina ou centro de custo), código, nome, situação.
- **Colaborador:** nome, matrícula (opcional), setor, situação.
- **Movimentação:** item, tipo, quantidade, saldo anterior, saldo posterior, fornecedor, preço e nota fiscal (em compras), destino, ordem de produção e colaborador (em saídas e devoluções), motivo, movimentação estornada (em estornos), usuário, data e hora, origem (IP e dispositivo).
- **Alerta:** item, nível, data de abertura, data de fechamento, quem marcou como ciente.
- **Usuário:** nome, sobrenome, login gerado pelo sistema, setor, perfil, situação, obrigação de trocar a senha, tentativas de login sem sucesso.
- **Registro de auditoria:** ação, entidade afetada, valor anterior, valor novo, usuário, data e hora, origem, hash do registro anterior.

### Tipos de movimentação

| Tipo | Efeito no saldo | Quem pode lançar | Campos obrigatórios além do básico |
|---|---|---|---|
| `COMPRA` | soma | Almoxarife, Gestor, Admin | fornecedor, preço unitário, nota fiscal |
| `DEVOLUCAO_PRODUCAO` | soma | Almoxarife, Gestor, Admin | destino, colaborador que devolveu, motivo |
| `AJUSTE_POSITIVO` | soma | Gestor, Admin | justificativa |
| `CONSUMO_PRODUCAO` | subtrai | Almoxarife, Gestor, Admin | destino, ordem de produção, colaborador que retirou |
| `PERDA_QUEBRA` | subtrai | Almoxarife, Gestor, Admin | motivo |
| `AJUSTE_NEGATIVO` | subtrai | Gestor, Admin | justificativa |
| `ESTORNO` | inverso da original | Gestor, Admin | movimentação original, justificativa |

## 5. Regras de negócio

### 5.1 Cadastros

**RN-01. Código interno único.** Todo item tem um código interno obrigatório, e dois itens não podem ter o mesmo código. Depois da primeira movimentação do item, o código fica travado, porque o histórico e os relatórios dependem dele. O código de um item inativo também continua ocupado. No cadastro, o sistema sugere o próximo número da sequência em uso (depois de PST-006 vem PST-007) e avisa na hora se o código digitado já existe. O mesmo código escrito de outro jeito conta como repetido: com PST-001 cadastrado, "pst1", "PST 01" e "Pst-001" são recusados no cadastro, na edição e na importação da planilha. No cadastro e na edição, o código entra no padrão da sequência: "pst8" é gravado como PST-008. Na importação, o código fica como está no arquivo.

**RN-02. Nada com histórico é apagado.** Item, fabricante, fornecedor, destino, colaborador, posição ou usuário que já aparece em alguma movimentação ou registro de log não pode ser excluído. O que existe é a **inativação**. Um cadastro criado por engano e que nunca foi usado pode ser excluído, e a exclusão fica no log.

**RN-03. Item inativo fica congelado.** Um item inativo não recebe movimentação, não gera alerta e não entra na sugestão de compra, mas continua aparecendo no histórico e nos relatórios de períodos antigos. Só dá para inativar um item com saldo zero. Ao ser inativado, o item libera a posição que ocupava. O Gestor pode reativá-lo.

**RN-04. Documentos válidos e sem duplicidade.** O CNPJ do fornecedor precisa ter dígitos verificadores válidos e não pode se repetir. O nome do fabricante também é único, sem diferenciar maiúsculas de minúsculas. A matrícula do colaborador, quando informada, também é única.

**RN-05. Todos os fornecedores do item ficam cadastrados.** A DDA pode comprar a mesma pastilha de fornecedores diferentes, e todos eles precisam estar no sistema, ligados ao item. Um item ativo precisa ter pelo menos um fornecedor vinculado. Em cada vínculo ficam o código que o fornecedor usa para aquele item, o lead time e o **último preço unitário pago**. Um dos fornecedores pode ser marcado como preferencial.

**RN-05a. Histórico de preços permanente.** Toda entrada do tipo `COMPRA` registra o preço unitário, que é obrigatório nesse tipo de entrada. O preço vai para o histórico daquele item com aquele fornecedor e **nunca é sobrescrito nem apagado**. O "último preço" exibido no vínculo é sempre o da compra mais recente. Se uma compra for estornada, o último preço volta a ser o da compra anterior que não foi estornada, e o registro estornado continua no histórico, marcado como estornado.

**RN-05b. Comparar fornecedores na consulta do item.** Ao abrir um item, o usuário vê a lista de fornecedores com último preço, data da última compra e lead time de cada um, ordenada do menor para o maior preço. Fornecedores que ainda não tiveram compra aparecem no fim, com a indicação "sem compras". Ao expandir um fornecedor, abre o histórico completo de preços (data, preço unitário, quantidade, nota fiscal e quem lançou), com a variação percentual em relação à compra anterior. O perfil Consulta vê os fornecedores, mas não os preços.

> Exemplo: a pastilha `CNMG 120408 P25` tem três fornecedores. A lista mostra Fornecedor A a R$ 38,90 (compra de 02/09, lead time 5 dias), Fornecedor B a R$ 41,20 (compra de 15/08, 3 dias) e Fornecedor C, sem compras. Ao expandir o A, aparecem as compras de 02/09 (R$ 38,90, +4,0%), 10/07 (R$ 37,40, +1,1%) e 03/05 (R$ 37,00).

**RN-25. Endereçamento no almoxarifado.** Existe um único almoxarifado. As pastilhas ficam na caixa original do fabricante, que protege as arestas e mantém a identificação, dentro de gaveteiros com gavetas rasas e divisórias. Cada compartimento tem um endereço de 3 níveis, **Armário → Gaveta → Compartimento**, no formato `A01-G03-C04`.

- As posições são cadastradas no sistema antes de receber itens.
- Um compartimento guarda **um único item**, e cada item ativo fica em **uma única posição**.
- Mudar um item de posição é permitido, e a mudança fica no log.
- O código da posição pode ser digitado sem traços e sem zeros à esquerda: "a1g3c4" e "A1 G3 C4" viram A01-G03-C04. Vale na escolha da posição do item, no campo da tela "Ler QR", no endereço `/p/…`, na lista de etiquetas e na importação.
- A organização física recomendada é agrupar por aplicação (torneamento, fresamento, furação, rosca) e, dentro dela, por formato. O sistema não obriga essa organização.

**RN-26. Etiqueta QR.** O sistema gera uma etiqueta com QR code para cada posição ocupada, com o código da posição, o código interno e a descrição do item. A etiqueta vai na frente do compartimento. Ler o QR abre a página do item no SICEI, desde que o usuário esteja logado. A leitura pode ser feita pela tela "Ler QR" do próprio SICEI, que usa a câmera de qualquer celular (Android ou iPhone), ou pela câmera do celular fora do sistema. Se a etiqueta estiver apagada, o código da posição pode ser digitado. Se o item mudar de posição, a etiqueta precisa ser reimpressa: a posição fica com a etiqueta pendente, o sistema avisa na página do item e na tela de etiquetas, e a pendência só some quando a etiqueta é mandada para a impressora pela tela de etiquetas. A impressão fica no log.

### 5.2 Movimentações e saldo

**RN-06. O saldo vem das movimentações.** Ninguém digita o saldo. Ele é sempre o resultado da soma das entradas menos as saídas, com os estornos considerados. Qualquer tela ou relatório que mostre saldo usa esse mesmo cálculo.

**RN-07. Quantidades inteiras e positivas.** O controle é **por unidade de pastilha**, e não por aresta de corte. Pastilha usada ou reafiada não volta ao estoque. Toda quantidade é um número inteiro maior que zero. A entrada pode ser informada em caixas (por exemplo, 3 caixas de 10), e o sistema converte e grava 30 unidades.

**RN-08. Saldo nunca fica negativo.** Uma saída maior que o saldo disponível é recusada, com a mensagem mostrando quanto existe. Isso vale mesmo quando duas pessoas registram saídas do mesmo item ao mesmo tempo: o sistema processa uma de cada vez e a segunda é conferida contra o saldo já atualizado. A mesma regra vale para estornos de entrada.

**RN-09. Rastreabilidade total.** Cada movimentação gera um registro com usuário, data e hora do servidor (fuso America/Sao_Paulo), tipo, item, quantidade, saldo anterior e posterior, endereço IP, dispositivo de origem e observação. A data e a hora vêm sempre do servidor, nunca do aparelho do usuário. Movimentação sem usuário identificado não existe.

**RN-09a. Log inalterável.** O log só recebe novos registros. Nenhum perfil, nem o Administrador, consegue alterar ou apagar um registro pelo sistema. Cada registro guarda o hash do registro anterior, formando uma cadeia; se alguém mexer num registro direto no banco, a cadeia quebra e a verificação de integridade aponta onde.

**RN-09b. Reconstrução e conferência do saldo.** O saldo de qualquer item pode ser reconstruído para qualquer data, somando as movimentações até aquele momento. O Gestor e o Administrador podem rodar uma conferência que compara o saldo atual de cada item com a soma do log. Qualquer diferença aparece como divergência a ser investigada.

**RN-10. Regras da entrada por compra.** Uma `COMPRA` exige:

- o fornecedor, que precisa estar vinculado ao item (RN-05);
- o preço unitário, maior que zero;
- o **número da nota fiscal**, obrigatório.

**RN-11. Regras da saída e da devolução.** Um `CONSUMO_PRODUCAO` exige três informações: o **destino** (setor, máquina ou centro de custo), o **número da ordem de produção** e o **colaborador que retirou** a pastilha, escolhido no cadastro de colaboradores. Uma `DEVOLUCAO_PRODUCAO` exige o destino, o colaborador que devolveu e o motivo. Uma `PERDA_QUEBRA` exige o motivo (quebra no manuseio, defeito de fábrica, extravio etc.).

**RN-12. Movimentação não se edita, se estorna.** Depois de gravada, uma movimentação não muda. Se houve erro, o Gestor ou o Administrador faz um `ESTORNO`, que aponta para a movimentação original, exige justificativa e lança o efeito contrário no saldo. Cada movimentação pode ser estornada uma única vez, e um estorno não pode ser estornado. Para corrigir, estorna-se o lançamento errado e lança-se o certo.

**RN-13. Ajuste por inventário.** No inventário, o Gestor informa a quantidade contada na prateleira. O sistema compara com o saldo e, se houver diferença, gera sozinho um `AJUSTE_POSITIVO` ou `AJUSTE_NEGATIVO` com a diferença exata. A justificativa é obrigatória. Se a contagem bate com o saldo, nada é lançado, mas a conferência fica registrada no log.

### 5.3 Níveis de estoque e alertas

O SICEI trabalha **só com quantidades**. Os preços ficam registrados para comparar fornecedores (RN-05a e RN-05b), mas o sistema não calcula o valor do estoque em reais.

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

**RN-18. Alertas sem repetição.** Quando um item entra em `ATENCAO`, `CRITICO` ou `ZERADO`, o sistema abre um alerta. Enquanto esse alerta estiver aberto, não surge outro para o mesmo item: se a situação piorar (de `ATENCAO` para `CRITICO`, por exemplo), o nível do alerta existente sobe e a mudança fica registrada. Se a situação melhora mas o item continua em alerta (de `ZERADO` para `ATENCAO`, por exemplo, depois de uma compra parcial), o nível do alerta aberto é atualizado para o atual, sem novo e-mail. Quando o saldo volta para `OK`, o alerta fecha sozinho. O Gestor pode marcar o alerta como "ciente" (por exemplo, quando o pedido já foi feito), e o alerta continua aberto até o saldo se normalizar.

**RN-19. Onde os alertas aparecem.** Os alertas ficam no painel do sistema, visíveis para todos os perfis, com um contador no topo da tela e destaque para o Gestor. Além disso, quando um item entra em `CRITICO` ou `ZERADO`, o sistema envia um aviso para o **e-mail corporativo** da DDA configurado pelo Administrador. Esse e-mail serve só para avisar e **nunca é usado para login ou recuperação de senha** (RN-21).

**RN-20. Sugestão de compra.**

```
quantidade alvo = estoque máximo
                  (ou, sem máximo: ponto de reposição + consumo médio diário × 30)
sugestão        = quantidade alvo − saldo, arredondada para cima em múltiplos da embalagem
```

Só entram na sugestão os itens ativos em `ATENCAO`, `CRITICO` ou `ZERADO`. Junto da quantidade, a sugestão mostra o fornecedor preferencial, o de menor último preço e o lead time de cada um. A decisão de comprar continua sendo do Gestor, porque o SICEI não emite pedidos de compra.

> Exemplo: saldo de 35, ponto de reposição de 41, sem máximo, consumo de 3 por dia e caixas de 10. Quantidade alvo = 41 + 90 = 131. Sugestão = 131 − 35 = 96, arredondada para 100 (10 caixas).

### 5.4 Acesso e auditoria

**RN-21. Login e senha gerados pelo sistema.** Não existe autocadastro e nenhum login usa e-mail. Um e-mail pessoal (Gmail, Hotmail etc.) pode ser perdido quando o funcionário sai ou ser invadido por alguém de fora, e aí o acesso ao estoque ficaria exposto. Todas as contas são geridas dentro da empresa:

1. A instalação do sistema cria **um único usuário Administrador**, que é obrigado a trocar a senha no primeiro acesso.
2. Para cadastrar um funcionário, o Administrador informa **nome, sobrenome, setor e perfil**.
3. **O sistema gera o login** no formato `nome.sobrenome`, em minúsculas e sem acentos. Partículas como "de", "da", "do", "dos" e "das" são ignoradas, e o sobrenome usado é o último. Exemplos: João da Silva vira `joao.silva`, e Maria Aparecida de Souza vira `maria.souza`. Se o login já existe ou já existiu, o sistema acrescenta um número: `joao.silva2`, `joao.silva3`.
4. **O sistema gera uma senha provisória** de 12 caracteres aleatórios, sem caracteres que se confundem (0 e O, 1, l e I). A senha aparece **uma única vez** na tela, para o Administrador repassar ao funcionário. Depois disso nem o Administrador consegue vê-la de novo.

**RN-21a. Troca de senha obrigatória.** No primeiro acesso, e sempre que a senha for redefinida, o usuário só consegue usar o sistema depois de criar a própria senha. Assim o Administrador nunca conhece a senha definitiva de ninguém e não tem como registrar movimentações no nome de outra pessoa. Quem esquecer a senha pede ao Administrador, que gera uma nova senha provisória pelo mesmo processo da RN-21. A redefinição fica no log.

**RN-21b. Login único e desligamento.** O login não se repete e não é reaproveitado, nem depois que o usuário é inativado, para que o histórico nunca fique ambíguo. Quando um funcionário sai da empresa, o Administrador inativa a conta e todas as sessões abertas daquela pessoa são encerradas na hora.

**RN-22. Senha e bloqueio.** Depois de 5 tentativas de login seguidas sem sucesso, a conta é bloqueada e só o Administrador desbloqueia. A senha criada pelo usuário precisa ter pelo menos 10 caracteres, não pode ser igual ao login e não pode repetir nenhuma das 3 últimas senhas dele. Sessões paradas expiram depois de um tempo definido nos parâmetros do sistema.

**RN-23. Tudo o que importa vai para o log.** Além das movimentações (RN-09), o log de auditoria registra:

- login, logout e tentativas sem sucesso;
- criação, alteração, inativação e reativação de qualquer cadastro, com o valor anterior e o novo (por exemplo, "estoque mínimo: 20 → 30");
- mudança de posição de um item;
- criação de usuário, geração e redefinição de senha, bloqueio e desbloqueio;
- estornos, ajustes e inventários;
- mudança de parâmetros do sistema;
- importação de dados, exportação de relatórios e impressão de etiquetas;
- execução da conferência de saldo (RN-09b) e o resultado dela.

O log segue as mesmas garantias da RN-09a.

**RN-24. Retenção de 7 anos.** Movimentações, histórico de preços e log de auditoria ficam guardados por pelo menos **7 anos**. A exigência legal costuma ser de 5 anos, e a DDA preferiu manter uma margem. Depois desse prazo, os registros só saem do banco por uma rotina de arquivamento aprovada pelo Administrador, e a própria rotina fica registrada no log.

## 6. Decisões validadas

Os pontos que estavam em aberto na versão 0.1 foram respondidos assim:

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Controle por unidade ou por aresta? Pastilha usada volta ao estoque? | Por unidade. Pastilha usada não volta (RN-07). |
| 2 | Um almoxarifado ou vários depósitos? | Um almoxarifado, com endereço exato de 3 níveis (RN-25). |
| 3 | O que a saída registra? | Destino, ordem de produção e colaborador que retirou, todos obrigatórios (RN-11). |
| 4 | Interessa o valor do estoque em reais? | Não. O sistema trabalha só com quantidades; os preços servem para comparar fornecedores. |
| 5 | Quantos usuários? | De 10 a 30. |
| 6 | Código de barras ou etiqueta? | O SICEI gera etiquetas QR por posição (RN-26). |
| 7 | Onde aparecem os alertas? | No painel e no e-mail corporativo (RN-19). |
| 8 | Importar a planilha atual? | Sim, por CSV, com o saldo lançado como `AJUSTE_POSITIVO` com a justificativa "saldo inicial da implantação". |
| 9 | Nota fiscal obrigatória nas compras? | Sim (RN-10). |
| 10 | O perfil Consulta vê preços? | Não (RN-05b). |
| 11 | Como são criados os usuários? | Pelo Administrador, com login e senha gerados pelo sistema (RN-21). |

**Fora do escopo.** Por se tratar de um trabalho acadêmico, a API para integrações e a integração com ERP, compras ou controle de produção não serão feitas. A demanda da DDA trata essa integração como possibilidade futura, não como obrigação da primeira versão.

## 7. Histórico do documento

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 25/09/2026 | Primeira versão, com vários fornecedores por item e histórico de preços, log inalterável, contas geridas internamente e retenção de 7 anos. |
| 1.0 | 25/09/2026 | Decisões validadas: endereçamento de 3 níveis e etiqueta QR (RN-25, RN-26), saída com OP e colaborador, NF obrigatória, só quantidades, login e senha gerados pelo sistema, integração fora do escopo. |
| 1.1 | 26/09/2026 | RN-18: alerta que melhora sem sair do alerta é atualizado para o nível atual. Glossário: crítico é saldo igual ou abaixo do mínimo. |
| 1.2 | 27/09/2026 | O projeto passa a se chamar SICEI (Sistema Inteligente de Controle de Estoques Industriais), antes SIMI. O SICEI pertence à Benevides Soluções Industriais, e a DDA passa a constar como cliente licenciada. Nenhuma regra mudou. |
| 1.3 | 27/09/2026 | RN-26: a etiqueta pode ser lida dentro do SICEI, pela tela "Ler QR", com a câmera de qualquer celular, ou digitada quando estiver apagada. |
| 1.4 | 27/09/2026 | RN-01: sugestão do próximo código e aviso de código já usado. RN-26: etiqueta pendente quando o item muda de posição, até ser impressa. |
| 1.5 | 27/09/2026 | RN-01: o mesmo código escrito de outro jeito ("pst1" e PST-001) conta como repetido, e o código novo entra no padrão da sequência. RN-25: a posição pode ser digitada sem traços e sem zeros. |
