#!/bin/sh
# Gera os diagramas do Documento do Sistema em SVG (vetorial, usado no PDF) e PNG (reserva).
# Requer Java, Graphviz e o plantuml.jar: PLANTUML_JAR=/caminho/plantuml.jar ./gerar.sh
set -e
cd "$(dirname "$0")"
: "${PLANTUML_JAR:?informe o caminho do plantuml.jar em PLANTUML_JAR}"
for formato in svg png; do
  java -DPLANTUML_LIMIT_SIZE=16384 -jar "$PLANTUML_JAR" -charset UTF-8 -t"$formato" [0-9]*.puml
done
