"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Scale, Briefcase, Calendar, Clock, AlertCircle, CheckCircle, XCircle, User, FileText } from "lucide-react";
import Link from "next/link";
import { useAllProcessos } from "@/app/hooks/use-processos";
import { title } from "@/components/primitives";
import { ProcessoStatus } from "@/app/generated/prisma";
import { DateUtils } from "@/app/lib/date-utils";

export function ProcessosContent() {
  const { processos, isLoading, isError } = useAllProcessos();

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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-danger" />
        <p className="text-lg font-semibold text-danger">Erro ao carregar processos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className={title({ size: "lg", color: "blue" })}>Meus Processos</h1>
        <p className="mt-2 text-sm text-default-500">Acompanhe o andamento dos seus processos</p>
      </header>

      {/* Lista de Processos */}
      {!processos || processos.length === 0 ? (
        <Card className="border border-default-200">
          <CardBody className="py-12 text-center">
            <Scale className="mx-auto h-12 w-12 text-default-300" />
            <p className="mt-4 text-lg font-semibold text-default-600">Nenhum processo encontrado</p>
            <p className="mt-2 text-sm text-default-400">Você ainda não possui processos cadastrados.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processos.map((processo: any) => (
            <Card key={processo.id} className="border border-default-200 hover:border-primary transition-all hover:shadow-lg cursor-pointer" isPressable as={Link} href={`/processos/${processo.id}`}>
              <CardHeader className="flex flex-col items-start gap-2 pb-2">
                <div className="flex w-full items-start justify-between">
                  <Chip size="sm" variant="flat" color={getStatusColor(processo.status)} startContent={getStatusIcon(processo.status)}>
                    {getStatusLabel(processo.status)}
                  </Chip>
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
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
