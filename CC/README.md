# Pasta CC

Aqui ficam as trocas entre quem gera as imagens e o código do SICEI. A pasta não entra no build: só o que o script publica em `public/pastilhas` vai para a tela.

| Caminho | O que tem |
|---|---|
| `prompts/` | Os prompts das imagens que o sistema usa. Cada arquivo diz o que gerar e com que nome salvar. |
| `imagens/` | Onde colocar as imagens geradas, ainda com o fundo. |

## Fotos das pastilhas

A tela mostra a foto do item quando ela existe e, quando não existe, o desenho em vetor feito a partir da designação ISO. Para trocar o desenho de um item pela foto:

1. Gere a imagem com o prompt de `prompts/pastilhas.md`.
2. Salve em `CC/imagens/` com o código do item ou a designação ISO no nome: `PST-001.png` ou `CNMG 120408.png`. Maiúsculas, espaços e traços não fazem diferença. Aceita PNG, JPG e WebP.
3. Rode o recorte:

```bash
npm run pastilhas
```

O script tira o fundo, apara as sobras, grava `public/pastilhas/<NOME>.webp` com transparência e reescreve `src/lib/fotos-pastilhas.json`, que diz à tela quais itens têm foto. Depois é só fazer o commit desses arquivos.

A foto com o código do item vale só para ele. A foto com a ISO vale para todo item daquele modelo, em qualquer instalação. Se houver as duas, a do código vence.

## O que o recorte precisa

- Fundo liso, de uma cor só, sem degradê e sem textura.
- De preferência verde de recorte (`#00B140`). Com ele o script também abre o furo da pastilha e mantém os brilhos claros da aresta.
- Fundo branco ou cinza funciona, com duas perdas: brilho quase branco encostado na borda some junto com o fundo, e pode sobrar um fio claro no contorno.
- Sem sombra no chão e sem reflexo do fundo na peça. A tela já põe a sombra.
- A peça inteira na imagem, sem encostar nas bordas.

Se o recorte ficar com a peça comida ou com pedaços do fundo, ajuste a tolerância (0 a 441, padrão 46): menor preserva mais a peça, maior tira mais fundo.

```bash
TOLERANCIA=30 npm run pastilhas
```

O script recusa a imagem quando o resultado fica com menos de 3% ou mais de 92% da área original, porque isso indica fundo que não é liso ou da mesma cor da peça.
