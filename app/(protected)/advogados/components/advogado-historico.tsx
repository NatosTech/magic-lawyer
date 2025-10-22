"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Avatar,
  Divider,
  Spinner,
  Tooltip,
} from "@heroui/react";
import {
  History,
  User,
  Calendar,
  Clock,
  Info,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import { getAdvogadoHistorico } from "@/app/actions/advogado-historico";

interface AdvogadoHistoricoProps {
  advogadoId: string;
  advogadoNome: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AdvogadoHistorico({
  advogadoId,
  advogadoNome,
  isOpen,
  onClose,
}: AdvogadoHistoricoProps) {
  const [showDetails, setShowDetails] = useState(false);

  const {
    data: historicoResponse,
    error,
    isLoading,
    mutate,
  } = useSWR(
    isOpen ? `advogado-historico-${advogadoId}` : null,
    () => getAdvogadoHistorico(advogadoId),
    {
      refreshInterval: 30000, // Atualizar a cada 30 segundos
      revalidateOnFocus: true,
    },
  );

  const historico = historicoResponse?.data || [];

  const getAcaoColor = (acao: string) => {
    switch (acao) {
      case "CREATE":
        return "success";
      case "UPDATE":
        return "primary";
      case "DELETE":
        return "danger";
      case "CONVERT_EXTERNAL_TO_INTERNAL":
        return "warning";
      case "UPLOAD_AVATAR":
        return "secondary";
      case "DELETE_AVATAR":
        return "default";
      default:
        return "default";
    }
  };

  const getAcaoText = (acao: string) => {
    switch (acao) {
      case "CREATE":
        return "Criado";
      case "UPDATE":
        return "Atualizado";
      case "DELETE":
        return "Deletado";
      case "CONVERT_EXTERNAL_TO_INTERNAL":
        return "Convertido";
      case "UPLOAD_AVATAR":
        return "Avatar Atualizado";
      case "DELETE_AVATAR":
        return "Avatar Removido";
      default:
        return acao;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleRefresh = () => {
    mutate();
    toast.success("Histórico atualizado");
  };

  if (!isOpen) return null;

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
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        exit={{ scale: 0.9, opacity: 0 }}
        initial={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Histórico de Alterações
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {advogadoNome}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip content="Atualizar histórico">
                <Button
                  isIconOnly
                  isLoading={isLoading}
                  size="sm"
                  variant="light"
                  onPress={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </Tooltip>
              <Button isIconOnly size="sm" variant="light" onPress={onClose}>
                ×
              </Button>
            </div>
          </CardHeader>

          <Divider />

          <CardBody className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
                  <Info className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Erro ao carregar histórico
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {error.message || "Ocorreu um erro inesperado"}
                </p>
                <Button color="primary" variant="flat" onPress={handleRefresh}>
                  Tentar novamente
                </Button>
              </div>
            ) : historico.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                  <History className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Nenhum histórico encontrado
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Este advogado ainda não possui alterações registradas
                </p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                <AnimatePresence>
                  {historico.map((item, index) => (
                    <motion.div
                      key={item.id}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      initial={{ opacity: 0, y: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border border-slate-200 dark:border-slate-700">
                        <CardBody className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar
                              className="flex-shrink-0"
                              name={
                                item.usuario.firstName || item.usuario.email
                              }
                              size="sm"
                              src={item.usuario.avatarUrl || undefined}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Chip
                                  color={getAcaoColor(item.acao)}
                                  size="sm"
                                  variant="flat"
                                >
                                  {getAcaoText(item.acao)}
                                </Chip>
                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(item.createdAt)}
                                </div>
                              </div>

                              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                                {item.detalhes}
                              </p>

                              {item.campo &&
                                (item.valorAnterior || item.valorNovo) && (
                                  <div className="mt-2">
                                    <Button
                                      className="text-xs"
                                      size="sm"
                                      startContent={
                                        showDetails ? (
                                          <EyeOff className="h-3 w-3" />
                                        ) : (
                                          <Eye className="h-3 w-3" />
                                        )
                                      }
                                      variant="light"
                                      onPress={() =>
                                        setShowDetails(!showDetails)
                                      }
                                    >
                                      {showDetails ? "Ocultar" : "Ver"} detalhes
                                    </Button>

                                    {showDetails && (
                                      <motion.div
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                                        exit={{ opacity: 0, height: 0 }}
                                        initial={{ opacity: 0, height: 0 }}
                                      >
                                        <div className="space-y-2 text-xs">
                                          <div>
                                            <span className="font-medium text-slate-600 dark:text-slate-400">
                                              Campo:
                                            </span>{" "}
                                            <span className="text-slate-800 dark:text-slate-200">
                                              {item.campo}
                                            </span>
                                          </div>
                                          {item.valorAnterior && (
                                            <div>
                                              <span className="font-medium text-slate-600 dark:text-slate-400">
                                                Valor anterior:
                                              </span>{" "}
                                              <span className="text-red-600 dark:text-red-400">
                                                {item.valorAnterior}
                                              </span>
                                            </div>
                                          )}
                                          {item.valorNovo && (
                                            <div>
                                              <span className="font-medium text-slate-600 dark:text-slate-400">
                                                Valor novo:
                                              </span>{" "}
                                              <span className="text-green-600 dark:text-green-400">
                                                {item.valorNovo}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>
                                )}

                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                  <User className="h-3 w-3" />
                                  <span>
                                    {item.usuario.firstName}{" "}
                                    {item.usuario.lastName}
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span>{item.usuario.email}</span>
                                </div>
                                {item.ipAddress && (
                                  <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <Clock className="h-3 w-3" />
                                    <span>{item.ipAddress}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  );
}
