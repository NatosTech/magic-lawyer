"use client";

import { useState } from "react";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import CardBrandDetector, { detectCardBrand } from "./card-brand-detector";
import { processarPagamentoCartao } from "@/app/actions/processar-pagamento-cartao";

interface CreditCardFormProps {
  amount: number;
  onPaymentComplete: (paymentData: any) => void;
  customerName: string;
  checkoutId: string;
}

export default function CreditCardForm({
  amount,
  onPaymentComplete,
  customerName,
  checkoutId,
}: CreditCardFormProps) {
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(true);

  const detectedBrand = detectCardBrand(formData.cardNumber);

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    // Formatação do número do cartão (adiciona espaços a cada 4 dígitos)
    if (field === "cardNumber") {
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{4})(?=\d)/g, "$1 ");
      if (formattedValue.length > 19)
        formattedValue = formattedValue.slice(0, 19);
    }

    // Formatação do CVV (máximo 4 dígitos)
    if (field === "cvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    // Formatação do mês (01-12)
    if (field === "expiryMonth") {
      formattedValue = value.replace(/\D/g, "").slice(0, 2);
      if (formattedValue.length === 1 && parseInt(formattedValue) > 1) {
        formattedValue = "0" + formattedValue;
      }
      if (parseInt(formattedValue) > 12) {
        formattedValue = "12";
      }
    }

    // Formatação do ano (2 dígitos)
    if (field === "expiryYear") {
      formattedValue = value.replace(/\D/g, "").slice(0, 2);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));
  };

  const validateForm = () => {
    if (
      !formData.cardNumber ||
      formData.cardNumber.replace(/\s/g, "").length < 16
    ) {
      toast.error("Número do cartão inválido");
      return false;
    }

    if (!detectedBrand) {
      toast.error("Bandeira do cartão não reconhecida");
      return false;
    }

    if (!formData.cardName.trim()) {
      toast.error("Nome no cartão é obrigatório");
      return false;
    }

    if (!formData.expiryMonth || !formData.expiryYear) {
      toast.error("Data de validade é obrigatória");
      return false;
    }

    if (!formData.cvv || formData.cvv.length < 3) {
      toast.error("CVV é obrigatório");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      // Processar pagamento REAL com Asaas
      const paymentResult = await processarPagamentoCartao({
        checkoutId,
        paymentData: {
          cardNumber: formData.cardNumber.replace(/\s/g, ""),
          cardName: formData.cardName,
          expiryMonth: formData.expiryMonth,
          expiryYear: formData.expiryYear,
          cvv: formData.cvv,
          amount: amount,
          customerName: customerName,
        },
      });

      if (paymentResult.success) {
        if (
          paymentResult.data?.status &&
          paymentResult.data.status !== "CONFIRMED"
        ) {
          toast.info(
            paymentResult.message ??
              "Pagamento criado. Aguarde a confirmação automática.",
          );
          setIsProcessing(false);
          return;
        }

        toast.success(
          paymentResult.data?.message ?? "Pagamento aprovado! Conta criada.",
        );
        onPaymentComplete(paymentResult.data);
      } else {
        toast.error(`Pagamento recusado: ${paymentResult.error}`);
        setIsProcessing(false);
      }
    } catch (error) {
      toast.error("Erro ao processar pagamento. Tente novamente.");
      console.error("Erro no pagamento:", error);
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex gap-3">
          <motion.div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/20"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <CreditCard className="h-6 w-6 text-primary" />
          </motion.div>
          <div className="flex flex-col">
            <motion.p
              className="text-md font-semibold"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Cartão de Crédito
            </motion.p>
            <motion.p
              className="text-small text-default-400"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Preencha os dados do seu cartão
            </motion.p>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="space-y-6">
          {/* Card Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <CardBrandDetector
              cardNumber={formData.cardNumber}
              cardName={formData.cardName}
              expiryMonth={formData.expiryMonth}
              expiryYear={formData.expiryYear}
              isVisible={isCardVisible}
              onToggleVisibility={() => setIsCardVisible(!isCardVisible)}
            />
          </motion.div>

          {/* Número do Cartão */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Input
              label="Número do Cartão"
              placeholder="0000 0000 0000 0000"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange("cardNumber", e.target.value)}
              maxLength={19}
              startContent={<CreditCard className="h-4 w-4 text-default-400" />}
              endContent={
                <AnimatePresence>
                  {detectedBrand && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-xs text-success font-medium">
                        {detectedBrand.name}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              }
            />
          </motion.div>

          {/* Nome no Cartão */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Input
              label="Nome no Cartão"
              placeholder="JOÃO DA SILVA"
              value={formData.cardName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  cardName: e.target.value.toUpperCase(),
                }))
              }
              maxLength={50}
            />
          </motion.div>

          {/* Data de Validade e CVV */}
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Input
              label="Mês"
              placeholder="MM"
              value={formData.expiryMonth}
              onChange={(e) => handleInputChange("expiryMonth", e.target.value)}
              maxLength={2}
              className="flex-1"
            />
            <Input
              label="Ano"
              placeholder="YY"
              value={formData.expiryYear}
              onChange={(e) => handleInputChange("expiryYear", e.target.value)}
              maxLength={2}
              className="flex-1"
            />
            <Input
              label="CVV"
              placeholder="123"
              value={formData.cvv}
              onChange={(e) => handleInputChange("cvv", e.target.value)}
              maxLength={4}
              className="flex-1"
              type="password"
            />
          </motion.div>

          {/* Valor */}
          <motion.div
            className="rounded-lg bg-primary/10 p-4 border border-primary/20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-default-400">Valor Total:</span>
              <motion.span
                className="text-lg font-bold text-primary"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                R${" "}
                {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </motion.span>
            </div>
          </motion.div>

          {/* Botão de Pagamento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Button
              color="primary"
              size="lg"
              className="w-full"
              onPress={handleSubmit}
              isLoading={isProcessing}
              startContent={
                !isProcessing ? <Lock className="h-4 w-4" /> : undefined
              }
              isDisabled={!detectedBrand}
            >
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.span
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Processando Pagamento...
                  </motion.span>
                ) : (
                  <motion.span
                    key="pay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Pagar R${" "}
                    {amount.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          {/* Informação de Segurança */}
          <motion.div
            className="flex items-center gap-2 text-xs text-default-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <Lock className="h-3 w-3" />
            <span>Pagamento seguro processado pelo Asaas (Modo Sandbox)</span>
          </motion.div>

          {/* Cartões de Teste */}
          <motion.div
            className="rounded-lg bg-warning/10 p-3 border border-warning/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <motion.p
              className="text-xs font-semibold text-warning mb-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💳 Cartões de Teste Asaas:
            </motion.p>
            <div className="text-xs text-default-400 space-y-1">
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
              >
                <strong>Aprovados:</strong> 4000000000000002 (Visa) |
                5555555555554444 (Master)
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 }}
              >
                <strong>Recusados:</strong> 4000000000000069 (Visa) |
                5555555555554445 (Master)
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}
              >
                <strong>CVV:</strong> Qualquer 3 dígitos |{" "}
                <strong>Validade:</strong> Qualquer data futura
              </motion.p>
            </div>
          </motion.div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
