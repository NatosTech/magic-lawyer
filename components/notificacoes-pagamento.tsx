"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Chip, Button, Avatar } from "@heroui/react";
import { toast } from "@/lib/toast";

interface NotificacaoPagamento {
  id: string;
  tipo:
    | "PAGAMENTO_RECEBIDO"
    | "PAGAMENTO_ATRASADO"
    | "ASSINATURA_ATIVADA"
    | "ASSINATURA_CANCELADA";
  titulo: string;
  descricao: string;
  valor?: number;
  data: Date;
  lida: boolean;
  acao?: {
    texto: string;
    url: string;
  };
}

interface NotificacoesPagamentoProps {
  tenantId: string;
}

export function NotificacoesPagamento({
  tenantId,
}: NotificacoesPagamentoProps) {
  const [notificacoes, setNotificacoes] = useState<NotificacaoPagamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de notificações
    // Em produção, isso viria de uma API real
    setTimeout(() => {
      setNotificacoes([
        {
          id: "1",
          tipo: "PAGAMENTO_RECEBIDO",
          titulo: "Pagamento Recebido",
          descricao: "Parcela #001 do contrato XYZ foi paga via PIX",
          valor: 1500.0,
          data: new Date(Date.now() - 5 * 60 * 1000), // 5 minutos atrás
          lida: false,
          acao: {
            texto: "Ver Parcela",
            url: "/parcelas/1",
          },
        },
        {
          id: "2",
          tipo: "PAGAMENTO_ATRASADO",
          titulo: "Pagamento em Atraso",
          descricao: "Parcela #002 do contrato ABC está vencida há 3 dias",
          valor: 2000.0,
          data: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
          lida: false,
          acao: {
            texto: "Gerar Cobrança",
            url: "/parcelas/2/pagar",
          },
        },
        {
          id: "3",
          tipo: "ASSINATURA_ATIVADA",
          titulo: "Assinatura Ativada",
          descricao: "Plano Pro foi ativado com sucesso",
          valor: 299.0,
          data: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
          lida: true,
          acao: {
            texto: "Ver Dashboard",
            url: "/dashboard",
          },
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, [tenantId]);

  const marcarComoLida = (id: string) => {
    setNotificacoes((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, lida: true } : notif)),
    );
  };

  const getIcone = (tipo: string) => {
    switch (tipo) {
      case "PAGAMENTO_RECEBIDO":
        return "💰";
      case "PAGAMENTO_ATRASADO":
        return "⚠️";
      case "ASSINATURA_ATIVADA":
        return "✅";
      case "ASSINATURA_CANCELADA":
        return "❌";
      default:
        return "📢";
    }
  };

  const getCor = (tipo: string) => {
    switch (tipo) {
      case "PAGAMENTO_RECEBIDO":
        return "success";
      case "PAGAMENTO_ATRASADO":
        return "danger";
      case "ASSINATURA_ATIVADA":
        return "success";
      case "ASSINATURA_CANCELADA":
        return "danger";
      default:
        return "default";
    }
  };

  const formatCurrency = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}min atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else {
      return `${days}d atrás`;
    }
  };

  const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length;

  if (isLoading) {
    return (
      <Card className="bg-background/50 border border-white/10">
        <CardBody className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-2 text-sm text-default-500">
              Carregando notificações...
            </span>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notificações de Pagamento</h3>
        {notificacoesNaoLidas > 0 && (
          <Chip color="danger" size="sm" variant="flat">
            {notificacoesNaoLidas} não lidas
          </Chip>
        )}
      </div>

      {/* Lista de Notificações */}
      <div className="space-y-3">
        {notificacoes.length === 0 ? (
          <Card className="bg-background/50 border border-white/10">
            <CardBody className="p-6 text-center">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-default-500">Nenhuma notificação no momento</p>
            </CardBody>
          </Card>
        ) : (
          notificacoes.map((notificacao) => (
            <Card
              key={notificacao.id}
              className={`bg-background/50 border border-white/10 transition-all duration-200 ${!notificacao.lida ? "ring-2 ring-primary/20" : ""}`}
            >
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    className={`bg-${getCor(notificacao.tipo)}/10 text-${getCor(notificacao.tipo)}`}
                    icon={
                      <span className="text-lg">
                        {getIcone(notificacao.tipo)}
                      </span>
                    }
                    size="sm"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4
                          className={`font-medium ${!notificacao.lida ? "text-foreground" : "text-default-600"}`}
                        >
                          {notificacao.titulo}
                        </h4>
                        <p className="text-sm text-default-500 mt-1">
                          {notificacao.descricao}
                        </p>

                        {notificacao.valor && (
                          <p className="text-sm font-semibold text-primary mt-1">
                            {formatCurrency(notificacao.valor)}
                          </p>
                        )}

                        <p className="text-xs text-default-400 mt-2">
                          {formatTime(notificacao.data)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {!notificacao.lida && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}

                        {notificacao.acao && (
                          <Button
                            color="primary"
                            size="sm"
                            variant="flat"
                            onPress={() => {
                              marcarComoLida(notificacao.id);
                              // Navegar para a URL da ação
                              window.location.href = notificacao.acao!.url;
                            }}
                          >
                            {notificacao.acao.texto}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Footer */}
      {notificacoes.length > 0 && (
        <div className="text-center">
          <Button
            size="sm"
            variant="light"
            onPress={() => {
              setNotificacoes((prev) =>
                prev.map((notif) => ({ ...notif, lida: true })),
              );
              toast.success("Todas as notificações foram marcadas como lidas");
            }}
          >
            Marcar todas como lidas
          </Button>
        </div>
      )}
    </div>
  );
}
