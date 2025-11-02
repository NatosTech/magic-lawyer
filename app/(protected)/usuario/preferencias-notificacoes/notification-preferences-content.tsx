"use client";

import type {
  NotificationChannel,
  NotificationUrgency,
} from "@/app/lib/notifications/notification-service";

import { useState } from "react";
import useSWR from "swr";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Switch,
  Chip,
  Spinner,
  Select,
  SelectItem,
} from "@heroui/react";
import { SearchIcon, Bell, Mail, Smartphone, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@heroui/input";

import {
  getNotificationPreferences,
  updateNotificationPreference,
} from "@/app/actions/notifications";

// Agrupar eventos por categoria
const EVENT_CATEGORIES: Record<
  string,
  {
    label: string;
    events: string[];
  }
> = {
  processos: {
    label: "Processos",
    events: [
      "processo.created",
      "processo.updated",
      "processo.status_changed",
      "processo.document_uploaded",
    ],
  },
  prazos: {
    label: "Prazos",
    events: [
      "prazo.created",
      "prazo.expiring_7d",
      "prazo.expiring_3d",
      "prazo.expiring_1d",
      "prazo.expiring_2h",
      "prazo.expired",
    ],
  },
  financeiro: {
    label: "Financeiro",
    events: [
      "pagamento.created",
      "pagamento.paid",
      "pagamento.failed",
      "pagamento.overdue",
      "pagamento.estornado",
      "boleto.generated",
      "pix.generated",
    ],
  },
  contratos: {
    label: "Contratos",
    events: [
      "contrato.created",
      "contrato.signed",
      "contrato.expired",
      "contrato.expiring",
      "contrato.cancelled",
    ],
  },
  agenda: {
    label: "Agenda",
    events: [
      "evento.created",
      "evento.updated",
      "evento.cancelled",
      "evento.confirmation_updated",
      "evento.reminder_1d",
      "evento.reminder_1h",
    ],
  },
  documentos: {
    label: "Documentos",
    events: [
      "documento.uploaded",
      "documento.approved",
      "documento.rejected",
      "documento.expired",
    ],
  },
};

const CHANNEL_LABELS: Record<
  NotificationChannel,
  { label: string; icon: any }
> = {
  REALTIME: { label: "In-app", icon: Bell },
  EMAIL: { label: "Email", icon: Mail },
  PUSH: { label: "Push", icon: Smartphone },
};

const URGENCY_LABELS: Record<NotificationUrgency, string> = {
  CRITICAL: "Crítico",
  HIGH: "Alto",
  MEDIUM: "Médio",
  INFO: "Informativo",
};

export function NotificationPreferencesContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingEvents, setLoadingEvents] = useState<Set<string>>(new Set());

  const { data, error, isLoading, mutate } = useSWR(
    "notification-preferences",
    getNotificationPreferences,
    {
      revalidateOnFocus: false,
    },
  );

  const preferences = data?.preferences || [];
  const preferencesMap = new Map(preferences.map((p) => [p.eventType, p]));

  const handleUpdatePreference = async (
    eventType: string,
    updates: {
      enabled?: boolean;
      channels?: NotificationChannel[];
      urgency?: NotificationUrgency;
    },
  ) => {
    setLoadingEvents((prev) => new Set(prev).add(eventType));

    try {
      const result = await updateNotificationPreference({
        eventType,
        ...updates,
      });

      if (result.success) {
        toast.success("Preferência atualizada com sucesso");
        await mutate();
      } else {
        toast.error(result.error || "Erro ao atualizar preferência");
      }
    } catch (error) {
      console.error("[Preferences] Erro:", error);
      toast.error("Erro ao atualizar preferência");
    } finally {
      setLoadingEvents((prev) => {
        const next = new Set(prev);

        next.delete(eventType);

        return next;
      });
    }
  };

  const filteredCategories = Object.entries(EVENT_CATEGORIES).filter(
    ([_, category]) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();

      return (
        category.label.toLowerCase().includes(searchLower) ||
        category.events.some((event) =>
          event.toLowerCase().includes(searchLower),
        )
      );
    },
  );

  if (error) {
    return (
      <Card className="border border-danger/20 bg-danger/5">
        <CardBody>
          <p className="text-danger">
            Erro ao carregar preferências:{" "}
            {error instanceof Error ? error.message : "Erro desconhecido"}
          </p>
          <Button
            className="mt-4"
            color="primary"
            startContent={<RefreshCw size={16} />}
            variant="flat"
            onPress={() => mutate()}
          >
            Tentar novamente
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Busca */}
      <Card>
        <CardBody>
          <Input
            placeholder="Buscar por categoria ou evento..."
            startContent={<SearchIcon className="text-gray-400" size={20} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Categorias */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        filteredCategories.map(([categoryKey, category]) => (
          <Card key={categoryKey}>
            <CardHeader>
              <h2 className="text-xl font-semibold">{category.label}</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {category.events.map((eventType) => {
                  const preference = preferencesMap.get(eventType);
                  const isEnabled = preference?.enabled ?? true;
                  const channels = preference?.channels ?? ["REALTIME"];
                  const urgency = preference?.urgency ?? "MEDIUM";
                  const isLoading = loadingEvents.has(eventType);

                  return (
                    <div
                      key={eventType}
                      className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Switch
                            isDisabled={isLoading}
                            isSelected={isEnabled}
                            size="sm"
                            onValueChange={(enabled) =>
                              handleUpdatePreference(eventType, { enabled })
                            }
                          />
                          <span className="font-medium text-sm">
                            {eventType.replace(/\./g, " ").replace(/_/g, " ")}
                          </span>
                        </div>

                        {isEnabled && (
                          <div className="space-y-2 mt-3 ml-8">
                            {/* Canais */}
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                Canais
                              </label>
                              <div className="flex gap-2 flex-wrap">
                                {Object.entries(CHANNEL_LABELS).map(
                                  ([channelKey, { label, icon: Icon }]) => {
                                    const channel =
                                      channelKey as NotificationChannel;
                                    const isSelected =
                                      channels.includes(channel);

                                    return (
                                      <Chip
                                        key={channelKey}
                                        className="cursor-pointer"
                                        color={
                                          isSelected ? "primary" : "default"
                                        }
                                        size="sm"
                                        startContent={<Icon size={14} />}
                                        variant={isSelected ? "solid" : "flat"}
                                        onClick={() => {
                                          const newChannels = isSelected
                                            ? channels.filter(
                                                (c) => c !== channel,
                                              )
                                            : [...channels, channel];

                                          if (newChannels.length > 0) {
                                            handleUpdatePreference(eventType, {
                                              channels:
                                                newChannels as NotificationChannel[],
                                            });
                                          } else {
                                            toast.error(
                                              "Pelo menos um canal deve estar selecionado",
                                            );
                                          }
                                        }}
                                      >
                                        {label}
                                      </Chip>
                                    );
                                  },
                                )}
                              </div>
                            </div>

                            {/* Urgência */}
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                Urgência
                              </label>
                              <Select
                                className="max-w-xs"
                                selectedKeys={[urgency]}
                                size="sm"
                                onSelectionChange={(keys) => {
                                  const selected = Array.from(
                                    keys,
                                  )[0] as NotificationUrgency;

                                  handleUpdatePreference(eventType, {
                                    urgency: selected,
                                  });
                                }}
                              >
                                {Object.entries(URGENCY_LABELS).map(
                                  ([key, label]) => (
                                    <SelectItem key={key}>{label}</SelectItem>
                                  ),
                                )}
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>

                      {isLoading && <Spinner className="mt-1" size="sm" />}
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        ))
      )}

      {/* Estatísticas */}
      {data && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Resumo</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total de eventos
                </p>
                <p className="text-2xl font-bold">
                  {Object.values(EVENT_CATEGORIES).reduce(
                    (sum, cat) => sum + cat.events.length,
                    0,
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Habilitados
                </p>
                <p className="text-2xl font-bold text-success">
                  {preferences.filter((p) => p.enabled).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Desabilitados
                </p>
                <p className="text-2xl font-bold text-danger">
                  {preferences.filter((p) => !p.enabled).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customizados
                </p>
                <p className="text-2xl font-bold text-primary">
                  {preferences.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
