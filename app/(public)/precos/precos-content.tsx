"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import NextLink from "next/link";
import { motion } from "framer-motion";

import { CheckoutModal } from "@/components/checkout-modal";
import { title, subtitle } from "@/components/primitives";

interface Plano {
  id: string;
  nome: string;
  slug: string;
  valorMensal: number;
  valorAnual?: number;
  periodoTeste: number;
  limiteUsuarios: number;
  limiteProcessos: number;
  recursos: any;
  descricao: string;
}

interface PrecosContentProps {
  planos: Plano[];
}

const features = [
  {
    title: "Gestão Completa de Processos",
    description: "Organize, acompanhe e automatize todos os seus processos jurídicos em uma única plataforma.",
    icon: "⚖️",
  },
  {
    title: "Controle de Prazos Inteligente",
    description: "Nunca mais perca um prazo importante com nosso sistema de alertas automáticos.",
    icon: "⏰",
  },
  {
    title: "Portal do Cliente",
    description: "Ofereça transparência total com um portal personalizado para seus clientes.",
    icon: "👥",
  },
  {
    title: "Integrações Avançadas",
    description: "Conecte com ERPs, sistemas de pagamento e outras ferramentas do seu escritório.",
    icon: "🔗",
  },
];

// Ícones para os planos
const planIcons = {
  basico: "🏢",
  pro: "🚀",
  enterprise: "👑",
};

export function PrecosContent({ planos }: PrecosContentProps) {
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const getPlanColor = (index: number) => {
    const colors = ["default", "primary", "secondary"] as const;
    return colors[index % colors.length];
  };

  const isPopular = (index: number) => index === 1; // Pro é o mais popular

  const getPlanIcon = (planoSlug: string) => {
    return planIcons[planoSlug as keyof typeof planIcons] || "📋";
  };

  const handleStartTrial = (plano: Plano) => {
    setSelectedPlano(plano);
    setIsCheckoutOpen(true);
  };

  return (
    <>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12">
        <motion.header className="space-y-4 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Preços</p>
          <h1 className={title({ size: "lg", color: "blue" })}>Planos que se adaptam ao seu escritório</h1>
          <p className={subtitle({ fullWidth: true })}>
            Escolha o plano ideal para o tamanho e necessidades do seu escritório. Todos os planos incluem suporte especializado e atualizações contínuas.
          </p>
        </motion.header>

        <motion.div className="grid gap-6 lg:grid-cols-3 pt-8" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          {planos.map((plano: Plano, index: number) => (
            <motion.div
              key={plano.id}
              className="relative"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              {isPopular(index) && (
                <motion.div
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <Chip color="primary" size="sm" variant="solid" className="shadow-lg font-semibold px-3 py-1">
                    ⭐ Mais Popular
                  </Chip>
                </motion.div>
              )}
              <Card
                className={`border border-white/10 bg-background/70 backdrop-blur-xl relative transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 ${
                  isPopular(index) ? "ring-2 ring-primary shadow-lg shadow-primary/30" : ""
                }`}
              >
                <CardHeader className="flex flex-col gap-3 pb-4 text-center">
                  <div className={`text-4xl mb-2 ${isPopular(index) ? "mt-4" : ""}`}>{getPlanIcon(plano.slug)}</div>
                  <h2 className="text-xl font-semibold text-white">{plano.nome}</h2>
                  <p className="text-sm text-default-400">{plano.descricao}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-white">R$ {plano.valorMensal ? Number(plano.valorMensal).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}</span>
                    <span className="text-default-400">/mês</span>
                  </div>
                  {plano.valorAnual && <p className="text-xs text-default-500">💰 R$ {Number(plano.valorAnual).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/ano (2 meses grátis)</p>}
                </CardHeader>
                <Divider className="border-white/10" />
                <CardBody className="pt-4">
                  <ul className="space-y-3 mb-6">
                    {plano.recursos?.features?.map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-start gap-2 text-sm text-default-400">
                        <span className="text-primary mt-1">✅</span>
                        {feature}
                      </li>
                    ))}
                    <li className="flex items-start gap-2 text-sm text-default-400">
                      <span className="text-primary mt-1">👥</span>
                      Até {plano.limiteUsuarios} usuários
                    </li>
                    <li className="flex items-start gap-2 text-sm text-default-400">
                      <span className="text-primary mt-1">📁</span>
                      Até {plano.limiteProcessos} processos
                    </li>
                    <li className="flex items-start gap-2 text-sm text-default-400">
                      <span className="text-primary mt-1">🎁</span>
                      {plano.periodoTeste} dias grátis
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    color={getPlanColor(index)}
                    radius="full"
                    size="lg"
                    variant={isPopular(index) ? "solid" : "bordered"}
                    startContent={<span>🚀</span>}
                    onPress={() => handleStartTrial(plano)}
                  >
                    Começar teste grátis
                  </Button>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}>
          <Card className="border border-white/10 bg-white/5 hover:border-primary/30 transition-all duration-300">
            <CardHeader className="flex flex-col gap-2 pb-2">
              <h2 className="text-xl font-semibold text-white text-center">✨ Funcionalidades Inclusas em Todos os Planos</h2>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="pt-4">
              <div className="grid gap-6 md:grid-cols-2">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex gap-4 group cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl group-hover:bg-primary/20 transition-colors duration-300">{feature.icon}</div>
                    <div>
                      <h3 className="font-semibold text-white mb-2 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                      <p className="text-sm text-default-400 group-hover:text-default-300 transition-colors duration-300">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}>
          <Card className="border border-white/10 bg-primary/5 hover:border-primary/50 transition-all duration-300">
            <CardBody className="text-center">
              <h3 className="mb-4 text-xl font-semibold text-white">🎁 Teste grátis por 14 dias</h3>
              <p className="mb-6 text-default-400">Experimente todas as funcionalidades sem compromisso. Cancele a qualquer momento sem taxas ou multas.</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  color="primary"
                  radius="full"
                  size="lg"
                  startContent={<span>🚀</span>}
                  onPress={() => handleStartTrial(planos[1])} // Pro como padrão
                >
                  Começar teste grátis
                </Button>
                <Button
                  as={NextLink}
                  className="border-white/20 text-white hover:border-primary/50 hover:text-primary transition-all duration-300"
                  href="/about"
                  radius="full"
                  size="lg"
                  variant="bordered"
                  startContent={<span>💬</span>}
                >
                  Falar com vendas
                </Button>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </section>

      <CheckoutModal isOpen={isCheckoutOpen} onOpenChange={setIsCheckoutOpen} plano={selectedPlano} />
    </>
  );
}
