"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Chip,
  Tooltip,
  Skeleton,
} from "@heroui/react";
import { toast } from "sonner";
import {
  Clock,
  FileText,
  Calendar,
  Plus,
  Search,
  Filter,
  X,
  Pencil,
  Trash2,
  AlertCircle,
  Activity,
  Bell,
  Paperclip,
} from "lucide-react";

import {
  listAndamentos,
  createAndamento,
  updateAndamento,
  deleteAndamento,
  getDashboardAndamentos,
  getTiposMovimentacao,
  type AndamentoFilters,
  type AndamentoCreateInput,
} from "@/app/actions/andamentos";
import { getAllProcessos } from "@/app/actions/processos";
import { MovimentacaoTipo } from "@/app/generated/prisma";
import { title, subtitle } from "@/components/primitives";

// ============================================
// TIPOS
// ============================================

interface Andamento {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: MovimentacaoTipo | null;
  dataMovimentacao: Date | string;
  prazo: Date | string | null;
  processo: {
    id: string;
    numero: string;
    titulo: string | null;
  };
  criadoPor: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  documentos: Array<{
    id: string;
    nome: string;
    tipo: string | null;
    url: string;
  }>;
  prazosRelacionados: Array<{
    id: string;
    titulo: string;
    dataVencimento: Date | string;
    status: string;
  }>;
  createdAt: Date | string;
}

interface DashboardData {
  total: number;
  porTipo: Array<{
    tipo: string | null;
    _count: number;
  }>;
  ultimosAndamentos: Andamento[];
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AndamentosPage() {
  // Estado dos filtros
  const [filters, setFilters] = useState<AndamentoFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Estado do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [selectedAndamento, setSelectedAndamento] = useState<Andamento | null>(
    null,
  );

  // SWR - Fetch data
  const {
    data: andamentosData,
    mutate: mutateAndamentos,
    isLoading: loadingAndamentos,
  } = useSWR(["andamentos", filters], () => listAndamentos(filters));

  const { data: dashboardData, isLoading: loadingDashboard } = useSWR(
    "dashboard-andamentos",
    getDashboardAndamentos,
  );

  const { data: processosData } = useSWR("processos-list", getAllProcessos);

  const { data: tiposData } = useSWR(
    "tipos-movimentacao",
    getTiposMovimentacao,
  );

  const andamentos = (andamentosData?.data || []) as Andamento[];
  const dashboard = dashboardData?.data as DashboardData | undefined;
  const processos = processosData?.processos || [];
  const tipos = tiposData?.data || [];

  // Handlers de filtro
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2 || value.length === 0) {
      setFilters({ ...filters, searchTerm: value || undefined });
    }
  };

  const handleFilterChange = (key: keyof AndamentoFilters, value: any) => {
    setFilters({ ...filters, [key]: value || undefined });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setShowFilters(false);
  };

  // Handlers do modal
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedAndamento(null);
    setModalOpen(true);
  };

  const openEditModal = (andamento: Andamento) => {
    setModalMode("edit");
    setSelectedAndamento(andamento);
    setModalOpen(true);
  };

  const openViewModal = (andamento: Andamento) => {
    setModalMode("view");
    setSelectedAndamento(andamento);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAndamento(null);
  };

  // Handler de exclusão
  const handleDelete = async (andamentoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este andamento?")) return;

    const result = await deleteAndamento(andamentoId);

    if (result.success) {
      toast.success("Andamento excluído com sucesso!");
      mutateAndamentos();
    } else {
      toast.error(result.error || "Erro ao excluir andamento");
    }
  };

  // Helpers
  const getTipoColor = (tipo: MovimentacaoTipo | null) => {
    switch (tipo) {
      case "ANDAMENTO":
        return "primary";
      case "PRAZO":
        return "warning";
      case "INTIMACAO":
        return "danger";
      case "AUDIENCIA":
        return "secondary";
      case "ANEXO":
        return "default";
      default:
        return "default";
    }
  };

  const getTipoIcon = (tipo: MovimentacaoTipo | null) => {
    switch (tipo) {
      case "ANDAMENTO":
        return <Activity size={16} />;
      case "PRAZO":
        return <Clock size={16} />;
      case "INTIMACAO":
        return <Bell size={16} />;
      case "AUDIENCIA":
        return <Calendar size={16} />;
      case "ANEXO":
        return <Paperclip size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>
            Andamentos Processuais
          </h1>
          <p className={subtitle({ fullWidth: true })}>
            Timeline completa de movimentações processuais
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={20} />}
          onPress={openCreateModal}
        >
          Novo Andamento
        </Button>
      </div>

      {/* Dashboard Cards */}
      {loadingDashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Andamentos
                </p>
                <p className="text-2xl font-bold">{dashboard.total}</p>
              </div>
              <Activity className="text-primary" size={32} />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Com Prazo
                </p>
                <p className="text-2xl font-bold">
                  {dashboard.porTipo.find((t) => t.tipo === "PRAZO")?._count ||
                    0}
                </p>
              </div>
              <Clock className="text-warning" size={32} />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Intimações
                </p>
                <p className="text-2xl font-bold">
                  {dashboard.porTipo.find((t) => t.tipo === "INTIMACAO")
                    ?._count || 0}
                </p>
              </div>
              <Bell className="text-danger" size={32} />
            </CardBody>
          </Card>
        </div>
      ) : null}

      {/* Filtros */}
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex gap-2 w-full">
            <Input
              className="flex-1"
              placeholder="Buscar por título ou descrição..."
              startContent={<Search size={18} />}
              value={searchTerm}
              onValueChange={handleSearch}
            />
            <Button
              color={showFilters ? "primary" : "default"}
              startContent={<Filter size={18} />}
              variant={showFilters ? "solid" : "flat"}
              onPress={() => setShowFilters(!showFilters)}
            >
              Filtros
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full pt-3 border-t">
              <Select
                label="Processo"
                placeholder="Todos os processos"
                selectedKeys={filters.processoId ? [filters.processoId] : []}
                onChange={(e) =>
                  handleFilterChange("processoId", e.target.value)
                }
              >
                {processos.map((proc: any) => (
                  <SelectItem key={proc.id}>
                    {proc.numero} {proc.titulo ? `- ${proc.titulo}` : ""}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Tipo"
                placeholder="Todos os tipos"
                selectedKeys={filters.tipo ? [filters.tipo] : []}
                onChange={(e) => handleFilterChange("tipo", e.target.value)}
              >
                {tipos.map((tipo) => (
                  <SelectItem key={tipo}>{tipo}</SelectItem>
                ))}
              </Select>

              <Button
                color="danger"
                startContent={<X size={18} />}
                variant="flat"
                onPress={clearFilters}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Timeline de Andamentos */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Timeline</h2>
        </CardHeader>
        <CardBody>
          {loadingAndamentos ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : andamentos.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhum andamento encontrado
              </p>
            </div>
          ) : (
            <div className="relative space-y-6">
              {/* Linha vertical da timeline */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700" />

              {andamentos.map((andamento) => (
                <div key={andamento.id} className="relative flex gap-6">
                  {/* Ícone da timeline */}
                  <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-4 border-primary flex items-center justify-center">
                    {getTipoIcon(andamento.tipo)}
                  </div>

                  {/* Card do andamento */}
                  <Card
                    isPressable
                    className="flex-1 hover:shadow-lg transition-shadow cursor-pointer"
                    onPress={() => openViewModal(andamento)}
                  >
                    <CardBody>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {andamento.titulo}
                            </h3>
                            {andamento.tipo && (
                              <Chip
                                color={getTipoColor(andamento.tipo)}
                                size="sm"
                                variant="flat"
                              >
                                {andamento.tipo}
                              </Chip>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Processo: {andamento.processo.numero}
                            {andamento.processo.titulo &&
                              ` - ${andamento.processo.titulo}`}
                          </p>

                          {andamento.descricao && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                              {andamento.descricao}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDateTime(andamento.dataMovimentacao)}
                            </span>

                            {andamento.prazo && (
                              <span className="flex items-center gap-1 text-warning">
                                <Clock size={14} />
                                Prazo: {formatDate(andamento.prazo)}
                              </span>
                            )}

                            {andamento.documentos.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Paperclip size={14} />
                                {andamento.documentos.length} documento(s)
                              </span>
                            )}

                            {andamento.prazosRelacionados.length > 0 && (
                              <span className="flex items-center gap-1">
                                <AlertCircle size={14} />
                                {andamento.prazosRelacionados.length} prazo(s)
                              </span>
                            )}

                            {andamento.criadoPor && (
                              <span>
                                Por: {andamento.criadoPor.firstName}{" "}
                                {andamento.criadoPor.lastName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Tooltip content="Editar">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => openEditModal(andamento)}
                            >
                              <Pencil size={16} />
                            </Button>
                          </Tooltip>

                          <Tooltip content="Excluir">
                            <Button
                              isIconOnly
                              color="danger"
                              size="sm"
                              variant="light"
                              onPress={() => handleDelete(andamento.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Criar/Editar/Visualizar */}
      <AndamentoModal
        andamento={selectedAndamento}
        isOpen={modalOpen}
        mode={modalMode}
        processos={processos}
        tipos={tipos}
        onClose={closeModal}
        onSuccess={mutateAndamentos}
      />
    </div>
  );
}

// ============================================
// MODAL DE ANDAMENTO
// ============================================

interface AndamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  andamento: Andamento | null;
  processos: any[];
  tipos: MovimentacaoTipo[];
  onSuccess: () => void;
}

function AndamentoModal({
  isOpen,
  onClose,
  mode,
  andamento,
  processos,
  tipos,
  onSuccess,
}: AndamentoModalProps) {
  const isReadOnly = mode === "view";

  const [formData, setFormData] = useState<any>({
    processoId: "",
    titulo: "",
    descricao: "",
    tipo: "",
    dataMovimentacao: new Date().toISOString().slice(0, 16),
    prazo: "",
    geraPrazo: false,
  });
  const [saving, setSaving] = useState(false);

  // Resetar formulário quando modal abre/fecha
  useState(() => {
    if (isOpen) {
      if (mode === "create") {
        setFormData({
          processoId: "",
          titulo: "",
          descricao: "",
          tipo: "",
          dataMovimentacao: new Date().toISOString().slice(0, 16),
          prazo: "",
          geraPrazo: false,
        });
      } else if (andamento) {
        setFormData({
          processoId: andamento.processo.id,
          titulo: andamento.titulo,
          descricao: andamento.descricao || "",
          tipo: andamento.tipo || "",
          dataMovimentacao: new Date(andamento.dataMovimentacao)
            .toISOString()
            .slice(0, 16),
          prazo: andamento.prazo
            ? new Date(andamento.prazo).toISOString().slice(0, 16)
            : "",
          geraPrazo: false,
        });
      }
    }
  });

  const handleSubmit = async () => {
    if (!formData.processoId || !formData.titulo) {
      toast.error("Preencha os campos obrigatórios");

      return;
    }

    setSaving(true);

    const input: AndamentoCreateInput = {
      processoId: formData.processoId,
      titulo: formData.titulo,
      descricao: formData.descricao || undefined,
      tipo: formData.tipo || undefined,
      dataMovimentacao: formData.dataMovimentacao
        ? new Date(formData.dataMovimentacao)
        : undefined,
      prazo: formData.prazo ? new Date(formData.prazo) : undefined,
      geraPrazo: formData.geraPrazo,
    };

    const result =
      mode === "create"
        ? await createAndamento(input)
        : await updateAndamento(andamento!.id, input);

    setSaving(false);

    if (result.success) {
      toast.success(
        mode === "create"
          ? "Andamento criado com sucesso!"
          : "Andamento atualizado com sucesso!",
      );
      onSuccess();
      onClose();
    } else {
      toast.error(result.error || "Erro ao salvar andamento");
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          {mode === "create" && "Novo Andamento"}
          {mode === "edit" && "Editar Andamento"}
          {mode === "view" && "Detalhes do Andamento"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Select
              isRequired
              isDisabled={isReadOnly || mode === "edit"}
              label="Processo"
              placeholder="Selecione o processo"
              selectedKeys={formData.processoId ? [formData.processoId] : []}
              onChange={(e) =>
                setFormData({ ...formData, processoId: e.target.value })
              }
            >
              {processos.map((proc: any) => (
                <SelectItem key={proc.id}>
                  {proc.numero} {proc.titulo ? `- ${proc.titulo}` : ""}
                </SelectItem>
              ))}
            </Select>

            <Input
              isRequired
              isReadOnly={isReadOnly}
              label="Título"
              placeholder="Ex: Sentença proferida, Intimação recebida, etc"
              value={formData.titulo}
              onValueChange={(value) =>
                setFormData({ ...formData, titulo: value })
              }
            />

            <Textarea
              isReadOnly={isReadOnly}
              label="Descrição"
              minRows={3}
              placeholder="Descreva o andamento em detalhes..."
              value={formData.descricao}
              onValueChange={(value) =>
                setFormData({ ...formData, descricao: value })
              }
            />

            <Select
              isDisabled={isReadOnly}
              label="Tipo"
              placeholder="Selecione o tipo"
              selectedKeys={formData.tipo ? [formData.tipo] : []}
              onChange={(e) =>
                setFormData({ ...formData, tipo: e.target.value })
              }
            >
              {tipos.map((tipo) => (
                <SelectItem key={tipo}>{tipo}</SelectItem>
              ))}
            </Select>

            <Input
              isReadOnly={isReadOnly}
              label="Data da Movimentação"
              type="datetime-local"
              value={formData.dataMovimentacao}
              onValueChange={(value) =>
                setFormData({ ...formData, dataMovimentacao: value })
              }
            />

            <Input
              description="Se houver prazo relacionado a este andamento"
              isReadOnly={isReadOnly}
              label="Prazo (opcional)"
              type="datetime-local"
              value={formData.prazo}
              onValueChange={(value) =>
                setFormData({ ...formData, prazo: value })
              }
            />

            {!isReadOnly && formData.prazo && mode === "create" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  checked={formData.geraPrazo}
                  className="w-4 h-4"
                  type="checkbox"
                  onChange={(e) =>
                    setFormData({ ...formData, geraPrazo: e.target.checked })
                  }
                />
                <span className="text-sm">
                  Gerar prazo automático no sistema
                </span>
              </label>
            )}

            {mode === "view" && andamento && (
              <>
                {andamento.documentos.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">
                      Documentos Anexados:
                    </p>
                    <div className="space-y-1">
                      {andamento.documentos.map((doc) => (
                        <a
                          key={doc.id}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                          href={doc.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <Paperclip size={14} />
                          {doc.nome}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {andamento.prazosRelacionados.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">
                      Prazos Relacionados:
                    </p>
                    <div className="space-y-2">
                      {andamento.prazosRelacionados.map((prazo) => (
                        <div
                          key={prazo.id}
                          className="p-2 bg-gray-100 dark:bg-gray-800 rounded"
                        >
                          <p className="text-sm font-medium">{prazo.titulo}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Vencimento:{" "}
                            {new Date(prazo.dataVencimento).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                          <Chip
                            color={
                              prazo.status === "ABERTO" ? "warning" : "success"
                            }
                            size="sm"
                          >
                            {prazo.status}
                          </Chip>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {isReadOnly ? "Fechar" : "Cancelar"}
          </Button>
          {!isReadOnly && (
            <Button color="primary" isLoading={saving} onPress={handleSubmit}>
              {mode === "create" ? "Criar" : "Salvar"}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
