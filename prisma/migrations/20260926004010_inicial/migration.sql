-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'GESTOR', 'ALMOXARIFE', 'CONSULTA');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('COMPRA', 'DEVOLUCAO_PRODUCAO', 'AJUSTE_POSITIVO', 'CONSUMO_PRODUCAO', 'PERDA_QUEBRA', 'AJUSTE_NEGATIVO', 'ESTORNO');

-- CreateEnum
CREATE TYPE "StatusItem" AS ENUM ('OK', 'ATENCAO', 'CRITICO', 'ZERADO');

-- CreateEnum
CREATE TYPE "NivelAlerta" AS ENUM ('ATENCAO', 'CRITICO', 'ZERADO');

-- CreateEnum
CREATE TYPE "Aplicacao" AS ENUM ('TORNEAMENTO', 'FRESAMENTO', 'FURACAO', 'ROSQUEAMENTO', 'OUTRA');

-- CreateEnum
CREATE TYPE "TipoDestino" AS ENUM ('SETOR', 'MAQUINA', 'CENTRO_CUSTO');

-- CreateEnum
CREATE TYPE "StatusNotificacao" AS ENUM ('PENDENTE', 'ENVIADO', 'FALHOU');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deve_trocar_senha" BOOLEAN NOT NULL DEFAULT true,
    "senha_hash" TEXT NOT NULL,
    "falhas_login" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_em" TIMESTAMPTZ,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_senha" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessao" (
    "id" TEXT NOT NULL,
    "usuario_id" UUID NOT NULL,
    "criada_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_uso" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_em" TIMESTAMPTZ NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tentativa_login" (
    "id" BIGSERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tentativa_login_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabricante" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "nome_chave" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fabricante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedor" (
    "id" UUID NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "contato" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "iso" TEXT,
    "classe" TEXT,
    "cobertura" TEXT,
    "aplicacao" "Aplicacao" NOT NULL,
    "fabricante_id" UUID NOT NULL,
    "embalagem" INTEGER NOT NULL,
    "estoque_minimo" INTEGER NOT NULL,
    "estoque_maximo" INTEGER,
    "saldo" INTEGER NOT NULL DEFAULT 0,
    "ponto_reposicao" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusItem" NOT NULL DEFAULT 'ZERADO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_fornecedor" (
    "item_id" UUID NOT NULL,
    "fornecedor_id" UUID NOT NULL,
    "codigo_no_fornecedor" TEXT,
    "lead_time_dias" INTEGER,
    "preferencial" BOOLEAN NOT NULL DEFAULT false,
    "ultimo_preco" DECIMAL(12,2),
    "data_ultima_compra" TIMESTAMPTZ,

    CONSTRAINT "item_fornecedor_pkey" PRIMARY KEY ("item_id","fornecedor_id")
);

-- CreateTable
CREATE TABLE "posicao" (
    "id" UUID NOT NULL,
    "armario" INTEGER NOT NULL,
    "gaveta" INTEGER NOT NULL,
    "compartimento" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "item_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "posicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destino" (
    "id" UUID NOT NULL,
    "tipo" "TipoDestino" NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "destino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaborador" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "matricula" TEXT,
    "setor" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacao" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "saldo_anterior" INTEGER NOT NULL,
    "saldo_posterior" INTEGER NOT NULL,
    "fornecedor_id" UUID,
    "preco_unitario" DECIMAL(12,2),
    "nota_fiscal" TEXT,
    "destino_id" UUID,
    "ordem_producao" TEXT,
    "colaborador_id" UUID,
    "motivo" TEXT,
    "observacao" TEXT,
    "estorna_id" UUID,
    "usuario_id" UUID NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerta" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "nivel" "NivelAlerta" NOT NULL,
    "aberto_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechado_em" TIMESTAMPTZ,
    "ciente_por_id" UUID,
    "ciente_em" TIMESTAMPTZ,

    CONSTRAINT "alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id" UUID NOT NULL,
    "alerta_id" UUID NOT NULL,
    "nivel" "NivelAlerta" NOT NULL,
    "destinatario" TEXT NOT NULL,
    "status" "StatusNotificacao" NOT NULL DEFAULT 'PENDENTE',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviado_em" TIMESTAMPTZ,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "seq" BIGINT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT,
    "antes" JSONB,
    "depois" JSONB,
    "usuario_id" UUID,
    "ip" TEXT,
    "user_agent" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL,
    "prev_hash" TEXT NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("seq")
);

-- CreateTable
CREATE TABLE "parametro" (
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parametro_pkey" PRIMARY KEY ("chave")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_login_key" ON "usuario"("login");

-- CreateIndex
CREATE INDEX "historico_senha_usuario_id_criado_em_idx" ON "historico_senha"("usuario_id", "criado_em");

-- CreateIndex
CREATE INDEX "sessao_usuario_id_idx" ON "sessao"("usuario_id");

-- CreateIndex
CREATE INDEX "tentativa_login_ip_criado_em_idx" ON "tentativa_login"("ip", "criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "fabricante_nome_chave_key" ON "fabricante"("nome_chave");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedor_cnpj_key" ON "fornecedor"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "item_codigo_key" ON "item"("codigo");

-- CreateIndex
CREATE INDEX "item_status_idx" ON "item"("status");

-- CreateIndex
CREATE UNIQUE INDEX "posicao_codigo_key" ON "posicao"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "posicao_item_id_key" ON "posicao"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "posicao_armario_gaveta_compartimento_key" ON "posicao"("armario", "gaveta", "compartimento");

-- CreateIndex
CREATE UNIQUE INDEX "destino_codigo_key" ON "destino"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "colaborador_matricula_key" ON "colaborador"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "movimentacao_estorna_id_key" ON "movimentacao"("estorna_id");

-- CreateIndex
CREATE INDEX "movimentacao_item_id_criado_em_idx" ON "movimentacao"("item_id", "criado_em");

-- CreateIndex
CREATE INDEX "movimentacao_tipo_criado_em_idx" ON "movimentacao"("tipo", "criado_em");

-- CreateIndex
CREATE INDEX "movimentacao_destino_id_criado_em_idx" ON "movimentacao"("destino_id", "criado_em");

-- CreateIndex
CREATE INDEX "movimentacao_colaborador_id_criado_em_idx" ON "movimentacao"("colaborador_id", "criado_em");

-- CreateIndex
CREATE INDEX "movimentacao_ordem_producao_idx" ON "movimentacao"("ordem_producao");

-- CreateIndex
CREATE INDEX "movimentacao_criado_em_idx" ON "movimentacao"("criado_em");

-- CreateIndex
CREATE INDEX "alerta_fechado_em_idx" ON "alerta"("fechado_em");

-- CreateIndex
CREATE INDEX "notificacao_status_idx" ON "notificacao"("status");

-- CreateIndex
CREATE UNIQUE INDEX "audit_log_hash_key" ON "audit_log"("hash");

-- CreateIndex
CREATE INDEX "audit_log_criado_em_idx" ON "audit_log"("criado_em");

-- CreateIndex
CREATE INDEX "audit_log_usuario_id_criado_em_idx" ON "audit_log"("usuario_id", "criado_em");

-- CreateIndex
CREATE INDEX "audit_log_entidade_entidade_id_idx" ON "audit_log"("entidade", "entidade_id");

-- AddForeignKey
ALTER TABLE "historico_senha" ADD CONSTRAINT "historico_senha_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_fabricante_id_fkey" FOREIGN KEY ("fabricante_id") REFERENCES "fabricante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_fornecedor" ADD CONSTRAINT "item_fornecedor_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_fornecedor" ADD CONSTRAINT "item_fornecedor_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posicao" ADD CONSTRAINT "posicao_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_destino_id_fkey" FOREIGN KEY ("destino_id") REFERENCES "destino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_estorna_id_fkey" FOREIGN KEY ("estorna_id") REFERENCES "movimentacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_ciente_por_id_fkey" FOREIGN KEY ("ciente_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_alerta_id_fkey" FOREIGN KEY ("alerta_id") REFERENCES "alerta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
