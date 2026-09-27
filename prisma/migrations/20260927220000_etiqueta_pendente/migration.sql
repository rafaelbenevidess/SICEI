-- RN-26: a posição sabe se a etiqueta QR do item que está nela já foi impressa.
-- Fica pendente quando um item entra na posição e volta a false quando a etiqueta é impressa.
ALTER TABLE "posicao" ADD COLUMN "etiqueta_pendente" BOOLEAN NOT NULL DEFAULT false;

-- Até esta versão o sistema não registrava a impressão: nenhuma etiqueta de posição ocupada
-- consta como impressa. Elas começam pendentes; imprimir pela tela de etiquetas limpa a marca.
UPDATE "posicao" SET "etiqueta_pendente" = true WHERE "item_id" IS NOT NULL;
