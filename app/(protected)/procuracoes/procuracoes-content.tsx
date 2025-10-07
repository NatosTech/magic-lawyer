"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAllProcuracoes } from "@/app/hooks/use-procuracoes";
import { useUserPermissions } from "@/app/hooks/use-user-permissions";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { AlertCircle, Plus, Search, MoreVertical, Edit, Trash2, Eye, FileText, User, Building2, Calendar, Download } from "lucide-react";
import { DateUtils } from "@/app/lib/date-utils";

export function ProcuracoesContent() {
  const router = useRouter();
  const { procuracoes, isLoading, isError, error } = useAllProcuracoes();
  const permissions = useUserPermissions();

  const [filtros, setFiltros] = useState({
    search: "",
    status: "",
    clienteId: "",
    advogadoId: "",
    emitidaPor: "",
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Filtros únicos para selects
  const statusUnicos = [...new Set(procuracoes?.map((p) => p.status) || [])];
  const emitidaPorUnicos = [...new Set(procuracoes?.map((p) => p.emitidaPor) || [])];

  // Aplicar filtros
  const procuracoesFiltradas =
    procuracoes?.filter((procuracao) => {
      if (filtros.search && !procuracao.numero?.toLowerCase().includes(filtros.search.toLowerCase()) && !procuracao.cliente.nome.toLowerCase().includes(filtros.search.toLowerCase())) {
        return false;
      }
      if (filtros.status && procuracao.status !== filtros.status) return false;
      if (filtros.clienteId && procuracao.clienteId !== filtros.clienteId) return false;
      if (filtros.emitidaPor && procuracao.emitidaPor !== filtros.emitidaPor) return false;
      return true;
    }) || [];

  const limparFiltros = () => {
    setFiltros({
      search: "",
      status: "",
      clienteId: "",
      advogadoId: "",
      emitidaPor: "",
    });
  };

  const temFiltrosAtivos = Object.values(filtros).some((valor) => valor !== "");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VIGENTE":
        return "success";
      case "RASCUNHO":
        return "default";
      case "PENDENTE_ASSINATURA":
        return "warning";
      case "REVOGADA":
        return "danger";
      case "EXPIRADA":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "VIGENTE":
        return "Vigente";
      case "RASCUNHO":
        return "Rascunho";
      case "PENDENTE_ASSINATURA":
        return "Pendente Assinatura";
      case "REVOGADA":
        return "Revogada";
      case "EXPIRADA":
        return "Expirada";
      default:
        return status;
    }
  };

  const getEmitidaPorLabel = (emitidaPor: string) => {
    switch (emitidaPor) {
      case "ESCRITORIO":
        return "Escritório";
      case "ADVOGADO":
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
          <Button variant="bordered" startContent={<Search className="h-4 w-4" />} onPress={() => setMostrarFiltros(!mostrarFiltros)}>
            Filtros
          </Button>

          {permissions.canViewAllClients && (
            <Button color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => router.push("/procuracoes/novo")}>
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
                value={filtros.search}
                onValueChange={(value) => setFiltros((prev) => ({ ...prev, search: value }))}
                startContent={<Search className="h-4 w-4 text-default-400" />}
              />

              <Select
                placeholder="Status"
                selectedKeys={filtros.status ? [filtros.status] : []}
                onSelectionChange={(keys) => setFiltros((prev) => ({ ...prev, status: (Array.from(keys)[0] as string) || "" }))}
              >
                {statusUnicos.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
              </Select>

              <Select
                placeholder="Emitida por"
                selectedKeys={filtros.emitidaPor ? [filtros.emitidaPor] : []}
                onSelectionChange={(keys) => setFiltros((prev) => ({ ...prev, emitidaPor: (Array.from(keys)[0] as string) || "" }))}
              >
                {emitidaPorUnicos.map((emitidaPor) => (
                  <SelectItem key={emitidaPor} value={emitidaPor}>
                    {getEmitidaPorLabel(emitidaPor)}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {temFiltrosAtivos && (
              <div className="flex justify-end">
                <Button variant="light" size="sm" onPress={limparFiltros}>
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
                  <Button isIconOnly variant="light" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem key="view" startContent={<Eye className="h-4 w-4" />} onPress={() => router.push(`/procuracoes/${procuracao.id}`)}>
                    Ver Detalhes
                  </DropdownItem>
                  {permissions.canViewAllClients && (
                    <DropdownItem key="edit" startContent={<Edit className="h-4 w-4" />} onPress={() => router.push(`/procuracoes/${procuracao.id}/editar`)}>
                      Editar
                    </DropdownItem>
                  )}
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
                <Chip size="sm" color={getStatusColor(procuracao.status)} variant="flat">
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
          <Button variant="light" size="sm" onPress={limparFiltros}>
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}
