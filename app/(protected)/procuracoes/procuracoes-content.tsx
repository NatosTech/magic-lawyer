"use client";

import type { Selection } from "@react-types/shared";
import type { ProcuracaoListItem } from "@/app/actions/procuracoes";
import type { Processo as ProcessoDTO } from "@/app/actions/processos";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { AlertCircle, Plus, Search, MoreVertical, Edit, Eye, FileText, User, Building2, Calendar, Download, Link2, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { useUserPermissions } from "@/app/hooks/use-user-permissions";
import { useAllProcuracoes } from "@/app/hooks/use-procuracoes";
import { useClientesParaSelect } from "@/app/hooks/use-clientes";
import { useProcessosCliente } from "@/app/hooks/use-processos";
import { DateUtils } from "@/app/lib/date-utils";
import { linkProcuracaoAoProcesso } from "@/app/actions/processos";
import { ProcuracaoEmitidaPor, ProcuracaoStatus } from "@/app/generated/prisma";

type ProcuracaoFiltroValue<T extends string> = T | "";

interface ProcuracaoFiltros {
  search: string;
  status: ProcuracaoFiltroValue<ProcuracaoStatus>;
  clienteId: string;
  advogadoId: string;
  emitidaPor: ProcuracaoFiltroValue<ProcuracaoEmitidaPor>;
}

export function ProcuracoesContent() {
  const router = useRouter();
  const { procuracoes, isLoading, isError, error, mutate: mutateProcuracoes } = useAllProcuracoes();
  const permissions = useUserPermissions();

  const [filtros, setFiltros] = useState<ProcuracaoFiltros>({
    search: "",
    status: "",
    clienteId: "",
    advogadoId: "",
    emitidaPor: "",
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [selectedProcuracao, setSelectedProcuracao] = useState<ProcuracaoListItem | null>(null);
  const [selectedProcessoId, setSelectedProcessoId] = useState<string>("");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clienteNovaProcuracaoId, setClienteNovaProcuracaoId] = useState<string>("");
  const [processosNovaProcuracaoIds, setProcessosNovaProcuracaoIds] = useState<Set<string>>(new Set());
  const [isLinking, startTransition] = useTransition();

  const { clientes, isLoading: isLoadingClientes } = useClientesParaSelect();

  const { processos: processosClienteSelecionado, isLoading: isLoadingProcessosSelecionado, mutate: mutateProcessosCliente } = useProcessosCliente(selectedProcuracao?.cliente?.id ?? null);

  const { processos: processosParaNovaProcuracao, isLoading: isLoadingProcessosNovaProcuracao } = useProcessosCliente(clienteNovaProcuracaoId || null);

  const processosDisponiveis = useMemo<ProcessoDTO[]>(() => {
    const vinculados = new Set((selectedProcuracao?.processos || []).map((procuracaoProcesso) => procuracaoProcesso.processoId));

    return (processosClienteSelecionado ?? []).filter((processo) => !vinculados.has(processo.id));
  }, [processosClienteSelecionado, selectedProcuracao]);

  // Filtros únicos para selects
  const statusUnicos = useMemo<ProcuracaoStatus[]>(() => {
    if (!procuracoes) return [];

    return Array.from(new Set(procuracoes.map((procuracao) => procuracao.status).filter(Boolean) as ProcuracaoStatus[]));
  }, [procuracoes]);

  const emitidaPorUnicos = useMemo<ProcuracaoEmitidaPor[]>(() => {
    if (!procuracoes) return [];

    return Array.from(new Set(procuracoes.map((procuracao) => procuracao.emitidaPor).filter(Boolean) as ProcuracaoEmitidaPor[]));
  }, [procuracoes]);

  // Aplicar filtros
  const procuracoesFiltradas = useMemo<ProcuracaoListItem[]>(() => {
    if (!procuracoes) return [];

    return procuracoes.filter((procuracao) => {
      const termoBusca = filtros.search.trim().toLowerCase();

      if (termoBusca) {
        const numero = procuracao.numero?.toLowerCase() ?? "";
        const nomeCliente = procuracao.cliente.nome.toLowerCase();

        if (!numero.includes(termoBusca) && !nomeCliente.includes(termoBusca)) {
          return false;
        }
      }

      if (filtros.status && procuracao.status !== filtros.status) {
        return false;
      }

      if (filtros.clienteId && procuracao.clienteId !== filtros.clienteId) {
        return false;
      }

      if (filtros.emitidaPor && procuracao.emitidaPor !== filtros.emitidaPor) {
        return false;
      }

      return true;
    });
  }, [filtros, procuracoes]);

  const limparFiltros = () => {
    setFiltros({
      search: "",
      status: "",
      clienteId: "",
      advogadoId: "",
      emitidaPor: "",
    });
  };

  const openLinkModal = (procuracao: ProcuracaoListItem) => {
    setSelectedProcuracao(procuracao);
    setSelectedProcessoId("");
    setIsLinkModalOpen(true);
  };

  const closeLinkModal = () => {
    setIsLinkModalOpen(false);
    setSelectedProcessoId("");
    setSelectedProcuracao(null);
  };

  const handleLinkProcuracao = () => {
    if (!selectedProcuracao || !selectedProcessoId) return;

    startTransition(async () => {
      const result = await linkProcuracaoAoProcesso(selectedProcessoId, selectedProcuracao.id);

      if (result.success) {
        toast.success("Procuração vinculada ao processo");
        closeLinkModal();
        await Promise.all([mutateProcuracoes(), mutateProcessosCliente?.()]);
      } else {
        toast.error(result.error || "Falha ao vincular procuração");
      }
    });
  };

  const temFiltrosAtivos = Object.values(filtros).some((valor) => valor !== "");

  const resetNovaProcuracaoState = () => {
    setClienteNovaProcuracaoId("");
    setProcessosNovaProcuracaoIds(new Set());
  };

  const openCreateModal = () => {
    resetNovaProcuracaoState();
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetNovaProcuracaoState();
  };

  const handleProcessoSelectionChange = (keys: Selection) => {
    if (keys === "all") {
      const todosProcessos = processosParaNovaProcuracao?.map((processo) => processo.id) ?? [];

      setProcessosNovaProcuracaoIds(new Set(todosProcessos));

      return;
    }

    setProcessosNovaProcuracaoIds(new Set(Array.from(keys).map(String)));
  };

  const handleCreateProcuracao = () => {
    if (!clienteNovaProcuracaoId) return;

    const params = new URLSearchParams();

    params.set("clienteId", clienteNovaProcuracaoId);

    if (processosNovaProcuracaoIds.size > 0) {
      params.set("processoIds", Array.from(processosNovaProcuracaoIds).join(","));
    }

    closeCreateModal();
    router.push(`/procuracoes/novo?${params.toString()}`);
  };

  const getStatusColor = (status: ProcuracaoStatus) => {
    switch (status) {
      case ProcuracaoStatus.VIGENTE:
        return "success";
      case ProcuracaoStatus.RASCUNHO:
        return "default";
      case ProcuracaoStatus.PENDENTE_ASSINATURA:
        return "warning";
      case ProcuracaoStatus.REVOGADA:
        return "danger";
      case ProcuracaoStatus.EXPIRADA:
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: ProcuracaoStatus) => {
    switch (status) {
      case ProcuracaoStatus.VIGENTE:
        return "Vigente";
      case ProcuracaoStatus.RASCUNHO:
        return "Rascunho";
      case ProcuracaoStatus.PENDENTE_ASSINATURA:
        return "Pendente Assinatura";
      case ProcuracaoStatus.REVOGADA:
        return "Revogada";
      case ProcuracaoStatus.EXPIRADA:
        return "Expirada";
      default:
        return status;
    }
  };

  const getEmitidaPorLabel = (emitidaPor: ProcuracaoEmitidaPor) => {
    switch (emitidaPor) {
      case ProcuracaoEmitidaPor.ESCRITORIO:
        return "Escritório";
      case ProcuracaoEmitidaPor.ADVOGADO:
        return "Advogado";
      default:
        return emitidaPor;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-danger" />
        <p className="text-danger">Erro ao carregar procurações</p>
        <p className="text-small text-default-500">{error?.message}</p>
      </div>
    );
  }

  if (!procuracoes) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <FileText className="h-12 w-12 text-default-400" />
        <p className="text-default-500">Nenhuma procuração encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Procurações</h1>
          <p className="text-small text-default-500">
            {procuracoesFiltradas.length} de {procuracoes.length} procurações
            {temFiltrosAtivos && " (filtradas)"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button startContent={<Search className="h-4 w-4" />} variant="bordered" onPress={() => setMostrarFiltros(!mostrarFiltros)}>
            Filtros
          </Button>

          {!permissions.isCliente && (
            <Button color="primary" startContent={<Plus className="h-4 w-4" />} onPress={openCreateModal}>
              Nova Procuração
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                placeholder="Buscar por número ou cliente..."
                startContent={<Search className="h-4 w-4 text-default-400" />}
                value={filtros.search}
                onValueChange={(value) => setFiltros((prev) => ({ ...prev, search: value }))}
              />

              <Select
                placeholder="Status"
                selectedKeys={filtros.status ? [filtros.status] : []}
                onSelectionChange={(keys) => {
                  const [key] = Array.from(keys);

                  setFiltros((prev) => ({
                    ...prev,
                    status: (key as ProcuracaoStatus | undefined) ?? "",
                  }));
                }}
              >
                {statusUnicos.map((status) => (
                  <SelectItem key={status}>{getStatusLabel(status)}</SelectItem>
                ))}
              </Select>

              <Select
                placeholder="Emitida por"
                selectedKeys={filtros.emitidaPor ? [filtros.emitidaPor] : []}
                onSelectionChange={(keys) => {
                  const [key] = Array.from(keys);

                  setFiltros((prev) => ({
                    ...prev,
                    emitidaPor: (key as ProcuracaoEmitidaPor | undefined) ?? "",
                  }));
                }}
              >
                {emitidaPorUnicos.map((emitidaPor) => (
                  <SelectItem key={emitidaPor}>{getEmitidaPorLabel(emitidaPor)}</SelectItem>
                ))}
              </Select>
            </div>

            {temFiltrosAtivos && (
              <div className="flex justify-end">
                <Button size="sm" variant="light" onPress={limparFiltros}>
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Lista de Procurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {procuracoesFiltradas.map((procuracao) => (
          <Card key={procuracao.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{procuracao.numero || "Sem número"}</span>
              </div>

              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem key="view" startContent={<Eye className="h-4 w-4" />} onPress={() => router.push(`/procuracoes/${procuracao.id}`)}>
                    Ver Detalhes
                  </DropdownItem>
                  {!permissions.isCliente ? (
                    <DropdownItem key="edit" startContent={<Edit className="h-4 w-4" />} onPress={() => router.push(`/procuracoes/${procuracao.id}/editar`)}>
                      Editar
                    </DropdownItem>
                  ) : null}
                  {!permissions.isCliente ? (
                    <DropdownItem key="link" startContent={<Link2 className="h-4 w-4" />} onPress={() => openLinkModal(procuracao)}>
                      Vincular a Processo
                    </DropdownItem>
                  ) : null}
                  {!permissions.isCliente ? (
                    <DropdownItem key="documents" startContent={<Paperclip className="h-4 w-4" />} onPress={() => router.push(`/procuracoes/${procuracao.id}#documentos`)}>
                      Anexar Documentos
                    </DropdownItem>
                  ) : null}
                  <DropdownItem
                    key="download"
                    startContent={<Download className="h-4 w-4" />}
                    onPress={() => {
                      // Implementar download do PDF
                      console.log("Download PDF:", procuracao.id);
                    }}
                  >
                    Baixar PDF
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </CardHeader>

            <CardBody className="space-y-3">
              <div className="flex items-center space-x-2">
                {procuracao.cliente.tipoPessoa === "FISICA" ? <User className="h-4 w-4 text-default-400" /> : <Building2 className="h-4 w-4 text-default-400" />}
                <span className="text-sm font-medium">{procuracao.cliente.nome}</span>
              </div>

              <div className="flex items-center justify-between">
                <Chip color={getStatusColor(procuracao.status)} size="sm" variant="flat">
                  {getStatusLabel(procuracao.status)}
                </Chip>

                <Chip size="sm" variant="bordered">
                  {getEmitidaPorLabel(procuracao.emitidaPor)}
                </Chip>
              </div>

              {procuracao.emitidaEm && (
                <div className="flex items-center space-x-2 text-small text-default-500">
                  <Calendar className="h-3 w-3" />
                  <span>Emitida em {DateUtils.formatDate(procuracao.emitidaEm)}</span>
                </div>
              )}

              {procuracao.validaAte && (
                <div className="flex items-center space-x-2 text-small text-default-500">
                  <Calendar className="h-3 w-3" />
                  <span>Válida até {DateUtils.formatDate(procuracao.validaAte)}</span>
                </div>
              )}

              {procuracao.outorgados && procuracao.outorgados.length > 0 && (
                <div className="text-small text-default-500">
                  <span className="font-medium">Advogados:</span>{" "}
                  {procuracao.outorgados.map((outorgado) => `${outorgado.advogado.usuario.firstName} ${outorgado.advogado.usuario.lastName}`).join(", ")}
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {procuracoesFiltradas.length === 0 && temFiltrosAtivos && (
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <Search className="h-8 w-8 text-default-400" />
          <p className="text-default-500">Nenhuma procuração encontrada com os filtros aplicados</p>
          <Button size="sm" variant="light" onPress={limparFiltros}>
            Limpar Filtros
          </Button>
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        size="lg"
        onOpenChange={(open) => {
          if (!open) {
            closeCreateModal();
          }
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Nova Procuração</h3>
                <p className="text-sm text-default-500">Selecione o cliente e processos que serão vinculados ao criar a procuração.</p>
              </ModalHeader>
              <ModalBody>
                {isLoadingClientes ? (
                  <div className="flex justify-center py-6">
                    <Spinner label="Carregando clientes..." size="lg" />
                  </div>
                ) : clientes.length === 0 ? (
                  <p className="text-sm text-default-500">Nenhum cliente disponível para seleção.</p>
                ) : (
                  <div className="space-y-4">
                    <Select
                      label="Cliente"
                      placeholder="Selecione o cliente"
                      selectedKeys={clienteNovaProcuracaoId ? [clienteNovaProcuracaoId] : []}
                      onSelectionChange={(keys) => {
                        const [key] = Array.from(keys);
                        const novoClienteId = (key as string | undefined) ?? "";

                        setClienteNovaProcuracaoId(novoClienteId);
                        setProcessosNovaProcuracaoIds(new Set());
                      }}
                    >
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id}>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-default-700">{cliente.nome}</span>
                            {cliente.documento && <span className="text-xs text-default-400">{cliente.documento}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </Select>

                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase text-default-400">Vincular a processos</p>

                      {!clienteNovaProcuracaoId ? (
                        <p className="text-sm text-default-500">Selecione um cliente para listar processos disponíveis.</p>
                      ) : isLoadingProcessosNovaProcuracao ? (
                        <div className="flex justify-center py-4">
                          <Spinner label="Carregando processos..." size="md" />
                        </div>
                      ) : !processosParaNovaProcuracao || processosParaNovaProcuracao.length === 0 ? (
                        <p className="text-sm text-default-500">Este cliente não possui processos cadastrados.</p>
                      ) : (
                        <Select placeholder="Selecione os processos (opcional)" selectedKeys={processosNovaProcuracaoIds} selectionMode="multiple" onSelectionChange={handleProcessoSelectionChange}>
                          {processosParaNovaProcuracao.map((processo) => (
                            <SelectItem key={processo.id}>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-default-700">{processo.numero}</span>
                                {processo.titulo && <span className="text-xs text-default-400">{processo.titulo}</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={closeCreateModal}>
                  Cancelar
                </Button>
                <Button
                  variant="flat"
                  onPress={() => {
                    closeCreateModal();
                    router.push("/procuracoes/novo");
                  }}
                >
                  Abrir formulário em branco
                </Button>
                <Button color="primary" isDisabled={!clienteNovaProcuracaoId} onPress={handleCreateProcuracao}>
                  Continuar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isLinkModalOpen}
        size="md"
        onOpenChange={(open) => {
          if (!open) {
            closeLinkModal();
          } else {
            setIsLinkModalOpen(true);
          }
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Vincular Procuração</h3>
                {selectedProcuracao && (
                  <p className="text-sm text-default-500">
                    {selectedProcuracao.numero || "Sem número"} • {selectedProcuracao.cliente?.nome}
                  </p>
                )}
              </ModalHeader>
              <ModalBody>
                {isLoadingProcessosSelecionado ? (
                  <div className="flex justify-center py-8">
                    <Spinner label="Carregando processos..." size="lg" />
                  </div>
                ) : processosDisponiveis.length === 0 ? (
                  <p className="text-sm text-default-500">Nenhum processo disponível para este cliente.</p>
                ) : (
                  <Select
                    label="Processo"
                    placeholder="Selecione o processo"
                    selectedKeys={selectedProcessoId ? [selectedProcessoId] : []}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string | undefined;

                      setSelectedProcessoId(key ?? "");
                    }}
                  >
                    {processosDisponiveis.map((processo) => (
                      <SelectItem key={processo.id}>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{processo.numero}</span>
                          {processo.titulo && <span className="text-xs text-default-400">{processo.titulo}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={closeLinkModal}>
                  Cancelar
                </Button>
                <Button color="primary" isDisabled={!selectedProcessoId || processosDisponiveis.length === 0} isLoading={isLinking} onPress={handleLinkProcuracao}>
                  Vincular
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
