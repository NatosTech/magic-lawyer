"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { motion } from "framer-motion";
import { QrCode, Copy, CheckCircle, Clock, CreditCard, FileText, Smartphone, ArrowLeft } from "lucide-react";
import NextLink from "next/link";
import { toast } from "sonner";
import QRCodeLib from "qrcode";

interface PaymentData {
  checkoutId: string;
  paymentData: any;
  customerData: any;
}

export default function PagamentoPage() {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    // Buscar dados do pagamento da session storage ou URL params
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutId = urlParams.get("checkoutId");

    if (checkoutId) {
      // Buscar dados do pagamento do sessionStorage (passado do checkout)
      const sessionData = sessionStorage.getItem(`checkout_${checkoutId}`);

      if (sessionData) {
        const data = JSON.parse(sessionData);
        setPaymentData({
          checkoutId,
          paymentData: data.paymentData,
          customerData: data.customerData,
        });

        // Gerar QR Code se for PIX (não aplicável para BOLETO)
        if (data.paymentData.billingType === "PIX" && data.paymentData.pixCopyPaste) {
          generateQRCode(data.paymentData.pixCopyPaste);
        }
      } else {
        // Fallback para dados simulados se não encontrar na sessão
        const fallbackData = {
          checkoutId,
          paymentData: {
            id: "pay_123456789",
            billingType: "PIX",
            value: 97.0,
            pixQrCode: "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540597.005802BR5913MAGIC LAWYER6008BRASILIA62070503***6304",
            pixCopyPaste: "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540597.005802BR5913MAGIC LAWYER6008BRASILIA62070503***6304",
            dueDate: "2025-01-20",
            status: "PENDING",
          },
          customerData: {
            name: "Empresa Exemplo LTDA",
            email: "contato@empresa.com",
          },
        };

        setPaymentData(fallbackData);
        generateQRCode(fallbackData.paymentData.pixCopyPaste);
      }
    }

    setIsLoading(false);
  }, []);

  const generateQRCode = async (pixCode: string) => {
    try {
      const qrCodeDataUrl = await QRCodeLib.toDataURL(pixCode, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar código");
    }
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case "PIX":
        return <Smartphone className="w-6 h-6 text-green-500" />;
      case "BOLETO":
        return <FileText className="w-6 h-6 text-blue-500" />;
      case "CREDIT_CARD":
        return <CreditCard className="w-6 h-6 text-purple-500" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl max-w-md w-full">
          <CardBody className="text-center p-8">
            <h1 className="text-xl font-bold text-white mb-4">Pagamento não encontrado</h1>
            <p className="text-default-400 mb-6">Não foi possível encontrar os dados do pagamento.</p>
            <Button as={NextLink} href="/precos" color="primary" className="w-full">
              Voltar aos Planos
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const { paymentData: payment, customerData } = paymentData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-lg">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              {getPaymentIcon(payment.billingType)}
              <div>
                <h1 className="text-xl font-bold text-white">Pagamento {payment.billingType}</h1>
                <p className="text-sm text-default-400">Complete o pagamento para ativar sua conta</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <Chip color="warning" variant="flat" startContent={<Clock className="w-4 h-4" />}>
                Aguardando Pagamento
              </Chip>
            </div>
          </CardHeader>

          <CardBody className="space-y-6">
            {/* Valor */}
            <div className="text-center">
              <p className="text-3xl font-bold text-white">R$ {payment.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-default-400">Valor da assinatura</p>
            </div>

            <Divider className="border-white/10" />

            {/* PIX */}
            {payment.billingType === "PIX" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }} className="space-y-6">
                <div className="space-y-4">
                  {/* QR Code PIX */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">QR Code PIX</h3>
                    <p className="text-sm text-default-400">Escaneie com seu app bancário</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg">{qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code PIX" className="w-32 h-32" /> : <QrCode className="w-32 h-32 text-black" />}</div>
                  </div>

                  <Divider className="border-white/10" />

                  {/* Código PIX Copia e Cola */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">Código PIX (Copia e Cola)</h3>
                    <div className="p-3 bg-default-100/10 rounded-lg border border-white/10">
                      <p className="text-xs text-default-400 break-all font-mono">{payment.pixCopyPaste}</p>
                    </div>
                    <Button
                      color="primary"
                      variant="flat"
                      size="sm"
                      startContent={copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      onPress={() => copyToClipboard(payment.pixCopyPaste)}
                      className="w-full"
                    >
                      {copied ? "Copiado!" : "Copiar Código PIX"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Boleto */}
            {payment.billingType === "BOLETO" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Boleto Bancário</h3>
                  <p className="text-sm text-default-400">Vencimento: {new Date(payment.dueDate).toLocaleDateString("pt-BR")}</p>
                </div>

                <Button color="primary" className="w-full">
                  Baixar Boleto
                </Button>
              </div>
            )}

            {/* Cartão de Crédito */}
            {payment.billingType === "CREDIT_CARD" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Pagamento com Cartão</h3>
                  <p className="text-sm text-default-400">Redirecionando para o gateway de pagamento...</p>
                </div>

                <Button color="primary" className="w-full">
                  Finalizar Pagamento
                </Button>
              </div>
            )}

            <Divider className="border-white/10" />

            {/* Informações da empresa */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Dados da Empresa</h3>
              <p className="text-sm text-default-400">{customerData.name}</p>
              <p className="text-sm text-default-400">{customerData.email}</p>
            </div>

            {/* Instruções */}
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="text-sm font-semibold text-primary mb-2">Próximos passos:</h3>
              <ul className="text-xs text-default-400 space-y-1">
                <li>• Complete o pagamento usando o método escolhido</li>
                <li>• Aguarde a confirmação automática (até 2 minutos)</li>
                <li>• Você receberá um email com as credenciais de acesso</li>
                <li>• Faça login e configure seu escritório</li>
              </ul>
            </div>

            {/* Botões */}
            <div className="space-y-3">
              {/* Botão de teste para simular pagamento confirmado */}
              {(payment.billingType === "PIX" || payment.billingType === "BOLETO") && (
                <Button
                  color="success"
                  variant="flat"
                  className="w-full"
                  onPress={async () => {
                    try {
                      const response = await fetch("/api/test-pix-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ asaasPaymentId: payment.id }),
                      });

                      const result = await response.json();

                      if (result.success) {
                        toast.success("Pagamento confirmado! Conta criada com sucesso!");
                        // Redirecionar para página de sucesso
                        setTimeout(() => {
                          window.location.href = "/sucesso";
                        }, 2000);
                      } else {
                        toast.error(result.error || "Erro ao confirmar pagamento");
                      }
                    } catch (error) {
                      toast.error("Erro ao confirmar pagamento");
                    }
                  }}
                >
                  🧪 Simular Pagamento Confirmado (TESTE)
                </Button>
              )}

              <Button as={NextLink} href="/precos" variant="light" className="w-full" startContent={<ArrowLeft className="w-4 h-4" />}>
                Voltar aos Planos
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
