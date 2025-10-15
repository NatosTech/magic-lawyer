"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Tabs, Tab } from "@heroui/tabs";
import { Spinner } from "@heroui/spinner";
import { toast } from "sonner";
import { User, Mail, Phone, Shield, Settings, BarChart3, UserCheck, Lock, Info, MapPin, Copy, CopyCheck, Briefcase, Save, CreditCard, Building2, PlusIcon, Pencil, Trash2, Star } from "lucide-react";
import { Select, SelectItem, Textarea } from "@heroui/react";

import { RoleSpecificInfo } from "./role-specific-info";

import { getCurrentUserProfile, updateUserProfile, changePassword, getUserStats, type UserProfile, type UpdateProfileData, type ChangePasswordData } from "@/app/actions/profile";
import { getCurrentUserAdvogado, updateCurrentUserAdvogado, type AdvogadoData, type UpdateAdvogadoInput } from "@/app/actions/advogados";
import { AvatarUpload } from "@/components/avatar-upload";
import { EnderecoManager } from "@/components/endereco-manager";
import { UserPermissionsInfo } from "@/components/user-permissions-info";
import { EspecialidadeJuridica } from "@/app/generated/prisma";
import { useEstadosBrasil } from "@/app/hooks/use-estados-brasil";
import { useCurrentUserAdvogado } from "@/app/hooks/use-current-user-advogado";
import { useMeusDadosBancarios, useBancosDisponiveis, useTiposConta, useTiposContaBancaria, useTiposChavePix } from "@/app/hooks/use-dados-bancarios";
import { createDadosBancarios, updateDadosBancarios, deleteDadosBancarios } from "@/app/actions/dados-bancarios";

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

export function ProfileContent() {
  const { data: session, update } = useSession();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dados-pessoais");
  const [copied, setCopied] = useState(false);

  // Buscar dados com SWR
  const { data: profileResult, mutate: mutateProfile } = useSWR("current-user-profile", getCurrentUserProfile);
  const { data: statsResult } = useSWR("user-stats", getUserStats);
  const { advogado, mutate: mutateAdvogado } = useCurrentUserAdvogado();
  const { ufs } = useEstadosBrasil();
  const { dadosBancarios: minhasContas, mutate: mutateContas } = useMeusDadosBancarios();
  const { bancos } = useBancosDisponiveis();
  const { tipos: tiposConta } = useTiposConta();
  const { tipos: tiposContaBancaria } = useTiposContaBancaria();
  const { tipos: tiposChavePix } = useTiposChavePix();

  const profile = profileResult?.success ? profileResult.profile : null;
  const stats = statsResult?.success ? statsResult.stats : null;
  const loading = !profileResult || !statsResult;

  // Estados dos formulários - inicializados diretamente com valores
  const [profileData, setProfileData] = useState<UpdateProfileData>({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    phone: profile?.phone || "",
    avatarUrl: profile?.avatarUrl || "",
  });

  const [advogadoData, setAdvogadoData] = useState<UpdateAdvogadoInput>({
    oabNumero: advogado?.oabNumero || "",
    oabUf: advogado?.oabUf || "",
    telefone: advogado?.telefone || "",
    whatsapp: advogado?.whatsapp || "",
    bio: advogado?.bio || "",
    especialidades: advogado?.especialidades || [],
    comissaoPadrao: advogado?.comissaoPadrao,
    comissaoAcaoGanha: advogado?.comissaoAcaoGanha,
    comissaoHonorarios: advogado?.comissaoHonorarios,
  });

  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    newPassword: "",
    confirmPassword: "",
  });

  // Atualizar dados pessoais
  const handleUpdateProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const result = await updateUserProfile(profileData);

      if (result.success) {
        toast.success("Perfil atualizado com sucesso!");
        // Revalidar dados com SWR
        await mutateProfile();
        // Atualizar sessão
        await update();
      } else {
        toast.error(result.error || "Erro ao atualizar perfil");
      }
    } catch (error) {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  // Alterar senha
  const handleChangePassword = async () => {
    setSaving(true);
    try {
      const result = await changePassword(passwordData);

      if (result.success) {
        toast.success("Senha alterada com sucesso!");
        setPasswordData({
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(result.error || "Erro ao alterar senha");
      }
    } catch (error) {
      toast.error("Erro ao alterar senha");
    } finally {
      setSaving(false);
    }
  };

  // Atualizar dados do advogado
  const handleUpdateAdvogado = async () => {
    if (!advogado) return;

    setSaving(true);
    try {
      const result = await updateCurrentUserAdvogado(advogadoData);

      if (result.success) {
        toast.success("Dados profissionais atualizados!");
        // Revalidar dados com SWR
        await mutateAdvogado();
      } else {
        toast.error(result.error || "Erro ao atualizar dados profissionais");
      }
    } catch (error) {
      toast.error("Erro ao atualizar dados profissionais");
    } finally {
      setSaving(false);
    }
  };

  // Atualizar avatar
  const handleAvatarChange = async (avatarUrl: string) => {
    try {
      // Atualizar estado local
      setProfileData({ ...profileData, avatarUrl });
      // Revalidar dados
      await mutateProfile();
      // Atualizar sessão
      await update();
    } catch (error) {
      console.error("Erro ao atualizar estado do avatar:", error);
    }
  };

  // Formatar role para exibição
  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      SUPER_ADMIN: "Super Administrador",
      ADMIN: "Administrador",
      ADVOGADO: "Advogado",
      SECRETARIA: "Secretária",
      FINANCEIRO: "Financeiro",
      CLIENTE: "Cliente",
    };

    return roleLabels[role] || role;
  };

  // Formatar data
  const formatDate = (date: Date | null) => {
    if (!date) return "Nunca";

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Copiar ID do usuário
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(profile?.id || "");
      setCopied(true);
      toast.success("ID copiado para a área de transferência!");

      // Resetar o ícone após 2 segundos
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error("Erro ao copiar ID");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-default-500">Erro ao carregar perfil</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Perfil */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardBody className="flex flex-row items-center gap-6 p-6">
          <AvatarUpload currentAvatarUrl={profile.avatarUrl} userName={profile.firstName || profile.email} onAvatarChange={handleAvatarChange} />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : profile.email}</h1>
            <p className="text-default-400">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Chip color="primary" size="sm" variant="flat">
                {getRoleLabel(profile.role)}
              </Chip>
              {profile.tenant && (
                <Chip color="secondary" size="sm" variant="flat">
                  {profile.tenant.name}
                </Chip>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Informações específicas por role */}
      <RoleSpecificInfo profile={profile} />

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl">
            <CardBody className="text-center p-4">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-white">{stats.totalProcessos}</p>
              <p className="text-sm text-primary-300">Processos</p>
            </CardBody>
          </Card>
          <Card className="border border-secondary/20 bg-gradient-to-br from-secondary/10 to-secondary/5 backdrop-blur-xl">
            <CardBody className="text-center p-4">
              <User className="w-8 h-8 mx-auto mb-2 text-secondary" />
              <p className="text-2xl font-bold text-white">{stats.totalDocumentos}</p>
              <p className="text-sm text-secondary-300">Documentos</p>
            </CardBody>
          </Card>
          <Card className="border border-success/20 bg-gradient-to-br from-success/10 to-success/5 backdrop-blur-xl">
            <CardBody className="text-center p-4">
              <Settings className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold text-white">{stats.totalEventos}</p>
              <p className="text-sm text-success-300">Eventos</p>
            </CardBody>
          </Card>
          <Card className="border border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5 backdrop-blur-xl">
            <CardBody className="text-center p-4">
              <Shield className="w-8 h-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold text-white">{stats.totalTarefas}</p>
              <p className="text-sm text-warning-300">Tarefas</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tabs de Configuração */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardBody className="p-0">
          <Tabs
            className="w-full justify-center mt-2"
            classNames={{
              tabList: "bg-default-100/50 p-1 justify-center",
              tab: "data-[selected=true]:bg-background data-[selected=true]:shadow-sm p-4",
              cursor: "bg-gradient-to-r from-primary to-secondary",
              panel: "w-full",
            }}
            color="primary"
            radius="lg"
            selectedKey={activeTab}
            variant="underlined"
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab
              key="dados-pessoais"
              title={
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Dados Pessoais</span>
                </div>
              }
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Informações Básicas</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome"
                    placeholder="Seu nome"
                    startContent={<User className="w-4 h-4 text-default-400" />}
                    value={profileData.firstName || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        firstName: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Sobrenome"
                    placeholder="Seu sobrenome"
                    startContent={<User className="w-4 h-4 text-default-400" />}
                    value={profileData.lastName || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        lastName: e.target.value,
                      })
                    }
                  />
                </div>

                <Input
                  disabled
                  description="O e-mail não pode ser alterado. Entre em contato com o suporte se necessário."
                  label="E-mail"
                  startContent={<Mail className="w-4 h-4 text-default-400" />}
                  value={profile.email}
                />

                <Input
                  label="Telefone"
                  placeholder="(11) 99999-9999"
                  startContent={<Phone className="w-4 h-4 text-default-400" />}
                  value={profileData.phone || ""}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />

                <Divider />

                <div className="flex justify-end">
                  <Button color="primary" disabled={saving} isLoading={saving} onPress={handleUpdateProfile}>
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </Tab>

            {advogado && (
              <Tab
                key="dados-profissionais"
                title={
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Dados Profissionais</span>
                  </div>
                }
              >
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Informações da OAB</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Número da OAB"
                      placeholder="123456"
                      value={advogadoData.oabNumero || ""}
                      onChange={(e) =>
                        setAdvogadoData({
                          ...advogadoData,
                          oabNumero: e.target.value,
                        })
                      }
                    />
                    <Select
                      label="UF da OAB"
                      placeholder="Selecione o estado"
                      selectedKeys={advogadoData.oabUf ? new Set([advogadoData.oabUf]) : new Set()}
                      onSelectionChange={(keys) => {
                        const [value] = Array.from(keys);
                        setAdvogadoData({
                          ...advogadoData,
                          oabUf: typeof value === "string" ? value : "",
                        });
                      }}
                    >
                      {ufs.map((uf) => (
                        <SelectItem key={uf}>{uf}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Telefone Profissional"
                      placeholder="(11) 3333-3333"
                      startContent={<Phone className="w-4 h-4 text-default-400" />}
                      value={advogadoData.telefone || ""}
                      onChange={(e) =>
                        setAdvogadoData({
                          ...advogadoData,
                          telefone: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="WhatsApp"
                      placeholder="(11) 99999-9999"
                      startContent={<Phone className="w-4 h-4 text-default-400" />}
                      value={advogadoData.whatsapp || ""}
                      onChange={(e) =>
                        setAdvogadoData({
                          ...advogadoData,
                          whatsapp: e.target.value,
                        })
                      }
                    />
                  </div>

                  <Select
                    label="Especialidades Jurídicas"
                    placeholder="Selecione suas especialidades"
                    selectionMode="multiple"
                    selectedKeys={new Set(advogadoData.especialidades || [])}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys) as string[];
                      setAdvogadoData({
                        ...advogadoData,
                        especialidades: selected as any[],
                      });
                    }}
                  >
                    {Object.values(EspecialidadeJuridica).map((esp) => (
                      <SelectItem key={esp}>{especialidadeLabels[esp]}</SelectItem>
                    ))}
                  </Select>

                  <Textarea
                    label="Biografia"
                    placeholder="Conte um pouco sobre sua experiência profissional..."
                    value={advogadoData.bio || ""}
                    onChange={(e) =>
                      setAdvogadoData({
                        ...advogadoData,
                        bio: e.target.value,
                      })
                    }
                    minRows={3}
                  />

                  <Divider className="my-6" />

                  <div className="space-y-4">
                    <h4 className="text-md font-semibold flex items-center gap-2">
                      <Settings className="w-4 h-4 text-primary" />
                      Configurações de Comissão
                    </h4>
                    <p className="text-xs text-default-500">Percentuais padrão para cálculos automáticos</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Comissão Padrão (%)"
                        type="number"
                        placeholder="0.00"
                        value={advogadoData.comissaoPadrao?.toString() || ""}
                        onChange={(e) =>
                          setAdvogadoData({
                            ...advogadoData,
                            comissaoPadrao: parseFloat(e.target.value) || 0,
                          })
                        }
                        endContent={<span className="text-default-400">%</span>}
                      />
                      <Input
                        label="Ação Ganha (%)"
                        type="number"
                        placeholder="0.00"
                        value={advogadoData.comissaoAcaoGanha?.toString() || ""}
                        onChange={(e) =>
                          setAdvogadoData({
                            ...advogadoData,
                            comissaoAcaoGanha: parseFloat(e.target.value) || 0,
                          })
                        }
                        endContent={<span className="text-default-400">%</span>}
                      />
                      <Input
                        label="Honorários (%)"
                        type="number"
                        placeholder="0.00"
                        value={advogadoData.comissaoHonorarios?.toString() || ""}
                        onChange={(e) =>
                          setAdvogadoData({
                            ...advogadoData,
                            comissaoHonorarios: parseFloat(e.target.value) || 0,
                          })
                        }
                        endContent={<span className="text-default-400">%</span>}
                      />
                    </div>
                  </div>

                  <Divider />

                  <div className="flex justify-end">
                    <Button color="primary" disabled={saving} isLoading={saving} onPress={handleUpdateAdvogado} startContent={<Save className="w-4 h-4" />}>
                      Salvar Dados Profissionais
                    </Button>
                  </div>
                </div>
              </Tab>
            )}

            <Tab
              key="seguranca"
              title={
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Segurança</span>
                </div>
              }
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Alterar Senha</h3>
                </div>

                <Input
                  label="Nova Senha"
                  placeholder="Digite sua nova senha"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />

                <Input
                  label="Confirmar Nova Senha"
                  placeholder="Confirme sua nova senha"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                />

                <Divider />

                <div className="flex justify-end">
                  <Button color="primary" disabled={saving} isLoading={saving} onPress={handleChangePassword}>
                    Alterar Senha
                  </Button>
                </div>
              </div>
            </Tab>

            <Tab
              key="informacoes"
              title={
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4" />
                  <span>Informações</span>
                </div>
              }
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Informações da Conta</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <p className="text-sm font-medium text-primary-300">Função</p>
                      </div>
                      <Chip color="primary" size="sm" variant="flat">
                        {getRoleLabel(profile.role)}
                      </Chip>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-success/10 to-success/5 border border-success/20">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCheck className="w-4 h-4 text-success" />
                        <p className="text-sm font-medium text-success-300">Status</p>
                      </div>
                      <Chip color={profile.active ? "success" : "danger"} size="sm" variant="flat">
                        {profile.active ? "Ativo" : "Inativo"}
                      </Chip>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings className="w-4 h-4 text-warning" />
                        <p className="text-sm font-medium text-warning-300">Último Login</p>
                      </div>
                      <p className="text-white font-medium">{formatDate(profile.lastLoginAt)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-secondary" />
                        <p className="text-sm font-medium text-secondary-300">Membro desde</p>
                      </div>
                      <p className="text-white font-medium">{formatDate(profile.createdAt)}</p>
                    </div>

                    {profile.tenant && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-info/10 to-info/5 border border-info/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-info" />
                          <p className="text-sm font-medium text-info-300">Escritório</p>
                        </div>
                        <Chip color="secondary" size="sm" variant="flat">
                          {profile.tenant.name}
                        </Chip>
                      </div>
                    )}

                    <div className="p-4 rounded-lg bg-gradient-to-r from-default/10 to-default/5 border border-default/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-default-400" />
                        <p className="text-sm font-medium text-default-400">ID do Usuário</p>
                        <button className="ml-2 p-1 rounded hover:bg-default-200 transition cursor-pointer" title="Copiar ID" type="button" onClick={handleCopyId}>
                          {copied ? <CopyCheck className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-default-400" />}
                        </button>
                      </div>
                      <p className="text-white font-mono text-xs">{profile.id}</p>
                    </div>
                  </div>
                </div>

                {/* Informações de Permissões */}
                <UserPermissionsInfo />
              </div>
            </Tab>

            <Tab
              key="dados-bancarios"
              title={
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Dados Bancários</span>
                </div>
              }
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Minhas Contas Bancárias</h3>
                  </div>
                  <Button color="primary" size="sm" startContent={<PlusIcon className="w-4 h-4" />} onPress={() => setActiveTab("dados-bancarios")}>
                    <a href="/dados-bancarios" className="text-white">
                      Gerenciar Contas
                    </a>
                  </Button>
                </div>

                {minhasContas.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">Nenhuma conta bancária cadastrada</p>
                    <Button color="primary" variant="flat" startContent={<PlusIcon className="w-4 h-4" />}>
                      <a href="/dados-bancarios" className="text-primary">
                        Cadastrar Primeira Conta
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {minhasContas.map((conta: any) => (
                      <Card key={conta.id} className="border">
                        <CardBody className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                <span className="font-semibold">{conta.banco}</span>
                                {conta.principal && (
                                  <Chip size="sm" color="primary" variant="flat" startContent={<Star className="w-3 h-3" />}>
                                    Principal
                                  </Chip>
                                )}
                                <Chip size="sm" color={conta.ativo ? "success" : "default"} variant="flat">
                                  {conta.ativo ? "Ativa" : "Inativa"}
                                </Chip>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-3">
                                <div>
                                  <p className="text-xs text-gray-500">Agência</p>
                                  <p className="font-medium">{conta.agencia}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Conta</p>
                                  <p className="font-medium">
                                    {conta.conta}
                                    {conta.digitoConta && `-${conta.digitoConta}`}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Tipo</p>
                                  <p className="font-medium capitalize">{conta.tipoContaBancaria.toLowerCase()}</p>
                                </div>
                                {conta.chavePix && (
                                  <div>
                                    <p className="text-xs text-gray-500">Chave PIX</p>
                                    <p className="font-medium text-sm">{conta.chavePix}</p>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-gray-500">Titular</p>
                                <p className="font-medium">{conta.titularNome}</p>
                                <p className="text-sm text-gray-500">{conta.titularDocumento}</p>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Dica:</strong> Use a página de Dados Bancários para adicionar, editar ou remover contas.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Tab>

            <Tab
              key="enderecos"
              title={
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Endereços</span>
                </div>
              }
            >
              <div className="p-6">
                <EnderecoManager />
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
