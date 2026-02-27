"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Copy,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Smartphone,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import NextLink from "next/link";
import { toast } from "sonner";
import QRCodeLib from "qrcode";
import useSWR from "swr";

import { getPaymentStatus } from "@/app/actions/payment-status";
import { REALTIME_POLLING } from "@/app/lib/realtime/polling-policy";
import {
  isPollingGloballyEnabled,
  resolvePollingInterval,
  subscribePollingControl,
  tracePollingAttempt,
} from "@/app/lib/realtime/polling-telemetry";
import CreditCardForm from "@/components/credit-card-form";

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
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [isPollingEnabled, setIsPollingEnabled] = useState(() =>
    isPollingGloballyEnabled(),
  );

  useEffect(() => {
    return subscribePollingControl(setIsPollingEnabled);
  }, []);

  const pollingInterval = resolvePollingInterval({
    isConnected: false,
    enabled: isPollingEnabled && !paymentProcessed,
    fallbackMs: REALTIME_POLLING.PAGAMENTO_POLLING_MS,
    minimumMs: REALTIME_POLLING.PAGAMENTO_POLLING_MS,
  });

  // SWR para buscar status do pagamento em tempo real
  const {
    data: paymentStatus,
    error,
    mutate,
  } = useSWR(
    checkoutId ? `payment-status-${checkoutId}` : null,
    () =>
      tracePollingAttempt(
        {
          hookName: "PagamentoPage",
          endpoint: checkoutId ? `/api/payment-status/${checkoutId}` : "payment-status",
          source: "swr",
          intervalMs: pollingInterval,
        },
        () => getPaymentStatus(checkoutId!),
      ),
    {
      refreshInterval: paymentProcessed
        ? 0
        : pollingInterval, // Para de atualizar se pagamento foi processado
      revalidateOnFocus: false,
      revalidateOnReconnect: !paymentProcessed,
    },
  );

  // Função para lidar com pagamento processado
  const handlePaymentProcessed = (paymentResult: any) => {
    setPaymentProcessed(true);
    toast.success("Pagamento processado! Redirecionando...");

    // Simular redirecionamento para página de sucesso
    setTimeout(() => {
      window.location.href = "/sucesso";
    }, 2000);
  };

  useEffect(() => {
    // Buscar dados do pagamento da session storage ou URL params
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutIdParam = urlParams.get("checkoutId");

    if (checkoutIdParam) {
      setCheckoutId(checkoutIdParam);

      // Buscar dados do pagamento do sessionStorage (passado do checkout)
      const sessionData = sessionStorage.getItem(`checkout_${checkoutIdParam}`);

      if (sessionData) {
        const data = JSON.parse(sessionData);

        setPaymentData({
          checkoutId: checkoutIdParam,
          paymentData: data.paymentData,
          customerData: data.customerData,
        });

        // Gerar QR Code se for PIX (não aplicável para BOLETO)
        if (
          data.paymentData.billingType === "PIX" &&
          data.paymentData.pixCopyPaste
        ) {
          generateQRCode(data.paymentData.pixCopyPaste);
        }
      } else {
        // Fallback para dados simulados se não encontrar na sessão
        const fallbackData = {
          checkoutId: checkoutIdParam,
          paymentData: {
            id: "pay_123456789",
            billingType: "PIX",
            value: 97.0,
            pixQrCode:
              "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540597.005802BR5913MAGIC LAWYER6008BRASILIA62070503***6304",
            pixCopyPaste:
              "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540597.005802BR5913MAGIC LAWYER6008BRASILIA62070503***6304",
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

  // Efeito para redirecionar quando pagamento for confirmado
  useEffect(() => {
    if (paymentStatus?.status === "CONFIRMED") {
      toast.success("Pagamento confirmado! Redirecionando...");
      setTimeout(() => {
        window.location.href = "/sucesso";
      }, 2000);
    }
  }, [paymentStatus?.status]);

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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl max-w-md w-full">
          <CardBody className="text-center p-8">
            <h1 className="text-xl font-bold text-white mb-4">
              Pagamento não encontrado
            </h1>
            <p className="text-default-400 mb-6">
              Não foi possível encontrar os dados do pagamento.
            </p>
            <Button
              as={NextLink}
              className="w-full"
              color="primary"
              href="/precos"
            >
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
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardHeader className="flex flex-col items-center gap-4 pb-6 text-center">
            <div className="flex items-center justify-center gap-2">
              {getPaymentIcon(payment.billingType)}
              <h1 className="text-xl font-bold text-white">
                Pagamento {payment.billingType}
              </h1>
            </div>

            <AnimatePresence mode="wait">
              {paymentStatus?.status === "CONFIRMED" ? (
                <motion.div
                  key="confirmed"
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                >
                  <Chip
                    color="success"
                    startContent={<CheckCircle2 className="w-4 h-4" />}
                    variant="flat"
                  >
                    Pagamento Confirmado!
                  </Chip>
                </motion.div>
              ) : (
                <motion.div
                  key="pending"
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Chip
                      color="warning"
                      startContent={<Clock className="w-4 h-4" />}
                      variant="flat"
                    >
                      Aguardando Pagamento
                    </Chip>
                    <Spinner color="warning" size="sm" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-sm text-default-400">
              Complete o pagamento para ativar sua conta
            </p>

            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                R${" "}
                {payment.value.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-default-400">Valor da assinatura</p>
            </div>
          </CardHeader>

          <CardBody className="space-y-6 pt-0">
            <Divider className="border-white/10" />

            {/* PIX */}
            {payment.billingType === "PIX" && (
              <motion.div
                animate={{ opacity: 1 }}
                className="space-y-6"
                initial={{ opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="space-y-4">
                  {/* QR Code PIX */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      QR Code PIX
                    </h3>
                    <p className="text-sm text-default-400">
                      Escaneie com seu app bancário
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg">
                      {qrCodeUrl ? (
                        <img
                          alt="QR Code PIX"
                          className="w-32 h-32"
                          src={qrCodeUrl}
                        />
                      ) : (
                        <QrCode className="w-32 h-32 text-black" />
                      )}
                    </div>
                  </div>

                  <Divider className="border-white/10" />

                  {/* Código PIX Copia e Cola */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">
                      Código PIX (Copia e Cola)
                    </h3>
                    <div className="p-3 bg-default-100/10 rounded-lg border border-white/10">
                      <p className="text-xs text-default-400 break-all font-mono">
                        {payment.pixCopyPaste ||
                          payment.pixQrCode ||
                          "Carregando código PIX..."}
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      color="primary"
                      isDisabled={!payment.pixCopyPaste && !payment.pixQrCode}
                      size="sm"
                      startContent={
                        copied ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )
                      }
                      variant="flat"
                      onPress={() =>
                        copyToClipboard(
                          payment.pixCopyPaste || payment.pixQrCode || "",
                        )
                      }
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
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Boleto Bancário
                  </h3>
                  <p className="text-sm text-default-400">
                    Vencimento:{" "}
                    {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <Button className="w-full" color="primary">
                  Baixar Boleto
                </Button>
              </div>
            )}

            {/* Cartão de Crédito */}
            {payment.billingType === "CREDIT_CARD" && !paymentProcessed && (
              <CreditCardForm
                amount={payment.value}
                checkoutId={checkoutId!}
                customerName={customerData.name}
                onPaymentComplete={handlePaymentProcessed}
              />
            )}

            {/* Pagamento Processado */}
            {payment.billingType === "CREDIT_CARD" && paymentProcessed && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-success mb-2">
                    Pagamento Processado!
                  </h3>
                  <p className="text-sm text-default-400">
                    Redirecionando para a página de sucesso...
                  </p>
                </div>
              </div>
            )}

            <Divider className="border-white/10" />

            {/* Informações da empresa */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">
                Dados da Empresa
              </h3>
              <p className="text-sm text-default-400">{customerData.name}</p>
              <p className="text-sm text-default-400">{customerData.email}</p>
            </div>

            {/* Instruções */}
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="text-sm font-semibold text-primary mb-2">
                Próximos passos:
              </h3>
              <ul className="text-xs text-default-400 space-y-1">
                <li>• Complete o pagamento usando o método escolhido</li>
                <li>• Aguarde a confirmação automática (até 2 minutos)</li>
                <li>• Você receberá um email com o link de primeiro acesso</li>
                <li>• Faça login e configure seu escritório</li>
              </ul>
            </div>

            {/* Botões */}
            <div className="space-y-3">
              {/* Botão de teste para simular pagamento confirmado */}
              {(payment.billingType === "PIX" ||
                payment.billingType === "BOLETO") &&
                paymentStatus?.status !== "CONFIRMED" && (
                  <Button
                    className="w-full"
                    color="success"
                    variant="flat"
                    onPress={async () => {
                      try {
                        const response = await fetch("/api/test-pix-payment", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ asaasPaymentId: payment.id }),
                        });

                        const result = await response.json();

                        if (result.success) {
                          toast.success(
                            "Pagamento confirmado! Conta criada com sucesso!",
                          );
                          // Atualizar o status via SWR
                          mutate();
                        } else {
                          toast.error(
                            result.error || "Erro ao confirmar pagamento",
                          );
                        }
                      } catch (error) {
                        toast.error("Erro ao confirmar pagamento");
                      }
                    }}
                  >
                    🧪 Simular Pagamento Confirmado (TESTE)
                  </Button>
                )}

              <Button
                as={NextLink}
                className="w-full"
                href="/precos"
                startContent={<ArrowLeft className="w-4 h-4" />}
                variant="light"
              >
                Voltar aos Planos
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
