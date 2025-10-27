"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Link,
  Unlink,
  RefreshCw,
  Download,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardBody,
  Button,
  Switch,
  Divider,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { toast } from "sonner";

import {
  getGoogleCalendarAuthUrl,
  disconnectGoogleCalendar,
  toggleGoogleCalendarSync,
  syncAllEventosWithGoogle,
  importEventosFromGoogle,
  getGoogleCalendarStatus,
} from "@/app/actions/google-calendar";

interface GoogleCalendarStatus {
  connected: boolean;
  syncEnabled: boolean;
  calendarId?: string | null;
  eventosSincronizados: number;
}

export default function GoogleCalendarIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<GoogleCalendarStatus>({
    connected: false,
    syncEnabled: false,
    eventosSincronizados: 0,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  // Buscar status da integração
  const loadStatus = async () => {
    try {
      const result = await getGoogleCalendarStatus();

      if (result.success && result.data) {
        setStatus(result.data);
      }
    } catch (error) {
      // Erro silencioso - usuário já tem feedback visual
    }
  };

  // Conectar com Google Calendar
  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // Em desenvolvimento, sempre usar localhost:9192 para simplicidade
      // Em produção, detectar o domínio atual (mantém lógica da Vercel)
      const currentDomain =
        process.env.NODE_ENV === "production"
          ? typeof window !== "undefined"
            ? window.location.origin
            : undefined
          : "http://localhost:9192";

      const result = await getGoogleCalendarAuthUrl(currentDomain);

      if (result.success && result.data?.authUrl) {
        // Redirecionar para autorização do Google
        window.location.href = result.data.authUrl;
      } else {
        // Verificar se é erro de configuração
        if (result.error?.includes("Variáveis de ambiente")) {
          toast.error(
            "Google Calendar não configurado. Verifique as variáveis de ambiente.",
            {
              duration: 8000,
              description:
                "Consulte a documentação em docs/GOOGLE_CALENDAR_SETUP.md",
            },
          );
        } else {
          toast.error(result.error || "Erro ao obter URL de autorização");
        }
      }
    } catch (error) {
      toast.error("Erro ao conectar com Google Calendar");
    } finally {
      setIsConnecting(false);
    }
  };

  // Desconectar Google Calendar
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      const result = await disconnectGoogleCalendar();

      if (result.success) {
        toast.success("Google Calendar desconectado com sucesso!");
        await loadStatus();
      } else {
        toast.error(result.error || "Erro ao desconectar");
      }
    } catch (error) {
      toast.error("Erro ao desconectar Google Calendar");
    } finally {
      setIsLoading(false);
    }
  };

  // Alternar sincronização
  const handleToggleSync = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      const result = await toggleGoogleCalendarSync(enabled);

      if (result.success) {
        toast.success(
          `Sincronização ${enabled ? "habilitada" : "desabilitada"} com sucesso!`,
        );
        await loadStatus();
      } else {
        toast.error(result.error || "Erro ao alterar sincronização");
      }
    } catch (error) {
      toast.error("Erro ao alterar sincronização");
    } finally {
      setIsLoading(false);
    }
  };

  // Sincronizar todos os eventos
  const handleSyncAll = async () => {
    try {
      setIsLoading(true);
      const result = await syncAllEventosWithGoogle();

      if (result.success && result.data) {
        toast.success(
          `${result.data.sincronizados} eventos sincronizados com sucesso!`,
        );
        await loadStatus();
      } else {
        toast.error(result.error || "Erro na sincronização");
      }
    } catch (error) {
      toast.error("Erro ao sincronizar eventos");
    } finally {
      setIsLoading(false);
    }
  };

  // Importar eventos do Google Calendar
  const handleImportFromGoogle = async () => {
    try {
      setIsLoading(true);
      const result = await importEventosFromGoogle();

      if (result.success && result.data) {
        toast.success(
          `${result.data.importados} eventos importados com sucesso!`,
        );
        await loadStatus();
      } else {
        toast.error(result.error || "Erro na importação");
      }
    } catch (error) {
      toast.error("Erro ao importar eventos");
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar status ao montar o componente
  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <Card>
      <CardBody className="space-y-4">
        {!status.connected ? (
          // Estado desconectado
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-default-400" />
            <h4 className="text-lg font-medium mb-2">
              Conecte seu Google Calendar
            </h4>
            <p className="text-default-500 mb-4">
              Sincronize seus eventos automaticamente com o Google Calendar para
              ter acesso em todos os dispositivos.
            </p>
            <Button
              color="primary"
              isLoading={isConnecting}
              startContent={<Link className="w-4 h-4" />}
              onPress={handleConnect}
            >
              Conectar com Google Calendar
            </Button>
          </div>
        ) : (
          // Estado conectado
          <div className="space-y-4">
            {/* Status da conexão */}
            <div className="bg-success-50 border border-success-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">
                  Conectado com sucesso
                </span>
              </div>
              <p className="text-xs text-success-600">
                Calendário: {status.calendarId || "Primário"} •{" "}
                {status.eventosSincronizados} eventos sincronizados
              </p>
            </div>

            {/* Controles de sincronização */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">
                    Sincronização Automática
                  </h4>
                  <p className="text-xs text-default-500">
                    Eventos criados/alterados são automaticamente sincronizados
                  </p>
                </div>
                <Switch
                  color="success"
                  isDisabled={isLoading}
                  isSelected={status.syncEnabled}
                  onValueChange={handleToggleSync}
                />
              </div>

              <Divider />

              {/* Ações manuais */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Ações Manuais</h4>

                <div className="grid grid-cols-1 gap-2">
                  <Popover
                    showArrow
                    backdrop="opaque"
                    classNames={{
                      base: ["before:bg-content1"],
                      content: ["py-3 px-4 border border-divider bg-content1"],
                    }}
                    placement="top"
                  >
                    <PopoverTrigger>
                      <Button
                        size="sm"
                        startContent={<RefreshCw className="w-4 h-4" />}
                        variant="bordered"
                      >
                        Sincronizar Todos
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      {(titleProps) => (
                        <div className="px-1 py-2 max-w-xs">
                          <h3
                            className="text-small font-bold text-warning mb-2"
                            {...titleProps}
                          >
                            ⚠️ Sincronizar Todos os Eventos
                          </h3>
                          <div className="text-tiny space-y-2 mb-3">
                            <p className="font-medium">O que acontece:</p>
                            <ul className="space-y-1 text-foreground-600">
                              <li>
                                • Envia todos os eventos para o Google Calendar
                              </li>
                              <li>
                                •{" "}
                                <strong className="text-warning">
                                  Emails serão enviados
                                </strong>{" "}
                                para todos os participantes
                              </li>
                              <li>• Cada participante receberá um convite</li>
                              <li>• Os emails conterão detalhes do evento</li>
                              <li>
                                • Os participantes poderão aceitar/recusar
                              </li>
                            </ul>
                            <p className="text-warning font-medium text-xs">
                              Use com cuidado em eventos com muitos
                              participantes!
                            </p>
                          </div>
                          <Button
                            className="w-full"
                            color="warning"
                            isDisabled={!status.syncEnabled}
                            isLoading={isLoading}
                            size="sm"
                            startContent={<RefreshCw className="w-4 h-4" />}
                            variant="solid"
                            onPress={handleSyncAll}
                          >
                            Confirmar Sincronização
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>

                  <Popover
                    showArrow
                    backdrop="opaque"
                    classNames={{
                      base: ["before:bg-content1"],
                      content: ["py-3 px-4 border border-divider bg-content1"],
                    }}
                    placement="top"
                  >
                    <PopoverTrigger>
                      <Button
                        size="sm"
                        startContent={<Download className="w-4 h-4" />}
                        variant="bordered"
                      >
                        Importar do Google
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      {(titleProps) => (
                        <div className="px-1 py-2 max-w-xs">
                          <h3
                            className="text-small font-bold text-success mb-2"
                            {...titleProps}
                          >
                            📥 Importar Eventos do Google
                          </h3>
                          <div className="text-tiny space-y-2 mb-3">
                            <p className="font-medium">O que acontece:</p>
                            <ul className="space-y-1 text-foreground-600">
                              <li>• Busca eventos do seu Google Calendar</li>
                              <li>
                                • Copia eventos que não existem no sistema
                              </li>
                              <li>
                                •{" "}
                                <strong className="text-success">
                                  NÃO envia emails
                                </strong>{" "}
                                automaticamente
                              </li>
                              <li>
                                • Você pode editar antes de enviar convites
                              </li>
                              <li>• Eventos duplicados são ignorados</li>
                            </ul>
                            <p className="text-success font-medium text-xs">
                              Seguro! Não envia emails automaticamente.
                            </p>
                          </div>
                          <Button
                            className="w-full"
                            color="success"
                            isDisabled={!status.syncEnabled}
                            isLoading={isLoading}
                            size="sm"
                            startContent={<Download className="w-4 h-4" />}
                            variant="solid"
                            onPress={handleImportFromGoogle}
                          >
                            Confirmar Importação
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex justify-center">
                  <Popover
                    showArrow
                    backdrop="opaque"
                    classNames={{
                      base: ["before:bg-content1"],
                      content: ["py-3 px-4 border border-divider bg-content1"],
                    }}
                    placement="top"
                  >
                    <PopoverTrigger>
                      <Button
                        color="danger"
                        size="sm"
                        startContent={<Unlink className="w-4 h-4" />}
                        variant="light"
                      >
                        Desconectar
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      {(titleProps) => (
                        <div className="px-1 py-2 max-w-xs">
                          <h3
                            className="text-small font-bold text-danger mb-2"
                            {...titleProps}
                          >
                            🔌 Desconectar Google Calendar
                          </h3>
                          <div className="text-tiny space-y-2 mb-3">
                            <p className="font-medium">O que acontece:</p>
                            <ul className="space-y-1 text-foreground-600">
                              <li>• Remove a conexão com o Google Calendar</li>
                              <li>• Para a sincronização automática</li>
                              <li>
                                • Eventos já sincronizados permanecem no Google
                              </li>
                              <li>• Você pode reconectar a qualquer momento</li>
                            </ul>
                            <p className="text-danger font-medium text-xs">
                              Ação reversível - você pode reconectar depois.
                            </p>
                          </div>
                          <Button
                            className="w-full"
                            color="danger"
                            isLoading={isLoading}
                            size="sm"
                            startContent={<Unlink className="w-4 h-4" />}
                            variant="solid"
                            onPress={handleDisconnect}
                          >
                            Confirmar Desconexão
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Informações adicionais */}
            <div className="bg-default-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                <div className="text-xs text-default-600">
                  <p className="font-medium mb-1">Como funciona:</p>
                  <ul className="space-y-1 text-xs">
                    <li>
                      • Eventos criados no sistema são automaticamente
                      adicionados ao seu Google Calendar
                    </li>
                    <li>
                      • Alterações em eventos são refletidas no Google Calendar
                      em tempo real
                    </li>
                    <li>
                      • Eventos excluídos são removidos do Google Calendar
                    </li>
                    <li>
                      • Você pode importar eventos do Google Calendar para o
                      sistema
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Link para Google Calendar */}
            <div className="text-center">
              <Button
                size="sm"
                startContent={<ExternalLink className="w-4 h-4" />}
                variant="light"
                onPress={() =>
                  window.open("https://calendar.google.com", "_blank")
                }
              >
                Abrir Google Calendar
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
