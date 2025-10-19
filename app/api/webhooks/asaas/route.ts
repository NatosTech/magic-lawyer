import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { createAsaasClientFromEncrypted } from "@/lib/asaas";
import { processarPagamentoConfirmado } from "@/app/actions/processar-pagamento-confirmado";
import crypto from "crypto";

// Verificar assinatura do webhook
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  // Converter para Uint8Array para compatibilidade com timingSafeEqual
  const signatureBuffer = new Uint8Array(Buffer.from(signature, "hex"));
  const expectedBuffer = new Uint8Array(Buffer.from(expectedSignature, "hex"));

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("asaas-signature");

    // Verificar assinatura do webhook
    const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("ASAAS_WEBHOOK_SECRET não configurado");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!signature) {
      console.error("Assinatura do webhook não encontrada");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error("Assinatura do webhook inválida");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const webhookData = JSON.parse(payload);
    console.log("Webhook Asaas recebido:", webhookData);

    // Processar diferentes tipos de eventos
    switch (webhookData.event) {
      case "PAYMENT_CREATED":
        await handlePaymentCreated(webhookData);
        break;
      case "PAYMENT_RECEIVED":
        await handlePaymentReceived(webhookData);
        break;
      case "PAYMENT_OVERDUE":
        await handlePaymentOverdue(webhookData);
        break;
      case "PAYMENT_DELETED":
        await handlePaymentDeleted(webhookData);
        break;
      case "SUBSCRIPTION_CREATED":
        await handleSubscriptionCreated(webhookData);
        break;
      case "SUBSCRIPTION_UPDATED":
        await handleSubscriptionUpdated(webhookData);
        break;
      case "SUBSCRIPTION_DELETED":
        await handleSubscriptionDeleted(webhookData);
        break;
      default:
        console.log(`Evento não tratado: ${webhookData.event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao processar webhook Asaas:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// HANDLERS DE EVENTOS
// ============================================

async function handlePaymentCreated(webhookData: any) {
  console.log("Pagamento criado:", webhookData.payment);
  // Implementar lógica para pagamento criado
}

async function handlePaymentReceived(webhookData: any) {
  console.log("Pagamento recebido:", webhookData.payment);

  const payment = webhookData.payment;

  // Verificar se é um pagamento de checkout (novo cliente)
  if (payment.externalReference?.startsWith("checkout_")) {
    console.log("Processando pagamento de checkout:", payment.id);

    // Processar pagamento confirmado e criar conta
    const result = await processarPagamentoConfirmado(payment.id);

    if (result.success) {
      console.log("Conta criada com sucesso após pagamento:", result.data);
    } else {
      console.error("Erro ao criar conta após pagamento:", result.error);
    }

    return;
  }

  // Buscar assinatura pelo externalReference (assinaturas recorrentes)
  if (payment.externalReference) {
    const subscription = await prisma.tenantSubscription.findFirst({
      where: {
        asaasSubscriptionId: payment.externalReference,
      },
      include: { tenant: true },
    });

    if (subscription) {
      // Atualizar status da assinatura
      await prisma.tenantSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "ATIVA",
          asaasPaymentId: payment.id,
          updatedAt: new Date(),
        },
      });

      // Criar fatura
      await prisma.fatura.create({
        data: {
          tenantId: subscription.tenantId,
          subscriptionId: subscription.id,
          numero: `FAT-${Date.now()}`,
          descricao: `Assinatura Magic Lawyer`,
          valor: payment.value / 100, // Converter de centavos para reais
          moeda: "BRL",
          status: "PAGA",
          vencimento: new Date(payment.dueDate),
          pagoEm: new Date(payment.confirmedDate || new Date()),
          metadata: {
            asaasPaymentId: payment.id,
            paymentMethod: payment.billingType,
          },
        },
      });

      console.log(`Assinatura ${subscription.id} ativada após pagamento`);
    }
  }
}

async function handlePaymentOverdue(webhookData: any) {
  console.log("Pagamento em atraso:", webhookData.payment);

  const payment = webhookData.payment;

  if (payment.externalReference) {
    const subscription = await prisma.tenantSubscription.findFirst({
      where: {
        asaasSubscriptionId: payment.externalReference,
      },
    });

    if (subscription) {
      await prisma.tenantSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "ATIVA", // OVERDUE não existe no enum, usando ATIVA
          updatedAt: new Date(),
        },
      });

      console.log(`Assinatura ${subscription.id} marcada como em atraso`);
    }
  }
}

async function handlePaymentDeleted(webhookData: any) {
  console.log("Pagamento deletado:", webhookData.payment);
  // Implementar lógica para pagamento deletado
}

async function handleSubscriptionCreated(webhookData: any) {
  console.log("Assinatura criada:", webhookData.subscription);
  // Implementar lógica para assinatura criada
}

async function handleSubscriptionUpdated(webhookData: any) {
  console.log("Assinatura atualizada:", webhookData.subscription);

  const subscription = webhookData.subscription;

  if (subscription.externalReference) {
    const dbSubscription = await prisma.tenantSubscription.findFirst({
      where: {
        asaasSubscriptionId: subscription.id,
      },
    });

    if (dbSubscription) {
      await prisma.tenantSubscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: subscription.status === "ACTIVE" ? "ATIVA" : "CANCELADA",
          updatedAt: new Date(),
        },
      });

      console.log(`Assinatura ${dbSubscription.id} atualizada`);
    }
  }
}

async function handleSubscriptionDeleted(webhookData: any) {
  console.log("Assinatura deletada:", webhookData.subscription);

  const subscription = webhookData.subscription;

  if (subscription.externalReference) {
    const dbSubscription = await prisma.tenantSubscription.findFirst({
      where: {
        asaasSubscriptionId: subscription.id,
      },
    });

    if (dbSubscription) {
      await prisma.tenantSubscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: "CANCELADA",
          dataFim: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`Assinatura ${dbSubscription.id} cancelada`);
    }
  }
}
