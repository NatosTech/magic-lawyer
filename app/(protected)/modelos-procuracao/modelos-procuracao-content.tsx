"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { AlertCircle, Plus, Search, MoreVertical, Edit, Eye, FileText, Copy, Download } from "lucide-react";

import { useUserPermissions } from "@/app/hooks/use-user-permissions";
import { useAllModelosProcuracao } from "@/app/hooks/use-modelos-procuracao";
import { DateUtils } from "@/app/lib/date-utils";
import { title, subtitle } from "@/components/primitives";

export function ModelosProcuracaoContent() {
  const router = useRouter();
  const { modelos, isLoading, isError, error, refresh } = useAllModelosProcuracao();
  const { permissions } = useUserPermissions();

  const [filtros, setFiltros] = useState({
    search: "",
    categoria: "",
    ativo: "",
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Filtros únicos para selects
  const categoriasUnicas = Array.from(new Set(modelos?.map((m) => m.categoria).filter(Boolean) || []));

  // Aplicar filtros
  const modelosFiltrados =
    modelos?.filter((modelo) => {
      if (filtros.search && !modelo.nome.toLowerCase().includes(filtros.search.toLowerCase()) && !modelo.descricao?.toLowerCase().includes(filtros.search.toLowerCase())) {
        return false;
      }
      if (filtros.categoria && modelo.categoria !== filtros.categoria) return false;
      if (filtros.ativo && modelo.ativo.toString() !== filtros.ativo) return false;

      return true;
    }) || [];

  const limparFiltros = () => {
    setFiltros({
      search: "",
      categoria: "",
      ativo: "",
    });
  };

  const temFiltrosAtivos = Object.values(filtros).some((valor) => valor !== "");

  const getCategoriaColor = (categoria: string | null) => {
    switch (categoria) {
      case "PREFERITURA":
        return "primary";
      case "PESSOA_FISICA":
        return "success";
      case "CRIMINAL":
        return "warning";
      case "CIVIL":
        return "secondary";
      default:
        return "default";
    }
  };

  const getCategoriaLabel = (categoria: string | null) => {
    switch (categoria) {
      case "PREFERITURA":
        return "Prefeitura";
      case "PESSOA_FISICA":
        return "Pessoa Física";
      case "CRIMINAL":
        return "Criminal";
      case "CIVIL":
        return "Civil";
      default:
        return categoria || "Sem categoria";
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
        <p className="text-danger">Erro ao carregar modelos de procuração</p>
        <p className="text-small text-default-500">{error?.message}</p>
      </div>
    );
  }

  if (!modelos) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <FileText className="h-12 w-12 text-default-400" />
        <p className="text-default-500">Nenhum modelo de procuração encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>Modelos de Procuração</h1>
          <p className={subtitle({ fullWidth: true })}>
            {modelosFiltrados.length} de {modelos.length} modelos
            {temFiltrosAtivos && " (filtrados)"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button startContent={<Search className="h-4 w-4" />} variant="bordered" onPress={() => setMostrarFiltros(!mostrarFiltros)}>
            Filtros
          </Button>

          {permissions.canViewAllClients && (
            <Button color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => router.push("/modelos-procuracao/novo")}>
              Novo Modelo
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                placeholder="Buscar por nome ou descrição..."
                startContent={<Search className="h-4 w-4 text-default-400" />}
                value={filtros.search}
                onValueChange={(value) => setFiltros((prev) => ({ ...prev, search: value }))}
              />

              <Select
                placeholder="Categoria"
                selectedKeys={filtros.categoria ? [filtros.categoria] : []}
                onSelectionChange={(keys) =>
                  setFiltros((prev) => ({
                    ...prev,
                    categoria: (Array.from(keys)[0] as string) || "",
                  }))
                }
              >
                {categoriasUnicas.map((categoria) => (
                  <SelectItem key={categoria}>{getCategoriaLabel(categoria)}</SelectItem>
                ))}
              </Select>

              <Select
                placeholder="Status"
                selectedKeys={filtros.ativo ? [filtros.ativo] : []}
                onSelectionChange={(keys) =>
                  setFiltros((prev) => ({
                    ...prev,
                    ativo: (Array.from(keys)[0] as string) || "",
                  }))
                }
              >
                <SelectItem key="true">Ativo</SelectItem>
                <SelectItem key="false">Inativo</SelectItem>
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

      {/* Lista de Modelos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelosFiltrados.map((modelo) => (
          <Card key={modelo.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{modelo.nome}</span>
              </div>

              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem key="view" startContent={<Eye className="h-4 w-4" />} onPress={() => router.push(`/modelos-procuracao/${modelo.id}`)}>
                    Ver Detalhes
                  </DropdownItem>
                  {permissions.canViewAllClients ? (
                    <DropdownItem key="edit" startContent={<Edit className="h-4 w-4" />} onPress={() => router.push(`/modelos-procuracao/${modelo.id}/editar`)}>
                      Editar
                    </DropdownItem>
                  ) : null}
                  <DropdownItem
                    key="copy"
                    startContent={<Copy className="h-4 w-4" />}
                    onPress={() => {
                      // Implementar cópia do modelo
                      console.log("Copiar modelo:", modelo.id);
                    }}
                  >
                    Duplicar
                  </DropdownItem>
                  <DropdownItem
                    key="download"
                    startContent={<Download className="h-4 w-4" />}
                    onPress={() => {
                      // Implementar download do template
                      console.log("Download template:", modelo.id);
                    }}
                  >
                    Baixar Template
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </CardHeader>

            <CardBody className="space-y-3">
              {modelo.descricao && <p className="text-small text-default-600 line-clamp-2">{modelo.descricao}</p>}

              <div className="flex items-center justify-between">
                <Chip color={getCategoriaColor(modelo.categoria)} size="sm" variant="flat">
                  {getCategoriaLabel(modelo.categoria)}
                </Chip>

                <Chip color={modelo.ativo ? "success" : "default"} size="sm" variant="flat">
                  {modelo.ativo ? "Ativo" : "Inativo"}
                </Chip>
              </div>

              <div className="text-small text-default-500">
                <span className="font-medium">Usado em:</span> {modelo._count.procuracoes} procuração(ões)
              </div>

              <div className="text-small text-default-500">Criado em {DateUtils.formatDate(modelo.createdAt)}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      {modelosFiltrados.length === 0 && temFiltrosAtivos && (
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <Search className="h-8 w-8 text-default-400" />
          <p className="text-default-500">Nenhum modelo encontrado com os filtros aplicados</p>
          <Button size="sm" variant="light" onPress={limparFiltros}>
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}
