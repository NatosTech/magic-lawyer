"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox } from "@heroui/checkbox";
import {
  ArrowLeft,
  User,
  FileSignature,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Edit,
  Plus,
  Trash2,
  FileText,
  Users,
  Scale,
  Info,
  Paperclip,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { mutate } from "swr";

import { useProcuracao } from "@/app/hooks/use-procuracoes";
import { useAdvogadosDisponiveis } from "@/app/hooks/use-advogados";
import { title } from "@/components/primitives";
import { ProcuracaoStatus, ProcuracaoEmitidaPor } from "@/app/generated/prisma";
import { DateUtils } from "@/app/lib/date-utils";
import {
  updateProcuracao,
  deleteProcuracao,
  adicionarAdvogadoNaProcuracao,
  removerAdvogadoDaProcuracao,
  desvincularProcesso,
} from "@/app/actions/procuracoes";
import { Modal } from "@/components/ui/modal";
import DocumentoUploadModal from "@/components/documento-upload-modal";
import DocumentosList from "@/components/documentos-list";

const getStatusColor = (status: ProcuracaoStatus) => {
  switch (status) {
    case ProcuracaoStatus.VIGENTE:
      return "success";
    case ProcuracaoStatus.REVOGADA:
      return "danger";
    case ProcuracaoStatus.EXPIRADA:
      return "warning";
    case ProcuracaoStatus.PENDENTE_ASSINATURA:
      return "warning";
    case ProcuracaoStatus.RASCUNHO:
    default:
      return "default";
  }
};

const getStatusLabel = (status: ProcuracaoStatus) => {
  switch (status) {
    case ProcuracaoStatus.VIGENTE:
      return "Vigente";
    case ProcuracaoStatus.REVOGADA:
      return "Revogada";
    case ProcuracaoStatus.EXPIRADA:
      return "Expirada";
    case ProcuracaoStatus.PENDENTE_ASSINATURA:
      return "Pendente Assinatura";
    case ProcuracaoStatus.RASCUNHO:
    default:
      return "Rascunho";
  }
};

const getStatusIcon = (status: ProcuracaoStatus) => {
  switch (status) {
    case ProcuracaoStatus.VIGENTE:
      return <CheckCircle className="h-4 w-4" />;
    case ProcuracaoStatus.REVOGADA:
      return <XCircle className="h-4 w-4" />;
    case ProcuracaoStatus.EXPIRADA:
      return <Clock className="h-4 w-4" />;
    case ProcuracaoStatus.PENDENTE_ASSINATURA:
      return <AlertCircle className="h-4 w-4" />;
    case ProcuracaoStatus.RASCUNHO:
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export default function ProcuracaoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const procuracaoId = params.procuracaoId as string;

  const {
    procuracao,
    isLoading,
    isError,
    error,
    mutate: mutateProcuracao,
  } = useProcuracao(procuracaoId);
  const { advogados: advogadosDisponiveis, isLoading: isLoadingAdvogados } =
    useAdvogadosDisponiveis();

  const [activeTab, setActiveTab] = useState("informacoes");
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddAdvogadoModalOpen, setIsAddAdvogadoModalOpen] = useState(false);
  const [documentosCount, setDocumentosCount] = useState(0);

  // Form state
  const [formData, setFormData] = useState<{
    numero: string;
    observacoes: string;
    emitidaEm: string;
    validaAte: string;
    status: ProcuracaoStatus;
    emitidaPor: ProcuracaoEmitidaPor;
    ativa: boolean;
  }>({
    numero: "",
    observacoes: "",
    emitidaEm: "",
    validaAte: "",
    status: ProcuracaoStatus.RASCUNHO,
    emitidaPor: ProcuracaoEmitidaPor.ESCRITORIO,
    ativa: true,
  });

  // Proteção: Redirecionar se não autorizado
  useEffect(() => {
    if (isError) {
      toast.error("Acesso negado ou procuração não encontrada");
      router.push("/procuracoes");
    }
  }, [isError, router]);

  // Carregar dados no formulário
  useEffect(() => {
    if (procuracao && !isEditing) {
      setFormData({
        numero: procuracao.numero || "",
        observacoes: procuracao.observacoes || "",
        emitidaEm: procuracao.emitidaEm
          ? DateUtils.formatToInput(new Date(procuracao.emitidaEm))
          : "",
        validaAte: procuracao.validaAte
          ? DateUtils.formatToInput(new Date(procuracao.validaAte))
          : "",
        status: procuracao.status,
        emitidaPor: procuracao.emitidaPor,
        ativa: procuracao.ativa,
      });
    }
  }, [procuracao, isEditing]);

  const handleSave = async () => {
    if (!procuracao) return;

    startTransition(async () => {
      try {
        const result = await updateProcuracao(procuracaoId, {
          numero: formData.numero || undefined,
          observacoes: formData.observacoes || undefined,
          emitidaEm: formData.emitidaEm || undefined,
          validaAte: formData.validaAte || undefined,
          status: formData.status,
          emitidaPor: formData.emitidaPor,
          ativa: formData.ativa,
        });

        if (result.success) {
          toast.success("Procuração atualizada com sucesso!");
          setIsEditing(false);
          mutateProcuracao();
        } else {
          toast.error(result.error || "Erro ao atualizar procuração");
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao atualizar procuração");
      }
    });
  };

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deleteProcuracao(procuracaoId);

        if (result.success) {
          toast.success("Procuração excluída com sucesso!");
          router.push("/procuracoes");
        } else {
          toast.error(result.error || "Erro ao excluir procuração");
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao excluir procuração");
      }
    });
  };

  const handleRemoverAdvogado = async (advogadoId: string) => {
    startTransition(async () => {
      try {
        const result = await removerAdvogadoDaProcuracao(
          procuracaoId,
          advogadoId,
        );

        if (result.success) {
          toast.success("Advogado removido da procuração!");
          mutateProcuracao();
        } else {
          toast.error(result.error || "Erro ao remover advogado");
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao remover advogado");
      }
    });
  };

  const handleDesvincularProcesso = async (processoId: string) => {
    startTransition(async () => {
      try {
        const result = await desvincularProcesso(procuracaoId, processoId);

        if (result.success) {
          toast.success("Processo desvinculado da procuração!");
          mutateProcuracao();
        } else {
          toast.error(result.error || "Erro ao desvincular processo");
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao desvincular processo");
      }
    });
  };

  const handleAdicionarAdvogado = async (advogadoId: string) => {
    startTransition(async () => {
      try {
        const result = await adicionarAdvogadoNaProcuracao(
          procuracaoId,
          advogadoId,
        );

        if (result.success) {
          toast.success("Advogado adicionado à procuração!");
          mutateProcuracao();
          setIsAddAdvogadoModalOpen(false);
        } else {
          toast.error(result.error || "Erro ao adicionar advogado");
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao adicionar advogado");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!procuracao) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-danger" />
            <p className="mt-4 text-lg font-semibold">
              Procuração não encontrada
            </p>
            <Button
              as={Link}
              className="mt-4"
              color="primary"
              href="/procuracoes"
            >
              Voltar para Procurações
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            as={Link}
            href="/procuracoes"
            size="sm"
            variant="flat"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className={title({ size: "sm" })}>
              {procuracao.numero || "Procuração sem número"}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Chip
                color={getStatusColor(procuracao.status)}
                size="sm"
                startContent={getStatusIcon(procuracao.status)}
                variant="flat"
              >
                {getStatusLabel(procuracao.status)}
              </Chip>
              {!procuracao.ativa && (
                <Chip color="danger" size="sm" variant="flat">
                  Inativa
                </Chip>
              )}
              {procuracao.emitidaPor === ProcuracaoEmitidaPor.ADVOGADO && (
                <Chip color="warning" size="sm" variant="flat">
                  Emitida por Advogado
                </Chip>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <>
              {procuracao.arquivoUrl && (
                <Button
                  as="a"
                  href={procuracao.arquivoUrl}
                  size="sm"
                  startContent={<Download className="h-4 w-4" />}
                  target="_blank"
                  variant="flat"
                >
                  Baixar PDF
                </Button>
              )}
              <Button
                color="primary"
                size="sm"
                startContent={<Edit className="h-4 w-4" />}
                variant="flat"
                onPress={() => setIsEditing(true)}
              >
                Editar
              </Button>
              <Button
                color="danger"
                size="sm"
                startContent={<Trash2 className="h-4 w-4" />}
                variant="flat"
                onPress={() => setIsDeleteModalOpen(true)}
              >
                Excluir
              </Button>
            </>
          ) : (
            <>
              <Button
                isDisabled={isPending}
                size="sm"
                variant="flat"
                onPress={() => {
                  setIsEditing(false);
                  // Reset form
                  setFormData({
                    numero: procuracao.numero || "",
                    observacoes: procuracao.observacoes || "",
                    emitidaEm: procuracao.emitidaEm
                      ? DateUtils.formatToInput(new Date(procuracao.emitidaEm))
                      : "",
                    validaAte: procuracao.validaAte
                      ? DateUtils.formatToInput(new Date(procuracao.validaAte))
                      : "",
                    status: procuracao.status,
                    emitidaPor: procuracao.emitidaPor,
                    ativa: procuracao.ativa,
                  });
                }}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                isLoading={isPending}
                size="sm"
                startContent={<CheckCircle className="h-4 w-4" />}
                onPress={handleSave}
              >
                Salvar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        aria-label="Abas da procuração"
        className="w-full"
        classNames={{
          tabList:
            "gap-2 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-3 py-2 h-12",
          tabContent: "group-data-[selected=true]:text-primary",
        }}
        color="primary"
        selectedKey={activeTab}
        variant="underlined"
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tab
          key="informacoes"
          title={
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Informações</span>
            </div>
          }
        >
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                <h3 className="text-lg font-semibold">
                  Informações da Procuração
                </h3>
              </div>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  isReadOnly={!isEditing}
                  label="Número"
                  placeholder="Ex: 001/2024"
                  startContent={<FileSignature className="h-4 w-4" />}
                  value={formData.numero}
                  variant={isEditing ? "bordered" : "flat"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, numero: value })
                  }
                />

                <Select
                  isDisabled={!isEditing}
                  label="Status"
                  selectedKeys={[formData.status]}
                  variant={isEditing ? "bordered" : "flat"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as ProcuracaoStatus,
                    })
                  }
                >
                  <SelectItem key={ProcuracaoStatus.RASCUNHO}>
                    Rascunho
                  </SelectItem>
                  <SelectItem key={ProcuracaoStatus.PENDENTE_ASSINATURA}>
                    Pendente Assinatura
                  </SelectItem>
                  <SelectItem key={ProcuracaoStatus.VIGENTE}>
                    Vigente
                  </SelectItem>
                  <SelectItem key={ProcuracaoStatus.EXPIRADA}>
                    Expirada
                  </SelectItem>
                  <SelectItem key={ProcuracaoStatus.REVOGADA}>
                    Revogada
                  </SelectItem>
                </Select>

                <Input
                  isReadOnly={!isEditing}
                  label="Data de Emissão"
                  startContent={<Calendar className="h-4 w-4" />}
                  type="date"
                  value={formData.emitidaEm}
                  variant={isEditing ? "bordered" : "flat"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, emitidaEm: value })
                  }
                />

                <Input
                  isReadOnly={!isEditing}
                  label="Válida Até"
                  startContent={<Clock className="h-4 w-4" />}
                  type="date"
                  value={formData.validaAte}
                  variant={isEditing ? "bordered" : "flat"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, validaAte: value })
                  }
                />

                <Select
                  isDisabled={!isEditing}
                  label="Emitida Por"
                  selectedKeys={[formData.emitidaPor]}
                  variant={isEditing ? "bordered" : "flat"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emitidaPor: e.target.value as ProcuracaoEmitidaPor,
                    })
                  }
                >
                  <SelectItem key={ProcuracaoEmitidaPor.ESCRITORIO}>
                    Escritório
                  </SelectItem>
                  <SelectItem key={ProcuracaoEmitidaPor.ADVOGADO}>
                    Advogado
                  </SelectItem>
                </Select>

                <div className="flex items-center">
                  <Checkbox
                    isDisabled={!isEditing}
                    isSelected={formData.ativa}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ativa: value })
                    }
                  >
                    Procuração Ativa
                  </Checkbox>
                </div>
              </div>

              <Divider />

              <div>
                <h4 className="mb-2 text-sm font-semibold">
                  Cliente (Outorgante)
                </h4>
                <Card className="bg-default-100">
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">
                          {procuracao.cliente.nome}
                        </p>
                        <p className="text-sm text-default-500">
                          {procuracao.cliente.tipoPessoa}
                        </p>
                      </div>
                      <Button
                        as={Link}
                        href={`/clientes/${procuracao.cliente.id}`}
                        size="sm"
                        startContent={<Eye className="h-4 w-4" />}
                        variant="flat"
                      >
                        Ver Cliente
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <Textarea
                isReadOnly={!isEditing}
                label="Observações"
                minRows={3}
                placeholder="Observações sobre a procuração..."
                value={formData.observacoes}
                variant={isEditing ? "bordered" : "flat"}
                onValueChange={(value) =>
                  setFormData({ ...formData, observacoes: value })
                }
              />

              {procuracao.modelo && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Modelo Usado</h4>
                  <Card className="bg-default-100">
                    <CardBody>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold">
                            {procuracao.modelo.nome}
                          </p>
                          {procuracao.modelo.categoria && (
                            <p className="text-sm text-default-500">
                              {procuracao.modelo.categoria}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}

              <Divider />

              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-default-500">Criada em:</span>
                  <span className="font-medium">
                    {DateUtils.formatDateTime(new Date(procuracao.createdAt))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">Última atualização:</span>
                  <span className="font-medium">
                    {DateUtils.formatDateTime(new Date(procuracao.updatedAt))}
                  </span>
                </div>
                {procuracao.assinadaPeloClienteEm && (
                  <div className="flex justify-between">
                    <span className="text-default-500">
                      Assinada pelo cliente:
                    </span>
                    <span className="font-medium">
                      {DateUtils.formatDate(
                        new Date(procuracao.assinadaPeloClienteEm),
                      )}
                    </span>
                  </div>
                )}
                {procuracao.revogadaEm && (
                  <div className="flex justify-between">
                    <span className="text-default-500">Revogada em:</span>
                    <span className="font-medium text-danger">
                      {DateUtils.formatDate(new Date(procuracao.revogadaEm))}
                    </span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="advogados"
          title={
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Advogados</span>
              <Chip size="sm" variant="flat">
                {procuracao.outorgados?.length || 0}
              </Chip>
            </div>
          }
        >
          <Card className="mt-4">
            <CardHeader>
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">
                    Advogados Outorgados
                  </h3>
                </div>
                <Button
                  color="primary"
                  size="sm"
                  startContent={<Plus className="h-4 w-4" />}
                  onPress={() => setIsAddAdvogadoModalOpen(true)}
                >
                  Adicionar Advogado
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {!procuracao.outorgados || procuracao.outorgados.length === 0 ? (
                <div className="py-8 text-center text-default-500">
                  <Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>Nenhum advogado outorgado nesta procuração</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {procuracao.outorgados.map((outorgado: any) => (
                    <Card key={outorgado.id} className="bg-default-50">
                      <CardBody>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {outorgado.advogado.usuario.firstName}{" "}
                                {outorgado.advogado.usuario.lastName}
                              </p>
                              <p className="text-sm text-default-500">
                                OAB: {outorgado.advogado.oabNumero}/
                                {outorgado.advogado.oabUf}
                              </p>
                              <p className="text-sm text-default-500">
                                {outorgado.advogado.usuario.email}
                              </p>
                            </div>
                          </div>
                          <Button
                            color="danger"
                            isLoading={isPending}
                            size="sm"
                            startContent={<Trash2 className="h-4 w-4" />}
                            variant="flat"
                            onPress={() =>
                              handleRemoverAdvogado(outorgado.advogado.id)
                            }
                          >
                            Remover
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="processos"
          title={
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <span>Processos</span>
              <Chip size="sm" variant="flat">
                {procuracao.processos?.length || 0}
              </Chip>
            </div>
          }
        >
          <Card className="mt-4">
            <CardHeader>
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">
                    Processos Vinculados
                  </h3>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {!procuracao.processos || procuracao.processos.length === 0 ? (
                <div className="py-8 text-center text-default-500">
                  <Scale className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>Nenhum processo vinculado a esta procuração</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {procuracao.processos.map((pp: any) => (
                    <Card key={pp.id} className="bg-default-50">
                      <CardBody>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Scale className="h-4 w-4 text-primary" />
                              <p className="font-semibold">
                                {pp.processo.numero}
                              </p>
                              <Chip
                                color={
                                  pp.processo.status === "EM_ANDAMENTO"
                                    ? "primary"
                                    : "default"
                                }
                                size="sm"
                                variant="flat"
                              >
                                {pp.processo.status}
                              </Chip>
                            </div>
                            <p className="mt-1 text-sm text-default-600">
                              {pp.processo.titulo}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              as={Link}
                              href={`/processos/${pp.processo.id}`}
                              size="sm"
                              startContent={<Eye className="h-4 w-4" />}
                              variant="flat"
                            >
                              Ver
                            </Button>
                            <Button
                              color="danger"
                              isLoading={isPending}
                              size="sm"
                              startContent={<Trash2 className="h-4 w-4" />}
                              variant="flat"
                              onPress={() =>
                                handleDesvincularProcesso(pp.processo.id)
                              }
                            >
                              Desvincular
                            </Button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="poderes"
          title={
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              <span>Poderes</span>
              <Chip size="sm" variant="flat">
                {procuracao.poderes?.length || 0}
              </Chip>
            </div>
          }
        >
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Poderes Outorgados</h3>
              </div>
            </CardHeader>
            <CardBody>
              {!procuracao.poderes || procuracao.poderes.length === 0 ? (
                <div className="py-8 text-center text-default-500">
                  <FileSignature className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>Nenhum poder especificado nesta procuração</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {procuracao.poderes.map((poder: any, index: number) => (
                    <Card key={index} className="bg-default-50">
                      <CardBody>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="mt-1 h-4 w-4 text-success" />
                          <div>
                            <p className="font-medium">{poder.titulo}</p>
                            {poder.descricao && (
                              <p className="mt-1 text-sm text-default-500">
                                {poder.descricao}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>

        {/* Tab Documentos */}
        <Tab
          key="documentos"
          title={
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              <span>Documentos</span>
              <Chip size="sm" variant="flat">
                {documentosCount}
              </Chip>
            </div>
          }
        >
          <div className="mt-6 space-y-4">
            {/* Header com ação principal */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  Documentos da Procuração
                </h3>
                <p className="text-sm text-default-500 mt-1">
                  Gerencie os documentos anexados a esta procuração
                </p>
              </div>
              <Button
                className="shrink-0"
                color="primary"
                startContent={<Plus className="h-4 w-4" />}
                onPress={() => setIsUploadModalOpen(true)}
              >
                Anexar Documento
              </Button>
            </div>

            {/* Lista de documentos */}
            <Card>
              <CardBody className="p-0">
                <DocumentosList
                  procuracaoId={procuracaoId}
                  onCountChange={setDocumentosCount}
                />
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        title="Confirmar Exclusão"
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <div className="space-y-4">
          <p>Tem certeza que deseja excluir esta procuração?</p>
          <p className="text-sm text-danger">
            Esta ação não pode ser desfeita. Todos os vínculos com processos e
            advogados serão removidos.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="flat" onPress={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="danger" isLoading={isPending} onPress={handleDelete}>
              Excluir Procuração
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Upload de Documentos */}
      <DocumentoUploadModal
        isOpen={isUploadModalOpen}
        procuracaoId={procuracaoId}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          // Invalidar cache SWR para documentos
          mutate(`documentos-procuracao-${procuracaoId}`);
          // Refresh da página para atualizar outros dados
          mutateProcuracao();
        }}
      />

      {/* Modal de Adicionar Advogado */}
      <Modal
        isOpen={isAddAdvogadoModalOpen}
        title="Adicionar Advogado"
        onClose={() => setIsAddAdvogadoModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-default-600">
            Selecione um advogado para adicionar à procuração:
          </p>

          {isLoadingAdvogados ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {advogadosDisponiveis
                ?.filter(
                  (advogado) =>
                    !procuracao.outorgados?.some(
                      (outorgado) => outorgado.advogado.id === advogado.id,
                    ),
                )
                .map((advogado) => (
                  <Card
                    key={advogado.id}
                    className="cursor-pointer hover:bg-default-50 transition-colors"
                    onClick={() => handleAdicionarAdvogado(advogado.id)}
                  >
                    <CardBody className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">
                            {advogado.usuario.firstName}{" "}
                            {advogado.usuario.lastName}
                          </p>
                          <p className="text-sm text-default-500">
                            OAB: {advogado.oabNumero}/{advogado.oabUf}
                          </p>
                          <p className="text-sm text-default-500">
                            {advogado.usuario.email}
                          </p>
                        </div>
                        <Button
                          color="primary"
                          isLoading={isPending}
                          size="sm"
                          startContent={<Plus className="h-3 w-3" />}
                          variant="flat"
                          onPress={() => handleAdicionarAdvogado(advogado.id)}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}

              {advogadosDisponiveis?.filter(
                (advogado) =>
                  !procuracao.outorgados?.some(
                    (outorgado) => outorgado.advogado.id === advogado.id,
                  ),
              ).length === 0 && (
                <div className="text-center py-8 text-default-500">
                  <Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>Nenhum advogado disponível para adicionar</p>
                  <p className="text-sm">
                    Todos os advogados já estão vinculados a esta procuração
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-default-200">
            <Button
              variant="flat"
              onPress={() => setIsAddAdvogadoModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
