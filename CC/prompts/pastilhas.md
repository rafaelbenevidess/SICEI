# Prompts: fotos das pastilhas

Seis imagens, uma para cada item dos dados de demonstração. Use o mesmo texto-base em todas e troque só a descrição da peça, para as seis saírem com o mesmo ângulo, a mesma luz e o mesmo acabamento.

## Texto-base

> Foto de produto de uma única pastilha intercambiável de metal duro para usinagem, isolada, centralizada, ocupando cerca de 70% do quadro. Vista de três quartos, de cima, com a câmera a uns 40 graus de elevação e a peça girada uns 25 graus, mostrando a face de cima e duas paredes laterais. Metal duro com cobertura cinza-grafite fosca, levemente azulada, arestas de corte nítidas, quebra-cavaco moldado na face, acabamento realista de catálogo de ferramentas. Luz de estúdio suave vinda da esquerda e de cima. Fundo liso de uma cor só, verde de recorte #00B140, sem degradê, sem textura, sem sombra projetada no chão e sem reflexo verde na peça. Sem texto, sem logotipo, sem marca-d'água, sem mãos, sem outras peças. Proporção 4:3, alta resolução.
>
> A peça: **{descrição da peça}**

## Descrição de cada peça

| Salvar como | Item | Descrição da peça |
|---|---|---|
| `PST-001.png` | CNMG 120408 · P25 | pastilha em losango de 80 graus (formato C da ISO), negativa, de paredes retas, com furo central passante e quebra-cavaco nas duas faces, 12,7 mm de círculo inscrito e 4,76 mm de espessura. |
| `PST-002.png` | WNMG 080408 · M15 | pastilha trigonal (formato W da ISO): um triângulo de lados levemente abaulados, com três pontas de 80 graus, negativa, de paredes retas, com furo central passante e quebra-cavaco nas duas faces. |
| `PST-003.png` | DNMG 150608 · P20 | pastilha em losango estreito de 55 graus (formato D da ISO), negativa, de paredes retas, com furo central passante e quebra-cavaco nas duas faces, mais alongada que larga. |
| `PST-004.png` | APMT 1604PDER · K20 | pastilha de fresamento em paralelogramo de 85 graus (formato A da ISO), quase retangular, com 16 mm de comprimento, positiva, de paredes inclinadas, com furo central escareado para parafuso e arestas helicoidais nas duas pontas. |
| `PST-005.png` | SPMG 07T308 | pastilha quadrada pequena para broca intercambiável (formato S da ISO), positiva, de paredes inclinadas, com furo central escareado para parafuso e quebra-cavaco na face de cima. |
| `PST-006.png` | 16ER 1.5 ISO | pastilha de rosqueamento externo do tipo deitado (laydown), triangular, positiva, com furo central escareado e um perfil de rosca de 60 graus retificado em cada uma das três pontas. |

## Onde colocar

Salve as seis em `CC/imagens/` com os nomes da tabela e rode `npm run pastilhas`. O que o recorte precisa está em `CC/README.md`.

## Se uma imagem já foi gerada com outro fundo

Pode usar assim mesmo, desde que o fundo seja liso. O resultado com verde de recorte é melhor: mantém os brilhos da aresta e abre o furo. Para refazer só o fundo sem mudar a peça, peça ao modelo:

> Mantenha a peça exatamente como está e troque só o fundo por verde de recorte #00B140, liso, sem sombra no chão e sem reflexo verde na peça.
