"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/prisma";
import { getSession } from "@/app/lib/auth";

async function getTenantId(): Promise<string> {
  const session = await getSession();

  if (!session?.user?.tenantId) {
    throw new Error("Tenant ID não encontrado na sessão");
  }

  return session.user.tenantId;
}

async function getUserId(): Promise<string> {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error("User ID não encontrado na sessão");
  }

  return session.user.id;
}

// ============================================
// LISTAR DADOS BANCÁRIOS
// ============================================

export async function listDadosBancarios(filters?: {
  usuarioId?: string;
  clienteId?: string;
  ativo?: boolean;
  principal?: boolean;
}) {
  try {
    const tenantId = await getTenantId();

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (filters?.usuarioId) {
      where.usuarioId = filters.usuarioId;
    }

    if (filters?.clienteId) {
      where.clienteId = filters.clienteId;
    }

    if (filters?.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    if (filters?.principal !== undefined) {
      where.principal = filters.principal;
    }

    const dadosBancarios = await prisma.dadosBancarios.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            documento: true,
          },
        },
        banco: {
          select: {
            codigo: true,
            nome: true,
          },
        },
      },
      orderBy: [
        { principal: "desc" },
        { ativo: "desc" },
        { createdAt: "desc" },
      ],
    });

    return {
      success: true,
      data: dadosBancarios,
    };
  } catch (error) {
    console.error("Erro ao listar dados bancários:", error);

    return {
      success: false,
      error: "Erro ao listar dados bancários",
      data: [],
    };
  }
}

// ============================================
// OBTER DADOS BANCÁRIOS POR ID
// ============================================

export async function getDadosBancarios(id: string) {
  try {
    const tenantId = await getTenantId();

    const dadosBancarios = await prisma.dadosBancarios.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        usuario: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            documento: true,
            telefone: true,
          },
        },
        banco: {
          select: {
            codigo: true,
            nome: true,
          },
        },
      },
    });

    if (!dadosBancarios) {
      return {
        success: false,
        error: "Dados bancários não encontrados",
      };
    }

    return {
      success: true,
      data: dadosBancarios,
    };
  } catch (error) {
    console.error("Erro ao buscar dados bancários:", error);

    return {
      success: false,
      error: "Erro ao buscar dados bancários",
    };
  }
}

// ============================================
// CRIAR DADOS BANCÁRIOS
// ============================================

export async function createDadosBancarios(data: {
  usuarioId?: string;
  clienteId?: string;
  tipoConta: "PESSOA_FISICA" | "PESSOA_JURIDICA";
  bancoCodigo: string;
  agencia: string;
  conta: string;
  digitoConta?: string;
  tipoContaBancaria: "CORRENTE" | "POUPANCA" | "SALARIO" | "INVESTIMENTO";
  chavePix?: string;
  tipoChavePix?: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "ALEATORIA";
  titularNome: string;
  titularDocumento: string;
  titularEmail?: string;
  titularTelefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  principal?: boolean;
  observacoes?: string;
}) {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId(); // ✅ ADICIONADO: Pegar o usuário logado

    // Permitir dados bancários do tenant (escritório) quando não há usuário/cliente específico
    // A validação foi removida para permitir dados bancários do próprio escritório

    // Se marcado como principal, desmarcar outros
    if (data.principal) {
      await prisma.dadosBancarios.updateMany({
        where: {
          tenantId,
          usuarioId: data.usuarioId || userId, // ✅ CORRIGIDO: Usar userId se não especificado
          clienteId: data.clienteId || null,
          principal: true,
        },
        data: {
          principal: false,
        },
      });
    }

    const dadosBancarios = await prisma.dadosBancarios.create({
      data: {
        tenantId,
        usuarioId: data.usuarioId || userId, // ✅ CORRIGIDO: Usar userId se não especificado
        clienteId: data.clienteId,
        tipoConta: data.tipoConta,
        bancoCodigo: data.bancoCodigo,
        agencia: data.agencia,
        conta: data.conta,
        digitoConta: data.digitoConta,
        tipoContaBancaria: data.tipoContaBancaria,
        chavePix: data.chavePix,
        tipoChavePix: data.tipoChavePix,
        titularNome: data.titularNome,
        titularDocumento: data.titularDocumento,
        titularEmail: data.titularEmail,
        titularTelefone: data.titularTelefone,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        principal: data.principal || false,
        observacoes: data.observacoes,
      },
      include: {
        usuario: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        cliente: {
          select: {
            nome: true,
            email: true,
          },
        },
        banco: {
          select: {
            codigo: true,
            nome: true,
          },
        },
      },
    });

    revalidatePath("/dados-bancarios");
    revalidatePath("/usuario/perfil");

    return {
      success: true,
      data: dadosBancarios,
      message: "Dados bancários criados com sucesso",
    };
  } catch (error) {
    console.error("Erro ao criar dados bancários:", error);

    return {
      success: false,
      error: "Erro ao criar dados bancários",
    };
  }
}

// ============================================
// ATUALIZAR DADOS BANCÁRIOS
// ============================================

export async function updateDadosBancarios(
  id: string,
  data: {
    tipoConta?: "PESSOA_FISICA" | "PESSOA_JURIDICA";
    bancoCodigo?: string;
    agencia?: string;
    conta?: string;
    digitoConta?: string;
    tipoContaBancaria?: "CORRENTE" | "POUPANCA" | "SALARIO" | "INVESTIMENTO";
    chavePix?: string;
    tipoChavePix?: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "ALEATORIA";
    titularNome?: string;
    titularDocumento?: string;
    titularEmail?: string;
    titularTelefone?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    ativo?: boolean;
    principal?: boolean;
    observacoes?: string;
  },
) {
  try {
    const tenantId = await getTenantId();

    // Verificar se os dados bancários existem
    const dadosExistente = await prisma.dadosBancarios.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!dadosExistente) {
      return {
        success: false,
        error: "Dados bancários não encontrados",
      };
    }

    // Se marcado como principal, desmarcar outros
    if (data.principal) {
      await prisma.dadosBancarios.updateMany({
        where: {
          tenantId,
          usuarioId: dadosExistente.usuarioId,
          clienteId: dadosExistente.clienteId,
          principal: true,
          id: { not: id },
        },
        data: {
          principal: false,
        },
      });
    }

    const dadosBancarios = await prisma.dadosBancarios.update({
      where: { id },
      data: {
        tipoConta: data.tipoConta,
        bancoCodigo: data.bancoCodigo,
        agencia: data.agencia,
        conta: data.conta,
        digitoConta: data.digitoConta,
        tipoContaBancaria: data.tipoContaBancaria,
        chavePix: data.chavePix,
        tipoChavePix: data.tipoChavePix,
        titularNome: data.titularNome,
        titularDocumento: data.titularDocumento,
        titularEmail: data.titularEmail,
        titularTelefone: data.titularTelefone,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        ativo: data.ativo,
        principal: data.principal,
        observacoes: data.observacoes,
      },
      include: {
        usuario: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        cliente: {
          select: {
            nome: true,
            email: true,
          },
        },
        banco: {
          select: {
            codigo: true,
            nome: true,
          },
        },
      },
    });

    revalidatePath("/dados-bancarios");
    revalidatePath("/usuario/perfil");

    return {
      success: true,
      data: dadosBancarios,
      message: "Dados bancários atualizados com sucesso",
    };
  } catch (error) {
    console.error("Erro ao atualizar dados bancários:", error);

    return {
      success: false,
      error: "Erro ao atualizar dados bancários",
    };
  }
}

// ============================================
// DELETAR DADOS BANCÁRIOS (SOFT DELETE)
// ============================================

export async function deleteDadosBancarios(id: string) {
  try {
    const tenantId = await getTenantId();

    // Verificar se os dados bancários existem
    const dadosBancarios = await prisma.dadosBancarios.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!dadosBancarios) {
      return {
        success: false,
        error: "Dados bancários não encontrados",
      };
    }

    // Soft delete
    await prisma.dadosBancarios.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        ativo: false,
      },
    });

    revalidatePath("/dados-bancarios");
    revalidatePath("/usuario/perfil");

    return {
      success: true,
      message: "Dados bancários removidos com sucesso",
    };
  } catch (error) {
    console.error("Erro ao deletar dados bancários:", error);

    return {
      success: false,
      error: "Erro ao deletar dados bancários",
    };
  }
}

// ============================================
// OBTER DADOS BANCÁRIOS ATIVOS DO TENANT
// ============================================

export async function getDadosBancariosAtivos() {
  try {
    const tenantId = await getTenantId();

    const dadosBancarios = await prisma.dadosBancarios.findMany({
      where: {
        tenantId,
        ativo: true,
        deletedAt: null,
      },
      orderBy: [{ principal: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        banco: true,
        agencia: true,
        conta: true,
        digitoConta: true,
        tipoContaBancaria: true,
        titularNome: true,
        principal: true,
        chavePix: true,
        tipoChavePix: true,
      },
    });

    return {
      success: true,
      data: dadosBancarios,
    };
  } catch (error) {
    console.error("Erro ao buscar dados bancários ativos:", error);

    return {
      success: false,
      error: "Erro ao buscar dados bancários",
      data: [],
    };
  }
}

// ============================================
// OBTER DADOS BANCÁRIOS DO USUÁRIO LOGADO
// ============================================

export async function getMeusDadosBancarios() {
  try {
    const tenantId = await getTenantId();
    const userId = await getUserId();

    const dadosBancarios = await prisma.dadosBancarios.findMany({
      where: {
        tenantId,
        usuarioId: userId,
        deletedAt: null,
      },
      include: {
        banco: {
          select: {
            codigo: true,
            nome: true,
          },
        },
      },
      orderBy: [
        { principal: "desc" },
        { ativo: "desc" },
        { createdAt: "desc" },
      ],
    });

    return {
      success: true,
      data: dadosBancarios,
    };
  } catch (error) {
    console.error("Erro ao buscar meus dados bancários:", error);

    return {
      success: false,
      error: "Erro ao buscar dados bancários",
      data: [],
    };
  }
}

// ============================================
// OBTER BANCOS DISPONÍVEIS
// ============================================

// Função removida - agora usa getBancosDisponiveis() de bancos.ts

// ============================================
// OBTER TIPOS DE CONTA
// ============================================

export async function getTiposConta() {
  return {
    success: true,
    data: [
      {
        value: "PESSOA_FISICA",
        label: "Pessoa Física",
        description: "Conta de pessoa física",
        icon: "👤",
      },
      {
        value: "PESSOA_JURIDICA",
        label: "Pessoa Jurídica",
        description: "Conta de pessoa jurídica",
        icon: "🏢",
      },
    ],
  };
}

// ============================================
// OBTER TIPOS DE CONTA BANCÁRIA
// ============================================

export async function getTiposContaBancaria() {
  return {
    success: true,
    data: [
      {
        value: "CORRENTE",
        label: "Conta Corrente",
        description: "Conta corrente tradicional",
        icon: "💳",
      },
      {
        value: "POUPANCA",
        label: "Poupança",
        description: "Conta poupança",
        icon: "🐷",
      },
      {
        value: "SALARIO",
        label: "Salário",
        description: "Conta salário",
        icon: "💰",
      },
      {
        value: "INVESTIMENTO",
        label: "Investimento",
        description: "Conta de investimento",
        icon: "📈",
      },
    ],
  };
}

// ============================================
// OBTER TIPOS DE CHAVE PIX
// ============================================

export async function getTiposChavePix() {
  return {
    success: true,
    data: [
      {
        value: "CPF",
        label: "CPF",
        description: "Chave PIX com CPF",
        icon: "🆔",
      },
      {
        value: "CNPJ",
        label: "CNPJ",
        description: "Chave PIX com CNPJ",
        icon: "🏢",
      },
      {
        value: "EMAIL",
        label: "E-mail",
        description: "Chave PIX com e-mail",
        icon: "📧",
      },
      {
        value: "TELEFONE",
        label: "Telefone",
        description: "Chave PIX com telefone",
        icon: "📱",
      },
      {
        value: "ALEATORIA",
        label: "Aleatória",
        description: "Chave PIX aleatória",
        icon: "🎲",
      },
    ],
  };
}
