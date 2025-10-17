"use client";

import { motion } from "framer-motion";
import { Spinner, Avatar, Chip } from "@heroui/react";
import { Eye, EyeOff, User, DollarSign } from "lucide-react";
import { HonorariosPorAdvogado } from "@/app/actions/dashboard-financeiro";

interface HonorariosAdvogadoProps {
  honorarios: HonorariosPorAdvogado[];
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function HonorariosAdvogado({ honorarios, isLoading }: HonorariosAdvogadoProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`honorario-skeleton-${index}`} className="rounded-2xl border border-white/10 bg-background/40 p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10" />
              <div className="flex-1">
                <div className="h-4 w-1/3 rounded bg-white/10 mb-2" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!honorarios || honorarios.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 mx-auto text-default-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Nenhum honorário encontrado</h3>
        <p className="text-default-400">Não há honorários cadastrados para o período selecionado.</p>
      </div>
    );
  }

  const totalHonorarios = honorarios.reduce((sum, h) => sum + h.totalHonorarios, 0);

  return (
    <div className="space-y-6">
      {/* Lista de Honorários */}
      <div className="space-y-4">
        {honorarios.map((honorario, index) => {
          const percentual = totalHonorarios > 0 ? (honorario.totalHonorarios / totalHonorarios) * 100 : 0;
          const percentualRecebido = honorario.totalHonorarios > 0 ? (honorario.honorariosRecebidos / honorario.totalHonorarios) * 100 : 0;

          return (
            <motion.div
              key={honorario.advogadoId}
              className="rounded-2xl border border-white/10 bg-background/40 p-4 hover:bg-background/60 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Avatar name={honorario.advogadoNome.charAt(0)} size="sm" className="bg-primary/20 text-primary" />
                  <div>
                    <h4 className="font-semibold text-white">{honorario.advogadoNome}</h4>
                    <div className="flex items-center space-x-2">
                      <Chip
                        size="sm"
                        color={honorario.visibilidade === "PUBLICO" ? "success" : "warning"}
                        variant="flat"
                        startContent={honorario.visibilidade === "PUBLICO" ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      >
                        {honorario.visibilidade === "PUBLICO" ? "Público" : "Privado"}
                      </Chip>
                      <span className="text-xs text-default-400">{honorario.contratosAtivos} contrato(s)</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{formatCurrency(honorario.totalHonorarios)}</p>
                  <p className="text-xs text-default-400">{formatPercent(percentual)} do total</p>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-default-400 mb-1">
                  <span>Progresso de recebimento</span>
                  <span>{formatPercent(percentualRecebido)}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-success h-2 rounded-full transition-all duration-300" style={{ width: `${percentualRecebido}%` }} />
                </div>
              </div>

              {/* Métricas Detalhadas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2 bg-success/10 rounded-lg border border-success/20">
                  <p className="text-xs text-success font-medium">Recebido</p>
                  <p className="text-sm font-bold text-success">{formatCurrency(honorario.honorariosRecebidos)}</p>
                </div>
                <div className="p-2 bg-warning/10 rounded-lg border border-warning/20">
                  <p className="text-xs text-warning font-medium">Pendente</p>
                  <p className="text-sm font-bold text-warning">{formatCurrency(honorario.honorariosPendentes)}</p>
                </div>
                <div className="p-2 bg-default/10 rounded-lg border border-default/20">
                  <p className="text-xs text-default-400 font-medium">Contratos</p>
                  <p className="text-sm font-bold text-white">{honorario.contratosAtivos}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Resumo Geral */}
      <motion.div className="rounded-2xl border border-white/10 bg-background/40 p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-success" />
          Resumo Geral dos Honorários
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-default-400 font-medium">Total Honorários</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totalHonorarios)}</p>
          </div>
          <div>
            <p className="text-xs text-default-400 font-medium">Total Recebido</p>
            <p className="text-lg font-bold text-success">{formatCurrency(honorarios.reduce((sum, h) => sum + h.honorariosRecebidos, 0))}</p>
          </div>
          <div>
            <p className="text-xs text-default-400 font-medium">Total Pendente</p>
            <p className="text-lg font-bold text-warning">{formatCurrency(honorarios.reduce((sum, h) => sum + h.honorariosPendentes, 0))}</p>
          </div>
          <div>
            <p className="text-xs text-default-400 font-medium">Advogados</p>
            <p className="text-lg font-bold text-white">{honorarios.length}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
