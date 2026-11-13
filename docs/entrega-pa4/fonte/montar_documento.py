"""Monta o Documento do Sistema do SICEI sobre o template da UC Projeto Aplicado IV.

Uso (a partir da raiz do repositório):
    python3 docs/entrega-pa4/fonte/montar_documento.py

Gera docs/entrega-pa4/Documento_do_Sistema_SICEI_Grupo_J.docx e o PDF ao lado (LibreOffice).
O sumário é numerado em duas passadas: monta, converte, lê em que página cada título caiu e monta de novo.
Os diagramas vêm de docs/entrega-pa4/diagramas (rode gerar.sh antes se mudar algum .puml).
"""

import copy
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

from lxml import etree

sys.path.insert(0, os.path.dirname(__file__))
from ooxml import (  # noqa: E402
    LARGURA_RETRATO,
    Documento,
    figura,
    fonte,
    legenda_tabela,
    lista,
    lista_numerada,
    paragrafo,
    ppr,
    run,
    runs,
    sect_pr,
    tabela,
    titulo,
)

AQUI = os.path.dirname(os.path.abspath(__file__))
ENTREGA = os.path.dirname(AQUI)
DIAGRAMAS = os.path.join(ENTREGA, 'diagramas')
TEMPLATE = os.path.join(AQUI, 'template.docx')
NOME = 'Documento_do_Sistema_SICEI_Grupo_J'
SAIDA_DOCX = os.path.join(ENTREGA, f'{NOME}.docx')
PAGINAS = os.path.join(AQUI, 'paginas.json')

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS = {'w': W}

URL_SISTEMA = 'https://sicei-ddausinagem.vercel.app'
URL_REPO = 'https://github.com/rafaelbenevidess/SICEI'

PAISAGEM = '@@PAISAGEM@@'
RETRATO = '@@RETRATO@@'

# Área útil para figuras (cm), descontando legenda e fonte.
RET_L, RET_A = 17.0, 21.5
PAI_L, PAI_A = 25.7, 14.6


def diag(nome):
    return os.path.join(DIAGRAMAS, f'{nome}.svg'), os.path.join(DIAGRAMAS, f'{nome}.png')


# ---------------------------------------------------------------------------
# Conteúdo
# ---------------------------------------------------------------------------


def conteudo(doc):
    b = []
    P = lambda texto, **kw: b.append(paragrafo(doc, texto, **kw))  # noqa: E731
    H1 = lambda texto, **kw: b.append(titulo(doc, texto, 0, **kw))  # noqa: E731
    H2 = lambda texto: b.append(titulo(doc, texto, 1))  # noqa: E731
    H3 = lambda texto: b.append(titulo(doc, texto, 2))  # noqa: E731
    L = lambda itens: b.append(lista(doc, itens))  # noqa: E731
    N = lambda itens: b.append(lista_numerada(doc, itens))  # noqa: E731

    def T(legenda, cabecalho, linhas, larguras, texto_fonte=None, **kw):
        b.append(legenda_tabela(doc, legenda))
        b.append(tabela(doc, cabecalho, linhas, larguras, **kw))
        b.append(fonte(doc, texto_fonte or 'Elaborado pela equipe (2026), a partir da documentação do SICEI.'))

    def F(nome, legenda, paisagem=False, texto_fonte=None, altura=None):
        svg, png = diag(nome)
        lmax, amax = (PAI_L, PAI_A) if paisagem else (RET_L, RET_A)
        amax = altura or amax
        b.append(figura(doc, svg, png, legenda, lmax, amax, texto_fonte))

    # ------------------------------------------------------------------ 1
    H1('1. Escopo', quebra_antes=True)
    P(
        'A DDA Metalúrgica, empresa de usinagem de Santa Catarina, publicou na plataforma SAGA SENAI de '
        'Inovação o desafio de melhorar o controle do estoque de pastilhas usadas nas máquinas. As pastilhas '
        '(insertos intercambiáveis de metal duro, cermet ou cerâmica) são a parte da ferramenta que corta o '
        'metal no torneamento, no fresamento, na furação e no rosqueamento. A empresa usa muitos modelos, o '
        'consumo é alto e, quando uma pastilha falta, a máquina para.'
    )
    P(
        'Hoje o estoque é controlado em planilhas preenchidas à mão. A demanda registrada pela DDA pede um '
        'sistema que resolva os pontos abaixo. Cada um deles foi ligado a pelo menos um requisito (seção 5):'
    )
    L(
        [
            'automatizar o controle do estoque e reduzir os erros dos registros manuais;',
            'acompanhar as quantidades disponíveis e agilizar a entrada e a saída de material;',
            'avisar quando um item atingir o estoque mínimo e ajudar no planejamento das compras;',
            'guardar o histórico das movimentações e gerar relatórios de consumo, movimentação e reposição;',
            'cadastrar tipos de pastilhas, fabricantes e fornecedores, com identificação por código ou descrição e estoque mínimo configurável por item;',
            'oferecer um painel de acompanhamento e uma interface simples, que funcione no computador e no celular;',
            'ter baixo custo de implantação e manutenção, armazenamento seguro e controle de acesso com autenticação.',
        ]
    )
    P(
        'A demanda também cita a integração futura com o ERP, com compras e com o controle de produção. Por '
        'se tratar de um trabalho acadêmico, e por a própria DDA tratar essa integração como possibilidade, '
        'ela ficou fora do escopo (RF-23 e RF-24), assim como uma API REST pública. O sistema também não '
        'calcula o valor do estoque em reais: trabalha só com quantidades, e os preços servem para comparar '
        'fornecedores.'
    )
    P(
        'A solução desenvolvida é o **SICEI**, Sistema Inteligente de Controle de Estoques Industriais. O '
        'projeto começou com o nome SIMI e já está publicado e em uso pela DDA, que aparece no sistema como '
        'DDA Usinagem Industrial.'
    )
    P('**Link do SAGA SENAI:** [[INSERIR O LINK DO DESAFIO DA DDA NO SAGA SENAI]]')
    P(f'**Sistema publicado:** {{link:{URL_SISTEMA}|{URL_SISTEMA}}}')
    P(f'**Repositório:** {{link:{URL_REPO}|{URL_REPO}}}')

    # ------------------------------------------------------------------ 2
    H1('2. Descrição da Solução')
    P(
        'O SICEI substitui a planilha por um sistema web. Cada entrada e cada saída é registrada no momento em '
        'que acontece, pelo computador do escritório ou pelo celular do almoxarife, que lê a etiqueta QR da '
        'gaveta. O saldo é calculado a partir dessas movimentações, fica sempre atualizado e nunca fica '
        'negativo. Quando um item chega ao ponto de reposição, o sistema abre um alerta, avisa por e-mail se '
        'o item ficar crítico e sugere quanto comprar. Tudo o que é feito fica num log de auditoria que não '
        'pode ser alterado.'
    )
    P(
        '**Contextualização.** Na usinagem, a pastilha é um consumível: gasta a aresta de corte, quebra ou '
        'lasca e precisa ser trocada. Cada modelo é identificado pela especificação ISO da geometria (por '
        'exemplo, CNMG 120408) e pela classe do material (P25, M15). A mesma ISO em classes diferentes é '
        'outro item. A DDA compra os mesmos modelos de fornecedores diferentes, com preços e prazos de entrega '
        'diferentes, e guarda as caixas em gaveteiros no almoxarifado. Hoje, quem retira uma pastilha anota '
        'na planilha quando lembra.'
    )
    P(
        '**Descrição do problema.** Entradas e saídas às vezes não são lançadas, ou são lançadas com atraso. '
        'Ninguém sabe ao certo quanto há na prateleira, nem onde está cada modelo. A compra acaba sendo feita '
        'quando alguém percebe que acabou, e aí a máquina já parou ou vai parar enquanto a pastilha não chega. '
        'Também não há registro confiável de quem retirou, para qual máquina e para qual ordem de produção, '
        'então não dá para saber o consumo real de cada setor nem planejar compras pelo histórico. O preço '
        'pago a cada fornecedor fica espalhado em notas fiscais e e-mails, o que dificulta comparar ofertas.'
    )
    P(
        '**Impacto.** Quem sente primeiro é a produção: máquina parada por falta de pastilha é hora de '
        'operador e de equipamento perdida, e às vezes prazo de entrega perdido. Compras sofre com pedidos de '
        'urgência, sem tempo para comparar preço e prazo. O almoxarife refaz contagens para descobrir o saldo, '
        'e a gestão decide sem dados de consumo. Esse problema não é exclusivo da DDA. Num estudo de casos em '
        'indústrias automotivas da região de Curitiba, Favaretto, Valle e Canciglieri Junior (2009) relatam '
        'problemas frequentes causados pela falta da ferramenta correta no momento necessário, que pesam '
        'diretamente no custo do produto acabado.'
    )
    P(
        '**Estudo de mercado.** Existem hoje três caminhos para quem quer sair da planilha. O Quadro 1 resume '
        'o que cada um oferece e por que nenhum resolvia bem o caso da DDA.'
    )
    T(
        'Alternativas de mercado para o controle de pastilhas',
        ['Alternativa', 'O que oferece', 'Limitação para a DDA'],
        [
            [
                'Planilha (situação atual)',
                'Custo zero e conhecida por todos.',
                'Depende de alguém lembrar de lançar; não avisa, não impede saldo negativo, não registra quem '
                'alterou e não funciona bem no celular, junto da gaveta.',
            ],
            [
                'Módulo de estoque de um ERP',
                'Controle de materiais integrado a compras e fiscal.',
                'Pensado para materiais em geral, com custo de licença e implantação alto para uma empresa '
                'que quer resolver só as pastilhas. Endereço por gaveta, etiqueta QR por posição e saída com '
                'OP e colaborador exigiriam customização.',
            ],
            [
                'Máquinas dispensadoras dos fabricantes (Kennametal ToolBOSS, Sandvik Coromant CoroPlus Tool '
                'Supply, ISCAR Matrix)',
                'Armário que libera a ferramenta mediante identificação, com software de reposição e '
                'consumo.',
                'Exige comprar ou alugar o equipamento e costuma ficar ligada ao programa de um fabricante, '
                'enquanto a DDA compra de vários fornecedores e fabricantes.',
            ],
            [
                'SICEI',
                'Sistema web sob medida para pastilhas: saldo em tempo real, posição exata, QR no celular, '
                'alertas, sugestão de compra, comparação de fornecedores e auditoria.',
                'Não integra com ERP nesta versão (fora do escopo). Roda nos planos gratuitos da Vercel e do '
                'Neon, sem hardware extra.',
            ],
        ],
        [2200, 3000, 4438],
        texto_fonte='Elaborado pela equipe (2026), com base em Cutting Tool Engineering (2013; 2021) e na demanda da DDA.',
        destaque_primeira_coluna=True,
    )
    P(
        '**Justificativa.** A equipe escolheu este problema por ser uma demanda real, com um cliente disposto '
        'a validar as regras e a usar o sistema, e com resultado fácil de medir: saldo correto, nenhuma saída '
        'sem registro e compra feita antes de faltar. O problema também cobre o que o curso de Análise e '
        'Desenvolvimento de Sistemas trabalha: levantamento de requisitos com o cliente, modelagem de dados, '
        'desenvolvimento web, banco de dados, segurança e testes. E a solução cabe no orçamento de uma '
        'empresa pequena, porque roda sem custo mensal.'
    )

    # ------------------------------------------------------------------ 3
    H1('3. Partes Interessadas')
    H2('3.1 Coordenação do Curso de Análise e Desenvolvimento de Sistemas')
    L(['[[NOME DO(A) COORDENADOR(A) DO CURSO]]'])
    H2('3.2 Professor da UC Projeto Aplicado IV')
    L(['Gustavo Stangherlin Cantarelli'])
    H2('3.3 Cliente da aplicação')
    L(
        [
            '**Empresa:** DDA Metalúrgica, que usa o nome DDA Usinagem Industrial no sistema.',
            '**Segmento:** usinagem industrial (torneamento, fresamento, furação e rosqueamento).',
            '**Localização:** Santa Catarina.',
            '**Origem da demanda:** desafio publicado na plataforma SAGA SENAI de Inovação.',
            '**Quem usa o sistema na empresa:** almoxarifado, compras e PCP, supervisão da produção e TI, '
            'de 10 a 30 usuários.',
            f'**Instalação própria:** {{link:{URL_SISTEMA}|sicei-ddausinagem.vercel.app}}, com banco próprio '
            '(`sicei_dda`).',
        ]
    )
    P(
        'O SICEI é licenciado para a DDA, que não é dona do código. A titularidade do produto e o contato '
        'comercial ficam com a Benevides Soluções Industriais, nome fictício usado no projeto. Cada empresa '
        'que licencia o sistema recebe uma instalação separada, sem nada em comum com as outras.'
    )
    H2('3.4 Equipe do projeto (Grupo J)')
    L(
        [
            'Luciana da Silva Rafael',
            'Rafael Benevides dos Santos',
            'Turma GR ADSI 2024/2 1, Análise e Desenvolvimento de Sistemas (EaD), UniSENAI Santa Catarina.',
        ]
    )

    # ------------------------------------------------------------------ 4
    H1('4. Atores')
    P(
        'O SICEI tem quatro perfis de acesso, todos com login. Os perfis são cumulativos: o Almoxarife faz '
        'tudo o que a Consulta faz e mais o registro de movimentações; o Gestor faz tudo o que o Almoxarife '
        'faz e mais a gestão; o Administrador faz tudo. Por isso os diagramas de casos de uso (seção 7.1) '
        'mostram a herança entre os atores. Além dos perfis, há pessoas e sistemas que interagem com o SICEI '
        'sem login. Nenhum login usa e-mail: o Administrador cadastra o funcionário e o sistema gera o login '
        'no formato nome.sobrenome e uma senha provisória (RN-21).'
    )
    H2('4.1 Administrador')
    P(
        'Responsável pelo sistema na DDA, normalmente a TI. Cria e gerencia usuários (o sistema gera login e '
        'senha provisória), redefine senhas, desbloqueia e inativa contas, define os parâmetros do sistema '
        '(janela do consumo médio, tempo de sessão e e-mail dos avisos) e faz a importação inicial da '
        'planilha. Tem acesso a todos os cadastros, relatórios e ao log de auditoria. A conta criada na '
        'instalação é o **Administrador principal**: ninguém pode inativá-la, mudar o perfil dela ou redefinir '
        'a senha dela, e só ela cria ou altera outros Administradores (RN-21c).'
    )
    H2('4.2 Gestor')
    P(
        'Pessoa de compras, PCP ou supervisão. Cadastra pastilhas, fabricantes, fornecedores, destinos, '
        'colaboradores e posições; define estoque mínimo e máximo; faz estornos, ajustes e inventário; marca '
        'alertas como "ciente" quando o pedido já foi feito; vê relatórios, análise de consumo, sugestão de '
        'compra e o log de auditoria. Ao entrar, recebe um aviso com os alertas que ainda não têm ciente.'
    )
    H2('4.3 Almoxarife')
    P(
        'Quem opera o almoxarifado. Registra entradas (compra com nota fiscal e devolução da produção) e '
        'saídas (consumo da produção e perda ou quebra), consulta saldo, localização, histórico e preços, e '
        'imprime as etiquetas QR das gavetas. No celular, lê a etiqueta e registra a saída numa tela só.'
    )
    H2('4.4 Consulta')
    P(
        'Operador ou líder de produção. Só consulta saldo, posição dos itens, painel e alertas, e pode ler o '
        'QR da gaveta para abrir o item. Não registra nada e não vê preços (RN-05b).'
    )
    H2('4.5 Colaborador (sem login)')
    P(
        'Funcionário que retira ou devolve pastilhas no balcão. Fica cadastrado com nome, setor e matrícula, '
        'mas não acessa o sistema: quem registra a saída é o almoxarife, informando quem retirou (RN-11). É um '
        'ator indireto, por isso não aparece nos diagramas de casos de uso.'
    )
    H2('4.6 Avaliador (sem login)')
    P(
        'O professor ou qualquer pessoa que abra a página pública /testes, o Laboratório de testes. Ali ele '
        'executa os testes das regras de negócio no próprio navegador, cria casos de teste próprios e vê a '
        'demonstração do log inalterável (RNF-13). A página não acessa o banco nem mostra dados do estoque.'
    )
    H2('4.7 Atores de sistema')
    L(
        [
            '**Rotina diária (Vercel Cron):** chama /api/cron/diario às 06:00 UTC, protegida por segredo. '
            'Recalcula consumo médio, ponto de reposição, status e alertas de todos os itens e reenvia os '
            'avisos de e-mail que falharam.',
            '**Servidor de e-mail (SMTP corporativo):** recebe os avisos de item crítico ou zerado. Serve só '
            'para avisar e nunca é usado para login ou recuperação de senha (RN-19).',
        ]
    )
    H2('4.8 Matriz de permissões')
    P(
        'A matriz abaixo está implementada em `src/domain/permissoes.ts` e é conferida no servidor em toda '
        'operação. Esconder um botão na tela não conta como proteção.'
    )
    T(
        'Permissões por perfil (✓ pode · ver: só consulta · — sem acesso)',
        ['Funcionalidade', 'Admin.', 'Gestor', 'Almox.', 'Consulta'],
        [
            ['Gerir usuários, senhas e bloqueios (RF-02)', '✓', '—', '—', '—'],
            ['Parâmetros do sistema (RF-26)', '✓', '—', '—', '—'],
            ['Importação inicial (RF-25)', '✓', '—', '—', '—'],
            ['Cadastros: pastilhas, fabricantes, fornecedores, destinos, colaboradores, posições', '✓', '✓', 'ver', 'ver'],
            ['Preços e histórico de preços (RF-05a)', '✓', '✓', 'ver', '—'],
            ['Estoque mínimo e máximo (RF-12)', '✓', '✓', 'ver', 'ver'],
            ['Registrar entrada e saída (RF-07, RF-08)', '✓', '✓', '✓', '—'],
            ['Estorno (RF-09)', '✓', '✓', '—', '—'],
            ['Inventário e ajuste (RF-10)', '✓', '✓', '—', '—'],
            ['Saldo e painel (RF-11, RF-16)', '✓', '✓', '✓', '✓'],
            ['Alertas (RF-13)', '✓', '✓ (dá ciente)', 'ver', 'ver'],
            ['Histórico de movimentações (RF-15)', '✓', '✓', '✓', '—'],
            ['Relatórios, análise e exportação (RF-17 a RF-20)', '✓', '✓', '—', '—'],
            ['Log de auditoria e conferências (RF-21)', '✓', '✓', '—', '—'],
            ['Imprimir etiquetas QR (RF-22)', '✓', '✓', '✓', '—'],
        ],
        [5238, 1050, 1250, 1050, 1050],
        alinhamentos=['left', 'center', 'center', 'center', 'center'],
    )

    # ------------------------------------------------------------------ 5
    H1('5. Requisitos')
    P(
        'Os requisitos foram levantados a partir da demanda da DDA e validados com a empresa. Cada um aponta '
        'as regras de negócio (RN) que precisa respeitar, descritas na seção 5.3. A prioridade segue o método '
        'MoSCoW: **Must** é o que o sistema precisa ter para resolver o problema; **Should** é importante e '
        'entra se o prazo permitir. Todos os requisitos listados estão implementados. Os critérios de aceite '
        'de cada um, no formato Dado / Quando / Então, estão no documento 02 do repositório e viraram testes '
        'automatizados.'
    )
    H2('5.1 Requisitos Funcionais')
    T(
        'Requisitos funcionais do SICEI',
        ['ID', 'Requisito', 'Prioridade', 'Regras'],
        [
            ['RF-01', 'Autenticação com login gerado pelo sistema: entrar, sair, troca obrigatória da senha provisória e bloqueio após 5 tentativas sem sucesso.', 'Must', 'RN-21, RN-21a, RN-22'],
            ['RF-02', 'Gestão de usuários pelo Administrador: cadastrar (nome, sobrenome, setor, matrícula, perfil) com login e senha gerados pelo sistema, editar os dados, redefinir senha, desbloquear e inativar.', 'Must', 'RN-02, RN-21 a RN-21d, RN-22'],
            ['RF-03', 'Cadastro de pastilhas, com inativação e busca por código, descrição, ISO ou classe.', 'Must', 'RN-01, RN-02, RN-03'],
            ['RF-04', 'Cadastro de fabricantes.', 'Must', 'RN-02, RN-04'],
            ['RF-05', 'Cadastro de fornecedores e vínculo item ↔ fornecedor (vários por item, com código no fornecedor, lead time e preferencial).', 'Must', 'RN-02, RN-04, RN-05'],
            ['RF-05a', 'Consulta do item com a lista de fornecedores, o último preço de cada um e o histórico de preços ao expandir.', 'Must', 'RN-05a, RN-05b'],
            ['RF-06', 'Cadastro de destinos (setor, máquina, centro de custo).', 'Must', 'RN-02, RN-11'],
            ['RF-07', 'Registrar entrada: compra (com fornecedor, preço e nota fiscal) ou devolução da produção.', 'Must', 'RN-03, RN-05a, RN-06, RN-07, RN-09, RN-10, RN-11'],
            ['RF-08', 'Registrar saída: consumo da produção (com destino, OP e colaborador) ou perda e quebra.', 'Must', 'RN-03, RN-06, RN-07, RN-08, RN-09, RN-11'],
            ['RF-09', 'Estornar movimentação.', 'Must', 'RN-05a, RN-08, RN-09, RN-12'],
            ['RF-10', 'Inventário e ajuste de estoque.', 'Should', 'RN-09, RN-13'],
            ['RF-11', 'Consulta de saldo em tempo real, com status, posição e filtros, e busca tolerante ("pst1" acha PST-001).', 'Must', 'RN-06, RN-15, RN-17, RN-25'],
            ['RF-12', 'Configurar estoque mínimo e máximo por item.', 'Must', 'RN-14'],
            ['RF-13', 'Alertas no sistema: painel e contador de alertas abertos, com ciente do Gestor.', 'Must', 'RN-18, RN-19'],
            ['RF-14', 'Aviso por e-mail corporativo quando um item fica crítico ou zerado.', 'Must', 'RN-19'],
            ['RF-15', 'Histórico de movimentações com filtros por período, item, tipo, usuário, destino, colaborador e OP.', 'Must', 'RN-09'],
            ['RF-16', 'Painel geral: itens por status, alertas, consumo do mês, mais consumidos e últimas movimentações.', 'Must', 'RN-17'],
            ['RF-17', 'Relatório de consumo por item, destino, colaborador e período.', 'Must', 'RN-16'],
            ['RF-17a', 'Análise personalizada: página própria com filtros combináveis, comparação lado a lado e gráficos interativos.', 'Should', 'RN-09, RN-12, RN-17, RN-23'],
            ['RF-18', 'Relatório de movimentação (saldo inicial, entradas, saídas e saldo final).', 'Must', 'RN-09'],
            ['RF-19', 'Relatório de necessidade de reposição (sugestão de compra).', 'Must', 'RN-03, RN-15, RN-16, RN-20'],
            ['RF-20', 'Exportar relatórios em CSV e PDF.', 'Should', 'RN-23'],
            ['RF-21', 'Log de auditoria consultável, verificação de integridade e conferência de saldo.', 'Must', 'RN-09, RN-09a, RN-09b, RN-23, RN-24'],
            ['RF-22', 'Gerar e imprimir etiquetas QR por posição; ler o QR com a câmera do celular abre o item.', 'Must', 'RN-26'],
            ['RF-25', 'Importação inicial da planilha atual (itens e saldo) por CSV, com prévia dos erros.', 'Must', 'RN-06, RN-09'],
            ['RF-26', 'Parâmetros do sistema: janela do consumo médio, tempo de sessão e e-mail corporativo dos avisos.', 'Must', 'RN-16, RN-19, RN-22'],
            ['RF-27', 'Cadastro de colaboradores (nome, matrícula, setor), sem login.', 'Must', 'RN-02, RN-04, RN-11'],
            ['RF-28', 'Cadastro de posições (armário, gaveta, compartimento) e atribuição de item à posição.', 'Must', 'RN-02, RN-25'],
        ],
        [900, 5838, 1100, 1800],
        alinhamentos=['left', 'left', 'center', 'left'],
        texto_fonte='Elaborado pela equipe (2026), a partir do documento 02 (Requisitos, versão 1.14).',
    )
    P(
        'Os números RF-23 (API REST para integrações) e RF-24 (integração com ERP, compras e produção) foram '
        'retirados do escopo e não são reaproveitados, para não confundir referências antigas.'
    )
    P(
        'Para mostrar como os requisitos ficaram testáveis, estes são três dos nove critérios de aceite do '
        'RF-08, cada um coberto por teste automatizado:'
    )
    L(
        [
            '**Dado** um item com saldo 12, **quando** o almoxarife lança um consumo de 4 unidades para o torno '
            'CNC 03, OP 2026-0457, retirado por Carlos Pereira, **então** o saldo passa a 8, o status é '
            'recalculado e a movimentação guarda destino, OP e colaborador.',
            '**Dado** um item com saldo 3, **quando** alguém tenta tirar 5, **então** a saída é recusada com a '
            'mensagem "saldo disponível: 3".',
            '**Dado** um item com saldo 5 e duas saídas de 4 enviadas ao mesmo tempo, **quando** o sistema '
            'processa, **então** uma é aceita e a outra recusada, e o saldo final é 1, nunca −3.',
        ]
    )

    H2('5.2 Requisitos Não Funcionais')
    P(
        'Cada requisito não funcional diz como é verificado. A última coluna aponta o que existe hoje no SICEI '
        'para atendê-lo.'
    )
    T(
        'Requisitos não funcionais do SICEI',
        ['ID', 'Categoria', 'Requisito', 'Como é atendido e verificado'],
        [
            ['RNF-01', 'Usabilidade', 'Interface em português, simples para um almoxarife novo usar sem treinamento formal. Registrar uma saída a partir do QR leva uma única tela.', 'Saída pela etiqueta numa tela, com quantidade, destino em botões, OP e colaborador; roteiro ponta a ponta no celular (360 px).'],
            ['RNF-02', 'Compatibilidade', 'Funciona em computador e celular (a partir de 360 px) nas versões atuais de Chrome, Edge, Firefox e Safari; tabelas sem rolagem lateral quando cabem na tela.', 'Testes Playwright em 360 px e 1366 px; um teste confere que nenhuma tabela das telas principais rola de lado em 1366 px.'],
            ['RNF-03', 'Desempenho', 'Consulta de saldo e listagens em menos de 2 s (p95), com 30 usuários, até 5 mil itens e 1 milhão de movimentações.', 'Saldo, ponto de reposição e status guardados no item; índices por item, tipo, destino, colaborador e data; paginação no servidor. Medição prevista: teste de carga com massa sintética.'],
            ['RNF-04', 'Confiabilidade', 'Saldo sempre consistente: cada movimentação é uma transação completa. Backup diário guardado por 30 dias, com restauração testada.', 'Transação única com SELECT ... FOR UPDATE; testes de integração com 2 e 10 saídas simultâneas. Backup por pg_dump e restauração documentados no doc 06, além da restauração do Neon.'],
            ['RNF-05', 'Segurança', 'HTTPS obrigatório, senhas com Argon2id, permissão conferida no servidor, proteção contra o OWASP Top 10, sessão com expiração e limite de tentativas por IP.', 'HSTS e CSP com nonce no proxy.ts; Argon2id; exigirPermissao em todo service; 20 tentativas por IP a cada 15 min; testes de integração de cada ação com cada perfil; revisão no doc 04.'],
            ['RNF-06', 'Privacidade (LGPD)', 'Só os dados pessoais necessários; nenhum e-mail pessoal; finalidade documentada.', 'Usuário: nome, sobrenome, setor, matrícula e login. Colaborador: nome, setor e matrícula. Finalidade: identificar quem fez cada movimentação.'],
            ['RNF-07', 'Custo', 'Até cerca de R$ 100 por mês, sem licença paga obrigatória.', 'R$ 0 por mês: Vercel Hobby, Neon Free e GitHub; todas as bibliotecas são de código aberto.'],
            ['RNF-08', 'Manutenibilidade', 'Código no Git, integração contínua e documentação atualizada; toda regra com teste unitário e ≥ 90% de cobertura de linhas no domínio.', 'GitHub Actions em todo push (lint, tipos, unidade, integração, ponta a ponta); 803 testes unitários, 99,4% das linhas cobertas e 100% em src/domain.'],
            ['RNF-10', 'Acessibilidade', 'Contraste e teclado nas telas principais (WCAG 2.1 AA); status nunca só por cor.', 'Selo de status com texto e cor (testado com Testing Library); gráficos com teclado, descrição e "Ver dados em tabela"; paleta validada para daltonismo.'],
            ['RNF-11', 'Observabilidade', 'Logs técnicos estruturados de erros e acessos, separados do log de auditoria.', 'Erros e rotina diária gravados como JSON em uma linha na saída padrão, recolhida pela Vercel; o audit_log fica só para o negócio.'],
            ['RNF-12', 'Retenção', 'Movimentações, preços e log guardados por 7 anos, sem prejudicar o RNF-03.', 'Nenhuma rotina apaga histórico; estimativa de 500 mil movimentações em 7 anos, abaixo do limite do RNF-03.'],
            ['RNF-13', 'Testes demonstráveis', 'O avaliador executa os testes das regras e cria os próprios casos na web, sem instalar nada e sem login, e vê o relatório completo com a cobertura.', 'Página /testes (Laboratório) e /relatorio-testes, gerados a cada publicação; o build só publica se todos os testes passarem.'],
        ],
        [900, 1350, 3600, 3788],
        texto_fonte='Elaborado pela equipe (2026), a partir do documento 02 (Requisitos) e do código do SICEI.',
    )
    P('O RNF-09 (interoperabilidade com ERP) saiu do escopo junto com os RF-23 e RF-24.')

    H2('5.3 Regras de Negócio')
    P(
        'As regras de negócio dizem o que o sistema precisa respeitar, independentemente de como é '
        'construído. Foram validadas com a DDA (documento 01, versão 1.7). Toda regra tem pelo menos um teste '
        'unitário com o identificador no nome, e os exemplos numéricos abaixo são casos de teste.'
    )
    T(
        'Termos do domínio',
        ['Termo', 'Significado no SICEI'],
        [
            ['Pastilha (item)', 'Inserto intercambiável de metal duro, cermet ou cerâmica. Cada modelo é um item, identificado pelo código interno.'],
            ['Especificação ISO e classe', 'Geometria padronizada (ex.: CNMG 120408) e material e cobertura (ex.: P25). Mesma ISO com classe diferente é outro item.'],
            ['Fornecedor preferencial e lead time', 'Primeira opção de compra de um item e prazo, em dias, entre o pedido e a chegada.'],
            ['Posição', 'Endereço físico de um compartimento: Armário → Gaveta → Compartimento, no formato A01-G03-C04.'],
            ['Destino e OP', 'Setor, máquina ou centro de custo que recebeu a pastilha, e a ordem de produção da retirada.'],
            ['Saldo, mínimo e ponto de reposição', 'Quantidade disponível; quantidade que torna o item crítico; quantidade em que já é hora de comprar.'],
            ['Movimentação', 'Evento que muda o saldo: entrada, saída, ajuste ou estorno.'],
        ],
        [2600, 7038],
        destaque_primeira_coluna=True,
        texto_fonte='Elaborado pela equipe (2026), a partir do documento 01 (Regras de Negócio).',
    )
    T(
        'Tipos de movimentação',
        ['Tipo', 'Saldo', 'Quem lança', 'Campos obrigatórios além do básico'],
        [
            ['COMPRA', 'soma', 'Almoxarife, Gestor, Admin', 'fornecedor vinculado ao item, preço unitário, nota fiscal'],
            ['DEVOLUCAO_PRODUCAO', 'soma', 'Almoxarife, Gestor, Admin', 'destino, colaborador que devolveu, motivo'],
            ['AJUSTE_POSITIVO', 'soma', 'Gestor, Admin', 'justificativa'],
            ['CONSUMO_PRODUCAO', 'subtrai', 'Almoxarife, Gestor, Admin', 'destino, ordem de produção, colaborador que retirou'],
            ['PERDA_QUEBRA', 'subtrai', 'Almoxarife, Gestor, Admin', 'motivo'],
            ['AJUSTE_NEGATIVO', 'subtrai', 'Gestor, Admin', 'justificativa'],
            ['ESTORNO', 'inverso da original', 'Gestor, Admin', 'movimentação original, justificativa'],
        ],
        [2500, 1500, 2300, 3338],
        texto_fonte='Elaborado pela equipe (2026), a partir do documento 01 (Regras de Negócio).',
    )
    T(
        'Regras de negócio do SICEI',
        ['ID', 'Regra', 'O que o sistema garante'],
        [
            ['', '**Cadastros**', ''],
            ['RN-01', 'Código interno único', 'Código obrigatório e único, travado depois da primeira movimentação. O sistema sugere o próximo da sequência (PST-007) e recusa o mesmo código escrito de outro jeito ("pst1" = PST-001).'],
            ['RN-02', 'Nada com histórico é apagado', 'Cadastro que já aparece em movimentação ou no log só é inativado. Cadastro nunca usado pode ser excluído, e a exclusão vai para o log.'],
            ['RN-03', 'Item inativo fica congelado', 'Não recebe movimentação, não gera alerta nem entra na sugestão de compra. Só inativa com saldo zero e libera a posição.'],
            ['RN-04', 'Documentos válidos e sem duplicidade', 'CNPJ com dígitos verificadores válidos e único; nome de fabricante único sem diferenciar maiúsculas; matrícula de colaborador única.'],
            ['RN-05', 'Todos os fornecedores do item', 'Item ativo tem pelo menos um fornecedor; cada vínculo guarda código no fornecedor, lead time e último preço; um pode ser preferencial.'],
            ['RN-05a', 'Histórico de preços permanente', 'Toda COMPRA registra o preço, que nunca é sobrescrito. Se a última compra for estornada, o último preço volta ao da compra anterior válida.'],
            ['RN-05b', 'Comparar fornecedores', 'Fornecedores do menor para o maior último preço, sem compras no fim; histórico com variação percentual. O perfil Consulta não vê preços.'],
            ['RN-25', 'Endereçamento no almoxarifado', 'Posição de 3 níveis (A01-G03-C04); um item por compartimento e uma posição por item ativo; "a1g3c4" é lido como A01-G03-C04.'],
            ['RN-26', 'Etiqueta QR', 'Etiqueta por posição ocupada; o QR abre o item para quem está logado. Item que muda de posição deixa a etiqueta pendente até ser impressa.'],
            ['', '**Movimentações e saldo**', ''],
            ['RN-06', 'Saldo vem das movimentações', 'Ninguém digita o saldo: é a soma das entradas menos as saídas, com os estornos.'],
            ['RN-07', 'Quantidades inteiras e positivas', 'Controle por unidade; entrada em caixas é convertida (3 caixas de 10 = 30 unidades).'],
            ['RN-08', 'Saldo nunca fica negativo', 'Saída maior que o saldo é recusada com "saldo disponível: N", mesmo com duas pessoas ao mesmo tempo. Vale também para estorno de entrada.'],
            ['RN-09', 'Rastreabilidade total', 'Cada movimentação grava usuário, data e hora do servidor, saldo anterior e posterior, IP e dispositivo.'],
            ['RN-09a', 'Log inalterável', 'O log só recebe registros novos; cada um guarda o hash do anterior, e a verificação aponta onde a cadeia quebrou.'],
            ['RN-09b', 'Conferência do saldo', 'Gestor e Administrador comparam o saldo de cada item com a soma das movimentações; diferenças aparecem como divergência.'],
            ['RN-10', 'Entrada por compra', 'Exige fornecedor vinculado ao item, preço unitário maior que zero e número da nota fiscal.'],
            ['RN-11', 'Saída e devolução', 'Consumo exige destino, OP e colaborador; devolução exige destino, colaborador e motivo; perda exige motivo.'],
            ['RN-12', 'Movimentação não se edita, se estorna', 'Estorno aponta para a original, exige justificativa e lança o efeito contrário. Uma vez só, e estorno não se estorna.'],
            ['RN-13', 'Ajuste por inventário', 'O Gestor informa a contagem e o sistema lança o ajuste da diferença; se bater, só registra a conferência no log.'],
            ['', '**Níveis de estoque e alertas**', ''],
            ['RN-14', 'Estoque mínimo obrigatório', 'Todo item ativo tem mínimo (pode ser zero); máximo opcional, maior que o mínimo; mudanças vão para o log.'],
            ['RN-15', 'Ponto de reposição', 'mínimo + consumo médio diário × lead time (do preferencial, ou do fornecedor de menor último preço), arredondado para cima. Ex.: 20 + 3 × 7 = 41.'],
            ['RN-16', 'Consumo médio diário', 'Soma dos consumos da produção nos últimos N dias ÷ N (padrão 90), sem estornos, perdas nem ajustes. Ex.: 270 ÷ 90 = 3 por dia.'],
            ['RN-17', 'Status do item', 'ZERADO (saldo 0), CRÍTICO (≤ mínimo), ATENÇÃO (≤ ponto de reposição) ou OK, nessa ordem.'],
            ['RN-18', 'Alertas sem repetição', 'Um alerta aberto por item: sobe de nível se piorar, atualiza se melhorar sem sair do alerta e fecha sozinho quando volta a OK.'],
            ['RN-19', 'Onde os alertas aparecem', 'No painel, com contador no topo, para todos os perfis; e-mail corporativo quando o item entra em CRÍTICO ou ZERADO.'],
            ['RN-20', 'Sugestão de compra', 'Alvo = máximo (ou ponto de reposição + consumo × 30); sugestão = alvo − saldo, arredondada em caixas. Ex.: 131 − 35 = 96 → 100.'],
            ['', '**Acesso e auditoria**', ''],
            ['RN-21', 'Login e senha gerados', 'Sem autocadastro e sem e-mail. Login nome.sobrenome sem acentos e partículas (Maria Aparecida de Souza → maria.souza); senha provisória de 12 caracteres, mostrada uma vez.'],
            ['RN-21a', 'Troca obrigatória', 'No primeiro acesso e depois de redefinir, o usuário só usa o sistema depois de criar a própria senha.'],
            ['RN-21b', 'Login único e desligamento', 'Login nunca é reaproveitado; inativar a conta encerra na hora todas as sessões.'],
            ['RN-21c', 'Administrador principal', 'Conta do dono, única e protegida também no banco; só ela cria ou altera Administradores. Tentativas recusadas vão para o log.'],
            ['RN-21d', 'Um login por funcionário', 'Matrícula obrigatória e única por login; nome gravado como nome próprio ("LUCIANA DA SILVA" → "Luciana da Silva").'],
            ['RN-22', 'Senha e bloqueio', 'Bloqueio após 5 erros seguidos; senha com 10 caracteres ou mais, diferente do login e das 3 últimas; sessão expira por inatividade.'],
            ['RN-23', 'Tudo o que importa vai para o log', 'Login e falhas, cadastros com antes e depois, posições, usuários, estornos, ajustes, parâmetros, importação, exportação, etiquetas e verificações.'],
            ['RN-24', 'Retenção de 7 anos', 'Movimentações, preços e log ficam pelo menos 7 anos e só saem por rotina de arquivamento aprovada.'],
        ],
        [900, 2600, 6138],
        texto_fonte='Elaborado pela equipe (2026), a partir do documento 01 (Regras de Negócio, versão 1.7).',
    )
    P(
        'As fórmulas das regras RN-15, RN-16 e RN-20, com os exemplos validados pela DDA, ficam assim. Nos '
        'últimos 90 dias saíram 270 unidades de um item para a produção, então o consumo médio é 270 ÷ 90 = 3 '
        'por dia. Com mínimo de 20 e lead time de 7 dias, o ponto de reposição é 20 + 3 × 7 = 41. Se o saldo '
        'for 35, sem máximo e com caixas de 10, a quantidade alvo é 41 + 3 × 30 = 131 e a sugestão é 131 − 35 '
        '= 96, arredondada para 100 unidades (10 caixas). Esses três números são casos de teste no código e '
        'podem ser recalculados pelo avaliador no Laboratório.'
    )

    # ------------------------------------------------------------------ 6
    H1('6. Diagrama de Modelo Entidade e Relacionamento')
    P(
        'O modelo de dados é físico: mostra as 16 tabelas do PostgreSQL como estão no banco de produção, '
        'com os tipos de cada coluna, as chaves primárias (PK), estrangeiras (FK) e únicas (UK). A notação é a '
        'de pé de galinha: a barra indica "um" e o pé de galinha indica "muitos"; o círculo indica que o lado '
        'é opcional. Atributos marcados com ● são obrigatórios (NOT NULL). O modelo foi desenhado a partir do '
        '`prisma/schema.prisma` e das migrations do repositório, e as restrições que o Prisma não expressa '
        '(CHECKs, índices parciais e triggers) estão nas migrations em SQL.'
    )
    b.append(PAISAGEM)
    F('der', 'Diagrama de Entidade e Relacionamento do SICEI (PostgreSQL)', paisagem=True)
    b.append(RETRATO)
    P('As tabelas se dividem em quatro grupos:')
    L(
        [
            '**Cadastros:** `fabricante`, `fornecedor`, `item`, `item_fornecedor` (o vínculo N:N entre item e '
            'fornecedor, com lead time, preferencial e último preço), `posicao`, `destino` e `colaborador`.',
            '**Movimentação e alertas:** `movimentacao` liga o item ao usuário que registrou e, conforme o '
            'tipo, ao fornecedor (compra), ao destino e ao colaborador (saída e devolução). O autorrelacionamento '
            '`estorna_id` aponta o estorno para a movimentação original. `alerta` e `notificacao` guardam os '
            'alertas de estoque e a fila de e-mails (outbox).',
            '**Acesso:** `usuario`, `sessao` (só o hash SHA-256 do token), `historico_senha` (para recusar as 3 '
            'últimas senhas) e `tentativa_login` (limite de tentativas por IP).',
            '**Auditoria e configuração:** `audit_log`, encadeado por hash, e `parametro`. O `usuario_id` do log '
            'é uma referência lógica, sem chave estrangeira, para que o log continue íntegro mesmo que um dia '
            'um usuário nunca usado seja excluído.',
        ]
    )
    P('Algumas decisões do modelo valem a explicação:')
    L(
        [
            '**O saldo fica guardado no item** (`item.saldo`), atualizado na mesma transação da movimentação, para a '
            'consulta não precisar somar milhares de linhas (RNF-03). A soma das movimentações continua sendo a '
            'fonte da verdade, e a conferência da RN-09b compara as duas.',
            '**O histórico de preços não tem tabela própria:** é a lista das movimentações COMPRA de cada item e '
            'fornecedor. O `ultimo_preco` do vínculo é um atalho, recalculado a cada compra ou estorno.',
            '**Identificadores** são UUID v7, que crescem com o tempo e ajudam os índices. O `audit_log` usa uma '
            'sequência numérica, porque a cadeia de hash precisa de uma ordem sem ambiguidade.',
            '**Datas** são `timestamptz`, gravadas pelo servidor, e **preços** são `numeric(12,2)`, nunca ponto '
            'flutuante.',
        ]
    )
    T(
        'Regras de negócio garantidas também pelo banco de dados',
        ['Restrição no PostgreSQL', 'Tabela', 'Regra'],
        [
            ['CHECK (saldo >= 0)', 'item', 'RN-08: última defesa contra saldo negativo'],
            ['CHECK (estoque_maximo IS NULL OR estoque_maximo > estoque_minimo)', 'item', 'RN-14'],
            ['CHECK (quantidade > 0) e CHECKs de campos por tipo (COMPRA exige fornecedor, preço e NF)', 'movimentacao', 'RN-07, RN-10, RN-11'],
            ['Índice único em estorna_id', 'movimentacao', 'RN-12: uma movimentação só é estornada uma vez'],
            ['Trigger BEFORE UPDATE OR DELETE e sem TRUNCATE; usuário da aplicação só com SELECT e INSERT', 'movimentacao, audit_log', 'RN-09a, RN-12: histórico imutável'],
            ['Índice único parcial (item_id) WHERE fechado_em IS NULL', 'alerta', 'RN-18: um alerta aberto por item'],
            ['Índice único parcial (item_id) WHERE preferencial', 'item_fornecedor', 'RN-05: um preferencial por item'],
            ['Índices únicos em codigo, cnpj, nome_chave, login, matricula', 'várias', 'RN-01, RN-04, RN-21b, RN-21d'],
            ['Índice único parcial (principal) WHERE principal e trigger de proteção', 'usuario', 'RN-21c: um só Administrador principal'],
        ],
        [4638, 1800, 3200],
        texto_fonte='Elaborado pela equipe (2026), a partir das migrations em prisma/migrations.',
    )

    # ------------------------------------------------------------------ 7
    H1('7. Diagramas UML')
    P(
        'Os diagramas desta seção foram escritos em PlantUML, uma linguagem de texto para diagramas UML, e '
        'ficam versionados no repositório (`docs/entrega-pa4/diagramas`) ao lado do código que descrevem. Cada '
        'arquivo cita no cabeçalho os módulos do SICEI de onde saiu. Eles estão no documento em formato '
        'vetorial (SVG), então é possível ampliar o PDF sem perder nitidez. São três visões que se completam:'
    )
    L(
        [
            '**casos de uso** (7.1): o que cada ator faz no sistema, ligado aos requisitos funcionais;',
            '**atividades** (7.2): o passo a passo dos fluxos mais importantes, incluindo as decisões e quem '
            'executa cada passo;',
            '**classes** (7.3): a estrutura do domínio, com atributos, operações e associações.',
        ]
    )
    H2('7.1 Diagrama de Use-Case')
    P(
        'Os 39 casos de uso foram divididos em dois diagramas para ficarem legíveis. O primeiro trata da '
        'operação do dia a dia (acesso, consulta e movimentação do estoque); o segundo, da gestão, da '
        'administração, das rotinas automáticas e do Laboratório de testes. A seta de herança entre atores '
        'mostra que os perfis são cumulativos: o Almoxarife herda os casos de uso da Consulta, o Gestor herda '
        'os do Almoxarife e o Administrador herda os do Gestor. Os relacionamentos «include» marcam o que '
        'sempre acontece junto (toda movimentação grava auditoria e recalcula o status do item) e os '
        '«extend» marcam o que acontece só em certas condições, escritas entre colchetes.'
    )
    F('casos-de-uso-operacao', 'Casos de uso (1/2): operação do estoque')
    F('casos-de-uso-gestao', 'Casos de uso (2/2): gestão, administração e testes')
    T(
        'Casos de uso, atores e requisitos',
        ['UC', 'Caso de uso', 'Ator principal', 'Requisitos'],
        [
            ['UC01', 'Entrar no sistema', 'Todos os perfis', 'RF-01'],
            ['UC02', 'Trocar a senha provisória', 'Todos os perfis', 'RF-01'],
            ['UC03', 'Sair do sistema', 'Todos os perfis', 'RF-01'],
            ['UC04', 'Consultar saldo, status e posição dos itens', 'Consulta', 'RF-11'],
            ['UC05', 'Ver painel geral', 'Consulta', 'RF-16'],
            ['UC06', 'Ver alertas abertos', 'Consulta', 'RF-13'],
            ['UC07', 'Ler QR da etiqueta da gaveta', 'Consulta', 'RF-22'],
            ['UC08', 'Registrar entrada (compra ou devolução)', 'Almoxarife', 'RF-07'],
            ['UC09', 'Registrar saída (consumo ou perda)', 'Almoxarife', 'RF-08'],
            ['UC10', 'Consultar histórico de movimentações', 'Almoxarife', 'RF-15'],
            ['UC11', 'Ver fornecedores e histórico de preços', 'Almoxarife', 'RF-05a'],
            ['UC12', 'Imprimir etiquetas QR', 'Almoxarife', 'RF-22'],
            ['UC13', 'Estornar movimentação', 'Gestor', 'RF-09'],
            ['UC14', 'Registrar inventário e ajuste', 'Gestor', 'RF-10'],
            ['UC15', 'Marcar alerta como ciente', 'Gestor', 'RF-13'],
            ['UC16', 'Cadastrar fornecedor na hora da compra', 'Gestor', 'RF-07'],
            ['UC17', 'Gravar registro de auditoria encadeado', 'Sistema (incluído)', 'RF-21'],
            ['UC18', 'Recalcular ponto de reposição, status e alerta', 'Sistema (incluído)', 'RF-11, RF-13'],
            ['UC19', 'Enviar aviso de item crítico ou zerado', 'Servidor SMTP', 'RF-14'],
            ['UC20', 'Manter pastilhas', 'Gestor', 'RF-03'],
            ['UC21', 'Manter fabricantes', 'Gestor', 'RF-04'],
            ['UC22', 'Manter fornecedores e vínculos com itens', 'Gestor', 'RF-05'],
            ['UC23', 'Manter destinos', 'Gestor', 'RF-06'],
            ['UC24', 'Manter colaboradores', 'Gestor', 'RF-27'],
            ['UC25', 'Manter posições e atribuir item', 'Gestor', 'RF-28'],
            ['UC26', 'Definir estoque mínimo e máximo', 'Gestor', 'RF-12'],
            ['UC27', 'Gerar relatórios de consumo, movimentação e reposição', 'Gestor', 'RF-17, RF-18, RF-19'],
            ['UC28', 'Analisar consumo com filtros e gráficos', 'Gestor', 'RF-17a'],
            ['UC29', 'Exportar CSV ou imprimir PDF', 'Gestor', 'RF-20'],
            ['UC30', 'Consultar log de auditoria', 'Gestor', 'RF-21'],
            ['UC31', 'Verificar integridade e conferir saldos', 'Gestor', 'RF-21'],
            ['UC32', 'Gerenciar usuários', 'Administrador', 'RF-02'],
            ['UC33', 'Definir parâmetros do sistema', 'Administrador', 'RF-26'],
            ['UC34', 'Importar planilha inicial por CSV', 'Administrador', 'RF-25'],
            ['UC35', 'Recalcular pontos de reposição, status e alertas de todos os itens', 'Rotina diária', 'RF-11, RF-13'],
            ['UC36', 'Reenviar avisos de e-mail pendentes', 'Rotina diária', 'RF-14'],
            ['UC37', 'Executar os testes das regras no navegador', 'Avaliador', 'RNF-13'],
            ['UC38', 'Criar casos de teste próprios', 'Avaliador', 'RNF-13'],
            ['UC39', 'Demonstrar o log inalterável', 'Avaliador', 'RNF-13'],
        ],
        [850, 5288, 2000, 1500],
        sz=17,
    )
    P(
        'O caso de uso mais usado no dia a dia é o UC09, a saída de pastilhas. A especificação abaixo mostra '
        'o fluxo principal e as alternativas, todas tratadas no código.'
    )
    T(
        'Especificação do caso de uso UC09 – Registrar saída',
        ['Item', 'Descrição'],
        [
            ['Ator principal', 'Almoxarife (também Gestor e Administrador, por herança).'],
            ['Atores secundários', 'Servidor SMTP, quando a saída deixa o item crítico ou zerado.'],
            ['Pré-condições', 'Usuário logado, com a senha provisória já trocada; item ativo; destino e colaborador ativos cadastrados.'],
            ['Fluxo principal', '1. O almoxarife lê o QR da gaveta (UC07) ou escolhe o item pela busca.\n2. O sistema abre o item com o botão "Registrar saída".\n3. O almoxarife informa quantidade, destino, ordem de produção e colaborador que retirou.\n4. A tela mostra a prévia do saldo e do status depois da saída.\n5. O almoxarife confirma.\n6. O servidor confere sessão, campos e permissão, trava a linha do item e confere o saldo.\n7. O sistema grava a movimentação, atualiza o saldo, recalcula status e alerta (UC18) e grava a auditoria (UC17).\n8. A tela mostra o saldo antes e agora e oferece ler outra etiqueta.'],
            ['Fluxos alternativos', 'A1. Câmera negada ou ausente: a tela explica e aceita o código da posição digitado ("a1g3c4").\nA2. QR que não é do SICEI: a tela avisa e continua lendo, sem sair do sistema.\nA3. Quantidade maior que o saldo: a tela bloqueia o botão; se o pedido chegar ao servidor, ele recusa com "saldo disponível: N".\nA4. Duas saídas do mesmo item ao mesmo tempo: a segunda espera a primeira e é conferida contra o saldo novo.\nA5. Falta destino, OP ou colaborador: o servidor devolve o erro de cada campo.\nA6. Item ficou crítico ou zerado: o aviso vai para a fila e o e-mail sai depois da resposta (UC19); falha no envio não desfaz a saída.'],
            ['Pós-condições', 'Movimentação gravada com saldo anterior e posterior, usuário, data e hora do servidor, IP e dispositivo; saldo, status e alerta atualizados; registro no log encadeado.'],
            ['Regras', 'RN-03, RN-07, RN-08, RN-09, RN-11, RN-15 a RN-19.'],
        ],
        [2200, 7438],
        destaque_primeira_coluna=True,
    )

    H2('7.2 Diagrama de Atividades')
    P(
        'Três fluxos foram modelados com diagramas de atividades em raias (swimlanes), que mostram quem '
        'executa cada passo. O primeiro e o segundo descrevem juntos a saída de pastilhas, que é o caso de uso '
        'principal: o primeiro do ponto de vista do almoxarife, no celular; o segundo dentro do servidor, onde '
        'está a garantia de que o saldo nunca fica negativo. O terceiro descreve a entrada no sistema, com as '
        'proteções de senha e bloqueio.'
    )
    F('atividades-saida-qr', 'Atividades (1/3): registrar saída pela etiqueta QR, no celular')
    P(
        'A leitura do QR acontece no próprio aparelho: o navegador usa o leitor nativo (BarcodeDetector) '
        'quando existe e, nos outros, como o Safari do iPhone, a biblioteca jsQR. Nenhuma imagem da câmera vai '
        'ao servidor. O QR guarda o endereço da posição, não do item, então a etiqueta continua certa mesmo '
        'que o item mude de gaveta. A prévia do saldo usa as mesmas funções do domínio que o servidor usa, mas '
        'só ajuda quem digita: quem decide é o servidor.'
    )
    F('atividades-gravar-saida', 'Atividades (2/3): gravar a saída sem deixar o saldo negativo')
    P(
        'O ponto central é o `SELECT ... FOR UPDATE`: ele trava a linha do item até o fim da transação. Se '
        'duas pessoas tentam tirar o mesmo item no mesmo segundo, a segunda espera a primeira terminar e só '
        'então confere o saldo. Movimentação, saldo, alerta, fila de e-mail e auditoria são gravados na mesma '
        'transação: ou grava tudo, ou não grava nada. O e-mail sai depois da resposta, para que uma falha no '
        'servidor de e-mail nunca desfaça a saída.'
    )
    b.append(PAISAGEM)
    F('atividades-login', 'Atividades (3/3): entrar no sistema', paisagem=True)

    H2('7.3 Diagrama de Classes')
    P(
        'O diagrama de classes foi dividido em duas partes: o domínio do estoque e o domínio de acesso e '
        'auditoria. Os atributos são os dos modelos do Prisma. As operações levam o nome real das funções '
        'puras de `src/domain/`, explicadas logo depois dos diagramas.',
    )
    F('classes-estoque', 'Classes (1/2): estoque, movimentação e alertas', paisagem=True, altura=12.3)
    F('classes-acesso', 'Classes (2/2): acesso, segurança e auditoria', paisagem=True)
    b.append(RETRATO)
    P(
        'O SICEI é escrito em TypeScript e não usa classes com métodos para o domínio. As regras ficam em '
        'funções puras, que recebem dados e devolvem uma decisão, sem acessar banco nem framework. Isso tem um '
        'motivo prático: a mesma função roda no servidor, na prévia da tela, nos testes do Vitest e no '
        'Laboratório de testes, no navegador do avaliador. No diagrama, cada função aparece como operação da '
        'classe cuja regra ela implementa. Alguns exemplos:'
    )
    L(
        [
            '`Item.pontoDeReposicao()` e `Item.statusDoItem()`, em `domain/estoque.ts`, implementam a RN-15 e a '
            'RN-17;',
            '`Movimentacao.avaliarMovimentacao()` e `avaliarEstorno()`, em `domain/movimentacao.ts`, decidem se '
            'uma saída ou um estorno pode ser feito e qual o saldo resultante (RN-08, RN-12);',
            '`Alerta.decidirAlerta()`, em `domain/alertas.ts`, devolve abrir, escalar, atualizar, fechar ou '
            'nada (RN-18);',
            '`Usuario.gerarLogin()` e `podeAgirSobreUsuario()` implementam a RN-21 e a proteção do '
            'Administrador principal (RN-21c);',
            '`AuditLog.calcularHash()` e `verificarCadeia()`, em `domain/auditoria.ts`, encadeiam e conferem o '
            'log com SHA-256 da Web Crypto (RN-09a).',
        ]
    )
    P(
        'A classe `ItemFornecedor` é uma classe de associação: o vínculo entre um item e um fornecedor tem '
        'dados próprios (lead time, preferencial, último preço). `Movimentacao` e `AuditLog` estão marcadas '
        'como «imutável» porque o banco recusa UPDATE e DELETE nelas. A classe `Permissoes` reúne a matriz '
        'perfil × permissão da seção 4.8, que todo service consulta antes de agir.'
    )

    # ------------------------------------------------------------------ 8
    H1('8. Proposta de Solução Tecnológica Escolhida')
    P(
        'O SICEI é uma aplicação web responsiva construída como **monólito modular**: um único projeto '
        'Next.js serve as telas e executa as regras de negócio no servidor, com um banco PostgreSQL por trás. '
        'Com 10 a 30 usuários e alguns milhares de itens, separar front-end e back-end, usar microsserviços '
        'ou filas externas só traria custo e complexidade. Um projeto só é mais barato de hospedar, mais fácil '
        'de testar e mais simples de manter, que é o que pede o RNF-07. O Quadro 11 mostra cada tecnologia, '
        'onde e como é usada e por que foi escolhida. As versões são as do `package.json` do repositório.'
    )
    T(
        'Tecnologias do SICEI: onde, como e por quê',
        ['Tecnologia', 'Onde é aplicada', 'Como é usada', 'Por que foi escolhida'],
        [
            ['TypeScript 5.9 (modo strict)', 'Todo o código: telas, servidor, domínio, testes e scripts.', 'Tipos em todas as camadas, inclusive os gerados pelo Prisma a partir do banco.', 'Uma linguagem só no projeto; os tipos pegam erros antes de rodar.'],
            ['Next.js 16 (App Router) e React 19', 'Telas (src/app), Server Actions e rotas como a rotina diária.', 'Server Components buscam dados no servidor; Server Actions recebem os formulários e chamam os services.', 'Telas e servidor no mesmo projeto, sem manter uma API REST, que ficou fora do escopo.'],
            ['PostgreSQL (17 no Neon, 16 na CI)', 'Banco de dados de produção e de testes.', 'Transações, SELECT ... FOR UPDATE, CHECKs, triggers e índices únicos parciais.', 'Resolve no banco as regras mais sensíveis (saldo negativo, imutabilidade, um alerta por item).'],
            ['Prisma ORM 7 com @prisma/adapter-pg', 'Camada de dados (src/server) e migrations (prisma/).', 'Modelo tipado e migrations versionadas; $queryRaw parametrizado para lock, triggers e permissões.', 'Produtividade com tipos, sem abrir mão do SQL onde o ORM não alcança.'],
            ['Zod 4', 'Schemas de cada formulário (src/domain/schemas).', 'Valida no servidor toda entrada; o mesmo schema faz a prévia na tela.', 'Uma única definição para o navegador e o servidor.'],
            ['Argon2id (@node-rs/argon2)', 'Login, troca e redefinição de senha.', 'Só o hash vai para o banco; a senha em texto nunca é gravada nem registrada.', 'Algoritmo recomendado hoje para senhas, resistente a ataque com GPU.'],
            ['Sessão própria no banco', 'Autenticação (src/server/auth).', 'Token aleatório de 32 bytes em cookie HttpOnly e Secure; o banco guarda só o SHA-256.', 'Login sem e-mail e encerramento imediato das sessões ao inativar alguém; JWT não dá para revogar na hora.'],
            ['Tailwind CSS 4, Geist e lucide-react', 'Interface, temas claro e escuro.', 'Tokens de cor em CSS; componentes próprios em components/ui.tsx e formulario.tsx.', 'Sem biblioteca de componentes: menos dependências e controle total da acessibilidade.'],
            ['Gráficos em SVG próprio', 'Painel e página de Análise (RF-16, RF-17a).', 'Seis tipos de gráfico com dica, teclado, foco por clique e tabela de dados.', 'Seguem os tokens e os dois temas e cumprem o RNF-10 sem uma biblioteca grande.'],
            ['qrcode, BarcodeDetector e jsQR', 'Etiquetas e tela Ler QR (RF-22).', 'qrcode gera o QR no servidor; a leitura usa o leitor nativo do navegador ou o jsQR.', 'Leitura dentro do SICEI em qualquer celular, sem enviar imagem ao servidor.'],
            ['Papa Parse 5', 'Importação (RF-25) e exportação CSV (RF-20).', 'Lê a planilha da DDA e gera os arquivos exportados.', 'Leitor de CSV maduro, que trata aspas, separadores e codificação.'],
            ['Nodemailer', 'Avisos de item crítico ou zerado (RF-14).', 'Envia pelo SMTP corporativo os avisos que estão na fila (outbox).', 'Funciona com qualquer e-mail corporativo, sem serviço pago.'],
            ['Impressão do navegador (CSS @media print)', 'Relatórios, Análise e etiquetas em PDF.', 'Páginas de impressão sem menu e com cores mantidas.', 'Atende o RF-20 sem biblioteca nem serviço extra.'],
            ['Vitest 5 e Testing Library', 'Testes unitários, de componentes e de integração.', '803 testes unitários; casos escritos como dados (*.casos.ts) e usados com it.each.', 'Rápido, compatível com TypeScript, com relatório HTML e cobertura.'],
            ['Playwright', 'Testes ponta a ponta.', '21 roteiros em celular (360 px) e computador (1366 px) contra o build de produção.', 'Testa o sistema como o usuário usa, inclusive a câmera falsa do Ler QR.'],
            ['ESLint, Prettier e tsc', 'Qualidade do código.', 'Rodam antes de cada commit e na CI.', 'Estilo uniforme e erros de tipo barrados cedo.'],
            ['GitHub e GitHub Actions', 'Versionamento e integração contínua.', 'Em todo push: lint, tipos, unidade, integração com PostgreSQL e ponta a ponta.', 'Gratuito e já integrado à Vercel.'],
            ['Vercel (plano Hobby, região gru1)', 'Hospedagem da aplicação e Vercel Cron.', 'Cada push publica uma versão: migrations, seed, testes e build; a rotina diária roda às 06:00 UTC.', 'Custo zero, servidor em São Paulo e publicação automática.'],
            ['Neon (plano Free)', 'PostgreSQL gerenciado de produção.', 'Banco sicei_dda; a aplicação conecta com um usuário sem UPDATE e DELETE no histórico.', 'PostgreSQL de verdade, sem custo e com restauração de um ponto no tempo.'],
            ['PlantUML e Graphviz', 'Diagramas deste documento.', 'Diagramas escritos como texto e versionados no repositório.', 'Diagrama muda junto com o código e é revisado como código.'],
        ],
        [1900, 2200, 2900, 2638],
        sz=17,
        destaque_primeira_coluna=True,
        texto_fonte='Elaborado pela equipe (2026), a partir do package.json e do documento 03 (System Design).',
    )
    P(
        'As decisões de arquitetura foram registradas como ADRs (Architecture Decision Records) no '
        'documento 03. O Quadro 12 mostra as principais, com a alternativa que foi descartada.'
    )
    T(
        'Decisões de arquitetura e alternativas descartadas',
        ['Decisão', 'Alternativa descartada', 'Motivo'],
        [
            ['Monólito modular em Next.js', 'Front e back separados (React + API)', 'Mais barato e simples para 30 usuários; sem API pública, porque a integração ficou fora do escopo.'],
            ['PostgreSQL', 'MySQL, MongoDB', 'Lock de linha, CHECK, triggers e índices parciais resolvem no banco as regras mais sensíveis.'],
            ['Sessão própria em banco', 'Auth.js, JWT', 'Login sem e-mail, revogação imediata (RN-21b) e pouco código.'],
            ['Saldo guardado no item + lock pessimista', 'Somar sempre; lock otimista', 'Leitura rápida (RNF-03) e nenhuma chance de saldo negativo (RN-08).'],
            ['Log com cadeia de hash, trigger e permissão restrita', 'Log comum', 'Qualquer adulteração fica detectável (RN-09a).'],
            ['Outbox para e-mail', 'Enviar dentro da transação', 'E-mail fora do ar não trava a movimentação.'],
            ['QR aponta para a posição', 'QR aponta para o item', 'A etiqueta fica presa na gaveta e continua certa depois de uma troca de posição.'],
            ['Vercel + Neon', 'Servidor virtual pago', 'Custo zero para o projeto, com servidor em São Paulo.'],
            ['Laboratório de testes em /testes', 'Só relatório estático', 'O avaliador executa e cria testes sem instalar nada.'],
            ['Uma instalação por cliente', 'Vários clientes no mesmo banco', 'Isolamento total dos dados, sem mudar o modelo.'],
        ],
        [3000, 2600, 4038],
        destaque_primeira_coluna=True,
        texto_fonte='Elaborado pela equipe (2026), a partir do documento 03, seção 11 (ADRs).',
    )
    P(
        'O custo mensal da operação é zero: Vercel Hobby, Neon Free (0,5 GB, suficiente para anos de '
        'movimentação nesse volume), GitHub com Actions e o SMTP do e-mail corporativo que a empresa já tem. '
        'Numa implantação maior, os planos pagos de entrada da Vercel e do Neon mantêm o custo abaixo do teto '
        'de R$ 100 por mês do RNF-07.'
    )

    H2('8.1 Arquitetura da Solução')
    P(
        'A Figura 9 mostra onde cada parte roda. O almoxarife usa o celular e o escritório usa o computador, '
        'sempre por HTTPS. Na Vercel, o `proxy.ts` aplica os cabeçalhos de segurança (CSP com nonce, HSTS, '
        '`frame-ancestors none`) e manda para o login quem não tem cookie de sessão. A aplicação Next.js '
        'conversa com o PostgreSQL do Neon pelo Prisma, usando um usuário de banco que não tem permissão de '
        'alterar nem apagar movimentações e log. A rotina diária da Vercel Cron recalcula os itens e reenvia '
        'avisos. O Laboratório de testes é público e roda só no navegador. Cada push no GitHub dispara a CI e '
        'uma nova publicação, que só vai ao ar se todos os testes passarem.'
    )
    F('arquitetura-implantacao', 'Arquitetura da solução: implantação')
    P(
        'Dentro da aplicação, o código segue quatro camadas com regras de dependência rígidas (Figura 10):'
    )
    L(
        [
            '**Apresentação** (`src/app`, `src/components`): telas e Server Actions. A Action é fina: confere a '
            'sessão de novo, chama o service e devolve o resultado. A tela nunca acessa o banco.',
            '**Aplicação** (`src/server`): os services são os casos de uso e seguem sempre a mesma ordem: '
            'exigirPermissao → validação com Zod → transação → decisão (chamando o domínio) → gravação → '
            'auditoria → commit. Se qualquer passo falhar, nada é gravado. As consultas fazem as leituras.',
            '**Domínio** (`src/domain`): funções puras com as fórmulas e decisões das regras de negócio. Não '
            'importa nada do servidor, do Prisma nem do Next, e só usa recursos que existem no Node e no '
            'navegador.',
            '**Dados:** Prisma e PostgreSQL, com as restrições do Quadro 8 como última linha de defesa.',
        ]
    )
    F('arquitetura-camadas', 'Arquitetura em camadas do SICEI')
    P(
        'A segurança está distribuída pelas camadas. O Quadro 13 relaciona os riscos do OWASP Top 10 '
        '(2021) com as proteções implementadas.'
    )
    T(
        'Riscos do OWASP Top 10 e proteções do SICEI',
        ['Risco', 'Como o SICEI se protege'],
        [
            ['A01 Controle de acesso quebrado', 'Matriz de permissões conferida em todo service no servidor; testes de integração tentam cada ação com cada perfil; hierarquia entre Administradores (RN-21c) no service e no banco.'],
            ['A02 Falhas de criptografia', 'HTTPS com HSTS; senhas com Argon2id; token de sessão guardado só como hash.'],
            ['A03 Injeção', 'Consultas parametrizadas pelo Prisma; SQL manual só com template parametrizado; toda entrada passa pelo Zod.'],
            ['A04 Design inseguro', 'Regras críticas também no banco: CHECK, índices únicos e triggers.'],
            ['A05 Configuração insegura', 'CSP com nonce, frame-ancestors none, X-Content-Type-Options, Referrer-Policy e Permissions-Policy (câmera só para o próprio SICEI).'],
            ['A07 Falhas de autenticação', 'Bloqueio após 5 falhas, limite por IP, política de senha, expiração de sessão, troca obrigatória da provisória e mensagem de erro sempre igual.'],
            ['A08 Integridade de dados', 'Log inalterável com cadeia de hash e lockfile versionado.'],
            ['A09 Falhas de log e monitoramento', 'Log de auditoria do negócio e logs técnicos estruturados; tentativas de login com falha registradas.'],
            ['CSRF', 'Server Actions só aceitam a mesma origem; cookie SameSite=Lax.'],
        ],
        [2800, 6838],
        destaque_primeira_coluna=True,
        texto_fonte='Elaborado pela equipe (2026), a partir dos documentos 03 (seção 6) e 04 (Segurança).',
    )

    # ------------------------------------------------------------------ 9
    H1('9. Recursos Adicionais')
    H2('9.1 Planejamento do Projeto Aplicado')
    P(
        f'O planejamento e o acompanhamento foram feitos no próprio repositório do GitHub '
        f'({{link:{URL_REPO}/commits|histórico de commits}} e {{link:{URL_REPO}/actions|execuções da CI}}). '
        'Cada etapa só começou depois de a anterior ser aprovada, e cada documento guarda no fim o próprio '
        'histórico de versões, com data e mudança. As etapas foram estas:'
    )
    T(
        'Etapas do projeto e evidências no repositório',
        ['Etapa', 'Período', 'Evidência'],
        [
            ['Regras de negócio validadas com a DDA', '25/09/2026', 'docs/01-regras-de-negocio.md, versões 0.1 a 1.7'],
            ['Requisitos, critérios de aceite e rastreabilidade', '25/09/2026', 'docs/02-requisitos.md, versões 0.1 a 1.14'],
            ['System design, stack e ADRs', '25 e 26/09/2026', 'docs/03-system-design.md, versões 1.0 a 1.17'],
            ['Implementação, testes e publicação', '26/09/2026', 'Commits de 26/09; CI no GitHub Actions; publicação na Vercel'],
            ['Design da interface e versão para celular', '27/09/2026', 'design_handoff_sicei/ e commits do redesign'],
            ['Revisões de segurança e de código', '26 a 28/09/2026', 'docs/04-seguranca.md, versões até 1.6'],
            ['Plano de testes e operação', '26 a 28/09/2026', 'docs/05-plano-de-testes.md e docs/06-operacao.md'],
            ['Divulgação no LinkedIn', '11/10/2026', 'Publicação do Grupo J'],
            ['Documento do Sistema', '23/10/2026', 'docs/entrega-pa4/ (este documento e os diagramas)'],
        ],
        [3900, 1700, 4038],
        texto_fonte='Elaborado pela equipe (2026), a partir do repositório do SICEI.',
    )
    H2('9.2 Repositório da Aplicação')
    L(
        [
            f'**Código e documentação:** {{link:{URL_REPO}|{URL_REPO}}}',
            f'**Sistema publicado:** {{link:{URL_SISTEMA}|{URL_SISTEMA}}}',
            f'**Laboratório de testes (sem login):** {{link:{URL_SISTEMA}/testes|{URL_SISTEMA}/testes}}',
            f'**Relatório completo dos testes, com cobertura:** {{link:{URL_SISTEMA}/relatorio-testes/index.html|{URL_SISTEMA}/relatorio-testes}}',
        ]
    )
    P(
        'O repositório tem a documentação completa em `docs/` (regras de negócio, requisitos, system design, '
        'segurança, plano de testes e operação) e, em `docs/entrega-pa4/`, este documento, os arquivos dos '
        'diagramas e o script que monta o documento.'
    )
    H2('9.3 Testes automatizados')
    P(
        'O SICEI tem 931 testes automatizados. Todos rodam na CI a cada push, e a publicação na Vercel só '
        'acontece se os testes unitários passarem.'
    )
    T(
        'Testes automatizados do SICEI',
        ['Tipo', 'Quantidade', 'O que cobre'],
        [
            ['Unitários', '803', 'Regras de negócio, validações, telas e componentes; 99,4% das linhas cobertas e 100% em src/domain.'],
            ['Integração', '107', 'Services contra PostgreSQL real: saídas simultâneas, estorno duplo, triggers, permissões de cada perfil, cadeia de hash, filtros de busca.'],
            ['Ponta a ponta', '21', 'Fluxos no navegador, no celular (360 px) e no computador (1366 px): troca de senha, leitura do QR, saída pela etiqueta, estorno, usuários, importação, CSV e análise.'],
        ],
        [1800, 1400, 6438],
        alinhamentos=['left', 'center', 'left'],
        destaque_primeira_coluna=True,
        texto_fonte='Elaborado pela equipe (2026), a partir da execução da suíte em 23/10/2026 e do README.',
    )

    # ------------------------------------------------------------------ 10
    H1('10. Participação da Equipe')
    T(
        'Participação dos integrantes',
        ['Integrante', 'Atividade realizada', 'Evidência ou link'],
        [
            [
                'Rafael Benevides dos Santos',
                'Definiu com a DDA o problema, o escopo e as regras de negócio e respondeu às dúvidas levantadas '
                'nos requisitos. Escolheu a stack e a publicação na Vercel e no Neon. Criou o design da '
                'interface (web e celular). Conduziu o desenvolvimento, aprovando cada etapa antes da seguinte, '
                'testou cada entrega no sistema publicado e pediu as correções. Publicou o sistema e montou este '
                'documento.',
                f'{{link:{URL_REPO}/commit/b3d9b2cdcc66d2126801b98a42fe6b4bd3ab9e71|Commit do design web e mobile}}\n'
                f'{{link:{URL_REPO}/commits|Histórico de commits}}\n'
                f'{{link:{URL_SISTEMA}|Sistema publicado}}',
            ],
            [
                'Luciana da Silva Rafael',
                'Validou as regras de negócio com a DDA, testou o sistema publicado no computador e no celular '
                '(cadastros, entradas, saídas pela etiqueta QR e relatórios) e preparou a divulgação do projeto '
                'no LinkedIn.',
                '{link:https://lnkd.in/p/dHtf6jgy|Publicação no LinkedIn}',
            ],
        ],
        [2300, 4900, 2438],
        destaque_primeira_coluna=True,
        texto_fonte='Elaborado pela equipe (2026).',
    )
    P(
        '**Uso de inteligência artificial.** O código, os testes e a redação dos documentos foram feitos com '
        'o apoio do Claude Code, assistente de programação da Anthropic, a partir das decisões e correções da '
        'equipe. Os commits feitos pelo assistente trazem a linha Co-Authored-By: Claude. O README do '
        'repositório lista as decisões do autor e as correções pedidas, na ordem em que vieram.'
    )

    # ------------------------------------------------------------------ Referências
    H1('Referências')
    for ref in [
        'CUTTING TOOL ENGINEERING. ToolBOSS Tool Management System. Cutting Tool Engineering, 2013. Disponível em: '
        '{link:https://ctemag.com/products/toolboss-tool-management-system|https://ctemag.com/products/toolboss-tool-management-system}. '
        'Acesso em: 23 out. 2026.',
        'CUTTING TOOL ENGINEERING. CoroPlus Tool Supply. Cutting Tool Engineering, 2021. Disponível em: '
        '{link:https://ctemag.com/products/coroplus-tool-supply|https://ctemag.com/products/coroplus-tool-supply}. '
        'Acesso em: 23 out. 2026.',
        'CUTTING TOOL ENGINEERING. Viva vending. Disponível em: '
        '{link:https://ctemag.com/articles/viva-vending/|https://ctemag.com/articles/viva-vending/}. Acesso em: 23 out. 2026.',
        'FAVARETTO, A. S.; VALLE, P. D.; CANCIGLIERI JUNIOR, O. O gerenciamento de ferramentas de corte na '
        'indústria automotiva: um estudo de casos na Região Metropolitana de Curitiba. **Produto & Produção**, '
        'Porto Alegre, v. 10, n. 3, p. 45-60, out. 2009. DOI: 10.22456/1983-8026.10945.',
        'OWASP FOUNDATION. **OWASP Top 10:2021**. Disponível em: '
        '{link:https://owasp.org/Top10/|https://owasp.org/Top10/}. Acesso em: 23 out. 2026.',
        'SICEI. Documentação do projeto: regras de negócio, requisitos, system design, segurança, plano de '
        f'testes e operação. Disponível em: {{link:{URL_REPO}/tree/main/docs|{URL_REPO}/tree/main/docs}}. Acesso em: 23 out. 2026.',
    ]:
        P(ref, alinhamento='left')
    return b


# ---------------------------------------------------------------------------
# Template: capa, histórico, sumário
# ---------------------------------------------------------------------------


def texto_do_paragrafo(p):
    return ''.join(p.itertext())


def trocar_texto(p, novo):
    """Mantém pPr e a formatação do primeiro run (ou da marca de parágrafo) e troca o texto."""
    rpr_fonte = p.find('.//w:r/w:rPr', NS)
    if rpr_fonte is None:
        rpr_fonte = p.find('w:pPr/w:rPr', NS)
    for filho in list(p):
        if etree.QName(filho).localname != 'pPr':
            p.remove(filho)
    r = etree.SubElement(p, f'{{{W}}}r')
    if rpr_fonte is not None:
        r.append(copy.deepcopy(rpr_fonte))
    tt = etree.SubElement(r, f'{{{W}}}t')
    tt.text = novo
    tt.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')


def preencher_historico(tbl):
    linhas = tbl.findall('w:tr', NS)
    modelo = linhas[1]
    for tr in linhas[1:]:
        tbl.remove(tr)
    autor, revisor = 'Rafael Benevides dos Santos', 'Luciana da Silva Rafael'
    dados = [
        ('25/09/2026', '1.0', 'Elaboração inicial: escopo, descrição da solução e partes interessadas, a partir das regras de negócio validadas com a DDA', autor, revisor),
        ('25/09/2026', '1.1', 'Atores, requisitos funcionais e não funcionais e regras de negócio', autor, revisor),
        ('26/09/2026', '1.2', 'Modelo de dados e arquitetura da solução', autor, revisor),
        ('28/09/2026', '1.3', 'Tecnologias e segurança; Administrador principal (RN-21c), matrícula única (RN-21d) e análise de consumo (RF-17a)', autor, revisor),
        ('23/10/2026', '1.4', 'Consolidação no template: DER, diagramas UML de casos de uso, atividades e classes, arquitetura em SVG e participação da equipe', autor, revisor),
    ]
    for valores in dados:
        tr = copy.deepcopy(modelo)
        for tc, valor in zip(tr.findall('w:tc', NS), valores):
            ps = tc.findall('w:p', NS)
            for extra in ps[1:]:
                tc.remove(extra)
            trocar_texto(ps[0], valor)
        tbl.append(tr)


def sumario(doc, paginas):
    x = (
        f'<w:p>{ppr(alinhamento="center", depois=240, quebra_antes=True)}'
        + run('SUMÁRIO', b=True, sz=24)
        + '</w:p>'
    )
    for nivel, texto, nome in doc.titulos:
        if nivel > 1:
            continue
        pagina = str(paginas.get(nome, '')) if paginas else ''
        tab = f'<w:tab w:val="right" w:leader="dot" w:pos="{LARGURA_RETRATO}"/>'
        recuo = 0 if nivel == 0 else 400
        x += (
            f'<w:p>{ppr(estilo="Standard", alinhamento="left", antes=60 if nivel == 0 else 0, depois=40, linha=260, esquerda=recuo, tabs=[tab])}'
            f'<w:hyperlink w:anchor="{nome}" w:history="1">'
            + run(texto, b=(nivel == 0), sz=22)
            + '<w:r><w:tab/></w:r>'
            + run(pagina, b=(nivel == 0), sz=22)
            + '</w:hyperlink></w:p>'
        )
    return x


RODAPE = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    f'<w:ftr xmlns:w="{W}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    '<w:p><w:pPr><w:pStyle w:val="Standard"/><w:jc w:val="right"/></w:pPr>'
    '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">SICEI · Documento do Sistema · página </w:t></w:r>'
    '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>'
    '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="18"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>'
    '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>'
    '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r>'
    '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>'
    '</w:p></w:ftr>'
)


def montar(paginas=None):
    doc = Documento()
    tmp = tempfile.mkdtemp(prefix='sicei-doc-')
    with zipfile.ZipFile(TEMPLATE) as z:
        z.extractall(tmp)
    caminho_doc = os.path.join(tmp, 'word', 'document.xml')
    raiz = etree.parse(caminho_doc).getroot()
    corpo = raiz.find('w:body', NS)
    els = list(corpo)

    # Capa (elementos 0 a 46 do template)
    capa = els[:47]
    trocar_texto(capa[27], 'DOCUMENTO DO SISTEMA SICEI')
    trocar_texto(capa[28], 'Sistema Inteligente de Controle de Estoques Industriais')
    trocar_texto(capa[32], 'EQUIPE J')
    trocar_texto(capa[33], 'Luciana da Silva Rafael')
    trocar_texto(capa[34], 'Rafael Benevides dos Santos')
    trocar_texto(capa[36], 'Turma GR ADSI 2024/2 1')
    trocar_texto(capa[45], 'Florianópolis/SC')
    trocar_texto(capa[46], '2026')
    for i in (28, 33, 34, 36):
        rpr_capa = capa[i].find('.//w:r/w:rPr', NS)
        if rpr_capa is not None and rpr_capa.find('w:b', NS) is None and i == 28:
            rpr_capa.append(etree.Element(f'{{{W}}}b'))

    historico_titulo, historico_vazio, historico_tbl = els[47], els[48], els[49]
    preencher_historico(historico_tbl)

    blocos = conteudo(doc)

    rid_rodape = doc.rel('http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer', 'footer1.xml')

    # Seções: o sectPr de cada seção vai no último parágrafo dela (evita página em branco)
    partes = []
    paisagem_atual = False
    primeira = True

    def fechar_secao(paisagem):
        nonlocal primeira
        sp = sect_pr(paisagem=paisagem, primeira_pagina_sem_numero=primeira, rid_rodape=rid_rodape)
        primeira = False
        ultimo = partes[-1]
        i = ultimo.rfind('</w:pPr>')
        partes[-1] = ultimo[:i] + sp + ultimo[i:]

    for bl in blocos:
        if bl in (PAISAGEM, RETRATO):
            quer_paisagem = bl == PAISAGEM
            if quer_paisagem != paisagem_atual:
                fechar_secao(paisagem_atual)
                paisagem_atual = quer_paisagem
            continue
        partes.append(bl)

    declarados = {p: u for p, u in raiz.nsmap.items() if p}

    def xml(el):
        """Serializa sem repetir os namespaces que a raiz do documento já declara."""
        s = etree.tostring(el, encoding='unicode')
        return re.sub(
            r' xmlns:(\w+)="([^"]+)"',
            lambda m: '' if declarados.get(m.group(1)) == m.group(2) else m.group(0),
            s,
        )

    inicio = ''.join(xml(e) for e in capa) + xml(historico_titulo) + xml(historico_vazio) + xml(historico_tbl)
    inicio += sumario(doc, paginas)
    final = sect_pr(paisagem=paisagem_atual, primeira_pagina_sem_numero=primeira, rid_rodape=rid_rodape)

    texto = open(caminho_doc, encoding='utf8').read()
    abre = texto.index('<w:body>') + len('<w:body>')
    fecha = texto.index('</w:body>')
    texto = texto[:abre] + inicio + ''.join(partes) + final + texto[fecha:]
    open(caminho_doc, 'w', encoding='utf8').write(texto)

    # Partes extras: rodapé, mídias, relações, tipos
    open(os.path.join(tmp, 'word', 'footer1.xml'), 'w', encoding='utf8').write(RODAPE)
    for nome, origem in doc.midias:
        shutil.copy(origem, os.path.join(tmp, 'word', 'media', nome))
    rels_path = os.path.join(tmp, 'word', '_rels', 'document.xml.rels')
    rels = open(rels_path, encoding='utf8').read()
    novas = ''.join(
        f'<Relationship Id="{rid}" Type="{tipo}" Target="{alvo}"' + (' TargetMode="External"' if ext else '') + '/>'
        for rid, tipo, alvo, ext in doc.rels
    )
    rels = rels.replace('</Relationships>', novas.replace('&', '&amp;') + '</Relationships>')
    open(rels_path, 'w', encoding='utf8').write(rels)
    ct_path = os.path.join(tmp, '[Content_Types].xml')
    ct = open(ct_path, encoding='utf8').read()
    ct = ct.replace(
        '<Default Extension="png"',
        '<Default Extension="svg" ContentType="image/svg+xml"/><Default Extension="png"',
    )
    ct = ct.replace(
        '</Types>',
        '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>',
    )
    open(ct_path, 'w', encoding='utf8').write(ct)

    core = os.path.join(tmp, 'docProps', 'core.xml')
    c = open(core, encoding='utf8').read()
    c = re.sub(r'<dc:title>.*?</dc:title>|<dc:title/>', '', c)
    c = c.replace('</cp:coreProperties>', '<dc:title>Documento do Sistema SICEI – Grupo J</dc:title></cp:coreProperties>')
    open(core, 'w', encoding='utf8').write(c)

    if os.path.exists(SAIDA_DOCX):
        os.remove(SAIDA_DOCX)
    with zipfile.ZipFile(SAIDA_DOCX, 'w', zipfile.ZIP_DEFLATED) as z:
        for pasta, _, arquivos in os.walk(tmp):
            for a in arquivos:
                completo = os.path.join(pasta, a)
                z.write(completo, os.path.relpath(completo, tmp))
    shutil.rmtree(tmp)
    return doc


def converter_pdf():
    subprocess.run(
        ['soffice', '--headless', '--convert-to', 'pdf', '--outdir', ENTREGA, SAIDA_DOCX],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return os.path.join(ENTREGA, f'{NOME}.pdf')


def ler_paginas(doc, pdf):
    """Página de cada título: a primeira página, depois do sumário, cuja linha começa com o título."""
    total = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout).group(1))
    textos = []
    for n in range(1, total + 1):
        saida = subprocess.run(['pdftotext', '-f', str(n), '-l', str(n), '-layout', pdf, '-'], capture_output=True, text=True).stdout
        textos.append([linha.strip() for linha in saida.splitlines()])
    pagina_sumario = next(i for i, linhas in enumerate(textos) if any(l == 'SUMÁRIO' for l in linhas))
    # o sumário pode ocupar mais de uma página: o conteúdo começa na primeira sem linha pontilhada
    inicio = next(
        i for i in range(pagina_sumario + 1, total) if not any('.....' in l for l in textos[i])
    )
    paginas = {}
    procura_desde = inicio
    for nivel, texto, nome in doc.titulos:
        alvo = re.sub(r'\s+', ' ', texto.strip())
        for i in range(procura_desde, total):
            if any(re.sub(r'\s+', ' ', l).startswith(alvo) for l in textos[i]):
                paginas[nome] = i + 1
                procura_desde = i
                break
    return paginas


if __name__ == '__main__':
    doc = montar()
    pdf = converter_pdf()
    paginas = ler_paginas(doc, pdf)
    faltando = [t for _, t, n in doc.titulos if n not in paginas]
    if faltando:
        print('títulos sem página encontrada:', faltando)
    json.dump(paginas, open(PAGINAS, 'w'), indent=1)
    doc = montar(paginas)
    pdf = converter_pdf()
    conferencia = ler_paginas(doc, pdf)
    if conferencia != paginas:
        print('AVISO: as páginas mudaram na segunda passada; rode de novo.')
    print('ok:', SAIDA_DOCX, pdf)
