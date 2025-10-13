"use client";

import { useState, useEffect } from "react";
import { parseDate, type DateValue } from "@internationalized/date";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Switch,
  Textarea,
  Chip,
  Avatar,
  DatePicker,
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import { User, Briefcase, Shield, Save, X, MapPin, Settings } from "lucide-react";

import { updateTenantUser, createTenantUser } from "@/app/actions/admin";
import { UserRole, EspecialidadeJuridica } from "@/app/generated/prisma";
import { AvatarUpload } from "@/components/avatar-upload";
import { EnderecoManager } from "@/components/endereco-manager";
import { CpfInput } from "@/components/cpf-input";
import { CnpjInput } from "@/components/cnpj-input";
import { getEstadosBrasilCached } from "@/lib/api/brazil-states";
import { type CnpjData } from "@/types/brazil";

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
    role: UserRole;
    active: boolean;
    avatarUrl?: string | null;
    createdAt: string;
    lastLoginAt?: string | null;
    // Campos pessoais adicionais (todos os roles)
    cpf?: string | null;
    rg?: string | null;
    dataNascimentoUsuario?: string | null;
    observacoes?: string | null;
    // Advogado fields
    oabNumero?: string | null;
    oabUf?: string | null;
    telefone?: string | null;
    whatsapp?: string | null;
    bio?: string | null;
    especialidades?: string[] | null;
    comissaoPadrao?: number | null;
    comissaoAcaoGanha?: number | null;
    comissaoHonorarios?: number | null;
    // Cliente fields
    tipoPessoa?: string | null;
    documento?: string | null;
    telefoneCliente?: string | null;
    celular?: string | null;
    dataNascimento?: string | null;
    inscricaoEstadual?: string | null;
    responsavelNome?: string | null;
    responsavelEmail?: string | null;
    responsavelTelefone?: string | null;
    observacoesCliente?: string | null;
  } | null;
  onSuccess?: () => void;
}

const roleOptions = [
  { value: "SECRETARIA", label: "Secretária" },
  { value: "ADVOGADO", label: "Advogado" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "ADMIN", label: "Administrador" },
];

const especialidadeLabels: Record<string, string> = {
  CIVIL: "Civil",
  CRIMINAL: "Criminal",
  TRABALHISTA: "Trabalhista",
  FAMILIA: "Família",
  TRIBUTARIO: "Tributário",
  ADMINISTRATIVO: "Administrativo",
  EMPRESARIAL: "Empresarial",
  CONSUMIDOR: "Consumidor",
  AMBIENTAL: "Ambiental",
  ELETORAL: "Eleitoral",
  MILITAR: "Militar",
  PREVIDENCIARIO: "Previdenciário",
  CONSTITUCIONAL: "Constitucional",
  INTERNACIONAL: "Internacional",
  OUTROS: "Outros",
};

export function UserManagementModal({ isOpen, onClose, tenantId, user, onSuccess }: UserManagementModalProps) {
  const isEditing = !!user;

  // Buscar UFs
  const [ufs, setUfs] = useState<string[]>([]);

  // Estados para dados pessoais
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [active, setActive] = useState(user?.active ?? true);

  // Estados para dados pessoais adicionais (todos os roles)
  const [cpf, setCpf] = useState(user?.cpf || "");
  const [rg, setRg] = useState(user?.rg || "");
  const [dataNascimentoUsuario, setDataNascimentoUsuario] = useState<DateValue | undefined>(
    user?.dataNascimentoUsuario ? parseDate(new Date(user.dataNascimentoUsuario).toISOString().split("T")[0]) : undefined
  );
  const [observacoes, setObservacoes] = useState(user?.observacoes || "");

  // Estados para dados da OAB
  const [oabNumero, setOabNumero] = useState(user?.oabNumero || "");
  const [oabUf, setOabUf] = useState(user?.oabUf || "");
  const [telefoneAdvogado, setTelefoneAdvogado] = useState(user?.telefone || "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [especialidades, setEspecialidades] = useState<string[]>(user?.especialidades || []);

  // Estados para comissões
  const [comissaoPadrao, setComissaoPadrao] = useState(user?.comissaoPadrao?.toString() || "");
  const [comissaoAcaoGanha, setComissaoAcaoGanha] = useState(user?.comissaoAcaoGanha?.toString() || "");
  const [comissaoHonorarios, setComissaoHonorarios] = useState(user?.comissaoHonorarios?.toString() || "");

  // Estados para dados do Cliente
  const [tipoPessoa, setTipoPessoa] = useState<string>(user?.tipoPessoa || "FISICA");
  const [documento, setDocumento] = useState(user?.documento || "");
  const [dataNascimento, setDataNascimento] = useState<DateValue | undefined>(user?.dataNascimento ? parseDate(new Date(user.dataNascimento).toISOString().split("T")[0]) : undefined);
  const [inscricaoEstadual, setInscricaoEstadual] = useState(user?.inscricaoEstadual || "");
  const [telefoneCliente, setTelefoneCliente] = useState(user?.telefoneCliente || "");
  const [celular, setCelular] = useState(user?.celular || "");
  const [responsavelNome, setResponsavelNome] = useState(user?.responsavelNome || "");
  const [responsavelEmail, setResponsavelEmail] = useState(user?.responsavelEmail || "");
  const [responsavelTelefone, setResponsavelTelefone] = useState(user?.responsavelTelefone || "");
  const [observacoesCliente, setObservacoesCliente] = useState(user?.observacoesCliente || "");

  // Estados para permissões
  const [role, setRole] = useState<UserRole>(user?.role || "SECRETARIA");
  const [generatePassword, setGeneratePassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Carregar UFs uma vez
  useEffect(() => {
    const loadUfs = async () => {
      try {
        const estados = await getEstadosBrasilCached();
        setUfs(estados.map((e) => e.sigla));
      } catch (error) {
        console.error("Erro ao carregar UFs:", error);
      }
    };
    loadUfs();
  }, []);

  // Atualizar estados quando o modal abrir ou o usuário mudar
  useEffect(() => {
    if (isOpen) {
      // Dados pessoais
      setFirstName(user?.firstName || "");
      setLastName(user?.lastName || "");
      setEmail(user?.email || "");
      setPhone(user?.phone || "");
      setAvatarUrl(user?.avatarUrl || "");
      setActive(user?.active ?? true);

      // Dados pessoais adicionais
      setCpf(user?.cpf || "");
      setRg(user?.rg || "");
      setDataNascimentoUsuario(user?.dataNascimentoUsuario ? parseDate(new Date(user.dataNascimentoUsuario).toISOString().split("T")[0]) : undefined);
      setObservacoes(user?.observacoes || "");

      // Dados da OAB
      setOabNumero(user?.oabNumero || "");
      setOabUf(user?.oabUf || "");
      setTelefoneAdvogado(user?.telefone || "");
      setWhatsapp(user?.whatsapp || "");
      setBio(user?.bio || "");
      setEspecialidades(user?.especialidades || []);

      // Comissões
      setComissaoPadrao(user?.comissaoPadrao?.toString() || "");
      setComissaoAcaoGanha(user?.comissaoAcaoGanha?.toString() || "");
      setComissaoHonorarios(user?.comissaoHonorarios?.toString() || "");

      // Dados do Cliente
      setTipoPessoa(user?.tipoPessoa || "FISICA");
      setDocumento(user?.documento || "");
      setDataNascimento(user?.dataNascimento ? parseDate(new Date(user.dataNascimento).toISOString().split("T")[0]) : undefined);
      setInscricaoEstadual(user?.inscricaoEstadual || "");
      setTelefoneCliente(user?.telefoneCliente || "");
      setCelular(user?.celular || "");
      setResponsavelNome(user?.responsavelNome || "");
      setResponsavelEmail(user?.responsavelEmail || "");
      setResponsavelTelefone(user?.responsavelTelefone || "");
      setObservacoesCliente(user?.observacoesCliente || "");

      // Permissões
      setRole(user?.role || "SECRETARIA");
      setGeneratePassword(false);
    }
  }, [isOpen, user]);

  // Handler para mudança de avatar
  const handleAvatarChange = async (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
    addToast({
      title: "Avatar atualizado",
      description: "A foto foi atualizada com sucesso",
      color: "success",
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userData: any = {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email,
        phone: phone || undefined,
        avatarUrl: avatarUrl || undefined,
        role: role,
        active: active,
        // Dados pessoais adicionais (todos os roles)
        cpf: cpf || undefined,
        rg: rg || undefined,
        dataNascimentoUsuario: dataNascimentoUsuario
          ? `${dataNascimentoUsuario.year}-${String(dataNascimentoUsuario.month).padStart(2, "0")}-${String(dataNascimentoUsuario.day).padStart(2, "0")}`
          : undefined,
        observacoes: observacoes || undefined,
        ...(generatePassword && { generatePassword: true }),
        // Campos específicos do advogado
        ...(role === "ADVOGADO" && {
          oabNumero: oabNumero || undefined,
          oabUf: oabUf || undefined,
          telefone: telefoneAdvogado || undefined,
          whatsapp: whatsapp || undefined,
          bio: bio || undefined,
          especialidades: especialidades.length > 0 ? especialidades : undefined,
          comissaoPadrao: comissaoPadrao ? parseFloat(comissaoPadrao) : undefined,
          comissaoAcaoGanha: comissaoAcaoGanha ? parseFloat(comissaoAcaoGanha) : undefined,
          comissaoHonorarios: comissaoHonorarios ? parseFloat(comissaoHonorarios) : undefined,
        }),
        // Campos específicos do cliente
        ...(role === "CLIENTE" && {
          tipoPessoa: tipoPessoa,
          documento: documento || undefined,
          dataNascimento: dataNascimento ? `${dataNascimento.year}-${String(dataNascimento.month).padStart(2, "0")}-${String(dataNascimento.day).padStart(2, "0")}` : undefined,
          inscricaoEstadual: inscricaoEstadual || undefined,
          telefoneCliente: telefoneCliente || undefined,
          celular: celular || undefined,
          responsavelNome: responsavelNome || undefined,
          responsavelEmail: responsavelEmail || undefined,
          responsavelTelefone: responsavelTelefone || undefined,
          observacoesCliente: observacoesCliente || undefined,
        }),
      };

      const response = isEditing ? await updateTenantUser(tenantId, user!.id, userData) : await createTenantUser(tenantId, userData);

      if (!response.success) {
        addToast({
          title: "Erro ao salvar usuário",
          description: response.error || "Tente novamente",
          color: "danger",
        });
        return;
      }

      addToast({
        title: isEditing ? "Usuário atualizado" : "Usuário criado",
        description: isEditing ? "Informações do usuário foram salvas" : "Usuário foi criado com sucesso",
        color: "success",
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      addToast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
        body: "py-6",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{isEditing ? "Editar Usuário" : "Criar Novo Usuário"}</h3>
              <p className="text-sm text-default-500">{isEditing ? "Gerencie todas as informações do usuário" : "Cadastre um novo usuário no sistema"}</p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <Tabs aria-label="Informações do usuário" color="primary" variant="underlined">
            {/* TAB 1: DADOS PESSOAIS */}
            <Tab
              key="personal"
              title={
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Dados Pessoais</span>
                </div>
              }
            >
              <div className="space-y-6">
                <Card className="border border-white/10 bg-background/70 backdrop-blur">
                  <CardHeader>
                    <h4 className="text-md font-semibold">Informações Básicas</h4>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    {isEditing && (
                      <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                        <AvatarUpload currentAvatarUrl={avatarUrl || undefined} userName={firstName || email} onAvatarChange={handleAvatarChange} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{firstName && lastName ? `${firstName} ${lastName}` : email}</p>
                          <p className="text-xs text-default-500">Clique no avatar para alterar a foto do usuário</p>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <Input isRequired label="Nome" placeholder="João" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      <Input isRequired label="Sobrenome" placeholder="Silva" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Input isRequired type="email" label="Email" placeholder="joao@escritorio.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                      <Input label="Telefone Pessoal" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>

                    <Divider />

                    <div className="grid gap-4 md:grid-cols-3">
                      <CpfInput label="CPF" placeholder="000.000.000-00" value={cpf} onChange={setCpf} />
                      <Input label="RG" placeholder="00.000.000-0" value={rg} onChange={(e) => setRg(e.target.value)} />
                      <DatePicker
                        label="Data de Nascimento"
                        value={dataNascimentoUsuario as any}
                        onChange={(value: any) => setDataNascimentoUsuario(value || undefined)}
                        showMonthAndYearPickers
                        granularity="day"
                      />
                    </div>

                    <Textarea label="Observações" placeholder="Informações adicionais sobre o usuário..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} minRows={3} />
                  </CardBody>
                </Card>

                <Card className="border border-white/10 bg-background/70 backdrop-blur">
                  <CardHeader>
                    <h4 className="text-md font-semibold">Configurações de Acesso</h4>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {role !== "CLIENTE" ? (
                        <Select
                          label="Função"
                          selectedKeys={new Set([role])}
                          onSelectionChange={(keys) => {
                            const [value] = Array.from(keys);
                            if (typeof value === "string") {
                              setRole(value as UserRole);
                            }
                          }}
                        >
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value}>{option.label}</SelectItem>
                          ))}
                        </Select>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-default-100/50 border border-default-200">
                          <div>
                            <p className="text-sm font-medium">Função</p>
                            <p className="text-xs text-default-500">Cliente</p>
                          </div>
                          <Chip color="secondary" size="sm" variant="flat">
                            CLIENTE
                          </Chip>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Usuário Ativo</p>
                          <p className="text-xs text-default-500">Permite login no sistema</p>
                        </div>
                        <Switch isSelected={active} onValueChange={setActive} color="success" />
                      </div>
                    </div>

                    {!isEditing && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Gerar Senha Temporária</p>
                          <p className="text-xs text-default-500">Cria uma senha aleatória para o usuário</p>
                        </div>
                        <Switch isSelected={generatePassword} onValueChange={setGeneratePassword} color="primary" />
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </Tab>

            {/* TAB 2: DADOS PROFISSIONAIS (só para advogados) */}
            {role === "ADVOGADO" && (
              <Tab
                key="oab"
                title={
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>Dados Profissionais</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <Card className="border border-white/10 bg-background/70 backdrop-blur">
                    <CardHeader>
                      <h4 className="text-md font-semibold">Informações da OAB</h4>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input label="Número da OAB" placeholder="123456" value={oabNumero} onChange={(e) => setOabNumero(e.target.value)} />
                        <Select
                          label="UF da OAB"
                          placeholder="Selecione o estado"
                          selectedKeys={oabUf ? new Set([oabUf]) : new Set()}
                          onSelectionChange={(keys) => {
                            const [value] = Array.from(keys);
                            setOabUf(typeof value === "string" ? value : "");
                          }}
                        >
                          {ufs.map((uf) => (
                            <SelectItem key={uf}>{uf}</SelectItem>
                          ))}
                        </Select>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Input label="Telefone Profissional" placeholder="(11) 3333-3333" value={telefoneAdvogado} onChange={(e) => setTelefoneAdvogado(e.target.value)} />
                        <Input label="WhatsApp" placeholder="(11) 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                      </div>

                      <Select
                        label="Especialidades Jurídicas"
                        placeholder="Selecione as especialidades"
                        selectionMode="multiple"
                        selectedKeys={new Set(especialidades)}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys) as string[];
                          setEspecialidades(selected);
                        }}
                      >
                        {Object.values(EspecialidadeJuridica).map((esp) => (
                          <SelectItem key={esp}>{especialidadeLabels[esp]}</SelectItem>
                        ))}
                      </Select>

                      <Textarea label="Biografia Profissional" placeholder="Conte um pouco sobre a experiência profissional..." value={bio} onChange={(e) => setBio(e.target.value)} minRows={4} />
                    </CardBody>
                  </Card>

                  <Card className="border border-white/10 bg-background/70 backdrop-blur">
                    <CardHeader>
                      <h4 className="text-md font-semibold">Configurações de Comissão</h4>
                      <p className="text-xs text-default-500">Percentuais padrão para cálculos automáticos de honorários</p>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <Input
                          label="Comissão Padrão (%)"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={comissaoPadrao}
                          onChange={(e) => setComissaoPadrao(e.target.value)}
                          endContent={<span className="text-default-400">%</span>}
                        />
                        <Input
                          label="Ação Ganha (%)"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={comissaoAcaoGanha}
                          onChange={(e) => setComissaoAcaoGanha(e.target.value)}
                          endContent={<span className="text-default-400">%</span>}
                        />
                        <Input
                          label="Honorários (%)"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={comissaoHonorarios}
                          onChange={(e) => setComissaoHonorarios(e.target.value)}
                          endContent={<span className="text-default-400">%</span>}
                        />
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </Tab>
            )}

            {/* TAB 2B: DADOS DO CLIENTE (só para clientes) */}
            {role === "CLIENTE" && (
              <Tab
                key="cliente"
                title={
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Dados do Cliente</span>
                  </div>
                }
              >
                <div className="space-y-6">
                  <Card className="border border-white/10 bg-background/70 backdrop-blur">
                    <CardHeader>
                      <h4 className="text-md font-semibold">Informações do Cliente</h4>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Select
                          label="Tipo de Pessoa"
                          selectedKeys={new Set([tipoPessoa])}
                          onSelectionChange={(keys) => {
                            const [value] = Array.from(keys);
                            if (typeof value === "string") {
                              setTipoPessoa(value);
                            }
                          }}
                        >
                          <SelectItem key="FISICA">Pessoa Física</SelectItem>
                          <SelectItem key="JURIDICA">Pessoa Jurídica</SelectItem>
                        </Select>
                        {tipoPessoa === "FISICA" ? (
                          <CpfInput label="CPF" placeholder="000.000.000-00" value={documento} onChange={setDocumento} />
                        ) : (
                          <CnpjInput
                            label="CNPJ"
                            placeholder="00.000.000/0000-00"
                            value={documento}
                            onChange={setDocumento}
                            onCnpjFound={(cnpjData: CnpjData) => {
                              addToast({
                                title: "CNPJ encontrado",
                                description: `${cnpjData.razao_social}`,
                                color: "success",
                              });
                            }}
                          />
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <DatePicker
                          label="Data de Nascimento"
                          value={dataNascimento as any}
                          onChange={(value: any) => setDataNascimento(value || undefined)}
                          showMonthAndYearPickers
                          granularity="day"
                        />
                        {tipoPessoa === "JURIDICA" && (
                          <Input label="Inscrição Estadual" placeholder="000.000.000.000" value={inscricaoEstadual} onChange={(e) => setInscricaoEstadual(e.target.value)} />
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Input label="Telefone" placeholder="(11) 3333-3333" value={telefoneCliente} onChange={(e) => setTelefoneCliente(e.target.value)} />
                        <Input label="Celular" placeholder="(11) 99999-9999" value={celular} onChange={(e) => setCelular(e.target.value)} />
                      </div>

                      <Divider />

                      <div className="space-y-4">
                        <h5 className="text-sm font-medium">Responsável (se aplicável)</h5>
                        <div className="grid gap-4 md:grid-cols-3">
                          <Input label="Nome do Responsável" placeholder="Nome completo" value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} />
                          <Input label="Email do Responsável" placeholder="email@responsavel.com" value={responsavelEmail} onChange={(e) => setResponsavelEmail(e.target.value)} />
                          <Input label="Telefone do Responsável" placeholder="(11) 99999-9999" value={responsavelTelefone} onChange={(e) => setResponsavelTelefone(e.target.value)} />
                        </div>
                      </div>

                      <Textarea
                        label="Observações"
                        placeholder="Informações adicionais sobre o cliente..."
                        value={observacoesCliente}
                        onChange={(e) => setObservacoesCliente(e.target.value)}
                        minRows={3}
                      />
                    </CardBody>
                  </Card>
                </div>
              </Tab>
            )}

            {/* TAB 3: ENDEREÇOS */}
            {isEditing && (
              <Tab
                key="enderecos"
                title={
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Endereços</span>
                  </div>
                }
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">Gerenciar Endereços</h3>
                      <p className="text-xs text-default-500">Endereços residenciais e comerciais do usuário</p>
                    </div>
                  </div>
                  <EnderecoManager userId={user!.id} />
                </div>
              </Tab>
            )}

            {/* TAB 4: PERMISSÕES */}
            <Tab
              key="permissions"
              title={
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Permissões</span>
                </div>
              }
            >
              <Card className="border border-white/10 bg-background/70 backdrop-blur">
                <CardHeader>
                  <h4 className="text-md font-semibold">Controle de Acesso</h4>
                  <p className="text-xs text-default-500">As permissões são definidas pela função do usuário</p>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Função Atual</p>
                      <Chip color="primary" size="lg" variant="flat">
                        {roleOptions.find((r) => r.value === role)?.label}
                      </Chip>
                    </div>

                    {isEditing && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Status</p>
                        <Chip color={active ? "success" : "warning"} size="lg" variant="flat">
                          {active ? "✓ Ativo" : "✗ Inativo"}
                        </Chip>
                      </div>
                    )}
                  </div>

                  <Divider />

                  <div className="space-y-3">
                    <h5 className="text-sm font-medium">Permissões por Função</h5>
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-default-100/50">
                        <span className="font-medium">Secretária:</span>
                        <span className="text-default-500">Acesso básico aos módulos</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-default-100/50">
                        <span className="font-medium">Advogado:</span>
                        <span className="text-default-500">Acesso completo aos processos e clientes</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-default-100/50">
                        <span className="font-medium">Financeiro:</span>
                        <span className="text-default-500">Acesso ao módulo financeiro e relatórios</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-default-100/50">
                        <span className="font-medium">Administrador:</span>
                        <span className="text-default-500">Acesso total + configurações do escritório</span>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <>
                      <Divider />
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Informações da Conta</h5>
                        <div className="grid gap-2 text-xs text-default-500">
                          <div className="flex justify-between">
                            <span>ID do Usuário:</span>
                            <span className="font-mono">{user?.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Criado em:</span>
                            <span>{new Date(user?.createdAt || "").toLocaleDateString("pt-BR")}</span>
                          </div>
                          {user?.lastLoginAt && (
                            <div className="flex justify-between">
                              <span>Último login:</span>
                              <span>
                                {new Date(user.lastLoginAt).toLocaleDateString("pt-BR")} às {new Date(user.lastLoginAt).toLocaleTimeString("pt-BR")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose} startContent={<X className="h-4 w-4" />}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSave} isLoading={isSaving} startContent={<Save className="h-4 w-4" />}>
            {isEditing ? "Salvar Alterações" : "Criar Usuário"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
