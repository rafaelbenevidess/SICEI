-- RN-21c: Administrador principal. É a conta criada na instalação, a do dono do sistema.
-- O banco garante que existe no máximo um e que ele não é rebaixado, inativado nem apagado,
-- nem por um Administrador comum, nem por SQL direto com o usuário da aplicação.
ALTER TABLE "usuario" ADD COLUMN "principal" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "usuario_um_principal" ON "usuario" ("principal") WHERE "principal";

-- instalação existente: o principal é o "admin" criado pelo seed; sem ele, o Administrador mais antigo
UPDATE "usuario" SET "principal" = true
 WHERE "id" = (
   SELECT "id" FROM "usuario"
    WHERE "perfil" = 'ADMIN'
    ORDER BY ("login" = 'admin') DESC, "criado_em" ASC
    LIMIT 1
 );

CREATE OR REPLACE FUNCTION sicei_proteger_principal() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.principal THEN
      RAISE EXCEPTION 'O Administrador principal não pode ser apagado (RN-21c).'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.principal IS DISTINCT FROM OLD.principal THEN
    RAISE EXCEPTION 'Ninguém se torna ou deixa de ser o Administrador principal pelo sistema (RN-21c).'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF OLD.principal AND (NEW.perfil <> 'ADMIN' OR NOT NEW.ativo) THEN
    RAISE EXCEPTION 'O Administrador principal não pode ser rebaixado nem inativado (RN-21c).'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "usuario_proteger_principal"
  BEFORE UPDATE OR DELETE ON "usuario"
  FOR EACH ROW EXECUTE FUNCTION sicei_proteger_principal();
