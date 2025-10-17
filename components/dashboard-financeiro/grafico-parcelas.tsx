"use client";

import { motion } from "framer-motion";
import { Spinner } from "@heroui/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { GraficoParcelas } from "@/app/actions/dashboard-financeiro";

interface GraficoParcelasProps {
  grafico: GraficoParcelas[];
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

// Componente customizado para o tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-xl p-3 border border-white/10 rounded-lg shadow-lg">
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-default-400" style={{ color: entry.color }}>
            {`${entry.name}: ${formatCurrency(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function GraficoParcelasComponent({ grafico, isLoading }: GraficoParcelasProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-default-600">Carregando gráfico...</p>
        </div>
      </div>
    );
  }

  if (!grafico || grafico.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-default-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Nenhum dado disponível</h3>
        <p className="text-default-400">Crie contratos e parcelas para ver o gráfico</p>
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = grafico.map((item) => ({
    periodo: item.periodo,
    Pagas: item.pagas,
    Pendentes: item.pendentes,
    Atrasadas: item.atrasadas,
    Total: item.total,
  }));

  // Calcular totais para as métricas
  const totalPagas = grafico.reduce((sum, item) => sum + item.pagas, 0);
  const totalPendentes = grafico.reduce((sum, item) => sum + item.pendentes, 0);
  const totalAtrasadas = grafico.reduce((sum, item) => sum + item.atrasadas, 0);
  const totalGeral = totalPagas + totalPendentes + totalAtrasadas;

  return (
    <div className="space-y-6">
      {/* Gráfico Principal */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between w-full mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Evolução das Parcelas</h3>
            <p className="text-sm text-default-400">Distribuição por status de pagamento</p>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-white">Total: {formatCurrency(totalGeral)}</span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="periodo"
                tick={{ fontSize: 12, fill: "rgba(255,255,255,0.7)" }}
                tickFormatter={(value) => {
                  // Formatar período YYYY-MM para MMM/YY
                  const [year, month] = value.split("-");
                  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                  return `${monthNames[parseInt(month) - 1]}/${year.slice(-2)}`;
                }}
              />
              <YAxis tick={{ fontSize: 12, fill: "rgba(255,255,255,0.7)" }} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Pagas" fill="#10b981" name="Pagas" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Pendentes" fill="#3b82f6" name="Pendentes" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Atrasadas" fill="#ef4444" name="Atrasadas" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Métricas Resumo */}
      <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <div className="rounded-2xl border border-white/10 bg-background/40 p-4 text-center">
          <p className="text-sm text-default-400">Taxa de Recebimento</p>
          <p className="text-xl font-bold text-success">{totalGeral > 0 ? ((totalPagas / totalGeral) * 100).toFixed(1) : 0}%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-background/40 p-4 text-center">
          <p className="text-sm text-default-400">Taxa de Atraso</p>
          <p className="text-xl font-bold text-danger">{totalGeral > 0 ? ((totalAtrasadas / totalGeral) * 100).toFixed(1) : 0}%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-background/40 p-4 text-center">
          <p className="text-sm text-default-400">Total Pendente</p>
          <p className="text-xl font-bold text-warning">{formatCurrency(totalPendentes)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-background/40 p-4 text-center">
          <p className="text-sm text-default-400">Total Atrasado</p>
          <p className="text-xl font-bold text-danger">{formatCurrency(totalAtrasadas)}</p>
        </div>
      </motion.div>
    </div>
  );
}
