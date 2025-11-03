"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Select, SelectItem, Input, Button, Spinner } from "@heroui/react";
import { Search, Download } from "lucide-react";
import useSWR from "swr";

import { getPermissoesNegadas, type PermissaoNegadaData } from "@/app/actions/auditoria-permissoes";

export function PermissoesNegadasTable() {
  const [filters, setFilters] = useState({
    modulo: "",
    acao: "",
    origem: "",
    page: 0,
    limit: 20,
  });

  const { data, isLoading, error } = useSWR(
    ["permissoes-negadas", filters],
    () => getPermissoesNegadas(filters),
    {
      revalidateOnFocus: false,
    },
  );

  const getOrigemLabel = (origem: string) => {
    switch (origem) {
      case "override":
        return "Override";
      case "cargo":
        return "Cargo";
      case "role":
        return "Role";
      default:
        return origem;
    }
  };

  const getOrigemColor = (origem: string): "default" | "primary" | "secondary" | "danger" => {
    switch (origem) {
      case "override":
        return "primary";
      case "cargo":
        return "secondary";
      case "role":
        return "default";
      default:
        return "default";
    }
  };

  const handleExportCSV = (records: PermissaoNegadaData[]) => {
    // Criar cabeçalho CSV
    const headers = [
      "Data/Hora",
      "Usuário",
      "Email",
      "Módulo",
      "Ação",
      "Origem",
      "Role",
      "Cargo ID",
    ];

    // Criar linhas CSV
    const rows = records.map((item) => [
      new Date(item.createdAt).toISOString(),
      `${item.usuario.firstName || ""} ${item.usuario.lastName || ""}`.trim() || item.usuario.email,
      item.usuario.email,
      item.modulo,
      item.acao,
      item.origem,
      item.role,
      item.cargoId || "",
    ]);

    // Combinar tudo
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const value = String(cell);
            // Escapar vírgulas e aspas
            if (value.includes(",") || value.includes('"') || value.includes("\n")) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(","),
      ),
    ].join("\n");

    // Criar blob e fazer download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `permissoes-negadas-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <Card className="border-danger/20 bg-danger/5">
        <CardBody>
          <p className="text-danger">
            Erro ao carregar histórico: {error.message || "Erro desconhecido"}
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Histórico de Recusas</h2>
        {data?.data && data.data.length > 0 && (
          <Button
            variant="flat"
            color="primary"
            startContent={<Download className="w-4 h-4" />}
            onPress={() => handleExportCSV(data.data)}
          >
            Exportar CSV
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input
            placeholder="Filtrar por módulo..."
            value={filters.modulo}
            onChange={(e) =>
              setFilters({ ...filters, modulo: e.target.value, page: 0 })
            }
            startContent={<Search className="w-4 h-4" />}
          />
          <Input
            placeholder="Filtrar por ação..."
            value={filters.acao}
            onChange={(e) =>
              setFilters({ ...filters, acao: e.target.value, page: 0 })
            }
          />
          <Select
            placeholder="Filtrar por origem"
            selectedKeys={filters.origem ? [filters.origem] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setFilters({
                ...filters,
                origem: selected || "",
                page: 0,
              });
            }}
          >
            <SelectItem key="override" value="override">
              Override
            </SelectItem>
            <SelectItem key="cargo" value="cargo">
              Cargo
            </SelectItem>
            <SelectItem key="role" value="role">
              Role
            </SelectItem>
          </Select>
          <Button
            variant="flat"
            onPress={() =>
              setFilters({ modulo: "", acao: "", origem: "", page: 0, limit: 20 })
            }
          >
            Limpar Filtros
          </Button>
        </div>

        {/* Tabela */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="text-center py-12 text-default-500">
            Nenhuma recusa de permissão encontrada
          </div>
        ) : (
          <>
            <Table aria-label="Histórico de permissões negadas">
              <TableHeader>
                <TableColumn>Data/Hora</TableColumn>
                <TableColumn>Usuário</TableColumn>
                <TableColumn>Módulo</TableColumn>
                <TableColumn>Ação</TableColumn>
                <TableColumn>Origem</TableColumn>
                <TableColumn>Role</TableColumn>
              </TableHeader>
              <TableBody>
                {data.data.map((item: PermissaoNegadaData) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {item.usuario.firstName || item.usuario.lastName
                        ? `${item.usuario.firstName || ""} ${item.usuario.lastName || ""}`.trim()
                        : item.usuario.email}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{item.modulo}</span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{item.acao}</span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getOrigemColor(item.origem)}
                      >
                        {getOrigemLabel(item.origem)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{item.role}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginação */}
            {data.total && data.total > filters.limit && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-default-500">
                  Mostrando {filters.page * filters.limit + 1} -{" "}
                  {Math.min((filters.page + 1) * filters.limit, data.total)} de{" "}
                  {data.total}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    isDisabled={filters.page === 0}
                    onPress={() => setFilters({ ...filters, page: filters.page - 1 })}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    isDisabled={
                      !data.total ||
                      (filters.page + 1) * filters.limit >= data.total
                    }
                    onPress={() => setFilters({ ...filters, page: filters.page + 1 })}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

