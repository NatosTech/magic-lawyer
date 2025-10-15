"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/modal";
import { Skeleton } from "@heroui/react";
import { Plus, CheckCircle2, Circle, Clock, XCircle, AlertCircle, Calendar, Target, TrendingUp, AlertTriangle, Kanban } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { DatePicker } from "@heroui/date-picker";
import { parseAbsoluteToLocal } from "@internationalized/date";

import { listTarefas, createTarefa, updateTarefa, deleteTarefa, marcarTarefaConcluida, getDashboardTarefas } from "@/app/actions/tarefas";
import { listCategoriasTarefa } from "@/app/actions/categorias-tarefa";
import { getAllProcessos } from "@/app/actions/processos";
import { searchClientes } from "@/app/actions/clientes";
import { title } from "@/components/primitives";

// Configurar dayjs
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("pt-br");

interface TarefaDto {
  id: string;
  titulo: string;
  descricao: string | null;
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  dataLimite: string | null;
  lembreteEm: string | null;
  completedAt: string | null;
  boardId?: string | null;
  columnId?: string | null;
  categoria?: {
    id: string;
    nome: string;
    corHex: string | null;
  } | null;
  responsavel?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
  processo?: {
    id: string;
    numero: string;
    titulo: string | null;
  } | null;
  cliente?: {
    id: string;
    nome: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  PENDENTE: {
    label: "Pendente",
    color: "default" as const,
    icon: Circle,
  },
  EM_ANDAMENTO: {
    label: "Em Andamento",
    color: "primary" as const,
    icon: Clock,
  },
  CONCLUIDA: {
    label: "Concluída",
    color: "success" as const,
    icon: CheckCircle2,
  },
  CANCELADA: {
    label: "Cancelada",
    color: "danger" as const,
    icon: XCircle,
  },
};

const prioridadeConfig = {
  BAIXA: {
    label: "Baixa",
    color: "default" as const,
  },
  MEDIA: {
    label: "Média",
    color: "primary" as const,
  },
  ALTA: {
    label: "Alta",
    color: "warning" as const,
  },
  CRITICA: {
    label: "Crítica",
    color: "danger" as const,
  },
};

export default function TarefasContent() {
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("");
  const [filtroMinhas, setFiltroMinhas] = useState(false);
  const [filtroAtrasadas, setFiltroAtrasadas] = useState(false);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<TarefaDto | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    prioridade: "MEDIA" as "BAIXA" | "MEDIA" | "ALTA" | "CRITICA",
    dataLimite: null as any,
    lembreteEm: null as any,
    categoriaId: "",
    responsavelId: "",
    processoId: "",
    clienteId: "",
    boardId: "",
    columnId: "",
  });
  const [salvando, setSalvando] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

  const filtrosParams = useMemo(() => {
    const params: any = {};

    if (filtroStatus) params.status = filtroStatus;
    if (filtroPrioridade) params.prioridade = filtroPrioridade;
    if (filtroMinhas) params.minhas = true;
    if (filtroAtrasadas) params.atrasadas = true;

    return params;
  }, [filtroStatus, filtroPrioridade, filtroMinhas, filtroAtrasadas]);

  const { data: tarefasData, error: tarefasError, isLoading: tarefasLoading, mutate: mutateTarefas } = useSWR(["tarefas", filtrosParams], () => listTarefas(filtrosParams));

  const { data: dashboardData, mutate: mutateDashboard } = useSWR("tarefas-dashboard", () => getDashboardTarefas());

  const { data: categoriasData } = useSWR("categorias-tarefa-ativas", () => listCategoriasTarefa({ ativo: true }));

  const { data: processosData } = useSWR("processos-para-tarefa", () => getAllProcessos());

  const { data: clientesData } = useSWR("clientes-para-tarefa", () => searchClientes({}));

  const { data: boardsData } = useSWR("boards-for-select", async () => {
    const { listBoards } = await import("@/app/actions/boards");

    return listBoards({ ativo: true });
  });

  const { data: colunasData } = useSWR(formData.boardId ? ["columns-for-select", formData.boardId] : null, async () => {
    const { listColumns } = await import("@/app/actions/board-columns");

    return listColumns(formData.boardId);
  });

  const tarefas = useMemo(() => (tarefasData?.success ? tarefasData.tarefas : []), [tarefasData]);

  const categorias = useMemo(() => (categoriasData?.success ? categoriasData.categorias : []), [categoriasData]);

  const processos = useMemo(() => (processosData?.success ? processosData.processos : []), [processosData]);

  const clientes = useMemo(() => (clientesData?.success ? clientesData.clientes : []), [clientesData]);

  const dashboard = useMemo(() => (dashboardData?.success ? dashboardData.dashboard : null), [dashboardData]);

  const boards = useMemo(() => (boardsData?.success ? boardsData.boards : []), [boardsData]);

  const colunas = useMemo(() => (colunasData?.success ? colunasData.columns : []), [colunasData]);

  const handleOpenNova = useCallback(() => {
    setTarefaSelecionada(null);
    setFormData({
      titulo: "",
      descricao: "",
      prioridade: "MEDIA",
      dataLimite: null,
      lembreteEm: null,
      categoriaId: "",
      responsavelId: "",
      processoId: "",
      clienteId: "",
      boardId: boards && boards.length > 0 ? boards[0].id : "",
      columnId: "",
    });
    onOpen();
  }, [onOpen, boards]);

  const handleOpenEditar = useCallback(
    (tarefa: TarefaDto) => {
      setTarefaSelecionada(tarefa);
      setFormData({
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || "",
        prioridade: tarefa.prioridade,
        dataLimite: tarefa.dataLimite ? parseAbsoluteToLocal(new Date(tarefa.dataLimite).toISOString()) : null,
        lembreteEm: tarefa.lembreteEm ? parseAbsoluteToLocal(new Date(tarefa.lembreteEm).toISOString()) : null,
        categoriaId: tarefa.categoria?.id || "",
        responsavelId: tarefa.responsavel?.id || "",
        processoId: tarefa.processo?.id || "",
        clienteId: tarefa.cliente?.id || "",
        boardId: tarefa.boardId || "",
        columnId: tarefa.columnId || "",
      });
      onOpen();
    },
    [onOpen]
  );

  const handleSalvar = useCallback(async () => {
    if (!formData.titulo.trim()) {
      toast.error("Título é obrigatório");

      return;
    }

    setSalvando(true);

    try {
      const payload = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        prioridade: formData.prioridade,
        dataLimite: formData.dataLimite ? formData.dataLimite.toDate().toISOString() : null,
        lembreteEm: formData.lembreteEm ? formData.lembreteEm.toDate().toISOString() : null,
        categoriaId: formData.categoriaId || null,
        responsavelId: formData.responsavelId || null,
        processoId: formData.processoId || null,
        clienteId: formData.clienteId || null,
        boardId: formData.boardId || null,
        columnId: formData.columnId || null,
      };

      const result = tarefaSelecionada ? await updateTarefa(tarefaSelecionada.id, payload) : await createTarefa(payload);

      if (result.success) {
        toast.success(tarefaSelecionada ? "Tarefa atualizada com sucesso!" : "Tarefa criada com sucesso!");
        mutateTarefas();
        mutateDashboard();
        onClose();
      } else {
        toast.error(result.error || "Erro ao salvar tarefa");
      }
    } catch (error) {
      toast.error("Erro ao salvar tarefa");
    } finally {
      setSalvando(false);
    }
  }, [formData, tarefaSelecionada, mutateTarefas, mutateDashboard, onClose]);

  const handleMarcarConcluida = useCallback(
    async (tarefa: TarefaDto) => {
      const result = await marcarTarefaConcluida(tarefa.id);

      if (result.success) {
        toast.success("Tarefa marcada como concluída!");
        mutateTarefas();
        mutateDashboard();
      } else {
        toast.error(result.error || "Erro ao marcar tarefa como concluída");
      }
    },
    [mutateTarefas, mutateDashboard]
  );

  const handleExcluir = useCallback(
    async (id: string) => {
      if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;

      const result = await deleteTarefa(id);

      if (result.success) {
        toast.success("Tarefa excluída com sucesso!");
        mutateTarefas();
        mutateDashboard();
        onViewClose();
      } else {
        toast.error(result.error || "Erro ao excluir tarefa");
      }
    },
    [mutateTarefas, mutateDashboard, onViewClose]
  );

  const getDataLimiteInfo = useCallback((dataLimite: string | null) => {
    if (!dataLimite) return null;

    const data = dayjs(dataLimite);
    const hoje = dayjs().startOf("day");
    const amanha = hoje.add(1, "day");

    if (data.isBefore(hoje)) {
      return {
        text: "Atrasada",
        color: "danger" as const,
        icon: AlertCircle,
      };
    }

    if (data.isSame(hoje, "day")) {
      return {
        text: "Hoje",
        color: "warning" as const,
        icon: Calendar,
      };
    }

    if (data.isSame(amanha, "day")) {
      return {
        text: "Amanhã",
        color: "primary" as const,
        icon: Calendar,
      };
    }

    return {
      text: data.format("DD/MM/YYYY"),
      color: "default" as const,
      icon: Calendar,
    };
  }, []);

  if (tarefasError) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-danger">Erro ao carregar tarefas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>Tarefas</h1>
          <p className="mt-2 text-sm text-default-500">Gerencie suas tarefas e atividades</p>
        </div>
        <div className="flex gap-2">
          <Button as="a" color="secondary" href="/tarefas/kanban" startContent={<Kanban className="h-4 w-4" />} variant="flat">
            Ver Kanban
          </Button>
          <Button color="primary" startContent={<Plus className="h-4 w-4" />} onPress={handleOpenNova}>
            Nova Tarefa
          </Button>
        </div>
      </header>

      {/* Dashboard Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardBody className="text-center py-6">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Target className="text-primary" size={24} />
                </div>
              </div>
              <p className="text-sm font-medium text-default-600 mb-1">Minhas Tarefas</p>
              <p className="text-4xl font-bold text-primary">{dashboard.minhasTarefas}</p>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-danger/10 to-danger/5">
            <CardBody className="text-center py-6">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-danger/20 rounded-full">
                  <AlertTriangle className="text-danger" size={24} />
                </div>
              </div>
              <p className="text-sm font-medium text-default-600 mb-1">Atrasadas</p>
              <p className="text-4xl font-bold text-danger">{dashboard.atrasadas}</p>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
            <CardBody className="text-center py-6">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-warning/20 rounded-full">
                  <Calendar className="text-warning" size={24} />
                </div>
              </div>
              <p className="text-sm font-medium text-default-600 mb-1">Hoje</p>
              <p className="text-4xl font-bold text-warning">{dashboard.hoje}</p>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardBody className="text-center py-6">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-success/20 rounded-full">
                  <TrendingUp className="text-success" size={24} />
                </div>
              </div>
              <p className="text-sm font-medium text-default-600 mb-1">Próximos 7 dias</p>
              <p className="text-4xl font-bold text-success">{dashboard.proximosDias}</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="border-2 border-default-100">
        <CardBody>
          <div className="flex flex-wrap gap-3 items-end">
            <Select
              className="max-w-[200px]"
              label="📊 Status"
              placeholder="Todos os status"
              selectedKeys={filtroStatus ? [filtroStatus] : []}
              size="sm"
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key}>{config.label}</SelectItem>
              ))}
            </Select>

            <Select
              className="max-w-[200px]"
              label="🎯 Prioridade"
              placeholder="Todas prioridades"
              selectedKeys={filtroPrioridade ? [filtroPrioridade] : []}
              size="sm"
              onChange={(e) => setFiltroPrioridade(e.target.value)}
            >
              {Object.entries(prioridadeConfig).map(([key, config]) => (
                <SelectItem key={key}>{config.label}</SelectItem>
              ))}
            </Select>

            <div className="flex gap-2">
              <Button color={filtroMinhas ? "primary" : "default"} startContent={<Target size={16} />} variant={filtroMinhas ? "solid" : "bordered"} onPress={() => setFiltroMinhas(!filtroMinhas)}>
                Minhas
              </Button>
              <Button
                color={filtroAtrasadas ? "danger" : "default"}
                startContent={<AlertTriangle size={16} />}
                variant={filtroAtrasadas ? "solid" : "bordered"}
                onPress={() => setFiltroAtrasadas(!filtroAtrasadas)}
              >
                Atrasadas
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Tarefas */}
      <div className="space-y-3">
        {tarefasLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardBody>
                <Skeleton className="h-20 w-full rounded-lg" />
              </CardBody>
            </Card>
          ))
        ) : !tarefas || tarefas.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-default-400">Nenhuma tarefa encontrada</p>
            </CardBody>
          </Card>
        ) : (
          tarefas.map((tarefa: any) => {
            const StatusIcon = statusConfig[tarefa.status as keyof typeof statusConfig].icon;
            const dataInfo = getDataLimiteInfo(tarefa.dataLimite);

            return (
              <Card
                key={tarefa.id}
                aria-label={`Ver detalhes da tarefa ${tarefa.titulo}`}
                className="hover:border-primary/50 transition-colors cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setTarefaSelecionada(tarefa);
                    onViewOpen();
                  }
                }}
              >
                <CardBody
                  onClick={() => {
                    setTarefaSelecionada(tarefa);
                    onViewOpen();
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        className="mt-1 hover:scale-110 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (tarefa.status !== "CONCLUIDA") {
                            handleMarcarConcluida(tarefa);
                          }
                        }}
                      >
                        <StatusIcon className={tarefa.status === "CONCLUIDA" ? "text-success" : "text-default-400 hover:text-success"} size={20} />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold">{tarefa.titulo}</h3>
                          <Chip color={prioridadeConfig[tarefa.prioridade as keyof typeof prioridadeConfig].color} size="sm" variant="flat">
                            {prioridadeConfig[tarefa.prioridade as keyof typeof prioridadeConfig].label}
                          </Chip>
                          {tarefa.categoria && (
                            <Chip
                              size="sm"
                              style={{
                                backgroundColor: tarefa.categoria.corHex + "20",
                                color: tarefa.categoria.corHex || undefined,
                              }}
                            >
                              {tarefa.categoria.nome}
                            </Chip>
                          )}
                        </div>

                        {tarefa.descricao && <p className="text-sm text-default-500 line-clamp-2 mb-2">{tarefa.descricao}</p>}

                        <div className="flex items-center gap-4 text-xs text-default-400">
                          {dataInfo && (
                            <div className="flex items-center gap-1">
                              <dataInfo.icon size={14} />
                              <span className={`text-${dataInfo.color}`}>{dataInfo.text}</span>
                            </div>
                          )}
                          {tarefa.responsavel && (
                            <span>
                              {tarefa.responsavel.firstName} {tarefa.responsavel.lastName}
                            </span>
                          )}
                          {tarefa.processo && <span>Processo: {tarefa.processo.numero}</span>}
                          {tarefa.cliente && <span>Cliente: {tarefa.cliente.nome}</span>}
                        </div>
                      </div>
                    </div>

                    <Chip color={statusConfig[tarefa.status as keyof typeof statusConfig].color} size="sm" variant="flat">
                      {statusConfig[tarefa.status as keyof typeof statusConfig].label}
                    </Chip>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal Criar/Editar */}
      <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={onClose}>
        <ModalContent>
          <ModalHeader>{tarefaSelecionada ? "Editar Tarefa" : "Nova Tarefa"}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input isRequired label="Título" placeholder="Digite o título da tarefa" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} />

              <Textarea
                label="Descrição"
                minRows={3}
                placeholder="Digite uma descrição (opcional)"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  isRequired
                  label="Prioridade"
                  selectedKeys={[formData.prioridade]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prioridade: e.target.value as any,
                    })
                  }
                >
                  {Object.entries(prioridadeConfig).map(([key, config]) => (
                    <SelectItem key={key}>{config.label}</SelectItem>
                  ))}
                </Select>

                <Select
                  label="Categoria"
                  placeholder="Selecione uma categoria"
                  selectedKeys={formData.categoriaId ? [formData.categoriaId] : []}
                  onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                >
                  {(categorias || []).map((cat: any) => (
                    <SelectItem key={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  hideTimeZone
                  showMonthAndYearPickers
                  label="Data Limite"
                  value={formData.dataLimite}
                  variant="bordered"
                  onChange={(value) => setFormData({ ...formData, dataLimite: value })}
                />

                <DatePicker
                  hideTimeZone
                  showMonthAndYearPickers
                  label="Lembrete"
                  value={formData.lembreteEm}
                  variant="bordered"
                  onChange={(value) => setFormData({ ...formData, lembreteEm: value })}
                />
              </div>

              <Select
                label="Processo"
                placeholder="Vincular a um processo (opcional)"
                selectedKeys={formData.processoId ? [formData.processoId] : []}
                onChange={(e) => setFormData({ ...formData, processoId: e.target.value })}
              >
                {(processos || []).map((proc: any) => (
                  <SelectItem key={proc.id}>
                    {proc.numero} - {proc.titulo || "Sem título"}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Cliente"
                placeholder="Vincular a um cliente (opcional)"
                selectedKeys={formData.clienteId ? [formData.clienteId] : []}
                onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
              >
                {(clientes || []).map((cli: any) => (
                  <SelectItem key={cli.id}>{cli.nome}</SelectItem>
                ))}
              </Select>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-semibold mb-3">📊 Quadro Kanban (Opcional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Board"
                    placeholder="Selecionar quadro"
                    selectedKeys={formData.boardId ? [formData.boardId] : []}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        boardId: e.target.value,
                        columnId: "",
                      })
                    }
                  >
                    {(boards || []).length > 0 ? (boards || []).map((b: any) => <SelectItem key={b.id}>{b.nome}</SelectItem>) : null}
                  </Select>

                  <Select
                    isDisabled={!formData.boardId}
                    label="Coluna"
                    placeholder="Selecionar coluna"
                    selectedKeys={formData.columnId ? [formData.columnId] : []}
                    onChange={(e) => setFormData({ ...formData, columnId: e.target.value })}
                  >
                    {(colunas || []).length > 0 ? (colunas || []).map((col: any) => <SelectItem key={col.id}>{col.nome}</SelectItem>) : null}
                  </Select>
                </div>
                <p className="text-xs text-default-400 mt-2">💡 Tarefas com board/coluna aparecem automaticamente no Kanban visual</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={salvando} onPress={handleSalvar}>
              {tarefaSelecionada ? "Atualizar" : "Criar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Visualizar */}
      <Modal isOpen={isViewOpen} size="2xl" onClose={onViewClose}>
        <ModalContent>
          {tarefaSelecionada && (
            <>
              <ModalHeader>{tarefaSelecionada.titulo}</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {tarefaSelecionada.descricao && (
                    <div>
                      <p className="text-sm text-default-500 mb-1">Descrição</p>
                      <p>{tarefaSelecionada.descricao}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500 mb-1">Status</p>
                      <Chip color={statusConfig[tarefaSelecionada.status].color}>{statusConfig[tarefaSelecionada.status].label}</Chip>
                    </div>
                    <div>
                      <p className="text-sm text-default-500 mb-1">Prioridade</p>
                      <Chip color={prioridadeConfig[tarefaSelecionada.prioridade].color}>{prioridadeConfig[tarefaSelecionada.prioridade].label}</Chip>
                    </div>
                  </div>

                  {tarefaSelecionada.dataLimite && (
                    <div>
                      <p className="text-sm text-default-500 mb-1">Data Limite</p>
                      <p>{dayjs(tarefaSelecionada.dataLimite).format("DD/MM/YYYY HH:mm")}</p>
                    </div>
                  )}

                  {tarefaSelecionada.responsavel && (
                    <div>
                      <p className="text-sm text-default-500 mb-1">Responsável</p>
                      <p>
                        {tarefaSelecionada.responsavel.firstName} {tarefaSelecionada.responsavel.lastName}
                      </p>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={() => handleExcluir(tarefaSelecionada.id)}>
                  Excluir
                </Button>
                <Button
                  variant="light"
                  onPress={() => {
                    onViewClose();
                    handleOpenEditar(tarefaSelecionada);
                  }}
                >
                  Editar
                </Button>
                {tarefaSelecionada.status !== "CONCLUIDA" && (
                  <Button
                    color="success"
                    onPress={() => {
                      handleMarcarConcluida(tarefaSelecionada);
                      onViewClose();
                    }}
                  >
                    Marcar como Concluída
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
