"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Badge } from "@heroui/badge";
import { Chip } from "@heroui/chip";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Select, SelectItem } from "@heroui/select";
// import { Textarea } from "@heroui/textarea";
import { title, subtitle } from "@/components/primitives";
import { useUserPermissions } from "@/app/hooks/use-user-permissions";
import { PermissionGuard } from "@/components/permission-guard";
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Star, MapPin, Scale, User } from "lucide-react";
import { Spinner } from "@heroui/spinner";
import { useJuizes, useJuizFormData } from "@/app/hooks/use-juizes";
import { deleteJuiz } from "@/app/actions/juizes";
import { toast } from "sonner";
import { EspecialidadeJuridica, JuizStatus, JuizNivel } from "@/app/generated/prisma";
import type { JuizFilters } from "@/app/actions/juizes";

export function JuizesContent() {
  const { permissions } = useUserPermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEspecialidade, setSelectedEspecialidade] = useState<string>("all");
  const [selectedNivel, setSelectedNivel] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedJuiz, setSelectedJuiz] = useState<any>(null);

  // Buscar dados do formulário
  const { formData, isLoading: isLoadingFormData } = useJuizFormData();

  // Construir filtros
  const filters: JuizFilters = {
    search: searchTerm || undefined,
    status: selectedStatus !== "all" ? (selectedStatus as JuizStatus) : undefined,
    especialidade: selectedEspecialidade !== "all" ? (selectedEspecialidade as EspecialidadeJuridica) : undefined,
    nivel: selectedNivel !== "all" ? (selectedNivel as JuizNivel) : undefined,
  };

  // Buscar juízes com filtros
  const { juizes, isLoading, error, mutate } = useJuizes(filters);

  const especialidadesOptions =
    formData?.especialidades?.map((esp) => ({
      key: esp,
      label: esp
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase()),
    })) || [];

  const statusOptions = [
    { key: "all", label: "Todos" },
    ...(formData?.status?.map((status) => ({
      key: status,
      label: status === "ATIVO" ? "Ativo" : status === "INATIVO" ? "Inativo" : status === "APOSENTADO" ? "Aposentado" : status === "SUSPENSO" ? "Suspenso" : status,
    })) || []),
  ];

  const nivelOptions = [
    { key: "all", label: "Todos" },
    ...(formData?.niveis?.map((nivel) => ({
      key: nivel,
      label: nivel
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase()),
    })) || []),
  ];

  const getStatusColor = (status: JuizStatus) => {
    switch (status) {
      case JuizStatus.ATIVO:
        return "success";
      case JuizStatus.INATIVO:
        return "default";
      case JuizStatus.APOSENTADO:
        return "warning";
      case JuizStatus.SUSPENSO:
        return "danger";
      default:
        return "default";
    }
  };

  const getNivelColor = (nivel: JuizNivel) => {
    switch (nivel) {
      case JuizNivel.MINISTRO:
        return "danger";
      case JuizNivel.DESEMBARGADOR:
        return "primary";
      case JuizNivel.JUIZ_TITULAR:
        return "secondary";
      case JuizNivel.JUIZ_SUBSTITUTO:
        return "default";
      default:
        return "default";
    }
  };

  const handleDeleteJuiz = async (juizId: string) => {
    if (!confirm("Tem certeza que deseja excluir este juiz?")) return;

    try {
      const result = await deleteJuiz(juizId);

      if (result.success) {
        toast.success("Juiz excluído com sucesso!");
        mutate(); // Revalidar dados
      } else {
        toast.error(result.error || "Erro ao excluir juiz");
      }
    } catch (error) {
      toast.error("Erro ao excluir juiz");
    }
  };

  const handleViewJuiz = (juiz: any) => {
    setSelectedJuiz(juiz);
    // TODO: Implementar modal de visualização
    toast.info("Modal de visualização será implementado");
  };

  const handleEditJuiz = (juiz: any) => {
    setSelectedJuiz(juiz);
    setIsEditModalOpen(true);
  };

  if (isLoadingFormData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    );
  }

  return (
    <PermissionGuard permission="canManageTeam">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-12 px-3 sm:px-6">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Base de Juízes</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className={title({ size: "lg", color: "blue" })}>Gestão de Juízes</h1>
              <p className={subtitle({ fullWidth: true })}>Base de dados de juízes, suas especialidades e histórico de julgamentos.</p>
            </div>
            {permissions.canManageTeam && (
              <Button color="primary" startContent={<Plus className="w-4 h-4" />} onPress={() => setIsCreateModalOpen(true)} className="flex-shrink-0">
                Novo Juiz
              </Button>
            )}
          </div>
        </header>

        {/* Filtros */}
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <div className="flex-1 min-w-0">
                <Input
                  placeholder="Buscar por nome, vara, comarca..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  startContent={<Search className="w-4 h-4 text-default-400" />}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select placeholder="Status" selectedKeys={[selectedStatus]} onSelectionChange={(keys) => setSelectedStatus(Array.from(keys)[0] as string)} className="w-32" items={statusOptions}>
                  {(status) => <SelectItem key={status.key}>{status.label}</SelectItem>}
                </Select>
                <Select
                  placeholder="Especialidade"
                  selectedKeys={[selectedEspecialidade]}
                  onSelectionChange={(keys) => setSelectedEspecialidade(Array.from(keys)[0] as string)}
                  className="w-40"
                  items={[{ key: "all", label: "Todas" }, ...especialidadesOptions]}
                >
                  {(esp) => <SelectItem key={esp.key}>{esp.label}</SelectItem>}
                </Select>
                <Select placeholder="Nível" selectedKeys={[selectedNivel]} onSelectionChange={(keys) => setSelectedNivel(Array.from(keys)[0] as string)} className="w-36" items={nivelOptions}>
                  {(nivel) => <SelectItem key={nivel.key}>{nivel.label}</SelectItem>}
                </Select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
            <span className="ml-2">Carregando juízes...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border border-danger/50 bg-danger/10">
            <CardBody className="text-center py-8">
              <p className="text-danger">Erro ao carregar juízes: {error}</p>
              <Button color="primary" onPress={() => mutate()} className="mt-4">
                Tentar Novamente
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Lista de Juízes */}
        {!isLoading && !error && juizes && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {juizes.map((juiz) => (
              <Card key={juiz.id} className="border border-white/10 bg-background/70 backdrop-blur-xl">
                <CardHeader className="flex flex-col gap-2 pb-2">
                  <div className="flex items-start justify-between w-full">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-white truncate">{juiz.nome}</h3>
                      <p className="text-sm text-default-400 truncate">{juiz.nomeCompleto}</p>
                    </div>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly variant="light" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem key="view" startContent={<Eye className="w-4 h-4" />} onPress={() => handleViewJuiz(juiz)}>
                          Ver Detalhes
                        </DropdownItem>
                        {permissions.canManageTeam ? (
                          <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={() => handleEditJuiz(juiz)}>
                            Editar
                          </DropdownItem>
                        ) : null}
                        {permissions.canManageTeam ? (
                          <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />} onPress={() => handleDeleteJuiz(juiz.id)}>
                            Excluir
                          </DropdownItem>
                        ) : null}
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge color={getStatusColor(juiz.status)} variant="flat" size="sm">
                      {juiz.status}
                    </Badge>
                    <Badge color={getNivelColor(juiz.nivel)} variant="flat" size="sm">
                      {juiz.nivel.replace(/_/g, " ")}
                    </Badge>
                    {juiz.isPremium && (
                      <Badge color="warning" variant="flat" size="sm">
                        <Star className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                    {juiz.isPublico && (
                      <Badge color="success" variant="flat" size="sm">
                        Público
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-default-400">
                      <Scale className="w-4 h-4" />
                      <span className="truncate">
                        {juiz.vara} - {juiz.comarca}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-default-400">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">
                        {juiz.cidade}, {juiz.estado}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {juiz.especialidades?.slice(0, 2).map((esp: string) => (
                        <Chip key={esp} size="sm" variant="flat" color="primary">
                          {esp.replace(/_/g, " ")}
                        </Chip>
                      ))}
                      {juiz.especialidades && juiz.especialidades.length > 2 && (
                        <Chip size="sm" variant="flat" color="default">
                          +{juiz.especialidades.length - 2}
                        </Chip>
                      )}
                    </div>
                    {juiz.biografia && <p className="text-sm text-default-500 line-clamp-2">{juiz.biografia}</p>}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && juizes && juizes.length === 0 && (
          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardBody className="text-center py-12">
              <User className="w-12 h-12 text-default-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum juiz encontrado</h3>
              <p className="text-default-400 mb-4">
                {searchTerm || selectedStatus !== "all" || selectedEspecialidade !== "all" || selectedNivel !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Comece adicionando juízes à base de dados."}
              </p>
              {permissions.canManageTeam && (
                <Button color="primary" startContent={<Plus className="w-4 h-4" />} onPress={() => setIsCreateModalOpen(true)}>
                  Adicionar Primeiro Juiz
                </Button>
              )}
            </CardBody>
          </Card>
        )}

        {/* Modal de Criação/Edição - Placeholder */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          size="2xl"
          title="Novo Juiz"
          backdrop="blur"
          showFooter={true}
          footerContent={
            <>
              <Button variant="light" onPress={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button color="primary">Salvar</Button>
            </>
          }
        >
          <p className="text-default-500">Formulário de criação de juiz será implementado aqui.</p>
        </Modal>

        {/* Modal de Edição - Placeholder */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          size="2xl"
          title="Editar Juiz"
          backdrop="blur"
          showFooter={true}
          footerContent={
            <>
              <Button variant="light" onPress={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button color="primary">Salvar</Button>
            </>
          }
        >
          <p className="text-default-500">Formulário de edição de juiz será implementado aqui.</p>
          {selectedJuiz && <p className="text-sm text-default-400 mt-2">Editando: {selectedJuiz.nomeCompleto}</p>}
        </Modal>
      </section>
    </PermissionGuard>
  );
}
