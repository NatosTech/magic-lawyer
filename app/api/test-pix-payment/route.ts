import { NextRequest, NextResponse } from "next/server";

import { processarPagamentoConfirmado } from "@/app/actions/processar-pagamento-confirmado";

export async function POST(request: NextRequest) {
  try {
    const { asaasPaymentId } = await request.json();

    if (!asaasPaymentId) {
      return NextResponse.json(
        { error: "asaasPaymentId é obrigatório" },
        { status: 400 },
      );
    }

    // Simular confirmação de pagamento
    const result = await processarPagamentoConfirmado(asaasPaymentId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message:
          "Pagamento processado com sucesso! Conta criada e emails enviados.",
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Erro ao processar pagamento de teste:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
