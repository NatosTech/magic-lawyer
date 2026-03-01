"use client";

import { useState, useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useDisclosure } from "@heroui/use-disclosure";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { toast } from "@/lib/toast";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Link as LinkIcon,
  Building2,
  User,
  CheckCircle,
  X,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";

import {
  useClientesParaSelect,
  useProcuracoesDisponiveis,
} from "@/app/hooks/use-clientes";
import { useAllContratos } from "@/app/hooks/use-contratos";
import { deleteContrato, vincularContratoProcuracao } from "@/app/actions/contratos";
import { DateUtils } from "@/app/lib/date-utils";
import { Select, SelectItem } from "@heroui/react";
import {
  PeopleMetricCard,
  PeoplePageHeader,
  PeoplePanel,
} from "@/components/people-ui";

const STATUS_OPTIONS = [
  { key: "ATIVO", label: "Ativo", color: "success" as const },
  { key: "RASCUNHO", label: "Rascunho", color: "warning" as const },
  { key: "SUSPENSO", label: "Suspenso", color: "default" as const },
  { key: "CANCELADO", label: "Cancelado", color: "danger" as const },
  { key: "ENCERRADO", label: "Encerrado", color: "default" as const },
];

const ORDENACAO_OPTIONS = [
  { key: "recente", label: "Mais recentes" },
  { key: "antigo", label: "Mais antigos" },
  { key: "valor-desc", label: "Maior valor" },
  { key: "valor-asc", label: "Menor valor" },
  { key: "titulo", label: "Título (A-Z)" },
];

export default function ContratosContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContrato, setSelectedContrato] = useState<any>(null);
  const [selectedProcuracao, setSelectedProcuracao] = useState<string>("");
  const [selectedContratoParaExcluir, setSelectedContratoParaExcluir] =
    useState<any>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroCliente, setFiltroCliente] = useState<string>("todos");
  const [filtroValorMin, setFiltroValorMin] = useState<string>("");
  const [filtroValorMax, setFiltroValorMax] = useState<string>("");
  const [ordenacao, setOrdenacao] = useState<string>("recente");

  const {
    isOpen: isVincularOpen,
    onOpen: openVincularDisclosure,
    onClose: closeVincularDisclosure,
    onOpenChange: onVincularOpenChange,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: openDeleteDisclosure,
    onClose: closeDeleteDisclosure,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const { clientes } = useClientesParaSelect();
  const { contratos, isLoading, isError, mutate } = useAllContratos();
  const { procuracoes, isLoading: isLoadingProcuracoes } =
    useProcuracoesDisponiveis(selectedContrato?.cliente?.id || null);

  const handleVincularProcuracao = async () => {
    if (!selectedContrato || !selectedProcuracao) {
      toast.error("Selecione uma procuração");

      return;
    }

    setIsLinking(true);
    try {
      const result = await vincularContratoProcuracao(
        selectedContrato.id,
        selectedProcuracao,
      );

      if (result.success) {
        toast.success(
          result.message || "Contrato vinculado à procuração com sucesso!",
        );
        mutate(); // Atualizar lista de contratos
        closeVincularDisclosure();
        setSelectedContrato(null);
        setSelectedProcuracao("");
      } else {
        toast.error(result.error || "Erro ao vincular procuração");
      }
    } catch (error) {
      toast.error("Erro ao processar vinculação");
    } finally {
      setIsLinking(false);
    }
  };

  const openVincularModal = (contrato: any) => {
    setSelectedContrato(contrato);
    setSelectedProcuracao("");
    openVincularDisclosure();
  };

  const openDeleteModal = (contrato: any) => {
    setSelectedContratoParaExcluir(contrato);
    openDeleteDisclosure();
  };

  const handleExcluirContrato = async () => {
    if (!selectedContratoParaExcluir?.id) {
      toast.error("Selecione um contrato para excluir.");

      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteContrato(selectedContratoParaExcluir.id);

      if (result.success) {
        toast.success(result.message || "Contrato excluído com sucesso.");
        mutate();
        closeDeleteDisclosure();
        setSelectedContratoParaExcluir(null);
      } else {
        toast.error(result.error || "Erro ao excluir contrato.");
      }
    } catch (error) {
      toast.error("Erro ao excluir contrato.");
    } finally {
      setIsDeleting(false);
    }
  };

  const limparFiltros = () => {
    setSearchTerm("");
    setFiltroStatus("todos");
    setFiltroCliente("todos");
    setFiltroValorMin("");
    setFiltroValorMax("");
    setOrdenacao("recente");
  };

  const temFiltrosAtivos = useMemo(() => {
    return (
      searchTerm !== "" ||
      filtroStatus !== "todos" ||
      filtroCliente !== "todos" ||
      filtroValorMin !== "" ||
      filtroValorMax !== ""
    );
  }, [searchTerm, filtroStatus, filtroCliente, filtroValorMin, filtroValorMax]);

  const contratosFiltrados = useMemo(() => {
    if (!contratos) return [];

    let resultado = [...contratos];

    // Filtro de busca por texto
    if (searchTerm) {
      resultado = resultado.filter(
        (contrato) =>
          contrato.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contrato.cliente?.nome
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          contrato.resumo?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtro por status
    if (filtroStatus !== "todos") {
      resultado = resultado.filter(
        (contrato) => contrato.status === filtroStatus,
      );
    }

    // Filtro por cliente
    if (filtroCliente !== "todos") {
      resultado = resultado.filter(
        (contrato) => contrato.clienteId === filtroCliente,
      );
    }

    // Filtro por valor mínimo
    if (filtroValorMin) {
      const valorMin = parseFloat(filtroValorMin);

      if (!isNaN(valorMin)) {
        resultado = resultado.filter(
          (contrato) => (contrato.valor || 0) >= valorMin,
        );
      }
    }

    // Filtro por valor máximo
    if (filtroValorMax) {
      const valorMax = parseFloat(filtroValorMax);

      if (!isNaN(valorMax)) {
        resultado = resultado.filter(
          (contrato) => (contrato.valor || 0) <= valorMax,
        );
      }
    }

    // Ordenação
    switch (ordenacao) {
      case "recente":
        resultado.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "antigo":
        resultado.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "valor-desc":
        resultado.sort((a, b) => (b.valor || 0) - (a.valor || 0));
        break;
      case "valor-asc":
        resultado.sort((a, b) => (a.valor || 0) - (b.valor || 0));
        break;
      case "titulo":
        resultado.sort((a, b) => a.titulo.localeCompare(b.titulo));
        break;
    }

    return resultado;
  }, [
    contratos,
    searchTerm,
    filtroStatus,
    filtroCliente,
    filtroValorMin,
    filtroValorMax,
    ordenacao,
  ]);

  const contratosMetricas = useMemo(() => {
    if (!contratos) {
      return {
        total: 0,
        ativos: 0,
        rascunhos: 0,
        comProcesso: 0,
        comArquivo: 0,
      };
    }

    return {
      total: contratos.length,
      ativos: contratos.filter((contrato) => contrato.status === "ATIVO").length,
      rascunhos: contratos.filter(
        (contrato) => contrato.status === "RASCUNHO",
      ).length,
      comProcesso: contratos.filter((contrato) => contrato.processo).length,
      comArquivo: contratos.filter((contrato) => contrato.arquivoUrl).length,
    };
  }, [contratos]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner label="Carregando contratos..." size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FileText className="h-12 w-12 text-danger" />
        <p className="text-lg font-semibold text-danger">
          Erro ao carregar contratos
        </p>
        <Button color="primary" onPress={() => mutate()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PeoplePageHeader
        description="Gerencie todos os contratos do escritório com filtros claros e navegação direta."
        title="Contratos"
        actions={
          <>
            <Button
              as={Link}
              color="primary"
              href="/contratos/novo"
              size="sm"
              startContent={<Plus className="h-4 w-4" />}
            >
              Novo Contrato
            </Button>
            <Button
              as={Link}
              href="/contratos/modelos"
              size="sm"
              startContent={<FileText className="h-4 w-4" />}
              variant="flat"
            >
              Modelos de Contrato
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PeopleMetricCard
          helper="Carteira total"
          icon={<FileText className="h-4 w-4" />}
          label="Total de contratos"
          tone="primary"
          value={contratosMetricas.total}
        />
        <PeopleMetricCard
          helper="Contratos em produção"
          icon={<CheckCircle className="h-4 w-4" />}
          label="Ativos"
          tone="success"
          value={contratosMetricas.ativos}
        />
        <PeopleMetricCard
          helper="Aguardando revisão"
          icon={<Edit className="h-4 w-4" />}
          label="Rascunhos"
          tone="warning"
          value={contratosMetricas.rascunhos}
        />
        <PeopleMetricCard
          helper="Com processo vinculado"
          icon={<LinkIcon className="h-4 w-4" />}
          label="Vinculados"
          tone="secondary"
          value={contratosMetricas.comProcesso}
        />
        <PeopleMetricCard
          helper="Com documento anexado"
          icon={<FileText className="h-4 w-4" />}
          label="Com contrato anexado"
          tone="default"
          value={contratosMetricas.comArquivo}
        />
      </div>

      {/* Filtros */}
      <PeoplePanel
        actions={
          <Button
            color="warning"
            size="sm"
            startContent={<X className="h-3 w-3" />}
            variant="flat"
            onPress={limparFiltros}
          >
            Limpar filtros
          </Button>
        }
        description="Refine rápido por texto, status, cliente e faixa de valor."
        title="Filtros de Contratos"
      >
        <div className="space-y-4">
          {/* Barra de busca e controles principais */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              className="flex-1"
              placeholder="Buscar por título, cliente ou resumo..."
              startContent={<Search className="h-4 w-4 text-default-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                startContent={<SlidersHorizontal className="h-4 w-4" />}
                variant={mostrarFiltros ? "solid" : "bordered"}
                onPress={() => setMostrarFiltros(!mostrarFiltros)}
              >
                Filtros
              </Button>
              <Select
                className="w-48"
                placeholder="Ordenar por"
                selectedKeys={[ordenacao]}
                startContent={
                  <ArrowUpDown className="h-4 w-4 text-default-400" />
                }
                onChange={(e) => setOrdenacao(e.target.value)}
              >
                {ORDENACAO_OPTIONS.map((option) => (
                  <SelectItem key={option.key} textValue={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {/* Filtros avançados (expansível) */}
          {mostrarFiltros && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-default-200">
              <Select
                label="Status"
                placeholder="Todos os status"
                selectedKeys={filtroStatus !== "todos" ? [filtroStatus] : []}
                onChange={(e) => setFiltroStatus(e.target.value || "todos")}
              >
                {[{ key: "todos", label: "Todos" }, ...STATUS_OPTIONS].map(
                  (option) => (
                    <SelectItem key={option.key} textValue={option.label}>
                      {option.label}
                    </SelectItem>
                  ),
                )}
              </Select>

              <Select
                label="Cliente"
                placeholder="Todos os clientes"
                selectedKeys={filtroCliente !== "todos" ? [filtroCliente] : []}
                onChange={(e) => setFiltroCliente(e.target.value || "todos")}
              >
                {[{ id: "todos", nome: "Todos" }, ...(clientes || [])].map(
                  (cliente) => (
                    <SelectItem key={cliente.id} textValue={cliente.nome}>
                      {cliente.nome}
                    </SelectItem>
                  ),
                )}
              </Select>

              <Input
                label="Valor mínimo"
                placeholder="R$ 0,00"
                type="number"
                value={filtroValorMin}
                onChange={(e) => setFiltroValorMin(e.target.value)}
              />

              <Input
                label="Valor máximo"
                placeholder="R$ 0,00"
                type="number"
                value={filtroValorMax}
                onChange={(e) => setFiltroValorMax(e.target.value)}
              />
            </div>
          )}

          {/* Chips de filtros ativos */}
          {temFiltrosAtivos && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-default-500">Filtros ativos:</span>
              {searchTerm && (
                <Chip
                  endContent={<X className="h-3 w-3" />}
                  size="sm"
                  variant="flat"
                  onClose={() => setSearchTerm("")}
                >
                  Busca: &quot;{searchTerm}&quot;
                </Chip>
              )}
              {filtroStatus !== "todos" && (
                <Chip
                  color={
                    STATUS_OPTIONS.find((s) => s.key === filtroStatus)?.color
                  }
                  endContent={<X className="h-3 w-3" />}
                  size="sm"
                  variant="flat"
                  onClose={() => setFiltroStatus("todos")}
                >
                  Status:{" "}
                  {STATUS_OPTIONS.find((s) => s.key === filtroStatus)?.label}
                </Chip>
              )}
              {filtroCliente !== "todos" && (
                <Chip
                  endContent={<X className="h-3 w-3" />}
                  size="sm"
                  variant="flat"
                  onClose={() => setFiltroCliente("todos")}
                >
                  Cliente: {clientes?.find((c) => c.id === filtroCliente)?.nome}
                </Chip>
              )}
              {filtroValorMin && (
                <Chip
                  endContent={<X className="h-3 w-3" />}
                  size="sm"
                  variant="flat"
                  onClose={() => setFiltroValorMin("")}
                >
                  Valor mín: R${" "}
                  {parseFloat(filtroValorMin).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </Chip>
              )}
              {filtroValorMax && (
                <Chip
                  endContent={<X className="h-3 w-3" />}
                  size="sm"
                  variant="flat"
                  onClose={() => setFiltroValorMax("")}
                >
                  Valor máx: R${" "}
                  {parseFloat(filtroValorMax).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </Chip>
              )}
            </div>
          )}

          <div className="text-xs text-default-500">
            {contratosFiltrados.length}{" "}
            {contratosFiltrados.length === 1
              ? "contrato encontrado"
              : "contratos encontrados"}
            {contratos &&
              contratos.length !== contratosFiltrados.length &&
              ` de ${contratos.length} total`}
          </div>
        </div>
      </PeoplePanel>

      {/* Lista de Contratos */}
      {contratosFiltrados.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-default-300" />
            <p className="mt-4 text-lg font-semibold text-default-600">
              {searchTerm
                ? "Nenhum contrato encontrado"
                : "Nenhum contrato cadastrado"}
            </p>
            <p className="mt-2 text-sm text-default-400">
              {searchTerm
                ? "Tente ajustar os filtros de busca"
                : "Comece criando seu primeiro contrato"}
            </p>
          </CardBody>
        </Card>
      ) : (
        <PeoplePanel
          description="Clique em uma ação para detalhar o contrato, alterar vínculos ou gerenciar documentos."
          title={`Lista de contratos (${contratosFiltrados.length})`}
        >
        <div className="grid gap-4">
          {contratosFiltrados.map((contrato) => (
            <Card
              key={contrato.id}
              className="border border-white/10 bg-background/70 backdrop-blur-sm"
            >
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{contrato.titulo}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${contrato.status === "ATIVO" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}
                      >
                        {contrato.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-default-500 mb-2">
                      <div className="flex items-center gap-1">
                        {contrato.cliente.tipoPessoa === "JURIDICA" ? (
                          <Building2 className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        <span>{contrato.cliente.nome}</span>
                      </div>
                      {contrato.valor && (
                        <span>
                          R${" "}
                          {contrato.valor.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      )}
                      {contrato.dataInicio && (
                        <span>
                          Início: {DateUtils.formatDate(contrato.dataInicio)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-default-400">
                      {contrato.processo ? (
                        <span className="flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          Processo: {contrato.processo.numero}
                        </span>
                      ) : (
                        <span className="text-warning">
                          Sem processo vinculado
                        </span>
                      )}
                      {contrato.processo?.procuracoesVinculadas &&
                      contrato.processo.procuracoesVinculadas.length > 0 ? (
                        <span className="text-success flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {contrato.processo.procuracoesVinculadas.length}{" "}
                          procuração(ões)
                        </span>
                      ) : (
                        <span className="text-default-400">Sem procuração</span>
                      )}
                    </div>
                  </div>

                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem
                        key="details"
                        as={Link}
                        href={`/contratos/${contrato.id}`}
                        startContent={<FileText className="h-4 w-4" />}
                      >
                        Ver detalhes
                      </DropdownItem>
                      {contrato.arquivoUrl ? (
                        <DropdownItem
                          key="view-file"
                          as="a"
                          href={contrato.arquivoUrl}
                          rel="noopener noreferrer"
                          startContent={<Eye className="h-4 w-4" />}
                          target="_blank"
                        >
                          Ver contrato anexado
                        </DropdownItem>
                      ) : (
                        <DropdownItem
                          key="view-file-disabled"
                          isDisabled
                          startContent={
                            <EyeOff className="h-4 w-4 text-default-300" />
                          }
                        >
                          Contrato não anexado
                        </DropdownItem>
                      )}
                      <DropdownItem
                        key="edit"
                        as={Link}
                        href={`/contratos/${contrato.id}/editar`}
                        startContent={<Edit className="h-4 w-4" />}
                      >
                        Editar
                      </DropdownItem>
                      {contrato.processo && (
                        <DropdownItem
                          key="link"
                          startContent={<LinkIcon className="h-4 w-4" />}
                          onPress={() => openVincularModal(contrato)}
                        >
                          {contrato.processo.procuracoesVinculadas &&
                          contrato.processo.procuracoesVinculadas.length > 0
                            ? "Vincular Outra Procuração"
                            : "Vincular Procuração"}
                        </DropdownItem>
                      )}
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        startContent={<Trash2 className="h-4 w-4" />}
                        onPress={() => openDeleteModal(contrato)}
                      >
                        Excluir
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
        </PeoplePanel>
      )}

      {/* Modal Vincular Procuração */}
      <Modal isOpen={isVincularOpen} size="md" onOpenChange={onVincularOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Vincular Procuração</h3>
                <p className="text-sm text-default-500">
                  {selectedContrato?.processo ? (
                    <>
                      Verificar vinculação da procuração ao processo{" "}
                      <strong>{selectedContrato.processo.numero}</strong>
                    </>
                  ) : (
                    <>
                      Selecione uma procuração para vincular ao contrato através
                      de um processo
                    </>
                  )}
                </p>
              </ModalHeader>
              <ModalBody>
                {isLoadingProcuracoes ? (
                  <div className="flex justify-center py-8">
                    <Spinner label="Carregando procurações..." size="lg" />
                  </div>
                ) : procuracoes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-default-500">
                      Nenhuma procuração ativa encontrada para este cliente.
                    </p>
                  </div>
                ) : (
                  <Select
                    label="Selecione uma procuração"
                    placeholder="Escolha uma procuração"
                    selectedKeys={
                      selectedProcuracao ? [selectedProcuracao] : []
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;

                      setSelectedProcuracao(selectedKey || "");
                    }}
                  >
                    {procuracoes.map((procuracao: any) => (
                      <SelectItem
                        key={procuracao.id}
                        textValue={
                          procuracao.numero ||
                          `Procuração ${procuracao.id.slice(-8)}`
                        }
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {procuracao.numero ||
                              `Procuração ${procuracao.id.slice(-8)}`}
                          </span>
                          <span className="text-xs text-default-400">
                            {procuracao.processos.length} processo(s)
                            vinculado(s)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  isDisabled={!selectedProcuracao || isLoadingProcuracoes}
                  isLoading={isLinking}
                  onPress={handleVincularProcuracao}
                >
                  Vincular
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Excluir contrato</h3>
                <p className="text-sm text-default-500">
                  Esta ação não pode ser desfeita facilmente. O contrato será
                  removido e ficará indisponível para operação.
                </p>
              </ModalHeader>
              <ModalBody>
                <p className="text-small text-default-600">
                  Confirma a exclusão de{" "}
                  <strong>{selectedContratoParaExcluir?.titulo}</strong>?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => {
                  setSelectedContratoParaExcluir(null);
                  onClose();
                }}>
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  isLoading={isDeleting}
                  onPress={handleExcluirContrato}
                >
                  Excluir
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
