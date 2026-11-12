# Handoff: redesign completo da interface do SICEI

## Visão geral

Nova interface do **SICEI**, o Sistema Inteligente de Controle de Estoques Industriais (repositório `rafaelbenevidess/SIMI`, branch `claude/amazing-tesla-54y8dp`). O redesign cobre todas as telas do App Router, nos temas claro e escuro, e a versão para celular a partir de 360 px.

**Objetivo:** trocar o visual atual (Tailwind `slate` puro, menu horizontal no topo) por uma interface de produto profissional: menu lateral, tokens de cor com tema escuro, tipografia Geist, tabelas arejadas e status sempre com cor e texto. **Regras de negócio, textos legais, rotas, permissões e Server Actions não mudam.**

> **Nota (12/11/2026).** Este pacote é o ponto de partida. A interface em produção está na versão 2, descrita no documento 03, seção 10.8: mesma paleta, rotas e textos, com cartões, moldura, números e painel redesenhados. As capturas desta pasta mostram a versão 1. A próxima etapa é um design novo para todas as telas (documento 03, seção 10.9).

## Sobre os arquivos de design

Os arquivos em `prototipo/` são **referências de design feitas em HTML**. São protótipos que mostram o visual e o comportamento esperados, **não são código de produção para copiar**. O trabalho é **recriar esses designs no código existente** (Next.js 16 + React 19 + Tailwind CSS 4, componentes em `src/components/ui.tsx` e `src/components/formulario.tsx`), seguindo os padrões do projeto:

- Server Components para ler dados.
- Server Actions finas para gravar.
- `exigirPermissaoDaPagina` e `pode()` em cada página.
- Zod para validação.

Todos os dados do protótipo são fictícios. Na implementação vêm dos `repositories/` e `server/consultas/`.

Para abrir o protótipo, sirva a pasta `prototipo/` com qualquer servidor estático (por exemplo `npx serve prototipo`) e abra `SICEI App.dc.html`. O arquivo precisa do `support.js` ao lado. Clique no menu lateral para navegar. O botão de sol/lua, no rodapé do menu, alterna o tema.

## Fidelidade

**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamentos, raios, estados e textos são finais. Recrie pixel a pixel com Tailwind 4. Os textos de interface estão em português e devem ser mantidos como estão.

---

## Design tokens

### Cores (as mesmas variáveis nos dois temas)

Defina como variáveis CSS em `globals.css` e exponha no Tailwind 4 via `@theme inline`. O tema escuro é aplicado com `[data-theme="escuro"]` (ou `.dark`) no `<html>`. No protótipo os valores estão em `oklch()`. Os hex abaixo são a conversão exata.

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--bg` | `#f5f7f9` | `#0b0f13` | fundo da página |
| `--surface` | `#ffffff` | `#14171d` | cartões, menu lateral, inputs |
| `--surface-2` | `#f2f5f8` | `#1a1e24` | cabeçalho de tabela, hover de linha |
| `--surface-3` | `#e8ebef` | `#23272c` | trilho de barras, fundo de controle segmentado, item ativo do menu |
| `--line` | `#e1e4e8` | `#262a30` | bordas de cartão e divisórias |
| `--line-2` | `#cdd1d6` | `#363b41` | bordas de input e botão secundário |
| `--ink` | `#14191f` | `#eceff2` | texto principal |
| `--ink-2` | `#484e55` | `#b6bbc1` | texto secundário |
| `--ink-3` | `#6d7279` | `#8b9095` | rótulos, metadados, cabeçalho de tabela |
| `--accent` | `#1c65c8` | `#659ff4` | botão primário, foco, links ativos |
| `--accent-hover` | `#0052b4` | `#7cb2ff` | hover do primário |
| `--accent-soft` | `#e2f0ff` | `#1a2e4c` | seleção, chip do código do item, linha selecionada |
| `--accent-ink` | `#0a4ba0` | `#9cc6ff` | texto sobre `accent-soft`, links, códigos |
| `--on-accent` | `#ffffff` | `#0a1018` | texto sobre `accent` |
| `--ok` / `--ok-soft` / `--ok-ink` | `#269e5f` / `#daf7e3` / `#095c34` | `#4ebe7d` / `#173523` / `#9be5b4` | status OK, sucesso |
| `--warn` / `--warn-soft` / `--warn-ink` | `#e8a127` / `#fff0cc` / `#864900` | `#edb345` / `#442e09` / `#f9d280` | status Atenção |
| `--crit` / `--crit-soft` / `--crit-ink` | `#d73431` / `#ffe9e6` / `#a92321` | `#f36358` / `#55201b` / `#ffbeb4` | status Crítico, erros, contador de alertas |
| `--zero-bg` / `--zero-ink` | `#1d2229` / `#ffffff` | `#e2e5e8` / `#0f1216` | status Zerado (selo invertido) |

**Sombras:**
- `--shadow`: claro `0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.03)`, escuro `0 1px 2px rgba(0,0,0,.3)`.
- `--pop` (toast, folha A4): claro `0 12px 32px rgba(16,24,40,.12), 0 2px 6px rgba(16,24,40,.06)`, escuro `0 12px 32px rgba(0,0,0,.5)`.

**Status (substitui `CORES_STATUS` de `ui.tsx`).** O status nunca depende só da cor (RNF-10): o selo sempre tem bolinha e texto.

| Status | Fundo | Texto | Cor sólida (barras, bolinha do KPI) |
|---|---|---|---|
| OK | `--ok-soft` | `--ok-ink` | `--ok` |
| ATENCAO ("Atenção") | `--warn-soft` | `--warn-ink` | `--warn` |
| CRITICO ("Crítico") | `--crit-soft` | `--crit-ink` | `--crit` |
| ZERADO ("Zerado") | `--zero-bg` | `--zero-ink` | `--zero-bg` |

### Tipografia

- **Geist** (400/500/600/700) para toda a interface, e **Geist Mono** (400/500/600) para códigos: código interno `PT-0012`, posição `A01-G03-C04`, login, NF, OP, CNPJ, hash, número do registro do log. Use o pacote `geist` (`next/font`).
- `body`: 14px / 1.45, `-webkit-font-smoothing: antialiased`, `font-feature-settings: "tnum" 1`. Os números tabulares são obrigatórios, porque as colunas de saldo precisam alinhar.
- **Escala:**

| Uso | Tamanho | Peso | Tracking |
|---|---|---|---|
| Título da página (H1) | 28px | 600 | -0.025em |
| Título de cartão (H2) | 16px | 600 | — |
| Número de KPI | 40px | 600 | -0.03em, line-height 1 |
| Saldo no detalhe do item | 52px | 600 | -0.04em |
| Texto de tabela | 14px | — | — |
| Cabeçalho de tabela | 12px | 500 | cor `--ink-3` |
| Rótulo de campo | 13px | 500 | — |
| Ajuda e metadados | 12–13px | — | cor `--ink-3` |
| Grupo do menu | 11px | 500 | uppercase, 0.07em |

### Espaçamento, raios e alturas

- Espaços: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 56 px. Entre blocos da página: **24px**. Padding da página: `32px 40px 56px`, `max-width: 1400px`.
- Raios: 5–6px (chips e selos), 8px (inputs e botões), 9–10px (controles segmentados, blocos internos), 12px (avisos), **14px (cartões)**, 18px (cartões de marca).
- Alturas de controle: 36px (item do menu), 38px (botões do topo), **40px (botão e input padrão)**, 44px (inputs do formulário de movimentação), 48px (login), 52–56px (botões no celular, mínimo de 44px para toque).
- Tabelas "arejadas": célula `14–16px` na vertical e `16px` na horizontal, com `24px` na primeira e na última coluna. Linha divisória `1px var(--line)`, hover `--surface-2`.

### Componentes-base (reescrever `src/components/ui.tsx`)

- **Cartao:** `bg surface`, `border 1px line`, `radius 14px`, `shadow`, padding 24px (tabelas encostam na borda, com `overflow-x:auto`).
- **BadgeStatus:** `inline-flex`, altura 24px, padding `0 9px`, raio 6px, 12px/600, bolinha de 6px `currentColor` com gap 6px.
- **Botão primário:** altura 40px, padding `0 16px`, raio 8px, `bg accent`, `color on-accent`, 14px/500, ícone 16px com gap 8px, hover `accent-hover`. **Secundário:** `bg surface`, `border 1px line-2`, hover `surface-2`. **Perigo** (estornar): contorno `--crit`, texto `--crit-ink`.
- **Input/Select:** altura 40–44px, padding `0 12px`, `border 1px line-2`, raio 8px, foco `border accent` + `box-shadow 0 0 0 3px accent-soft`. Erro: `border crit`, com a mensagem 13px `crit-ink` embaixo. Obrigatório: `*` em `crit-ink`.
- **Controle segmentado** (filtros, agrupar por, abas de alerta): trilho `surface-3` com padding 3px e raio 9px. Opção com altura 34px e raio 7px. A ativa tem `bg surface` e `shadow`.
- **Abas sublinhadas** (Relatórios, Cadastros): altura 42px, borda inferior de 2px (`accent` na ativa), texto `ink` na ativa e `ink-3` nas outras. **Use `flex-wrap`, sem overflow-x**, para não aparecer barra de rolagem.
- **Aviso:** raio 10–12px, fundo `*-soft`, texto `*-ink`, ícone de 18–20px. Não use barra lateral colorida.
- **Toast:** fixo embaixo e centralizado, `bg ink`, `color bg`, raio 10px, `shadow pop`, some depois de 2,2 s.
- **Barra de nível de estoque (gauge):** trilho `surface-3`. O preenchimento usa a cor do status. Marcadores verticais de 2px: mínimo (`ink-3`/`ink-2`), reposição (`line-2`/`ink-3`) e alvo (`line-2`). A escala é `max(alvo, saldo) × 1,08`, com `alvo = estoqueMaximo ?? ceil(pontoReposicao + consumoDiario × 30)`. Na lista a barra tem 120×6px; no detalhe, largura total × 14px, com rótulos embaixo de cada marcador.

### Ícones

[Lucide](https://lucide.dev), via `lucide-react`, com tamanho de 14 a 20px. Os nomes usados estão no protótipo (`icon-<nome>` → `<NomeIcon/>`). Exemplos: `layout-dashboard`, `package`, `arrow-left-right`, `bell`, `shopping-cart`, `arrow-down-to-line`, `arrow-up-from-line`, `file-chart-column`, `folder-open`, `qr-code`, `users`, `shield-check`, `sliders-horizontal`, `upload`, `search`, `map-pin`, `triangle-alert`, `circle-check`, `undo-2`, `lock`, `truck`, `factory`, `scan-line`.

---

## Shell (`src/app/(app)/layout.tsx`)

Substitui o header horizontal atual. Grid `252px minmax(0,1fr)`, `min-height: 100dvh`.

**Menu lateral:** `sticky top-0 h-dvh`, `bg surface`, `border-right line`, padding `20px 14px 16px`, gap 20px entre blocos.
- **Marca:** ícone de 32×32 (`sicei-icon.png`, raio 8px) e, ao lado, o nome em imagem (`sicei-wordmark-escuro.png` no tema claro e `-claro.png` no escuro, altura 14px). Abaixo do nome, "DDA Metalúrgica" em 12px `ink-3`. O nome vem de `PRODUTO.licenciada` em `src/lib/produto.ts`.
- **Grupos:** título 11px uppercase `ink-3`, depois os itens. Cada item tem altura 36px, raio 8px, ícone de 17px e gap 10px. O **ativo** tem `bg surface-3`, texto `ink` com peso 600 e ícone `accent`. Os inativos têm texto `ink-2`/500, ícone `ink-3` e hover `surface-2`. Filtre os itens com `pode(u.perfil, permissao)`, como no `MENU` atual.

| Grupo | Item | Rota |
|---|---|---|
| **Operação** | Painel | `/painel` |
|  | Itens | `/itens` |
|  | Movimentações | `/movimentacoes` |
|  | Alertas (contador `crit-soft`/`crit-ink`, raio 10px) | `/alertas` |
|  | Sugestão de compra | `/relatorios?tipo=reposicao` |
| **Registrar** | Entrada | `/movimentacoes/nova?modo=entrada` (nova rota, ou `?registrar=entrada` no item) |
|  | Saída | `/movimentacoes/nova?modo=saida` |
| **Gestão** | Relatórios | `/relatorios` |
|  | Cadastros | `/cadastros` |
|  | Etiquetas QR | `/cadastros/posicoes/etiquetas` |
| **Administração** | Usuários | `/admin/usuarios` |
|  | Auditoria | `/admin/auditoria` |
|  | Parâmetros | `/admin/parametros` |
|  | Importação | `/admin/importacao` |

O link "Testes" (`/testes`) continua existindo e pode ir para o rodapé do menu.

- **Rodapé do menu:** borda superior. Avatar de 34px com as iniciais (`accent-soft`/`accent-ink`), nome, e "Perfil · Setor" em 12px. Botão de tema de 32×32 (sol/lua). Embaixo, dois botões de 32px: "Senha" (`/trocar-senha`) e "Sair" (`acaoSair`).

**Topo:** `sticky top-0 z-20`, altura 64px, padding `0 40px`, fundo `color-mix(in oklch, var(--bg) 88%, transparent)` com `backdrop-blur(10px)` e `border-bottom line`. Da esquerda para a direita:
- trilha "Grupo › Tela" (13px, some abaixo de 1040px);
- busca com `flex:1; max-width:400px; min-width:0`, placeholder "Buscar código, ISO, classe ou posição" e a tecla `/` como atalho;
- botão "N alertas" com sino `crit`;
- botão primário "Registrar saída".

Os botões têm `flex:none; white-space:nowrap`.

**Rodapé:** `border-top line`, padding `16px 40px`, 12px `ink-3`. À esquerda "SICEI © 2026 Benevides Soluções Industriais. Todos os direitos reservados."; à direita "Licenciado para DDA Metalúrgica · comercial@…". Os valores vêm de `PRODUTO` (`Rodape.tsx`).

**Responsivo:** abaixo de 1200px, todos os grids de duas colunas viram uma coluna. Abaixo de 1040px, os KPIs e os filtros passam para 2 colunas e a trilha some. Tabelas ficam com `min-width: 680px` dentro de cartões com `overflow-x:auto`. **A página nunca rola na horizontal.** No celular (menos de 768px), sugestão: o menu vira gaveta e aparece uma barra inferior com Painel, Itens, Ler QR e Alertas (ver `SICEI Mobile.dc.html`).

---

## Telas

Cada tela começa com um cabeçalho: H1 de 28px, descrição de 14px em `ink-2` e, à direita, as ações (botões secundários e depois o primário). Essa é a nova versão do componente `Pagina`.

### 1. Painel (`/painel`, RF-16)
- **Saúde do estoque:** um único cartão com 4 colunas iguais (Zerado, Crítico, Atenção, OK). Colunas separadas por `border-right line` e padding `22px 24px 28px`. Cada coluna mostra:
  - quadradinho de 8px da cor do status com o rótulo;
  - número de 40px seguido de "itens";
  - dica de 13px: "Sem saldo na prateleira", "No mínimo ou abaixo", "Já é hora de comprar", "Acima do ponto de reposição";
  - **barra de 5px na cor do status, encostada embaixo da própria coluna e com a largura da coluna** (`position:absolute; left:0; right:0; bottom:0`). Não é uma barra proporcional.

  Clicar numa coluna leva para `/itens?status=…`.
- **Linha 2** (`1.35fr 1fr`):
  - **Consumo da produção em setembro:** total grande de 30px, "−15% vs. agosto (1.189)" e gráfico de colunas por dia (div com altura %, raio `3px 3px 0 0`, cor `color-mix(accent 38%, surface-3)` e o dia atual em `accent`). Eixo com datas em Geist Mono de 11px.
  - **Alertas abertos:** os 6 piores, com selo, "ISO · classe", código e posição em mono, e "saldo / mín." à direita. "Ver todos" leva para `/alertas`.
- **Linha 3** (`1fr 1.35fr`):
  - **Mais consumidos no mês:** 10 barras horizontais (código mono de 72px, trilho de 18px `surface-2`, preenchimento `accent` com opacidade decrescente, total à direita).
  - **Últimas movimentações:** tabela com Quando, Item, Tipo (ícone + nome), Qtd. (+ verde / − ink) e Usuário. Fica escondida para o perfil Consulta, como hoje.

### 2. Itens (`/itens`, RF-11)
- **Filtros:** busca de 40px (até 420px); controle segmentado "Todos 12 / Em alerta 8 / Críticos e zerados 4 / OK 4" (contagem em `ink-3`); select de aplicação; checkbox "Mostrar inativos". Ações: "Exportar CSV" e "Novo item".
- **Tabela:** Código (mono, `accent-ink`, nowrap), Pastilha ("ISO · classe" 500 e, embaixo, "Fabricante · Aplicação" 13px `ink-3`), Saldo (número de 16px/600 + gauge de 120px), Mínimo, Reposição, Status (selo), Posição (chip mono com borda e `surface-2`).
- A linha inteira é clicável e leva para `/itens/[id]`. Rodapé da tabela: "N de M itens ativos" e a legenda dos marcadores (mínimo / ponto de reposição).

### 3. Detalhe do item (`/itens/[id]`, RF-05a)
- **Cabeçalho:**
  - "← Itens" em 13px;
  - chip do código (`accent-soft`) com H1 "ISO · classe";
  - linha com o selo de status, pin + posição em mono, fabricante e aplicação;
  - ações: Etiqueta, Editar, Entrada e **Registrar saída** (primário).
- **Aviso de alerta** (quando houver): fundo e texto do status; "Alerta **Atenção** aberto desde … Sugestão de compra: **100 unidades** (10 caixas)."; botões "Ver sugestão" (contorno) e "Marcar ciente".
- **Grid `2fr 1fr`:**
  - **Nível de estoque:** saldo de 52px, "unidades · N caixas", "Cobertura estimada ~N dias" (saldo ÷ consumo diário) e o gauge largo com os rótulos mínimo / reposição / alvo. Embaixo, 4 números: consumo médio (N dias), lead time preferencial, estoque máximo e embalagem.
  - **Especificação:** lista de pares (ISO, Classe, Cobertura, Aplicação, Fabricante, Código interno com cadeado quando estiver travado, RN-01).
- **Fornecedores:** cabeçalho em grid `1.6fr 1fr 1fr 1fr 40px` (Fornecedor | Último preço | Última compra | Lead time). Linha com o nome, o selo "Preferencial" (`accent-soft`) e "cód. …" em mono.
  - O menor preço fica em `ok-ink`, e "sem compras" em `ink-3`, no fim da lista.
  - A linha expande (chevron) e mostra o histórico dentro de um bloco `surface-2` de raio 10px: Data, Preço unit., Variação (+x,x% em `crit-ink`), Qtd., NF e Lançado por. Compras estornadas aparecem riscadas.
  - O perfil Consulta não vê preços (RN-05b).
- **Últimas movimentações:** continua como está hoje, com o novo estilo de tabela.

### 4. Registrar entrada / saída (nova rota `/movimentacoes/nova`, RF-07 e RF-08)
- **Grid `1fr 360px`.** O resumo à direita é sticky com `top:88px`.
- **Tipo:** dois cartões selecionáveis (ícone de 18px, título 600, subtítulo 13px). O selecionado tem `border accent`, `bg accent-soft` e `ring 3px color-mix(accent 18%)`.
  - Entrada: "Compra (Com fornecedor, preço e NF)" e "Devolução da produção (Pastilha nova que voltou)".
  - Saída: "Consumo da produção (Destino, OP e quem retirou)" e "Perda ou quebra (Com motivo obrigatório)".
- **Item:** cartão do item selecionado (chip do código, ISO · classe, "Fabricante · posição … · saldo N") com o link "Trocar".
- **Campos** (grids `repeat(auto-fit, minmax(240px,1fr))`; o input de quantidade precisa de `min-width:0; width:0; flex:1`):
  - **Quantidade:** na entrada, com o controle "Caixas | Unidades" e a dica "3 caixas × 10 = 30 unidades".
  - **Compra:** preço unitário com o prefixo R$ e a dica "Último pago a este fornecedor: R$ 38,90 em 02/09"; fornecedor (select dos vinculados); nota fiscal (mono).
  - **Consumo:** OP (mono), destino e colaborador que retirou. **Devolução:** destino, colaborador que devolveu e motivo. **Perda:** motivo.
- **Cadastro rápido de fornecedor (novo):** embaixo do select de fornecedor, o link "+ Fornecedor não está na lista?". Ele abre um painel dentro do formulário (borda `accent`, fundo `color-mix(accent-soft 55%, surface)`, raio 12px):
  - título "Cadastrar fornecedor e vincular a PT-0012";
  - campos Razão social, CNPJ (com máscara enquanto digita e validação dos dígitos verificadores em tempo real: "CNPJ válido." / "Dígito verificador inválido." / "CNPJ já cadastrado (X)."), Código do item no fornecedor e Lead time (dias);
  - "Salvar e vincular" fica desabilitado até a validação passar.

  Implemente com uma Server Action nova que cria o fornecedor e o vínculo `item_fornecedor` na mesma transação, gravando no log. O novo fornecedor já volta selecionado no select. Para um fornecedor sem compras, a dica do preço muda para "Primeira compra deste fornecedor: o preço abre o histórico."
- **Erro de saldo (RN-08):** a borda da quantidade fica `crit` e aparece o aviso "Saída recusada. Saldo disponível: N". O botão fica desabilitado (`bg line-2`). O servidor continua sendo quem garante a regra.
- **Resumo:** "Saldo atual → Depois" (blocos `surface-2` com números de 28px), "Status atual → depois" (selos) e "Fica registrado": usuário, data e hora do servidor (America/Sao_Paulo), IP e dispositivo, e "Depois de gravada, só pode ser estornada".
- **Botões:** Cancelar e "✓ Confirmar saída de N un." / "Confirmar entrada de N un.".

### 5. Alertas (`/alertas`, RF-13)
- Controle segmentado "Abertos · N" / "Fechados recentemente".
- **Abertos:** grid `100px 1.4fr 120px 130px 150px 1.2fr` com `min-width:860px` (Nível | Item | Saldo / mín. | Posição | Aberto em | Ciente). Enquanto ninguém marcou ciente, aparece o botão "Marcar ciente". Depois, "✓ login · data" em `ok`.
- **Fechados:** tabela com Item, Último nível, Aberto em, Fechado em e Fechado por (ex.: "Compra · NF 12345").

### 6. Sugestão de compra (`/relatorios?tipo=reposicao`, RF-19)
- Ações: Imprimir e Exportar CSV.
- **3 cartões:** Itens a repor; Unidades sugeridas + caixas; Parâmetros ("Consumo médio dos últimos 90 dias. Sem máximo: alvo = reposição + 30 dias de consumo.").
- **Tabela:** Item, Status, Saldo / reposição, Consumo / dia, Sugestão ("100 un." e "10 caixas de 10"), Preferencial (nome + "R$ · N dias") e Menor último preço (nome + preço em `ok-ink` · lead time).
- Nota: "Quantidades em unidades, arredondadas para cima em caixas fechadas. O SICEI não calcula valor de estoque em reais."

### 7. Movimentações (`/movimentacoes`, RF-15)
- **Filtros** num cartão, grid `repeat(4,1fr) auto`: Período, Tipo, Destino, "Item, OP ou colaborador" e o botão "Filtrar" (`bg ink`, `color bg`).
- **Grid `1fr 340px`.**
  - **Tabela:** Quando, Item (mono), Tipo (ícone verde nas entradas e `ink-3` nas saídas, e o selo "estornada"), Qtd. (+/−), Saldo "a → b" e "Destino · OP · colaborador". A linha selecionada tem `bg accent-soft`, e as estornadas ficam em `ink-3`.
  - **Painel de detalhe (sticky):** UUID em mono; tipo e quantidade grandes; lista de Item, Saldo, Contexto, Registrado por, Data e hora (servidor), IP e Dispositivo. Botão "Estornar movimentação" (perigo) com a nota "Exige justificativa. Cada movimentação só pode ser estornada uma vez." Se já foi estornada ou se é um estorno, aparece um bloco com cadeado e o motivo.
  - Substitui a página `/movimentacoes/[id]` no desktop; no celular, mantenha a rota.

### 8. Relatórios (`/relatorios`, RF-17 e RF-18)
- Abas sublinhadas: Consumo, Movimentação e Reposição (esta leva para a tela 6). Filtros De/Até. Na aba Consumo, também o controle "Agrupar por Item / Destino / Colaborador" e o botão "Gerar".
- **Consumo:** Item/Destino/Colaborador (nome + subtítulo), Participação (barra de 8px `accent` + %), Consumido e Média diária. No rodapé, o total.
- **Movimentação:** Item, Saldo inicial, Entradas (+ verde), Saídas (−), Saldo final e "Confere com o saldo atual ✓".
- Imprimir/PDF (`@media print`, mantenha `.nao-imprimir`) e Exportar CSV.

### 9. Cadastros (`/cadastros`, RF-04, RF-05, RF-06, RF-27 e RF-28)
- Abas sublinhadas com contagem: Fabricantes, Fornecedores, Destinos, Colaboradores e Posições. **Uma página só com abas** (`?aba=`) substitui a grade de links de hoje. As subrotas existentes podem continuar e redirecionar para cá.
- **Grid `1fr 340px`.**
  - **Esquerda:** a tabela da aba, com as colunas de cada entidade, a Situação (selo Ativo/Inativo) e Ações ("Editar" e "Inativar"/"Reativar" em `crit-ink`/`accent-ink`). Linhas inativas ficam com opacidade 0,6.
  - **Direita (sticky):** o formulário "Novo …" com os campos do `formularios.tsx` atual, a ajuda de cada campo e a nota "Cadastro que já aparece em alguma movimentação não é excluído, só inativado."
- **Posições:** em cima da tabela, um **mapa do almoxarifado**: um cartão por armário (A01, A02, A03), com 5 gavetas × 6 compartimentos.
  - Compartimento ocupado: `bg accent-soft`, borda `accent` e os 4 dígitos do código em mono de 9px. Clicar abre o item.
  - Compartimento livre: borda tracejada `line-2`.
  - Cada armário mostra "N de 30 ocupadas".

### 10. Etiquetas QR (`/cadastros/posicoes/etiquetas`, RF-22)
- **Grid `340px 1fr`.**
- **Esquerda:** lista das posições ocupadas com checkbox e o link "Selecionar todas / Limpar seleção".
- **Direita:** prévia de uma folha A4 (`aspect-ratio: 210/297`, sempre branca, `shadow pop`), num grid `repeat(3, minmax(0,1fr))` (o `minmax(0,…)` é obrigatório). Cada etiqueta tem borda tracejada, o QR de 56px (gerado no servidor com `qrcode`, URL `/p/<posição>`), a posição em mono de 12px/600, o código e a descrição com reticências.
- Botão "Imprimir N etiquetas".

### 11. Usuários (`/admin/usuarios`, RF-02)
- **Grid `380px 1fr`.**
- **Novo usuário:** Nome, Sobrenome e Setor; Perfil em 4 botões (Administrador, Gestor, Almoxarife, Consulta). Um bloco `surface-2` mostra **"Login que será gerado"** em tempo real (mono de 17px), usando `domain/login.ts` no cliente (é função pura), com a nota da regra ("Sem acentos, sem partículas, último sobrenome." ou "x já existe ou existiu: recebe o próximo número livre."). Botão "Criar usuário".
- **Depois de criar:** um bloco `accent-soft` com "✓ Usuário criado", o Login e a **Senha provisória** (mono de 20px, `letter-spacing .08em`), o botão "Copiar" e "A senha aparece só agora…". Botão "Já repassei, concluir". A senha nunca mais aparece (RN-21).
- **Tabela:** Nome (avatar com iniciais + setor), Login (mono), Perfil, Situação (Ativo `ok`, Aguardando troca de senha `warn`, "Bloqueado em …" `crit`, Inativo `surface-3`) e Ações ("Redefinir senha", "Desbloquear", "Inativar", "Reativar"; na própria linha, "Você").

### 12. Auditoria (`/admin/auditoria`, RF-21)
- **Cartão de verificação:** ícone `shield-check` num quadrado `accent-soft` de 44px, o título, a descrição e o botão "Verificar agora". O resultado aparece em 3 blocos `ok-soft` (ou `crit-soft` se houver problema): "Cadeia íntegra. N registros conferidos.", "Todas as movimentações batem com o log." e "Nenhuma divergência de saldo nos N itens." Embaixo, "Conferência registrada no log às … por …".
- **Filtros** inline (período, ação, usuário).
- **Tabela:** # (mono `ink-3`), Quando, Ação (mono 600: `crit-ink` para falhas, `accent-ink` para movimentações) + entidade, Usuário (mono), "Antes → depois" (mono; o antes em `crit-ink` riscado, o depois em `ok-ink`), Origem (IP · dispositivo) e Hash (mono truncado "9f3a…c21e").
- Não existe nenhuma ação de editar ou apagar.

### 13. Parâmetros (`/admin/parametros`, RF-26)
- **Grid `1fr 360px`.**
- **Cartão com 3 linhas** (grid `minmax(0,1fr) minmax(180px,260px)`): ícone de 40px `surface-2`, título de 15px/600 e a descrição (textos do protótipo). À direita, o input com unidade (dias / minutos, ou e-mail em mono).
- **Rodapé:** status à esquerda:
  - salvo: "Salvo em … por …" em `ink-3`;
  - alterado: "Alterações não salvas. Pontos de reposição e sugestões serão recalculados." em `warn-ink`;
  - inválido: "A janela precisa ficar entre 1 e 365 dias." / "A sessão precisa ficar entre 5 e 480 minutos." em `crit-ink`.

  À direita, o botão "Salvar parâmetros".
- **Lateral "Últimas alterações":** vem do audit_log (título, "antes → depois" em mono, "login · data").

### 14. Importação (`/admin/importacao`, RF-25)
- **Três passos** no topo: "1 Enviar o CSV", "2 Conferir a prévia" e "3 Importar". O passo atual tem `border accent` e `bg accent-soft`; o concluído mostra ✓ em `ok`.
- **Vazio:** bloco do modelo (`modelo-importacao-sicei.csv`, "Baixar modelo") e uma área de upload de 220px com borda tracejada de 2px (hover `accent`/`accent-soft`): "Arraste o CSV aqui ou clique para escolher".
- **Prévia:**
  - nome do arquivo e "42 linhas: **40 válidas**, **2 com erro**";
  - aviso `crit-soft` com a lista "Linha 17: …";
  - tabela: Linha, Código, ISO · classe, Fornecedor, Posição, Mínimo, Saldo inicial e Resultado (✓ Válida / ✗ motivo). A linha com erro tem `bg crit-soft`;
  - "Importar 40 itens" fica **desabilitado enquanto houver erro**, com o botão "Enviar arquivo corrigido" ao lado. A gravação é tudo ou nada.
- **Concluído:** ✓ de 56px, "42 itens importados" e a explicação do ajuste "saldo inicial da implantação". Botões "Nova importação" e "Ver itens".

### 15. Login (`/login`) e troca de senha (`/trocar-senha`)
- **Grid de 2 colunas** (uma coluna abaixo de 1040px).
- **Esquerda:** marca no topo, formulário centralizado com até 380px e o rodapé legal.
  - **Login:** H1 de 30px "Entrar"; "Use o login que o Administrador entregou para você."; Login (mono, placeholder `nome.sobrenome`); Senha com o botão de mostrar/esconder; "Entrar" (48px) e a nota "Não tem acesso ou esqueceu a senha? Procure o Administrador do sistema. O SICEI não usa e-mail para login."
  - **Troca de senha:** o selo "Primeiro acesso" (`warn`), H1 "Crie a sua senha" e o texto do protótipo. Campos Senha provisória, Nova senha e Repita. Checklist ao vivo (`circle` → `circle-check` em `ok-ink`): pelo menos 10 caracteres, diferente do login, não repete as 3 últimas (validado no servidor) e as duas coincidem. O botão "Salvar e continuar" fica desabilitado até tudo passar.
- **Direita:** painel `#131a2a` (`oklch(0.2 0.02 258)`) com uma grade sutil (`linear-gradient` de 1px branco a 6%, 56×40px), a logo completa para fundo escuro no topo e, embaixo, o eyebrow mono "A01-G03-C04 · PT-0012", o título de 34px "Sistema Inteligente de Controle de Estoques Industriais" e a frase de apoio.

### 16. Celular (ver `SICEI Mobile.dc.html`, RNF-01 e RNF-02)
Telas de 360px:
1. **Item aberto pelo QR** (`/p/[codigo]`): faixa "Posição A01-G03-C04 lida pela câmera", código e ISO, cartão de saldo de 44px com o selo e o gauge, "Últimas saídas" e a barra fixa embaixo com "Entrada" (1fr) e "Registrar saída" (2fr), ambos com 52px.
2. **Saída em uma tela:** quantidade com stepper (56px), destino em chips de 44px, OP, "Quem retirou", "Saldo depois" com o selo e o botão fixo "Confirmar saída de N un." (54px).
3. **Confirmação:** ✓ de 64px; "Saída registrada"; Antes → Agora; o aviso do alerta que abriu (`warn`); "Ler outra etiqueta" e "Voltar ao item".
4. **Painel:** KPIs em 2×2, consumo e alertas, com a barra inferior Painel / Itens / Ler QR / Alertas.

---

## Interações e estado

- **Tema:** claro/escuro guardado em cookie ou `localStorage`, aplicado no `<html data-theme>` antes da primeira pintura, sem piscar. Não há transição de cor.
- **Toasts** de sucesso depois de cada Server Action ("Saída registrada. Saldo de PT-0012: 35.", "Parâmetros salvos. Mudança registrada no log.").
- **Filtros** em `searchParams` (como hoje), para os links poderem ser compartilhados.
- **Expansões** (fornecedor do item, painel de fornecedor novo, detalhe da movimentação) são estado de cliente.
- **Prévia do resultado** de uma movimentação: cálculo local com as funções puras de `domain/estoque.ts` (status, conversão de caixas). A decisão final é sempre do servidor.
- **Hover:** linhas e itens do menu `surface-2`, primário `accent-hover`. Foco visível em todos os controles (`ring 3px accent-soft`), com WCAG 2.1 AA (RNF-10).

## Assets

| Arquivo | Uso | Onde colocar no repo |
|---|---|---|
| `prototipo/assets/sicei-icon.png` (512px) | ícone do app, marca no menu e no login | `public/brand/sicei-icon.png` |
| `prototipo/assets/sicei-favicon.png` (64px) | favicon | `src/app/icon.png` |
| `prototipo/assets/sicei-wordmark-escuro.png` | nome "SICEI" em grafite (tema claro) | `public/brand/` |
| `prototipo/assets/sicei-wordmark-claro.png` | nome "SICEI" em branco (tema escuro) | `public/brand/` |
| `prototipo/assets/sicei-logo-escuro-2.png` | logo completa para fundo escuro (painel do login) | `public/brand/` |
| `marca/sicei-logo-fonte.png`, `marca/sicei-icone-fonte.png` | originais gerados (referência) | — |
| `marca/sicei-logo.svg`, `marca/sicei-brand-board.svg` | versões vetoriais de referência (outra tipografia) | — |

Cores da marca: `#2F5BD8` (azul do símbolo), `#1F2530` (grafite do nome) e `#12161C` (fundo escuro). O `--accent` da interface é um cobalto próximo, ajustado para contraste AA.

## Arquivos

- `prototipo/SICEI App.dc.html`: todas as telas desktop (navegue pelo menu lateral).
- `prototipo/SICEI Mobile.dc.html`: as 4 telas de celular.
- `prototipo/support.js`: runtime do protótipo (só para abrir os HTML, não entra no projeto).
- `prototipo/assets/`: imagens usadas.
- `marca/`: arquivos originais da marca.
- `screenshots/`: captura de cada tela (01-painel … 21-troca-senha, 19 = painel no tema escuro, 22 = celular). Largura de captura ~910px, então aparecem os layouts empilhados. Em telas ≥1200px, as colunas ficam lado a lado, como descrito acima.

## Ordem sugerida

1. Tokens em `globals.css` + `@theme`, Geist e o provedor de tema.
2. Reescrita de `ui.tsx` e `formulario.tsx` (Pagina, Cartao, Tabela, BadgeStatus, Aviso, botões, inputs, segmentado, abas, toast, Gauge).
3. Shell `(app)/layout.tsx` com o menu lateral e o topo.
4. Telas na ordem: Painel → Itens → Item → Registrar → Alertas → Movimentações → Relatórios/Sugestão → Cadastros → Etiquetas → Usuários → Auditoria → Parâmetros → Importação → Login/Troca de senha → ajustes de celular.
5. Testes: atualizar `componentes.test.tsx` (o selo continua com texto, e o preço continua escondido para o perfil Consulta) e rodar o Playwright em 360px e 1366px.
