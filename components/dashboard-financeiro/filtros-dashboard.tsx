"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Button,
  Select,
  SelectItem,
  DateRangePicker,
  Skeleton,
} from "@heroui/react";
import {
  Filter,
  RotateCcw,
  Calendar,
  User,
  Building,
  CreditCard,
} from "lucide-react";

import { FiltrosDashboard } from "@/app/actions/dashboard-financeiro";

interface FiltrosDashboardProps {
  filtros: FiltrosDashboard;
  onFiltrosChange: (filtros: FiltrosDashboard) => void;
  advogados: Array<{ id: string; nome: string; oab: string }>;
  clientes: Array<{ id: string; nome: string; documento: string }>;
  dadosBancarios: Array<{
    id: string;
    bancoNome: string;
    agencia: string;
    conta: string;
    principal: boolean;
  }>;
  isLoading: boolean;
}

export function FiltrosDashboardComponent({
  filtros,
  onFiltrosChange,
  advogados,
  clientes,
  dadosBancarios,
  isLoading,
}: FiltrosDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Garantir que sempre temos arrays válidos
  const safeAdvogados = Array.isArray(advogados) ? advogados : [];
  const safeClientes = Array.isArray(clientes) ? clientes : [];
  const safeDadosBancarios = Array.isArray(dadosBancarios)
    ? dadosBancarios
    : [];

  const resetFiltros = () => {
    onFiltrosChange({});
  };

  const updateFiltro = (key: keyof FiltrosDashboard, value: any) => {
    onFiltrosChange({
      ...filtros,
      [key]: value,
    });
  };

  const hasActiveFilters = Object.values(filtros).some(
    (value) => value !== undefined && value !== null && value !== "",
  );

  // Validar keys existentes para evitar warnings
  const advogadoKeySet = new Set(safeAdvogados.map((a) => a.id));
  const clienteKeySet = new Set(safeClientes.map((c) => c.id));
  const dadosBancariosKeySet = new Set(safeDadosBancarios.map((d) => d.id));

  const selectedAdvogadoKeys =
    filtros.advogadoId && advogadoKeySet.has(filtros.advogadoId)
      ? [filtros.advogadoId]
      : [];
  const selectedClienteKeys =
    filtros.clienteId && clienteKeySet.has(filtros.clienteId)
      ? [filtros.clienteId]
      : [];
  const selectedDadosBancariosKeys =
    filtros.dadosBancariosId &&
    dadosBancariosKeySet.has(filtros.dadosBancariosId)
      ? [filtros.dadosBancariosId]
      : [];

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-background/70 backdrop-blur-xl p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-background/70 backdrop-blur-xl p-4"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header dos Filtros */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-white">Filtros</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
              Ativo
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              color="default"
              size="sm"
              startContent={<RotateCcw className="h-3 w-3" />}
              variant="light"
              onPress={resetFiltros}
            >
              Limpar
            </Button>
          )}
          <Button
            color="primary"
            size="sm"
            variant="light"
            onPress={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Menos" : "Mais"}
          </Button>
        </div>
      </div>

      {/* Filtros Básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Período - Date Range */}
        <div className="md:col-span-2">
          <DateRangePicker
            className="w-full"
            label="Período"
            size="sm"
            startContent={<Calendar className="h-4 w-4 text-default-400" />}
            variant="bordered"
            onChange={(range) => {
              if (range && range.start && range.end) {
                updateFiltro("dataInicio", range.start);
                updateFiltro("dataFim", range.end);
              } else {
                updateFiltro("dataInicio", null);
                updateFiltro("dataFim", null);
              }
            }}
          />
        </div>

        {/* Advogado */}
        <div>
          <Select
            className="w-full"
            label="Advogado"
            placeholder="Selecionar advogado"
            selectedKeys={selectedAdvogadoKeys}
            size="sm"
            startContent={<User className="h-4 w-4 text-default-400" />}
            variant="bordered"
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;

              updateFiltro("advogadoId", value || null);
            }}
          >
            {safeAdvogados.map((advogado) => (
              <SelectItem
                key={advogado.id}
                textValue={`${advogado.nome} - ${advogado.oab}`}
              >
                {advogado.nome} - {advogado.oab}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Cliente */}
        <div>
          <Select
            className="w-full"
            label="Cliente"
            placeholder="Selecionar cliente"
            selectedKeys={selectedClienteKeys}
            size="sm"
            startContent={<Building className="h-4 w-4 text-default-400" />}
            variant="bordered"
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;

              updateFiltro("clienteId", value || null);
            }}
          >
            {safeClientes.map((cliente) => (
              <SelectItem
                key={cliente.id}
                textValue={`${cliente.nome} - ${cliente.documento}`}
              >
                {cliente.nome} - {cliente.documento}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Filtros Avançados */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 pt-4 border-t border-white/10"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Conta Bancária */}
              <div>
                <Select
                  className="w-full"
                  label="Conta Bancária"
                  placeholder="Selecionar conta"
                  selectedKeys={selectedDadosBancariosKeys}
                  size="sm"
                  startContent={
                    <CreditCard className="h-4 w-4 text-default-400" />
                  }
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;

                    updateFiltro("dadosBancariosId", value || null);
                  }}
                >
                  {safeDadosBancarios.map((conta) => (
                    <SelectItem
                      key={conta.id}
                      textValue={`${conta.bancoNome} - ${conta.agencia}/${conta.conta}`}
                    >
                      <div className="flex flex-col">
                        <span>
                          {conta.bancoNome} - {conta.agencia}/{conta.conta}
                        </span>
                        {conta.principal && (
                          <span className="text-xs text-primary font-medium">
                            Principal
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros Ativos */}
      {hasActiveFilters && (
        <motion.div
          animate={{ opacity: 1 }}
          className="mt-4 pt-4 border-t border-white/10"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-xs text-default-400 mb-2">Filtros ativos:</p>
          <div className="flex flex-wrap gap-2">
            {filtros.dataInicio && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                Desde:{" "}
                {new Date(filtros.dataInicio).toLocaleDateString("pt-BR")}
              </span>
            )}
            {filtros.dataFim && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                Até: {new Date(filtros.dataFim).toLocaleDateString("pt-BR")}
              </span>
            )}
            {filtros.advogadoId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
                Advogado:{" "}
                {safeAdvogados.find((a) => a.id === filtros.advogadoId)?.nome}
              </span>
            )}
            {filtros.clienteId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">
                Cliente:{" "}
                {safeClientes.find((c) => c.id === filtros.clienteId)?.nome}
              </span>
            )}
            {filtros.dadosBancariosId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary">
                Conta:{" "}
                {
                  safeDadosBancarios.find(
                    (c) => c.id === filtros.dadosBancariosId,
                  )?.bancoNome
                }
              </span>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
