"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardBody, Chip, Button, Spinner } from "@heroui/react";
import { toast } from "@/lib/toast";

import {
  consultarStatusPagamento,
  conciliarPagamento,
} from "@/app/actions/cobranca-asaas";
import { REALTIME_POLLING } from "@/app/lib/realtime/polling-policy";
import {
  isPollingGloballyEnabled,
  resolvePollingInterval,
  subscribePollingControl,
  tracePollingAttempt,
} from "@/app/lib/realtime/polling-telemetry";

interface StatusPagamentoTempoRealProps {
  paymentId: string;
  parcelaId: string;
  onStatusChange?: (status: string) => void;
}

export function StatusPagamentoTempoReal({
  paymentId,
  onStatusChange,
}: StatusPagamentoTempoRealProps) {
  const [status, setStatus] = useState<string>("PENDENTE");
  const [isLoading, setIsLoading] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());
  const latestStatus = useRef(status);
  const [isPollingEnabled, setIsPollingEnabled] = useState(() =>
    isPollingGloballyEnabled(),
  );
  const isTerminalStatus = status === "CONFIRMED" || status === "CANCELLED";

  useEffect(() => {
    return subscribePollingControl(setIsPollingEnabled);
  }, []);

  const pollingIntervalMs = resolvePollingInterval({
    isConnected: false,
    enabled: isPollingEnabled && !isTerminalStatus,
    fallbackMs: REALTIME_POLLING.PAGAMENTO_POLLING_MS,
    minimumMs: REALTIME_POLLING.PAGAMENTO_POLLING_MS,
  });

  useEffect(() => {
    latestStatus.current = status;
  }, [status]);

  useEffect(() => {
    if (!paymentId || pollingIntervalMs <= 0) {
      return;
    }

    const consultarStatus = async () => {
      try {
        const result = await tracePollingAttempt(
          {
            hookName: "StatusPagamentoTempoReal",
            endpoint: `/api/payment/${paymentId}/status`,
            source: "interval",
            intervalMs: pollingIntervalMs,
          },
          () => consultarStatusPagamento(paymentId),
        );

        if (result.success && result.data) {
          const novoStatus = result.data.status ?? "PENDING";

          if (novoStatus !== latestStatus.current) {
            setStatus(novoStatus);
            latestStatus.current = novoStatus;
            setUltimaAtualizacao(new Date());
            onStatusChange?.(novoStatus);

            // Mostrar notificação de mudança de status
            if (novoStatus === "CONFIRMED") {
              toast.success("Pagamento confirmado!");
            } else if (novoStatus === "OVERDUE") {
              toast.warning("Pagamento em atraso");
            }
          }
        }
      } catch (error) {
      }
    };

    // Consultar imediatamente
    void consultarStatus();

    // Fallback HTTP apenas enquanto o pagamento está pendente
    const interval = setInterval(consultarStatus, pollingIntervalMs);

    return () => clearInterval(interval);
  }, [paymentId, pollingIntervalMs, isTerminalStatus, onStatusChange]);

  const handleConciliar = async () => {
    setIsLoading(true);
    try {
      const result = await tracePollingAttempt(
        {
          hookName: "StatusPagamentoTempoReal",
          endpoint: `/api/payment/${paymentId}/conciliar`,
          source: "manual",
        },
        () => conciliarPagamento(paymentId),
      );

      if (result.success && result.data) {
        const paymentStatus = result.data.paymentStatus ?? status;

        setStatus(paymentStatus);
        setUltimaAtualizacao(new Date());
        onStatusChange?.(paymentStatus);
        toast.success("Pagamento conciliado com sucesso!");
      } else {
        toast.error(result.error ?? "Erro ao conciliar pagamento");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "success";
      case "PENDING":
        return "warning";
      case "OVERDUE":
        return "danger";
      case "CANCELLED":
        return "default";
      default:
        return "warning";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Pago";
      case "PENDING":
        return "Pendente";
      case "OVERDUE":
        return "Em Atraso";
      case "CANCELLED":
        return "Cancelado";
      default:
        return "Pendente";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card className="bg-background/50 border border-white/10">
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-sm text-default-500">
                Status do Pagamento
              </span>
              <Chip
                color={getStatusColor(status)}
                size="sm"
                startContent={
                  status === "CONFIRMED"
                    ? "✅"
                    : status === "PENDING"
                      ? "⏳"
                      : status === "OVERDUE"
                        ? "⚠️"
                        : "❌"
                }
                variant="flat"
              >
                {getStatusText(status)}
              </Chip>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-default-400">Última atualização</p>
              <p className="text-xs text-default-500">
                {formatTime(ultimaAtualizacao)}
              </p>
            </div>

            <Button
              color="primary"
              isLoading={isLoading}
              size="sm"
              startContent={isLoading ? <Spinner size="sm" /> : "🔄"}
              variant="flat"
              onPress={handleConciliar}
            >
              {isLoading ? "Conciliando..." : "Conciliar"}
            </Button>
          </div>
        </div>

        {status === "PENDING" && (
          <div className="mt-3 p-2 bg-warning/10 rounded-lg">
            <p className="text-xs text-warning">
              💡 O status é atualizado automaticamente enquanto pendente. Você
              também pode clicar em &quot;Conciliar&quot; para verificar
              manualmente.
            </p>
          </div>
        )}

        {status === "CONFIRMED" && (
          <div className="mt-3 p-2 bg-success/10 rounded-lg">
            <p className="text-xs text-success">
              ✅ Pagamento confirmado! A parcela foi marcada como paga
              automaticamente.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
