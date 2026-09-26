# SIMI: Segurança

| | |
|---|---|
| **Documento** | 04, Segurança |
| **Versão** | 1.0 |
| **Base** | [03, System Design, seção 6](03-system-design.md#6-segurança) |

## 1. Controles implementados

| Tema | Como o SIMI se protege | Onde está no código |
|---|---|---|
| Autenticação | Login interno gerado pelo sistema, sem e-mail. Senha com Argon2id (parâmetros OWASP). Troca obrigatória da senha provisória. Mensagem única para login ou senha errados, com tempo de resposta equalizado. | `src/server/services/autenticacao.ts`, `src/server/auth/hash.ts` |
| Bloqueio e força bruta | Conta bloqueada na 5ª falha seguida; depois disso a resposta é sempre a mesma, com ou sem a senha certa. Limite de 20 tentativas por IP a cada 15 minutos. | `autenticacao.ts`, `src/domain/senha.ts` |
| Sessão | Token aleatório de 32 bytes; o banco guarda só o SHA-256. Cookie `HttpOnly`, `SameSite=Lax`, `Secure` em produção. Expira por inatividade e em 12 horas. Inativar, redefinir senha, bloquear ou mudar o perfil derruba as sessões na hora; trocar a senha derruba as dos outros aparelhos. | `src/server/auth/sessao.ts` |
| Autorização | Matriz de permissões única (`domain/permissoes.ts`), conferida no servidor em todo service. Cada página e cada Server Action confere a sessão de novo. | `src/server/services/*`, `src/server/web/sessao-atual.ts` |
| Injeção de SQL | Prisma parametrizado; SQL manual só com template marcado (`$queryRaw\`...${x}\``). Não há `$queryRawUnsafe`. | `src/server/consultas/*`, `src/server/estoque.ts` |
| Validação de entrada | Toda entrada passa por schema Zod no servidor. IDs conferidos antes de ir ao banco. | `src/domain/schemas/*`, `src/server/erros.ts` |
| XSS | React escapa a saída. O único `dangerouslySetInnerHTML` é o SVG do QR, gerado no servidor a partir de um código de posição validado. CSP com nonce e `strict-dynamic` nos scripts. | `src/proxy.ts`, `etiquetas/page.tsx` |
| CSRF | Server Actions só aceitam a mesma origem; cookie `SameSite=Lax`. | Next.js 16 |
| Cabeçalhos | CSP, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS em produção. | `src/proxy.ts` |
| Redirecionamento | O parâmetro `volta` do login só aceita caminhos internos, sem caracteres de controle. | `src/lib/redirecionamento.ts` |
| Integridade do histórico | Usuário `simi_app` sem UPDATE/DELETE em `movimentacao` e `audit_log`; triggers que barram até o dono do banco; log encadeado por SHA-256; verificação que aponta o registro adulterado e a movimentação que não bate com o log. | `prisma/migrations/*regras_do_banco`, `src/server/audit/*` |
| Regras no banco | `CHECK` de saldo não negativo, campos obrigatórios por tipo, coerência do saldo; índices únicos parciais. | migration `regras_do_banco` |
| Rotina diária | Aceita só `Authorization: Bearer CRON_SECRET`, comparado em tempo constante. Sem segredo configurado, recusa tudo. | `src/app/api/cron/diario/route.ts` |
| Segredos | Só em variáveis de ambiente; `.env` fora do Git; `.env.example` sem valores reais. A senha provisória nunca vai para banco, log ou auditoria. | `.gitignore`, `usuarios.ts` |
| Erros | Erro inesperado vira mensagem genérica na tela; detalhes só no log técnico do servidor. | `src/server/web/acao.ts` |
| Dependências | `npm audit` sem vulnerabilidades. Dois pacotes internos do CLI do Prisma foram forçados para versões corrigidas (`overrides`). | `package.json` |
| LGPD | Só nome, sobrenome, setor e login dos usuários; nome, setor e matrícula dos colaboradores. Nenhum e-mail pessoal. | `prisma/schema.prisma` |

## 2. Revisão de segurança (26/09/2026)

Foi feita com a skill `security-review`, cobrindo todo o código desde o primeiro commit. Foram conferidos:

- as 25 Server Actions;
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
- **Bloqueio proposital de contas**: como os logins seguem o padrão `nome.sobrenome`, alguém pode bloquear a conta de outra pessoa errando a senha 5 vezes. É o preço da regra RN-22, que exige desbloqueio pelo Administrador. O limite por IP reduz o alcance, e o bloqueio do próprio Administrador tem saída pelo script `npm run admin:recuperar` (doc 06).
- **Mensagem de conta bloqueada revela que o login existe**: é exigência do critério 3 do RF-01 (orientar o usuário a procurar o Administrador). A resposta não revela se a senha estava certa.
- **Backup com dados pessoais**: o dump contém nomes e logins, então precisa ficar em local privado (doc 06).
