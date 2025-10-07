-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "support";

-- CreateEnum
CREATE TYPE "magiclawyer"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ADVOGADO', 'SECRETARIA', 'FINANCEIRO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "magiclawyer"."TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "magiclawyer"."TipoPessoa" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "magiclawyer"."TipoEndereco" AS ENUM ('MATRIZ', 'FILIAL', 'ESCRITORIO', 'RESIDENCIAL', 'COMERCIAL', 'CORRESPONDENCIA');

-- CreateEnum
CREATE TYPE "magiclawyer"."ProcessoStatus" AS ENUM ('RASCUNHO', 'EM_ANDAMENTO', 'SUSPENSO', 'ENCERRADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "magiclawyer"."MovimentacaoTipo" AS ENUM ('ANDAMENTO', 'PRAZO', 'INTIMACAO', 'AUDIENCIA', 'ANEXO', 'OUTRO');

-- CreateEnum
CREATE TYPE "magiclawyer"."ContratoStatus" AS ENUM ('RASCUNHO', 'ATIVO', 'SUSPENSO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "magiclawyer"."TarefaStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "magiclawyer"."TarefaPrioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "magiclawyer"."NotificacaoTipo" AS ENUM ('SISTEMA', 'PRAZO', 'DOCUMENTO', 'MENSAGEM', 'FINANCEIRO', 'OUTRO');

-- CreateEnum
CREATE TYPE "magiclawyer"."NotificacaoPrioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "magiclawyer"."NotificacaoStatus" AS ENUM ('NAO_LIDA', 'LIDA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "magiclawyer"."NotificacaoCanal" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'TELEGRAM', 'PUSH');

-- CreateEnum
CREATE TYPE "magiclawyer"."TenantPermission" AS ENUM ('CONFIGURACOES_ESCRITORIO', 'EQUIPE_GERENCIAR', 'FINANCEIRO_GERENCIAR');

-- CreateEnum
CREATE TYPE "magiclawyer"."SubscriptionStatus" AS ENUM ('TRIAL', 'ATIVA', 'INADIMPLENTE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "magiclawyer"."InvoiceStatus" AS ENUM ('RASCUNHO', 'ABERTA', 'PAGA', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "magiclawyer"."PaymentStatus" AS ENUM ('PENDENTE', 'PROCESSANDO', 'PAGO', 'FALHOU', 'ESTORNADO');

-- CreateEnum
CREATE TYPE "magiclawyer"."DocumentoOrigem" AS ENUM ('CLIENTE', 'ESCRITORIO', 'SISTEMA');

-- CreateEnum
CREATE TYPE "magiclawyer"."ProcuracaoEmitidaPor" AS ENUM ('ESCRITORIO', 'ADVOGADO');

-- CreateEnum
CREATE TYPE "magiclawyer"."ProcuracaoStatus" AS ENUM ('RASCUNHO', 'PENDENTE_ASSINATURA', 'VIGENTE', 'REVOGADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "magiclawyer"."TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "magiclawyer"."TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "magiclawyer"."TicketCategory" AS ENUM ('TECHNICAL', 'BILLING', 'FEATURE_REQUEST', 'BUG_REPORT', 'GENERAL');

-- CreateEnum
CREATE TYPE "magiclawyer"."EventoTipo" AS ENUM ('AUDIENCIA', 'REUNIAO', 'CONSULTA', 'PRAZO', 'LEMBRETE', 'OUTRO');

-- CreateEnum
CREATE TYPE "magiclawyer"."EventoStatus" AS ENUM ('AGENDADO', 'CONFIRMADO', 'CANCELADO', 'REALIZADO', 'ADIADO');

-- CreateEnum
CREATE TYPE "magiclawyer"."EventoConfirmacaoStatus" AS ENUM ('PENDENTE', 'CONFIRMADO', 'RECUSADO', 'TALVEZ');

-- CreateEnum
CREATE TYPE "magiclawyer"."EventoRecorrencia" AS ENUM ('NENHUMA', 'DIARIA', 'SEMANAL', 'MENSAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "magiclawyer"."DocumentoAssinaturaStatus" AS ENUM ('PENDENTE', 'ASSINADO', 'REJEITADO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "magiclawyer"."TipoComissao" AS ENUM ('HONORARIOS', 'ACAO_GANHA', 'CUSTAS', 'OUTROS');

-- CreateEnum
CREATE TYPE "magiclawyer"."JuizStatus" AS ENUM ('ATIVO', 'INATIVO', 'APOSENTADO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "magiclawyer"."EspecialidadeJuridica" AS ENUM ('CIVIL', 'CRIMINAL', 'TRABALHISTA', 'FAMILIA', 'TRIBUTARIO', 'ADMINISTRATIVO', 'EMPRESARIAL', 'CONSUMIDOR', 'AMBIENTAL', 'ELETORAL', 'MILITAR', 'PREVIDENCIARIO', 'CONSTITUCIONAL', 'INTERNACIONAL', 'OUTROS');

-- CreateEnum
CREATE TYPE "magiclawyer"."JuizNivel" AS ENUM ('JUIZ_SUBSTITUTO', 'JUIZ_TITULAR', 'DESEMBARGADOR', 'MINISTRO', 'OUTROS');

-- CreateEnum
CREATE TYPE "magiclawyer"."StatusPacoteJuiz" AS ENUM ('ATIVO', 'INATIVO', 'PROMOCIONAL');

-- CreateTable
CREATE TABLE "magiclawyer"."AreaProcesso" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AreaProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."TipoContrato" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."CategoriaTarefa" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "corHex" TEXT,
    "ordem" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaTarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "status" "magiclawyer"."TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "tipoPessoa" "magiclawyer"."TipoPessoa" NOT NULL DEFAULT 'JURIDICA',
    "documento" TEXT,
    "razaoSocial" TEXT,
    "nomeFantasia" TEXT,
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "superAdminId" TEXT,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Endereco" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "apelido" TEXT NOT NULL,
    "tipo" "magiclawyer"."TipoEndereco" NOT NULL DEFAULT 'ESCRITORIO',
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'Brasil',
    "telefone" TEXT,
    "observacoes" TEXT,
    "usuarioId" TEXT,
    "clienteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."TenantEndereco" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "apelido" TEXT NOT NULL,
    "tipo" "magiclawyer"."TipoEndereco" NOT NULL DEFAULT 'ESCRITORIO',
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'Brasil',
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantEndereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."TenantBranding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "loginBackgroundUrl" TEXT,
    "emailFromName" TEXT,
    "emailFromAddress" TEXT,
    "customDomainText" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantBranding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Usuario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "magiclawyer"."UserRole" NOT NULL DEFAULT 'SECRETARIA',
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."SuperAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passwordHash" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."SuperAdminAuditLog" (
    "id" TEXT NOT NULL,
    "superAdminId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "dadosAntigos" JSONB,
    "dadosNovos" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperAdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Advogado" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "oabNumero" TEXT,
    "oabUf" TEXT,
    "especialidades" "magiclawyer"."EspecialidadeJuridica"[],
    "bio" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "comissaoPadrao" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "comissaoAcaoGanha" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "comissaoHonorarios" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advogado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Cliente" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipoPessoa" "magiclawyer"."TipoPessoa" NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "celular" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "inscricaoEstadual" TEXT,
    "responsavelNome" TEXT,
    "responsavelEmail" TEXT,
    "responsavelTelefone" TEXT,
    "observacoes" TEXT,
    "usuarioId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."AdvogadoCliente" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "relacionamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvogadoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Juiz" (
    "id" TEXT NOT NULL,
    "tribunalId" TEXT,
    "nome" TEXT NOT NULL,
    "nomeCompleto" TEXT,
    "cpf" TEXT,
    "oab" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "dataPosse" TIMESTAMP(3),
    "dataAposentadoria" TIMESTAMP(3),
    "status" "magiclawyer"."JuizStatus" NOT NULL DEFAULT 'ATIVO',
    "nivel" "magiclawyer"."JuizNivel" NOT NULL DEFAULT 'JUIZ_TITULAR',
    "especialidades" "magiclawyer"."EspecialidadeJuridica"[],
    "vara" TEXT,
    "comarca" TEXT,
    "biografia" TEXT,
    "formacao" TEXT,
    "experiencia" TEXT,
    "premios" TEXT,
    "publicacoes" TEXT,
    "foto" TEXT,
    "website" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "observacoes" TEXT,
    "isPublico" BOOLEAN NOT NULL DEFAULT true,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "precoAcesso" DECIMAL(10,2),
    "superAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Juiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Tribunal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "esfera" TEXT,
    "uf" TEXT,
    "siteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tribunal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Notificacao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" "magiclawyer"."NotificacaoTipo" NOT NULL DEFAULT 'SISTEMA',
    "prioridade" "magiclawyer"."NotificacaoPrioridade" NOT NULL DEFAULT 'MEDIA',
    "canais" "magiclawyer"."NotificacaoCanal"[] DEFAULT ARRAY['IN_APP']::"magiclawyer"."NotificacaoCanal"[],
    "dados" JSONB,
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "agendarPara" TIMESTAMP(3),
    "expiracaoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."NotificacaoUsuario" (
    "id" TEXT NOT NULL,
    "notificacaoId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "canal" "magiclawyer"."NotificacaoCanal" NOT NULL DEFAULT 'IN_APP',
    "status" "magiclawyer"."NotificacaoStatus" NOT NULL DEFAULT 'NAO_LIDA',
    "entregueEm" TIMESTAMP(3),
    "lidoEm" TIMESTAMP(3),
    "reabertoEm" TIMESTAMP(3),
    "tentativaAtual" INTEGER NOT NULL DEFAULT 0,
    "ultimoErro" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificacaoUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."UsuarioPermissao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "permissao" "magiclawyer"."TenantPermission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioPermissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Processo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titulo" TEXT,
    "descricao" TEXT,
    "status" "magiclawyer"."ProcessoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "areaId" TEXT,
    "classeProcessual" TEXT,
    "vara" TEXT,
    "comarca" TEXT,
    "foro" TEXT,
    "dataDistribuicao" TIMESTAMP(3),
    "segredoJustica" BOOLEAN NOT NULL DEFAULT false,
    "valorCausa" DECIMAL(14,2),
    "rito" TEXT,
    "clienteId" TEXT NOT NULL,
    "advogadoResponsavelId" TEXT,
    "juizId" TEXT,
    "tribunalId" TEXT,
    "tags" JSONB,
    "prazoPrincipal" TIMESTAMP(3),
    "numeroInterno" TEXT,
    "pastaCompartilhadaUrl" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Procuracao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "modeloId" TEXT,
    "numero" TEXT,
    "arquivoUrl" TEXT,
    "observacoes" TEXT,
    "emitidaEm" TIMESTAMP(3),
    "validaAte" TIMESTAMP(3),
    "revogadaEm" TIMESTAMP(3),
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "status" "magiclawyer"."ProcuracaoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "assinadaPeloClienteEm" TIMESTAMP(3),
    "emitidaPor" "magiclawyer"."ProcuracaoEmitidaPor" NOT NULL DEFAULT 'ESCRITORIO',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procuracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."ProcuracaoProcesso" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "procuracaoId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcuracaoProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."ProcuracaoAdvogado" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "procuracaoId" TEXT NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcuracaoAdvogado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."MovimentacaoProcesso" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "magiclawyer"."MovimentacaoTipo",
    "dataMovimentacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prazo" TIMESTAMP(3),
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimentacaoProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Documento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "descricao" TEXT,
    "url" TEXT NOT NULL,
    "tamanhoBytes" INTEGER,
    "contentType" TEXT,
    "processoId" TEXT,
    "clienteId" TEXT,
    "contratoId" TEXT,
    "movimentacaoId" TEXT,
    "uploadedById" TEXT,
    "metadados" JSONB,
    "origem" "magiclawyer"."DocumentoOrigem" NOT NULL DEFAULT 'ESCRITORIO',
    "visivelParaCliente" BOOLEAN NOT NULL DEFAULT false,
    "visivelParaEquipe" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."ProcessoDocumento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "tag" TEXT,
    "nota" TEXT,
    "createdById" TEXT,
    "visivelParaCliente" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Contrato" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "modeloId" TEXT,
    "advogadoResponsavelId" TEXT,
    "responsavelUsuarioId" TEXT,
    "criadoPorId" TEXT,
    "processoId" TEXT,
    "titulo" TEXT NOT NULL,
    "tipoId" TEXT,
    "status" "magiclawyer"."ContratoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "valor" DECIMAL(14,2),
    "moeda" TEXT DEFAULT 'BRL',
    "comissaoAdvogado" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "percentualAcaoGanha" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "valorAcaoGanha" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "dataAssinatura" TIMESTAMP(3),
    "resumo" TEXT,
    "arquivoUrl" TEXT,
    "observacoes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."ModeloContrato" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipoId" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "idioma" TEXT DEFAULT 'pt-BR',
    "conteudo" TEXT NOT NULL,
    "variaveis" JSONB,
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Tarefa" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "magiclawyer"."TarefaStatus" NOT NULL DEFAULT 'PENDENTE',
    "prioridade" "magiclawyer"."TarefaPrioridade" NOT NULL DEFAULT 'MEDIA',
    "processoId" TEXT,
    "clienteId" TEXT,
    "categoriaId" TEXT,
    "responsavelId" TEXT,
    "criadoPorId" TEXT,
    "dataLimite" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lembreteEm" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Plano" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "valorMensal" DECIMAL(10,2),
    "valorAnual" DECIMAL(10,2),
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "limiteUsuarios" INTEGER,
    "limiteProcessos" INTEGER,
    "limiteStorageMb" INTEGER,
    "recursos" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."TenantSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planoId" TEXT,
    "status" "magiclawyer"."SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "renovaEm" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "externalCustomerId" TEXT,
    "externalSubscriptionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Fatura" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "contratoId" TEXT,
    "numero" TEXT,
    "descricao" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "status" "magiclawyer"."InvoiceStatus" NOT NULL DEFAULT 'RASCUNHO',
    "comissaoAdvogado" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "valorComissao" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "tipoComissao" "magiclawyer"."TipoComissao" NOT NULL DEFAULT 'HONORARIOS',
    "periodoInicio" TIMESTAMP(3),
    "periodoFim" TIMESTAMP(3),
    "vencimento" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "externalInvoiceId" TEXT,
    "urlBoleto" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Pagamento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "faturaId" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "status" "magiclawyer"."PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
    "comissaoAdvogado" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "valorComissao" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "pagoParaAdvogado" BOOLEAN NOT NULL DEFAULT false,
    "metodo" TEXT,
    "transacaoId" TEXT,
    "autorizadoEm" TIMESTAMP(3),
    "confirmadoEm" TIMESTAMP(3),
    "estornadoEm" TIMESTAMP(3),
    "detalhes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."PagamentoComissao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pagamentoId" TEXT NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "valorComissao" DECIMAL(14,2) NOT NULL,
    "percentualComissao" DECIMAL(5,2) NOT NULL,
    "tipoComissao" "magiclawyer"."TipoComissao" NOT NULL DEFAULT 'HONORARIOS',
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagamentoComissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "dados" JSONB,
    "previousValues" JSONB,
    "changedFields" TEXT[],
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Evento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "magiclawyer"."EventoTipo" NOT NULL DEFAULT 'REUNIAO',
    "status" "magiclawyer"."EventoStatus" NOT NULL DEFAULT 'AGENDADO',
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "participantes" TEXT[],
    "processoId" TEXT,
    "clienteId" TEXT,
    "advogadoResponsavelId" TEXT,
    "criadoPorId" TEXT,
    "recorrencia" "magiclawyer"."EventoRecorrencia" NOT NULL DEFAULT 'NENHUMA',
    "recorrenciaFim" TIMESTAMP(3),
    "googleEventId" TEXT,
    "googleCalendarId" TEXT,
    "lembreteMinutos" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."EventoParticipante" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "participanteEmail" TEXT NOT NULL,
    "participanteNome" TEXT,
    "status" "magiclawyer"."EventoConfirmacaoStatus" NOT NULL DEFAULT 'PENDENTE',
    "confirmadoEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventoParticipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."DocumentoAssinatura" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "processoId" TEXT,
    "clienteId" TEXT NOT NULL,
    "advogadoResponsavelId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "magiclawyer"."DocumentoAssinaturaStatus" NOT NULL DEFAULT 'PENDENTE',
    "urlDocumento" TEXT NOT NULL,
    "urlAssinado" TEXT,
    "clicksignDocumentId" TEXT,
    "clicksignSignerId" TEXT,
    "dataEnvio" TIMESTAMP(3),
    "dataAssinatura" TIMESTAMP(3),
    "dataExpiracao" TIMESTAMP(3),
    "observacoes" TEXT,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoAssinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."Julgamentos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "juizId" TEXT NOT NULL,
    "processoId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataJulgamento" TIMESTAMP(3) NOT NULL,
    "tipoJulgamento" TEXT NOT NULL,
    "resultado" TEXT,
    "valorCausa" DECIMAL(14,2),
    "valorCondenacao" DECIMAL(14,2),
    "observacoes" TEXT,
    "pontosPositivos" TEXT[],
    "pontosNegativos" TEXT[],
    "estrategias" TEXT[],
    "recomendacoes" TEXT[],
    "tags" TEXT[],
    "isPublico" BOOLEAN NOT NULL DEFAULT false,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Julgamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."AnalisesJuiz" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "juizId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipoAnalise" TEXT NOT NULL,
    "dados" JSONB NOT NULL,
    "conclusoes" TEXT[],
    "recomendacoes" TEXT[],
    "isPublico" BOOLEAN NOT NULL DEFAULT false,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalisesJuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."FavoritosJuiz" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "juizId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "observacoes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoritosJuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."AcessosJuiz" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "juizId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipoAcesso" TEXT NOT NULL,
    "dataAcesso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "AcessosJuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."PacotesJuiz" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "duracaoDias" INTEGER,
    "limiteUsuarios" INTEGER,
    "limiteConsultas" INTEGER,
    "isPublico" BOOLEAN NOT NULL DEFAULT true,
    "status" "magiclawyer"."StatusPacoteJuiz" NOT NULL DEFAULT 'ATIVO',
    "ordemExibicao" INTEGER NOT NULL DEFAULT 0,
    "cor" TEXT NOT NULL DEFAULT 'primary',
    "icone" TEXT,
    "superAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PacotesJuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."PacoteJuizItems" (
    "id" TEXT NOT NULL,
    "pacoteId" TEXT NOT NULL,
    "juizId" TEXT NOT NULL,
    "ordemExibicao" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PacoteJuizItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."AssinaturasPacoteJuiz" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pacoteId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "renovacaoAutomatica" BOOLEAN NOT NULL DEFAULT true,
    "precoPago" DECIMAL(10,2) NOT NULL,
    "formaPagamento" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssinaturasPacoteJuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."ConfiguracoesPreco" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "isAtivo" BOOLEAN NOT NULL DEFAULT true,
    "superAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracoesPreco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."tickets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "magiclawyer"."TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "magiclawyer"."TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "magiclawyer"."TicketCategory" NOT NULL DEFAULT 'GENERAL',
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."ticket_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support"."ticket_attachments" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magiclawyer"."ModeloProcuracao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "conteudo" TEXT NOT NULL,
    "categoria" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ModeloProcuracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AreaProcesso_tenantId_idx" ON "magiclawyer"."AreaProcesso"("tenantId");

-- CreateIndex
CREATE INDEX "AreaProcesso_nome_idx" ON "magiclawyer"."AreaProcesso"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "AreaProcesso_tenantId_slug_key" ON "magiclawyer"."AreaProcesso"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "TipoContrato_tenantId_idx" ON "magiclawyer"."TipoContrato"("tenantId");

-- CreateIndex
CREATE INDEX "TipoContrato_nome_idx" ON "magiclawyer"."TipoContrato"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "TipoContrato_tenantId_slug_key" ON "magiclawyer"."TipoContrato"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "CategoriaTarefa_tenantId_idx" ON "magiclawyer"."CategoriaTarefa"("tenantId");

-- CreateIndex
CREATE INDEX "CategoriaTarefa_nome_idx" ON "magiclawyer"."CategoriaTarefa"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaTarefa_tenantId_slug_key" ON "magiclawyer"."CategoriaTarefa"("tenantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "magiclawyer"."Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "magiclawyer"."Tenant"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_documento_key" ON "magiclawyer"."Tenant"("documento");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "magiclawyer"."Tenant"("status");

-- CreateIndex
CREATE INDEX "Tenant_superAdminId_idx" ON "magiclawyer"."Tenant"("superAdminId");

-- CreateIndex
CREATE INDEX "Endereco_tenantId_principal_idx" ON "magiclawyer"."Endereco"("tenantId", "principal");

-- CreateIndex
CREATE INDEX "Endereco_usuarioId_idx" ON "magiclawyer"."Endereco"("usuarioId");

-- CreateIndex
CREATE INDEX "Endereco_clienteId_idx" ON "magiclawyer"."Endereco"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Endereco_tenantId_apelido_key" ON "magiclawyer"."Endereco"("tenantId", "apelido");

-- CreateIndex
CREATE INDEX "TenantEndereco_tenantId_principal_idx" ON "magiclawyer"."TenantEndereco"("tenantId", "principal");

-- CreateIndex
CREATE UNIQUE INDEX "TenantEndereco_tenantId_apelido_key" ON "magiclawyer"."TenantEndereco"("tenantId", "apelido");

-- CreateIndex
CREATE UNIQUE INDEX "TenantBranding_tenantId_key" ON "magiclawyer"."TenantBranding"("tenantId");

-- CreateIndex
CREATE INDEX "Usuario_role_idx" ON "magiclawyer"."Usuario"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_tenantId_key" ON "magiclawyer"."Usuario"("email", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_email_key" ON "magiclawyer"."SuperAdmin"("email");

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_superAdminId_idx" ON "magiclawyer"."SuperAdminAuditLog"("superAdminId");

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_acao_idx" ON "magiclawyer"."SuperAdminAuditLog"("acao");

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_entidade_idx" ON "magiclawyer"."SuperAdminAuditLog"("entidade");

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_createdAt_idx" ON "magiclawyer"."SuperAdminAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Advogado_usuarioId_key" ON "magiclawyer"."Advogado"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Advogado_tenantId_oabUf_oabNumero_key" ON "magiclawyer"."Advogado"("tenantId", "oabUf", "oabNumero");

-- CreateIndex
CREATE INDEX "Cliente_nome_idx" ON "magiclawyer"."Cliente"("nome");

-- CreateIndex
CREATE INDEX "Cliente_documento_idx" ON "magiclawyer"."Cliente"("documento");

-- CreateIndex
CREATE INDEX "Cliente_tenantId_deletedAt_idx" ON "magiclawyer"."Cliente"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_tenantId_documento_key" ON "magiclawyer"."Cliente"("tenantId", "documento");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_tenantId_usuarioId_key" ON "magiclawyer"."Cliente"("tenantId", "usuarioId");

-- CreateIndex
CREATE INDEX "AdvogadoCliente_clienteId_idx" ON "magiclawyer"."AdvogadoCliente"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "AdvogadoCliente_advogadoId_clienteId_key" ON "magiclawyer"."AdvogadoCliente"("advogadoId", "clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Juiz_cpf_key" ON "magiclawyer"."Juiz"("cpf");

-- CreateIndex
CREATE INDEX "Juiz_nome_idx" ON "magiclawyer"."Juiz"("nome");

-- CreateIndex
CREATE INDEX "Juiz_superAdminId_idx" ON "magiclawyer"."Juiz"("superAdminId");

-- CreateIndex
CREATE INDEX "Juiz_status_idx" ON "magiclawyer"."Juiz"("status");

-- CreateIndex
CREATE INDEX "Juiz_especialidades_idx" ON "magiclawyer"."Juiz"("especialidades");

-- CreateIndex
CREATE UNIQUE INDEX "Tribunal_nome_uf_key" ON "magiclawyer"."Tribunal"("nome", "uf");

-- CreateIndex
CREATE INDEX "Notificacao_tenantId_tipo_idx" ON "magiclawyer"."Notificacao"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "Notificacao_tenantId_prioridade_idx" ON "magiclawyer"."Notificacao"("tenantId", "prioridade");

-- CreateIndex
CREATE INDEX "Notificacao_tenantId_agendarPara_idx" ON "magiclawyer"."Notificacao"("tenantId", "agendarPara");

-- CreateIndex
CREATE INDEX "Notificacao_tenantId_createdAt_idx" ON "magiclawyer"."Notificacao"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificacaoUsuario_tenantId_usuarioId_status_idx" ON "magiclawyer"."NotificacaoUsuario"("tenantId", "usuarioId", "status");

-- CreateIndex
CREATE INDEX "NotificacaoUsuario_tenantId_createdAt_idx" ON "magiclawyer"."NotificacaoUsuario"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificacaoUsuario_notificacaoId_usuarioId_canal_key" ON "magiclawyer"."NotificacaoUsuario"("notificacaoId", "usuarioId", "canal");

-- CreateIndex
CREATE INDEX "UsuarioPermissao_tenantId_permissao_idx" ON "magiclawyer"."UsuarioPermissao"("tenantId", "permissao");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioPermissao_tenantId_usuarioId_permissao_key" ON "magiclawyer"."UsuarioPermissao"("tenantId", "usuarioId", "permissao");

-- CreateIndex
CREATE INDEX "Processo_tenantId_status_idx" ON "magiclawyer"."Processo"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Processo_tenantId_clienteId_idx" ON "magiclawyer"."Processo"("tenantId", "clienteId");

-- CreateIndex
CREATE INDEX "Processo_tenantId_createdAt_idx" ON "magiclawyer"."Processo"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Processo_tenantId_deletedAt_idx" ON "magiclawyer"."Processo"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Processo_tenantId_numero_key" ON "magiclawyer"."Processo"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "Procuracao_tenantId_clienteId_idx" ON "magiclawyer"."Procuracao"("tenantId", "clienteId");

-- CreateIndex
CREATE INDEX "Procuracao_tenantId_ativa_idx" ON "magiclawyer"."Procuracao"("tenantId", "ativa");

-- CreateIndex
CREATE INDEX "Procuracao_tenantId_modeloId_idx" ON "magiclawyer"."Procuracao"("tenantId", "modeloId");

-- CreateIndex
CREATE INDEX "ProcuracaoProcesso_tenantId_processoId_idx" ON "magiclawyer"."ProcuracaoProcesso"("tenantId", "processoId");

-- CreateIndex
CREATE INDEX "ProcuracaoProcesso_tenantId_procuracaoId_idx" ON "magiclawyer"."ProcuracaoProcesso"("tenantId", "procuracaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcuracaoProcesso_procuracaoId_processoId_key" ON "magiclawyer"."ProcuracaoProcesso"("procuracaoId", "processoId");

-- CreateIndex
CREATE INDEX "ProcuracaoAdvogado_tenantId_advogadoId_idx" ON "magiclawyer"."ProcuracaoAdvogado"("tenantId", "advogadoId");

-- CreateIndex
CREATE INDEX "ProcuracaoAdvogado_tenantId_procuracaoId_idx" ON "magiclawyer"."ProcuracaoAdvogado"("tenantId", "procuracaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcuracaoAdvogado_procuracaoId_advogadoId_key" ON "magiclawyer"."ProcuracaoAdvogado"("procuracaoId", "advogadoId");

-- CreateIndex
CREATE INDEX "MovimentacaoProcesso_processoId_idx" ON "magiclawyer"."MovimentacaoProcesso"("processoId");

-- CreateIndex
CREATE INDEX "MovimentacaoProcesso_dataMovimentacao_idx" ON "magiclawyer"."MovimentacaoProcesso"("dataMovimentacao");

-- CreateIndex
CREATE INDEX "Documento_tenantId_visivelParaCliente_idx" ON "magiclawyer"."Documento"("tenantId", "visivelParaCliente");

-- CreateIndex
CREATE INDEX "Documento_tenantId_deletedAt_idx" ON "magiclawyer"."Documento"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Documento_processoId_idx" ON "magiclawyer"."Documento"("processoId");

-- CreateIndex
CREATE INDEX "Documento_clienteId_idx" ON "magiclawyer"."Documento"("clienteId");

-- CreateIndex
CREATE INDEX "Documento_tenantId_createdAt_idx" ON "magiclawyer"."Documento"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ProcessoDocumento_tenantId_processoId_idx" ON "magiclawyer"."ProcessoDocumento"("tenantId", "processoId");

-- CreateIndex
CREATE INDEX "ProcessoDocumento_tenantId_documentoId_idx" ON "magiclawyer"."ProcessoDocumento"("tenantId", "documentoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessoDocumento_processoId_documentoId_key" ON "magiclawyer"."ProcessoDocumento"("processoId", "documentoId");

-- CreateIndex
CREATE INDEX "Contrato_clienteId_idx" ON "magiclawyer"."Contrato"("clienteId");

-- CreateIndex
CREATE INDEX "Contrato_status_idx" ON "magiclawyer"."Contrato"("status");

-- CreateIndex
CREATE INDEX "Contrato_tipoId_idx" ON "magiclawyer"."Contrato"("tipoId");

-- CreateIndex
CREATE INDEX "Contrato_tenantId_deletedAt_idx" ON "magiclawyer"."Contrato"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "ModeloContrato_tipoId_idx" ON "magiclawyer"."ModeloContrato"("tipoId");

-- CreateIndex
CREATE INDEX "Tarefa_tenantId_status_idx" ON "magiclawyer"."Tarefa"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Tarefa_tenantId_responsavelId_idx" ON "magiclawyer"."Tarefa"("tenantId", "responsavelId");

-- CreateIndex
CREATE INDEX "Tarefa_tenantId_dataLimite_idx" ON "magiclawyer"."Tarefa"("tenantId", "dataLimite");

-- CreateIndex
CREATE INDEX "Tarefa_tenantId_deletedAt_idx" ON "magiclawyer"."Tarefa"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Plano_slug_key" ON "magiclawyer"."Plano"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSubscription_tenantId_key" ON "magiclawyer"."TenantSubscription"("tenantId");

-- CreateIndex
CREATE INDEX "Fatura_tenantId_status_idx" ON "magiclawyer"."Fatura"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_tenantId_numero_key" ON "magiclawyer"."Fatura"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "Pagamento_faturaId_idx" ON "magiclawyer"."Pagamento"("faturaId");

-- CreateIndex
CREATE INDEX "Pagamento_tenantId_status_idx" ON "magiclawyer"."Pagamento"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Pagamento_tenantId_createdAt_idx" ON "magiclawyer"."Pagamento"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "PagamentoComissao_tenantId_advogadoId_idx" ON "magiclawyer"."PagamentoComissao"("tenantId", "advogadoId");

-- CreateIndex
CREATE INDEX "PagamentoComissao_tenantId_status_idx" ON "magiclawyer"."PagamentoComissao"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PagamentoComissao_pagamentoId_idx" ON "magiclawyer"."PagamentoComissao"("pagamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoComissao_pagamentoId_advogadoId_key" ON "magiclawyer"."PagamentoComissao"("pagamentoId", "advogadoId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_entidade_idx" ON "audit"."audit_logs"("tenantId", "entidade");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit"."audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_usuarioId_idx" ON "audit"."audit_logs"("tenantId", "usuarioId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_acao_idx" ON "audit"."audit_logs"("tenantId", "acao");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_entidade_entidadeId_idx" ON "audit"."audit_logs"("tenantId", "entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "Evento_tenantId_dataInicio_idx" ON "magiclawyer"."Evento"("tenantId", "dataInicio");

-- CreateIndex
CREATE INDEX "Evento_tenantId_dataFim_idx" ON "magiclawyer"."Evento"("tenantId", "dataFim");

-- CreateIndex
CREATE INDEX "Evento_tenantId_status_idx" ON "magiclawyer"."Evento"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Evento_processoId_idx" ON "magiclawyer"."Evento"("processoId");

-- CreateIndex
CREATE INDEX "Evento_clienteId_idx" ON "magiclawyer"."Evento"("clienteId");

-- CreateIndex
CREATE INDEX "Evento_advogadoResponsavelId_idx" ON "magiclawyer"."Evento"("advogadoResponsavelId");

-- CreateIndex
CREATE INDEX "Evento_googleEventId_idx" ON "magiclawyer"."Evento"("googleEventId");

-- CreateIndex
CREATE INDEX "EventoParticipante_tenantId_eventoId_idx" ON "magiclawyer"."EventoParticipante"("tenantId", "eventoId");

-- CreateIndex
CREATE INDEX "EventoParticipante_tenantId_status_idx" ON "magiclawyer"."EventoParticipante"("tenantId", "status");

-- CreateIndex
CREATE INDEX "EventoParticipante_participanteEmail_idx" ON "magiclawyer"."EventoParticipante"("participanteEmail");

-- CreateIndex
CREATE UNIQUE INDEX "EventoParticipante_eventoId_participanteEmail_key" ON "magiclawyer"."EventoParticipante"("eventoId", "participanteEmail");

-- CreateIndex
CREATE INDEX "DocumentoAssinatura_tenantId_status_idx" ON "magiclawyer"."DocumentoAssinatura"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DocumentoAssinatura_tenantId_clienteId_idx" ON "magiclawyer"."DocumentoAssinatura"("tenantId", "clienteId");

-- CreateIndex
CREATE INDEX "DocumentoAssinatura_processoId_idx" ON "magiclawyer"."DocumentoAssinatura"("processoId");

-- CreateIndex
CREATE INDEX "DocumentoAssinatura_clicksignDocumentId_idx" ON "magiclawyer"."DocumentoAssinatura"("clicksignDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoritosJuiz_tenantId_juizId_usuarioId_key" ON "magiclawyer"."FavoritosJuiz"("tenantId", "juizId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "PacotesJuiz_nome_key" ON "magiclawyer"."PacotesJuiz"("nome");

-- CreateIndex
CREATE INDEX "PacotesJuiz_status_idx" ON "magiclawyer"."PacotesJuiz"("status");

-- CreateIndex
CREATE INDEX "PacotesJuiz_superAdminId_idx" ON "magiclawyer"."PacotesJuiz"("superAdminId");

-- CreateIndex
CREATE INDEX "PacoteJuizItems_pacoteId_idx" ON "magiclawyer"."PacoteJuizItems"("pacoteId");

-- CreateIndex
CREATE INDEX "PacoteJuizItems_juizId_idx" ON "magiclawyer"."PacoteJuizItems"("juizId");

-- CreateIndex
CREATE UNIQUE INDEX "PacoteJuizItems_pacoteId_juizId_key" ON "magiclawyer"."PacoteJuizItems"("pacoteId", "juizId");

-- CreateIndex
CREATE INDEX "AssinaturasPacoteJuiz_tenantId_idx" ON "magiclawyer"."AssinaturasPacoteJuiz"("tenantId");

-- CreateIndex
CREATE INDEX "AssinaturasPacoteJuiz_pacoteId_idx" ON "magiclawyer"."AssinaturasPacoteJuiz"("pacoteId");

-- CreateIndex
CREATE INDEX "AssinaturasPacoteJuiz_status_idx" ON "magiclawyer"."AssinaturasPacoteJuiz"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracoesPreco_chave_key" ON "magiclawyer"."ConfiguracoesPreco"("chave");

-- CreateIndex
CREATE INDEX "ConfiguracoesPreco_chave_idx" ON "magiclawyer"."ConfiguracoesPreco"("chave");

-- CreateIndex
CREATE INDEX "ConfiguracoesPreco_categoria_idx" ON "magiclawyer"."ConfiguracoesPreco"("categoria");

-- CreateIndex
CREATE INDEX "tickets_userId_idx" ON "support"."tickets"("userId");

-- CreateIndex
CREATE INDEX "tickets_tenantId_idx" ON "support"."tickets"("tenantId");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "support"."tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_priority_idx" ON "support"."tickets"("priority");

-- CreateIndex
CREATE INDEX "tickets_createdAt_idx" ON "support"."tickets"("createdAt");

-- CreateIndex
CREATE INDEX "ticket_messages_ticketId_idx" ON "support"."ticket_messages"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_messages_userId_idx" ON "support"."ticket_messages"("userId");

-- CreateIndex
CREATE INDEX "ticket_messages_createdAt_idx" ON "support"."ticket_messages"("createdAt");

-- CreateIndex
CREATE INDEX "ticket_attachments_ticketId_idx" ON "support"."ticket_attachments"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_attachments_userId_idx" ON "support"."ticket_attachments"("userId");

-- CreateIndex
CREATE INDEX "ModeloProcuracao_tenantId_ativo_idx" ON "magiclawyer"."ModeloProcuracao"("tenantId", "ativo");

-- CreateIndex
CREATE INDEX "ModeloProcuracao_tenantId_categoria_idx" ON "magiclawyer"."ModeloProcuracao"("tenantId", "categoria");

-- AddForeignKey
ALTER TABLE "magiclawyer"."AreaProcesso" ADD CONSTRAINT "AreaProcesso_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."TipoContrato" ADD CONSTRAINT "TipoContrato_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."CategoriaTarefa" ADD CONSTRAINT "CategoriaTarefa_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Tenant" ADD CONSTRAINT "Tenant_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "magiclawyer"."SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Endereco" ADD CONSTRAINT "Endereco_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Endereco" ADD CONSTRAINT "Endereco_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Endereco" ADD CONSTRAINT "Endereco_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "magiclawyer"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."TenantEndereco" ADD CONSTRAINT "TenantEndereco_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."TenantBranding" ADD CONSTRAINT "TenantBranding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Usuario" ADD CONSTRAINT "Usuario_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Usuario" ADD CONSTRAINT "Usuario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."SuperAdminAuditLog" ADD CONSTRAINT "SuperAdminAuditLog_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "magiclawyer"."SuperAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Advogado" ADD CONSTRAINT "Advogado_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Advogado" ADD CONSTRAINT "Advogado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Cliente" ADD CONSTRAINT "Cliente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Cliente" ADD CONSTRAINT "Cliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."AdvogadoCliente" ADD CONSTRAINT "AdvogadoCliente_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "magiclawyer"."Advogado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."AdvogadoCliente" ADD CONSTRAINT "AdvogadoCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "magiclawyer"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."AdvogadoCliente" ADD CONSTRAINT "AdvogadoCliente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Juiz" ADD CONSTRAINT "Juiz_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "magiclawyer"."SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Juiz" ADD CONSTRAINT "Juiz_tribunalId_fkey" FOREIGN KEY ("tribunalId") REFERENCES "magiclawyer"."Tribunal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Tribunal" ADD CONSTRAINT "Tribunal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Notificacao" ADD CONSTRAINT "Notificacao_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Notificacao" ADD CONSTRAINT "Notificacao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."NotificacaoUsuario" ADD CONSTRAINT "NotificacaoUsuario_notificacaoId_fkey" FOREIGN KEY ("notificacaoId") REFERENCES "magiclawyer"."Notificacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."NotificacaoUsuario" ADD CONSTRAINT "NotificacaoUsuario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."NotificacaoUsuario" ADD CONSTRAINT "NotificacaoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."UsuarioPermissao" ADD CONSTRAINT "UsuarioPermissao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."UsuarioPermissao" ADD CONSTRAINT "UsuarioPermissao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Processo" ADD CONSTRAINT "Processo_advogadoResponsavelId_fkey" FOREIGN KEY ("advogadoResponsavelId") REFERENCES "magiclawyer"."Advogado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Processo" ADD CONSTRAINT "Processo_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "magiclawyer"."AreaProcesso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Processo" ADD CONSTRAINT "Processo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "magiclawyer"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Processo" ADD CONSTRAINT "Processo_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "magiclawyer"."Juiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Processo" ADD CONSTRAINT "Processo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Processo" ADD CONSTRAINT "Processo_tribunalId_fkey" FOREIGN KEY ("tribunalId") REFERENCES "magiclawyer"."Tribunal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Procuracao" ADD CONSTRAINT "Procuracao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "magiclawyer"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Procuracao" ADD CONSTRAINT "Procuracao_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "magiclawyer"."ModeloProcuracao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Procuracao" ADD CONSTRAINT "Procuracao_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Procuracao" ADD CONSTRAINT "Procuracao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ProcuracaoProcesso" ADD CONSTRAINT "ProcuracaoProcesso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "magiclawyer"."Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ProcuracaoProcesso" ADD CONSTRAINT "ProcuracaoProcesso_procuracaoId_fkey" FOREIGN KEY ("procuracaoId") REFERENCES "magiclawyer"."Procuracao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ProcuracaoProcesso" ADD CONSTRAINT "ProcuracaoProcesso_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ProcuracaoAdvogado" ADD CONSTRAINT "ProcuracaoAdvogado_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "magiclawyer"."Advogado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ProcuracaoAdvogado" ADD CONSTRAINT "ProcuracaoAdvogado_procuracaoId_fkey" FOREIGN KEY ("procuracaoId") REFERENCES "magiclawyer"."Procuracao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ProcuracaoAdvogado" ADD CONSTRAINT "ProcuracaoAdvogado_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."MovimentacaoProcesso" ADD CONSTRAINT "MovimentacaoProcesso_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."MovimentacaoProcesso" ADD CONSTRAINT "MovimentacaoProcesso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "magiclawyer"."Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."MovimentacaoProcesso" ADD CONSTRAINT "MovimentacaoProcesso_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Documento" ADD CONSTRAINT "Documento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "magiclawyer"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Documento" ADD CONSTRAINT "Documento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "magiclawyer"."Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Documento" ADD CONSTRAINT "Documento_movimentacaoId_fkey" FOREIGN KEY ("movimentacaoId") REFERENCES "magiclawyer"."MovimentacaoProcesso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Documento" ADD CONSTRAINT "Documento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "magiclawyer"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Documento" ADD CONSTRAINT "Documento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Documento" ADD CONSTRAINT "Documento_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ProcessoDocumento" ADD CONSTRAINT "ProcessoDocumento_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ProcessoDocumento" ADD CONSTRAINT "ProcessoDocumento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "magiclawyer"."Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ProcessoDocumento" ADD CONSTRAINT "ProcessoDocumento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "magiclawyer"."Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ProcessoDocumento" ADD CONSTRAINT "ProcessoDocumento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Contrato" ADD CONSTRAINT "Contrato_advogadoResponsavelId_fkey" FOREIGN KEY ("advogadoResponsavelId") REFERENCES "magiclawyer"."Advogado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "magiclawyer"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Contrato" ADD CONSTRAINT "Contrato_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Contrato" ADD CONSTRAINT "Contrato_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "magiclawyer"."ModeloContrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Contrato" ADD CONSTRAINT "Contrato_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "magiclawyer"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Contrato" ADD CONSTRAINT "Contrato_responsavelUsuarioId_fkey" FOREIGN KEY ("responsavelUsuarioId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Contrato" ADD CONSTRAINT "Contrato_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Contrato" ADD CONSTRAINT "Contrato_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "magiclawyer"."TipoContrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ModeloContrato" ADD CONSTRAINT "ModeloContrato_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ModeloContrato" ADD CONSTRAINT "ModeloContrato_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "magiclawyer"."TipoContrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Tarefa" ADD CONSTRAINT "Tarefa_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "magiclawyer"."CategoriaTarefa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Tarefa" ADD CONSTRAINT "Tarefa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "magiclawyer"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Tarefa" ADD CONSTRAINT "Tarefa_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Tarefa" ADD CONSTRAINT "Tarefa_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "magiclawyer"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Tarefa" ADD CONSTRAINT "Tarefa_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Tarefa" ADD CONSTRAINT "Tarefa_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."TenantSubscription" ADD CONSTRAINT "TenantSubscription_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "magiclawyer"."Plano"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."TenantSubscription" ADD CONSTRAINT "TenantSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Fatura" ADD CONSTRAINT "Fatura_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "magiclawyer"."Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Fatura" ADD CONSTRAINT "Fatura_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "magiclawyer"."TenantSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Fatura" ADD CONSTRAINT "Fatura_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Pagamento" ADD CONSTRAINT "Pagamento_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "magiclawyer"."Fatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Pagamento" ADD CONSTRAINT "Pagamento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."PagamentoComissao" ADD CONSTRAINT "PagamentoComissao_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "magiclawyer"."Advogado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."PagamentoComissao" ADD CONSTRAINT "PagamentoComissao_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "magiclawyer"."Pagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."PagamentoComissao" ADD CONSTRAINT "PagamentoComissao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit"."audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit"."audit_logs" ADD CONSTRAINT "audit_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Evento" ADD CONSTRAINT "Evento_advogadoResponsavelId_fkey" FOREIGN KEY ("advogadoResponsavelId") REFERENCES "magiclawyer"."Advogado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Evento" ADD CONSTRAINT "Evento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "magiclawyer"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Evento" ADD CONSTRAINT "Evento_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Evento" ADD CONSTRAINT "Evento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "magiclawyer"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Evento" ADD CONSTRAINT "Evento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."EventoParticipante" ADD CONSTRAINT "EventoParticipante_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "magiclawyer"."Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."EventoParticipante" ADD CONSTRAINT "EventoParticipante_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_advogadoResponsavelId_fkey" FOREIGN KEY ("advogadoResponsavelId") REFERENCES "magiclawyer"."Advogado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "magiclawyer"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "magiclawyer"."Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "magiclawyer"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Julgamentos" ADD CONSTRAINT "Julgamentos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Julgamentos" ADD CONSTRAINT "Julgamentos_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "magiclawyer"."Juiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Julgamentos" ADD CONSTRAINT "Julgamentos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "magiclawyer"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."Julgamentos" ADD CONSTRAINT "Julgamentos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."AnalisesJuiz" ADD CONSTRAINT "AnalisesJuiz_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."AnalisesJuiz" ADD CONSTRAINT "AnalisesJuiz_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "magiclawyer"."Juiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."AnalisesJuiz" ADD CONSTRAINT "AnalisesJuiz_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."FavoritosJuiz" ADD CONSTRAINT "FavoritosJuiz_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "magiclawyer"."Juiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."FavoritosJuiz" ADD CONSTRAINT "FavoritosJuiz_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."FavoritosJuiz" ADD CONSTRAINT "FavoritosJuiz_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."AcessosJuiz" ADD CONSTRAINT "AcessosJuiz_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "magiclawyer"."Juiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."AcessosJuiz" ADD CONSTRAINT "AcessosJuiz_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."AcessosJuiz" ADD CONSTRAINT "AcessosJuiz_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."PacotesJuiz" ADD CONSTRAINT "PacotesJuiz_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "magiclawyer"."SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."PacoteJuizItems" ADD CONSTRAINT "PacoteJuizItems_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "magiclawyer"."Juiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."PacoteJuizItems" ADD CONSTRAINT "PacoteJuizItems_pacoteId_fkey" FOREIGN KEY ("pacoteId") REFERENCES "magiclawyer"."PacotesJuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."AssinaturasPacoteJuiz" ADD CONSTRAINT "AssinaturasPacoteJuiz_pacoteId_fkey" FOREIGN KEY ("pacoteId") REFERENCES "magiclawyer"."PacotesJuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."AssinaturasPacoteJuiz" ADD CONSTRAINT "AssinaturasPacoteJuiz_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ConfiguracoesPreco" ADD CONSTRAINT "ConfiguracoesPreco_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "magiclawyer"."SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."tickets" ADD CONSTRAINT "tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."tickets" ADD CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support"."tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."ticket_messages" ADD CONSTRAINT "ticket_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support"."tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support"."ticket_attachments" ADD CONSTRAINT "ticket_attachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "magiclawyer"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magiclawyer"."ModeloProcuracao" ADD CONSTRAINT "ModeloProcuracao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "magiclawyer"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
