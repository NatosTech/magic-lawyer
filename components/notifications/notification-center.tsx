"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Chip } from "@heroui/chip";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@heroui/drawer";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { addToast } from "@heroui/toast";
import { useDisclosure } from "@heroui/react";

import {
  useNotifications,
  type NotificationStatus,
} from "@/app/hooks/use-notifications";
import { BellIcon } from "@/components/icons";

const statusCopy: Record<NotificationStatus, string> = {
  NAO_LIDA: "Não lida",
  LIDA: "Lida",
  ARQUIVADA: "Arquivada",
};

const statusColor: Record<
  NotificationStatus,
  "primary" | "success" | "default"
> = {
  NAO_LIDA: "primary",
  LIDA: "success",
  ARQUIVADA: "default",
};

function formatDate(dateIso: string) {
  const date = new Date(dateIso);

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export const NotificationCenter = () => {
  const disclosure = useDisclosure();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    isValidating,
    markAs,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const unreadBadge = useMemo(() => {
    if (unreadCount <= 0) return null;

    return (
      <Badge
        className="border-none bg-danger text-[10px] font-semibold text-white shadow-lg"
        content={unreadCount > 99 ? "99+" : unreadCount}
        placement="top-right"
      >
        <span className="sr-only">Notificações não lidas</span>
      </Badge>
    );
  }, [unreadCount]);

  const handleStatusChange = async (id: string, status: NotificationStatus) => {
    try {
      await markAs(id, status);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Falha ao atualizar notificação.";

      addToast({
        title: "Não foi possível atualizar",
        description: message,
        color: "danger",
      });
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAll();
      addToast({
        title: "Notificações limpas",
        description: "Suas notificações foram removidas.",
        color: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível limpar as notificações.";

      addToast({
        title: "Erro ao limpar",
        description: message,
        color: "danger",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      addToast({
        title: "Tudo lido",
        description: "Todas as notificações foram marcadas como lidas.",
        color: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível marcar todas como lidas.";

      addToast({
        title: "Erro ao marcar",
        description: message,
        color: "danger",
      });
    }
  };

  const hasNotifications = notifications.length > 0;

  return (
    <div className="relative">
      <Tooltip color="primary" content="Notificações" placement="bottom">
        <Button
          isIconOnly
          aria-label="Abrir notificações"
          className="relative rounded-full border border-white/10 bg-white/5 p-0 text-default-500 shadow-lg transition hover:border-primary/40 hover:text-primary"
          radius="full"
          variant="light"
          onPress={disclosure.onOpen}
        >
          {unreadBadge}
          <BellIcon className="h-5 w-5" />
        </Button>
      </Tooltip>

      <Drawer
        isOpen={disclosure.isOpen}
        motionProps={{
          variants: {
            enter: { x: 0 },
            exit: { x: 600 },
          },
        }}
        placement="right"
        size="xl"
        onOpenChange={disclosure.onOpenChange}
      >
        <DrawerContent className="border-l border-white/10 bg-background/70 backdrop-blur-3xl">
          {(onClose) => (
            <>
              <DrawerHeader className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                    Central
                  </span>
                  <h2 className="text-lg font-semibold text-white">
                    Notificações
                  </h2>
                </div>
                <Chip className="text-xs" color="primary" variant="flat">
                  {isValidating ? "Atualizando" : `${unreadCount} não lida(s)`}
                </Chip>
              </DrawerHeader>

              <DrawerBody className="px-0 pb-0">
                {isLoading && !hasNotifications ? (
                  <div className="flex h-48 items-center justify-center">
                    <Spinner color="primary" label="Carregando notificações" />
                  </div>
                ) : null}

                {!isLoading && !hasNotifications ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-default-400">
                    <BellIcon className="h-10 w-10 text-default-200" />
                    <p className="text-sm font-medium text-white">
                      Nenhuma notificação por aqui
                    </p>
                    <p className="text-xs text-default-400">
                      Quando algo importante acontecer, você será avisado.
                    </p>
                  </div>
                ) : null}

                {hasNotifications ? (
                  <ScrollShadow className="max-h-[60vh] px-6 pb-6">
                    <ul className="space-y-4">
                      {notifications.map((item) => {
                        const isUnread = item.status === "NAO_LIDA";

                        return (
                          <li
                            key={item.id}
                            className="group rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg transition hover:border-primary/40 hover:bg-primary/5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-white">
                                    {item.titulo}
                                  </span>
                                  <Chip
                                    className="text-[10px]"
                                    color={statusColor[item.status]}
                                    size="sm"
                                    variant="flat"
                                  >
                                    {statusCopy[item.status]}
                                  </Chip>
                                </div>
                                <p className="text-sm text-default-400">
                                  {item.mensagem}
                                </p>
                              </div>
                              <span className="shrink-0 text-xs text-default-300">
                                {formatDate(item.criadoEm)}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {isUnread ? (
                                <Button
                                  color="primary"
                                  size="sm"
                                  variant="flat"
                                  onPress={() =>
                                    handleStatusChange(item.id, "LIDA")
                                  }
                                >
                                  Marcar como lida
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="light"
                                  onPress={() =>
                                    handleStatusChange(item.id, "NAO_LIDA")
                                  }
                                >
                                  Marcar como não lida
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="light"
                                onPress={() =>
                                  handleStatusChange(item.id, "ARQUIVADA")
                                }
                              >
                                Arquivar
                              </Button>
                              {item.referenciaId && item.referenciaTipo ? (
                                <Button
                                  size="sm"
                                  variant="bordered"
                                  onPress={() => {
                                    router.push(
                                      `/${item.referenciaTipo}/${item.referenciaId}`,
                                    );
                                    onClose();
                                  }}
                                >
                                  Ver detalhes
                                </Button>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </ScrollShadow>
                ) : null}
              </DrawerBody>

              <DrawerFooter className="flex flex-col gap-2 border-t border-white/10 bg-background/60">
                <div className="flex w-full items-center justify-between text-xs text-default-400">
                  <span>Sistema de notificações ativo</span>
                  <span>{notifications.length} registro(s)</span>
                </div>
                <div className="flex w-full flex-wrap gap-3">
                  <Button
                    className="flex-1"
                    isDisabled={unreadCount === 0}
                    variant="bordered"
                    onPress={handleMarkAllAsRead}
                  >
                    Marcar todas como lidas
                  </Button>
                  <Button
                    className="flex-1"
                    color="primary"
                    variant="flat"
                    onPress={handleClearAll}
                  >
                    Limpar notificações
                  </Button>
                  <Button className="flex-1" variant="light" onPress={onClose}>
                    Fechar
                  </Button>
                </div>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};
