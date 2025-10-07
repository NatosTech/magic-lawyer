"use client";

import type { CnpjData } from "@/types/brazil";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { Textarea } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, User, Building2, Phone, Mail, FileText, Users, Key, Copy, CheckCircle, KeyRound, RefreshCw, AlertCircle } from "lucide-react";
import { Spinner } from "@heroui/spinner";
import { toast } from "sonner";
import Link from "next/link";

import { title } from "@/components/primitives";
import { useUserPermissions } from "@/app/hooks/use-user-permissions";
import { useClientesAdvogado, useAllClientes } from "@/app/hooks/use-clientes";
import { createCliente, updateCliente, deleteCliente, resetarSenhaCliente, type Cliente, type ClienteCreateInput, type ClienteUpdateInput } from "@/app/actions/clientes";
import { TipoPessoa } from "@/app/generated/prisma";
import { Modal } from "@/components/ui/modal";
import { CpfInput } from "@/components/cpf-input";
import { CnpjInput } from "@/components/cnpj-input";

export function ClientesContent() {
  const { permissions, isSuperAdmin, isAdmin } = useUserPermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipoPessoa, setSelectedTipoPessoa] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [criarUsuario, setCriarUsuario] = useState(true); // Criar usuário por padrão
  const [credenciaisModal, setCredenciaisModal] = useState<{
    email: string;
    senha: string;
  } | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [clienteParaResetarSenha, setClienteParaResetarSenha] = useState<Cliente | null>(null);

  // Buscar clientes (advogado ou admin)
  const { clientes: clientesAdvogado, isLoading: isLoadingAdvogado, mutate: mutateAdvogado } = useClientesAdvogado();
  const { clientes: clientesAdmin, isLoading: isLoadingAdmin, mutate: mutateAdmin } = useAllClientes();

  const clientes = isAdmin ? clientesAdmin : clientesAdvogado;
  const isLoading = isAdmin ? isLoadingAdmin : isLoadingAdvogado;
  const mutate = isAdmin ? mutateAdmin : mutateAdvogado;

  // Estado do formulário
  const initialFormState: ClienteCreateInput = {
    tipoPessoa: TipoPessoa.FISICA,
    nome: "",
    documento: "",
    email: "",
    telefone: "",
    celular: "",
    observacoes: "",
    responsavelNome: "",
    responsavelEmail: "",
    responsavelTelefone: "",
  };

  const [formState, setFormState] = useState<ClienteCreateInput>(initialFormState);

  // Filtrar clientes
  const clientesFiltrados =
    clientes?.filter((cliente) => {
      const matchSearch =
        !searchTerm ||
        cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.documento?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTipoPessoa = selectedTipoPessoa === "all" || cliente.tipoPessoa === selectedTipoPessoa;

      return matchSearch && matchTipoPessoa;
    }) || [];

  const handleDeleteCliente = async (clienteId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      const result = await deleteCliente(clienteId);

      if (result.success) {
        toast.success("Cliente excluído com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao excluir cliente");
      }
    } catch (error) {
      toast.error("Erro ao excluir cliente");
    }
  };

  const handleCreateCliente = async () => {
    if (!formState.nome) {
      toast.error("Nome é obrigatório");

      return;
    }

    if (criarUsuario && !formState.email) {
      toast.error("Email é obrigatório para criar usuário de acesso");

      return;
    }

    setIsSaving(true);
    try {
      const result = await createCliente({ ...formState, criarUsuario });

      if (result.success) {
        toast.success("Cliente criado com sucesso!");
        setIsCreateModalOpen(false);
        setFormState(initialFormState);
        setCriarUsuario(true);
        mutate();

        // Se criou usuário, mostrar credenciais
        if (result.usuario) {
          setCredenciaisModal(result.usuario);
        }
      } else {
        toast.error(result.error || "Erro ao criar cliente");
      }
    } catch (error) {
      toast.error("Erro ao criar cliente");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCliente = async () => {
    if (!selectedCliente?.id) return;

    if (!formState.nome) {
      toast.error("Nome é obrigatório");

      return;
    }

    setIsSaving(true);
    try {
      const updateData: ClienteUpdateInput = {
        nome: formState.nome,
        tipoPessoa: formState.tipoPessoa,
        documento: formState.documento,
        email: formState.email,
        telefone: formState.telefone,
        celular: formState.celular,
        observacoes: formState.observacoes,
        responsavelNome: formState.responsavelNome,
        responsavelEmail: formState.responsavelEmail,
        responsavelTelefone: formState.responsavelTelefone,
      };

      const result = await updateCliente(selectedCliente.id, updateData);

      if (result.success) {
        toast.success("Cliente atualizado com sucesso!");
        setIsEditModalOpen(false);
        setSelectedCliente(null);
        setFormState(initialFormState);
        mutate();
      } else {
        toast.error(result.error || "Erro ao atualizar cliente");
      }
    } catch (error) {
      toast.error("Erro ao atualizar cliente");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormState({
      nome: cliente.nome,
      tipoPessoa: cliente.tipoPessoa,
      documento: cliente.documento || "",
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      celular: cliente.celular || "",
      observacoes: cliente.observacoes || "",
      responsavelNome: cliente.responsavelNome || "",
      responsavelEmail: cliente.responsavelEmail || "",
      responsavelTelefone: cliente.responsavelTelefone || "",
    });
    setIsEditModalOpen(true);
  };

  const handleCnpjFound = (cnpjData: CnpjData) => {
    setFormState({
      ...formState,
      nome: cnpjData.razao_social || formState.nome,
      documento: cnpjData.cnpj,
    });
    toast.success("Dados do CNPJ carregados!");
  };

  const handleOpenResetModal = (cliente: Cliente) => {
    if (!cliente.usuarioId) {
      toast.error("Este cliente não possui usuário de acesso");

      return;
    }
    setClienteParaResetarSenha(cliente);
  };

  const handleConfirmResetarSenha = async () => {
    if (!clienteParaResetarSenha) return;

    setIsResettingPassword(true);
    try {
      const result = await resetarSenhaCliente(clienteParaResetarSenha.id);

      if (result.success && result.usuario) {
        toast.success("Senha resetada com sucesso!");
        setClienteParaResetarSenha(null);
        setCredenciaisModal(result.usuario);
      } else {
        toast.error(result.error || "Erro ao resetar senha");
      }
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      toast.error("Erro ao resetar senha");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const getInitials = (nome: string) => {
    const names = nome.split(" ");

    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }

    return nome.substring(0, 2).toUpperCase();
  };

  const tipoPessoaOptions = [
    { key: "all", label: "Todos" },
    { key: TipoPessoa.FISICA, label: "Pessoa Física" },
    { key: TipoPessoa.JURIDICA, label: "Pessoa Jurídica" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={title({ size: "lg", color: "blue" })}>Clientes</h1>
          <p className="mt-2 text-sm text-default-500">Gerencie seus clientes e acesse seus processos</p>
        </div>
        {permissions.canViewAllClients && (
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => {
              setFormState(initialFormState);
              setIsCreateModalOpen(true);
            }}
          >
            Novo Cliente
          </Button>
        )}
      </header>

      {/* Filtros */}
      <Card className="border border-default-200">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Input
              className="flex-1"
              placeholder="Buscar por nome, email ou documento..."
              startContent={<Search className="h-4 w-4 text-default-400" />}
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <Select className="w-full sm:w-48" placeholder="Tipo de Pessoa" selectedKeys={[selectedTipoPessoa]} onChange={(e) => setSelectedTipoPessoa(e.target.value)}>
              {tipoPessoaOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Clientes */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <Card className="border border-default-200">
          <CardBody className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-default-300" />
            <p className="mt-4 text-lg font-semibold text-default-600">Nenhum cliente encontrado</p>
            <p className="mt-2 text-sm text-default-400">{searchTerm ? "Tente ajustar os filtros de busca" : "Comece adicionando seu primeiro cliente"}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientesFiltrados.map((cliente) => (
            <Card key={cliente.id} className="border border-default-200 hover:border-primary transition-colors">
              <CardHeader className="flex gap-3">
                <Avatar showFallback className="bg-primary/10 text-primary" icon={cliente.tipoPessoa === TipoPessoa.JURIDICA ? <Building2 /> : <User />} name={getInitials(cliente.nome)} />
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{cliente.nome}</p>
                    {cliente.usuarioId && (
                      <Chip color="success" size="sm" startContent={<Key className="h-3 w-3" />} variant="flat">
                        Acesso
                      </Chip>
                    )}
                  </div>
                  <p className="text-xs text-default-400">{cliente.tipoPessoa === TipoPessoa.FISICA ? "Pessoa Física" : "Pessoa Jurídica"}</p>
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Ações do cliente">
                    <DropdownItem key="view" as={Link} href={`/clientes/${cliente.id}`} startContent={<Eye className="h-4 w-4" />}>
                      Ver Detalhes
                    </DropdownItem>
                    <DropdownItem key="edit" startContent={<Edit className="h-4 w-4" />} onPress={() => handleEditCliente(cliente)}>
                      Editar
                    </DropdownItem>
                    {cliente.usuarioId ? (
                      <DropdownItem key="reset-password" className="text-warning" color="warning" startContent={<KeyRound className="h-4 w-4" />} onPress={() => handleOpenResetModal(cliente)}>
                        Resetar Senha
                      </DropdownItem>
                    ) : null}
                    <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="h-4 w-4" />} onPress={() => handleDeleteCliente(cliente.id)}>
                      Excluir
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </CardHeader>
              <Divider />
              <CardBody className="gap-3">
                {cliente.documento && (
                  <div className="flex items-center gap-2 text-xs">
                    <FileText className="h-3 w-3 text-default-400" />
                    <span className="text-default-600">{cliente.documento}</span>
                  </div>
                )}
                {cliente.email && (
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="h-3 w-3 text-default-400" />
                    <span className="text-default-600">{cliente.email}</span>
                  </div>
                )}
                {cliente.telefone && (
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="h-3 w-3 text-default-400" />
                    <span className="text-default-600">{cliente.telefone}</span>
                  </div>
                )}
                <Divider className="my-2" />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Chip color="primary" size="sm" variant="flat">
                      {cliente._count?.processos || 0} processos
                    </Chip>
                  </div>
                  <Button as={Link} color="primary" href={`/clientes/${cliente.id}`} size="sm" variant="flat">
                    Ver Processos
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Criar Cliente */}
      <Modal
        footer={
          <div className="flex gap-2">
            <Button variant="light" onPress={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={isSaving} onPress={handleCreateCliente}>
              Criar Cliente
            </Button>
          </div>
        }
        isOpen={isCreateModalOpen}
        size="2xl"
        title="Novo Cliente"
        onOpenChange={setIsCreateModalOpen}
      >
        <div className="space-y-4">
          <Select
            label="Tipo de Pessoa"
            placeholder="Selecione"
            selectedKeys={[formState.tipoPessoa]}
            onChange={(e) =>
              setFormState({
                ...formState,
                tipoPessoa: e.target.value as TipoPessoa,
              })
            }
          >
            <SelectItem key={TipoPessoa.FISICA}>Pessoa Física</SelectItem>
            <SelectItem key={TipoPessoa.JURIDICA}>Pessoa Jurídica</SelectItem>
          </Select>

          <Input
            isRequired
            label={formState.tipoPessoa === TipoPessoa.FISICA ? "Nome Completo" : "Razão Social"}
            placeholder={formState.tipoPessoa === TipoPessoa.FISICA ? "Nome completo" : "Razão Social"}
            startContent={formState.tipoPessoa === TipoPessoa.FISICA ? <User className="h-4 w-4 text-default-400" /> : <Building2 className="h-4 w-4 text-default-400" />}
            value={formState.nome}
            onValueChange={(value) => setFormState({ ...formState, nome: value })}
          />

          {formState.tipoPessoa === TipoPessoa.FISICA ? (
            <CpfInput value={formState.documento} onChange={(value) => setFormState({ ...formState, documento: value })} />
          ) : (
            <CnpjInput value={formState.documento} onChange={(value) => setFormState({ ...formState, documento: value })} onCnpjFound={handleCnpjFound} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              description={criarUsuario ? "Obrigatório para criar usuário" : undefined}
              isRequired={criarUsuario}
              label="Email"
              placeholder="email@exemplo.com"
              startContent={<Mail className="h-4 w-4 text-default-400" />}
              type="email"
              value={formState.email}
              onValueChange={(value) => setFormState({ ...formState, email: value })}
            />
            <Input
              label="Telefone"
              placeholder="(00) 0000-0000"
              startContent={<Phone className="h-4 w-4 text-default-400" />}
              value={formState.telefone}
              onValueChange={(value) => setFormState({ ...formState, telefone: value })}
            />
          </div>

          <Input
            label="Celular/WhatsApp"
            placeholder="(00) 00000-0000"
            startContent={<Phone className="h-4 w-4 text-default-400" />}
            value={formState.celular}
            onValueChange={(value) => setFormState({ ...formState, celular: value })}
          />

          {formState.tipoPessoa === TipoPessoa.JURIDICA && (
            <>
              <Divider className="my-2" />
              <p className="text-sm font-semibold text-default-700">Responsável pela Empresa</p>
              <Input
                label="Nome do Responsável"
                placeholder="Nome completo"
                startContent={<User className="h-4 w-4 text-default-400" />}
                value={formState.responsavelNome}
                onValueChange={(value) => setFormState({ ...formState, responsavelNome: value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email do Responsável"
                  placeholder="email@exemplo.com"
                  startContent={<Mail className="h-4 w-4 text-default-400" />}
                  type="email"
                  value={formState.responsavelEmail}
                  onValueChange={(value) => setFormState({ ...formState, responsavelEmail: value })}
                />
                <Input
                  label="Telefone do Responsável"
                  placeholder="(00) 00000-0000"
                  startContent={<Phone className="h-4 w-4 text-default-400" />}
                  value={formState.responsavelTelefone}
                  onValueChange={(value) => setFormState({ ...formState, responsavelTelefone: value })}
                />
              </div>
            </>
          )}

          <Divider className="my-4" />

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <Checkbox isSelected={criarUsuario} onValueChange={setCriarUsuario}>
              <div>
                <p className="font-semibold text-sm">Criar usuário de acesso ao sistema</p>
                <p className="text-xs text-default-500 mt-1">{criarUsuario ? "Um usuário será criado automaticamente com email e senha aleatória" : "O cliente não terá acesso ao sistema"}</p>
              </div>
            </Checkbox>
          </div>

          <Textarea
            label="Observações"
            minRows={3}
            placeholder="Informações adicionais sobre o cliente..."
            value={formState.observacoes}
            onValueChange={(value) => setFormState({ ...formState, observacoes: value })}
          />
        </div>
      </Modal>

      {/* Modal Editar Cliente */}
      <Modal
        footer={
          <div className="flex gap-2">
            <Button variant="light" onPress={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={isSaving} onPress={handleUpdateCliente}>
              Salvar Alterações
            </Button>
          </div>
        }
        isOpen={isEditModalOpen}
        size="2xl"
        title="Editar Cliente"
        onOpenChange={setIsEditModalOpen}
      >
        <div className="space-y-4">
          <Select
            label="Tipo de Pessoa"
            placeholder="Selecione"
            selectedKeys={[formState.tipoPessoa]}
            onChange={(e) =>
              setFormState({
                ...formState,
                tipoPessoa: e.target.value as TipoPessoa,
              })
            }
          >
            <SelectItem key={TipoPessoa.FISICA}>Pessoa Física</SelectItem>
            <SelectItem key={TipoPessoa.JURIDICA}>Pessoa Jurídica</SelectItem>
          </Select>

          <Input
            isRequired
            label={formState.tipoPessoa === TipoPessoa.FISICA ? "Nome Completo" : "Razão Social"}
            placeholder={formState.tipoPessoa === TipoPessoa.FISICA ? "Nome completo" : "Razão Social"}
            startContent={formState.tipoPessoa === TipoPessoa.FISICA ? <User className="h-4 w-4 text-default-400" /> : <Building2 className="h-4 w-4 text-default-400" />}
            value={formState.nome}
            onValueChange={(value) => setFormState({ ...formState, nome: value })}
          />

          {formState.tipoPessoa === TipoPessoa.FISICA ? (
            <CpfInput value={formState.documento} onChange={(value) => setFormState({ ...formState, documento: value })} />
          ) : (
            <CnpjInput value={formState.documento} onChange={(value) => setFormState({ ...formState, documento: value })} onCnpjFound={handleCnpjFound} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              placeholder="email@exemplo.com"
              startContent={<Mail className="h-4 w-4 text-default-400" />}
              type="email"
              value={formState.email}
              onValueChange={(value) => setFormState({ ...formState, email: value })}
            />
            <Input
              label="Telefone"
              placeholder="(00) 0000-0000"
              startContent={<Phone className="h-4 w-4 text-default-400" />}
              value={formState.telefone}
              onValueChange={(value) => setFormState({ ...formState, telefone: value })}
            />
          </div>

          <Input
            label="Celular/WhatsApp"
            placeholder="(00) 00000-0000"
            startContent={<Phone className="h-4 w-4 text-default-400" />}
            value={formState.celular}
            onValueChange={(value) => setFormState({ ...formState, celular: value })}
          />

          {formState.tipoPessoa === TipoPessoa.JURIDICA && (
            <>
              <Divider className="my-2" />
              <p className="text-sm font-semibold text-default-700">Responsável pela Empresa</p>
              <Input
                label="Nome do Responsável"
                placeholder="Nome completo"
                startContent={<User className="h-4 w-4 text-default-400" />}
                value={formState.responsavelNome}
                onValueChange={(value) => setFormState({ ...formState, responsavelNome: value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email do Responsável"
                  placeholder="email@exemplo.com"
                  startContent={<Mail className="h-4 w-4 text-default-400" />}
                  type="email"
                  value={formState.responsavelEmail}
                  onValueChange={(value) => setFormState({ ...formState, responsavelEmail: value })}
                />
                <Input
                  label="Telefone do Responsável"
                  placeholder="(00) 00000-0000"
                  startContent={<Phone className="h-4 w-4 text-default-400" />}
                  value={formState.responsavelTelefone}
                  onValueChange={(value) => setFormState({ ...formState, responsavelTelefone: value })}
                />
              </div>
            </>
          )}

          <Textarea
            label="Observações"
            minRows={3}
            placeholder="Informações adicionais sobre o cliente..."
            value={formState.observacoes}
            onValueChange={(value) => setFormState({ ...formState, observacoes: value })}
          />
        </div>
      </Modal>

      {/* Modal de Credenciais */}
      <Modal
        footer={
          <div className="flex justify-end">
            <Button color="primary" startContent={<CheckCircle className="h-4 w-4" />} onPress={() => setCredenciaisModal(null)}>
              Entendi
            </Button>
          </div>
        }
        isOpen={!!credenciaisModal}
        size="lg"
        title={credenciaisModal ? (credenciaisModal.senha.length > 0 ? "🔑 Credenciais de Acesso" : "✅ Cliente criado com sucesso!") : ""}
        onOpenChange={() => setCredenciaisModal(null)}
      >
        {credenciaisModal && (
          <div className="space-y-4">
            <div className="rounded-lg bg-success/10 border border-success/20 p-4">
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-success mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-success">Usuário de acesso criado</p>
                  <p className="text-xs text-default-600 mt-1">As credenciais abaixo foram geradas automaticamente. Anote ou envie para o cliente.</p>
                </div>
              </div>
            </div>

            <Card className="border border-default-200">
              <CardBody className="gap-3">
                <div>
                  <p className="text-xs text-default-400 mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      classNames={{
                        input: "font-mono",
                      }}
                      value={credenciaisModal.email}
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => {
                        navigator.clipboard.writeText(credenciaisModal.email);
                        toast.success("Email copiado!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-default-400 mb-1">Senha (temporária)</p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      classNames={{
                        input: "font-mono",
                      }}
                      value={credenciaisModal.senha}
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => {
                        navigator.clipboard.writeText(credenciaisModal.senha);
                        toast.success("Senha copiada!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
              <p className="text-xs text-warning-600">⚠️ Esta senha será exibida apenas uma vez. Certifique-se de anotar ou enviar para o cliente.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Confirmação de Reset de Senha */}
      <Modal
        footer={
          <div className="flex gap-2">
            <Button variant="light" onPress={() => setClienteParaResetarSenha(null)}>
              Cancelar
            </Button>
            <Button color="warning" isLoading={isResettingPassword} startContent={!isResettingPassword ? <RefreshCw className="h-4 w-4" /> : undefined} onPress={handleConfirmResetarSenha}>
              Resetar Senha
            </Button>
          </div>
        }
        isOpen={!!clienteParaResetarSenha}
        size="md"
        title="⚠️ Resetar Senha do Cliente"
        onOpenChange={() => setClienteParaResetarSenha(null)}
      >
        {clienteParaResetarSenha && (
          <div className="space-y-4">
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-warning">Atenção</p>
                  <p className="text-xs text-default-600 mt-1">Esta ação irá gerar uma nova senha aleatória para o cliente.</p>
                </div>
              </div>
            </div>

            <Card className="border border-default-200 bg-default-50">
              <CardBody className="gap-2">
                <div className="flex items-center gap-2">
                  {clienteParaResetarSenha.tipoPessoa === TipoPessoa.JURIDICA ? <Building2 className="h-5 w-5 text-default-400" /> : <User className="h-5 w-5 text-default-400" />}
                  <div>
                    <p className="text-sm font-semibold">{clienteParaResetarSenha.nome}</p>
                    <p className="text-xs text-default-400">{clienteParaResetarSenha.email}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <p className="text-xs text-primary-600">💡 Uma nova senha será gerada e exibida na próxima tela. Certifique-se de anotar e enviar para o cliente.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
