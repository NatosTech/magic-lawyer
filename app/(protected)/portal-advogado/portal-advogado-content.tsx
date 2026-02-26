"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Spinner,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  Building2,
  Calendar,
  FileText,
  Link as LinkIcon,
  Info,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Clock3,
  CircleDashed,
  AlertTriangle,
} from "lucide-react";
import useSWR from "swr";
import { addToast } from "@heroui/toast";

import { UFSelector } from "./uf-selector";

import {
  getStatusSincronizacaoMeusProcessos,
  getTribunaisSincronizacaoPortalAdvogado,
  getTribunaisPorUF,
  getUFsDisponiveis,
  iniciarSincronizacaoMeusProcessos,
  resolverCaptchaSincronizacaoMeusProcessos,
} from "@/app/actions/portal-advogado";
import { REALTIME_POLLING } from "@/app/lib/realtime/polling-policy";
import {
  isPollingGloballyEnabled,
  resolvePollingInterval,
  subscribePollingControl,
  tracePollingAttempt,
} from "@/app/lib/realtime/polling-telemetry";

export function PortalAdvogadoContent() {
  const [ufSelecionada, setUfSelecionada] = useState<string | undefined>();
  const [syncTribunalSigla, setSyncTribunalSigla] = useState("TJSP");
  const [syncOab, setSyncOab] = useState("");
  const [syncClienteNome, setSyncClienteNome] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [syncId, setSyncId] = useState<string | undefined>();
  const [isStartingSync, setIsStartingSync] = useState(false);
  const [isResolvingCaptcha, setIsResolvingCaptcha] = useState(false);
  const [isPollingEnabled, setIsPollingEnabled] = useState(() =>
    isPollingGloballyEnabled(),
  );

  useEffect(() => {
    return subscribePollingControl(setIsPollingEnabled);
  }, []);

  // Buscar tribunais da UF selecionada
  const { data: ufs } = useSWR<string[]>(
    "portal-advogado-ufs",
    getUFsDisponiveis,
  );

  const { data: syncTribunaisResponse, isLoading: isLoadingSyncTribunais } =
    useSWR<
      Awaited<ReturnType<typeof getTribunaisSincronizacaoPortalAdvogado>>,
      Error
    >(
      "portal-advogado-sync-tribunais",
      getTribunaisSincronizacaoPortalAdvogado,
    );

  const {
    data: syncStatusResponse,
    mutate: refreshSyncStatus,
    isLoading: isLoadingSyncStatus,
  } = useSWR<
    Awaited<ReturnType<typeof getStatusSincronizacaoMeusProcessos>>,
    Error
  >(
    `portal-advogado-sync-status:${syncId ?? "latest"}`,
    async (key) => {
      const currentSyncId = key.split(":").pop() || "latest";
      return await tracePollingAttempt(
        {
          hookName: "PortalAdvogadoContent",
          endpoint: `/portal-advogado/sync-status/${currentSyncId}`,
          source: "swr",
          intervalMs: REALTIME_POLLING.PORTAL_SYNC_STATUS_POLLING_MS,
        },
        () =>
          getStatusSincronizacaoMeusProcessos({
            syncId: currentSyncId === "latest" ? undefined : currentSyncId,
          }),
      );
    },
    {
      refreshInterval: (latestData) => {
        const status = latestData?.status?.status;
        const shouldPoll =
          isPollingEnabled &&
          (status === "QUEUED" || status === "RUNNING");

        return shouldPoll
          ? resolvePollingInterval({
              isConnected: false,
            enabled: true,
            fallbackMs: REALTIME_POLLING.PORTAL_SYNC_STATUS_POLLING_MS,
            minimumMs: REALTIME_POLLING.PORTAL_SYNC_STATUS_POLLING_MS,
          })
          : 0;
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const { data: tribunais, isLoading: isLoadingTribunais } = useSWR<
    Awaited<ReturnType<typeof getTribunaisPorUF>>,
    Error
  >(
    ufSelecionada
      ? (["portal-advogado-tribunais", ufSelecionada] as const)
      : null,
    async ([, uf]: readonly [string, string]) => {
      return await getTribunaisPorUF(uf);
    },
  );

  const ufOptions = useMemo(() => ufs ?? [], [ufs]);
  const syncTribunais = useMemo(
    () => (syncTribunaisResponse?.success ? syncTribunaisResponse.tribunais : []),
    [syncTribunaisResponse],
  );
  const syncStatus = syncStatusResponse?.status;

  const isSyncRunning =
    syncStatus?.status === "QUEUED" || syncStatus?.status === "RUNNING";
  const isWaitingCaptcha = syncStatus?.status === "WAITING_CAPTCHA";

  const syncStatusMeta = useMemo(() => {
    if (!syncStatus) return null;

    switch (syncStatus.status) {
      case "QUEUED":
        return {
          color: "default" as const,
          label: "Na fila",
          icon: <CircleDashed className="h-4 w-4" />,
        };
      case "RUNNING":
        return {
          color: "primary" as const,
          label: "Executando",
          icon: <Clock3 className="h-4 w-4" />,
        };
      case "WAITING_CAPTCHA":
        return {
          color: "warning" as const,
          label: "Captcha pendente",
          icon: <ShieldAlert className="h-4 w-4" />,
        };
      case "COMPLETED":
        return {
          color: "success" as const,
          label: "Concluído",
          icon: <CheckCircle2 className="h-4 w-4" />,
        };
      case "FAILED":
      default:
        return {
          color: "danger" as const,
          label: "Falhou",
          icon: <AlertTriangle className="h-4 w-4" />,
        };
    }
  }, [syncStatus]);

  const iniciarSync = async () => {
    setIsStartingSync(true);

    try {
      const response = await iniciarSincronizacaoMeusProcessos({
        tribunalSigla: syncTribunalSigla,
        oab: syncOab || undefined,
        clienteNome: syncClienteNome || undefined,
      });

      if (!response.success) {
        if (response.syncId) {
          setSyncId(response.syncId);
        }
        addToast({
          title: "Não foi possível iniciar",
          description:
            response.error || "Já existe uma sincronização em andamento.",
          color: "warning",
        });
        await refreshSyncStatus();
        return;
      }

      if (response.syncId) {
        setSyncId(response.syncId);
      }

      setCaptchaText("");
      addToast({
        title: "Sincronização iniciada",
        description:
          "Aguarde enquanto buscamos seus processos em background.",
        color: "success",
      });
      await refreshSyncStatus();
    } catch (error) {
      console.error(error);
      addToast({
        title: "Erro interno",
        description: "Falha ao iniciar sincronização.",
        color: "danger",
      });
    } finally {
      setIsStartingSync(false);
    }
  };

  const resolverCaptcha = async () => {
    if (!syncStatus?.syncId) {
      addToast({
        title: "Sincronização ausente",
        description: "Inicie uma sincronização para resolver captcha.",
        color: "warning",
      });
      return;
    }

    if (!captchaText.trim()) {
      addToast({
        title: "Informe o captcha",
        description: "Digite os caracteres da imagem para continuar.",
        color: "warning",
      });
      return;
    }

    setIsResolvingCaptcha(true);

    try {
      const response = await resolverCaptchaSincronizacaoMeusProcessos({
        syncId: syncStatus.syncId,
        captchaText: captchaText.trim(),
      });

      if (!response.success) {
        addToast({
          title: "Falha ao validar captcha",
          description: response.error || "Não foi possível continuar.",
          color: "danger",
        });
        await refreshSyncStatus();
        return;
      }

      setCaptchaText("");
      addToast({
        title: "Captcha enviado",
        description: "Processamento retomado em background.",
        color: "success",
      });
      await refreshSyncStatus();
    } catch (error) {
      console.error(error);
      addToast({
        title: "Erro interno",
        description: "Falha ao enviar captcha.",
        color: "danger",
      });
    } finally {
      setIsResolvingCaptcha(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center gap-2 pb-3">
          <RefreshCw className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Trazer meus processos</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-default-500">
            Sincronize seus processos por OAB em segundo plano. Se o tribunal
            exigir captcha, você valida aqui e a execução continua no worker.
          </p>

          <div className="grid gap-3 md:grid-cols-3">
            <Select
              isDisabled={isStartingSync || isResolvingCaptcha || isSyncRunning}
              label="Tribunal"
              placeholder="Selecione"
              selectedKeys={
                syncTribunalSigla && syncTribunais.some((t) => t.sigla === syncTribunalSigla)
                  ? [syncTribunalSigla]
                  : []
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSyncTribunalSigla(selected || "");
              }}
            >
              {syncTribunais.map((tribunal) => (
                <SelectItem key={tribunal.sigla} textValue={`${tribunal.sigla} · ${tribunal.nome}`}>
                  {tribunal.sigla} · {tribunal.nome}
                </SelectItem>
              ))}
            </Select>

            <Input
              isDisabled={isStartingSync || isResolvingCaptcha || isSyncRunning}
              label="OAB (opcional)"
              placeholder="Ex: 123456SP"
              value={syncOab}
              onChange={(event) => setSyncOab(event.target.value)}
            />

            <Input
              isDisabled={isStartingSync || isResolvingCaptcha || isSyncRunning}
              label="Cliente padrão (opcional)"
              placeholder="Nome do cliente padrão"
              value={syncClienteNome}
              onChange={(event) => setSyncClienteNome(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              color="primary"
              isDisabled={syncTribunais.length === 0 || !syncTribunalSigla}
              isLoading={isStartingSync}
              startContent={<RefreshCw className="h-4 w-4" />}
              onPress={iniciarSync}
            >
              Trazer meus processos
            </Button>
            {(isLoadingSyncStatus || isLoadingSyncTribunais) && (
              <div className="flex items-center gap-2 text-sm text-default-500">
                <Spinner size="sm" />
                Carregando estado da sincronização...
              </div>
            )}
            {syncStatusMeta && (
              <Chip
                color={syncStatusMeta.color}
                startContent={syncStatusMeta.icon}
                variant="flat"
              >
                {syncStatusMeta.label}
              </Chip>
            )}
          </div>

          {syncStatus && (
            <div className="rounded-lg border border-default-200 p-3 space-y-2">
              <p className="text-xs text-default-500">
                Atualizado em{" "}
                {new Date(syncStatus.updatedAt).toLocaleString("pt-BR")}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-md border border-default-200 p-2">
                  <p className="text-[11px] uppercase text-default-500">
                    Capturados
                  </p>
                  <p className="text-lg font-semibold">
                    {syncStatus.syncedCount ?? 0}
                  </p>
                </div>
                <div className="rounded-md border border-default-200 p-2">
                  <p className="text-[11px] uppercase text-default-500">
                    Criados
                  </p>
                  <p className="text-lg font-semibold text-success">
                    {syncStatus.createdCount ?? 0}
                  </p>
                </div>
                <div className="rounded-md border border-default-200 p-2">
                  <p className="text-[11px] uppercase text-default-500">
                    Atualizados
                  </p>
                  <p className="text-lg font-semibold text-primary">
                    {syncStatus.updatedCount ?? 0}
                  </p>
                </div>
              </div>

              {syncStatus.error && (
                <div className="rounded-md border border-danger/30 bg-danger/5 p-2 text-xs text-danger-700">
                  {syncStatus.error}
                </div>
              )}

              {Array.isArray(syncStatus.processosNumeros) &&
                syncStatus.processosNumeros.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {syncStatus.processosNumeros.slice(0, 6).map((numero) => (
                      <Chip key={numero} size="sm" variant="flat">
                        {numero}
                      </Chip>
                    ))}
                  </div>
                )}
            </div>
          )}

          {isWaitingCaptcha && syncStatus?.captchaId && (
            <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 space-y-3">
              <div className="flex items-center gap-2 text-warning-700">
                <ShieldAlert className="h-4 w-4" />
                <p className="text-sm font-semibold">
                  Captcha necessário para continuar
                </p>
              </div>

              {syncStatus.captchaImage ? (
                <img
                  alt="Captcha do tribunal"
                  className="h-16 w-48 rounded-md border border-warning/30 bg-white object-contain p-1"
                  src={syncStatus.captchaImage}
                />
              ) : (
                <p className="text-xs text-warning-700">
                  O tribunal exigiu captcha, mas não retornou imagem.
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  className="sm:flex-1"
                  isDisabled={isResolvingCaptcha}
                  label="Código do captcha"
                  placeholder="Digite os caracteres"
                  value={captchaText}
                  onChange={(event) => setCaptchaText(event.target.value)}
                />
                <Button
                  className="sm:self-end"
                  color="warning"
                  isLoading={isResolvingCaptcha}
                  onPress={resolverCaptcha}
                >
                  Validar captcha
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Seletor de UF */}
      <Card>
        <CardBody>
          <UFSelector
            label="Filtrar por UF"
            ufs={ufOptions}
            value={ufSelecionada}
            onChange={(uf) => setUfSelecionada(uf)}
          />
        </CardBody>
      </Card>

      {/* Links para Tribunais */}
      <Card>
        <CardHeader className="flex items-center gap-2 pb-3">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Links para Tribunais</h2>
        </CardHeader>
        <CardBody>
          {!ufSelecionada ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Info className="w-12 h-12 text-default-300 mx-auto mb-4" />
                <p className="text-default-500">
                  Selecione uma UF para ver os tribunais disponíveis
                </p>
              </div>
            </div>
          ) : isLoadingTribunais ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : tribunais && tribunais.length > 0 ? (
            <div className="space-y-3">
              {tribunais.map((tribunal) => (
                <div
                  key={tribunal.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-default-200 hover:bg-default-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {tribunal.nome}
                      </h3>
                      {tribunal.sigla && (
                        <Chip size="sm" variant="flat">
                          {tribunal.sigla}
                        </Chip>
                      )}
                      {tribunal.esfera && (
                        <Chip color="secondary" size="sm" variant="flat">
                          {tribunal.esfera}
                        </Chip>
                      )}
                    </div>
                    {tribunal.uf && (
                      <p className="text-sm text-default-500">
                        UF: {tribunal.uf}
                      </p>
                    )}
                  </div>
                  {tribunal.siteUrl ? (
                    <Button
                      as="a"
                      endContent={<ExternalLink className="w-4 h-4" />}
                      href={tribunal.siteUrl}
                      rel="noopener noreferrer"
                      size="sm"
                      target="_blank"
                      variant="flat"
                    >
                      Acessar
                    </Button>
                  ) : (
                    <Chip color="default" size="sm" variant="flat">
                      Sem portal
                    </Chip>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Info className="w-12 h-12 text-default-300 mx-auto mb-4" />
                <p className="text-default-500">
                  Nenhum tribunal encontrado para esta UF
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Calendário de Recessos */}
      <Card>
        <CardHeader className="flex items-center gap-2 pb-3">
          <Calendar className="w-5 h-5 text-warning" />
          <h2 className="text-xl font-semibold">Calendário de Recessos</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Info className="w-12 h-12 text-default-300 mx-auto mb-4" />
              <p className="text-default-500">
                Em breve: calendário com recessos forenses por tribunal
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Comunicados e Editais */}
      <Card>
        <CardHeader className="flex items-center gap-2 pb-3">
          <FileText className="w-5 h-5 text-success" />
          <h2 className="text-xl font-semibold">Comunicados e Editais</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Info className="w-12 h-12 text-default-300 mx-auto mb-4" />
              <p className="text-default-500">
                Em breve: comunicados importantes dos tribunais e editais
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Links Úteis */}
      <Card>
        <CardHeader className="flex items-center gap-2 pb-3">
          <LinkIcon className="w-5 h-5 text-secondary" />
          <h2 className="text-xl font-semibold">Links Úteis</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <a
              className="flex items-center gap-3 p-3 rounded-lg border border-default-200 hover:bg-default-50 transition-colors"
              href="https://www.cnj.jus.br/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="text-primary font-medium">
                Conselho Nacional de Justiça (CNJ)
              </span>
            </a>
            <a
              className="flex items-center gap-3 p-3 rounded-lg border border-default-200 hover:bg-default-50 transition-colors"
              href="https://www.oab.org.br/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="text-primary font-medium">OAB Nacional</span>
            </a>
            <a
              className="flex items-center gap-3 p-3 rounded-lg border border-default-200 hover:bg-default-50 transition-colors"
              href="https://pje.jf.jus.br/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="text-primary font-medium">PJe</span>
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
