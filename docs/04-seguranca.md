# SICEI: Segurança

| | |
|---|---|
| **Documento** | 04, Segurança |
| **Versão** | 1.6 |
| **Base** | [03, System Design, seção 6](03-system-design.md#6-segurança) |

## 1. Controles implementados

| Tema | Como o SICEI se protege | Onde está no código |
|---|---|---|
| Autenticação | Login interno gerado pelo sistema, sem e-mail. Senha com Argon2id (parâmetros OWASP). Troca obrigatória da senha provisória. Mensagem única para login ou senha errados, com tempo de resposta equalizado. | `src/server/services/autenticacao.ts`, `src/server/auth/hash.ts` |
| Bloqueio e força bruta | Conta bloqueada na 5ª falha seguida; depois disso a resposta é sempre a mesma, com ou sem a senha certa. Limite de 20 tentativas por IP a cada 15 minutos. | `autenticacao.ts`, `src/domain/senha.ts` |
| Sessão | Token aleatório de 32 bytes; o banco guarda só o SHA-256. Cookie `HttpOnly`, `SameSite=Lax`, `Secure` em produção. Expira por inatividade e em 12 horas. Inativar, redefinir senha, bloquear ou mudar o perfil derruba as sessões na hora; trocar a senha derruba as dos outros aparelhos. | `src/server/auth/sessao.ts` |
| Autorização | Matriz de permissões única (`domain/permissoes.ts`), conferida no servidor em todo service. Cada página e cada Server Action confere a sessão de novo. | `src/server/services/*`, `src/server/web/sessao-atual.ts` |
| Injeção de SQL | Prisma parametrizado; SQL manual só com template marcado (`$queryRaw\`...${x}\``). Não há `$queryRawUnsafe`. | `src/server/consultas/*`, `src/server/estoque.ts` |
| Validação de entrada | Toda entrada passa por schema Zod no servidor. IDs conferidos antes de ir ao banco. | `src/domain/schemas/*`, `src/server/erros.ts` |
| XSS | React escapa a saída. O único `dangerouslySetInnerHTML` é o SVG do QR, gerado no servidor a partir de um código de posição validado. CSP com nonce e `strict-dynamic` nos scripts. | `src/proxy.ts`, `etiquetas/FolhaDeEtiquetas.tsx` |
| CSRF | Server Actions só aceitam a mesma origem; cookie `SameSite=Lax`. | Next.js 16 |
| Cabeçalhos | CSP, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS em produção. | `src/proxy.ts` |
| Redirecionamento | O parâmetro `volta` do login só aceita caminhos internos, sem caracteres de controle. | `src/lib/redirecionamento.ts` |
| IP no log | Grava o IP público da rede, vindo do `X-Real-IP` do proxy da Vercel, que o cliente não controla. É o mesmo para todos os computadores atrás do mesmo roteador; o IP interno do computador não chega ao servidor em nenhum sistema web. O usuário é identificado pelo login e o aparelho pelo navegador gravado junto. | `src/lib/ip.ts` |
| Integridade do histórico | Usuário `sicei_<sigla>_app` sem UPDATE/DELETE em `movimentacao` e `audit_log`; triggers que barram até o dono do banco; log encadeado por SHA-256; verificação que aponta o registro adulterado e a movimentação que não bate com o log. | `prisma/migrations/*regras_do_banco`, `*nomes_sicei`, `src/server/audit/*` |
| Regras no banco | `CHECK` de saldo não negativo, campos obrigatórios por tipo, coerência do saldo; índices únicos parciais. | migration `regras_do_banco` |
| Rotina diária | Aceita só `Authorization: Bearer CRON_SECRET`, comparado em tempo constante. Sem segredo configurado, recusa tudo. | `src/app/api/cron/diario/route.ts` |
| Segredos | Só em variáveis de ambiente; `.env` fora do Git; `.env.example` sem valores reais. A senha provisória nunca vai para banco, log ou auditoria. | `.gitignore`, `usuarios.ts` |
| Erros | Erro inesperado vira mensagem genérica na tela; detalhes só no log técnico do servidor. | `src/server/web/acao.ts` |
| Dependências | `npm audit` sem vulnerabilidades. Dois pacotes internos do CLI do Prisma foram forçados para versões corrigidas (`overrides`). | `package.json` |
| LGPD | Só nome, sobrenome, setor e login dos usuários; nome, setor e matrícula dos colaboradores. Nenhum e-mail pessoal. | `prisma/schema.prisma` |

## 2. Revisão de segurança (26/09/2026)

Foi feita com a skill `security-review`, cobrindo todo o código desde o primeiro commit. Foram conferidos:

- as 25 Server Actions (hoje são 36; as novas estão na seção 5);
- todas as páginas;
- as rotas de CSV, do QR e da rotina diária;
- todo o SQL manual;
- a validação de sessão;
- o único `dangerouslySetInnerHTML`.

**Resultado: nenhuma vulnerabilidade de alta confiança.** Quatro pontos de menor gravidade foram corrigidos no mesmo dia:

| # | Achado | Correção | Teste |
|---|---|---|---|
| 1 | O perfil Consulta via as últimas movimentações na página do item e conseguia deduzir o fornecedor mais barato pela ordem da lista, apesar de a matriz negar histórico e preços. | Histórico só é buscado e mostrado com `historico:ver`. Sem `precos:ver`, os fornecedores ficam em ordem alfabética e sem a data da última compra. | roteiro de aceitação (doc 05) |
| 2 | Conta bloqueada respondia "bloqueada" só com a senha certa, o que permitia continuar testando senhas depois do bloqueio. | A resposta para conta bloqueada é sempre a mesma. | `tests/integracao/usuarios.test.ts` |
| 3 | Trocar a senha não encerrava as sessões em outros aparelhos. | A troca apaga as outras sessões e mantém a atual. | `tests/integracao/usuarios.test.ts` |
| 4 | O parâmetro `volta` aceitava tabulação, e o navegador podia transformar `/\t/site` em `//site`. | Qualquer caractere de controle é recusado. | `src/lib/redirecionamento.test.ts` |

## 3. Revisão de código (26/09/2026)

Feita com a skill `code-review` sobre `src/`, `prisma/`, `scripts/` e `tests/`. Os 8 achados foram corrigidos, cada um com teste:

| # | Achado | Correção | Teste |
|---|---|---|---|
| 1 | Tentativas de login erradas em paralelo sobrescreviam o contador de falhas e a conta nunca bloqueava. | Incremento atômico no banco (`UPDATE ... SET falhas_login = falhas_login + 1 ... RETURNING`); só a tentativa que chega a 5 faz o bloqueio. | integração: 8 falhas em paralelo bloqueiam uma vez |
| 2 | A regra das 3 últimas senhas conferia só 2, porque a atual entrava duas vezes. | A janela passa a ter 3 senhas diferentes. | integração: A → B → C → A recusado; depois de D, A volta a valer |
| 3 | A mesma posição repetida no CSV de importação era aceita, e um item perdia a posição. | A validação recusa posição repetida no arquivo. | unitário em `importacao.test.ts` |
| 4 | Dava para estornar movimentação de item inativo, deixando saldo num item inativo. | `avaliarEstorno` recusa item inativo (RN-03). | unitário, laboratório e integração |
| 5 | Duas execuções do envio de e-mail ao mesmo tempo mandavam o mesmo aviso duas vezes. | Reserva atômica de cada notificação antes de enviar. | integração: duas execuções simultâneas tentam cada aviso uma vez |
| 6 | Vincular fornecedor e mudar limites recalculavam o item sem travá-lo, podendo gravar status com saldo antigo. | `recalcularItem` trava a linha do item antes de ler. | coberto pelos testes de concorrência |
| 7 | O IP vinha do primeiro valor de `X-Forwarded-For`, que o cliente escolhe, burlando o limite por IP e sujando o log. | Vale o `X-Real-IP` do proxy de borda, ou o último valor de `X-Forwarded-For`. | unitário em `ip.test.ts` |
| 8 | Texto começando com `=`, `+`, `-` ou `@` virava fórmula ao abrir o CSV no Excel. | Células de texto nesse formato recebem um apóstrofo na frente. | unitário em `formatar.test.ts` |

## 4. Riscos aceitos

- **Estilos inline no CSP** (`style-src 'unsafe-inline'`): o Next.js e o React usam atributos `style`, que não aceitam nonce. Scripts continuam restritos ao nonce, que é o que barra XSS.
- **Laboratório de testes público** (`/testes`): roda só funções puras no navegador, sem acesso ao banco e sem dados do estoque.
- **Bloqueio proposital de contas**: como os logins seguem o padrão `nome.sobrenome`, alguém pode bloquear a conta de outra pessoa errando a senha 5 vezes. É o preço da regra RN-22, que exige desbloqueio pelo Administrador. O limite por IP reduz o alcance. O principal pode ser desbloqueado por qualquer outro Administrador (RN-21c) e, sem nenhum, pelo script `npm run admin:recuperar` (doc 06).
- **Mensagem de conta bloqueada revela que o login existe**: é exigência do critério 3 do RF-01 (orientar o usuário a procurar o Administrador). A resposta não revela se a senha estava certa.
- **Backup com dados pessoais**: o dump contém nomes e logins, então precisa ficar em local privado (doc 06).

## 5. Revisão do redesign (27/09/2026)

O redesign da interface trouxe portas de entrada novas. Cada uma foi conferida:

| Ponto | Proteção |
|---|---|
| Verificação de integridade virou Server Action (`acaoConferirIntegridade`) | Antes era um GET com `?verificar=1` que gravava no log; um link ou pré-carregamento podia disparar a gravação. Agora só roda por POST, com a sessão conferida de novo e a permissão `auditoria:ver` no service. |
| Fornecedor cadastrado na tela da compra (`acaoFornecedorRapido`) | Exige `cadastros:editar` no service, valida com Zod e grava fornecedor, vínculo e os dois registros de log numa transação só. |
| CSV de itens e de movimentações | Conferem sessão, troca de senha pendente e permissão (`saldo:ver`, `historico:ver`); preço só sai para quem tem `precos:ver`. Na exportação de movimentações, só os filtros conhecidos entram no log (`lib/filtros.ts`), para ninguém gravar texto qualquer no log imutável pela URL. |
| Cookie do tema (`sicei_tema`) | O servidor só aceita `claro` ou `escuro` (`temaDoCookie`). Não guarda nada sensível. |
| Tela "Ler QR" (`/p`) | O código digitado só vira redirecionamento depois de passar por `interpretarCodigoDePosicao`, que devolve um código no formato `A01-G03-C04` ou nada; o texto digitado nunca entra na URL. |
| Câmera na tela "Ler QR" | O cabeçalho `Permissions-Policy` passou de `camera=()` para `camera=(self)`: só o próprio SICEI pode pedir a câmera, e o navegador ainda pergunta ao usuário. A imagem é analisada no aparelho e não é enviada a lugar nenhum. Do texto lido só se aproveita o código da posição (`codigoDoQr`), e a navegação é sempre para a rota interna `/p/<código>`: um QR malicioso não leva o usuário para outro site nem injeta nada na página. |
| Pop-up de alertas | O cookie `sicei_aviso_alertas` é `HttpOnly`, `SameSite=Lax` e dura a sessão; só guarda "1". A contagem é feita no servidor e só para quem tem `alertas:ciente`. | `src/app/acoes/autenticacao.ts`, `(app)/layout.tsx` |
| Cadastro rápido no novo item | Fabricante e fornecedor passam pelos mesmos services do cadastro normal (`cadastros:editar`, Zod, unicidade, log). | `src/app/acoes/cadastros.ts` |
| Registro da impressão de etiquetas | Exige `etiquetas:imprimir`; os códigos passam pelo schema (formato, no máximo 500, sem repetidos) antes de ir ao banco. | `src/server/services/etiquetas.ts` |
| Sugestões da busca do topo (`acaoSugerirItens`) | Só leitura. Confere a sessão e a troca de senha, recusa termo que não seja texto ou passe de 60 caracteres e devolve só código, descrição, posição e status de até 8 itens ativos, o mesmo que a lista de itens mostra a qualquer perfil. Nenhum preço. | `src/app/acoes/estoque.ts` |
| Filtros de texto tolerantes (movimentações e auditoria) | O texto não vai para o SQL: é comparado em memória com a regra do domínio e o banco recebe só a lista de ids ou OPs encontrados, pelo Prisma parametrizado. | `src/server/consultas/busca.ts` |
| Campo de escolha com busca | Envia só o id da opção escolhida; o service confere de novo se o fornecedor, colaborador, destino ou posição existe e está ativo. | `src/components/formulario.tsx` |
| Logo da licenciada no login | SVG desenhado no próprio código, sem arquivo externo nem nova exceção no `proxy.ts`. A escolha vem de uma lista fixa (`LogoDaLicenciada.tsx`), pela variável do servidor; nenhum texto do usuário escolhe o que é desenhado. | `src/components/licenciadas/` |
| Prévias no navegador (saldo, login, CNPJ, senha, parâmetros) | São só ajuda visual, calculadas com as funções puras de `domain/`. O servidor valida tudo de novo. |

## 6. Revisão de segurança dos Administradores (28/09/2026)

Pedido do dono do sistema: impedir que um Administrador mal-intencionado tome o sistema. A revisão olhou a gestão de usuários, o login, a sessão e o log.

| # | Achado | Correção | Teste |
|---|---|---|---|
| 1 | Qualquer Administrador podia **redefinir a senha do admin**, receber a provisória na tela e entrar como o dono. Também podia inativá-lo ou rebaixá-lo a Consulta. | RN-21c: Administrador principal. Nenhuma conta redefine a senha, inativa ou rebaixa o principal. | unitário, laboratório e integração |
| 2 | Um Administrador podia criar outro Administrador "reserva" e voltar por ele depois de desligado, ou tomar a conta de outro Administrador redefinindo a senha. | Só o principal cria, promove e gerencia Administradores. | unitário, laboratório e integração |
| 3 | A proteção dependia só do código: um erro futuro ou SQL direto com o usuário da aplicação rebaixaria o principal. | Índice único (um só principal) e trigger no banco que recusa rebaixar, inativar, apagar ou trocar a marca de principal. | integração com SQL direto pelo usuário da aplicação |
| 4 | Tentativas recusadas não deixavam rastro. | `ACAO_NEGADA` no log, com ação, alvo e motivo; aparece em vermelho na auditoria. | integração |
| 5 | Com login inexistente, o texto digitado ia inteiro para o log imutável. Quem digita a senha no campo de login por engano deixava a senha gravada para sempre, visível a Admin e Gestor. | Login inexistente é gravado só como tamanho do texto. Registros antigos não podem ser apagados (RN-09a). | unitário e integração |

**Recomendações que dependem de decisão:**
- Tirar `SEED_SENHA_ADMIN` e `SEED_DEMO` das variáveis de produção na Vercel. Eles só servem na primeira instalação; se o banco for recriado, o `admin` nasceria com uma senha conhecida e com dados de demonstração.
- Verificação em duas etapas (código no celular) para o Administrador principal.
- Guardar fora do sistema, de tempos em tempos, o hash do último registro do log (por exemplo, no e-mail do dono). Quem tem a senha do dono do banco pode reescrever a cadeia inteira; com a âncora de fora, a adulteração aparece.

## 7. Histórico do documento

| Versão | Data | Mudança |
|---|---|---|
| 1.0 | 26/09/2026 | Primeira versão: controles, revisão de segurança, revisão de código e riscos aceitos. |
| 1.1 | 27/09/2026 | Revisão do redesign (seção 5). O SVG do QR passou para `FolhaDeEtiquetas.tsx`. |
| 1.2 | 27/09/2026 | Câmera liberada só para o próprio SICEI (`camera=(self)`), para ler a etiqueta na tela "Ler QR". |
| 1.3 | 27/09/2026 | O que o IP do log representa; pop-up de alertas, cadastro rápido no novo item e registro da impressão de etiquetas na revisão (seção 5). |
| 1.4 | 27/09/2026 | Sugestões da busca do topo, filtros de texto tolerantes e campo de escolha com busca na revisão (seção 5). |
| 1.5 | 28/09/2026 | Logo da licenciada no login na revisão (seção 5). |
| 1.6 | 28/09/2026 | Seção 6: revisão de segurança dos Administradores (principal protegido, hierarquia, trigger, ação negada no log, login inexistente fora do log) e recomendações. Cabeçalho de versão corrigido. |
