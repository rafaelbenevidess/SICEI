-- RN-21d: cada funcionário tem um login só. A matrícula passa a ser informada na criação do
-- usuário e não se repete, nem entre contas inativas. Contas antigas ficam sem matrícula até
-- a primeira edição (o índice único aceita vários NULL).
ALTER TABLE "usuario" ADD COLUMN "matricula" TEXT;
CREATE UNIQUE INDEX "usuario_matricula_key" ON "usuario" ("matricula");
