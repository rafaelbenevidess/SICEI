-- Regras garantidas pelo próprio banco (doc 03, seções 4 e 5).
-- Mesmo que um bug passe pelo código, o PostgreSQL recusa o dado errado.

-- ---------------------------------------------------------------
-- Item: saldo nunca negativo (RN-08) e limites coerentes (RN-14)
-- ---------------------------------------------------------------
ALTER TABLE item
  ADD CONSTRAINT item_saldo_nao_negativo CHECK (saldo >= 0),
  ADD CONSTRAINT item_minimo_nao_negativo CHECK (estoque_minimo >= 0),
  ADD CONSTRAINT item_maximo_maior_que_minimo CHECK (estoque_maximo IS NULL OR estoque_maximo > estoque_minimo),
  ADD CONSTRAINT item_embalagem_positiva CHECK (embalagem > 0),
  ADD CONSTRAINT item_ponto_reposicao_nao_negativo CHECK (ponto_reposicao >= 0);

ALTER TABLE item_fornecedor
  ADD CONSTRAINT item_fornecedor_lead_time CHECK (lead_time_dias IS NULL OR lead_time_dias >= 0),
  ADD CONSTRAINT item_fornecedor_preco CHECK (ultimo_preco IS NULL OR ultimo_preco > 0);

-- Um único fornecedor preferencial por item (RN-05)
CREATE UNIQUE INDEX item_fornecedor_um_preferencial ON item_fornecedor (item_id) WHERE preferencial;

ALTER TABLE posicao
  ADD CONSTRAINT posicao_niveis CHECK (
    armario BETWEEN 1 AND 99 AND gaveta BETWEEN 1 AND 99 AND compartimento BETWEEN 1 AND 99
  );

-- ---------------------------------------------------------------
-- Movimentação: campos obrigatórios por tipo (RN-07, RN-10 a RN-13)
-- ---------------------------------------------------------------
ALTER TABLE movimentacao
  ADD CONSTRAINT movimentacao_quantidade_positiva CHECK (quantidade > 0),
  ADD CONSTRAINT movimentacao_saldos_nao_negativos CHECK (saldo_anterior >= 0 AND saldo_posterior >= 0),
  ADD CONSTRAINT movimentacao_campos_por_tipo CHECK (
    CASE tipo
      WHEN 'COMPRA' THEN fornecedor_id IS NOT NULL AND preco_unitario > 0 AND nota_fiscal IS NOT NULL
      WHEN 'DEVOLUCAO_PRODUCAO' THEN destino_id IS NOT NULL AND colaborador_id IS NOT NULL AND motivo IS NOT NULL
      WHEN 'CONSUMO_PRODUCAO' THEN destino_id IS NOT NULL AND ordem_producao IS NOT NULL AND colaborador_id IS NOT NULL
      WHEN 'PERDA_QUEBRA' THEN motivo IS NOT NULL
      WHEN 'AJUSTE_POSITIVO' THEN motivo IS NOT NULL
      WHEN 'AJUSTE_NEGATIVO' THEN motivo IS NOT NULL
      WHEN 'ESTORNO' THEN estorna_id IS NOT NULL AND motivo IS NOT NULL
    END
  ),
  ADD CONSTRAINT movimentacao_saldo_coerente CHECK (
    CASE
      WHEN tipo IN ('COMPRA', 'DEVOLUCAO_PRODUCAO', 'AJUSTE_POSITIVO') THEN saldo_posterior = saldo_anterior + quantidade
      WHEN tipo IN ('CONSUMO_PRODUCAO', 'PERDA_QUEBRA', 'AJUSTE_NEGATIVO') THEN saldo_posterior = saldo_anterior - quantidade
      ELSE abs(saldo_posterior - saldo_anterior) = quantidade
    END
  );

-- ---------------------------------------------------------------
-- Um alerta aberto por item (RN-18)
-- ---------------------------------------------------------------
CREATE UNIQUE INDEX alerta_um_aberto_por_item ON alerta (item_id) WHERE fechado_em IS NULL;

-- ---------------------------------------------------------------
-- Histórico inalterável (RN-09a, RN-12): nem UPDATE, nem DELETE, nem TRUNCATE
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION simi_bloquear_alteracao() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'A tabela % é somente inclusão: registros não podem ser alterados nem apagados (RN-09a).', TG_TABLE_NAME
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER movimentacao_imutavel
  BEFORE UPDATE OR DELETE ON movimentacao
  FOR EACH ROW EXECUTE FUNCTION simi_bloquear_alteracao();
CREATE TRIGGER movimentacao_sem_truncate
  BEFORE TRUNCATE ON movimentacao
  FOR EACH STATEMENT EXECUTE FUNCTION simi_bloquear_alteracao();

CREATE TRIGGER audit_log_imutavel
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION simi_bloquear_alteracao();
CREATE TRIGGER audit_log_sem_truncate
  BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION simi_bloquear_alteracao();

-- ---------------------------------------------------------------
-- Permissões do usuário da aplicação (doc 03, seção 5.2)
-- O papel simi_app é criado fora das migrations (ver docs/06-operacao.md).
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'simi_app') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO simi_app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO simi_app';
    EXECUTE 'REVOKE UPDATE, DELETE, TRUNCATE ON movimentacao, audit_log FROM simi_app';
    IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
      EXECUTE 'REVOKE ALL ON _prisma_migrations FROM simi_app';
    END IF;
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO simi_app';
  END IF;
END
$$;
