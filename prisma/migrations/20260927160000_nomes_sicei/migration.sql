-- ---------------------------------------------------------------
-- Nome novo do projeto: SICEI (antes SIMI). Doc 03, seção 7.
-- Cada empresa cliente tem a própria instalação, e os papéis do banco levam
-- a empresa no nome: sicei_<empresa>_owner (migrations) e sicei_<empresa>_app
-- (aplicação), por exemplo sicei_dda_owner e sicei_dda_app.
-- ---------------------------------------------------------------

ALTER FUNCTION simi_bloquear_alteracao() RENAME TO sicei_bloquear_alteracao;

-- Permissões do usuário da aplicação (doc 03, seção 5.2), para todo papel
-- sicei_<empresa>_app que existir. Os papéis são criados fora das migrations
-- (docs/06-operacao.md).
DO $$
DECLARE
  papel text;
BEGIN
  FOR papel IN SELECT rolname FROM pg_roles WHERE rolname LIKE 'sicei\_%\_app' LOOP
    EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', papel);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I', papel);
    EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE ON movimentacao, audit_log FROM %I', papel);
    IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON _prisma_migrations FROM %I', papel);
    END IF;
    EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I', papel);
  END LOOP;
END
$$;
