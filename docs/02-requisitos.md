# SICEI: Requisitos

| | |
|---|---|
| **Projeto** | SICEI (Sistema Inteligente de Controle de Estoques Industriais), controle de estoque de pastilhas industriais |
| **Documento** | 02, Requisitos |
| **Versão** | 1.7 (validada) |
| **Base** | [01, Regras de Negócio](01-regras-de-negocio.md) |
| **Próximo documento** | [03, System Design](03-system-design.md) |

Este documento lista o que o SICEI precisa fazer (requisitos funcionais, RF) e como ele precisa se comportar (requisitos não funcionais, RNF). As regras de negócio citadas (RN-xx) estão no documento 01.

## 1. Priorização

Os requisitos estão classificados pelo método MoSCoW:

- **Must:** sem isso o sistema não resolve o problema. É o escopo do MVP.
- **Should:** importante, entra se o prazo permitir.
- **Could:** desejável, só se sobrar tempo.

## 2. Requisitos funcionais

| ID | Requisito | Prioridade | Regras |
|---|---|---|---|
| RF-01 | Autenticação com login gerado pelo sistema: entrar, sair, troca obrigatória da senha provisória, bloqueio após tentativas sem sucesso | Must | RN-21, RN-21a, RN-22 |
| RF-02 | Gestão de usuários pelo Administrador: cadastrar (nome, sobrenome, setor, perfil) com login e senha gerados pelo sistema, redefinir senha, desbloquear, inativar | Must | RN-02, RN-21, RN-21a, RN-21b, RN-22 |
| RF-03 | Cadastro de pastilhas, com inativação e busca por código, descrição, ISO ou classe | Must | RN-01, RN-02, RN-03 |
| RF-04 | Cadastro de fabricantes | Must | RN-02, RN-04 |
| RF-05 | Cadastro de fornecedores e vínculo item ↔ fornecedor (vários por item, com código no fornecedor, lead time e preferencial) | Must | RN-02, RN-04, RN-05 |
| RF-05a | Consulta do item com lista de fornecedores, último preço de cada um e histórico de preços ao expandir | Must | RN-05a, RN-05b |
| RF-06 | Cadastro de destinos (setor, máquina, centro de custo) | Must | RN-02, RN-11 |
| RF-07 | Registrar entrada (compra, devolução da produção) | Must | RN-03, RN-05a, RN-06, RN-07, RN-09, RN-10, RN-11 |
| RF-08 | Registrar saída (consumo da produção, perda ou quebra) | Must | RN-03, RN-06, RN-07, RN-08, RN-09, RN-11 |
| RF-09 | Estornar movimentação | Must | RN-05a, RN-08, RN-09, RN-12 |
| RF-10 | Inventário e ajuste de estoque | Should | RN-09, RN-13 |
| RF-11 | Consulta de saldo em tempo real, com status, posição e filtros | Must | RN-06, RN-15, RN-17, RN-25 |
| RF-12 | Configurar estoque mínimo e máximo por item | Must | RN-14 |
| RF-13 | Alertas no sistema: painel e contador de alertas abertos | Must | RN-18, RN-19 |
| RF-14 | Aviso por e-mail corporativo quando um item fica crítico ou zerado | Must | RN-19 |
| RF-15 | Histórico de movimentações com filtros por período, item, tipo, usuário, destino, colaborador e OP | Must | RN-09 |
| RF-16 | Painel geral: itens em alerta, consumo do mês, itens mais consumidos, últimas movimentações | Must | RN-17 |
| RF-17 | Relatório de consumo por item, destino, colaborador e período | Must | RN-16 |
| RF-18 | Relatório de movimentação | Must | RN-09 |
| RF-19 | Relatório de necessidade de reposição (sugestão de compra) | Must | RN-03, RN-15, RN-16, RN-20 |
| RF-20 | Exportar relatórios em CSV e PDF | Should | RN-23 |
| RF-21 | Log de auditoria consultável, verificação de integridade e conferência de saldo | Must | RN-09, RN-09a, RN-09b, RN-23, RN-24 |
| RF-22 | Gerar e imprimir etiquetas QR por posição; ler o QR com a câmera do celular abre o item | Must | RN-26 |
| RF-25 | Importação inicial da planilha atual (itens e saldo) por CSV | Must | RN-06, RN-09 |
| RF-26 | Parâmetros do sistema: janela do consumo médio (N dias), tempo de sessão, e-mail corporativo para avisos | Must | RN-16, RN-19, RN-22 |
| RF-27 | Cadastro de colaboradores (nome, matrícula, setor), sem login | Must | RN-02, RN-04, RN-11 |
| RF-28 | Cadastro de posições (armário, gaveta, compartimento) e atribuição de item à posição | Must | RN-02, RN-25 |

### Fora do escopo

RF-23 (API REST para integrações) e RF-24 (integração com ERP, compras ou controle de produção) foram retirados, porque este é um trabalho acadêmico. A demanda da DDA trata a integração como possibilidade futura, não como obrigação. Os números não são reaproveitados, para não confundir referências antigas.

## 3. Critérios de aceite

Os critérios estão no formato **Dado / Quando / Então** e viram casos de teste na etapa de QA.

### RF-01. Autenticação
1. **Dado** um usuário ativo com senha correta, **quando** ele entra com o login e a senha, **então** acessa o sistema com as permissões do seu perfil, e o login fica no log.
2. **Dado** um usuário com senha provisória, **quando** ele entra, **então** é levado direto à troca de senha e não acessa nenhuma outra tela antes de concluir.
3. **Dado** um usuário que errou a senha 4 vezes seguidas, **quando** erra a quinta, **então** a conta é bloqueada, a mensagem orienta a procurar o Administrador e o bloqueio fica no log.
4. **Dado** um login inexistente ou uma senha errada, **quando** o usuário tenta entrar, **então** a mensagem é a mesma nos dois casos, para não revelar quais logins existem.
5. **Dado** uma nova senha com menos de 10 caracteres, igual ao login ou igual a uma das 3 últimas, **quando** o usuário tenta salvar, **então** a troca é recusada com o motivo.
6. **Dado** o sistema recém-instalado, **quando** o Administrador inicial entra pela primeira vez, **então** é obrigado a trocar a senha.

### RF-02. Gestão de usuários
1. **Dado** o Administrador, **quando** cadastra "João" "da Silva", setor Almoxarifado, perfil Almoxarife, **então** o sistema gera o login `joao.silva`, gera uma senha provisória de 12 caracteres, mostra os dois uma única vez e registra a criação no log sem a senha.
2. **Dado** que `joao.silva` já existe, ou existiu e foi inativado, **quando** o Administrador cadastra outro João Silva, **então** o login gerado é `joao.silva2`.
3. **Dado** o nome "Maria Aparecida" e o sobrenome "de Souza", **quando** cadastrado, **então** o login é `maria.souza`, sem acentos, sem partículas e em minúsculas.
4. **Dado** a tela de confirmação já fechada, **quando** o Administrador volta ao cadastro do usuário, **então** a senha provisória não aparece mais em lugar nenhum.
5. **Dado** um usuário com sessão aberta, **quando** o Administrador inativa a conta, **então** a sessão é encerrada imediatamente e o usuário não consegue mais entrar.
6. **Dado** um usuário bloqueado ou que esqueceu a senha, **quando** o Administrador redefine a senha, **então** uma nova senha provisória é gerada, a conta é desbloqueada, a troca volta a ser obrigatória e tudo fica no log.
7. **Dado** um usuário que não é Administrador, **quando** tenta acessar a gestão de usuários, **então** o acesso é negado pelo servidor, e não só escondido na tela.
8. **Dado** o Administrador digitando "Maria Aparecida" e "de Souza" com `maria.souza` já existente, **quando** ainda não enviou o formulário, **então** a tela já mostra o login `maria.souza2` e o motivo do número. O login definitivo é o que o servidor gerar.

### RF-03. Cadastro de pastilhas
1. **Dado** um código interno já usado, **quando** o Gestor tenta cadastrar outro item com ele, **então** o cadastro é recusado.
2. **Dado** um item com movimentação, **quando** o Gestor tenta alterar o código interno, **então** o campo está bloqueado.
3. **Dado** um item com saldo maior que zero, **quando** o Gestor tenta inativá-lo, **então** a inativação é recusada e o sistema mostra o saldo.
4. **Dado** o termo "120408", **quando** o usuário busca, **então** aparecem todos os itens com esse trecho no código, na descrição ou na ISO.
5. **Dado** um item novo, **quando** o Gestor tenta salvar sem fabricante, estoque mínimo ou pelo menos um fornecedor, **então** o sistema pede os campos faltantes.
6. **Dado** os itens PST-001 a PST-006 já cadastrados, **quando** o Gestor abre "Novo item", **então** o código já vem preenchido com PST-007. Se ele digitar um código em uso (inclusive de item inativo), a tela avisa, sugere o próximo livre e não deixa salvar.
7. **Dado** um item novo cujo fabricante ou fornecedor ainda não existe, **quando** o Gestor usa "Fabricante não está na lista?" ou "Fornecedor não está na lista?", **então** cadastra ali mesmo (o CNPJ é conferido enquanto digita), o novo registro já fica escolhido e o cadastro fica no log. O vínculo com o fornecedor nasce junto com o item.
8. **Dado** a tela Cadastros, **quando** o usuário abre, **então** a primeira aba é Itens, com todos os itens, inclusive os inativos, e os atalhos para cadastrar, editar e importar.
9. **Dado** PST-001 a PST-007 cadastrados, **quando** o Gestor digita "pst1" no código de um item novo, **então** a tela avisa que é o mesmo código que PST-001 e não deixa salvar; o servidor recusa do mesmo jeito. **Quando** digita "pst8" e sai do campo, **então** o código vira PST-008 (RN-01).

### RF-04. Cadastro de fabricantes
1. **Dado** um fabricante "Sandvik" cadastrado, **quando** alguém tenta cadastrar "SANDVIK", **então** o cadastro é recusado por duplicidade.
2. **Dado** um fabricante com itens vinculados, **quando** o Gestor tenta excluí-lo, **então** só a inativação é oferecida.

### RF-05. Fornecedores e vínculo com itens
1. **Dado** um CNPJ com dígito verificador inválido ou já cadastrado, **quando** o Gestor tenta salvar, **então** o cadastro é recusado com o motivo.
2. **Dado** um item, **quando** o Gestor vincula três fornecedores, **então** os três ficam ligados ao item, cada um com seu código, lead time e sem preço até a primeira compra.
3. **Dado** um item com vários fornecedores, **quando** o Gestor marca um como preferencial, **então** o anterior deixa de ser preferencial, porque só existe um por item.
4. **Dado** um item ativo com um único fornecedor, **quando** o Gestor tenta desvinculá-lo, **então** a ação é recusada.

### RF-05a. Fornecedores e preços na consulta do item
1. **Dado** um item com três fornecedores, **quando** o usuário abre o item, **então** vê a lista com último preço, data da última compra e lead time, do menor para o maior preço, com os fornecedores sem compra no fim.
2. **Dado** um fornecedor com várias compras, **quando** o usuário expande a linha, **então** vê o histórico completo (data, preço, quantidade, NF, usuário) e a variação percentual de cada compra em relação à anterior.
3. **Dado** que a última compra de um fornecedor foi estornada, **quando** o usuário abre o item, **então** o último preço exibido é o da compra anterior válida, e a compra estornada aparece no histórico marcada como estornada.
4. **Dado** o perfil Consulta, **quando** abre o item, **então** vê os fornecedores, mas sem preços nem histórico de preços.

### RF-06. Cadastro de destinos
1. **Dado** um destino usado em saídas, **quando** o Gestor tenta excluí-lo, **então** só a inativação é oferecida.
2. **Dado** um destino inativo, **quando** o almoxarife registra uma saída, **então** esse destino não aparece na lista.

### RF-07. Registrar entrada
1. **Dado** um item ativo e um fornecedor vinculado, **quando** o almoxarife lança uma `COMPRA` de 3 caixas de 10 a R$ 38,90 com a NF 12345, **então** o saldo sobe 30 unidades, o preço entra no histórico do fornecedor e o registro guarda saldo anterior, saldo posterior, usuário, data, IP e dispositivo.
2. **Dado** uma `COMPRA` sem preço unitário, sem nota fiscal ou com fornecedor não vinculado ao item, **quando** o almoxarife tenta salvar, **então** o lançamento é recusado.
3. **Dado** uma `DEVOLUCAO_PRODUCAO` sem destino, colaborador ou motivo, **quando** alguém tenta salvar, **então** o lançamento é recusado.
4. **Dado** um item inativo, **quando** alguém tenta lançar entrada, **então** o lançamento é recusado.
5. **Dado** uma quantidade zero, negativa ou fracionada, **quando** alguém tenta lançar, **então** o lançamento é recusado.
6. **Dado** uma compra de um fornecedor que ainda não está cadastrado, **quando** o Gestor ou o Administrador usa "Fornecedor não está na lista?" na própria tela da entrada, **então** o fornecedor é criado e vinculado ao item numa transação só, o CNPJ é conferido enquanto digita (inválido, duplicado ou válido), o fornecedor já fica escolhido na compra e as duas operações ficam no log. O Almoxarife não vê essa opção, porque não cadastra fornecedores.
7. **Dado** a quantidade digitada, **quando** o almoxarife ainda não confirmou, **então** a tela mostra a conversão de caixas em unidades, o saldo e o status depois da entrada. A gravação continua sendo decidida pelo servidor.

### RF-08. Registrar saída
1. **Dado** um item com saldo 12, **quando** o almoxarife lança um `CONSUMO_PRODUCAO` de 4 unidades para o torno CNC 03, OP 2026-0457, retirado por `Carlos Pereira`, **então** o saldo passa a 8, o status é recalculado e a movimentação guarda destino, OP e colaborador.
2. **Dado** um item com saldo 3, **quando** alguém tenta tirar 5, **então** a saída é recusada com a mensagem "saldo disponível: 3".
3. **Dado** um item com saldo 5 e duas saídas de 4 enviadas ao mesmo tempo, **quando** o sistema processa, **então** uma é aceita e a outra recusada, e o saldo final é 1, nunca −3.
4. **Dado** um `CONSUMO_PRODUCAO` sem destino, sem OP ou sem colaborador, ou uma `PERDA_QUEBRA` sem motivo, **quando** alguém tenta salvar, **então** o lançamento é recusado.
5. **Dado** um colaborador inativo, **quando** o almoxarife registra uma saída, **então** esse colaborador não aparece na lista.
6. **Dado** um almoxarife no celular que leu o QR da gaveta, **quando** registra a saída, **então** o item já vem preenchido e ele só informa quantidade, destino, OP e colaborador antes de confirmar.
7. **Dado** um item com saldo 3, **quando** o almoxarife digita 5, **então** a tela avisa "Saída recusada" com o saldo disponível e o botão de confirmar fica bloqueado, antes mesmo de enviar. O servidor continua recusando se o pedido chegar (critério 2).
8. **Dado** uma saída gravada, **quando** a tela confirma, **então** mostra o saldo antes e agora, avisa se o item entrou em Atenção, Crítico ou Zerado e oferece ler outra etiqueta ou voltar ao item.
9. **Dado** a tela de registrar sem item escolhido, **quando** o almoxarife digita, **então** a lista de itens se filtra a cada letra (critério 4 do RF-11); quando o código é reconhecido, a tela avisa e o Enter abre o item; setas escolhem outro da lista.

### RF-09. Estornar movimentação
1. **Dado** uma saída de 4 unidades lançada por engano, **quando** o Gestor estorna com justificativa, **então** o saldo volta a subir 4, o estorno aponta para a saída original e ela aparece marcada como estornada.
2. **Dado** uma movimentação já estornada, **quando** alguém tenta estorná-la de novo, **então** a ação é recusada. Um estorno também não pode ser estornado.
3. **Dado** uma entrada de 30 unidades cujo item hoje tem saldo 10, **quando** o Gestor tenta estorná-la, **então** a ação é recusada, porque o saldo ficaria negativo.
4. **Dado** o perfil Almoxarife, **quando** tenta estornar, **então** a ação é negada.

### RF-11. Consulta de saldo
1. **Dado** qualquer perfil, **quando** abre a lista de itens, **então** vê código, descrição, saldo, mínimo, ponto de reposição, status (com cor e texto) e posição.
2. **Dado** uma saída registrada por outro usuário, **quando** a consulta é aberta ou atualizada, **então** o saldo já reflete a saída.
3. **Dado** o filtro "somente críticos e zerados", **quando** aplicado, **então** só aparecem itens com esses status.
4. **Dado** o item PST-001 na posição A01-G01-C01 com ISO "CNMG 120408", **quando** alguém busca "Pst001", "pst 1", "PST-1", "a01g01c01" ou "cnmg120408", **então** o PST-001 aparece. Maiúsculas, acentos, traços, espaços e zeros à esquerda não importam, e o código exato vem primeiro. Vale para a lista de itens, a busca do topo e a escolha do item ao registrar.
5. **Dado** a busca do topo, **quando** o usuário digita "pst2", **então** aparecem até 8 itens sugeridos com código, descrição, posição e status; setas e Enter ou um toque abrem o item, e Enter sem escolher leva à lista de itens com o termo.
6. **Dado** um campo de escolha de fornecedor, fabricante, colaborador, destino ou posição, **quando** o usuário digita, **então** as opções se filtram com a mesma tolerância: o fornecedor é achado pelo nome ou pelo CNPJ só com números, o colaborador pelo nome ou pela matrícula, o destino pelo nome ou pelo código ("cnc 3" acha CNC-03) e a posição sem traços ("a4g2c1" acha A04-G02-C01). Só um valor da lista é enviado: ao sair do campo, o texto que reconhece uma opção só vira a escolha, e o que não reconhece volta para a escolha anterior. Listas curtas e fixas (tipo de destino, aplicação, perfil) continuam como lista simples.

### RF-12. Estoque mínimo e máximo
1. **Dado** um máximo menor ou igual ao mínimo, **quando** o Gestor tenta salvar, **então** a alteração é recusada.
2. **Dado** uma alteração do mínimo de 20 para 30, **quando** salva, **então** o status do item é recalculado na hora e o log registra "20 → 30", quem mudou e quando.

### RF-13. Alertas no sistema
1. **Dado** um item com saldo 42 e ponto de reposição 41, **quando** sai 1 unidade, **então** abre um alerta `ATENCAO` e o contador no topo aumenta.
2. **Dado** um alerta `ATENCAO` aberto, **quando** o saldo cai abaixo do mínimo, **então** o mesmo alerta sobe para `CRITICO` e nenhum alerta novo é criado.
3. **Dado** um alerta aberto, **quando** uma compra leva o saldo acima do ponto de reposição, **então** o alerta fecha sozinho.
4. **Dado** um alerta aberto, **quando** o Gestor marca como ciente, **então** ele continua aberto, mas aparece identificado com quem marcou e quando.
5. **Dado** um Gestor ou Administrador e 3 alertas abertos sem ciente, **quando** ele entra no sistema, **então** aparece no centro da tela "Existem 3 alertas sem ciente", com um símbolo de atenção e o botão VER. Não há como fechar: o aviso continua em qualquer página até ele tocar em VER, que leva à tela de alertas. Ir à tela de alertas não obriga a dar ciente (o ciente é de quem responde pelo alerta); serve para todo Gestor e Administrador saber que existem alertas e cobrar o responsável. Depois disso o aviso não volta, nem navegando pelo menu nem recarregando a página, até o próximo login. Almoxarife e Consulta, que não dão ciente, não veem o aviso.

### RF-14. Aviso por e-mail
1. **Dado** o e-mail corporativo configurado, **quando** um item passa para `CRITICO` ou `ZERADO`, **então** o sistema envia um e-mail com o código, a descrição, o saldo, o mínimo e o link do item.
2. **Dado** um item que já teve aviso enviado para `CRITICO`, **quando** o saldo cai mais uma unidade e continua `CRITICO`, **então** nenhum e-mail novo é enviado. Se passar para `ZERADO`, um novo aviso sai.
3. **Dado** uma falha no envio, **quando** ela acontece, **então** a movimentação não é desfeita, e a falha fica registrada para o Administrador ver.

### RF-15. Histórico de movimentações
1. **Dado** o filtro de setembro e o item X, **quando** aplicado, **então** aparecem todas as movimentações do item no mês, em ordem cronológica, com usuário, saldo anterior e posterior.
2. **Dado** qualquer movimentação, **quando** o usuário abre o detalhe, **então** vê todos os campos gravados, inclusive IP, dispositivo, OP, colaborador e, se for o caso, o estorno ligado a ela.
3. **Dado** a OP 2026-0457, o item PST-001 e o colaborador Juliana Martins, matrícula 1045, **quando** o usuário busca "20260457", "pst1", "juliana" ou "1045" no campo "Item, OP ou colaborador", **então** as movimentações correspondentes aparecem (RF-11). O filtro de usuário acha "joao silva" como joao.silva.

### RF-16. Painel geral
1. **Dado** o acesso ao sistema, **quando** o usuário abre o painel, **então** vê a quantidade de itens em cada status, os alertas abertos, o consumo do mês comparado ao mês anterior, os 10 itens mais consumidos e as últimas movimentações.
2. **Dado** um celular de 360 px de largura, **quando** o painel abre, **então** tudo pode ser lido sem rolagem horizontal.

### RF-17. Relatório de consumo
1. **Dado** um período e um agrupamento (item, destino ou colaborador), **quando** o Gestor gera o relatório, **então** vê as quantidades consumidas, sem contar as saídas estornadas, e o consumo médio diário de cada item.

### RF-18. Relatório de movimentação
1. **Dado** um período, **quando** o Gestor gera o relatório, **então** vê para cada item o saldo inicial, as entradas, as saídas e o saldo final, e o saldo final bate com o saldo atual quando o período termina hoje.

### RF-19. Necessidade de reposição
1. **Dado** o exemplo da RN-20 (saldo 35, ponto de reposição 41, consumo de 3 por dia, caixas de 10), **quando** o relatório é gerado, **então** a sugestão para o item é de 100 unidades.
2. **Dado** um item inativo ou com status `OK`, **quando** o relatório é gerado, **então** ele não aparece.
3. **Dado** um item na lista, **quando** o Gestor olha a linha, **então** vê a quantidade sugerida, o fornecedor preferencial, o de menor último preço e o lead time de cada um.

### RF-20. Exportar relatórios
1. **Dado** os relatórios, a lista de itens ou o histórico de movimentações com filtros aplicados, **quando** o usuário clica em "Exportar CSV", **então** recebe um arquivo `sicei-<tela>-<data>.csv` com as mesmas linhas da tela.
2. **Dado** qualquer exportação, **quando** o arquivo é gerado, **então** a exportação fica no log com o usuário, os filtros e o número de linhas (RN-23). Preços só saem para quem pode vê-los (RN-05b).
3. **Dado** um relatório na tela, **quando** o usuário escolhe "Imprimir / PDF", **então** o navegador gera o PDF sem o menu e sem os botões.

### RF-21. Log de auditoria
1. **Dado** o Administrador ou o Gestor, **quando** filtra o log por usuário, ação e período, **então** vê os registros com valor anterior, valor novo, data, IP e dispositivo.
2. **Dado** qualquer perfil, inclusive o Administrador, **quando** procura um jeito de editar ou apagar um registro do log, **então** essa função não existe no sistema.
3. **Dado** um registro alterado direto no banco de dados, **quando** a verificação de integridade roda, **então** o sistema aponta o ponto exato onde a cadeia foi quebrada.
4. **Dado** a conferência de saldo, **quando** roda, **então** compara o saldo de cada item com a soma das movimentações e lista as divergências, ou informa que não há nenhuma.
5. **Dado** o filtro de ação, **quando** o Administrador ou o Gestor abre a lista, **então** vê todas as ações que o sistema grava, com nome legível e agrupadas (movimentações, itens e etiquetas, cadastros, usuários e acesso, sistema). A escolha filtra a ação exata.
6. **Dado** a lista do log, **quando** o Administrador olha uma linha, **então** vê de forma resumida só o que mudou (antes riscado, depois destacado), a origem com IP e dispositivo e o hash encurtado do registro.
7. **Dado** a verificação de integridade, **quando** o Administrador a executa, **então** a própria execução e o resultado entram no log, com hora e usuário mostrados na tela.
8. **Dado** o filtro de usuário do log, **quando** o Administrador digita, **então** o campo sugere os logins existentes, e "joao silva" ou "JOÃO" acham joao.silva.

### RF-22. Etiquetas QR
1. **Dado** uma ou mais posições ocupadas, **quando** o almoxarife pede a impressão, **então** o sistema gera uma página de etiquetas com QR, código da posição, código interno e descrição, pronta para imprimir em A4.
2. **Dado** uma etiqueta impressa, **quando** alguém lê o QR com a câmera do celular estando logado, **então** a página do item abre, com o botão de registrar saída à mão.
3. **Dado** alguém sem login, **quando** lê o QR, **então** cai na tela de login e, depois de entrar, vai para o item.
4. **Dado** o almoxarife logado num celular Android ou iPhone, **quando** toca em "Ler QR", **então** a câmera traseira abre dentro do SICEI e, ao enquadrar a etiqueta, a página do item abre sozinha, sem outro aplicativo.
5. **Dado** um QR que não é etiqueta do SICEI (por exemplo, o de uma nota fiscal), **quando** a câmera o lê, **então** a tela avisa e continua lendo, sem abrir nada. Um QR de outro site nunca leva o usuário para fora do SICEI: o sistema usa só o código da posição.
6. **Dado** a câmera negada, ausente ou em uso por outro aplicativo, **quando** a tela "Ler QR" abre, **então** explica o motivo, oferece tentar de novo e deixa digitar o código da posição.
7. **Dado** a leitura pela câmera, **quando** ela acontece, **então** a imagem é analisada só no aparelho; nenhuma imagem da câmera vai para o servidor.
8. **Dado** um item que mudou para a posição A05-G01-C02, **quando** alguém abre o item, **então** vê o aviso de que a etiqueta dessa posição ainda não foi impressa, com o botão "Imprimir etiqueta". A tela de etiquetas marca as não impressas e já as deixa escolhidas. Mandar imprimir tira a pendência e grava a impressão no log.
9. **Dado** a tela "Ler QR" ou o endereço `/p/…`, **quando** o almoxarife digita "a1g3c4", **então** o sistema abre a posição A01-G03-C04 (RN-25). A lista de etiquetas tem um filtro que aceita a posição ou o item escritos do mesmo jeito ("a4g2c1", "pst7").

### RF-25. Importação inicial
1. **Dado** um CSV no modelo fornecido pelo sistema, **quando** o Administrador importa, **então** o sistema mostra uma prévia com as linhas válidas e os erros de cada linha inválida, antes de gravar qualquer coisa.
2. **Dado** a confirmação da importação, **quando** ela roda, **então** os itens são criados e cada saldo inicial vira um `AJUSTE_POSITIVO` com a justificativa "saldo inicial da implantação". Se qualquer linha falhar na gravação, nada é gravado.
3. **Dado** uma prévia com pelo menos uma linha com erro, **quando** o Administrador olha a tela, **então** o botão de importar fica bloqueado e a tela oferece enviar o arquivo corrigido.
4. **Dado** uma linha com o código "PST1" e o PST-001 já cadastrado (ou em outra linha do arquivo), **quando** a prévia é gerada, **então** a linha aponta que é o mesmo código (RN-01). Uma posição escrita "a1g3c4" entra como A01-G03-C04.

### RF-26. Parâmetros do sistema
1. **Dado** o Administrador, **quando** muda a janela de consumo médio de 90 para 60 dias, **então** os pontos de reposição e as sugestões passam a usar 60 dias, e a mudança fica no log.
2. **Dado** uma janela fora de 1 a 365 dias ou uma sessão fora de 5 a 480 minutos, **quando** o Administrador digita, **então** a tela avisa o limite e não deixa salvar. O servidor recusa do mesmo jeito.
3. **Dado** alterações anteriores, **quando** o Administrador abre os parâmetros, **então** vê as últimas alterações (antes → depois, quem e quando), lidas do log.

### RF-27. Cadastro de colaboradores
1. **Dado** o Gestor, **quando** cadastra um colaborador com nome e setor, **então** ele passa a aparecer na lista de "quem retirou" das saídas. A matrícula é opcional, mas, se informada, não pode se repetir.
2. **Dado** um colaborador com saídas registradas, **quando** o Gestor tenta excluí-lo, **então** só a inativação é oferecida.

### RF-28. Cadastro de posições
1. **Dado** o Gestor, **quando** cadastra o armário 1, gaveta 3, compartimento 4, **então** a posição recebe o código `A01-G03-C04`, e esse código não pode se repetir.
2. **Dado** uma posição já ocupada, **quando** o Gestor tenta colocar outro item nela, **então** a ação é recusada.
3. **Dado** um item na posição `A01-G03-C04`, **quando** o Gestor o move para `A02-G01-C01`, **então** a posição antiga fica livre, a nova fica ocupada, a mudança vai para o log e o sistema avisa que a etiqueta precisa ser reimpressa.

## 4. Requisitos não funcionais

| ID | Categoria | Requisito | Como medir |
|---|---|---|---|
| RNF-01 | Usabilidade | Interface em português, simples o bastante para um almoxarife novo usar sem treinamento formal. Registrar uma saída a partir do QR leva uma única tela. | Teste com usuários; contagem de passos |
| RNF-02 | Compatibilidade | Funciona em computador e celular (a partir de 360 px de largura), nas versões atuais de Chrome, Edge, Firefox e Safari. | Testes em viewport de 360 px e 1366 px |
| RNF-03 | Desempenho | Consulta de saldo e listagens respondem em menos de 2 s (p95), com 30 usuários, até 5 mil itens e 1 milhão de movimentações. | Teste de carga com massa sintética |
| RNF-04 | Confiabilidade | O saldo é sempre consistente: cada movimentação é uma transação completa, ou grava tudo ou não grava nada. Backup automático diário, guardado por 30 dias, com restauração testada. | Testes de concorrência; teste de restauração documentado |
| RNF-05 | Segurança | HTTPS obrigatório. Senhas guardadas com hash forte (Argon2id), nunca em texto. Toda permissão conferida no servidor. Proteção contra as falhas do OWASP Top 10 (injeção, XSS, CSRF, controle de acesso quebrado etc.). Sessão com expiração. Limite de tentativas de login por IP. | Revisão de segurança e testes automatizados |
| RNF-06 | Privacidade (LGPD) | Só os dados pessoais necessários: nome, sobrenome e setor dos usuários; nome, setor e matrícula dos colaboradores. Nenhum e-mail pessoal. A finalidade do tratamento fica documentada. | Revisão do modelo de dados |
| RNF-07 | Custo | Baixo custo de implantação e manutenção: até cerca de R$ 100 por mês em nuvem, ou um servidor local. Nenhuma licença paga obrigatória. | Estimativa de custos no doc 03 |
| RNF-08 | Manutenibilidade | Código versionado no Git, integração contínua e documentação atualizada. Toda regra de negócio tem pelo menos um teste unitário, e a camada de domínio tem pelo menos 90% de cobertura de linhas. Código novo só entra junto com os testes dele. | Relatório de cobertura; pipeline de CI |
| RNF-10 | Acessibilidade | Contraste e navegação por teclado nas telas principais conforme WCAG 2.1 AA. O status do item não depende só de cor: sempre tem texto junto. | Verificação automática e manual |
| RNF-11 | Observabilidade | Logs técnicos estruturados de erros e acessos, separados do log de auditoria do negócio. | Revisão da configuração |
| RNF-12 | Retenção | Movimentações, histórico de preços e log de auditoria guardados por 7 anos (RN-24), sem prejudicar o desempenho do RNF-03. | Teste de carga com volume de 7 anos |
| RNF-13 | Testes demonstráveis pelo avaliador | Toda parte do sistema que pode ter teste unitário tem teste unitário. O avaliador acessa pela web, sem instalar nada e sem login, uma página onde pode: (1) **executar** os testes das regras de negócio no próprio navegador e ver o resultado de cada um; (2) **criar os próprios casos de teste**, informando entradas e resultado esperado; (3) ver o relatório completo da suíte, com a cobertura. Cada teste leva no nome a regra (RN) ou o requisito (RF) que verifica. | Página `/testes` no endereço do sistema, atualizada a cada versão publicada |

O RNF-09 (interoperabilidade com ERP) saiu junto com os RF-23 e RF-24.

## 5. Matriz de permissões

✅ pode · 👁️ só consulta · ❌ sem acesso

| Funcionalidade | Administrador | Gestor | Almoxarife | Consulta |
|---|---|---|---|---|
| Gerir usuários, senhas e bloqueios (RF-02) | ✅ | ❌ | ❌ | ❌ |
| Parâmetros do sistema (RF-26) | ✅ | ❌ | ❌ | ❌ |
| Importação inicial (RF-25) | ✅ | ❌ | ❌ | ❌ |
| Cadastros de pastilhas, fabricantes, fornecedores, destinos, colaboradores e posições (RF-03 a RF-06, RF-27, RF-28) | ✅ | ✅ | 👁️ | 👁️ |
| Preços e histórico de preços (RF-05a) | ✅ | ✅ | 👁️ | ❌ |
| Mínimo e máximo (RF-12) | ✅ | ✅ | 👁️ | 👁️ |
| Registrar entrada e saída (RF-07, RF-08) | ✅ | ✅ | ✅ | ❌ |
| Estorno (RF-09) | ✅ | ✅ | ❌ | ❌ |
| Inventário e ajuste (RF-10) | ✅ | ✅ | ❌ | ❌ |
| Saldo e painel (RF-11, RF-16) | ✅ | ✅ | ✅ | ✅ |
| Alertas (RF-13) | ✅ | ✅ (marca ciente) | 👁️ | 👁️ |
| Histórico de movimentações (RF-15) | ✅ | ✅ | ✅ | ❌ |
| Relatórios e exportação (RF-17 a RF-20) | ✅ | ✅ | ❌ | ❌ |
| Log de auditoria e conferências (RF-21) | ✅ | ✅ | ❌ | ❌ |
| Imprimir etiquetas QR (RF-22) | ✅ | ✅ | ✅ | ❌ |

## 6. Rastreabilidade

### Regras → requisitos

Toda regra de negócio está coberta por pelo menos um requisito.

| Regra | Requisitos |
|---|---|
| RN-01 | RF-03 |
| RN-02 | RF-02, RF-03, RF-04, RF-05, RF-06, RF-27, RF-28 |
| RN-03 | RF-03, RF-07, RF-08, RF-19 |
| RN-04 | RF-04, RF-05, RF-27 |
| RN-05 | RF-05 |
| RN-05a | RF-05a, RF-07, RF-09 |
| RN-05b | RF-05a |
| RN-06 | RF-07, RF-08, RF-11, RF-25 |
| RN-07 | RF-07, RF-08 |
| RN-08 | RF-08, RF-09 |
| RN-09 | RF-07, RF-08, RF-09, RF-10, RF-15, RF-18, RF-21, RF-25 |
| RN-09a | RF-21 |
| RN-09b | RF-21 |
| RN-10 | RF-07 |
| RN-11 | RF-06, RF-07, RF-08, RF-27 |
| RN-12 | RF-09 |
| RN-13 | RF-10 |
| RN-14 | RF-12 |
| RN-15 | RF-11, RF-19 |
| RN-16 | RF-17, RF-19, RF-26 |
| RN-17 | RF-11, RF-16 |
| RN-18 | RF-13 |
| RN-19 | RF-13, RF-14, RF-26 |
| RN-20 | RF-19 |
| RN-21, RN-21a, RN-21b | RF-01, RF-02 |
| RN-22 | RF-01, RF-02, RF-26 |
| RN-23 | RF-20, RF-21 |
| RN-24 | RF-21, RNF-12 |
| RN-25 | RF-11, RF-28 |
| RN-26 | RF-22 |

### Demanda da DDA → requisitos

Conferência de que cada ponto da demanda original tem requisito correspondente.

| Pedido da demanda | Onde está coberto |
|---|---|
| Automatizar o controle do estoque de pastilhas | RF-07, RF-08, RF-11, RN-06 |
| Reduzir erros de registros manuais | RN-07, RN-08, RN-12, RF-21 (conferência de saldo) |
| Acompanhar as quantidades disponíveis | RF-11, RF-16 |
| Agilizar entrada e saída de materiais | RF-07, RF-08, RF-22, RNF-01 |
| Alertas quando o item atingir o mínimo | RF-13, RF-14, RN-17, RN-18 |
| Ajudar no planejamento das compras | RF-19, RF-05a, RN-15, RN-20 |
| Histórico de movimentações | RF-15, RF-21 |
| Relatórios de consumo, movimentação e reposição | RF-17, RF-18, RF-19, RF-20 |
| Melhor controle dos recursos usados na produção | RF-06, RF-17, RF-27 (consumo por destino, OP e colaborador) |
| Cadastro de tipos de pastilhas | RF-03 |
| Cadastro de fabricantes e fornecedores | RF-04, RF-05 |
| Identificação por código ou descrição | RF-03, RF-22 |
| Estoque mínimo configurável por item | RF-12, RN-14 |
| Painel de acompanhamento | RF-16 |
| Interface simples e intuitiva | RNF-01, RNF-10 |
| Baixo custo de implantação e manutenção | RNF-07 |
| Computador e celular | RNF-02 |
| Armazenamento seguro | RNF-04, RNF-05, RN-09a |
| Controle de acesso com autenticação | RF-01, RF-02, RN-21 a RN-22 |
| Integração futura com ERP, compras e produção | Fora do escopo (trabalho acadêmico; opcional na demanda) |

## 7. Escopo do MVP

O MVP inclui todos os requisitos **Must** e todos os RNF. Os **Should** (RF-10 inventário e RF-20 exportação) entram se o prazo permitir.

## 8. Histórico do documento

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 25/09/2026 | Primeira versão. |
| 1.0 | 25/09/2026 | RF-23, RF-24 e RNF-09 fora do escopo. Novos RF-27 (colaboradores) e RF-28 (posições). RF-14, RF-22 e RF-25 passam a Must. RF-02 reescrito com login e senha gerados pelo sistema. Saída com OP e colaborador, NF obrigatória, relatórios só em quantidade. |
| 1.1 | 26/09/2026 | Novo RNF-13: testes unitários em todo o sistema, executáveis pelo avaliador na web, com criação de casos próprios. RNF-08 com meta de 90% no domínio. |
| 1.2 | 27/09/2026 | O projeto passa a se chamar SICEI (Sistema Inteligente de Controle de Estoques Industriais), antes SIMI. Nenhum requisito mudou. |
| 1.3 | 27/09/2026 | Critérios novos com o redesign da interface: prévia do login (RF-02), fornecedor cadastrado na hora da compra (RF-07), aviso de saldo antes de enviar e confirmação da saída (RF-08), critérios do RF-20 (CSV de itens e movimentações, log da exportação), resumo do log e registro da verificação (RF-21), importação bloqueada com erro (RF-25), limites e histórico dos parâmetros (RF-26). Nenhum requisito novo nem removido. |
| 1.4 | 27/09/2026 | RF-22: leitura do QR dentro do SICEI com a câmera de qualquer celular (critérios 4 a 7). |
| 1.5 | 27/09/2026 | Critérios novos: RF-03 (próximo código, fabricante e fornecedor cadastrados na hora, aba Itens em Cadastros), RF-13 (pop-up de alertas sem ciente ao entrar), RF-21 (filtro com todas as ações), RF-22 (etiqueta pendente ao mudar de posição). |
| 1.6 | 27/09/2026 | RF-13, critério 5: o pop-up aparece só no login; depois de VER não volta até o próximo login, e ver os alertas não obriga a dar ciente. |
| 1.7 | 27/09/2026 | RF-11, critério 4: busca que aceita o código escrito de qualquer jeito. RF-08, critério 9: autocompletar na escolha do item ao registrar. |
| 1.8 | 27/09/2026 | A mesma tolerância em todos os campos que permitem: RF-11 (sugestões na busca do topo, campos de escolha com busca), RF-03 (código equivalente e padronizado), RF-15 e RF-21 (filtros de texto), RF-22 (posição digitada e filtro de etiquetas), RF-25 (código e posição na planilha). |
