"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AsaasClient, createAsaasClientFromEncrypted, formatCpfCnpjForAsaas, formatValueForAsaas, formatDateForAsaas } from "@/lib/asaas";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";

// ============================================
// SISTEMA DE COBRANÇA PARA TENANTS
// ============================================

export async function gerarPixDinamico(data: { parcelaId: string; valor: number; descricao?: string; vencimento?: Date }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Não autenticado" };
    }

    const user = session.user as any;

    // Buscar parcela
    const parcela = await prisma.contratoParcela.findUnique({
      where: { id: data.parcelaId },
      include: {
        contrato: {
          include: {
            dadosBancarios: {
              include: { banco: true },
            },
          },
        },
      },
    });

    if (!parcela) {
      return { success: false, error: "Parcela não encontrada" };
    }

    // Buscar configuração Asaas do tenant
    const asaasConfig = await prisma.tenantAsaasConfig.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!asaasConfig || !asaasConfig.integracaoAtiva) {
      return { success: false, error: "Configuração Asaas não encontrada ou inativa" };
    }

    const asaasClient = createAsaasClientFromEncrypted(asaasConfig.asaasApiKey, asaasConfig.ambiente.toLowerCase() as "sandbox" | "production");

    // Criar cliente no Asaas (se não existir)
    let asaasCustomerId = parcela.contrato.cliente?.asaasCustomerId;

    if (!asaasCustomerId && parcela.contrato.cliente) {
      const asaasCustomer = await asaasClient.createCustomer({
        name: parcela.contrato.cliente.nome,
        email: parcela.contrato.cliente.email || "",
        cpfCnpj: formatCpfCnpjForAsaas(parcela.contrato.cliente.cpfCnpj),
        phone: parcela.contrato.cliente.telefone || "",
        postalCode: parcela.contrato.cliente.cep || "",
        address: parcela.contrato.cliente.endereco || "",
        addressNumber: parcela.contrato.cliente.numero || "",
        complement: parcela.contrato.cliente.complemento || "",
        province: parcela.contrato.cliente.bairro || "",
        city: parcela.contrato.cliente.cidade || "",
        state: parcela.contrato.cliente.estado || "",
        country: "Brasil",
      });

      asaasCustomerId = asaasCustomer.id!;

      // Salvar ID do cliente no Asaas
      await prisma.cliente.update({
        where: { id: parcela.contrato.cliente.id },
        data: { asaasCustomerId },
      });
    }

    // Criar pagamento PIX no Asaas
    const asaasPayment = await asaasClient.createPayment({
      customer: asaasCustomerId!,
      billingType: "PIX",
      value: formatValueForAsaas(data.valor),
      dueDate: formatDateForAsaas(data.vencimento || new Date()),
      description: data.descricao || `Parcela ${parcela.numero} - ${parcela.contrato.cliente?.nome}`,
      externalReference: `parcela_${parcela.id}`,
    });

    // Gerar QR Code PIX
    const pixQrCode = await asaasClient.generatePixQrCode(asaasPayment.id!);

    // Gerar QR Code visual
    const qrCodeImage = await QRCode.toDataURL(pixQrCode.encodedImage);

    // Atualizar parcela com dados do pagamento
    await prisma.contratoParcela.update({
      where: { id: parcela.id },
      data: {
        asaasPaymentId: asaasPayment.id,
        status: "PENDENTE",
        dadosPagamento: {
          tipo: "PIX",
          qrCode: pixQrCode.encodedImage,
          qrCodeImage,
          chavePix: pixQrCode.payload,
          valor: data.valor,
          vencimento: data.vencimento || new Date(),
        },
        updatedAt: new Date(),
      },
    });

    revalidatePath("/parcelas");

    return {
      success: true,
      data: {
        paymentId: asaasPayment.id,
        qrCode: pixQrCode.encodedImage,
        qrCodeImage,
        chavePix: pixQrCode.payload,
        valor: data.valor,
        vencimento: data.vencimento || new Date(),
      },
    };
  } catch (error) {
    console.error("Erro ao gerar PIX dinâmico:", error);
    return { success: false, error: "Erro ao gerar PIX" };
  }
}

export async function gerarBoletoAsaas(data: { parcelaId: string; valor: number; descricao?: string; vencimento?: Date }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Não autenticado" };
    }

    const user = session.user as any;

    // Buscar parcela
    const parcela = await prisma.contratoParcela.findUnique({
      where: { id: data.parcelaId },
      include: {
        contrato: {
          include: {
            cliente: true,
            dadosBancarios: {
              include: { banco: true },
            },
          },
        },
      },
    });

    if (!parcela) {
      return { success: false, error: "Parcela não encontrada" };
    }

    // Buscar configuração Asaas do tenant
    const asaasConfig = await prisma.tenantAsaasConfig.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!asaasConfig || !asaasConfig.integracaoAtiva) {
      return { success: false, error: "Configuração Asaas não encontrada ou inativa" };
    }

    const asaasClient = createAsaasClientFromEncrypted(asaasConfig.asaasApiKey, asaasConfig.ambiente.toLowerCase() as "sandbox" | "production");

    // Criar cliente no Asaas (se não existir)
    let asaasCustomerId = parcela.contrato.cliente?.asaasCustomerId;

    if (!asaasCustomerId && parcela.contrato.cliente) {
      const asaasCustomer = await asaasClient.createCustomer({
        name: parcela.contrato.cliente.nome,
        email: parcela.contrato.cliente.email || "",
        cpfCnpj: formatCpfCnpjForAsaas(parcela.contrato.cliente.cpfCnpj),
        phone: parcela.contrato.cliente.telefone || "",
        postalCode: parcela.contrato.cliente.cep || "",
        address: parcela.contrato.cliente.endereco || "",
        addressNumber: parcela.contrato.cliente.numero || "",
        complement: parcela.contrato.cliente.complemento || "",
        province: parcela.contrato.cliente.bairro || "",
        city: parcela.contrato.cliente.cidade || "",
        state: parcela.contrato.cliente.estado || "",
        country: "Brasil",
      });

      asaasCustomerId = asaasCustomer.id!;

      // Salvar ID do cliente no Asaas
      await prisma.cliente.update({
        where: { id: parcela.contrato.cliente.id },
        data: { asaasCustomerId },
      });
    }

    // Criar pagamento Boleto no Asaas
    const asaasPayment = await asaasClient.createPayment({
      customer: asaasCustomerId!,
      billingType: "BOLETO",
      value: formatValueForAsaas(data.valor),
      dueDate: formatDateForAsaas(data.vencimento || new Date()),
      description: data.descricao || `Parcela ${parcela.numero} - ${parcela.contrato.cliente?.nome}`,
      externalReference: `parcela_${parcela.id}`,
    });

    // Atualizar parcela com dados do pagamento
    await prisma.contratoParcela.update({
      where: { id: parcela.id },
      data: {
        asaasPaymentId: asaasPayment.id,
        status: "PENDENTE",
        dadosPagamento: {
          tipo: "BOLETO",
          codigoBarras: asaasPayment.bankSlipUrl,
          linhaDigitavel: asaasPayment.bankSlipUrl,
          valor: data.valor,
          vencimento: data.vencimento || new Date(),
        },
        updatedAt: new Date(),
      },
    });

    revalidatePath("/parcelas");

    return {
      success: true,
      data: {
        paymentId: asaasPayment.id,
        codigoBarras: asaasPayment.bankSlipUrl,
        linhaDigitavel: asaasPayment.bankSlipUrl,
        valor: data.valor,
        vencimento: data.vencimento || new Date(),
      },
    };
  } catch (error) {
    console.error("Erro ao gerar boleto:", error);
    return { success: false, error: "Erro ao gerar boleto" };
  }
}

export async function gerarCobrancaCartao(data: {
  parcelaId: string;
  valor: number;
  descricao?: string;
  vencimento?: Date;
  dadosCartao: {
    numero: string;
    nome: string;
    cvv: string;
    mes: string;
    ano: string;
  };
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Não autenticado" };
    }

    const user = session.user as any;

    // Buscar parcela
    const parcela = await prisma.contratoParcela.findUnique({
      where: { id: data.parcelaId },
      include: {
        contrato: {
          include: {
            cliente: true,
            dadosBancarios: {
              include: { banco: true },
            },
          },
        },
      },
    });

    if (!parcela) {
      return { success: false, error: "Parcela não encontrada" };
    }

    // Buscar configuração Asaas do tenant
    const asaasConfig = await prisma.tenantAsaasConfig.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!asaasConfig || !asaasConfig.integracaoAtiva) {
      return { success: false, error: "Configuração Asaas não encontrada ou inativa" };
    }

    const asaasClient = createAsaasClientFromEncrypted(asaasConfig.asaasApiKey, asaasConfig.ambiente.toLowerCase() as "sandbox" | "production");

    // Criar cliente no Asaas (se não existir)
    let asaasCustomerId = parcela.contrato.cliente?.asaasCustomerId;

    if (!asaasCustomerId && parcela.contrato.cliente) {
      const asaasCustomer = await asaasClient.createCustomer({
        name: parcela.contrato.cliente.nome,
        email: parcela.contrato.cliente.email || "",
        cpfCnpj: formatCpfCnpjForAsaas(parcela.contrato.cliente.cpfCnpj),
        phone: parcela.contrato.cliente.telefone || "",
        postalCode: parcela.contrato.cliente.cep || "",
        address: parcela.contrato.cliente.endereco || "",
        addressNumber: parcela.contrato.cliente.numero || "",
        complement: parcela.contrato.cliente.complemento || "",
        province: parcela.contrato.cliente.bairro || "",
        city: parcela.contrato.cliente.cidade || "",
        state: parcela.contrato.cliente.estado || "",
        country: "Brasil",
      });

      asaasCustomerId = asaasCustomer.id!;

      // Salvar ID do cliente no Asaas
      await prisma.cliente.update({
        where: { id: parcela.contrato.cliente.id },
        data: { asaasCustomerId },
      });
    }

    // Criar pagamento Cartão no Asaas
    const asaasPayment = await asaasClient.createPayment({
      customer: asaasCustomerId!,
      billingType: "CREDIT_CARD",
      value: formatValueForAsaas(data.valor),
      dueDate: formatDateForAsaas(data.vencimento || new Date()),
      description: data.descricao || `Parcela ${parcela.numero} - ${parcela.contrato.cliente?.nome}`,
      externalReference: `parcela_${parcela.id}`,
      creditCard: {
        holderName: data.dadosCartao.nome,
        number: data.dadosCartao.numero,
        expiryMonth: data.dadosCartao.mes,
        expiryYear: data.dadosCartao.ano,
        ccv: data.dadosCartao.cvv,
      },
    });

    // Atualizar parcela com dados do pagamento
    await prisma.contratoParcela.update({
      where: { id: parcela.id },
      data: {
        asaasPaymentId: asaasPayment.id,
        status: asaasPayment.status === "CONFIRMED" ? "PAGA" : "PENDENTE",
        dadosPagamento: {
          tipo: "CARTAO",
          valor: data.valor,
          vencimento: data.vencimento || new Date(),
          status: asaasPayment.status,
        },
        updatedAt: new Date(),
      },
    });

    revalidatePath("/parcelas");

    return {
      success: true,
      data: {
        paymentId: asaasPayment.id,
        status: asaasPayment.status,
        valor: data.valor,
        vencimento: data.vencimento || new Date(),
      },
    };
  } catch (error) {
    console.error("Erro ao processar cartão:", error);
    return { success: false, error: "Erro ao processar pagamento" };
  }
}

export async function consultarStatusPagamento(paymentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Não autenticado" };
    }

    const user = session.user as any;

    // Buscar configuração Asaas do tenant
    const asaasConfig = await prisma.tenantAsaasConfig.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!asaasConfig || !asaasConfig.integracaoAtiva) {
      return { success: false, error: "Configuração Asaas não encontrada ou inativa" };
    }

    const asaasClient = createAsaasClientFromEncrypted(asaasConfig.asaasApiKey, asaasConfig.ambiente.toLowerCase() as "sandbox" | "production");

    // Consultar status do pagamento no Asaas
    const payment = await asaasClient.getPayment(paymentId);

    return {
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        value: payment.value,
        dueDate: payment.dueDate,
        confirmedDate: payment.confirmedDate,
        description: payment.description,
      },
    };
  } catch (error) {
    console.error("Erro ao consultar status do pagamento:", error);
    return { success: false, error: "Erro ao consultar pagamento" };
  }
}

export async function conciliarPagamento(paymentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Não autenticado" };
    }

    const user = session.user as any;

    // Buscar parcela pelo paymentId
    const parcela = await prisma.contratoParcela.findFirst({
      where: { asaasPaymentId: paymentId },
    });

    if (!parcela) {
      return { success: false, error: "Parcela não encontrada" };
    }

    // Buscar configuração Asaas do tenant
    const asaasConfig = await prisma.tenantAsaasConfig.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!asaasConfig || !asaasConfig.integracaoAtiva) {
      return { success: false, error: "Configuração Asaas não encontrada ou inativa" };
    }

    const asaasClient = createAsaasClientFromEncrypted(asaasConfig.asaasApiKey, asaasConfig.ambiente.toLowerCase() as "sandbox" | "production");

    // Consultar status do pagamento no Asaas
    const payment = await asaasClient.getPayment(paymentId);

    // Atualizar status da parcela
    let novoStatus = "PENDENTE";
    if (payment.status === "CONFIRMED") {
      novoStatus = "PAGA";
    } else if (payment.status === "OVERDUE") {
      novoStatus = "ATRASADA";
    }

    await prisma.contratoParcela.update({
      where: { id: parcela.id },
      data: {
        status: novoStatus,
        dataPagamento: payment.confirmedDate ? new Date(payment.confirmedDate) : null,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/parcelas");

    return {
      success: true,
      data: {
        parcelaId: parcela.id,
        status: novoStatus,
        paymentStatus: payment.status,
        confirmedDate: payment.confirmedDate,
      },
    };
  } catch (error) {
    console.error("Erro ao conciliar pagamento:", error);
    return { success: false, error: "Erro ao conciliar pagamento" };
  }
}
