"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Select, SelectItem } from "@heroui/select";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  Building2,
  Briefcase,
  Calendar,
  Scale,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileStack,
  FileSignature,
  Eye,
  Upload,
  Flag,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useClienteComProcessos, useContratosCliente, useDocumentosCliente, useProcuracoesCliente } from "@/app/hooks/use-clientes";
import { title } from "@/components/primitives";
import { ProcessoStatus, ProcessoFase, ProcessoGrau } from "@/app/generated/prisma";
import { DateUtils } from "@/app/lib/date-utils";
import { Modal } from "@/components/ui/modal";
import { anexarDocumentoCliente } from "@/app/actions/clientes";

export default function ClienteDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const clienteId = params.clienteId as string;

  const { cliente, isLoading, isError, error, mutate: mutateCliente } = useClienteComProcessos(clienteId);
  const { contratos, isLoading: isLoadingContratos } = useContratosCliente(clienteId);
  const { documentos, isLoading: isLoadingDocumentos, mutate: mutateDocumentos } = useDocumentosCliente(clienteId);
  const { procuracoes, isLoading: isLoadingProcuracoes } = useProcuracoesCliente(clienteId);

  // Estados do modal de anexar documento
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    nome: "",
    tipo: "",
    descricao: "",
    processoId: "",
    visivelParaCliente: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Proteção: Redirecionar se não autorizado
  useEffect(() => {
    if (isError) {
      toast.error("Acesso negado ou cliente não encontrado");
      router.push("/clientes");
    }
  }, [isError, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setSelectedFile(file);
      // Preencher nome automaticamente
      if (!uploadFormData.nome) {
        setUploadFormData((prev) => ({ ...prev, nome: file.name }));
      }
    }
  };

  const handleAnexarDocumento = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo");

      return;
    }

    if (!uploadFormData.nome.trim()) {
      toast.error("Nome do documento é obrigatório");

      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      formData.append("nome", uploadFormData.nome);
      formData.append("tipo", uploadFormData.tipo);
      formData.append("descricao", uploadFormData.descricao);
      formData.append("processoId", uploadFormData.processoId);
      formData.append("visivelParaCliente", uploadFormData.visivelParaCliente.toString());
      formData.append("arquivo", selectedFile);

      const result = await anexarDocumentoCliente(clienteId, formData);

      if (result.success) {
        toast.success("Documento anexado com sucesso!");
        setIsUploadModalOpen(false);
        setUploadFormData({
          nome: "",
          tipo: "",
          descricao: "",
          processoId: "",
          visivelParaCliente: false,
        });
        setSelectedFile(null);
        mutateDocumentos();
        mutateCliente();
      } else {
        toast.error(result.error || "Erro ao anexar documento");
      }
    } catch (error) {
      console.error("Erro ao anexar documento:", error);
      toast.error("Erro ao anexar documento");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !cliente) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-danger" />
        <p className="text-lg font-semibold text-danger">Erro ao carregar cliente</p>
        <Button color="primary" onPress={() => router.push("/clientes")}>
          Voltar para Clientes
        </Button>
      </div>
    );
  }

  const getInitials = (nome: string) => {
    const names = nome.split(" ");

    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }

    return nome.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status: ProcessoStatus) => {
    switch (status) {
      case ProcessoStatus.EM_ANDAMENTO:
        return "primary";
      case ProcessoStatus.ENCERRADO:
        return "success";
      case ProcessoStatus.ARQUIVADO:
        return "default";
      case ProcessoStatus.SUSPENSO:
        return "warning";
      case ProcessoStatus.RASCUNHO:
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: ProcessoStatus) => {
    switch (status) {
      case ProcessoStatus.EM_ANDAMENTO:
        return "Em Andamento";
      case ProcessoStatus.ENCERRADO:
        return "Encerrado";
      case ProcessoStatus.ARQUIVADO:
        return "Arquivado";
      case ProcessoStatus.SUSPENSO:
        return "Suspenso";
      case ProcessoStatus.RASCUNHO:
        return "Rascunho";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: ProcessoStatus) => {
    switch (status) {
      case ProcessoStatus.EM_ANDAMENTO:
        return <Clock className="h-4 w-4" />;
      case ProcessoStatus.ENCERRADO:
        return <CheckCircle className="h-4 w-4" />;
      case ProcessoStatus.ARQUIVADO:
        return <XCircle className="h-4 w-4" />;
      case ProcessoStatus.SUSPENSO:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFaseLabel = (fase?: ProcessoFase | null) => {
    if (!fase) return null;
    switch (fase) {
      case ProcessoFase.PETICAO_INICIAL:
        return "Petição Inicial";
      case ProcessoFase.CITACAO:
        return "Citação";
      case ProcessoFase.INSTRUCAO:
        return "Instrução";
      case ProcessoFase.SENTENCA:
        return "Sentença";
      case ProcessoFase.RECURSO:
        return "Recurso";
      case ProcessoFase.EXECUCAO:
        return "Execução";
      default:
        return fase;
    }
  };

  const getGrauLabel = (grau?: ProcessoGrau | null) => {
    if (!grau) return null;
    switch (grau) {
      case ProcessoGrau.PRIMEIRO:
        return "1º Grau";
      case ProcessoGrau.SEGUNDO:
        return "2º Grau";
      case ProcessoGrau.SUPERIOR:
        return "Tribunal Superior";
      default:
        return grau;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Botões */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button as={Link} href="/clientes" startContent={<ArrowLeft className="h-4 w-4" />} variant="light">
          Voltar para Clientes
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button color="primary" startContent={<Upload className="h-4 w-4" />} variant="flat" onPress={() => setIsUploadModalOpen(true)}>
            Anexar Documento
          </Button>
          <Button as={Link} color="primary" href={`/processos/novo?clienteId=${clienteId}`} startContent={<Scale className="h-4 w-4" />} variant="bordered">
            Novo Processo
          </Button>
          <Button as={Link} color="secondary" href={`/contratos/novo?clienteId=${clienteId}`} startContent={<FileText className="h-4 w-4" />} variant="bordered">
            Novo Contrato
          </Button>
          <Button as={Link} color="success" href={`/procuracoes/novo?clienteId=${clienteId}`} startContent={<FileSignature className="h-4 w-4" />} variant="bordered">
            Nova Procuração
          </Button>
        </div>
      </div>

      {/* Header do Cliente */}
      <Card className="border border-default-200">
        <CardBody>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar
              showFallback
              className="h-20 w-20 bg-primary/10 text-primary text-2xl"
              icon={cliente.tipoPessoa === "JURIDICA" ? <Building2 className="h-10 w-10" /> : <User className="h-10 w-10" />}
              name={getInitials(cliente.nome)}
            />
            <div className="flex-1 space-y-4">
              <div>
                <h1 className={title({ size: "md" })}>{cliente.nome}</h1>
                <p className="mt-1 text-sm text-default-500">{cliente.tipoPessoa === "FISICA" ? "Pessoa Física" : "Pessoa Jurídica"}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cliente.documento && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-default-400" />
                    <span className="text-default-600">{cliente.documento}</span>
                  </div>
                )}
                {cliente.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-default-400" />
                    <span className="text-default-600">{cliente.email}</span>
                  </div>
                )}
                {cliente.telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-default-400" />
                    <span className="text-default-600">{cliente.telefone}</span>
                  </div>
                )}
              </div>

              {cliente.observacoes && (
                <div className="rounded-lg bg-default-100 p-3">
                  <p className="text-sm text-default-600">{cliente.observacoes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Chip color="primary" size="sm" variant="flat">
                  {cliente._count?.processos || 0} processos
                </Chip>
                <Chip color="secondary" size="sm" variant="flat">
                  {cliente._count?.contratos || 0} contratos
                </Chip>
                <Chip color="success" size="sm" variant="flat">
                  {procuracoes?.length || 0} procurações
                </Chip>
                <Chip color="warning" size="sm" variant="flat">
                  {cliente._count?.documentos || 0} documentos
                </Chip>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs de Conteúdo */}
      <Tabs aria-label="Informações do Cliente" color="primary" variant="underlined">
        {/* Tab de Processos */}
        <Tab
          key="processos"
          title={
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <span>Processos</span>
              {cliente.processos && cliente.processos.length > 0 && (
                <Chip color="primary" size="sm" variant="flat">
                  {cliente.processos.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-4">
            {!cliente.processos || cliente.processos.length === 0 ? (
              <Card className="border border-default-200">
                <CardBody className="py-12 text-center">
                  <Scale className="mx-auto h-12 w-12 text-default-300" />
                  <p className="mt-4 text-lg font-semibold text-default-600">Nenhum processo cadastrado</p>
                  <p className="mt-2 text-sm text-default-400">Este cliente ainda não possui processos associados.</p>
                </CardBody>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cliente.processos.map((processo) => (
                  <Card
                    key={processo.id}
                    isPressable
                    as={Link}
                    className="border border-default-200 hover:border-primary transition-all hover:shadow-lg cursor-pointer"
                    href={`/processos/${processo.id}`}
                  >
                    <CardHeader className="flex flex-col items-start gap-2 pb-2">
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Chip color={getStatusColor(processo.status as ProcessoStatus)} size="sm" startContent={getStatusIcon(processo.status as ProcessoStatus)} variant="flat">
                            {getStatusLabel(processo.status as ProcessoStatus)}
                          </Chip>
                          {processo.fase && (
                            <Chip color="secondary" size="sm" startContent={<Flag className="h-3 w-3" />} variant="flat">
                              {getFaseLabel(processo.fase as ProcessoFase)}
                            </Chip>
                          )}
                          {processo.grau && (
                            <Chip color="default" size="sm" startContent={<Layers className="h-3 w-3" />} variant="flat">
                              {getGrauLabel(processo.grau as ProcessoGrau)}
                            </Chip>
                          )}
                        </div>
                        {processo._count.procuracoesVinculadas > 0 && (
                          <Chip color="success" size="sm" variant="flat">
                            {processo._count.procuracoesVinculadas} procuração
                            {processo._count.procuracoesVinculadas > 1 ? "ões" : ""}
                          </Chip>
                        )}
                      </div>
                      <div className="w-full">
                        <p className="text-sm font-semibold text-default-700">{processo.numero}</p>
                        {processo.numeroCnj && processo.numeroCnj !== processo.numero && <p className="text-xs text-default-400">CNJ: {processo.numeroCnj}</p>}
                        {processo.titulo && <p className="mt-1 text-xs text-default-500 line-clamp-2">{processo.titulo}</p>}
                      </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="gap-3 pt-3">
                      {processo.area && (
                        <div className="flex items-center gap-2 text-xs">
                          <Briefcase className="h-3 w-3 text-default-400" />
                          <span className="text-default-600">{processo.area.nome}</span>
                        </div>
                      )}
                      {processo.advogadoResponsavel && (
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3 w-3 text-default-400" />
                          <span className="text-default-600">
                            {processo.advogadoResponsavel.usuario.firstName} {processo.advogadoResponsavel.usuario.lastName}
                          </span>
                        </div>
                      )}
                      {processo.dataDistribuicao && (
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3 text-default-400" />
                          <span className="text-default-600">{DateUtils.formatDate(processo.dataDistribuicao)}</span>
                        </div>
                      )}
                      {processo.prazoPrincipal && (
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="h-3 w-3 text-warning" />
                          <span className="text-warning-600">Prazo: {DateUtils.formatDate(processo.prazoPrincipal)}</span>
                        </div>
                      )}

                      <Divider className="my-2" />

                      <div className="flex flex-wrap gap-2">
                        <Chip size="sm" variant="flat">
                          {processo._count.documentos} docs
                        </Chip>
                        <Chip size="sm" variant="flat">
                          {processo._count.eventos} eventos
                        </Chip>
                        <Chip size="sm" variant="flat">
                          {processo._count.movimentacoes} movs
                        </Chip>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tab>

        {/* Tab de Contratos */}
        <Tab
          key="contratos"
          title={
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              <span>Contratos</span>
              {contratos && contratos.length > 0 && (
                <Chip size="sm" variant="flat">
                  {contratos.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-4">
            {isLoadingContratos ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : !contratos || contratos.length === 0 ? (
              <Card className="border border-default-200">
                <CardBody className="py-12 text-center">
                  <FileSignature className="mx-auto h-12 w-12 text-default-300" />
                  <p className="mt-4 text-lg font-semibold text-default-600">Nenhum contrato cadastrado</p>
                  <p className="mt-2 text-sm text-default-400">Este cliente ainda não possui contratos.</p>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-3">
                {contratos.map((contrato: any) => (
                  <Card key={contrato.id} className="border border-default-200">
                    <CardBody className="gap-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{contrato.titulo}</p>
                          {contrato.tipo && <p className="text-xs text-default-400">{contrato.tipo.nome}</p>}
                        </div>
                        <Chip color={contrato.status === "ATIVO" ? "success" : "default"} size="sm" variant="flat">
                          {contrato.status}
                        </Chip>
                      </div>
                      {contrato.valor && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-default-400">Valor:</span>
                          <span className="font-semibold text-default-700">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(contrato.valor)}
                          </span>
                        </div>
                      )}
                      {contrato.dataInicio && <div className="text-xs text-default-500">Início: {DateUtils.formatDate(contrato.dataInicio)}</div>}
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tab>

        {/* Tab de Procurações */}
        <Tab
          key="procuracoes"
          title={
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              <span>Procurações</span>
              {procuracoes.length > 0 && (
                <Chip color="success" size="sm" variant="flat">
                  {procuracoes.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-4">
            {isLoadingProcuracoes ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : procuracoes.length === 0 ? (
              <Card className="border border-default-200">
                <CardBody className="py-12 text-center">
                  <FileSignature className="mx-auto h-12 w-12 text-default-300" />
                  <p className="mt-4 text-lg font-semibold text-default-600">Nenhuma procuração cadastrada</p>
                  <p className="mt-2 text-sm text-default-400">Este cliente ainda não possui procurações associadas.</p>
                </CardBody>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {procuracoes.map((procuracao: any) => (
                  <Card key={procuracao.id} className="border border-default-200 hover:border-success transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-col items-start gap-2 pb-2">
                      <div className="flex w-full items-start justify-between">
                        <Chip
                          color={procuracao.ativa ? "success" : "default"}
                          size="sm"
                          startContent={procuracao.ativa ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          variant="flat"
                        >
                          {procuracao.ativa ? "Ativa" : "Inativa"}
                        </Chip>
                        <Chip color={procuracao.status === "VIGENTE" ? "success" : procuracao.status === "REVOGADA" ? "danger" : "warning"} size="sm" variant="flat">
                          {procuracao.status}
                        </Chip>
                      </div>
                      {procuracao.numero && (
                        <div className="w-full">
                          <p className="text-sm font-semibold text-default-700">#{procuracao.numero}</p>
                        </div>
                      )}
                    </CardHeader>
                    <Divider />
                    <CardBody className="gap-3 pt-3">
                      {procuracao.outorgados && procuracao.outorgados.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-default-500">Outorgados:</p>
                          {procuracao.outorgados.slice(0, 2).map((outorgado: any) => (
                            <div key={outorgado.id} className="flex items-center gap-2 text-xs">
                              <User className="h-3 w-3 text-default-400" />
                              <span className="text-default-600">
                                {outorgado.advogado.usuario.firstName} {outorgado.advogado.usuario.lastName}
                              </span>
                            </div>
                          ))}
                          {procuracao.outorgados.length > 2 && <p className="text-xs text-default-400">+{procuracao.outorgados.length - 2} mais</p>}
                        </div>
                      )}
                      {procuracao.processos && procuracao.processos.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-default-500">Processos vinculados:</p>
                          {procuracao.processos.slice(0, 2).map((proc: any) => (
                            <div key={proc.id} className="flex items-center gap-2 text-xs">
                              <Scale className="h-3 w-3 text-default-400" />
                              <span className="text-default-600 truncate">{proc.processo.numero}</span>
                            </div>
                          ))}
                          {procuracao.processos.length > 2 && <p className="text-xs text-default-400">+{procuracao.processos.length - 2} mais</p>}
                        </div>
                      )}
                      {procuracao.emitidaEm && (
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3 text-default-400" />
                          <span className="text-default-600">Emitida: {DateUtils.formatDate(procuracao.emitidaEm)}</span>
                        </div>
                      )}
                      {procuracao.validaAte && (
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="h-3 w-3 text-default-400" />
                          <span className="text-default-600">Válida até: {DateUtils.formatDate(procuracao.validaAte)}</span>
                        </div>
                      )}
                      {procuracao.arquivoUrl && (
                        <Button
                          as="a"
                          className="mt-2"
                          color="success"
                          href={procuracao.arquivoUrl}
                          rel="noopener noreferrer"
                          size="sm"
                          startContent={<Eye className="h-3 w-3" />}
                          target="_blank"
                          variant="flat"
                        >
                          Visualizar
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tab>

        {/* Tab de Documentos (TODOS) */}
        <Tab
          key="documentos"
          title={
            <div className="flex items-center gap-2">
              <FileStack className="h-4 w-4" />
              <span>Documentos</span>
              {documentos && documentos.length > 0 && (
                <Chip size="sm" variant="flat">
                  {documentos.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-4">
            {isLoadingDocumentos ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : !documentos || documentos.length === 0 ? (
              <Card className="border border-default-200">
                <CardBody className="py-12 text-center">
                  <FileStack className="mx-auto h-12 w-12 text-default-300" />
                  <p className="mt-4 text-lg font-semibold text-default-600">Nenhum documento cadastrado</p>
                  <p className="mt-2 text-sm text-default-400">Este cliente ainda não possui documentos.</p>
                </CardBody>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {documentos.map((doc: any) => (
                  <Card key={doc.id} className="border border-default-200">
                    <CardBody className="gap-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{doc.titulo || doc.nomeArquivo}</p>
                          <p className="text-xs text-default-400">{DateUtils.formatDate(doc.createdAt)}</p>
                        </div>
                        {doc.tamanho && (
                          <Chip size="sm" variant="flat">
                            {(doc.tamanho / 1024).toFixed(2)} KB
                          </Chip>
                        )}
                      </div>
                      {doc.processo && (
                        <div className="flex items-center gap-1 text-xs text-default-500">
                          <Scale className="h-3 w-3" />
                          <span>Processo: {doc.processo.numero}</span>
                        </div>
                      )}
                      {doc.descricao && <p className="text-xs text-default-500 line-clamp-2">{doc.descricao}</p>}
                      {doc.url && (
                        <Button as="a" className="mt-2" color="primary" href={doc.url} rel="noopener noreferrer" size="sm" startContent={<Eye className="h-3 w-3" />} target="_blank" variant="flat">
                          Visualizar
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tab>
      </Tabs>

      {/* Modal de Anexar Documento */}
      <Modal
        footer={
          <div className="flex gap-2">
            <Button variant="light" onPress={() => setIsUploadModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={isUploading} startContent={!isUploading ? <Upload className="h-4 w-4" /> : undefined} onPress={handleAnexarDocumento}>
              Anexar Documento
            </Button>
          </div>
        }
        isOpen={isUploadModalOpen}
        size="2xl"
        title="📎 Anexar Documento"
        onOpenChange={setIsUploadModalOpen}
      >
        <div className="space-y-4">
          {/* Upload de Arquivo */}
          <div className="rounded-lg border-2 border-dashed border-default-300 p-6 text-center hover:border-primary transition-colors">
            <input accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" className="hidden" id="file-upload" type="file" onChange={handleFileChange} />
            <label className="cursor-pointer" htmlFor="file-upload">
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="mx-auto h-12 w-12 text-success" />
                  <p className="text-sm font-semibold text-success">{selectedFile.name}</p>
                  <p className="text-xs text-default-400">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  <Button size="sm" variant="flat" onPress={() => setSelectedFile(null)}>
                    Trocar Arquivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-12 w-12 text-default-300" />
                  <p className="text-sm font-semibold">Clique para selecionar um arquivo</p>
                  <p className="text-xs text-default-400">PDF, DOC, DOCX, JPG, PNG, XLS, XLSX</p>
                </div>
              )}
            </label>
          </div>

          {/* Formulário */}
          <Input
            isRequired
            label="Nome do Documento *"
            placeholder="Ex: Contrato Social, RG, CPF..."
            value={uploadFormData.nome}
            onValueChange={(value) => setUploadFormData((prev) => ({ ...prev, nome: value }))}
          />

          <Input label="Tipo" placeholder="Ex: Contrato, Identidade, Comprovante..." value={uploadFormData.tipo} onValueChange={(value) => setUploadFormData((prev) => ({ ...prev, tipo: value }))} />

          <Textarea
            label="Descrição"
            maxRows={4}
            minRows={2}
            placeholder="Observações sobre o documento..."
            value={uploadFormData.descricao}
            onValueChange={(value) => setUploadFormData((prev) => ({ ...prev, descricao: value }))}
          />

          {/* Vincular a Processo (opcional) */}
          {cliente?.processos && cliente.processos.length > 0 && (
            <Select
              label="Vincular a Processo (opcional)"
              placeholder="Selecione um processo"
              selectedKeys={uploadFormData.processoId ? [uploadFormData.processoId] : []}
              onSelectionChange={(keys) =>
                setUploadFormData((prev) => ({
                  ...prev,
                  processoId: Array.from(keys)[0] as string,
                }))
              }
            >
              {cliente.processos.map((processo) => (
                <SelectItem key={processo.id}>{processo.numero}</SelectItem>
              ))}
            </Select>
          )}

          <Checkbox
            isSelected={uploadFormData.visivelParaCliente}
            onValueChange={(checked) =>
              setUploadFormData((prev) => ({
                ...prev,
                visivelParaCliente: checked,
              }))
            }
          >
            <div className="flex flex-col">
              <span className="text-sm">Visível para o cliente</span>
              <span className="text-xs text-default-400">O cliente poderá visualizar este documento na área dele</span>
            </div>
          </Checkbox>

          {/* Informações */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs text-primary-600">
              💡 O documento será anexado a {cliente.nome}. {uploadFormData.processoId && "Será vinculado ao processo selecionado."}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
