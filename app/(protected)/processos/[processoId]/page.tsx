"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
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
  MapPin,
  DollarSign,
  Gavel,
  Download,
  Eye,
  FileCheck,
  FileWarning,
} from "lucide-react";
import Link from "next/link";
import { useProcessoDetalhado, useDocumentosProcesso, useEventosProcesso } from "@/app/hooks/use-processos";
import { title } from "@/components/primitives";
import { ProcessoStatus } from "@/app/generated/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProcessoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const processoId = params.processoId as string;

  const { processo, isCliente, isLoading, isError } = useProcessoDetalhado(processoId);
  const { documentos, isLoading: isLoadingDocs } = useDocumentosProcesso(processoId);
  const { eventos, isLoading: isLoadingEventos } = useEventosProcesso(processoId);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !processo) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-danger" />
        <p className="text-lg font-semibold text-danger">Erro ao carregar processo</p>
        <Button color="primary" onPress={() => router.back()}>
          Voltar
        </Button>
      </div>
    );
  }

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

  const getProcuracaoStatusColor = (status: string) => {
    switch (status) {
      case "ATIVA":
        return "success";
      case "REVOGADA":
        return "danger";
      case "VENCIDA":
        return "warning";
      default:
        return "default";
    }
  };

  const getProcuracaoStatusLabel = (status: string) => {
    switch (status) {
      case "ATIVA":
        return "Ativa";
      case "REVOGADA":
        return "Revogada";
      case "VENCIDA":
        return "Vencida";
      case "RASCUNHO":
        return "Rascunho";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <Button variant="light" startContent={<ArrowLeft className="h-4 w-4" />} onPress={() => router.back()}>
        Voltar
      </Button>

      {/* Header do Processo */}
      <Card className="border border-default-200">
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Scale className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className={title({ size: "md" })}>{processo.numero}</h1>
                    {processo.titulo && <p className="mt-1 text-sm text-default-500">{processo.titulo}</p>}
                  </div>
                </div>
              </div>
              <Chip size="lg" variant="flat" color={getStatusColor(processo.status)} startContent={getStatusIcon(processo.status)}>
                {getStatusLabel(processo.status)}
              </Chip>
            </div>

            <Divider />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {processo.area && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-default-400" />
                  <span className="text-default-600">{processo.area.nome}</span>
                </div>
              )}
              {processo.vara && (
                <div className="flex items-center gap-2 text-sm">
                  <Gavel className="h-4 w-4 text-default-400" />
                  <span className="text-default-600">{processo.vara}</span>
                </div>
              )}
              {processo.comarca && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-default-400" />
                  <span className="text-default-600">{processo.comarca}</span>
                </div>
              )}
              {processo.valorCausa && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-default-400" />
                  <span className="text-default-600">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(processo.valorCausa)}
                  </span>
                </div>
              )}
              {processo.dataDistribuicao && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-default-400" />
                  <span className="text-default-600">Distribuído em {format(new Date(processo.dataDistribuicao), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              )}
            </div>

            {!isCliente && (
              <>
                <Divider />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-default-400" />
                    <span className="text-sm font-semibold">Cliente:</span>
                    <span className="text-sm text-default-600">{processo.cliente.nome}</span>
                  </div>
                  {processo.advogadoResponsavel && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-default-400" />
                      <span className="text-sm font-semibold">Advogado:</span>
                      <span className="text-sm text-default-600">
                        {processo.advogadoResponsavel.usuario.firstName} {processo.advogadoResponsavel.usuario.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Tabs com Conteúdo */}
      <Tabs aria-label="Informações do Processo" color="primary" variant="underlined">
        {/* Tab de Procurações */}
        <Tab
          key="procuracoes"
          title={
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              <span>Procurações</span>
              {processo.procuracoesVinculadas.length > 0 && (
                <Chip size="sm" variant="flat" color="primary">
                  {processo.procuracoesVinculadas.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-4 space-y-4">
            {processo.procuracoesVinculadas.length === 0 ? (
              <Card className="border border-default-200">
                <CardBody className="py-12 text-center">
                  <FileWarning className="mx-auto h-12 w-12 text-default-300" />
                  <p className="mt-4 text-lg font-semibold text-default-600">Nenhuma procuração vinculada</p>
                  <p className="mt-2 text-sm text-default-400">Este processo ainda não possui procurações associadas.</p>
                </CardBody>
              </Card>
            ) : (
              processo.procuracoesVinculadas.map(({ procuracao }) => (
                <Card key={procuracao.id} className="border border-default-200">
                  <CardHeader className="flex flex-col items-start gap-2 pb-2">
                    <div className="flex w-full items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">Procuração {procuracao.numero || "S/N"}</p>
                        {procuracao.emitidaEm && (
                          <p className="text-xs text-default-400">
                            Emitida em{" "}
                            {format(new Date(procuracao.emitidaEm), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        )}
                      </div>
                      <Chip size="sm" variant="flat" color={getProcuracaoStatusColor(procuracao.status)}>
                        {getProcuracaoStatusLabel(procuracao.status)}
                      </Chip>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody className="gap-4">
                    {procuracao.observacoes && <p className="text-sm text-default-600">{procuracao.observacoes}</p>}

                    {procuracao.validaAte && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-default-400" />
                        <span className="text-default-600">
                          Válida até{" "}
                          {format(new Date(procuracao.validaAte), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    )}

                    {procuracao.outorgados && procuracao.outorgados.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-default-400">Advogados Outorgados:</p>
                        <div className="flex flex-wrap gap-2">
                          {procuracao.outorgados.map((outorgado) => (
                            <Chip key={outorgado.id} size="sm" variant="flat">
                              {outorgado.advogado.usuario.firstName} {outorgado.advogado.usuario.lastName}
                              {outorgado.advogado.oabUf && outorgado.advogado.oabNumero && (
                                <span className="ml-1 text-xs opacity-70">
                                  (OAB {outorgado.advogado.oabUf} {outorgado.advogado.oabNumero})
                                </span>
                              )}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}

                    {procuracao.arquivoUrl && (
                      <div className="flex gap-2">
                        <Button size="sm" color="primary" variant="flat" startContent={<Eye className="h-4 w-4" />} as="a" href={procuracao.arquivoUrl} target="_blank" rel="noopener noreferrer">
                          Visualizar PDF
                        </Button>
                        <Button size="sm" color="primary" variant="bordered" startContent={<Download className="h-4 w-4" />} as="a" href={procuracao.arquivoUrl} download>
                          Baixar
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </Tab>

        {/* Tab de Documentos */}
        <Tab
          key="documentos"
          title={
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Documentos</span>
              {processo._count.documentos > 0 && (
                <Chip size="sm" variant="flat">
                  {processo._count.documentos}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-4 space-y-4">
            {isLoadingDocs ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : !documentos || documentos.length === 0 ? (
              <Card className="border border-default-200">
                <CardBody className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-default-300" />
                  <p className="mt-4 text-lg font-semibold text-default-600">Nenhum documento disponível</p>
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
                          <p className="text-xs text-default-400">{format(new Date(doc.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                        </div>
                        {doc.tamanho && (
                          <Chip size="sm" variant="flat">
                            {(doc.tamanho / 1024).toFixed(2)} KB
                          </Chip>
                        )}
                      </div>
                      {doc.descricao && <p className="text-xs text-default-500">{doc.descricao}</p>}
                      {doc.url && (
                        <Button size="sm" color="primary" variant="flat" startContent={<Eye className="h-3 w-3" />} as="a" href={doc.url} target="_blank" rel="noopener noreferrer">
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

        {/* Tab de Eventos/Audiências */}
        <Tab
          key="eventos"
          title={
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Eventos</span>
              {processo._count.eventos > 0 && (
                <Chip size="sm" variant="flat">
                  {processo._count.eventos}
                </Chip>
              )}
            </div>
          }
        >
          <div className="mt-4 space-y-4">
            {isLoadingEventos ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : !eventos || eventos.length === 0 ? (
              <Card className="border border-default-200">
                <CardBody className="py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-default-300" />
                  <p className="mt-4 text-lg font-semibold text-default-600">Nenhum evento cadastrado</p>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-3">
                {eventos.map((evento: any) => (
                  <Card key={evento.id} className="border border-default-200">
                    <CardBody className="gap-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{evento.titulo}</p>
                          <p className="text-xs text-default-400">
                            {format(new Date(evento.dataInicio), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        {evento.status && (
                          <Chip size="sm" variant="flat" color={evento.status === "CONFIRMADO" ? "success" : "default"}>
                            {evento.status}
                          </Chip>
                        )}
                      </div>
                      {evento.descricao && <p className="text-xs text-default-500">{evento.descricao}</p>}
                      {evento.local && (
                        <div className="flex items-center gap-1 text-xs text-default-400">
                          <MapPin className="h-3 w-3" />
                          <span>{evento.local}</span>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tab>

        {/* Tab de Informações */}
        <Tab
          key="informacoes"
          title={
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Informações</span>
            </div>
          }
        >
          <div className="mt-4 space-y-4">
            <Card className="border border-default-200">
              <CardHeader>
                <h3 className="text-lg font-semibold">Dados do Processo</h3>
              </CardHeader>
              <Divider />
              <CardBody className="gap-3">
                {processo.descricao && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-default-400">Descrição</p>
                    <p className="mt-1 text-sm text-default-600">{processo.descricao}</p>
                  </div>
                )}
                {processo.classeProcessual && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-default-400">Classe Processual</p>
                    <p className="mt-1 text-sm text-default-600">{processo.classeProcessual}</p>
                  </div>
                )}
                {processo.rito && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-default-400">Rito</p>
                    <p className="mt-1 text-sm text-default-600">{processo.rito}</p>
                  </div>
                )}
                {processo.segredoJustica && (
                  <Chip color="warning" variant="flat">
                    Segredo de Justiça
                  </Chip>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
