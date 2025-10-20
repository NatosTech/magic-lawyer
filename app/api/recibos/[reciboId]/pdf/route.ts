import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getReciboDetalhes } from "@/app/actions/recibos";

export async function GET(
  request: NextRequest,
  { params }: { params: { reciboId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { reciboId } = params;
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo") as "PARCELA" | "FATURA";

    if (!tipo || !["PARCELA", "FATURA"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo de recibo inválido" },
        { status: 400 }
      );
    }

    // Buscar dados do recibo
    const reciboResult = await getReciboDetalhes(reciboId, tipo);
    
    if (!reciboResult.success || !reciboResult.data) {
      return NextResponse.json(
        { error: reciboResult.error || "Recibo não encontrado" },
        { status: 404 }
      );
    }

    const recibo = reciboResult.data;

    // Gerar HTML do comprovante
    const html = generateComprovanteHTML(recibo);

    // Por enquanto, retornar HTML para o frontend renderizar
    // TODO: Implementar geração real de PDF com puppeteer ou similar
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="comprovante-${recibo.numero.toLowerCase().replace(/\s+/g, '-')}.html"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF do recibo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function generateComprovanteHTML(recibo: any): string {
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: Date | null) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getFormaPagamentoTexto = (forma: string | null) => {
    switch (forma) {
      case 'PIX':
        return 'PIX';
      case 'CREDIT_CARD':
        return 'Cartão de Crédito';
      case 'BOLETO':
        return 'Boleto Bancário';
      default:
        return forma || 'N/A';
    }
  };

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprovante de Pagamento - ${recibo.numero}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .recibo-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .info-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .info-section h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .info-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        
        .info-label {
            font-weight: 500;
            color: #6c757d;
        }
        
        .info-value {
            font-weight: 600;
            color: #333;
        }
        
        .valor-destaque {
            background: #e8f5e8;
            border: 2px solid #28a745;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        
        .valor-destaque .label {
            font-size: 14px;
            color: #28a745;
            font-weight: 500;
            margin-bottom: 5px;
        }
        
        .valor-destaque .valor {
            font-size: 32px;
            color: #28a745;
            font-weight: 700;
        }
        
        .cliente-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .cliente-info h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
        }
        
        .cliente-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-paga {
            background: #d4edda;
            color: #155724;
        }
        
        .tipo-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .tipo-parcela {
            background: #cce5ff;
            color: #004085;
        }
        
        .tipo-fatura {
            background: #fff3cd;
            color: #856404;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .header {
                background: #667eea !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
        
        @media (max-width: 768px) {
            .recibo-info {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .cliente-details {
                grid-template-columns: 1fr;
            }
            
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Comprovante de Pagamento</h1>
            <p>Magic Lawyer - Sistema Jurídico</p>
        </div>
        
        <div class="content">
            <div class="recibo-info">
                <div class="info-section">
                    <h3>Informações do Recibo</h3>
                    <div class="info-item">
                        <span class="info-label">Número:</span>
                        <span class="info-value">${recibo.numero}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Tipo:</span>
                        <span class="info-value">
                            <span class="tipo-badge tipo-${recibo.tipo.toLowerCase()}">${recibo.tipo}</span>
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value">
                            <span class="status-badge status-paga">${recibo.status}</span>
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Data de Pagamento:</span>
                        <span class="info-value">${formatarData(recibo.dataPagamento)}</span>
                    </div>
                    ${recibo.tipo === 'PARCELA' && recibo.formaPagamento ? `
                    <div class="info-item">
                        <span class="info-label">Forma de Pagamento:</span>
                        <span class="info-value">${getFormaPagamentoTexto(recibo.formaPagamento)}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="info-section">
                    <h3>Detalhes do Pagamento</h3>
                    <div class="info-item">
                        <span class="info-label">Data de Vencimento:</span>
                        <span class="info-value">${formatarData(recibo.dataVencimento)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Data de Emissão:</span>
                        <span class="info-value">${formatarData(recibo.createdAt)}</span>
                    </div>
                    ${recibo.asaasPaymentId ? `
                    <div class="info-item">
                        <span class="info-label">ID do Pagamento:</span>
                        <span class="info-value">${recibo.asaasPaymentId}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="valor-destaque">
                <div class="label">Valor Pago</div>
                <div class="valor">${formatarValor(recibo.valor)}</div>
            </div>
            
            ${recibo.contrato ? `
            <div class="cliente-info">
                <h3>Informações do Cliente</h3>
                <div class="cliente-details">
                    <div class="info-item">
                        <span class="info-label">Nome:</span>
                        <span class="info-value">${recibo.contrato.cliente.nome}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Documento:</span>
                        <span class="info-value">${recibo.contrato.cliente.documento || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${recibo.contrato.cliente.email || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Contrato:</span>
                        <span class="info-value">${recibo.contrato.numero}</span>
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${recibo.descricao ? `
            <div class="info-section">
                <h3>Descrição</h3>
                <p>${recibo.descricao}</p>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>Este comprovante foi gerado automaticamente pelo sistema Magic Lawyer</p>
            <p>Data de geração: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
    </div>
    
    <script>
        // Auto-print quando carregado
        window.onload = function() {
            if (window.location.search.includes('print=true')) {
                window.print();
            }
        };
    </script>
</body>
</html>
  `;
}
