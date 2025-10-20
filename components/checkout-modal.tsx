"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Smartphone,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { CnpjInput } from "./cnpj-input";
import { CpfInput } from "./cpf-input";
import { CepInput } from "./cep-input";

import { type CnpjData } from "@/types/brazil";
import { type CepData } from "@/types/brazil";
import { processarCheckout } from "@/app/actions/checkout";

interface Plano {
  id: string;
  nome: string;
  slug: string;
  valorMensal: number;
  periodoTeste: number;
  recursos: any;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  plano: Plano | null;
}

interface FormData {
  // Dados da empresa
  nomeEmpresa: string;
  cnpj: string;
  email: string;
  telefone: string;

  // Dados do responsável
  nomeResponsavel: string;
  cpf: string;

  // Endereço
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;

  // Pagamento
  formaPagamento: "PIX" | "BOLETO" | "CREDIT_CARD";
}

const initialFormData: FormData = {
  nomeEmpresa: "",
  cnpj: "",
  email: "",
  telefone: "",
  nomeResponsavel: "",
  cpf: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  formaPagamento: "PIX",
};

export function CheckoutModal({
  isOpen,
  onOpenChange,
  plano,
}: CheckoutModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [, setCnpjData] = useState<CnpjData | null>(null);
  const [, setCepData] = useState<CepData | null>(null);

  const steps = [
    { id: 1, title: "Dados da Empresa", icon: Building2 },
    { id: 2, title: "Responsável", icon: User },
    { id: 3, title: "Endereço", icon: MapPin },
    { id: 4, title: "Pagamento", icon: CreditCard },
  ];

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof prev[field] === "number" ? Number(value) : value,
    }));
  };

  // Função para extrair nome da pessoa física do campo razao_social (MEI)
  const extrairNomePessoaFisica = (razaoSocial: string): string => {
    // Remove o CNPJ do início (formato na ReceitaWS: 58.837.927 NOME)
    // Procura pelo padrão: números + ponto + números + ponto + números + espaço
    const match = razaoSocial.match(/^\d{2}\.\d{3}\.\d{3}\s+(.+)$/);

    if (match && match[1]) {
      return match[1].trim();
    }

    return razaoSocial.trim();
  };

  const handleCnpjFound = (data: CnpjData) => {
    setCnpjData(data);
    setFormData((prev) => ({
      ...prev,
      // Dados da empresa
      nomeEmpresa: data.razao_social,

      // Endereço completo
      cep: data.cep,
      endereco: data.logradouro,
      numero: data.numero || "",
      complemento: data.complemento || "",
      bairro: data.bairro,
      cidade: data.municipio,
      estado: data.uf,

      // Contato da empresa (se disponível)
      telefone: data.ddd_telefone_1 || "",
      email: data.email || "",

      // Dados do responsável (primeiro sócio/administrador ou pessoa física)
      nomeResponsavel:
        data.qsa?.[0]?.nome_socio ||
        (data.qsa?.length === 0
          ? extrairNomePessoaFisica(data.razao_social)
          : ""),
    }));

    // Toast informativo sobre os dados preenchidos
    const hasEmail = data.email && data.email.trim() !== "";
    const hasResponsavel =
      data.qsa?.[0]?.nome_socio ||
      (data.qsa?.length === 0
        ? extrairNomePessoaFisica(data.razao_social)
        : "");

    let message = "Dados preenchidos automaticamente!";

    if (hasEmail) message += " Email incluído.";
    if (hasResponsavel) message += " Responsável identificado.";

    toast.success(message);
  };

  const handleCepFound = (data: CepData) => {
    setCepData(data);
    setFormData((prev) => ({
      ...prev,
      endereco: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.nomeEmpresa &&
          formData.cnpj &&
          formData.email &&
          formData.telefone
        );
      case 2:
        return !!(formData.nomeResponsavel && formData.cpf);
      case 3:
        return !!(
          formData.cep &&
          formData.endereco &&
          formData.numero &&
          formData.cidade &&
          formData.estado
        );
      case 4:
        return !!formData.formaPagamento;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast.error("Preencha todos os campos obrigatórios");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4) || !plano) {
      toast.error("Preencha todos os campos obrigatórios");

      return;
    }

    setIsLoading(true);
    try {
      const result = await processarCheckout({
        ...formData,
        planoId: plano.id,
      });

      if (result.success) {
        toast.success("Pagamento criado com sucesso!");

        // Salvar dados do pagamento na sessionStorage
        if (result.data?.checkoutId) {
          sessionStorage.setItem(
            `checkout_${result.data.checkoutId}`,
            JSON.stringify({
              paymentData: result.data.paymentData,
              customerData: result.data.customerData,
            }),
          );
        }

        // Redirecionar para página de pagamento
        setTimeout(() => {
          router.push(`/pagamento?checkoutId=${result.data?.checkoutId}`);
          onOpenChange(false);
        }, 1000);
      } else {
        toast.error(result.error || "Erro ao processar pagamento");
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast.error("Erro ao processar pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
            exit={{ opacity: 0, x: -20 }}
            initial={{ opacity: 0, x: 20 }}
          >
            <div className="text-center mb-6">
              <Building2 className="w-12 h-12 text-primary mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-white">
                Dados da Empresa
              </h3>
              <p className="text-default-400">
                Informações da sua empresa ou escritório
              </p>
            </div>

            <CnpjInput
              isRequired
              label="CNPJ da Empresa"
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={(value) => handleInputChange("cnpj", value)}
              onCnpjFound={handleCnpjFound}
            />

            <Input
              isRequired
              label="Nome da Empresa"
              placeholder="Nome do seu escritório"
              startContent={<Building2 className="w-4 h-4 text-default-400" />}
              value={formData.nomeEmpresa}
              onChange={(e) => handleInputChange("nomeEmpresa", e.target.value)}
            />

            <Input
              isRequired
              label="Email"
              placeholder="contato@seuescritorio.com"
              startContent={<Mail className="w-4 h-4 text-default-400" />}
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />

            <Input
              isRequired
              label="Telefone"
              placeholder="(11) 99999-9999"
              startContent={<Phone className="w-4 h-4 text-default-400" />}
              value={formData.telefone}
              onChange={(e) => handleInputChange("telefone", e.target.value)}
            />
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
            exit={{ opacity: 0, x: -20 }}
            initial={{ opacity: 0, x: 20 }}
          >
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-primary mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-white">
                Responsável Legal
              </h3>
              <p className="text-default-400">
                Dados do responsável pela conta
              </p>
            </div>

            <Input
              isRequired
              label="Nome Completo"
              placeholder="Nome do responsável"
              startContent={<User className="w-4 h-4 text-default-400" />}
              value={formData.nomeResponsavel}
              onChange={(e) =>
                handleInputChange("nomeResponsavel", e.target.value)
              }
            />

            <CpfInput
              isRequired
              label="CPF"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(value) => handleInputChange("cpf", value)}
            />
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
            exit={{ opacity: 0, x: -20 }}
            initial={{ opacity: 0, x: 20 }}
          >
            <div className="text-center mb-6">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-white">Endereço</h3>
              <p className="text-default-400">Localização da sua empresa</p>
            </div>

            <CepInput
              isRequired
              label="CEP"
              placeholder="00000-000"
              value={formData.cep}
              onCepFound={handleCepFound}
              onChange={(value) => handleInputChange("cep", value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                isRequired
                label="Endereço"
                placeholder="Rua, Avenida..."
                startContent={<MapPin className="w-4 h-4 text-default-400" />}
                value={formData.endereco}
                onChange={(e) => handleInputChange("endereco", e.target.value)}
              />
              <Input
                isRequired
                label="Número"
                placeholder="123"
                value={formData.numero}
                onChange={(e) => handleInputChange("numero", e.target.value)}
              />
            </div>

            <Input
              label="Complemento"
              placeholder="Sala, Andar, etc."
              value={formData.complemento}
              onChange={(e) => handleInputChange("complemento", e.target.value)}
            />

            <Input
              isRequired
              label="Bairro"
              placeholder="Nome do bairro"
              value={formData.bairro}
              onChange={(e) => handleInputChange("bairro", e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                isRequired
                label="Cidade"
                placeholder="Sua cidade"
                value={formData.cidade}
                onChange={(e) => handleInputChange("cidade", e.target.value)}
              />
              <Input
                isRequired
                label="Estado"
                placeholder="UF"
                value={formData.estado}
                onChange={(e) => handleInputChange("estado", e.target.value)}
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
            exit={{ opacity: 0, x: -20 }}
            initial={{ opacity: 0, x: 20 }}
          >
            <div className="text-center mb-6">
              <CreditCard className="w-12 h-12 text-primary mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-white">
                Forma de Pagamento
              </h3>
              <p className="text-default-400">Escolha como deseja pagar</p>
            </div>

            <div className="grid gap-3">
              {[
                {
                  value: "PIX",
                  label: "PIX",
                  icon: Smartphone,
                  description: "Aprovação instantânea",
                },
                {
                  value: "CREDIT_CARD",
                  label: "Cartão de Crédito",
                  icon: CreditCard,
                  description: "Pagamentos com cartão",
                },
              ].map((option) => (
                <Card
                  key={option.value}
                  isPressable
                  className={`cursor-pointer transition-all duration-200 ${formData.formaPagamento === option.value ? "ring-2 ring-primary bg-primary/10" : "hover:bg-default-100/10"}`}
                  onPress={() =>
                    handleInputChange("formaPagamento", option.value)
                  }
                >
                  <CardBody className="flex flex-row items-center gap-3 p-4">
                    <option.icon className="w-6 h-6 text-primary" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">
                        {option.label}
                      </h4>
                      <p className="text-sm text-default-400">
                        {option.description}
                      </p>
                    </div>
                    {formData.formaPagamento === option.value && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>

            <AnimatePresence>
              {formData.formaPagamento === "CREDIT_CARD" && (
                <motion.p
                  key="credit-card-info"
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-default-400"
                  exit={{ opacity: 0, y: -6 }}
                  initial={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  Os dados do cartão serão informados com segurança na próxima
                  etapa.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!plano) return null;

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "bg-background/95 backdrop-blur-xl z-[99999]",
        header: "border-b border-white/10",
        body: "py-6",
        footer: "border-t border-white/10",
      }}
      isOpen={isOpen}
      placement="center"
      scrollBehavior="inside"
      size="2xl"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {plano.slug === "basico"
                    ? "🏢"
                    : plano.slug === "pro"
                      ? "🚀"
                      : "👑"}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {plano.nome}
                  </h2>
                  <p className="text-sm text-default-400">
                    R${" "}
                    {plano.valorMensal.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                    /mês
                  </p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between mt-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                          isCompleted
                            ? "bg-primary border-primary text-white"
                            : isActive
                              ? "border-primary text-primary"
                              : "border-default-400 text-default-400"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span
                        className={`ml-2 text-xs font-medium ${isActive ? "text-primary" : "text-default-400"}`}
                      >
                        {step.title}
                      </span>
                      {index < steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-default-400 mx-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ModalHeader>

            <ModalBody>
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </ModalBody>

            <ModalFooter className="flex justify-between">
              <Button
                isDisabled={currentStep === 1}
                startContent={<ArrowRight className="w-4 h-4 rotate-180" />}
                variant="light"
                onPress={prevStep}
              >
                Anterior
              </Button>

              {currentStep < 4 ? (
                <Button
                  color="primary"
                  endContent={<ArrowRight className="w-4 h-4" />}
                  onPress={nextStep}
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  color="primary"
                  endContent={!isLoading && <ArrowRight className="w-4 h-4" />}
                  isLoading={isLoading}
                  startContent={
                    !isLoading && <CreditCard className="w-4 h-4" />
                  }
                  onPress={handleSubmit}
                >
                  {isLoading ? "Processando..." : "Finalizar Pagamento"}
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
