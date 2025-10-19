"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Chip, Button, Spinner } from "@heroui/react";
import { consultarStatusPagamento, conciliarPagamento } from "@/app/actions/cobranca-asaas";
import { toast } from "sonner";

interface StatusPagamentoTempoRealProps {
  paymentId: string;
  parcelaId: string;
  onStatusChange?: (status: string) => void;
}

export function StatusPagamentoTempoReal({ paymentId, parcelaId, onStatusChange }: StatusPagamentoTempoRealProps) {
  const [status, setStatus] = useState<string>("PENDENTE");
  const [isLoading, setIsLoading] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());

  // Consultar status automaticamente a cada 30 segundos
  useEffect(() => {
    if (!paymentId) return;

    const consultarStatus = async () => {
      try {
        const result = await consultarStatusPagamento(paymentId);
        if (result.success && result.data) {
          const novoStatus = result.data.status;
          if (novoStatus !== status) {
            setStatus(novoStatus);
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
        console.error("Erro ao consultar status:", error);
      }
    };

    // Consultar imediatamente
    consultarStatus();

    // Configurar intervalo de 30 segundos
    const interval = setInterval(consultarStatus, 30000);

    return () => clearInterval(interval);
  }, [paymentId, status, onStatusChange]);

  const handleConciliar = async () => {
    setIsLoading(true);
    try {
      const result = await conciliarPagamento(paymentId);
      if (result.success) {
        setStatus(result.data.paymentStatus);
        setUltimaAtualizacao(new Date());
        onStatusChange?.(result.data.paymentStatus);
        toast.success("Pagamento conciliado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao conciliar pagamento");
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
              <span className="text-sm text-default-500">Status do Pagamento</span>
              <Chip color={getStatusColor(status)} variant="flat" size="sm" startContent={status === "CONFIRMED" ? "✅" : status === "PENDING" ? "⏳" : status === "OVERDUE" ? "⚠️" : "❌"}>
                {getStatusText(status)}
              </Chip>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-default-400">Última atualização</p>
              <p className="text-xs text-default-500">{formatTime(ultimaAtualizacao)}</p>
            </div>

            <Button size="sm" variant="flat" color="primary" onPress={handleConciliar} isLoading={isLoading} startContent={isLoading ? <Spinner size="sm" /> : "🔄"}>
              {isLoading ? "Conciliando..." : "Conciliar"}
            </Button>
          </div>
        </div>

        {status === "PENDING" && (
          <div className="mt-3 p-2 bg-warning/10 rounded-lg">
            <p className="text-xs text-warning">💡 O status é atualizado automaticamente a cada 30 segundos. Você também pode clicar em "Conciliar" para verificar manualmente.</p>
          </div>
        )}

        {status === "CONFIRMED" && (
          <div className="mt-3 p-2 bg-success/10 rounded-lg">
            <p className="text-xs text-success">✅ Pagamento confirmado! A parcela foi marcada como paga automaticamente.</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
