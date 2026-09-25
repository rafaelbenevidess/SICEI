# SIMI: Requisitos

| | |
|---|---|
| **Projeto** | SIMI, controle de estoque de pastilhas industriais |
| **Documento** | 02, Requisitos |
| **Versão** | 0.1 (rascunho, aguardando validação da DDA) |
| **Base** | [01, Regras de Negócio](01-regras-de-negocio.md) |

Este documento lista o que o SIMI precisa fazer (requisitos funcionais, RF) e como ele precisa se comportar (requisitos não funcionais, RNF). As regras de negócio citadas (RN-xx) estão no documento 01.

## 1. Priorização

Os requisitos estão classificados pelo método MoSCoW:

- **Must:** sem isso a primeira versão não resolve o problema. É o MVP.
- **Should:** importante, entra na V1 se o prazo permitir, ou logo na sequência.
- **Could:** desejável, fica para depois do MVP.
- **Won't (V1):** fora da primeira versão, mas a arquitetura precisa deixar o caminho aberto.

## 2. Requisitos funcionais

| ID | Requisito | Prioridade | Regras |
|---|---|---|---|
| RF-01 | Autenticação com login interno: entrar, sair, troca obrigatória da senha provisória, bloqueio após tentativas sem sucesso | Must | RN-21, RN-21a, RN-22 |
| RF-02 | Gestão de usuários pelo Administrador: criar, gerar senha provisória, redefinir senha, desbloquear, inativar, definir perfil | Must | RN-02, RN-21, RN-21a, RN-21b, RN-22 |
| RF-03 | Cadastro de pastilhas, com inativação e busca por código, descrição, ISO ou classe | Must | RN-01, RN-02, RN-03 |
| RF-04 | Cadastro de fabricantes | Must | RN-02, RN-04 |
| RF-05 | Cadastro de fornecedores e vínculo item ↔ fornecedor (vários por item, com código no fornecedor, lead time e preferencial) | Must | RN-02, RN-04, RN-05 |
| RF-05a | Consulta do item com lista de fornecedores, último preço de cada um e histórico de preços ao expandir | Must | RN-05a, RN-05b |
| RF-06 | Cadastro de destinos (setor, máquina, centro de custo) | Must | RN-02, RN-11 |
| RF-07 | Registrar entrada (compra, devolução da produção) | Must | RN-03, RN-05a, RN-06, RN-07, RN-09, RN-10 |
| RF-08 | Registrar saída (consumo da produção, perda ou quebra) | Must | RN-03, RN-06, RN-07, RN-08, RN-09, RN-11 |
| RF-09 | Estornar movimentação | Must | RN-05a, RN-08, RN-09, RN-12 |
| RF-10 | Inventário e ajuste de estoque | Should | RN-09, RN-13 |
| RF-11 | Consulta de saldo em tempo real, com status, localização e filtros | Must | RN-06, RN-15, RN-17 |
| RF-12 | Configurar estoque mínimo e máximo por item | Must | RN-14 |
| RF-13 | Alertas no sistema: painel e contador de alertas abertos | Must | RN-18, RN-19 |
| RF-14 | Notificação externa de alertas por e-mail corporativo, configurável | Could | RN-19 |
| RF-15 | Histórico de movimentações com filtros por período, item, tipo, usuário e destino | Must | RN-09 |
| RF-16 | Painel geral: itens em alerta, consumo do mês, itens mais consumidos, últimas movimentações | Must | RN-17 |
| RF-17 | Relatório de consumo por item, destino e período | Must | RN-16 |
| RF-18 | Relatório de movimentação | Must | RN-09 |
| RF-19 | Relatório de necessidade de reposição (sugestão de compra) | Must | RN-03, RN-15, RN-16, RN-20 |
| RF-20 | Exportar relatórios em CSV e PDF | Should | RN-23 |
| RF-21 | Log de auditoria consultável, verificação de integridade e conferência de saldo | Must | RN-09, RN-09a, RN-09b, RN-23, RN-24 |
| RF-22 | Localizar item lendo código de barras ou QR com a câmera do celular | Could | — |
| RF-23 | API REST documentada para integrações | Could | — |
| RF-24 | Integração com ERP, compras ou controle de produção | Won't (V1) | — |
| RF-25 | Importação inicial da planilha atual (itens e saldo) por CSV | Should | RN-06, RN-09 |
| RF-26 | Parâmetros do sistema: janela do consumo médio (N dias), tempo de sessão, notificações | Must | RN-16, RN-19, RN-22 |

## 3. Critérios de aceite dos requisitos Must

Os critérios estão no formato **Dado / Quando / Então** e viram casos de teste na etapa de QA.

### RF-01. Autenticação
1. **Dado** um usuário ativo com senha correta, **quando** ele entra com login interno e senha, **então** acessa o sistema com as permissões do seu perfil, e o login fica no log.
2. **Dado** um usuário com senha provisória, **quando** ele entra, **então** é levado direto à troca de senha e não acessa nenhuma outra tela antes de concluir.
3. **Dado** um usuário que errou a senha 4 vezes seguidas, **quando** erra a quinta, **então** a conta é bloqueada, a mensagem orienta a procurar o Administrador e o bloqueio fica no log.
4. **Dado** um login inexistente ou uma senha errada, **quando** o usuário tenta entrar, **então** a mensagem é a mesma nos dois casos, para não revelar quais logins existem.
5. **Dado** uma nova senha com menos de 10 caracteres, igual ao login ou igual a uma das 3 últimas, **quando** o usuário tenta salvar, **então** a troca é recusada com o motivo.

### RF-02. Gestão de usuários
1. **Dado** o Administrador, **quando** cria um usuário com nome, login, setor e perfil, **então** o sistema gera e mostra uma senha provisória uma única vez, e a criação fica no log.
2. **Dado** um login que já existe ou já existiu, **quando** o Administrador tenta usá-lo de novo, **então** o cadastro é recusado.
3. **Dado** um usuário com sessão aberta, **quando** o Administrador inativa a conta, **então** a sessão é encerrada imediatamente e o usuário não consegue mais entrar.
4. **Dado** um usuário bloqueado ou que esqueceu a senha, **quando** o Administrador redefine a senha, **então** uma nova senha provisória é gerada, a conta é desbloqueada, a troca volta a ser obrigatória e tudo fica no log.
5. **Dado** um usuário que não é Administrador, **quando** tenta acessar a gestão de usuários, **então** o acesso é negado pelo servidor, e não só escondido na tela.

### RF-03. Cadastro de pastilhas
1. **Dado** um código interno já usado, **quando** o Gestor tenta cadastrar outro item com ele, **então** o cadastro é recusado.
2. **Dado** um item com movimentação, **quando** o Gestor tenta alterar o código interno, **então** o campo está bloqueado.
3. **Dado** um item com saldo maior que zero, **quando** o Gestor tenta inativá-lo, **então** a inativação é recusada e o sistema mostra o saldo.
4. **Dado** o termo "120408", **quando** o usuário busca, **então** aparecem todos os itens com esse trecho no código, na descrição ou na ISO.
5. **Dado** um item novo, **quando** o Gestor tenta salvar sem fabricante, estoque mínimo ou pelo menos um fornecedor, **então** o sistema pede os campos faltantes.

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
4. **Dado** o perfil Consulta, **quando** abre o item, **então** vê os fornecedores, mas sem os preços. Essa restrição ainda precisa ser confirmada com a DDA.

### RF-06. Cadastro de destinos
1. **Dado** um destino usado em saídas, **quando** o Gestor tenta excluí-lo, **então** só a inativação é oferecida.
2. **Dado** um destino inativo, **quando** o almoxarife registra uma saída, **então** esse destino não aparece na lista.

### RF-07. Registrar entrada
1. **Dado** um item ativo e um fornecedor vinculado, **quando** o almoxarife lança uma `COMPRA` de 3 caixas de 10 a R$ 38,90, **então** o saldo sobe 30 unidades, o preço entra no histórico do fornecedor e o registro guarda saldo anterior, saldo posterior, usuário, data, IP e dispositivo.
2. **Dado** uma `COMPRA` sem preço unitário ou com fornecedor não vinculado ao item, **quando** o almoxarife tenta salvar, **então** o lançamento é recusado.
3. **Dado** um item inativo, **quando** alguém tenta lançar entrada, **então** o lançamento é recusado.
4. **Dado** uma quantidade zero, negativa ou fracionada, **quando** alguém tenta lançar, **então** o lançamento é recusado.

### RF-08. Registrar saída
1. **Dado** um item com saldo 12, **quando** o almoxarife lança um `CONSUMO_PRODUCAO` de 4 unidades para o torno CNC 03, **então** o saldo passa a 8 e o status é recalculado.
2. **Dado** um item com saldo 3, **quando** alguém tenta tirar 5, **então** a saída é recusada com a mensagem "saldo disponível: 3".
3. **Dado** um item com saldo 5 e duas saídas de 4 enviadas ao mesmo tempo, **quando** o sistema processa, **então** uma é aceita e a outra recusada, e o saldo final é 1, nunca −3.
4. **Dado** um `CONSUMO_PRODUCAO` sem destino ou uma `PERDA_QUEBRA` sem motivo, **quando** alguém tenta salvar, **então** o lançamento é recusado.
5. **Dado** um almoxarife no celular com o item aberto, **quando** registra a saída, **então** precisa de no máximo 3 toques (quantidade, destino, confirmar).

### RF-09. Estornar movimentação
1. **Dado** uma saída de 4 unidades lançada por engano, **quando** o Gestor estorna com justificativa, **então** o saldo volta a subir 4, o estorno aponta para a saída original e ela aparece marcada como estornada.
2. **Dado** uma movimentação já estornada, **quando** alguém tenta estorná-la de novo, **então** a ação é recusada. Um estorno também não pode ser estornado.
3. **Dado** uma entrada de 30 unidades cujo item hoje tem saldo 10, **quando** o Gestor tenta estorná-la, **então** a ação é recusada, porque o saldo ficaria negativo.
4. **Dado** o perfil Almoxarife, **quando** tenta estornar, **então** a ação é negada.

### RF-11. Consulta de saldo
1. **Dado** qualquer perfil, **quando** abre a lista de itens, **então** vê código, descrição, saldo, mínimo, ponto de reposição, status (com cor e texto) e localização.
2. **Dado** uma saída registrada por outro usuário, **quando** a consulta é aberta ou atualizada, **então** o saldo já reflete a saída.
3. **Dado** o filtro "somente críticos e zerados", **quando** aplicado, **então** só aparecem itens com esses status.

### RF-12. Estoque mínimo e máximo
1. **Dado** um máximo menor ou igual ao mínimo, **quando** o Gestor tenta salvar, **então** a alteração é recusada.
2. **Dado** uma alteração do mínimo de 20 para 30, **quando** salva, **então** o status do item é recalculado na hora e o log registra "20 → 30", quem mudou e quando.

### RF-13. Alertas no sistema
1. **Dado** um item com saldo 42 e ponto de reposição 41, **quando** sai 1 unidade, **então** abre um alerta `ATENCAO` e o contador no topo aumenta.
2. **Dado** um alerta `ATENCAO` aberto, **quando** o saldo cai abaixo do mínimo, **então** o mesmo alerta sobe para `CRITICO` e nenhum alerta novo é criado.
3. **Dado** um alerta aberto, **quando** uma compra leva o saldo acima do ponto de reposição, **então** o alerta fecha sozinho.
4. **Dado** um alerta aberto, **quando** o Gestor marca como ciente, **então** ele continua aberto, mas aparece identificado com quem marcou e quando.

### RF-15. Histórico de movimentações
1. **Dado** o filtro de setembro e o item X, **quando** aplicado, **então** aparecem todas as movimentações do item no mês, em ordem cronológica, com usuário, saldo anterior e posterior.
2. **Dado** qualquer movimentação, **quando** o usuário abre o detalhe, **então** vê todos os campos gravados, inclusive IP, dispositivo e, se for o caso, o estorno ligado a ela.

### RF-16. Painel geral
1. **Dado** o acesso ao sistema, **quando** o usuário abre o painel, **então** vê a quantidade de itens em cada status, os alertas abertos, o consumo do mês comparado ao mês anterior, os 10 itens mais consumidos e as últimas movimentações.
2. **Dado** um celular de 360 px de largura, **quando** o painel abre, **então** tudo pode ser lido sem rolagem horizontal.

### RF-17. Relatório de consumo
1. **Dado** um período e um agrupamento (item ou destino), **quando** o Gestor gera o relatório, **então** vê as quantidades consumidas, sem contar as saídas estornadas, e o consumo médio diário de cada item.

### RF-18. Relatório de movimentação
1. **Dado** um período, **quando** o Gestor gera o relatório, **então** vê para cada item o saldo inicial, as entradas, as saídas e o saldo final, e o saldo final bate com o saldo atual quando o período termina hoje.

### RF-19. Necessidade de reposição
1. **Dado** o exemplo da RN-20 (saldo 35, ponto de reposição 41, consumo de 3 por dia, caixas de 10), **quando** o relatório é gerado, **então** a sugestão para o item é de 100 unidades.
2. **Dado** um item inativo ou com status `OK`, **quando** o relatório é gerado, **então** ele não aparece.
3. **Dado** um item na lista, **quando** o Gestor olha a linha, **então** vê o fornecedor preferencial, o de menor último preço, o lead time e o custo estimado.

### RF-21. Log de auditoria
1. **Dado** o Administrador ou o Gestor, **quando** filtra o log por usuário, ação e período, **então** vê os registros com valor anterior, valor novo, data, IP e dispositivo.
2. **Dado** qualquer perfil, inclusive o Administrador, **quando** procura um jeito de editar ou apagar um registro do log, **então** essa função não existe na tela nem na API.
3. **Dado** um registro alterado direto no banco de dados, **quando** a verificação de integridade roda, **então** o sistema aponta o ponto exato onde a cadeia foi quebrada.
4. **Dado** a conferência de saldo, **quando** roda, **então** compara o saldo de cada item com a soma das movimentações e lista as divergências, ou informa que não há nenhuma.

### RF-26. Parâmetros do sistema
1. **Dado** o Administrador, **quando** muda a janela de consumo médio de 90 para 60 dias, **então** os pontos de reposição e as sugestões passam a usar 60 dias, e a mudança fica no log.

## 4. Requisitos não funcionais

| ID | Categoria | Requisito | Como medir |
|---|---|---|---|
| RNF-01 | Usabilidade | Interface em português, simples o bastante para um almoxarife novo usar sem treinamento formal. Registrar uma saída leva no máximo 3 toques depois de encontrar o item. | Teste com usuário real da DDA; contagem de passos |
| RNF-02 | Compatibilidade | Funciona em computador e celular (a partir de 360 px de largura), nas versões atuais de Chrome, Edge, Firefox e Safari. | Testes em viewport de 360 px e 1366 px |
| RNF-03 | Desempenho | Consulta de saldo e listagens respondem em menos de 2 s (p95), com até 5 mil itens e 1 milhão de movimentações. | Teste de carga com massa sintética |
| RNF-04 | Confiabilidade | O saldo é sempre consistente: cada movimentação é uma transação completa, ou grava tudo ou não grava nada. Backup automático diário, guardado por 30 dias, com teste de restauração a cada 3 meses. | Testes de concorrência; registro dos testes de restauração |
| RNF-05 | Segurança | HTTPS obrigatório. Senhas guardadas com hash forte (Argon2id ou bcrypt), nunca em texto. Toda permissão conferida no servidor. Proteção contra as falhas do OWASP Top 10 (injeção, XSS, CSRF, controle de acesso quebrado etc.). Sessão com expiração. Limite de tentativas de login por IP. | Revisão de segurança e testes automatizados na etapa de QA |
| RNF-06 | Privacidade (LGPD) | Só os dados pessoais necessários: nome, login interno (matrícula) e setor. Nenhum e-mail pessoal. A finalidade do tratamento fica documentada. | Revisão do modelo de dados |
| RNF-07 | Custo | Baixo custo de implantação e manutenção: até cerca de R$ 100 por mês em nuvem, ou um servidor local da DDA. Nenhuma licença paga obrigatória. | Estimativa de custos na etapa de design |
| RNF-08 | Manutenibilidade | Código versionado no Git, regras de negócio cobertas por testes automatizados (pelo menos 80% de cobertura na camada de domínio), integração contínua e documentação atualizada. | Relatório de cobertura; pipeline de CI |
| RNF-09 | Integração futura | IDs estáveis, API documentada no padrão OpenAPI e exportação em CSV, para facilitar a ligação futura com ERP, compras e produção. | Revisão da arquitetura |
| RNF-10 | Acessibilidade | Contraste e navegação por teclado nas telas principais conforme WCAG 2.1 AA. O status do item não depende só de cor: sempre tem texto junto. | Verificação automática e manual |
| RNF-11 | Observabilidade | Logs técnicos estruturados de erros e acessos, separados do log de auditoria do negócio. | Revisão da configuração |
| RNF-12 | Retenção | Movimentações, histórico de preços e log de auditoria guardados por 7 anos (RN-24), sem prejudicar o desempenho do RNF-03. | Teste de carga com volume de 7 anos |

## 5. Matriz de permissões

✅ pode · 👁️ só consulta · ❌ sem acesso

| Funcionalidade | Administrador | Gestor | Almoxarife | Consulta |
|---|---|---|---|---|
| Gerir usuários, senhas e bloqueios (RF-02) | ✅ | ❌ | ❌ | ❌ |
| Parâmetros do sistema (RF-26) | ✅ | ❌ | ❌ | ❌ |
| Cadastro de pastilhas, fabricantes, fornecedores, destinos (RF-03 a RF-06) | ✅ | ✅ | 👁️ | 👁️ |
| Preços e histórico de preços (RF-05a) | ✅ | ✅ | 👁️ | ❌ (a confirmar) |
| Mínimo e máximo (RF-12) | ✅ | ✅ | 👁️ | 👁️ |
| Registrar entrada e saída (RF-07, RF-08) | ✅ | ✅ | ✅ | ❌ |
| Estorno (RF-09) | ✅ | ✅ | ❌ | ❌ |
| Inventário e ajuste (RF-10) | ✅ | ✅ | ❌ | ❌ |
| Saldo e painel (RF-11, RF-16) | ✅ | ✅ | ✅ | ✅ |
| Alertas (RF-13) | ✅ | ✅ (marca ciente) | 👁️ | 👁️ |
| Histórico de movimentações (RF-15) | ✅ | ✅ | ✅ | ❌ |
| Relatórios e exportação (RF-17 a RF-20) | ✅ | ✅ | ❌ | ❌ |
| Log de auditoria e conferências (RF-21) | ✅ | ✅ | ❌ | ❌ |
| Importação inicial (RF-25) | ✅ | ❌ | ❌ | ❌ |

## 6. Rastreabilidade

### Regras → requisitos

Toda regra de negócio precisa estar coberta por pelo menos um requisito.

| Regra | Requisitos |
|---|---|
| RN-01 | RF-03 |
| RN-02 | RF-02, RF-03, RF-04, RF-05, RF-06 |
| RN-03 | RF-03, RF-07, RF-08, RF-19 |
| RN-04 | RF-04, RF-05 |
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
| RN-11 | RF-06, RF-08 |
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

### Benefícios esperados pela DDA → requisitos

Conferência de que cada ponto da demanda original tem requisito correspondente.

| Pedido da demanda | Onde está coberto |
|---|---|
| Automatizar o controle do estoque de pastilhas | RF-07, RF-08, RF-11, RN-06 |
| Reduzir erros de registros manuais | RN-07, RN-08, RN-12, RF-21 (conferência de saldo) |
| Acompanhar as quantidades disponíveis | RF-11, RF-16 |
| Agilizar entrada e saída de materiais | RF-07, RF-08, RNF-01 |
| Alertas quando o item atingir o mínimo | RF-13, RF-14, RN-17, RN-18 |
| Ajudar no planejamento das compras | RF-19, RF-05a, RN-15, RN-20 |
| Histórico de movimentações | RF-15, RF-21 |
| Relatórios de consumo, movimentação e reposição | RF-17, RF-18, RF-19, RF-20 |
| Melhor controle dos recursos usados na produção | RF-06, RF-17 (consumo por destino) |
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
| Integração futura com ERP, compras e produção | RF-23, RF-24, RNF-09 |

## 7. Escopo do MVP

A primeira entrega inclui todos os requisitos **Must**: RF-01 a RF-09, RF-05a, RF-11 a RF-13, RF-15 a RF-19, RF-21 e RF-26, além de todos os RNF. Os **Should** (RF-10, RF-20, RF-25) vêm logo em seguida. A importação da planilha (RF-25) precisa estar pronta antes da implantação na DDA, mesmo que fique fora da demonstração do MVP.

## 8. Histórico do documento

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 25/09/2026 | Primeira versão. |
