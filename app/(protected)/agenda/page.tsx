"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  MoreVertical,
  Check,
  X,
  HelpCircle,
  AlertCircle,
  Info,
  Filter,
  Search,
  CalendarDays,
  User,
  Building,
  Scale,
  FileText,
  MapPin as LocationIcon,
  XCircle,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  ButtonGroup,
  Chip,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Input,
  Select,
  SelectItem,
  DateRangePicker,
} from "@heroui/react";
import { Calendar as CalendarComponent } from "@heroui/react";
import { today, getLocalTimeZone, startOfWeek, startOfMonth } from "@internationalized/date";
import { useLocale } from "@react-aria/i18n";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { useEventos } from "@/app/hooks/use-eventos";
import { useAllClientes } from "@/app/hooks/use-clientes";
import { useAllProcessos } from "@/app/hooks/use-processos";
import { useAdvogadosDisponiveis } from "@/app/hooks/use-advogados";
import { title, subtitle } from "@/components/primitives";
import { deleteEvento, marcarEventoComoRealizado, getEventoById, confirmarParticipacaoEvento } from "@/app/actions/eventos";
import EventoForm from "@/components/evento-form";
import GoogleCalendarButton from "@/components/google-calendar-button";
import GoogleCalendarStatusCard from "@/components/google-calendar-status";
import { useUserPermissions } from "@/app/hooks/use-user-permissions";
import { DateUtils } from "@/app/lib/date-utils";
import { Evento, EventoConfirmacaoStatus } from "@/app/generated/prisma";

type ViewMode = "calendar" | "list";

// Tipo estendido para incluir confirmações
type EventoComConfirmacoes = Evento & {
  confirmacoes?: Array<{
    id: string;
    participanteEmail: string;
    participanteNome?: string | null;
    status: EventoConfirmacaoStatus;
    confirmadoEm?: Date | null;
    observacoes?: string | null;
  }>;
};

const tiposEvento = {
  REUNIAO: { label: "Reunião", color: "primary" as const },
  AUDIENCIA: { label: "Audiência", color: "warning" as const },
  CONSULTA: { label: "Consulta", color: "success" as const },
  PRAZO: { label: "Prazo", color: "danger" as const },
  LEMBRETE: { label: "Lembrete", color: "secondary" as const },
};

const statusEvento = {
  AGENDADO: { label: "Agendado", color: "default" as const },
  CONFIRMADO: { label: "Confirmado", color: "primary" as const },
  REALIZADO: { label: "Realizado", color: "success" as const },
  CANCELADO: { label: "Cancelado", color: "danger" as const },
};

const statusConfirmacao = {
  PENDENTE: { label: "Pendente", color: "warning" as const, icon: AlertCircle },
  CONFIRMADO: { label: "Confirmado", color: "success" as const, icon: Check },
  RECUSADO: { label: "Recusado", color: "danger" as const, icon: X },
  TALVEZ: { label: "Talvez", color: "secondary" as const, icon: HelpCircle },
};

export default function AgendaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedDate, setSelectedDate] = useState(today(getLocalTimeZone()));
  const [isEventoFormOpen, setIsEventoFormOpen] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);

  // Estados dos filtros
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [filtroCliente, setFiltroCliente] = useState<string>("");
  const [filtroProcesso, setFiltroProcesso] = useState<string>("");
  const [filtroAdvogado, setFiltroAdvogado] = useState<string>("");
  const [filtroLocal, setFiltroLocal] = useState<string>("");
  const [filtroTitulo, setFiltroTitulo] = useState<string>("");
  const [filtroDataRange, setFiltroDataRange] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  const locale = useLocale();
  const { permissions, isCliente, isAdvogado, isSecretaria, isAdmin } = useUserPermissions();
  const session = useSession();
  const userEmail = session?.data?.user?.email;

  // Buscar dados para os filtros
  const { clientes } = useAllClientes();
  const { processos } = useAllProcessos();
  const { advogados } = useAdvogadosDisponiveis();

  // Memoizar as datas para evitar re-criação a cada render
  const datasMemo = useMemo(() => {
    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const fimHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);

    const inicioSemana = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fimSemana = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);

    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

    return {
      inicioHoje,
      fimHoje,
      inicioSemana,
      fimSemana,
      inicioMes,
      fimMes,
    };
  }, []); // Apenas uma vez

  // Filtros principais
  const filtrosPrincipais = useMemo(
    () => ({
      tipo: filtroTipo || undefined,
      status: filtroStatus || undefined,
      clienteId: filtroCliente || undefined,
      processoId: filtroProcesso || undefined,
      advogadoId: filtroAdvogado || undefined,
      local: filtroLocal || undefined,
      titulo: filtroTitulo || undefined,
      dataInicio: filtroDataRange?.start ? new Date(filtroDataRange.start.toString()) : undefined,
      dataFim: filtroDataRange?.end ? new Date(filtroDataRange.end.toString()) : undefined,
    }),
    [filtroTipo, filtroStatus, filtroCliente, filtroProcesso, filtroAdvogado, filtroLocal, filtroTitulo, filtroDataRange]
  );

  // Apenas UMA chamada para buscar todos os eventos
  const { eventos, isLoading, error, mutate } = useEventos(filtrosPrincipais);

  // Calcular estatísticas a partir dos eventos já carregados
  const estatisticas = useMemo(() => {
    if (!eventos) return { hoje: 0, semana: 0, mes: 0, confirmacoes: 0 };

    const agora = new Date();
    const hoje = eventos.filter((evento) => {
      const dataEvento = new Date(evento.dataInicio);

      return dataEvento >= datasMemo.inicioHoje && dataEvento <= datasMemo.fimHoje;
    }).length;

    const semana = eventos.filter((evento) => {
      const dataEvento = new Date(evento.dataInicio);

      return dataEvento >= datasMemo.inicioSemana && dataEvento <= datasMemo.fimSemana;
    }).length;

    const mes = eventos.filter((evento) => {
      const dataEvento = new Date(evento.dataInicio);

      return dataEvento >= datasMemo.inicioMes && dataEvento <= datasMemo.fimMes;
    }).length;

    const confirmacoes = eventos.reduce((total, evento) => total + (evento.confirmacoes?.length || 0), 0);

    return { hoje, semana, mes, confirmacoes };
  }, [eventos, datasMemo]);

  const handleCreateEvento = () => {
    setEventoEditando(null);
    setIsEventoFormOpen(true);
  };

  const handleEditEvento = async (evento: Evento) => {
    try {
      // Buscar o evento completo com todos os relacionamentos
      const result = await getEventoById(evento.id);

      if (result.success && result.data) {
        setEventoEditando(result.data);
        setIsEventoFormOpen(true);
      } else {
        toast.error("Erro ao carregar dados do evento");
      }
    } catch (error) {
      console.error("Erro ao buscar evento:", error);
      toast.error("Erro ao carregar dados do evento");
    }
  };

  const handleDeleteEvento = async (eventoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) {
      return;
    }

    try {
      const result = await deleteEvento(eventoId);

      if (result.success) {
        toast.success("Evento excluído com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao excluir evento");
      }
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      toast.error("Erro interno do servidor");
    }
  };

  const handleMarcarComoRealizado = async (eventoId: string) => {
    try {
      const result = await marcarEventoComoRealizado(eventoId);

      if (result.success) {
        toast.success("Evento marcado como realizado!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao atualizar evento");
      }
    } catch (error) {
      console.error("Erro ao marcar evento como realizado:", error);
      toast.error("Erro interno do servidor");
    }
  };

  const handleEventoFormSuccess = () => {
    mutate();
    setIsEventoFormOpen(false);
    setEventoEditando(null);
  };

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setFiltroTipo("");
    setFiltroStatus("");
    setFiltroCliente("");
    setFiltroProcesso("");
    setFiltroAdvogado("");
    setFiltroLocal("");
    setFiltroTitulo("");
    setFiltroDataRange(null);
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = filtroTipo || filtroStatus || filtroCliente || filtroProcesso || filtroAdvogado || filtroLocal || filtroTitulo || filtroDataRange;

  const handleConfirmarParticipacao = async (eventoId: string, participanteEmail: string, status: EventoConfirmacaoStatus) => {
    try {
      const result = await confirmarParticipacaoEvento(eventoId, participanteEmail, status);

      if (result.success) {
        toast.success("Confirmação atualizada com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao confirmar participação");
      }
    } catch (error) {
      console.error("Erro ao confirmar participação:", error);
      toast.error("Erro interno do servidor");
    }
  };

  const eventosFiltrados = (eventos || []).filter((evento) => {
    const dataEvento = DateUtils.parse(evento.dataInicio as any);
    const dataSelecionada = DateUtils.fromCalendarDate(selectedDate);

    return dataEvento && DateUtils.isSameDay(dataEvento, dataSelecionada);
  });

  const formatarHora = (data: string) => {
    return DateUtils.formatTime(data);
  };

  const formatarData = (data: string) => {
    return DateUtils.formatDate(data);
  };

  const formatarDataSelecionada = (data: any) => {
    return DateUtils.formatCalendarDate(data);
  };

  const renderConfirmacoes = (evento: EventoComConfirmacoes) => {
    if (!evento.confirmacoes || evento.confirmacoes.length === 0) {
      return null;
    }

    // Verificar se o usuário atual é participante do evento
    const userConfirmacao = evento.confirmacoes.find((c) => c.participanteEmail === userEmail);

    return (
      <div className="mt-2">
        <div className="text-xs text-default-500 mb-1">Confirmações:</div>

        {/* Botões de confirmação para o usuário atual se for participante */}
        {userConfirmacao && (
          <div className="mb-2 p-2 bg-default-50 rounded-lg">
            <div className="text-xs text-default-600 mb-2">Sua confirmação:</div>
            <div className="flex gap-1">
              <Button
                className="text-xs"
                color={userConfirmacao.status === "CONFIRMADO" ? "success" : "default"}
                size="sm"
                startContent={<Check className="w-3 h-3" />}
                variant={userConfirmacao.status === "CONFIRMADO" ? "solid" : "flat"}
                onPress={() => handleConfirmarParticipacao(evento.id, userEmail || "", "CONFIRMADO")}
              >
                Confirmar
              </Button>
              <Button
                className="text-xs"
                color={userConfirmacao.status === "RECUSADO" ? "danger" : "default"}
                size="sm"
                startContent={<X className="w-3 h-3" />}
                variant={userConfirmacao.status === "RECUSADO" ? "solid" : "flat"}
                onPress={() => handleConfirmarParticipacao(evento.id, userEmail || "", "RECUSADO")}
              >
                Recusar
              </Button>
              <Button
                className="text-xs"
                color={userConfirmacao.status === "TALVEZ" ? "secondary" : "default"}
                size="sm"
                startContent={<HelpCircle className="w-3 h-3" />}
                variant={userConfirmacao.status === "TALVEZ" ? "solid" : "flat"}
                onPress={() => handleConfirmarParticipacao(evento.id, userEmail || "", "TALVEZ")}
              >
                Talvez
              </Button>
            </div>
          </div>
        )}

        {/* Lista de confirmações */}
        <div className="flex flex-wrap gap-1">
          {evento.confirmacoes.map((confirmacao) => {
            const statusInfo = statusConfirmacao[confirmacao.status as keyof typeof statusConfirmacao];
            const IconComponent = statusInfo?.icon || AlertCircle;

            const tooltipContent = (
              <div className="text-xs">
                <div className="font-semibold">{statusInfo?.label || confirmacao.status}</div>
                {confirmacao.observacoes && <div className="text-default-400 mt-1">{confirmacao.observacoes}</div>}
                {confirmacao.confirmadoEm && <div className="text-default-400 mt-1">Confirmado em: {new Date(confirmacao.confirmadoEm).toLocaleString("pt-BR")}</div>}
              </div>
            );

            return (
              <Tooltip key={confirmacao.id} color={statusInfo?.color || "default"} content={tooltipContent} placement="top">
                <Chip className="cursor-help" color={statusInfo?.color || "default"} size="sm" startContent={<IconComponent className="w-3 h-3" />} variant="flat">
                  {confirmacao.participanteEmail}
                </Chip>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-danger">Erro ao carregar eventos: {error}</p>
            <Button className="mt-4" color="primary" onPress={() => mutate()}>
              Tentar Novamente
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4 sm:p-6 sm:space-y-6 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>Agenda</h1>
          <p className={subtitle({ fullWidth: true })}>Gerencie seus compromissos e eventos</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <ButtonGroup className="w-full sm:w-auto">
            <Button variant={viewMode === "calendar" ? "solid" : "bordered"} onPress={() => setViewMode("calendar")}>
              Calendário
            </Button>
            <Button variant={viewMode === "list" ? "solid" : "bordered"} onPress={() => setViewMode("list")}>
              Lista
            </Button>
          </ButtonGroup>

          <div className="flex gap-2 w-full sm:w-auto">
            {permissions.canCreateEvents && !isCliente && (
              <Button className="flex-1 sm:flex-none" color="primary" startContent={<Plus className="w-4 h-4" />} onPress={handleCreateEvento}>
                Novo Evento
              </Button>
            )}
            <GoogleCalendarButton />
          </div>
        </div>
      </div>

      {/* Legenda de Confirmações */}
      <Card>
        <CardBody className="py-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Legenda de Confirmações</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tooltip color="success" content="Participante confirmou presença no evento" placement="top">
              <Chip className="cursor-help" color="success" size="sm" startContent={<Check className="w-3 h-3" />} variant="flat">
                Confirmado
              </Chip>
            </Tooltip>
            <Tooltip color="danger" content="Participante recusou o convite para o evento" placement="top">
              <Chip className="cursor-help" color="danger" size="sm" startContent={<X className="w-3 h-3" />} variant="flat">
                Recusado
              </Chip>
            </Tooltip>
            <Tooltip color="secondary" content="Participante marcou como 'talvez' - aguardando confirmação" placement="top">
              <Chip className="cursor-help" color="secondary" size="sm" startContent={<HelpCircle className="w-3 h-3" />} variant="flat">
                Talvez
              </Chip>
            </Tooltip>
            <Tooltip color="warning" content="Aguardando confirmação do participante" placement="top">
              <Chip className="cursor-help" color="warning" size="sm" startContent={<AlertCircle className="w-3 h-3" />} variant="flat">
                Pendente
              </Chip>
            </Tooltip>
          </div>
          <p className="text-xs text-default-400 mt-2">Passe o mouse sobre os chips para ver mais detalhes sobre cada confirmação</p>
        </CardBody>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-primary">{estatisticas.hoje}</div>
            <div className="text-sm text-default-500">Eventos Hoje</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-warning">{estatisticas.semana}</div>
            <div className="text-sm text-default-500">Esta Semana</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-success">{estatisticas.mes}</div>
            <div className="text-sm text-default-500">Este Mês</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-secondary">{estatisticas.confirmacoes}</div>
            <div className="text-sm text-default-500">Confirmações</div>
          </CardBody>
        </Card>
      </div>

      {/* Status do Google Calendar */}
      <GoogleCalendarStatusCard />

      {/* Layout Principal */}
      <div className="space-y-6">
        {/* Filtros Avançados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Filtros</h3>
              {hasActiveFilters && (
                <Chip color="primary" size="sm" variant="flat">
                  {[filtroTipo, filtroStatus, filtroCliente, filtroProcesso, filtroAdvogado, filtroLocal, filtroTitulo, filtroDataRange].filter(Boolean).length} ativo(s)
                </Chip>
              )}
            </div>
            <div className="flex gap-2">
              <Button isDisabled={!hasActiveFilters} size="sm" startContent={<RotateCcw className="w-4 h-4" />} variant="light" onPress={clearAllFilters}>
                Limpar
              </Button>
              <Button size="sm" startContent={showFilters ? <XCircle className="w-4 h-4" /> : <Filter className="w-4 h-4" />} variant="light" onPress={() => setShowFilters(!showFilters)}>
                {showFilters ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </CardHeader>

          {showFilters && (
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Filtro por Período */}
                <div className="space-y-2">
                  <label htmlFor="periodo" className="text-sm font-medium flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Período
                  </label>
                  <DateRangePicker className="w-full" label="Selecione o período" size="sm" value={filtroDataRange} variant="bordered" onChange={setFiltroDataRange} />
                </div>

                {/* Filtro por Título */}
                <div className="space-y-2">
                  <label htmlFor="filtro" className="text-sm font-medium flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Título
                  </label>
                  <Input
                    placeholder="Buscar por título..."
                    size="sm"
                    startContent={<Search className="w-4 h-4 text-default-400" />}
                    value={filtroTitulo}
                    variant="bordered"
                    onChange={(e) => setFiltroTitulo(e.target.value)}
                  />
                </div>

                {/* Filtro por Cliente */}
                <div className="space-y-2">
                  <label htmlFor="cliente" className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Cliente
                  </label>
                  <Select
                    placeholder="Selecione um cliente"
                    selectedKeys={(() => {
                      const clientesComEventos = eventos?.filter((e) => e.clienteId).map((e) => e.clienteId) || [];
                      const clienteKeySet = new Set(clientesComEventos);

                      return filtroCliente && clienteKeySet.has(filtroCliente) ? [filtroCliente] : [];
                    })()}
                    size="sm"
                    variant="bordered"
                    onSelectionChange={(keys) => setFiltroCliente((Array.from(keys)[0] as string) || "")}
                  >
                    <SelectItem key="" textValue="Todos os clientes">
                      Todos os clientes
                    </SelectItem>
                    {(() => {
                      // Filtrar apenas clientes que têm eventos
                      const clientesComEventos = eventos?.filter((e) => e.clienteId && e.cliente).map((e) => e.cliente) || [];
                      const clientesUnicos = clientesComEventos.filter((cliente, index, self) => cliente && index === self.findIndex((c) => c && c.id === cliente.id));

                      return clientesUnicos.map(
                        (cliente) =>
                          cliente && (
                            <SelectItem key={cliente.id} textValue={cliente.nome}>
                              {cliente.nome}
                            </SelectItem>
                          )
                      ) as any;
                    })()}
                  </Select>
                </div>

                {/* Filtro por Processo */}
                <div className="space-y-2">
                  <label htmlFor="filtro" className="text-sm font-medium flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Processo
                  </label>
                  <Select
                    placeholder="Selecione um processo"
                    selectedKeys={(() => {
                      const processosComEventos = eventos?.filter((e) => e.processoId).map((e) => e.processoId) || [];
                      const processoKeySet = new Set(processosComEventos);

                      return filtroProcesso && processoKeySet.has(filtroProcesso) ? [filtroProcesso] : [];
                    })()}
                    size="sm"
                    variant="bordered"
                    onSelectionChange={(keys) => setFiltroProcesso((Array.from(keys)[0] as string) || "")}
                  >
                    <SelectItem key="" textValue="Todos os processos">
                      Todos os processos
                    </SelectItem>
                    {(() => {
                      // Filtrar apenas processos que têm eventos
                      const processosComEventos = eventos?.filter((e) => e.processoId && e.processo).map((e) => e.processo) || [];
                      const processosUnicos = processosComEventos.filter((processo, index, self) => processo && index === self.findIndex((p) => p && p.id === processo.id));

                      return processosUnicos.map(
                        (processo) =>
                          processo && (
                            <SelectItem key={processo.id} textValue={`${processo.numero} - ${processo.titulo || "Sem título"}`}>
                              {processo.numero} - {processo.titulo || "Sem título"}
                            </SelectItem>
                          )
                      ) as any;
                    })()}
                  </Select>
                </div>

                {/* Filtro por Advogado - apenas para Admin/SuperAdmin */}
                {!isAdvogado && (
                  <div className="space-y-2">
                    <label htmlFor="filtro" className="text-sm font-medium flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Advogado
                    </label>
                    <Select
                      placeholder="Selecione um advogado"
                      selectedKeys={(() => {
                        const advogadosComEventos = eventos?.filter((e) => e.advogadoResponsavelId).map((e) => e.advogadoResponsavelId) || [];
                        const advogadoKeySet = new Set(advogadosComEventos);

                        return filtroAdvogado && advogadoKeySet.has(filtroAdvogado) ? [filtroAdvogado] : [];
                      })()}
                      size="sm"
                      variant="bordered"
                      onSelectionChange={(keys) => setFiltroAdvogado((Array.from(keys)[0] as string) || "")}
                    >
                      <SelectItem key="" textValue="Todos os advogados">
                        Todos os advogados
                      </SelectItem>
                      {(() => {
                        // Filtrar apenas advogados que têm eventos
                        const advogadosComEventos = eventos?.filter((e) => e.advogadoResponsavelId && e.advogadoResponsavel).map((e) => e.advogadoResponsavel) || [];
                        const advogadosUnicos = advogadosComEventos.filter((advogado, index, self) => advogado && index === self.findIndex((a) => a && a.id === advogado.id));

                        return advogadosUnicos.map(
                          (advogado: any) =>
                            advogado &&
                            (() => {
                              const nomeCompleto = `${advogado.usuario.firstName} ${advogado.usuario.lastName}`;

                              return (
                                <SelectItem key={advogado.id} textValue={nomeCompleto}>
                                  {nomeCompleto}
                                </SelectItem>
                              );
                            })()
                        ) as any;
                      })()}
                    </Select>
                  </div>
                )}

                {/* Filtro por Local */}
                <div className="space-y-2">
                  <label htmlFor="filtro" className="text-sm font-medium flex items-center gap-2">
                    <LocationIcon className="w-4 h-4" />
                    Local
                  </label>
                  <Input
                    placeholder="Buscar por local..."
                    size="sm"
                    startContent={<LocationIcon className="w-4 h-4 text-default-400" />}
                    value={filtroLocal}
                    variant="bordered"
                    onChange={(e) => setFiltroLocal(e.target.value)}
                  />
                </div>

                {/* Filtro por Tipo */}
                <div className="space-y-2">
                  <label htmlFor="filtro" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Tipo
                  </label>
                  <Select
                    placeholder="Selecione um tipo"
                    selectedKeys={filtroTipo ? [filtroTipo] : []}
                    size="sm"
                    variant="bordered"
                    onSelectionChange={(keys) => setFiltroTipo((Array.from(keys)[0] as string) || "")}
                  >
                    <SelectItem key="" textValue="Todos os tipos">
                      Todos os tipos
                    </SelectItem>
                    {
                      Object.entries(tiposEvento).map(([key, tipo]) => (
                        <SelectItem key={key} textValue={tipo.label}>
                          {tipo.label}
                        </SelectItem>
                      )) as any
                    }
                  </Select>
                </div>

                {/* Filtro por Status */}
                <div className="space-y-2">
                  <label htmlFor="filtro" className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Status
                  </label>
                  <Select
                    placeholder="Selecione um status"
                    selectedKeys={filtroStatus ? [filtroStatus] : []}
                    size="sm"
                    variant="bordered"
                    onSelectionChange={(keys) => setFiltroStatus((Array.from(keys)[0] as string) || "")}
                  >
                    <SelectItem key="" textValue="Todos os status">
                      Todos os status
                    </SelectItem>
                    {
                      Object.entries(statusEvento).map(([key, status]) => (
                        <SelectItem key={key} textValue={status.label}>
                          {status.label}
                        </SelectItem>
                      )) as any
                    }
                  </Select>
                </div>
              </div>
            </CardBody>
          )}
        </Card>

        {/* Conteúdo Principal */}
        {viewMode === "calendar" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
            {/* Calendário */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Calendário</h3>
                </CardHeader>
                <CardBody>
                  <CalendarComponent
                    aria-label="Agenda"
                    classNames={{
                      content: "w-full max-w-full overflow-hidden",
                      base: "w-full max-w-full",
                      grid: "w-full max-w-full",
                      cell: "w-full h-16 text-center text-lg font-medium min-w-0",
                    }}
                    focusedValue={selectedDate as any}
                    nextButtonProps={{
                      variant: "bordered",
                      size: "lg",
                    }}
                    prevButtonProps={{
                      variant: "bordered",
                      size: "lg",
                    }}
                    topContent={
                      <ButtonGroup fullWidth className="px-4 pb-4 pt-4 bg-content1 [&>button]:text-default-500 [&>button]:border-default-200/60" radius="full" size="lg" variant="bordered">
                        <Button onPress={() => setSelectedDate(today(getLocalTimeZone()))}>Hoje</Button>
                        <Button onPress={() => setSelectedDate(startOfWeek(today(getLocalTimeZone()).add({ weeks: 1 }), "pt-BR"))}>Próxima semana</Button>
                        <Button onPress={() => setSelectedDate(startOfMonth(today(getLocalTimeZone()).add({ months: 1 })))}>Próximo mês</Button>
                      </ButtonGroup>
                    }
                    value={selectedDate as any}
                    onChange={setSelectedDate as any}
                    onFocusChange={setSelectedDate as any}
                  />
                </CardBody>
              </Card>
            </div>

            {/* Eventos do Dia */}
            <div>
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Eventos - {formatarDataSelecionada(selectedDate)}</h3>
                </CardHeader>
                <CardBody>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="lg" />
                    </div>
                  ) : eventosFiltrados.length === 0 ? (
                    <div className="text-center py-8 text-default-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum evento para este dia</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {eventosFiltrados.map((evento) => (
                        <Card key={evento.id} className="border-l-4 border-l-primary">
                          <CardBody className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{evento.titulo}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Chip color={tiposEvento[evento.tipo as keyof typeof tiposEvento]?.color || "default"} size="sm" variant="flat">
                                    {tiposEvento[evento.tipo as keyof typeof tiposEvento]?.label || evento.tipo}
                                  </Chip>
                                  <Chip color={statusEvento[evento.status as keyof typeof statusEvento]?.color || "default"} size="sm" variant="flat">
                                    {statusEvento[evento.status as keyof typeof statusEvento]?.label || evento.status}
                                  </Chip>
                                </div>
                              </div>

                              <Dropdown>
                                <DropdownTrigger>
                                  <Button isIconOnly size="sm" variant="light">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu>
                                  {permissions.canEditAllEvents && !isCliente ? (
                                    <>
                                      <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={() => handleEditEvento(evento)}>
                                        Editar
                                      </DropdownItem>
                                      {evento.status !== "REALIZADO" && (
                                        <DropdownItem key="realizado" startContent={<CheckCircle className="w-4 h-4" />} onPress={() => handleMarcarComoRealizado(evento.id)}>
                                          Marcar como Realizado
                                        </DropdownItem>
                                      )}
                                      <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />} onPress={() => handleDeleteEvento(evento.id)}>
                                        Excluir
                                      </DropdownItem>
                                    </>
                                  ) : null}
                                </DropdownMenu>
                              </Dropdown>
                            </div>

                            <div className="space-y-1 text-xs text-default-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatarHora(evento.dataInicio.toString())} - {formatarHora(evento.dataFim.toString())}
                              </div>
                              {evento.local && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {evento.local}
                                </div>
                              )}
                              {evento.participantes.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {evento.participantes.length} participante(s)
                                </div>
                              )}
                            </div>

                            {renderConfirmacoes(evento)}
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        ) : (
          /* Lista de Eventos */
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Todos os Eventos</h3>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (eventos || []).length === 0 ? (
                <div className="text-center py-12 text-default-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Nenhum evento encontrado</p>
                  <p className="text-sm">Crie seu primeiro evento para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(eventos || []).map((evento) => (
                    <Card key={evento.id} className="border-l-4 border-l-primary">
                      <CardBody className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-lg">{evento.titulo}</h4>
                              <Chip color={tiposEvento[evento.tipo as keyof typeof tiposEvento]?.color || "default"} size="sm" variant="flat">
                                {tiposEvento[evento.tipo as keyof typeof tiposEvento]?.label || evento.tipo}
                              </Chip>
                              <Chip color={statusEvento[evento.status as keyof typeof statusEvento]?.color || "default"} size="sm" variant="flat">
                                {statusEvento[evento.status as keyof typeof statusEvento]?.label || evento.status}
                              </Chip>
                            </div>

                            {evento.descricao && <p className="text-default-600 mb-3">{evento.descricao}</p>}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-default-400" />
                                <span>{formatarData(evento.dataInicio.toString())}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-default-400" />
                                <span>
                                  {formatarHora(evento.dataInicio.toString())} - {formatarHora(evento.dataFim.toString())}
                                </span>
                              </div>
                              {evento.local && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-default-400" />
                                  <span>{evento.local}</span>
                                </div>
                              )}
                              {evento.participantes.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-default-400" />
                                  <span>{evento.participantes.length} participante(s)</span>
                                </div>
                              )}
                            </div>

                            {(evento as any).cliente && (
                              <div className="mt-3">
                                <span className="text-xs text-default-500">Cliente: {(evento as any).cliente?.nome}</span>
                              </div>
                            )}

                            {renderConfirmacoes(evento)}
                          </div>

                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly size="sm" variant="light">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              {permissions.canEditAllEvents && !isCliente ? (
                                <>
                                  <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={() => handleEditEvento(evento)}>
                                    Editar
                                  </DropdownItem>
                                  {evento.status !== "REALIZADO" && (
                                    <DropdownItem key="realizado" startContent={<CheckCircle className="w-4 h-4" />} onPress={() => handleMarcarComoRealizado(evento.id)}>
                                      Marcar como Realizado
                                    </DropdownItem>
                                  )}
                                  <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />} onPress={() => handleDeleteEvento(evento.id)}>
                                    Excluir
                                  </DropdownItem>
                                </>
                              ) : null}
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      {/* Modal do Formulário */}
      <EventoForm
        evento={eventoEditando || undefined}
        isOpen={isEventoFormOpen}
        onClose={() => {
          setIsEventoFormOpen(false);
          setEventoEditando(null);
        }}
        onSuccess={handleEventoFormSuccess}
      />
    </div>
  );
}
