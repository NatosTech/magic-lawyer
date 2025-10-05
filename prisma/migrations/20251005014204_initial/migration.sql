-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ADVOGADO', 'SECRETARIA', 'FINANCEIRO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "public"."TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TipoPessoa" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "public"."TipoEndereco" AS ENUM ('MATRIZ', 'FILIAL', 'ESCRITORIO');

-- CreateEnum
CREATE TYPE "public"."ProcessoStatus" AS ENUM ('RASCUNHO', 'EM_ANDAMENTO', 'SUSPENSO', 'ENCERRADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "public"."MovimentacaoTipo" AS ENUM ('ANDAMENTO', 'PRAZO', 'INTIMACAO', 'AUDIENCIA', 'ANEXO', 'OUTRO');

-- CreateEnum
CREATE TYPE "public"."ContratoStatus" AS ENUM ('RASCUNHO', 'ATIVO', 'SUSPENSO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."TarefaStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."TarefaPrioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "public"."NotificacaoTipo" AS ENUM ('SISTEMA', 'PRAZO', 'DOCUMENTO', 'MENSAGEM', 'FINANCEIRO', 'OUTRO');

-- CreateEnum
CREATE TYPE "public"."NotificacaoPrioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "public"."NotificacaoStatus" AS ENUM ('NAO_LIDA', 'LIDA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "public"."NotificacaoCanal" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'TELEGRAM', 'PUSH');

-- CreateEnum
CREATE TYPE "public"."TenantPermission" AS ENUM ('CONFIGURACOES_ESCRITORIO', 'EQUIPE_GERENCIAR', 'FINANCEIRO_GERENCIAR');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('TRIAL', 'ATIVA', 'INADIMPLENTE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('RASCUNHO', 'ABERTA', 'PAGA', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDENTE', 'PROCESSANDO', 'PAGO', 'FALHOU', 'ESTORNADO');

-- CreateEnum
CREATE TYPE "public"."DocumentoOrigem" AS ENUM ('CLIENTE', 'ESCRITORIO', 'SISTEMA');

-- CreateEnum
CREATE TYPE "public"."ProcuracaoEmitidaPor" AS ENUM ('ESCRITORIO', 'ADVOGADO');

-- CreateEnum
CREATE TYPE "public"."ProcuracaoStatus" AS ENUM ('RASCUNHO', 'PENDENTE_ASSINATURA', 'VIGENTE', 'REVOGADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "public"."EventoTipo" AS ENUM ('AUDIENCIA', 'REUNIAO', 'CONSULTA', 'PRAZO', 'LEMBRETE', 'OUTRO');

-- CreateEnum
CREATE TYPE "public"."EventoStatus" AS ENUM ('AGENDADO', 'CONFIRMADO', 'CANCELADO', 'REALIZADO', 'ADIADO');

-- CreateEnum
CREATE TYPE "public"."EventoRecorrencia" AS ENUM ('NENHUMA', 'DIARIA', 'SEMANAL', 'MENSAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "public"."DocumentoAssinaturaStatus" AS ENUM ('PENDENTE', 'ASSINADO', 'REJEITADO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."TipoComissao" AS ENUM ('HONORARIOS', 'ACAO_GANHA', 'CUSTAS', 'OUTROS');

-- CreateEnum
CREATE TYPE "public"."JuizStatus" AS ENUM ('ATIVO', 'INATIVO', 'APOSENTADO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "public"."EspecialidadeJuridica" AS ENUM ('CIVIL', 'CRIMINAL', 'TRABALHISTA', 'FAMILIA', 'TRIBUTARIO', 'ADMINISTRATIVO', 'EMPRESARIAL', 'CONSUMIDOR', 'AMBIENTAL', 'ELETORAL', 'MILITAR', 'PREVIDENCIARIO', 'CONSTITUCIONAL', 'INTERNACIONAL', 'OUTROS');

-- CreateEnum
CREATE TYPE "public"."JuizNivel" AS ENUM ('JUIZ_SUBSTITUTO', 'JUIZ_TITULAR', 'DESEMBARGADOR', 'MINISTRO', 'OUTROS');

-- CreateTable
CREATE TABLE "public"."AreaProcesso" (
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
CREATE TABLE "public"."TipoContrato" (
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
CREATE TABLE "public"."CategoriaTarefa" (
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
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "status" "public"."TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "tipoPessoa" "public"."TipoPessoa" NOT NULL DEFAULT 'JURIDICA',
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
CREATE TABLE "public"."TenantEndereco" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "apelido" TEXT NOT NULL,
    "tipo" "public"."TipoEndereco" NOT NULL DEFAULT 'ESCRITORIO',
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
CREATE TABLE "public"."TenantBranding" (
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
CREATE TABLE "public"."Usuario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'SECRETARIA',
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SuperAdmin" (
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
CREATE TABLE "public"."SuperAdminAuditLog" (
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
CREATE TABLE "public"."Advogado" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "oabNumero" TEXT,
    "oabUf" TEXT,
    "especialidades" "public"."EspecialidadeJuridica"[],
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
CREATE TABLE "public"."Cliente" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipoPessoa" "public"."TipoPessoa" NOT NULL,
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
    "endereco" JSONB,
    "observacoes" TEXT,
    "usuarioId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdvogadoCliente" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "relacionamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvogadoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Juiz" (
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
    "status" "public"."JuizStatus" NOT NULL DEFAULT 'ATIVO',
    "nivel" "public"."JuizNivel" NOT NULL DEFAULT 'JUIZ_TITULAR',
    "especialidades" "public"."EspecialidadeJuridica"[],
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
CREATE TABLE "public"."Tribunal" (
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
CREATE TABLE "public"."Notificacao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" "public"."NotificacaoTipo" NOT NULL DEFAULT 'SISTEMA',
    "prioridade" "public"."NotificacaoPrioridade" NOT NULL DEFAULT 'MEDIA',
    "canais" "public"."NotificacaoCanal"[] DEFAULT ARRAY['IN_APP']::"public"."NotificacaoCanal"[],
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
CREATE TABLE "public"."NotificacaoUsuario" (
    "id" TEXT NOT NULL,
    "notificacaoId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "canal" "public"."NotificacaoCanal" NOT NULL DEFAULT 'IN_APP',
    "status" "public"."NotificacaoStatus" NOT NULL DEFAULT 'NAO_LIDA',
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
CREATE TABLE "public"."UsuarioPermissao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "permissao" "public"."TenantPermission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioPermissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Processo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titulo" TEXT,
    "descricao" TEXT,
    "status" "public"."ProcessoStatus" NOT NULL DEFAULT 'RASCUNHO',
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
CREATE TABLE "public"."Procuracao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" TEXT,
    "arquivoUrl" TEXT,
    "observacoes" TEXT,
    "emitidaEm" TIMESTAMP(3),
    "validaAte" TIMESTAMP(3),
    "revogadaEm" TIMESTAMP(3),
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "status" "public"."ProcuracaoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "assinadaPeloClienteEm" TIMESTAMP(3),
    "emitidaPor" "public"."ProcuracaoEmitidaPor" NOT NULL DEFAULT 'ESCRITORIO',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procuracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProcuracaoProcesso" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "procuracaoId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcuracaoProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProcuracaoAdvogado" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "procuracaoId" TEXT NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcuracaoAdvogado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MovimentacaoProcesso" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "public"."MovimentacaoTipo",
    "dataMovimentacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prazo" TIMESTAMP(3),
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimentacaoProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Documento" (
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
    "origem" "public"."DocumentoOrigem" NOT NULL DEFAULT 'ESCRITORIO',
    "visivelParaCliente" BOOLEAN NOT NULL DEFAULT false,
    "visivelParaEquipe" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProcessoDocumento" (
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
CREATE TABLE "public"."Contrato" (
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
    "status" "public"."ContratoStatus" NOT NULL DEFAULT 'RASCUNHO',
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
CREATE TABLE "public"."ModeloContrato" (
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
CREATE TABLE "public"."Tarefa" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "public"."TarefaStatus" NOT NULL DEFAULT 'PENDENTE',
    "prioridade" "public"."TarefaPrioridade" NOT NULL DEFAULT 'MEDIA',
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
CREATE TABLE "public"."Plano" (
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
CREATE TABLE "public"."TenantSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planoId" TEXT,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
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
CREATE TABLE "public"."Fatura" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "contratoId" TEXT,
    "numero" TEXT,
    "descricao" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'RASCUNHO',
    "comissaoAdvogado" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "valorComissao" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "tipoComissao" "public"."TipoComissao" NOT NULL DEFAULT 'HONORARIOS',
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
CREATE TABLE "public"."Pagamento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "faturaId" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
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
CREATE TABLE "public"."PagamentoComissao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pagamentoId" TEXT NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "valorComissao" DECIMAL(14,2) NOT NULL,
    "percentualComissao" DECIMAL(5,2) NOT NULL,
    "tipoComissao" "public"."TipoComissao" NOT NULL DEFAULT 'HONORARIOS',
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagamentoComissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
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

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "public"."EventoTipo" NOT NULL DEFAULT 'REUNIAO',
    "status" "public"."EventoStatus" NOT NULL DEFAULT 'AGENDADO',
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "participantes" TEXT[],
    "processoId" TEXT,
    "clienteId" TEXT,
    "advogadoResponsavelId" TEXT,
    "criadoPorId" TEXT,
    "recorrencia" "public"."EventoRecorrencia" NOT NULL DEFAULT 'NENHUMA',
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
CREATE TABLE "public"."DocumentoAssinatura" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "processoId" TEXT,
    "clienteId" TEXT NOT NULL,
    "advogadoResponsavelId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "public"."DocumentoAssinaturaStatus" NOT NULL DEFAULT 'PENDENTE',
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
CREATE TABLE "public"."Julgamentos" (
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
CREATE TABLE "public"."AnalisesJuiz" (
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
CREATE TABLE "public"."FavoritosJuiz" (
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
CREATE TABLE "public"."AcessosJuiz" (
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

-- CreateIndex
CREATE INDEX "AreaProcesso_tenantId_idx" ON "public"."AreaProcesso"("tenantId");

-- CreateIndex
CREATE INDEX "AreaProcesso_nome_idx" ON "public"."AreaProcesso"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "AreaProcesso_tenantId_slug_key" ON "public"."AreaProcesso"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "TipoContrato_tenantId_idx" ON "public"."TipoContrato"("tenantId");

-- CreateIndex
CREATE INDEX "TipoContrato_nome_idx" ON "public"."TipoContrato"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "TipoContrato_tenantId_slug_key" ON "public"."TipoContrato"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "CategoriaTarefa_tenantId_idx" ON "public"."CategoriaTarefa"("tenantId");

-- CreateIndex
CREATE INDEX "CategoriaTarefa_nome_idx" ON "public"."CategoriaTarefa"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaTarefa_tenantId_slug_key" ON "public"."CategoriaTarefa"("tenantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "public"."Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "public"."Tenant"("domain");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "public"."Tenant"("status");

-- CreateIndex
CREATE INDEX "Tenant_superAdminId_idx" ON "public"."Tenant"("superAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_documento_key" ON "public"."Tenant"("documento");

-- CreateIndex
CREATE INDEX "TenantEndereco_tenantId_principal_idx" ON "public"."TenantEndereco"("tenantId", "principal");

-- CreateIndex
CREATE UNIQUE INDEX "TenantEndereco_tenantId_apelido_key" ON "public"."TenantEndereco"("tenantId", "apelido");

-- CreateIndex
CREATE UNIQUE INDEX "TenantBranding_tenantId_key" ON "public"."TenantBranding"("tenantId");

-- CreateIndex
CREATE INDEX "Usuario_role_idx" ON "public"."Usuario"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_tenantId_key" ON "public"."Usuario"("email", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_email_key" ON "public"."SuperAdmin"("email");

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_superAdminId_idx" ON "public"."SuperAdminAuditLog"("superAdminId");

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_acao_idx" ON "public"."SuperAdminAuditLog"("acao");

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_entidade_idx" ON "public"."SuperAdminAuditLog"("entidade");

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_createdAt_idx" ON "public"."SuperAdminAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Advogado_usuarioId_key" ON "public"."Advogado"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Advogado_tenantId_oabUf_oabNumero_key" ON "public"."Advogado"("tenantId", "oabUf", "oabNumero");

-- CreateIndex
CREATE INDEX "Cliente_nome_idx" ON "public"."Cliente"("nome");

-- CreateIndex
CREATE INDEX "Cliente_documento_idx" ON "public"."Cliente"("documento");

-- CreateIndex
CREATE INDEX "Cliente_tenantId_deletedAt_idx" ON "public"."Cliente"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_tenantId_documento_key" ON "public"."Cliente"("tenantId", "documento");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_tenantId_usuarioId_key" ON "public"."Cliente"("tenantId", "usuarioId");

-- CreateIndex
CREATE INDEX "AdvogadoCliente_clienteId_idx" ON "public"."AdvogadoCliente"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "AdvogadoCliente_advogadoId_clienteId_key" ON "public"."AdvogadoCliente"("advogadoId", "clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Juiz_cpf_key" ON "public"."Juiz"("cpf");

-- CreateIndex
CREATE INDEX "Juiz_nome_idx" ON "public"."Juiz"("nome");

-- CreateIndex
CREATE INDEX "Juiz_superAdminId_idx" ON "public"."Juiz"("superAdminId");

-- CreateIndex
CREATE INDEX "Juiz_status_idx" ON "public"."Juiz"("status");

-- CreateIndex
CREATE INDEX "Juiz_especialidades_idx" ON "public"."Juiz"("especialidades");

-- CreateIndex
CREATE UNIQUE INDEX "Tribunal_nome_uf_key" ON "public"."Tribunal"("nome", "uf");

-- CreateIndex
CREATE INDEX "Notificacao_tenantId_tipo_idx" ON "public"."Notificacao"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "Notificacao_tenantId_prioridade_idx" ON "public"."Notificacao"("tenantId", "prioridade");

-- CreateIndex
CREATE INDEX "Notificacao_tenantId_agendarPara_idx" ON "public"."Notificacao"("tenantId", "agendarPara");

-- CreateIndex
CREATE INDEX "Notificacao_tenantId_createdAt_idx" ON "public"."Notificacao"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificacaoUsuario_tenantId_usuarioId_status_idx" ON "public"."NotificacaoUsuario"("tenantId", "usuarioId", "status");

-- CreateIndex
CREATE INDEX "NotificacaoUsuario_tenantId_createdAt_idx" ON "public"."NotificacaoUsuario"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificacaoUsuario_notificacaoId_usuarioId_canal_key" ON "public"."NotificacaoUsuario"("notificacaoId", "usuarioId", "canal");

-- CreateIndex
CREATE INDEX "UsuarioPermissao_tenantId_permissao_idx" ON "public"."UsuarioPermissao"("tenantId", "permissao");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioPermissao_tenantId_usuarioId_permissao_key" ON "public"."UsuarioPermissao"("tenantId", "usuarioId", "permissao");

-- CreateIndex
CREATE INDEX "Processo_tenantId_status_idx" ON "public"."Processo"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Processo_tenantId_clienteId_idx" ON "public"."Processo"("tenantId", "clienteId");

-- CreateIndex
CREATE INDEX "Processo_tenantId_createdAt_idx" ON "public"."Processo"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Processo_tenantId_deletedAt_idx" ON "public"."Processo"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Processo_tenantId_numero_key" ON "public"."Processo"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "Procuracao_tenantId_clienteId_idx" ON "public"."Procuracao"("tenantId", "clienteId");

-- CreateIndex
CREATE INDEX "Procuracao_tenantId_ativa_idx" ON "public"."Procuracao"("tenantId", "ativa");

-- CreateIndex
CREATE INDEX "ProcuracaoProcesso_tenantId_processoId_idx" ON "public"."ProcuracaoProcesso"("tenantId", "processoId");

-- CreateIndex
CREATE INDEX "ProcuracaoProcesso_tenantId_procuracaoId_idx" ON "public"."ProcuracaoProcesso"("tenantId", "procuracaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcuracaoProcesso_procuracaoId_processoId_key" ON "public"."ProcuracaoProcesso"("procuracaoId", "processoId");

-- CreateIndex
CREATE INDEX "ProcuracaoAdvogado_tenantId_advogadoId_idx" ON "public"."ProcuracaoAdvogado"("tenantId", "advogadoId");

-- CreateIndex
CREATE INDEX "ProcuracaoAdvogado_tenantId_procuracaoId_idx" ON "public"."ProcuracaoAdvogado"("tenantId", "procuracaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcuracaoAdvogado_procuracaoId_advogadoId_key" ON "public"."ProcuracaoAdvogado"("procuracaoId", "advogadoId");

-- CreateIndex
CREATE INDEX "MovimentacaoProcesso_processoId_idx" ON "public"."MovimentacaoProcesso"("processoId");

-- CreateIndex
CREATE INDEX "MovimentacaoProcesso_dataMovimentacao_idx" ON "public"."MovimentacaoProcesso"("dataMovimentacao");

-- CreateIndex
CREATE INDEX "Documento_tenantId_visivelParaCliente_idx" ON "public"."Documento"("tenantId", "visivelParaCliente");

-- CreateIndex
CREATE INDEX "Documento_tenantId_deletedAt_idx" ON "public"."Documento"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Documento_processoId_idx" ON "public"."Documento"("processoId");

-- CreateIndex
CREATE INDEX "Documento_clienteId_idx" ON "public"."Documento"("clienteId");

-- CreateIndex
CREATE INDEX "Documento_tenantId_createdAt_idx" ON "public"."Documento"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ProcessoDocumento_tenantId_processoId_idx" ON "public"."ProcessoDocumento"("tenantId", "processoId");

-- CreateIndex
CREATE INDEX "ProcessoDocumento_tenantId_documentoId_idx" ON "public"."ProcessoDocumento"("tenantId", "documentoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessoDocumento_processoId_documentoId_key" ON "public"."ProcessoDocumento"("processoId", "documentoId");

-- CreateIndex
CREATE INDEX "Contrato_clienteId_idx" ON "public"."Contrato"("clienteId");

-- CreateIndex
CREATE INDEX "Contrato_status_idx" ON "public"."Contrato"("status");

-- CreateIndex
CREATE INDEX "Contrato_tipoId_idx" ON "public"."Contrato"("tipoId");

-- CreateIndex
CREATE INDEX "Contrato_tenantId_deletedAt_idx" ON "public"."Contrato"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "ModeloContrato_tipoId_idx" ON "public"."ModeloContrato"("tipoId");

-- CreateIndex
CREATE INDEX "Tarefa_tenantId_status_idx" ON "public"."Tarefa"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Tarefa_tenantId_responsavelId_idx" ON "public"."Tarefa"("tenantId", "responsavelId");

-- CreateIndex
CREATE INDEX "Tarefa_tenantId_dataLimite_idx" ON "public"."Tarefa"("tenantId", "dataLimite");

-- CreateIndex
CREATE INDEX "Tarefa_tenantId_deletedAt_idx" ON "public"."Tarefa"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Plano_slug_key" ON "public"."Plano"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSubscription_tenantId_key" ON "public"."TenantSubscription"("tenantId");

-- CreateIndex
CREATE INDEX "Fatura_tenantId_status_idx" ON "public"."Fatura"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_tenantId_numero_key" ON "public"."Fatura"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "Pagamento_faturaId_idx" ON "public"."Pagamento"("faturaId");

-- CreateIndex
CREATE INDEX "Pagamento_tenantId_status_idx" ON "public"."Pagamento"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Pagamento_tenantId_createdAt_idx" ON "public"."Pagamento"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "PagamentoComissao_tenantId_advogadoId_idx" ON "public"."PagamentoComissao"("tenantId", "advogadoId");

-- CreateIndex
CREATE INDEX "PagamentoComissao_tenantId_status_idx" ON "public"."PagamentoComissao"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PagamentoComissao_pagamentoId_idx" ON "public"."PagamentoComissao"("pagamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoComissao_pagamentoId_advogadoId_key" ON "public"."PagamentoComissao"("pagamentoId", "advogadoId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_entidade_idx" ON "public"."AuditLog"("tenantId", "entidade");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "public"."AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Evento_tenantId_dataInicio_idx" ON "public"."Evento"("tenantId", "dataInicio");

-- CreateIndex
CREATE INDEX "Evento_tenantId_dataFim_idx" ON "public"."Evento"("tenantId", "dataFim");

-- CreateIndex
CREATE INDEX "Evento_tenantId_status_idx" ON "public"."Evento"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Evento_processoId_idx" ON "public"."Evento"("processoId");

-- CreateIndex
CREATE INDEX "Evento_clienteId_idx" ON "public"."Evento"("clienteId");

-- CreateIndex
CREATE INDEX "Evento_advogadoResponsavelId_idx" ON "public"."Evento"("advogadoResponsavelId");

-- CreateIndex
CREATE INDEX "Evento_googleEventId_idx" ON "public"."Evento"("googleEventId");

-- CreateIndex
CREATE INDEX "DocumentoAssinatura_tenantId_status_idx" ON "public"."DocumentoAssinatura"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DocumentoAssinatura_tenantId_clienteId_idx" ON "public"."DocumentoAssinatura"("tenantId", "clienteId");

-- CreateIndex
CREATE INDEX "DocumentoAssinatura_processoId_idx" ON "public"."DocumentoAssinatura"("processoId");

-- CreateIndex
CREATE INDEX "DocumentoAssinatura_clicksignDocumentId_idx" ON "public"."DocumentoAssinatura"("clicksignDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoritosJuiz_tenantId_juizId_usuarioId_key" ON "public"."FavoritosJuiz"("tenantId", "juizId", "usuarioId");

-- AddForeignKey
ALTER TABLE "public"."AreaProcesso" ADD CONSTRAINT "AreaProcesso_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TipoContrato" ADD CONSTRAINT "TipoContrato_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CategoriaTarefa" ADD CONSTRAINT "CategoriaTarefa_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tenant" ADD CONSTRAINT "Tenant_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "public"."SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantEndereco" ADD CONSTRAINT "TenantEndereco_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantBranding" ADD CONSTRAINT "TenantBranding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SuperAdminAuditLog" ADD CONSTRAINT "SuperAdminAuditLog_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "public"."SuperAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Advogado" ADD CONSTRAINT "Advogado_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Advogado" ADD CONSTRAINT "Advogado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cliente" ADD CONSTRAINT "Cliente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cliente" ADD CONSTRAINT "Cliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdvogadoCliente" ADD CONSTRAINT "AdvogadoCliente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdvogadoCliente" ADD CONSTRAINT "AdvogadoCliente_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "public"."Advogado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdvogadoCliente" ADD CONSTRAINT "AdvogadoCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Juiz" ADD CONSTRAINT "Juiz_tribunalId_fkey" FOREIGN KEY ("tribunalId") REFERENCES "public"."Tribunal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Juiz" ADD CONSTRAINT "Juiz_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "public"."SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tribunal" ADD CONSTRAINT "Tribunal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notificacao" ADD CONSTRAINT "Notificacao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notificacao" ADD CONSTRAINT "Notificacao_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificacaoUsuario" ADD CONSTRAINT "NotificacaoUsuario_notificacaoId_fkey" FOREIGN KEY ("notificacaoId") REFERENCES "public"."Notificacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificacaoUsuario" ADD CONSTRAINT "NotificacaoUsuario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificacaoUsuario" ADD CONSTRAINT "NotificacaoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsuarioPermissao" ADD CONSTRAINT "UsuarioPermissao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsuarioPermissao" ADD CONSTRAINT "UsuarioPermissao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Processo" ADD CONSTRAINT "Processo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Processo" ADD CONSTRAINT "Processo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Processo" ADD CONSTRAINT "Processo_advogadoResponsavelId_fkey" FOREIGN KEY ("advogadoResponsavelId") REFERENCES "public"."Advogado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Processo" ADD CONSTRAINT "Processo_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "public"."Juiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Processo" ADD CONSTRAINT "Processo_tribunalId_fkey" FOREIGN KEY ("tribunalId") REFERENCES "public"."Tribunal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Processo" ADD CONSTRAINT "Processo_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."AreaProcesso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Procuracao" ADD CONSTRAINT "Procuracao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Procuracao" ADD CONSTRAINT "Procuracao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Procuracao" ADD CONSTRAINT "Procuracao_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcuracaoProcesso" ADD CONSTRAINT "ProcuracaoProcesso_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcuracaoProcesso" ADD CONSTRAINT "ProcuracaoProcesso_procuracaoId_fkey" FOREIGN KEY ("procuracaoId") REFERENCES "public"."Procuracao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcuracaoProcesso" ADD CONSTRAINT "ProcuracaoProcesso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcuracaoAdvogado" ADD CONSTRAINT "ProcuracaoAdvogado_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcuracaoAdvogado" ADD CONSTRAINT "ProcuracaoAdvogado_procuracaoId_fkey" FOREIGN KEY ("procuracaoId") REFERENCES "public"."Procuracao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcuracaoAdvogado" ADD CONSTRAINT "ProcuracaoAdvogado_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "public"."Advogado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimentacaoProcesso" ADD CONSTRAINT "MovimentacaoProcesso_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimentacaoProcesso" ADD CONSTRAINT "MovimentacaoProcesso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovimentacaoProcesso" ADD CONSTRAINT "MovimentacaoProcesso_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Documento" ADD CONSTRAINT "Documento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Documento" ADD CONSTRAINT "Documento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Documento" ADD CONSTRAINT "Documento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Documento" ADD CONSTRAINT "Documento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "public"."Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Documento" ADD CONSTRAINT "Documento_movimentacaoId_fkey" FOREIGN KEY ("movimentacaoId") REFERENCES "public"."MovimentacaoProcesso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Documento" ADD CONSTRAINT "Documento_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessoDocumento" ADD CONSTRAINT "ProcessoDocumento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessoDocumento" ADD CONSTRAINT "ProcessoDocumento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessoDocumento" ADD CONSTRAINT "ProcessoDocumento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "public"."Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProcessoDocumento" ADD CONSTRAINT "ProcessoDocumento_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "public"."ModeloContrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_advogadoResponsavelId_fkey" FOREIGN KEY ("advogadoResponsavelId") REFERENCES "public"."Advogado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "public"."TipoContrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_responsavelUsuarioId_fkey" FOREIGN KEY ("responsavelUsuarioId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModeloContrato" ADD CONSTRAINT "ModeloContrato_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModeloContrato" ADD CONSTRAINT "ModeloContrato_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "public"."TipoContrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tarefa" ADD CONSTRAINT "Tarefa_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tarefa" ADD CONSTRAINT "Tarefa_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tarefa" ADD CONSTRAINT "Tarefa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tarefa" ADD CONSTRAINT "Tarefa_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "public"."CategoriaTarefa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tarefa" ADD CONSTRAINT "Tarefa_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tarefa" ADD CONSTRAINT "Tarefa_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantSubscription" ADD CONSTRAINT "TenantSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantSubscription" ADD CONSTRAINT "TenantSubscription_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "public"."Plano"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fatura" ADD CONSTRAINT "Fatura_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fatura" ADD CONSTRAINT "Fatura_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."TenantSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fatura" ADD CONSTRAINT "Fatura_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "public"."Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pagamento" ADD CONSTRAINT "Pagamento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pagamento" ADD CONSTRAINT "Pagamento_faturaId_fkey" FOREIGN KEY ("faturaId") REFERENCES "public"."Fatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PagamentoComissao" ADD CONSTRAINT "PagamentoComissao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PagamentoComissao" ADD CONSTRAINT "PagamentoComissao_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "public"."Pagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PagamentoComissao" ADD CONSTRAINT "PagamentoComissao_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "public"."Advogado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evento" ADD CONSTRAINT "Evento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evento" ADD CONSTRAINT "Evento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evento" ADD CONSTRAINT "Evento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evento" ADD CONSTRAINT "Evento_advogadoResponsavelId_fkey" FOREIGN KEY ("advogadoResponsavelId") REFERENCES "public"."Advogado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evento" ADD CONSTRAINT "Evento_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "public"."Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_advogadoResponsavelId_fkey" FOREIGN KEY ("advogadoResponsavelId") REFERENCES "public"."Advogado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoAssinatura" ADD CONSTRAINT "DocumentoAssinatura_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Julgamentos" ADD CONSTRAINT "Julgamentos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Julgamentos" ADD CONSTRAINT "Julgamentos_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "public"."Juiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Julgamentos" ADD CONSTRAINT "Julgamentos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "public"."Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Julgamentos" ADD CONSTRAINT "Julgamentos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalisesJuiz" ADD CONSTRAINT "AnalisesJuiz_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalisesJuiz" ADD CONSTRAINT "AnalisesJuiz_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "public"."Juiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalisesJuiz" ADD CONSTRAINT "AnalisesJuiz_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavoritosJuiz" ADD CONSTRAINT "FavoritosJuiz_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavoritosJuiz" ADD CONSTRAINT "FavoritosJuiz_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "public"."Juiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavoritosJuiz" ADD CONSTRAINT "FavoritosJuiz_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AcessosJuiz" ADD CONSTRAINT "AcessosJuiz_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AcessosJuiz" ADD CONSTRAINT "AcessosJuiz_juizId_fkey" FOREIGN KEY ("juizId") REFERENCES "public"."Juiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AcessosJuiz" ADD CONSTRAINT "AcessosJuiz_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
