"use client";

import { useState } from "react";
import { Calendar, Plus, Clock, MapPin, Users, Edit, Trash2, CheckCircle, MoreVertical } from "lucide-react";
import { Card, CardBody, CardHeader, Button, ButtonGroup, Badge, Chip, Spinner, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Calendar as CalendarComponent } from "@heroui/react";
import { today, getLocalTimeZone, startOfWeek, startOfMonth } from "@internationalized/date";
import { useLocale } from "@react-aria/i18n";
import { useEventos, useEventosHoje, useEventosSemana, useEventosMes } from "@/app/hooks/use-eventos";
import { deleteEvento, marcarEventoComoRealizado } from "@/app/actions/eventos";
import EventoForm from "@/components/evento-form";
import { toast } from "sonner";

type ViewMode = "calendar" | "list";

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

export default function AgendaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedDate, setSelectedDate] = useState(today(getLocalTimeZone()));
  const [isEventoFormOpen, setIsEventoFormOpen] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<any>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  const locale = useLocale();

  // Buscar eventos com filtros
  const { eventos, isLoading, error, mutate } = useEventos({
    tipo: filtroTipo || undefined,
    status: filtroStatus || undefined,
  });

  const { eventos: eventosHoje } = useEventosHoje();
  const { eventos: eventosSemana } = useEventosSemana();
  const { eventos: eventosMes } = useEventosMes();

  const handleCreateEvento = () => {
    setEventoEditando(null);
    setIsEventoFormOpen(true);
  };

  const handleEditEvento = (evento: any) => {
    setEventoEditando(evento);
    setIsEventoFormOpen(true);
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

  const eventosFiltrados = (eventos || []).filter((evento) => {
    const dataEvento = new Date(evento.dataInicio);
    const dataSelecionada = new Date(selectedDate.toString());

    return dataEvento.toDateString() === dataSelecionada.toDateString();
  });

  const formatarHora = (data: string) => {
    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-danger">Erro ao carregar eventos: {error}</p>
            <Button color="primary" className="mt-4" onPress={() => mutate()}>
              Tentar Novamente
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-default-500 mt-1">Gerencie seus compromissos e eventos</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <ButtonGroup>
            <Button variant={viewMode === "calendar" ? "solid" : "bordered"} onPress={() => setViewMode("calendar")}>
              Calendário
            </Button>
            <Button variant={viewMode === "list" ? "solid" : "bordered"} onPress={() => setViewMode("list")}>
              Lista
            </Button>
          </ButtonGroup>

          <Button color="primary" startContent={<Plus className="w-4 h-4" />} onPress={handleCreateEvento}>
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-primary">{eventosHoje?.length || 0}</div>
            <div className="text-sm text-default-500">Eventos Hoje</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-warning">{eventosSemana?.length || 0}</div>
            <div className="text-sm text-default-500">Esta Semana</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-success">{eventosMes?.length || 0}</div>
            <div className="text-sm text-default-500">Este Mês</div>
          </CardBody>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tipo:</span>
              <ButtonGroup size="sm" variant="bordered">
                <Button variant={filtroTipo === "" ? "solid" : "bordered"} onPress={() => setFiltroTipo("")}>
                  Todos
                </Button>
                {Object.entries(tiposEvento).map(([key, tipo]) => (
                  <Button key={key} variant={filtroTipo === key ? "solid" : "bordered"} onPress={() => setFiltroTipo(filtroTipo === key ? "" : key)}>
                    {tipo.label}
                  </Button>
                ))}
              </ButtonGroup>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <ButtonGroup size="sm" variant="bordered">
                <Button variant={filtroStatus === "" ? "solid" : "bordered"} onPress={() => setFiltroStatus("")}>
                  Todos
                </Button>
                {Object.entries(statusEvento).map(([key, status]) => (
                  <Button key={key} variant={filtroStatus === key ? "solid" : "bordered"} onPress={() => setFiltroStatus(filtroStatus === key ? "" : key)}>
                    {status.label}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Conteúdo Principal */}
      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    content: "w-full",
                    base: "w-full",
                    grid: "w-full",
                    cell: "w-full h-16 text-center text-lg font-medium",
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
                <h3 className="text-lg font-semibold">Eventos - {formatarData(selectedDate.toString())}</h3>
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
                                <Chip size="sm" color={tiposEvento[evento.tipo as keyof typeof tiposEvento]?.color || "default"} variant="flat">
                                  {tiposEvento[evento.tipo as keyof typeof tiposEvento]?.label || evento.tipo}
                                </Chip>
                                <Chip size="sm" color={statusEvento[evento.status as keyof typeof statusEvento]?.color || "default"} variant="flat">
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
                                <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={() => handleEditEvento(evento)}>
                                  Editar
                                </DropdownItem>
                                {evento.status !== "REALIZADO" ? (
                                  <DropdownItem key="realizado" startContent={<CheckCircle className="w-4 h-4" />} onPress={() => handleMarcarComoRealizado(evento.id)}>
                                    Marcar como Realizado
                                  </DropdownItem>
                                ) : null}
                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />} onPress={() => handleDeleteEvento(evento.id)}>
                                  Excluir
                                </DropdownItem>
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
                            <Chip size="sm" color={tiposEvento[evento.tipo as keyof typeof tiposEvento]?.color || "default"} variant="flat">
                              {tiposEvento[evento.tipo as keyof typeof tiposEvento]?.label || evento.tipo}
                            </Chip>
                            <Chip size="sm" color={statusEvento[evento.status as keyof typeof statusEvento]?.color || "default"} variant="flat">
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
                              <Badge content="" color="primary" size="sm">
                                <span className="text-xs text-default-500">Cliente: {(evento as any).cliente?.nome}</span>
                              </Badge>
                            </div>
                          )}
                        </div>

                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={() => handleEditEvento(evento)}>
                              Editar
                            </DropdownItem>
                            {evento.status !== "REALIZADO" ? (
                              <DropdownItem key="realizado" startContent={<CheckCircle className="w-4 h-4" />} onPress={() => handleMarcarComoRealizado(evento.id)}>
                                Marcar como Realizado
                              </DropdownItem>
                            ) : null}
                            <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />} onPress={() => handleDeleteEvento(evento.id)}>
                              Excluir
                            </DropdownItem>
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

      {/* Modal do Formulário */}
      <EventoForm
        isOpen={isEventoFormOpen}
        onClose={() => {
          setIsEventoFormOpen(false);
          setEventoEditando(null);
        }}
        evento={eventoEditando}
        onSuccess={handleEventoFormSuccess}
      />
    </div>
  );
}
