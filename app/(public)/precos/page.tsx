import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import NextLink from "next/link";

import { title, subtitle } from "@/components/primitives";

const plans = [
  {
    id: 1,
    name: "Starter",
    description: "Perfeito para advogados autônomos e pequenos escritórios",
    price: "R$ 97",
    period: "/mês",
    features: [
      "Até 50 processos ativos",
      "Gestão de clientes",
      "Controle de prazos",
      "Documentos básicos",
      "Suporte por email",
      "Relatórios simples",
    ],
    color: "default" as const,
    popular: false,
  },
  {
    id: 2,
    name: "Professional",
    description: "Ideal para escritórios em crescimento",
    price: "R$ 197",
    period: "/mês",
    features: [
      "Até 200 processos ativos",
      "Todas as funcionalidades do Starter",
      "Automações avançadas",
      "Integrações externas",
      "Suporte prioritário",
      "Relatórios avançados",
      "Treinamento da equipe",
      "Backup automático",
    ],
    color: "primary" as const,
    popular: true,
  },
  {
    id: 3,
    name: "Enterprise",
    description: "Para grandes escritórios e redes de advocacia",
    price: "R$ 497",
    period: "/mês",
    features: [
      "Processos ilimitados",
      "Todas as funcionalidades do Professional",
      "API completa",
      "Customizações avançadas",
      "Suporte 24/7",
      "Consultoria especializada",
      "White label",
      "SLA garantido",
    ],
    color: "secondary" as const,
    popular: false,
  },
];

const features = [
  {
    title: "Gestão Completa de Processos",
    description:
      "Organize, acompanhe e automatize todos os seus processos jurídicos em uma única plataforma.",
    icon: "⚖️",
  },
  {
    title: "Controle de Prazos Inteligente",
    description:
      "Nunca mais perca um prazo importante com nosso sistema de alertas automáticos.",
    icon: "⏰",
  },
  {
    title: "Portal do Cliente",
    description:
      "Ofereça transparência total com um portal personalizado para seus clientes.",
    icon: "👥",
  },
  {
    title: "Integrações Avançadas",
    description:
      "Conecte com ERPs, sistemas de pagamento e outras ferramentas do seu escritório.",
    icon: "🔗",
  },
];

export default function Precos() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12">
      <header className="space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Preços
        </p>
        <h1 className={title({ size: "lg", color: "blue" })}>
          Planos que se adaptam ao seu escritório
        </h1>
        <p className={subtitle({ fullWidth: true })}>
          Escolha o plano ideal para o tamanho e necessidades do seu escritório.
          Todos os planos incluem suporte especializado e atualizações
          contínuas.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`border border-white/10 bg-background/70 backdrop-blur-xl relative ${plan.popular ? "ring-2 ring-primary" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Chip color="primary" size="sm" variant="flat">
                  Mais Popular
                </Chip>
              </div>
            )}
            <CardHeader className="flex flex-col gap-2 pb-2 text-center">
              <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
              <p className="text-sm text-default-400">{plan.description}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="text-default-400">{plan.period}</span>
              </div>
            </CardHeader>
            <Divider className="border-white/10" />
            <CardBody className="pt-4">
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-default-400"
                  >
                    <span className="text-primary mt-1">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                as={NextLink}
                className="w-full"
                color={plan.color}
                href="/login"
                radius="full"
                size="lg"
                variant={plan.popular ? "solid" : "bordered"}
              >
                Começar teste grátis
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="border border-white/10 bg-white/5">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-xl font-semibold text-white text-center">
            Funcionalidades Inclusas em Todos os Planos
          </h2>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-default-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-primary/5">
        <CardBody className="text-center">
          <h3 className="mb-4 text-xl font-semibold text-white">
            Teste grátis por 14 dias
          </h3>
          <p className="mb-6 text-default-400">
            Experimente todas as funcionalidades sem compromisso. Cancele a
            qualquer momento sem taxas ou multas.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              as={NextLink}
              color="primary"
              href="/login"
              radius="full"
              size="lg"
            >
              Começar teste grátis
            </Button>
            <Button
              as={NextLink}
              className="border-white/20 text-white"
              href="/about"
              radius="full"
              size="lg"
              variant="bordered"
            >
              Falar com vendas
            </Button>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
