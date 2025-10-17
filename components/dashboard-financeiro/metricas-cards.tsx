"use client";

import { motion } from "framer-motion";
import { Spinner, Tooltip } from "@heroui/react";
import { DollarSign, TrendingUp, TrendingDown, Wallet, AlertTriangle, CheckCircle, Clock, Target } from "lucide-react";
import { MetricasFinanceiras } from "@/app/actions/dashboard-financeiro";

interface MetricasCardsProps {
  metricas: MetricasFinanceiras;
  isLoading?: boolean;
}

const toneStyles = {
  success: {
    container: "border-success/20 bg-success/5",
    title: "text-success",
    helper: "text-success/70",
  },
  danger: {
    container: "border-danger/20 bg-danger/5",
    title: "text-danger",
    helper: "text-danger/70",
  },
  primary: {
    container: "border-primary/20 bg-primary/5",
    title: "text-primary",
    helper: "text-primary/70",
  },
  secondary: {
    container: "border-secondary/20 bg-secondary/5",
    title: "text-secondary",
    helper: "text-secondary/70",
  },
  warning: {
    container: "border-warning/20 bg-warning/5",
    title: "text-warning",
    helper: "text-warning/70",
  },
};

export function MetricasCards({ metricas, isLoading }: MetricasCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={`metric-skeleton-${index}`} className="rounded-2xl border border-white/10 bg-background/40 p-4 animate-pulse">
            <div className="h-9 w-9 rounded-full bg-white/10" />
            <div className="mt-4 h-4 w-1/2 rounded bg-white/10" />
            <div className="mt-2 h-3 w-3/4 rounded bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const cards = [
    {
      title: "Receitas Totais",
      value: formatCurrency(metricas.receitas.total),
      icon: DollarSign,
      tone: "success" as keyof typeof toneStyles,
      helper: `${formatCurrency(metricas.receitas.recebido)} recebido`,
      tooltip: "Valor total de todas as receitas contratadas, incluindo parcelas pagas, pendentes e em atraso.",
    },
    {
      title: "Receitas Pendentes",
      value: formatCurrency(metricas.receitas.pendente),
      icon: Clock,
      tone: "warning" as keyof typeof toneStyles,
      helper: `${formatCurrency(metricas.receitas.atrasado)} em atraso`,
      tooltip: "Valor das parcelas que ainda não foram pagas pelos clientes, incluindo as que estão em atraso.",
    },
    {
      title: "Saldo Atual",
      value: formatCurrency(metricas.saldo.atual),
      icon: Wallet,
      tone: metricas.saldo.atual >= 0 ? ("primary" as keyof typeof toneStyles) : ("danger" as keyof typeof toneStyles),
      helper: `${formatCurrency(metricas.saldo.previsto)} previsto`,
      tooltip: "Saldo atual do escritório (receitas recebidas - despesas pagas). Verde = positivo, Vermelho = negativo.",
    },
    {
      title: "Taxa Inadimplência",
      value: formatPercent(metricas.performance.taxaInadimplencia),
      icon: AlertTriangle,
      tone: "danger" as keyof typeof toneStyles,
      helper: `${formatPercent(metricas.performance.conversaoContratos)} conversão`,
      tooltip: "Percentual de parcelas em atraso em relação ao total. Valores altos indicam necessidade de cobrança.",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(metricas.performance.ticketMedio),
      icon: Target,
      tone: "secondary" as keyof typeof toneStyles,
      helper: "Por contrato",
      tooltip: "Valor médio por contrato de honorários. Indica o valor típico dos serviços prestados.",
    },
    {
      title: "Receitas Recebidas",
      value: formatCurrency(metricas.receitas.recebido),
      icon: CheckCircle,
      tone: "success" as keyof typeof toneStyles,
      helper: metricas.receitas.total > 0 ? `${formatPercent((metricas.receitas.recebido / metricas.receitas.total) * 100)} do total` : "0% do total",
      tooltip: "Valor total já recebido dos clientes. Mostra a eficiência na cobrança de honorários.",
    },
    {
      title: "Receitas em Atraso",
      value: formatCurrency(metricas.receitas.atrasado),
      icon: TrendingDown,
      tone: "danger" as keyof typeof toneStyles,
      helper: "Requer atenção",
      tooltip: "Valor das parcelas que passaram da data de vencimento. Requer ação imediata de cobrança.",
    },
    {
      title: "Crescimento",
      value: formatPercent(metricas.performance.conversaoContratos),
      icon: TrendingUp,
      tone: "primary" as keyof typeof toneStyles,
      helper: "Taxa de conversão",
      tooltip: "Taxa de conversão de propostas em contratos. Indica a eficácia na captação de clientes.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const styles = toneStyles[card.tone];

        return (
          <Tooltip
            key={index}
            content={card.tooltip}
            color={card.tone === "success" ? "success" : card.tone === "danger" ? "danger" : card.tone === "warning" ? "warning" : "default"}
            placement="top"
            showArrow
          >
            <motion.div
              className={`rounded-2xl border p-4 min-w-0 cursor-help ${styles.container}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <div className="flex items-center gap-3">
                <span aria-hidden className="text-2xl">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-default-400">{card.title}</p>
                  <p className={`truncate text-xl font-semibold ${styles.title}`}>{card.value}</p>
                  <p className={`text-xs ${styles.helper}`}>{card.helper}</p>
                </div>
              </div>
            </motion.div>
          </Tooltip>
        );
      })}
    </div>
  );
}
