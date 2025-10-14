"use client";

import type { JuizFilters, JuizSerializado, JuizFormData } from "@/app/actions/juizes";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { Textarea } from "@heroui/input";
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Star, MapPin, Scale, User, Award, Briefcase, Calendar, Filter, Sparkles, AlertCircle, Download, Copy, Check } from "lucide-react";
import { Spinner } from "@heroui/spinner";
import { toast } from "sonner";

import { exportJuizToPDF } from "./export-juiz-pdf";

import { Modal } from "@/components/ui/modal";

// import { Textarea } from "@heroui/textarea";
import { useUserPermissions } from "@/app/hooks/use-user-permissions";
import { PermissionGuard } from "@/components/permission-guard";
import { CpfInput } from "@/components/cpf-input";
import { useJuizes, useJuizFormData } from "@/app/hooks/use-juizes";
import { deleteJuizTenant, createJuizTenant, updateJuizTenant } from "@/app/actions/juizes";
import { EspecialidadeJuridica, JuizStatus, JuizNivel } from "@/app/generated/prisma";
import { JuizFotoUpload } from "@/app/(protected)/juizes/juiz-foto-upload";

export function JuizesContent() {
  const { permissions } = useUserPermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEspecialidade, setSelectedEspecialidade] = useState<string>("all");
  const [selectedNivel, setSelectedNivel] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedJuiz, setSelectedJuiz] = useState<JuizSerializado | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estados do formulário - tipado com JuizFormData
  const initialFormState: JuizFormData = {
    nome: "",
    nomeCompleto: "",
    cpf: "",
    oab: "",
    email: "",
    telefone: "",
    endereco: "",
    cep: "",
    vara: "",
    comarca: "",
    cidade: "",
    estado: "",
    status: "ATIVO" as JuizStatus,
    nivel: "JUIZ_TITULAR" as JuizNivel,
    especialidades: [] as EspecialidadeJuridica[],
    biografia: "",
    formacao: "",
    experiencia: "",
    foto: "",
  };

  const [formState, setFormState] = useState<JuizFormData>(initialFormState);

  // Buscar dados do formulário
  const { formData, isLoading: isLoadingFormData } = useJuizFormData();

  // Construir filtros
  const filters: JuizFilters = {
    search: searchTerm || undefined,
    status: selectedStatus !== "all" ? (selectedStatus as JuizStatus) : undefined,
    especialidades: selectedEspecialidade !== "all" ? [selectedEspecialidade as EspecialidadeJuridica] : undefined,
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
      const result = await deleteJuizTenant(juizId);

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

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [copiedOab, setCopiedOab] = useState(false);

  const handleViewJuiz = (juiz: JuizSerializado) => {
    setSelectedJuiz(juiz);
    setIsViewModalOpen(true);
    setCopiedOab(false); // Reset ao abrir modal
  };

  const handleCopyOab = async (oab: string) => {
    try {
      await navigator.clipboard.writeText(oab);
      setCopiedOab(true);
      toast.success("OAB copiada para a área de transferência!");

      // Voltar ao ícone de Copy após 2 segundos
      setTimeout(() => {
        setCopiedOab(false);
      }, 2000);
    } catch (error) {
      toast.error("Erro ao copiar OAB");
    }
  };

  const handleDownloadPDF = async (juiz: JuizSerializado) => {
    try {
      toast.info("Gerando PDF profissional...");
      await exportJuizToPDF(juiz);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Verifique o console para detalhes.");
    }
  };

  const handleEditJuiz = (juiz: JuizSerializado) => {
    setSelectedJuiz(juiz);

    // DEBUG: Verificar dados do juiz
    console.log("🔍 [handleEditJuiz] Juiz completo:", juiz);
    console.log("🔍 [handleEditJuiz] OAB do juiz:", juiz.oab);

    // Popula o formulário com os dados do juiz
    const newFormState: JuizFormData = {
      nome: juiz.nome || "",
      nomeCompleto: juiz.nomeCompleto || "",
      cpf: juiz.cpf || "",
      oab: juiz.oab || "",
      email: juiz.email || "",
      telefone: juiz.telefone || "",
      endereco: juiz.endereco || "",
      cep: juiz.cep || "",
      vara: juiz.vara || "",
      comarca: juiz.comarca || "",
      cidade: juiz.cidade || "",
      estado: juiz.estado || "",
      status: juiz.status || "ATIVO",
      nivel: juiz.nivel || "JUIZ_TITULAR",
      especialidades: juiz.especialidades || [],
      biografia: juiz.biografia || "",
      formacao: juiz.formacao || "",
      experiencia: juiz.experiencia || "",
      foto: juiz.foto || "",
    };

    console.log("📝 [handleEditJuiz] FormState após popular:", newFormState);
    console.log("📋 [handleEditJuiz] OAB no formState:", newFormState.oab);

    setFormState(newFormState);
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormState(initialFormState);
  };

  const handleSaveJuiz = async () => {
    if (!formState.nome || !formState.vara) {
      toast.error("Preencha os campos obrigatórios: Nome e Vara");

      return;
    }

    setIsSaving(true);
    try {
      const juizData: JuizFormData = {
        nome: formState.nome,
        nomeCompleto: formState.nomeCompleto || undefined,
        cpf: formState.cpf || undefined,
        oab: formState.oab || undefined,
        email: formState.email || undefined,
        telefone: formState.telefone || undefined,
        endereco: formState.endereco || undefined,
        cep: formState.cep || undefined,
        vara: formState.vara,
        comarca: formState.comarca || undefined,
        cidade: formState.cidade || undefined,
        estado: formState.estado || undefined,
        status: formState.status,
        nivel: formState.nivel,
        especialidades: formState.especialidades,
        biografia: formState.biografia || undefined,
        formacao: formState.formacao || undefined,
        experiencia: formState.experiencia || undefined,
        foto: formState.foto || undefined,
      };

      // DEBUG: Log para verificar os dados
      console.log("📊 Dados do juiz para salvar:", juizData);
      console.log("📋 FormState.oab:", formState.oab);

      let result;

      if (isEditModalOpen && selectedJuiz) {
        // Editar juiz existente - Multi-tenant com auditoria
        result = await updateJuizTenant(selectedJuiz.id, juizData);
        if (result.success) {
          toast.success("Juiz atualizado com sucesso!");
        } else {
          toast.error(result.error || "Erro ao atualizar juiz");
          setIsSaving(false);

          return;
        }
      } else {
        // Criar novo juiz - Multi-tenant com auditoria
        result = await createJuizTenant(juizData);
        if (result.success) {
          toast.success("Juiz criado com sucesso!");
        } else {
          toast.error(result.error || "Erro ao criar juiz");
          setIsSaving(false);

          return;
        }
      }

      // Fechar modal e limpar formulário
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedJuiz(null);
      resetForm();

      // Revalidar dados
      mutate();
    } catch (error) {
      console.error("Erro ao salvar juiz:", error);
      toast.error("Erro ao salvar juiz");
    } finally {
      setIsSaving(false);
    }
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
    <PermissionGuard permission="canViewJudgesDatabase">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-8 px-3 sm:px-6">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-background p-8 backdrop-blur-xl border border-primary/20">
          <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-primary" />
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Base de Juízes</p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">Gestão de Juízes</h1>
                <p className="text-default-500 text-lg">
                  Base de dados completa com {juizes?.length || 0} {juizes?.length === 1 ? "juiz" : "juízes"}, especialidades e histórico de julgamentos.
                </p>
              </div>
              {permissions.canCreateJudgeProfiles && (
                <Button
                  className="flex-shrink-0 font-semibold"
                  color="primary"
                  size="lg"
                  startContent={<Plus className="w-5 h-5" />}
                  onPress={() => {
                    resetForm();
                    setIsCreateModalOpen(true);
                  }}
                >
                  Novo Juiz
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filtros Ultra Modernos */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-background/95 via-primary/5 to-background/95 backdrop-blur-2xl shadow-2xl">
          {/* Background decorativo */}
          <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Header dos filtros */}
            <div className="flex items-center gap-3 p-6 pb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Filtros de Busca</h3>
                <p className="text-sm text-default-400">Refine sua pesquisa na base de juízes</p>
              </div>
            </div>

            <Divider className="bg-primary/10" />

            {/* Conteúdo dos filtros */}
            <div className="p-6 pt-5 space-y-5">
              {/* Campo de busca destacado */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-default-500 flex items-center gap-2" htmlFor="juiz-search">
                  <Search className="w-4 h-4 text-primary" />
                  Busca Geral
                </label>
                <Input
                  classNames={{
                    input: "text-base font-medium",
                    inputWrapper: "border-2 border-primary/20 hover:border-primary/40 focus-within:border-primary bg-background/50 backdrop-blur-sm shadow-sm",
                  }}
                  id="juiz-search"
                  placeholder="Digite nome, vara, comarca ou cidade..."
                  size="lg"
                  startContent={
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                      <Search className="w-4 h-4 text-primary" />
                    </div>
                  }
                  value={searchTerm}
                  variant="bordered"
                  onValueChange={setSearchTerm}
                />
              </div>

              {/* Grid de filtros */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-default-500 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-secondary" />
                  Filtros Avançados
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    classNames={{
                      trigger: "border-2 border-primary/20 hover:border-primary/40 data-[focus=true]:border-primary bg-background/50 backdrop-blur-sm shadow-sm",
                      label: "font-semibold text-default-600",
                      value: "font-medium",
                    }}
                    items={statusOptions}
                    label="Status"
                    placeholder="Selecione o status"
                    selectedKeys={[selectedStatus]}
                    size="lg"
                    variant="bordered"
                    onSelectionChange={(keys) => setSelectedStatus(Array.from(keys)[0] as string)}
                  >
                    {(status) => <SelectItem key={status.key}>{status.label}</SelectItem>}
                  </Select>

                  <Select
                    classNames={{
                      trigger: "border-2 border-primary/20 hover:border-primary/40 data-[focus=true]:border-primary bg-background/50 backdrop-blur-sm shadow-sm",
                      label: "font-semibold text-default-600",
                      value: "font-medium",
                    }}
                    items={[{ key: "all", label: "Todas" }, ...especialidadesOptions]}
                    label="Especialidade"
                    placeholder="Selecione a área"
                    selectedKeys={[selectedEspecialidade]}
                    size="lg"
                    variant="bordered"
                    onSelectionChange={(keys) => setSelectedEspecialidade(Array.from(keys)[0] as string)}
                  >
                    {(esp) => <SelectItem key={esp.key}>{esp.label}</SelectItem>}
                  </Select>

                  <Select
                    classNames={{
                      trigger: "border-2 border-primary/20 hover:border-primary/40 data-[focus=true]:border-primary bg-background/50 backdrop-blur-sm shadow-sm",
                      label: "font-semibold text-default-600",
                      value: "font-medium",
                    }}
                    items={nivelOptions}
                    label="Nível"
                    placeholder="Selecione o nível"
                    selectedKeys={[selectedNivel]}
                    size="lg"
                    variant="bordered"
                    onSelectionChange={(keys) => setSelectedNivel(Array.from(keys)[0] as string)}
                  >
                    {(nivel) => <SelectItem key={nivel.key}>{nivel.label}</SelectItem>}
                  </Select>
                </div>
              </div>

              {/* Contador de resultados */}
              {juizes && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
                      <Scale className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-default-600">
                      {juizes.length} {juizes.length === 1 ? "juiz encontrado" : "juízes encontrados"}
                    </span>
                  </div>
                  {(searchTerm || selectedStatus !== "all" || selectedEspecialidade !== "all" || selectedNivel !== "all") && (
                    <Button
                      className="font-semibold"
                      color="primary"
                      size="sm"
                      variant="flat"
                      onPress={() => {
                        setSearchTerm("");
                        setSelectedStatus("all");
                        setSelectedEspecialidade("all");
                        setSelectedNivel("all");
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="border border-white/10 bg-background/60 backdrop-blur-xl">
            <CardBody className="flex flex-col items-center justify-center py-16">
              <Spinner
                classNames={{
                  circle1: "border-b-primary",
                  circle2: "border-b-secondary",
                }}
                color="primary"
                size="lg"
              />
              <p className="mt-4 text-lg text-default-400">Carregando juízes...</p>
            </CardBody>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border border-danger/50 bg-gradient-to-br from-danger/10 to-danger/5 backdrop-blur-xl">
            <CardBody className="text-center py-12">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-danger/20 p-4 rounded-full">
                  <AlertCircle className="w-10 h-10 text-danger" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-danger mb-2">Erro ao carregar juízes</h3>
              <p className="text-default-400 mb-6">{error}</p>
              <Button className="font-semibold" color="primary" size="lg" onPress={() => mutate()}>
                Tentar Novamente
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Lista de Juízes com design aprimorado */}
        {!isLoading && !error && juizes && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {juizes.map((juiz) => (
              <Card
                key={juiz.id}
                className="border border-white/10 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-xl hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
              >
                <CardHeader className="flex flex-col gap-3 pb-3">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Avatar
                        classNames={{
                          base: "bg-gradient-to-br from-primary to-secondary",
                          icon: "text-white",
                        }}
                        icon={!juiz.foto ? <Scale className="w-5 h-5" /> : undefined}
                        size="md"
                        src={juiz.foto || undefined}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white truncate">{juiz.nome}</h3>
                          {juiz.isPremium && <Sparkles className="w-4 h-4 text-warning" />}
                        </div>
                        <p className="text-sm text-default-400 truncate">{juiz.nomeCompleto}</p>
                        {juiz.oab && <p className="text-xs text-default-500 mt-1">OAB: {juiz.oab}</p>}
                      </div>
                    </div>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly className="hover:bg-primary/10" size="sm" variant="light">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu variant="flat">
                        <DropdownItem key="view" className="text-primary" startContent={<Eye className="w-4 h-4" />} onPress={() => handleViewJuiz(juiz)}>
                          Ver Detalhes
                        </DropdownItem>
                        {permissions.canEditJudgeProfiles ? (
                          <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={() => handleEditJuiz(juiz)}>
                            Editar
                          </DropdownItem>
                        ) : null}
                        {permissions.canDeleteJudgeProfiles ? (
                          <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />} onPress={() => handleDeleteJuiz(juiz.id)}>
                            Excluir
                          </DropdownItem>
                        ) : null}
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Chip
                      classNames={{
                        base: "font-semibold",
                      }}
                      color={getStatusColor(juiz.status)}
                      size="sm"
                      variant="flat"
                    >
                      {juiz.status}
                    </Chip>
                    <Chip
                      classNames={{
                        base: "font-semibold",
                      }}
                      color={getNivelColor(juiz.nivel)}
                      size="sm"
                      startContent={<Award className="w-3 h-3" />}
                      variant="flat"
                    >
                      {juiz.nivel.replace(/_/g, " ")}
                    </Chip>
                    {juiz.isPremium && (
                      <Chip
                        classNames={{
                          base: "font-semibold",
                        }}
                        color="warning"
                        size="sm"
                        startContent={<Star className="w-3 h-3" />}
                        variant="flat"
                      >
                        Premium
                      </Chip>
                    )}
                    {juiz.isPublico && (
                      <Chip
                        classNames={{
                          base: "font-semibold",
                        }}
                        color="success"
                        size="sm"
                        variant="flat"
                      >
                        Público
                      </Chip>
                    )}
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="pt-4 gap-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-default-300 line-clamp-2">
                      {juiz.vara} - {juiz.comarca}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span className="text-default-400 truncate">
                      {juiz.cidade}, {juiz.estado}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {juiz.especialidades?.slice(0, 3).map((esp: EspecialidadeJuridica) => (
                      <Chip
                        key={esp}
                        classNames={{
                          base: "border-primary/20",
                        }}
                        color="primary"
                        size="sm"
                        variant="dot"
                      >
                        {esp.replace(/_/g, " ")}
                      </Chip>
                    ))}
                    {juiz.especialidades && juiz.especialidades.length > 3 && (
                      <Chip color="default" size="sm" variant="flat">
                        +{juiz.especialidades.length - 3}
                      </Chip>
                    )}
                  </div>
                </CardBody>
                {juiz.biografia && (
                  <>
                    <Divider />
                    <CardFooter>
                      <p className="text-sm text-default-500 line-clamp-2 leading-relaxed">{juiz.biografia}</p>
                    </CardFooter>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && juizes && juizes.length === 0 && (
          <Card className="border border-white/10 bg-gradient-to-br from-background/70 to-background/50 backdrop-blur-xl">
            <CardBody className="text-center py-16">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                  <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-full border border-primary/20">
                    <Scale className="w-12 h-12 text-primary" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Nenhum juiz encontrado</h3>
              <p className="text-default-400 text-lg mb-6 max-w-md mx-auto">
                {searchTerm || selectedStatus !== "all" || selectedEspecialidade !== "all" || selectedNivel !== "all"
                  ? "Tente ajustar os filtros de busca para encontrar outros juízes."
                  : "Comece adicionando juízes à base de dados para começar a gerenciar suas informações."}
              </p>
              {permissions.canCreateJudgeProfiles && (
                <Button
                  className="font-semibold"
                  color="primary"
                  size="lg"
                  startContent={<Plus className="w-5 h-5" />}
                  onPress={() => {
                    resetForm();
                    setIsCreateModalOpen(true);
                  }}
                >
                  Adicionar Primeiro Juiz
                </Button>
              )}
            </CardBody>
          </Card>
        )}

        {/* Modal de Visualização de Detalhes */}
        <Modal
          backdrop="blur"
          footerContent={
            <div className="flex gap-2 w-full">
              <Button
                color="secondary"
                startContent={<Download className="w-4 h-4" />}
                variant="flat"
                onPress={() => {
                  if (selectedJuiz) {
                    handleDownloadPDF(selectedJuiz);
                  }
                }}
              >
                Baixar PDF
              </Button>
              {permissions.canEditJudgeProfiles && (
                <Button
                  color="primary"
                  startContent={<Edit className="w-4 h-4" />}
                  variant="flat"
                  onPress={() => {
                    setIsViewModalOpen(false);
                    // Chamar handleEditJuiz para popular o formulário com os dados
                    if (selectedJuiz) {
                      handleEditJuiz(selectedJuiz);
                    }
                  }}
                >
                  Editar Juiz
                </Button>
              )}
              <Button
                className="ml-auto"
                variant="light"
                onPress={() => {
                  setIsViewModalOpen(false);
                  setSelectedJuiz(null);
                }}
              >
                Fechar
              </Button>
            </div>
          }
          isOpen={isViewModalOpen}
          showFooter={true}
          size="2xl"
          title="Detalhes do Juiz"
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedJuiz(null);
          }}
        >
          {selectedJuiz && (
            <div className="space-y-6">
              {/* Header com Avatar */}
              <div className="flex items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/5 border border-primary/20">
                <Avatar
                  classNames={{
                    base: "bg-gradient-to-br from-primary to-secondary w-24 h-24 text-large",
                    icon: "text-white",
                  }}
                  icon={!selectedJuiz.foto ? <Scale className="w-10 h-10" /> : undefined}
                  src={selectedJuiz.foto || undefined}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-2xl font-bold text-white">{selectedJuiz.nome}</h3>
                    {selectedJuiz.isPremium && <Star className="w-5 h-5 text-warning" />}
                  </div>
                  <p className="text-default-400 mb-1">{selectedJuiz.nomeCompleto}</p>
                  {selectedJuiz.oab && <p className="text-sm text-default-500">OAB: {selectedJuiz.oab}</p>}
                  <div className="flex gap-2 flex-wrap">
                    <Chip color={getStatusColor(selectedJuiz.status)} size="sm" variant="flat">
                      {selectedJuiz.status}
                    </Chip>
                    <Chip color={getNivelColor(selectedJuiz.nivel)} size="sm" startContent={<Award className="w-3 h-3" />} variant="flat">
                      {selectedJuiz.nivel.replace(/_/g, " ")}
                    </Chip>
                    {selectedJuiz.isPremium && (
                      <Chip color="warning" size="sm" variant="flat">
                        Premium
                      </Chip>
                    )}
                    {selectedJuiz.isPublico && (
                      <Chip color="success" size="sm" variant="flat">
                        Público
                      </Chip>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border border-white/10">
                  <CardBody className="gap-2">
                    <p className="text-sm text-default-400 font-semibold flex items-center gap-2">
                      <Scale className="w-4 h-4 text-primary" />
                      Vara
                    </p>
                    <p className="text-white">{selectedJuiz.vara || "Não informado"}</p>
                  </CardBody>
                </Card>
                <Card className="border border-white/10">
                  <CardBody className="gap-2">
                    <p className="text-sm text-default-400 font-semibold">Comarca</p>
                    <p className="text-white">{selectedJuiz.comarca || "Não informado"}</p>
                  </CardBody>
                </Card>
                <Card className="border border-white/10">
                  <CardBody className="gap-2">
                    <p className="text-sm text-default-400 font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-secondary" />
                      Localização
                    </p>
                    <p className="text-white">
                      {selectedJuiz.cidade}, {selectedJuiz.estado}
                    </p>
                  </CardBody>
                </Card>
                <Card className="border border-white/10">
                  <CardBody className="gap-2">
                    <p className="text-sm text-default-400 font-semibold">CPF</p>
                    <p className="text-white font-mono text-sm">{selectedJuiz.cpf || "Não informado"}</p>
                  </CardBody>
                </Card>
                <Card className="border border-primary/20 bg-primary/5">
                  <CardBody className="gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-default-400 font-semibold">OAB</p>
                      {selectedJuiz.oab && (
                        <Button isIconOnly className="transition-all duration-300" color={copiedOab ? "success" : "primary"} size="sm" variant="flat" onPress={() => handleCopyOab(selectedJuiz.oab!)}>
                          {copiedOab ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                    <p className="text-primary font-bold text-lg">{selectedJuiz.oab || "Não informado"}</p>
                  </CardBody>
                </Card>
                <Card className="border border-white/10">
                  <CardBody className="gap-2">
                    <p className="text-sm text-default-400 font-semibold">E-mail</p>
                    <p className="text-white text-sm truncate">{selectedJuiz.email || "Não informado"}</p>
                  </CardBody>
                </Card>
                <Card className="border border-white/10">
                  <CardBody className="gap-2">
                    <p className="text-sm text-default-400 font-semibold">Telefone</p>
                    <p className="text-white">{selectedJuiz.telefone || "Não informado"}</p>
                  </CardBody>
                </Card>
                {selectedJuiz.endereco && (
                  <Card className="border border-white/10 md:col-span-2">
                    <CardBody className="gap-2">
                      <p className="text-sm text-default-400 font-semibold">Endereço Completo</p>
                      <p className="text-white">{selectedJuiz.endereco}</p>
                      {selectedJuiz.cep && <p className="text-sm text-default-500">CEP: {selectedJuiz.cep}</p>}
                    </CardBody>
                  </Card>
                )}
              </div>

              {/* Datas Importantes */}
              {(selectedJuiz.dataNascimento || selectedJuiz.dataPosse || selectedJuiz.dataAposentadoria) && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Datas Importantes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedJuiz.dataNascimento && (
                      <Card className="border border-white/10">
                        <CardBody className="gap-2">
                          <p className="text-sm text-default-400 font-semibold">Data de Nascimento</p>
                          <p className="text-white">{new Date(selectedJuiz.dataNascimento).toLocaleDateString("pt-BR")}</p>
                        </CardBody>
                      </Card>
                    )}
                    {selectedJuiz.dataPosse && (
                      <Card className="border border-white/10">
                        <CardBody className="gap-2">
                          <p className="text-sm text-default-400 font-semibold">Data de Posse</p>
                          <p className="text-white">{new Date(selectedJuiz.dataPosse).toLocaleDateString("pt-BR")}</p>
                        </CardBody>
                      </Card>
                    )}
                    {selectedJuiz.dataAposentadoria && (
                      <Card className="border border-white/10">
                        <CardBody className="gap-2">
                          <p className="text-sm text-default-400 font-semibold">Data de Aposentadoria</p>
                          <p className="text-white">{new Date(selectedJuiz.dataAposentadoria).toLocaleDateString("pt-BR")}</p>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Especialidades */}
              {selectedJuiz.especialidades && selectedJuiz.especialidades.length > 0 && (
                <div>
                  <p className="text-sm text-default-400 font-semibold mb-3">Especialidades</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedJuiz.especialidades.map((esp: EspecialidadeJuridica) => (
                      <Chip key={esp} color="primary" variant="flat">
                        {esp.replace(/_/g, " ")}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {/* Biografia */}
              {selectedJuiz.biografia && (
                <div>
                  <p className="text-sm text-default-400 font-semibold mb-2">Biografia</p>
                  <p className="text-default-300 leading-relaxed">{selectedJuiz.biografia}</p>
                </div>
              )}

              {/* Formação e Experiência */}
              {(selectedJuiz.formacao || selectedJuiz.experiencia) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedJuiz.formacao && (
                    <Card className="border border-white/10">
                      <CardHeader>
                        <p className="text-sm text-default-400 font-semibold flex items-center gap-2">
                          <Award className="w-4 h-4 text-primary" />
                          Formação
                        </p>
                      </CardHeader>
                      <Divider />
                      <CardBody>
                        <p className="text-default-300 text-sm leading-relaxed">{selectedJuiz.formacao}</p>
                      </CardBody>
                    </Card>
                  )}
                  {selectedJuiz.experiencia && (
                    <Card className="border border-white/10">
                      <CardHeader>
                        <p className="text-sm text-default-400 font-semibold flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-secondary" />
                          Experiência
                        </p>
                      </CardHeader>
                      <Divider />
                      <CardBody>
                        <p className="text-default-300 text-sm leading-relaxed">{selectedJuiz.experiencia}</p>
                      </CardBody>
                    </Card>
                  )}
                </div>
              )}

              {/* Prêmios e Publicações */}
              {(selectedJuiz.premios || selectedJuiz.publicacoes) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedJuiz.premios && (
                    <Card className="border border-warning/20 bg-warning/5">
                      <CardHeader>
                        <p className="text-sm text-warning font-semibold flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Prêmios e Reconhecimentos
                        </p>
                      </CardHeader>
                      <Divider className="bg-warning/20" />
                      <CardBody>
                        <p className="text-default-300 text-sm leading-relaxed">{selectedJuiz.premios}</p>
                      </CardBody>
                    </Card>
                  )}
                  {selectedJuiz.publicacoes && (
                    <Card className="border border-secondary/20 bg-secondary/5">
                      <CardHeader>
                        <p className="text-sm text-secondary font-semibold flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Publicações
                        </p>
                      </CardHeader>
                      <Divider className="bg-secondary/20" />
                      <CardBody>
                        <p className="text-default-300 text-sm leading-relaxed">{selectedJuiz.publicacoes}</p>
                      </CardBody>
                    </Card>
                  )}
                </div>
              )}

              {/* Redes Sociais e Links */}
              {(selectedJuiz.website || selectedJuiz.linkedin || selectedJuiz.twitter || selectedJuiz.instagram) && (
                <Card className="border border-primary/20 bg-primary/5">
                  <CardHeader>
                    <p className="text-sm text-primary font-semibold">Links e Redes Sociais</p>
                  </CardHeader>
                  <Divider className="bg-primary/20" />
                  <CardBody>
                    <div className="flex flex-wrap gap-3">
                      {selectedJuiz.website && (
                        <Chip as="a" color="primary" href={selectedJuiz.website} startContent={<Award className="w-3 h-3" />} target="_blank" variant="flat">
                          Website
                        </Chip>
                      )}
                      {selectedJuiz.linkedin && (
                        <Chip as="a" color="primary" href={selectedJuiz.linkedin} target="_blank" variant="flat">
                          LinkedIn
                        </Chip>
                      )}
                      {selectedJuiz.twitter && (
                        <Chip as="a" color="primary" href={`https://twitter.com/${selectedJuiz.twitter.replace("@", "")}`} target="_blank" variant="flat">
                          Twitter
                        </Chip>
                      )}
                      {selectedJuiz.instagram && (
                        <Chip as="a" color="primary" href={`https://instagram.com/${selectedJuiz.instagram.replace("@", "")}`} target="_blank" variant="flat">
                          Instagram
                        </Chip>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Observações */}
              {selectedJuiz.observacoes && (
                <Card className="border border-white/10">
                  <CardHeader>
                    <p className="text-sm text-default-400 font-semibold">Observações Internas</p>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <p className="text-default-300 text-sm leading-relaxed italic">{selectedJuiz.observacoes}</p>
                  </CardBody>
                </Card>
              )}
            </div>
          )}
        </Modal>

        {/* Modal de Criação/Edição */}
        <Modal
          backdrop="blur"
          footerContent={
            <>
              <Button
                variant="light"
                onPress={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  setSelectedJuiz(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button color="primary" isLoading={isSaving} startContent={<Plus className="w-4 h-4" />} onPress={handleSaveJuiz}>
                {isEditModalOpen ? "Salvar Alterações" : "Criar Juiz"}
              </Button>
            </>
          }
          isOpen={isCreateModalOpen || isEditModalOpen}
          showFooter={true}
          size="2xl"
          title={isEditModalOpen ? "Editar Juiz" : "Novo Juiz"}
          onClose={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedJuiz(null);
          }}
        >
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informações Básicas
              </h4>

              {/* Upload de Foto - Componente Organizado com Crop */}
              <JuizFotoUpload
                currentFotoUrl={formState.foto}
                juizId={selectedJuiz?.id}
                juizNome={formState.nome || "Juiz"}
                onFotoChange={(url: string) => setFormState({ ...formState, foto: url || "" })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="Nome"
                  placeholder="Ex: Dr. João Silva"
                  size="lg"
                  value={formState.nome}
                  variant="bordered"
                  onValueChange={(value) => setFormState({ ...formState, nome: value })}
                />
                <Input
                  label="Nome Completo"
                  placeholder="Nome completo do juiz"
                  size="lg"
                  value={formState.nomeCompleto || ""}
                  variant="bordered"
                  onValueChange={(value) => setFormState({ ...formState, nomeCompleto: value })}
                />
                <CpfInput value={formState.cpf || ""} onChange={(value) => setFormState({ ...formState, cpf: value })} />
                <Input label="OAB" placeholder="Número da OAB" size="lg" value={formState.oab || ""} variant="bordered" onValueChange={(value) => setFormState({ ...formState, oab: value })} />
              </div>
            </div>

            <Divider className="bg-white/10" />

            {/* Contato */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informações de Contato
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="E-mail"
                  placeholder="email@example.com"
                  size="lg"
                  type="email"
                  value={formState.email || ""}
                  variant="bordered"
                  onValueChange={(value) => setFormState({ ...formState, email: value })}
                />
                <Input
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  size="lg"
                  value={formState.telefone || ""}
                  variant="bordered"
                  onValueChange={(value) => setFormState({ ...formState, telefone: value })}
                />
              </div>
            </div>

            <Divider className="bg-white/10" />

            {/* Localização e Atuação */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Localização e Atuação
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  label="Vara"
                  placeholder="Ex: 1ª Vara Cível"
                  size="lg"
                  value={formState.vara}
                  variant="bordered"
                  onValueChange={(value) => setFormState({ ...formState, vara: value })}
                />
                <Input
                  label="Comarca"
                  placeholder="Ex: Comarca de São Paulo"
                  size="lg"
                  value={formState.comarca || ""}
                  variant="bordered"
                  onValueChange={(value) => setFormState({ ...formState, comarca: value })}
                />
                <Input
                  label="Cidade"
                  placeholder="Ex: São Paulo"
                  size="lg"
                  value={formState.cidade || ""}
                  variant="bordered"
                  onValueChange={(value) => setFormState({ ...formState, cidade: value })}
                />
                <Input
                  label="Estado"
                  maxLength={2}
                  placeholder="Ex: SP"
                  size="lg"
                  value={formState.estado}
                  variant="bordered"
                  onValueChange={(value) => setFormState({ ...formState, estado: value.toUpperCase() })}
                />
                <Input
                  className="md:col-span-2"
                  label="Endereço Completo"
                  placeholder="Rua, número, complemento"
                  size="lg"
                  value={formState.endereco || ""}
                  variant="bordered"
                  onValueChange={(value) => setFormState({ ...formState, endereco: value })}
                />
                <Input label="CEP" placeholder="00000-000" size="lg" value={formState.cep || ""} variant="bordered" onValueChange={(value) => setFormState({ ...formState, cep: value })} />
              </div>
            </div>

            <Divider className="bg-white/10" />

            {/* Status e Classificação */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Status e Classificação
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  items={formData?.status?.map((s) => ({ key: s, label: s })) || []}
                  label="Status"
                  placeholder="Selecione o status"
                  selectedKeys={[formState.status]}
                  size="lg"
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    setFormState({
                      ...formState,
                      status: Array.from(keys)[0] as JuizStatus,
                    })
                  }
                >
                  {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                </Select>
                <Select
                  items={
                    formData?.niveis?.map((n) => ({
                      key: n,
                      label: n.replace(/_/g, " "),
                    })) || []
                  }
                  label="Nível"
                  placeholder="Selecione o nível"
                  selectedKeys={[formState.nivel]}
                  size="lg"
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    setFormState({
                      ...formState,
                      nivel: Array.from(keys)[0] as JuizNivel,
                    })
                  }
                >
                  {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                </Select>
                <Select
                  items={
                    formData?.especialidades?.map((e) => ({
                      key: e,
                      label: e.replace(/_/g, " "),
                    })) || []
                  }
                  label="Especialidades"
                  placeholder="Selecione as especialidades"
                  selectedKeys={formState.especialidades}
                  selectionMode="multiple"
                  size="lg"
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    setFormState({
                      ...formState,
                      especialidades: Array.from(keys) as EspecialidadeJuridica[],
                    })
                  }
                >
                  {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                </Select>
              </div>
            </div>

            <Divider className="bg-white/10" />

            {/* Biografia e Informações Adicionais */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Informações Adicionais
              </h4>
              <Textarea
                label="Biografia"
                minRows={3}
                placeholder="Breve biografia do juiz..."
                size="lg"
                value={formState.biografia || ""}
                variant="bordered"
                onValueChange={(value) => setFormState({ ...formState, biografia: value })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                  label="Formação"
                  minRows={2}
                  placeholder="Formação acadêmica..."
                  size="lg"
                  value={formState.formacao || ""}
                  variant="bordered"
                  onValueChange={(value) => setFormState({ ...formState, formacao: value })}
                />
                <Textarea
                  label="Experiência"
                  minRows={2}
                  placeholder="Experiência profissional..."
                  size="lg"
                  value={formState.experiencia || ""}
                  variant="bordered"
                  onValueChange={(value) => setFormState({ ...formState, experiencia: value })}
                />
              </div>
            </div>
          </div>
        </Modal>
      </section>
    </PermissionGuard>
  );
}
