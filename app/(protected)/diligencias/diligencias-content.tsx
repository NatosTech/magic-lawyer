"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Chip,
  Select,
  SelectItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tabs,
  Tab,
  Spinner,
} from "@heroui/react";
import {
  Plus,
  FileText,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  PlayCircle,
  Users,
  Building,
  Scale,
  FileCheck,
  UserCheck,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

import {
  listDiligencias,
  createDiligencia,
  updateDiligencia,
} from "@/app/actions/diligencias";
import { listCausas } from "@/app/actions/causas";
import { listRegimesPrazo } from "@/app/actions/regimes-prazo";
import { getClientesComRelacionamentos } from "@/app/actions/clientes";
import { getUsuariosParaSelect } from "@/app/actions/usuarios";
import { title, subtitle } from "@/components/primitives";
import {
  Diligencia,
  DiligenciaStatus,
  Cliente,
  Processo,
  Contrato,
  Causa,
  RegimePrazo,
  Usuario,
} from "@/generated/prisma";

type DiligenciaCompleta = Diligencia & {
  processo?: Processo | null;
  causa?: Causa | null;
  contrato?: Contrato | null;
  responsavel?: Usuario | null;
};

type ClienteCompleto = Cliente & {
  processos: Processo[];
  contratos: Contrato[];
};

interface DiligenciaFormData {
  clienteId: string;
  processoId: string;
  contratoId: string;
  causaId: string;
  regimePrazoId: string;
  titulo: string;
  tipo: string;
  descricao: string;
  responsavelId: string;
  prazoPrevisto: string;
}

const diligenciasFetcher = async () => {
  const result = await listDiligencias();

  if (!result.success) {
    throw new Error(result.error || "Erro ao carregar diligências");
  }

  return result.diligencias as DiligenciaCompleta[];
};

const clientesFetcher = async () => {
  const result = await getClientesComRelacionamentos();

  if (!result.success) {
    throw new Error(result.error || "Erro ao carregar clientes");
  }

  return result.clientes || [];
};

const causasFetcher = async () => {
  const result = await listCausas();

  if (!result.success) {
    throw new Error(result.error || "Erro ao carregar causas");
  }

  return result.causas as Causa[];
};

const regimesFetcher = async () => {
  const result = await listRegimesPrazo();

  if (!result.success) {
    throw new Error(result.error || "Erro ao carregar regimes de prazo");
  }

  return result.regimes as RegimePrazo[];
};

const usuariosFetcher = async () => {
  const result = await getUsuariosParaSelect();

  if (!result.success) {
    throw new Error(result.error || "Erro ao carregar usuários");
  }

  return result.usuarios as Usuario[];
};

const STATUS_OPTIONS = [
  {
    key: "PENDENTE",
    label: "Pendente",
    icon: <Clock size={16} />,
    color: "warning",
  },
  {
    key: "EM_ANDAMENTO",
    label: "Em andamento",
    icon: <PlayCircle size={16} />,
    color: "primary",
  },
  {
    key: "CONCLUIDA",
    label: "Concluída",
    icon: <CheckCircle size={16} />,
    color: "success",
  },
  {
    key: "CANCELADA",
    label: "Cancelada",
    icon: <XCircle size={16} />,
    color: "danger",
  },
];

export function DiligenciasContent() {
  const { data, mutate, isLoading } = useSWR("diligencias", diligenciasFetcher);
  const { data: clientes, isLoading: loadingClientes } = useSWR(
    "diligencias-clientes",
    clientesFetcher,
  );
  const { data: causas, isLoading: loadingCausas } = useSWR(
    "diligencias-causas",
    causasFetcher,
  );
  const { data: regimes, isLoading: loadingRegimes } = useSWR(
    "diligencias-regimes",
    regimesFetcher,
  );
  const { data: usuarios, isLoading: loadingUsuarios } = useSWR(
    "diligencias-usuarios",
    usuariosFetcher,
  );

  const diligencias = useMemo(() => data ?? [], [data]);
  const clientesList = useMemo(() => clientes ?? [], [clientes]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createState, setCreateState] = useState<DiligenciaFormData>({
    clienteId: "",
    processoId: "",
    contratoId: "",
    causaId: "",
    regimePrazoId: "",
    titulo: "",
    tipo: "",
    descricao: "",
    responsavelId: "",
    prazoPrevisto: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const selectedCliente = useMemo(
    () =>
      clientesList.find((cliente) => cliente.id === createState.clienteId) ??
      null,
    [clientesList, createState.clienteId],
  );

  const processosDoCliente =
    (selectedCliente as ClienteCompleto)?.processos ?? [];
  const contratosDoCliente =
    (selectedCliente as ClienteCompleto)?.contratos ?? [];

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "—";
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (Number.isNaN(dateObj.getTime())) return "—";

    return dateObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: DiligenciaStatus) => {
    const option = STATUS_OPTIONS.find((opt) => opt.key === status);

    return option?.icon || <Clock size={16} />;
  };

  const getStatusColor = (status: DiligenciaStatus) => {
    const option = STATUS_OPTIONS.find((opt) => opt.key === status);

    return option?.color || "default";
  };

  const handleCreateDiligencia = useCallback(async () => {
    if (!createState.titulo.trim()) {
      toast.error("Informe o título da diligência");

      return;
    }

    setIsCreating(true);

    try {
      const result = await createDiligencia({
        titulo: createState.titulo.trim(),
        tipo: createState.tipo.trim() || null,
        descricao: createState.descricao.trim() || null,
        processoId: createState.processoId || undefined,
        causaId: createState.causaId || undefined,
        contratoId: createState.contratoId || undefined,
        regimePrazoId: createState.regimePrazoId || undefined,
        responsavelId: createState.responsavelId || undefined,
        prazoPrevisto: createState.prazoPrevisto || undefined,
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao criar diligência");

        return;
      }

      toast.success("Diligência criada com sucesso");
      setIsCreateOpen(false);
      setCreateState({
        clienteId: "",
        processoId: "",
        contratoId: "",
        causaId: "",
        regimePrazoId: "",
        titulo: "",
        tipo: "",
        descricao: "",
        responsavelId: "",
        prazoPrevisto: "",
      });
      await mutate();
    } catch {
      toast.error("Erro ao criar diligência");
    } finally {
      setIsCreating(false);
    }
  }, [createState, mutate]);

  const handleClienteChange = (clienteId: string) => {
    setCreateState((prev) => ({
      ...prev,
      clienteId,
      processoId: "",
      contratoId: "",
    }));
  };

  const handleStatusChange = useCallback(
    async (diligencia: DiligenciaCompleta, status: string) => {
      if (status === diligencia.status) return;

      const result = await updateDiligencia(diligencia.id, {
        status: status as DiligenciaStatus,
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao atualizar diligência");

        return;
      }

      await mutate();
      toast.success("Status atualizado");
    },
    [mutate],
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>Diligências</h1>
          <p className={subtitle({ fullWidth: true })}>
            Acompanhe diligências internas e externas relacionadas aos processos
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={20} />}
          onPress={() => setIsCreateOpen(true)}
        >
          Nova Diligência
        </Button>
      </div>

      {/* Lista de Diligências */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner color="primary" size="lg" />
        </div>
      ) : diligencias.length > 0 ? (
        <div className="grid gap-4">
          {diligencias.map((diligencia: DiligenciaCompleta) => (
            <Card
              key={diligencia.id}
              className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]"
            >
              <CardBody className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Título e Tipo */}
                  <div className="lg:col-span-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-primary-100 to-primary-200 p-3 rounded-xl">
                        <FileText className="text-primary-600" size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-default-800 text-lg">
                          {diligencia.titulo}
                        </h4>
                        {diligencia.tipo && (
                          <p className="text-sm text-primary-600 font-medium">
                            {diligencia.tipo}
                          </p>
                        )}
                        {diligencia.descricao && (
                          <p className="text-sm text-default-500 mt-1 line-clamp-2">
                            {diligencia.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Relacionamentos */}
                  <div className="lg:col-span-4">
                    <div className="flex flex-wrap gap-2">
                      {diligencia.processo && (
                        <Chip
                          color="secondary"
                          size="sm"
                          startContent={<Scale size={14} />}
                          variant="flat"
                        >
                          {diligencia.processo.numero}
                        </Chip>
                      )}
                      {diligencia.causa && (
                        <Chip
                          color="warning"
                          size="sm"
                          startContent={<AlertTriangle size={14} />}
                          variant="flat"
                        >
                          {diligencia.causa.nome}
                        </Chip>
                      )}
                      {diligencia.contrato && (
                        <Chip
                          color="primary"
                          size="sm"
                          startContent={<FileCheck size={14} />}
                          variant="flat"
                        >
                          {diligencia.contrato.titulo}
                        </Chip>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-2">
                    <Select
                      aria-label="Status da diligência"
                      selectedKeys={[diligencia.status]}
                      size="sm"
                      variant="bordered"
                      onSelectionChange={(keys) => {
                        const [value] = Array.from(keys) as string[];

                        handleStatusChange(diligencia, value);
                      }}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.key} startContent={option.icon}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Informações */}
                  <div className="lg:col-span-2">
                    <div className="text-sm space-y-1">
                      {diligencia.prazoPrevisto && (
                        <div className="flex items-center gap-2 text-warning-600">
                          <Calendar size={14} />
                          <span>
                            Prazo: {formatDate(diligencia.prazoPrevisto)}
                          </span>
                        </div>
                      )}
                      {diligencia.responsavel && (
                        <div className="flex items-center gap-2 text-default-600">
                          <User size={14} />
                          <span>
                            {[
                              diligencia.responsavel.firstName,
                              diligencia.responsavel.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ") || diligencia.responsavel.email}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-default-400">
                        <Clock size={14} />
                        <span>{formatDate(diligencia.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-lg">
          <CardBody className="text-center py-16">
            <div className="bg-gradient-to-br from-default-100 to-default-50 rounded-2xl p-12 border border-default-200">
              <FileText className="mx-auto text-default-300 mb-6" size={80} />
              <h3 className="text-xl font-bold text-default-700 mb-2">
                Nenhuma diligência encontrada
              </h3>
              <p className="text-default-500 mb-8 max-w-md mx-auto">
                Comece criando sua primeira diligência para acompanhar tarefas e
                prazos
              </p>
              <Button
                className="font-semibold"
                color="primary"
                size="lg"
                startContent={<Plus size={20} />}
                onPress={() => setIsCreateOpen(true)}
              >
                Criar Primeira Diligência
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <CreateDiligenciaModal
        causas={causas ?? []}
        clientes={clientesList as ClienteCompleto[]}
        contratos={contratosDoCliente}
        isOpen={isCreateOpen}
        isSubmitting={isCreating}
        loadingCausas={loadingCausas}
        loadingClientes={loadingClientes}
        loadingRegimes={loadingRegimes}
        loadingUsuarios={loadingUsuarios}
        processos={processosDoCliente}
        regimes={regimes ?? []}
        setState={setCreateState}
        state={createState}
        usuarios={usuarios ?? []}
        onClienteChange={handleClienteChange}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateDiligencia}
      />
    </div>
  );
}

interface CreateDiligenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  causas: Causa[];
  regimes: RegimePrazo[];
  clientes: ClienteCompleto[];
  processos: Processo[];
  contratos: Contrato[];
  usuarios: Usuario[];
  state: DiligenciaFormData;
  setState: React.Dispatch<React.SetStateAction<DiligenciaFormData>>;
  onSubmit: () => void;
  onClienteChange: (clienteId: string) => void;
  loadingClientes: boolean;
  loadingCausas: boolean;
  loadingRegimes: boolean;
  loadingUsuarios: boolean;
}

function CreateDiligenciaModal({
  isOpen,
  onClose,
  isSubmitting,
  causas,
  regimes,
  clientes,
  processos,
  contratos,
  usuarios,
  state,
  setState,
  onSubmit,
  onClienteChange,
  loadingClientes,
  loadingCausas,
  loadingRegimes,
  loadingUsuarios,
}: CreateDiligenciaModalProps) {
  const selectedCliente = clientes.find((c) => c.id === state.clienteId);

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onOpenChange={(open) => !open && onClose()}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Nova Diligência</h3>
              <p className="text-sm text-default-500">
                Complete as informações da diligência
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="px-0">
          <Tabs
            aria-label="Formulário de diligência"
            classNames={{
              tabList:
                "gap-8 w-full relative rounded-none p-6 pb-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-4 h-12",
              tabContent: "group-data-[selected=true]:text-primary font-medium",
              panel: "pt-6",
            }}
            color="primary"
            variant="underlined"
          >
            <Tab
              key="basico"
              title={
                <div className="flex items-center space-x-3">
                  <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900">
                    <FileText
                      className="text-blue-600 dark:text-blue-400"
                      size={16}
                    />
                  </div>
                  <span>Básico</span>
                </div>
              }
            >
              <div className="px-6 pb-6 space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <FileText size={20} />
                    Informações Básicas
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <Input
                      isRequired
                      label="Título"
                      placeholder="Ex: Protocolo de petição inicial"
                      startContent={
                        <FileText className="text-default-400" size={16} />
                      }
                      value={state.titulo}
                      onValueChange={(value) =>
                        setState((prev) => ({ ...prev, titulo: value }))
                      }
                    />

                    <Input
                      label="Tipo"
                      placeholder="Ex: Audiência, Protocolo, Análise"
                      startContent={
                        <FileCheck className="text-default-400" size={16} />
                      }
                      value={state.tipo}
                      onValueChange={(value) =>
                        setState((prev) => ({ ...prev, tipo: value }))
                      }
                    />

                    <Textarea
                      label="Descrição"
                      placeholder="Descrição detalhada da diligência"
                      rows={3}
                      value={state.descricao}
                      onValueChange={(value) =>
                        setState((prev) => ({ ...prev, descricao: value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </Tab>

            <Tab
              key="relacionamentos"
              title={
                <div className="flex items-center space-x-3">
                  <div className="p-1 rounded-md bg-green-100 dark:bg-green-900">
                    <Users
                      className="text-green-600 dark:text-green-400"
                      size={16}
                    />
                  </div>
                  <span>Relacionamentos</span>
                </div>
              }
            >
              <div className="px-6 pb-6 space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Users size={20} />
                    Cliente e Relacionamentos
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <Select
                      isLoading={loadingClientes}
                      label="Cliente"
                      placeholder="Selecione um cliente"
                      selectedKeys={state.clienteId ? [state.clienteId] : []}
                      startContent={
                        <User className="text-default-400" size={16} />
                      }
                      onSelectionChange={(keys) => {
                        const [value] = Array.from(keys) as string[];

                        onClienteChange(value || "");
                      }}
                    >
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} textValue={cliente.nome}>
                          <div className="flex flex-col">
                            <span className="font-medium">{cliente.nome}</span>
                            <span className="text-sm text-default-500">
                              {cliente.processos.length} processos •{" "}
                              {cliente.contratos.length} contratos
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>

                    {selectedCliente && (
                      <div className="bg-primary/5 rounded-lg border border-primary/20 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-md bg-primary/10">
                            <Building className="text-primary" size={16} />
                          </div>
                          <div>
                            <p className="font-medium">
                              Informações do Cliente
                            </p>
                            <p className="text-sm text-default-500">
                              Dados relacionados ao cliente selecionado
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-primary-600 font-medium">
                              Processos
                            </p>
                            <p className="text-default-800">
                              {selectedCliente.processos.length} cadastrados
                            </p>
                          </div>
                          <div>
                            <p className="text-primary-600 font-medium">
                              Contratos
                            </p>
                            <p className="text-default-800">
                              {selectedCliente.contratos.length} cadastrados
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Select
                      isDisabled={!processos.length}
                      label="Processo"
                      placeholder="Opcional - Selecione um processo"
                      selectedKeys={state.processoId ? [state.processoId] : []}
                      startContent={
                        <Scale className="text-default-400" size={16} />
                      }
                      onSelectionChange={(keys) => {
                        const [value] = Array.from(keys) as string[];

                        setState((prev) => ({
                          ...prev,
                          processoId: value || "",
                        }));
                      }}
                    >
                      {processos.map((processo) => (
                        <SelectItem
                          key={processo.id}
                          textValue={processo.numero}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {processo.numero}
                            </span>
                            {processo.titulo && (
                              <span className="text-sm text-default-500">
                                {processo.titulo}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </Select>

                    <Select
                      isDisabled={!contratos.length}
                      label="Contrato"
                      placeholder="Opcional - Selecione um contrato"
                      selectedKeys={state.contratoId ? [state.contratoId] : []}
                      startContent={
                        <FileCheck className="text-default-400" size={16} />
                      }
                      onSelectionChange={(keys) => {
                        const [value] = Array.from(keys) as string[];

                        setState((prev) => ({
                          ...prev,
                          contratoId: value || "",
                        }));
                      }}
                    >
                      {contratos.map((contrato) => (
                        <SelectItem
                          key={contrato.id}
                          textValue={contrato.titulo}
                        >
                          {contrato.titulo}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </Tab>

            <Tab
              key="detalhes"
              title={
                <div className="flex items-center space-x-3">
                  <div className="p-1 rounded-md bg-orange-100 dark:bg-orange-900">
                    <CalendarDays
                      className="text-orange-600 dark:text-orange-400"
                      size={16}
                    />
                  </div>
                  <span>Detalhes</span>
                </div>
              }
            >
              <div className="px-6 pb-6 space-y-6">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <CalendarDays size={20} />
                    Causa, Prazo e Responsável
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <Select
                      isLoading={loadingCausas}
                      label="Causa"
                      placeholder="Opcional - Selecione uma causa"
                      selectedKeys={state.causaId ? [state.causaId] : []}
                      startContent={
                        <AlertTriangle className="text-default-400" size={16} />
                      }
                      onSelectionChange={(keys) => {
                        const [value] = Array.from(keys) as string[];

                        setState((prev) => ({ ...prev, causaId: value || "" }));
                      }}
                    >
                      {causas.map((causa) => (
                        <SelectItem key={causa.id} textValue={causa.nome}>
                          <div className="flex flex-col">
                            <span className="font-medium">{causa.nome}</span>
                            {causa.codigoCnj && (
                              <span className="text-sm text-default-500">
                                {causa.codigoCnj}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </Select>

                    <Select
                      isLoading={loadingRegimes}
                      label="Regime de Prazo"
                      placeholder="Opcional - Selecione um regime"
                      selectedKeys={
                        state.regimePrazoId ? [state.regimePrazoId] : []
                      }
                      startContent={
                        <Clock className="text-default-400" size={16} />
                      }
                      onSelectionChange={(keys) => {
                        const [value] = Array.from(keys) as string[];

                        setState((prev) => ({
                          ...prev,
                          regimePrazoId: value || "",
                        }));
                      }}
                    >
                      {regimes.map((regime) => (
                        <SelectItem key={regime.id} textValue={regime.nome}>
                          <div className="flex flex-col">
                            <span className="font-medium">{regime.nome}</span>
                            <span className="text-sm text-default-500">
                              {regime.tipo} •{" "}
                              {regime.contarDiasUteis
                                ? "Dias úteis"
                                : "Dias corridos"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>

                    <Input
                      label="Prazo Previsto"
                      startContent={
                        <Calendar className="text-orange-500" size={16} />
                      }
                      type="date"
                      value={state.prazoPrevisto}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          prazoPrevisto: e.target.value,
                        }))
                      }
                    />

                    <Select
                      isLoading={loadingUsuarios}
                      label="Responsável"
                      placeholder="Selecione quem será responsável pela diligência"
                      selectedKeys={
                        state.responsavelId ? [state.responsavelId] : []
                      }
                      startContent={
                        <UserCheck className="text-default-400" size={16} />
                      }
                      onSelectionChange={(keys) => {
                        const [value] = Array.from(keys) as string[];

                        setState((prev) => ({
                          ...prev,
                          responsavelId: value || "",
                        }));
                      }}
                    >
                      {usuarios.map((usuario) => (
                        <SelectItem
                          key={usuario.id}
                          textValue={`${usuario.firstName} ${usuario.lastName}`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {usuario.firstName} {usuario.lastName}
                            </span>
                            <span className="text-sm text-default-500">
                              {usuario.email} • {usuario.role}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
        </ModalBody>

        <ModalFooter className="px-6">
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            color="primary"
            isLoading={isSubmitting}
            startContent={!isSubmitting ? <CheckCircle size={16} /> : undefined}
            onPress={onSubmit}
          >
            {isSubmitting ? "Criando..." : "Criar Diligência"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
