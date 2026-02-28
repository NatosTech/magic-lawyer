"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Badge,
  Tooltip,
  Spinner,
} from "@heroui/react";
import {
  Bell,
  Check,
  CheckCheck,
  Eye,
  AlertTriangle,
  Info,
  Clock,
  DollarSign,
  User,
  Scale,
  X,
} from "lucide-react";
import { toast } from "@/lib/toast";

import {
  useNotificacoesAdvogado,
  useEstatisticasNotificacoes,
} from "@/app/hooks/use-advogados-notificacoes";
import { DateUtils } from "@/app/lib/date-utils";

interface AdvogadoNotificacoesProps {
  advogadoId: string;
  advogadoNome: string;
  isOpen: boolean;
  onClose: () => void;
}

const getTipoIcon = (tipo: string) => {
  switch (tipo) {
    case "PROCESSO_CRIADO":
    case "PROCESSO_ATUALIZADO":
      return <Scale className="h-4 w-4" />;
    case "PRAZO_VENCENDO":
      return <Clock className="h-4 w-4" />;
    case "COMISSAO_PENDENTE":
      return <DollarSign className="h-4 w-4" />;
    case "NOVO_CLIENTE":
      return <User className="h-4 w-4" />;
    case "SISTEMA":
      return <Info className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case "PROCESSO_CRIADO":
    case "PROCESSO_ATUALIZADO":
      return "primary";
    case "PRAZO_VENCENDO":
      return "warning";
    case "COMISSAO_PENDENTE":
      return "success";
    case "NOVO_CLIENTE":
      return "secondary";
    case "SISTEMA":
      return "default";
    default:
      return "default";
  }
};

const getPrioridadeColor = (prioridade: string) => {
  switch (prioridade) {
    case "URGENTE":
      return "danger";
    case "ALTA":
      return "warning";
    case "MEDIA":
      return "primary";
    case "BAIXA":
      return "default";
    default:
      return "default";
  }
};

const getTipoText = (tipo: string) => {
  switch (tipo) {
    case "PROCESSO_CRIADO":
      return "Processo Criado";
    case "PROCESSO_ATUALIZADO":
      return "Processo Atualizado";
    case "PRAZO_VENCENDO":
      return "Prazo Vencendo";
    case "COMISSAO_PENDENTE":
      return "Comissão Pendente";
    case "NOVO_CLIENTE":
      return "Novo Cliente";
    case "SISTEMA":
      return "Sistema";
    default:
      return tipo;
  }
};

export function AdvogadoNotificacoes({
  advogadoId,
  advogadoNome,
  isOpen,
  onClose,
}: AdvogadoNotificacoesProps) {
  const [showAll, setShowAll] = useState(false);

  const {
    notificacoes,
    isLoading,
    isError,
    error,
    marcarComoLida,
    marcarTodasComoLidas,
  } = useNotificacoesAdvogado(advogadoId, {
    enabled: isOpen,
    refreshInterval: 0,
  });

  const { estatisticas, isLoading: isLoadingStats } =
    useEstatisticasNotificacoes(advogadoId, {
      enabled: isOpen,
      refreshInterval: 0,
    });

  const handleMarcarComoLida = async (notificacaoId: string) => {
    const result = await marcarComoLida(notificacaoId);

    if (result.success) {
      toast.success("Notificação marcada como lida");
    } else {
      toast.error("Erro ao marcar notificação como lida");
    }
  };

  const handleMarcarTodasComoLidas = async () => {
    const result = await marcarTodasComoLidas();

    if (result.success) {
      toast.success("Todas as notificações foram marcadas como lidas");
    } else {
      toast.error("Erro ao marcar todas as notificações como lidas");
    }
  };

  if (!isOpen) return null;

  const notificacoesParaExibir = showAll
    ? notificacoes || []
    : notificacoes?.slice(0, 5) || [];
  const temMaisNotificacoes = (notificacoes?.length || 0) > 5;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl max-h-[90vh]"
        exit={{ scale: 0.9, opacity: 0 }}
        initial={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600 dark:text-blue-300">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Notificações
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {advogadoNome}
                </p>
              </div>
              {estatisticas && estatisticas.naoLidas > 0 && (
                <Badge color="danger" content={estatisticas.naoLidas} size="sm">
                  <div className="p-1" />
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {estatisticas && estatisticas.naoLidas > 0 && (
                <Tooltip content="Marcar todas como lidas">
                  <Button
                    isIconOnly
                    className="text-green-600 dark:text-green-400"
                    size="sm"
                    variant="light"
                    onPress={handleMarcarTodasComoLidas}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                </Tooltip>
              )}
              <Button isIconOnly size="sm" variant="light" onPress={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardBody className="p-6 flex-1 overflow-hidden">
            {isLoading || isLoadingStats ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                <Spinner size="lg" />
                <p className="mt-4 text-lg">Carregando notificações...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Erro ao carregar notificações
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {error?.message || "Ocorreu um erro inesperado"}
                </p>
              </div>
            ) : !notificacoes || notificacoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                  <Bell className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Nenhuma notificação
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Este advogado não possui notificações
                </p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                <AnimatePresence>
                  {notificacoesParaExibir.map((notificacao, index) => (
                    <motion.div
                      key={notificacao.id}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      initial={{ opacity: 0, y: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={`border ${notificacao.lida ? "border-slate-200 dark:border-slate-700" : "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"}`}
                      >
                        <CardBody className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-full ${notificacao.lida ? "bg-slate-200 dark:bg-slate-700" : "bg-blue-100 dark:bg-blue-900"}`}
                            >
                              {getTipoIcon(notificacao.tipo)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Chip
                                  color={getTipoColor(notificacao.tipo) as any}
                                  size="sm"
                                  variant="flat"
                                >
                                  {getTipoText(notificacao.tipo)}
                                </Chip>
                                <Chip
                                  color={
                                    getPrioridadeColor(
                                      notificacao.prioridade,
                                    ) as any
                                  }
                                  size="sm"
                                  variant="dot"
                                >
                                  {notificacao.prioridade}
                                </Chip>
                                {!notificacao.lida && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                              </div>

                              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                                {notificacao.titulo}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                {notificacao.mensagem}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {DateUtils.formatRelative(
                                      notificacao.dataCriacao,
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {notificacao.acaoUrl &&
                                    notificacao.acaoTexto && (
                                      <Button
                                        className="text-xs"
                                        color="primary"
                                        size="sm"
                                        startContent={
                                          <Eye className="h-3 w-3" />
                                        }
                                        variant="light"
                                      >
                                        {notificacao.acaoTexto}
                                      </Button>
                                    )}
                                  {!notificacao.lida && (
                                    <Tooltip content="Marcar como lida">
                                      <Button
                                        isIconOnly
                                        className="text-green-600 dark:text-green-400"
                                        size="sm"
                                        variant="light"
                                        onPress={() =>
                                          handleMarcarComoLida(notificacao.id)
                                        }
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {temMaisNotificacoes && (
                  <div className="text-center pt-4">
                    <Button
                      className="text-sm"
                      color="primary"
                      variant="light"
                      onPress={() => setShowAll(!showAll)}
                    >
                      {showAll
                        ? "Mostrar menos"
                        : `Ver mais (${notificacoes.length - 5} restantes)`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  );
}
