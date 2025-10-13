"use client";

import { useState } from "react";
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
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import { User, Briefcase, Shield, Save, X, MapPin } from "lucide-react";

import { updateTenantUser, createTenantUser } from "@/app/actions/admin";
import { UserRole, EspecialidadeJuridica } from "@/app/generated/prisma";
import { useEstadosBrasil } from "@/app/hooks/use-estados-brasil";

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
  
  // Buscar UFs com SWR
  const { ufs } = useEstadosBrasil();
  
  // Estados para dados pessoais
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [active, setActive] = useState(user?.active ?? true);
  
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
  
  // Estados para permissões
  const [role, setRole] = useState<UserRole>(user?.role || "SECRETARIA");
  const [generatePassword, setGeneratePassword] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userData: any = {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email,
        phone: phone || undefined,
        role: role,
        active: active,
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
      };

      const response = isEditing 
        ? await updateTenantUser(tenantId, user!.id, userData) 
        : await createTenantUser(tenantId, userData);

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
                      <div className="flex items-center gap-4 pb-4">
                        <Avatar src={user?.avatarUrl || undefined} name={`${firstName} ${lastName}`} size="lg" className="flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{firstName && lastName ? `${firstName} ${lastName}` : "Usuário"}</p>
                          <p className="text-xs text-default-500">O avatar é gerenciado pelo próprio usuário</p>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <Input 
                        isRequired 
                        label="Nome" 
                        placeholder="João" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                      />
                      <Input 
                        isRequired 
                        label="Sobrenome" 
                        placeholder="Silva" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Input 
                        isRequired 
                        type="email" 
                        label="Email" 
                        placeholder="joao@escritorio.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                      />
                      <Input 
                        label="Telefone Pessoal" 
                        placeholder="(11) 99999-9999" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                      />
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-white/10 bg-background/70 backdrop-blur">
                  <CardHeader>
                    <h4 className="text-md font-semibold">Configurações de Acesso</h4>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
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
                        <Input 
                          label="Número da OAB" 
                          placeholder="123456" 
                          value={oabNumero} 
                          onChange={(e) => setOabNumero(e.target.value)} 
                        />
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
                        <Input 
                          label="Telefone Profissional" 
                          placeholder="(11) 3333-3333" 
                          value={telefoneAdvogado} 
                          onChange={(e) => setTelefoneAdvogado(e.target.value)} 
                        />
                        <Input 
                          label="WhatsApp" 
                          placeholder="(11) 99999-9999" 
                          value={whatsapp} 
                          onChange={(e) => setWhatsapp(e.target.value)} 
                        />
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

                      <Textarea 
                        label="Biografia Profissional" 
                        placeholder="Conte um pouco sobre a experiência profissional..." 
                        value={bio} 
                        onChange={(e) => setBio(e.target.value)} 
                        minRows={4} 
                      />
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
                <Card className="border border-white/10 bg-background/70 backdrop-blur">
                  <CardHeader>
                    <h4 className="text-md font-semibold">Gerenciar Endereços</h4>
                    <p className="text-xs text-default-500">
                      Endereços residenciais e comerciais do usuário
                    </p>
                  </CardHeader>
                  <CardBody>
                    <div className="text-sm text-default-500">
                      <p>O usuário pode gerenciar seus próprios endereços acessando:</p>
                      <p className="font-mono text-xs mt-2 p-2 bg-default-100 rounded">
                        Perfil → Endereços
                      </p>
                      <p className="mt-4 text-xs">
                        Como Super Admin, você gerencia apenas dados cadastrais básicos e permissões.
                        Endereços são gerenciados pelo próprio usuário para maior segurança.
                      </p>
                    </div>
                  </CardBody>
                </Card>
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
                              <span>{new Date(user.lastLoginAt).toLocaleDateString("pt-BR")} às {new Date(user.lastLoginAt).toLocaleTimeString("pt-BR")}</span>
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
