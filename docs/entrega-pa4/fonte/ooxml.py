"""Blocos de WordprocessingML usados para preencher o template do Documento do Sistema.

Gera XML como texto, com a formatação do template (Arial, estilo "Text body").
Marcação aceita nos textos:
  **negrito**   `monoespaçado`   {i:itálico}   [[campo a preencher]]   {link:URL|texto}
"""

import re
from xml.sax.saxutils import escape

FONTE = 'Arial'
FONTE_MONO = 'Liberation Mono'
AZUL = '1F3A5F'
LARGURA_RETRATO = 9638  # 21 cm - 2 x 2 cm de margem, em dxa
LARGURA_PAISAGEM = 14570
EMU_POR_CM = 360000

_MARCACAO = re.compile(
    r'(\*\*(?P<b>.+?)\*\*)|(`(?P<m>[^`]+)`)|(\{i:(?P<i>[^}]+)\})|(\[\[(?P<p>.+?)\]\])'
    r'|(\{link:(?P<url>[^|}]+)\|(?P<lt>[^}]+)\})'
)


class Documento:
    """Acumula relações (links, imagens), bookmarks e figuras enquanto o corpo é montado."""

    def __init__(self):
        self.rels = []  # (id, tipo, alvo, externo)
        self.midias = []  # (nome no pacote, caminho de origem)
        self._id = 900
        self._bookmark = 1000
        self.figuras = 0
        self.tabelas = 0
        self.titulos = []  # (nivel, texto, bookmark)

    def novo_id(self):
        self._id += 1
        return self._id

    def rel(self, tipo, alvo, externo=False):
        rid = f'rIdS{self.novo_id()}'
        self.rels.append((rid, tipo, alvo, externo))
        return rid

    def link(self, url):
        return self.rel(
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
            url,
            externo=True,
        )

    def novo_bookmark(self):
        self._bookmark += 1
        return self._bookmark


def t(texto):
    return escape(texto)


def rpr(b=False, i=False, mono=False, sz=22, cor=None, destaque=None, sublinhado=False):
    fonte = FONTE_MONO if mono else FONTE
    x = f'<w:rFonts w:ascii="{fonte}" w:hAnsi="{fonte}" w:cs="{fonte}"/>'
    if b:
        x += '<w:b/><w:bCs/>'
    if i:
        x += '<w:i/><w:iCs/>'
    if cor:
        x += f'<w:color w:val="{cor}"/>'
    x += f'<w:sz w:val="{sz}"/><w:szCs w:val="{sz}"/>'
    if destaque:
        x += f'<w:highlight w:val="{destaque}"/>'
    if sublinhado:
        x += '<w:u w:val="single"/>'
    return f'<w:rPr>{x}</w:rPr>'


def run(texto, **kw):
    return f'<w:r>{rpr(**kw)}<w:t xml:space="preserve">{t(texto)}</w:t></w:r>'


def runs(doc, texto, sz=22, b=False, cor=None):
    """Converte o texto com marcação em runs."""
    saida = []
    pos = 0
    for m in _MARCACAO.finditer(texto):
        if m.start() > pos:
            saida.append(run(texto[pos : m.start()], sz=sz, b=b, cor=cor))
        if m.group('b'):
            saida.append(run(m.group('b'), sz=sz, b=True, cor=cor))
        elif m.group('m'):
            saida.append(run(m.group('m'), sz=sz - 2, b=b, mono=True, cor=cor))
        elif m.group('i'):
            saida.append(run(m.group('i'), sz=sz, b=b, i=True, cor=cor))
        elif m.group('p'):
            saida.append(run(m.group('p'), sz=sz, b=True, destaque='yellow'))
        elif m.group('url'):
            rid = doc.link(m.group('url'))
            saida.append(
                f'<w:hyperlink r:id="{rid}" w:history="1">'
                + run(m.group('lt'), sz=sz, b=b, cor='0563C1', sublinhado=True)
                + '</w:hyperlink>'
            )
        pos = m.end()
    if pos < len(texto):
        saida.append(run(texto[pos:], sz=sz, b=b, cor=cor))
    return ''.join(saida)


def ppr(
    estilo='Textbody',
    alinhamento='both',
    antes=0,
    depois=120,
    linha=276,
    esquerda=None,
    deslocamento=None,
    manter_proximo=False,
    quebra_antes=False,
    nivel=None,
    num_id=None,
    tabs=None,
    sect=None,
):
    x = f'<w:pStyle w:val="{estilo}"/>'
    if manter_proximo:
        x += '<w:keepNext/><w:keepLines/>'
    if quebra_antes:
        x += '<w:pageBreakBefore/>'
    if num_id is not None:
        x += f'<w:numPr><w:ilvl w:val="0"/><w:numId w:val="{num_id}"/></w:numPr>'
    if tabs:
        x += '<w:tabs>' + ''.join(tabs) + '</w:tabs>'
    x += f'<w:spacing w:before="{antes}" w:after="{depois}" w:line="{linha}" w:lineRule="auto"/>'
    if esquerda is not None or deslocamento is not None:
        e = esquerda or 0
        d = f' w:hanging="{deslocamento}"' if deslocamento else ''
        x += f'<w:ind w:left="{e}"{d}/>'
    if alinhamento:
        x += f'<w:jc w:val="{alinhamento}"/>'
    if nivel is not None:
        x += f'<w:outlineLvl w:val="{nivel}"/>'
    if sect:
        x += sect
    return f'<w:pPr>{x}</w:pPr>'


def paragrafo(doc, texto, sz=22, b=False, **kw):
    return f'<w:p>{ppr(**kw)}{runs(doc, texto, sz=sz, b=b)}</w:p>'


def titulo(doc, texto, nivel, quebra_antes=False):
    """Título numerado. Recebe bookmark para o sumário e nível de estrutura para o PDF."""
    bm = doc.novo_bookmark()
    nome = f'_Sec{bm}'
    doc.titulos.append((nivel, texto, nome))
    sz = {0: 24, 1: 22, 2: 22}[nivel]
    antes = {0: 240, 1: 200, 2: 160}[nivel]
    corpo = run(texto, b=True, sz=sz, i=(nivel == 2))
    return (
        f'<w:p>{ppr(alinhamento="left", antes=antes, depois=120, manter_proximo=True, quebra_antes=quebra_antes, nivel=nivel)}'
        f'<w:bookmarkStart w:id="{bm}" w:name="{nome}"/>{corpo}<w:bookmarkEnd w:id="{bm}"/></w:p>'
    )


def lista(doc, itens, sz=22):
    """Lista com marcador do próprio template (numId 2)."""
    return ''.join(
        f'<w:p>{ppr(num_id=2, depois=60, esquerda=720, deslocamento=360)}{runs(doc, item, sz=sz)}</w:p>'
        for item in itens
    )


def lista_numerada(doc, itens, sz=22):
    """Lista numerada escrita no texto (1., 2., ...), com recuo deslocado."""
    tab = '<w:tab w:val="left" w:pos="720"/>'
    return ''.join(
        f'<w:p>{ppr(depois=60, esquerda=720, deslocamento=360, tabs=[tab])}'
        + run(f'{n}.', sz=sz)
        + f'<w:r><w:tab/></w:r>{runs(doc, item, sz=sz)}</w:p>'
        for n, item in enumerate(itens, 1)
    )


def legenda_tabela(doc, texto):
    doc.tabelas += 1
    return (
        f'<w:p>{ppr(alinhamento="center", antes=120, depois=60, manter_proximo=True)}'
        + run(f'Quadro {doc.tabelas} – ', b=True, sz=20)
        + runs(doc, texto, sz=20)
        + '</w:p>'
    )


def fonte(doc, texto='Elaborado pela equipe (2026).'):
    return f'<w:p>{ppr(alinhamento="center", antes=40, depois=200)}' + runs(doc, f'Fonte: {texto}', sz=18) + '</w:p>'


def _celula(doc, conteudo, largura, cabecalho=False, sz=18, preenchimento=None, alinhamento='left', junto=False):
    fill = 'DCE6F2' if cabecalho else preenchimento
    shd = f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>' if fill else ''
    paragrafos = ''.join(
        f'<w:p>{ppr(estilo="Standard", alinhamento="center" if cabecalho else alinhamento, depois=0, linha=240, manter_proximo=junto)}'
        f'{runs(doc, linha, sz=sz, b=cabecalho)}</w:p>'
        for linha in str(conteudo).split('\n')
    )
    return (
        f'<w:tc><w:tcPr><w:tcW w:w="{largura}" w:type="dxa"/>{shd}<w:vAlign w:val="center"/></w:tcPr>'
        f'{paragrafos}</w:tc>'
    )


def tabela(doc, cabecalho, linhas, larguras, sz=18, alinhamentos=None, destaque_primeira_coluna=False):
    total = sum(larguras)
    borda = '<w:{0} w:val="single" w:sz="4" w:space="0" w:color="7F8FA6"/>'
    bordas = ''.join(borda.format(lado) for lado in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'))
    x = (
        f'<w:tbl><w:tblPr><w:tblW w:w="{total}" w:type="dxa"/><w:jc w:val="center"/>'
        f'<w:tblBorders>{bordas}</w:tblBorders><w:tblLayout w:type="fixed"/>'
        '<w:tblCellMar><w:top w:w="45" w:type="dxa"/><w:left w:w="85" w:type="dxa"/>'
        '<w:bottom w:w="45" w:type="dxa"/><w:right w:w="85" w:type="dxa"/></w:tblCellMar>'
        '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>'
        '</w:tblPr><w:tblGrid>' + ''.join(f'<w:gridCol w:w="{w}"/>' for w in larguras) + '</w:tblGrid>'
    )
    # tabela curta não é partida entre páginas: cada linha, menos a última, fica com a seguinte
    curta = len(linhas) <= 16
    x += '<w:tr><w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>'
    x += ''.join(_celula(doc, c, w, cabecalho=True, sz=sz, junto=True) for c, w in zip(cabecalho, larguras)) + '</w:tr>'
    for k, linha in enumerate(linhas):
        junto = curta and k < len(linhas) - 1
        x += '<w:tr><w:trPr><w:cantSplit/></w:trPr>'
        for n, (c, w) in enumerate(zip(linha, larguras)):
            al = alinhamentos[n] if alinhamentos else 'left'
            preenchimento = 'F4F7FB' if destaque_primeira_coluna and n == 0 else None
            celula_negrito = f'**{c}**' if destaque_primeira_coluna and n == 0 and c and '**' not in str(c) else c
            x += _celula(doc, celula_negrito, w, sz=sz, preenchimento=preenchimento, alinhamento=al, junto=junto)
        x += '</w:tr>'
    return x + '</w:tbl>'


def tamanho_svg(caminho):
    with open(caminho, encoding='utf8') as f:
        cabeca = f.read(2000)
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', cabeca)
    return float(m.group(1)), float(m.group(2))


def figura(doc, svg, png, titulo_figura, largura_max_cm, altura_max_cm, texto_fonte=None):
    """Figura com o SVG (vetorial, usado pelo Word e pelo LibreOffice) e o PNG como reserva."""
    doc.figuras += 1
    n = doc.figuras
    w, h = tamanho_svg(svg)
    largura_cm = min(largura_max_cm, altura_max_cm * w / h)
    altura_cm = largura_cm * h / w
    cx, cy = int(largura_cm * EMU_POR_CM), int(altura_cm * EMU_POR_CM)
    tipo_img = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'
    nome_png, nome_svg = f'figura{n}.png', f'figura{n}.svg'
    doc.midias += [(nome_png, png), (nome_svg, svg)]
    rid_png = doc.rel(tipo_img, f'media/{nome_png}')
    rid_svg = doc.rel(tipo_img, f'media/{nome_svg}')
    pid = doc.novo_id()
    desenho = (
        f'<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">'
        f'<wp:extent cx="{cx}" cy="{cy}"/><wp:docPr id="{pid}" name="Figura {n}" descr="{t(titulo_figura)}"/>'
        '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>'
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
        '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        f'<pic:nvPicPr><pic:cNvPr id="{pid}" name="{nome_png}"/><pic:cNvPicPr/></pic:nvPicPr>'
        f'<pic:blipFill><a:blip r:embed="{rid_png}"><a:extLst>'
        '<a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}">'
        f'<asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="{rid_svg}"/>'
        '</a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
        f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>'
        '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>'
    )
    return (
        f'<w:p>{ppr(alinhamento="center", antes=120, depois=60, manter_proximo=True)}'
        + run(f'Figura {n} – ', b=True, sz=20)
        + runs(doc, titulo_figura, sz=20)
        + '</w:p>'
        + f'<w:p>{ppr(alinhamento="center", depois=0, linha=240, manter_proximo=True)}{desenho}</w:p>'
        + fonte(doc, texto_fonte or 'Elaborado pela equipe (2026) com PlantUML, a partir do código do SICEI.')
    )


def sect_pr(paisagem=False, primeira_pagina_sem_numero=False, rid_rodape=None):
    pg = '<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>' if paisagem else '<w:pgSz w:w="11906" w:h="16838"/>'
    rodape = f'<w:footerReference w:type="default" r:id="{rid_rodape}"/>' if rid_rodape else ''
    titulo_pg = '<w:titlePg/>' if primeira_pagina_sem_numero else ''
    return (
        f'<w:sectPr>{rodape}<w:type w:val="nextPage"/>{pg}'
        '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="720" w:footer="567" w:gutter="0"/>'
        f'<w:cols w:space="720"/>{titulo_pg}</w:sectPr>'
    )
