"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { ArrowLeft, User, Mail, Phone, FileText, Building2, Briefcase, Calendar, Scale, Clock, AlertCircle, CheckCircle, XCircle, FileStack, FileSignature, Eye } from "lucide-react";
import Link from "next/link";
import { useClienteComProcessos, useContratosCliente, useDocumentosCliente } from "@/app/hooks/use-clientes";
import { title } from "@/components/primitives";
import { ProcessoStatus } from "@/app/generated/prisma";
import { DateUtils } from "@/app/lib/date-utils";
import { useEffect } from "react";
import { toast } from "sonner";

export default function ClienteDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const clienteId = params.clienteId as string;

  const { cliente, isLoading, isError, error } = useClienteComProcessos(clienteId);
  const { contratos, isLoading: isLoadingContratos } = useContratosCliente(clienteId);
  const { documentos, isLoading: isLoadingDocumentos } = useDocumentosCliente(clienteId);

  // Proteção: Redirecionar se não autorizado
  useEffect(() => {
    if (isError) {
      toast.error("Acesso negado ou cliente não encontrado");
      router.push("/clientes");
    }
  }, [isError, router]);

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
      case ProcessoStatus.FINALIZADO:
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
      case ProcessoStatus.FINALIZADO:
        return "Finalizado";
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
      case ProcessoStatus.FINALIZADO:
        return <CheckCircle className="h-4 w-4" />;
      case ProcessoStatus.ARQUIVADO:
        return <XCircle className="h-4 w-4" />;
      case ProcessoStatus.SUSPENSO:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <Button as={Link} href="/clientes" variant="light" startContent={<ArrowLeft className="h-4 w-4" />}>
        Voltar para Clientes
      </Button>

      {/* Header do Cliente */}
      <Card className="border border-default-200">
        <CardBody>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar
              showFallback
              name={getInitials(cliente.nome)}
              className="h-20 w-20 bg-primary/10 text-primary text-2xl"
              icon={cliente.tipoPessoa === "JURIDICA" ? <Building2 className="h-10 w-10" /> : <User className="h-10 w-10" />}
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

              <div className="flex gap-2">
                <Chip size="sm" variant="flat" color="primary">
                  {cliente._count?.processos || 0} processos
                </Chip>
                <Chip size="sm" variant="flat" color="secondary">
                  {cliente._count?.contratos || 0} contratos
                </Chip>
                <Chip size="sm" variant="flat" color="success">
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
                <Chip size="sm" variant="flat" color="primary">
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
                    className="border border-default-200 hover:border-primary transition-all hover:shadow-lg cursor-pointer"
                    isPressable
                    as={Link}
                    href={`/processos/${processo.id}`}
                  >
                    <CardHeader className="flex flex-col items-start gap-2 pb-2">
                      <div className="flex w-full items-start justify-between">
                        <Chip size="sm" variant="flat" color={getStatusColor(processo.status)} startContent={getStatusIcon(processo.status)}>
                          {getStatusLabel(processo.status)}
                        </Chip>
                        {processo._count.procuracoesVinculadas > 0 && (
                          <Chip size="sm" variant="flat" color="success">
                            {processo._count.procuracoesVinculadas} procuração{processo._count.procuracoesVinculadas > 1 ? "ões" : ""}
                          </Chip>
                        )}
                      </div>
                      <div className="w-full">
                        <p className="text-sm font-semibold text-default-700">{processo.numero}</p>
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
                        <Chip size="sm" variant="flat" color={contrato.status === "ATIVO" ? "success" : "default"}>
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
                        <Button size="sm" color="primary" variant="flat" startContent={<Eye className="h-3 w-3" />} as="a" href={doc.url} target="_blank" rel="noopener noreferrer" className="mt-2">
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
    </div>
  );
}
