"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Tabs, Tab } from "@heroui/tabs";
import { Spinner } from "@heroui/spinner";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Shield,
  Settings,
  BarChart3,
  UserCheck,
  Lock,
  Info,
  MapPin,
  Copy,
  CopyCheck,
} from "lucide-react";

import { RoleSpecificInfo } from "./role-specific-info";

import {
  getCurrentUserProfile,
  updateUserProfile,
  changePassword,
  getUserStats,
  type UserProfile,
  type UpdateProfileData,
  type ChangePasswordData,
} from "@/app/actions/profile";
import { AvatarUpload } from "@/components/avatar-upload";
import { EnderecoManager } from "@/components/endereco-manager";
import { UserPermissionsInfo } from "@/components/user-permissions-info";

export function ProfileContent() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dados-pessoais");
  const [copied, setCopied] = useState(false);

  // Estados dos formulários
  const [profileData, setProfileData] = useState<UpdateProfileData>({});
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    newPassword: "",
    confirmPassword: "",
  });

  // Carregar dados do perfil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileResult, statsResult] = await Promise.all([
          getCurrentUserProfile(),
          getUserStats(),
        ]);

        if (profileResult.success && profileResult.profile) {
          setProfile(profileResult.profile);
          setProfileData({
            firstName: profileResult.profile.firstName || "",
            lastName: profileResult.profile.lastName || "",
            phone: profileResult.profile.phone || "",
            avatarUrl: profileResult.profile.avatarUrl || "",
          });
        }

        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }
      } catch (error) {
        toast.error("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Atualizar dados pessoais
  const handleUpdateProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const result = await updateUserProfile(profileData);

      if (result.success) {
        toast.success("Perfil atualizado com sucesso!");
        // Recarregar dados
        const profileResult = await getCurrentUserProfile();

        if (profileResult.success && profileResult.profile) {
          setProfile(profileResult.profile);
        }
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

  // Atualizar avatar
  const handleAvatarChange = async (avatarUrl: string) => {
    try {
      // Atualizar estado local
      if (profile) {
        setProfile({ ...profile, avatarUrl });
      }
      setProfileData({ ...profileData, avatarUrl });
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
          <AvatarUpload
            currentAvatarUrl={profile.avatarUrl}
            userName={profile.firstName || profile.email}
            onAvatarChange={handleAvatarChange}
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              {profile.firstName && profile.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : profile.email}
            </h1>
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
              <p className="text-2xl font-bold text-white">
                {stats.totalProcessos}
              </p>
              <p className="text-sm text-primary-300">Processos</p>
            </CardBody>
          </Card>
          <Card className="border border-secondary/20 bg-gradient-to-br from-secondary/10 to-secondary/5 backdrop-blur-xl">
            <CardBody className="text-center p-4">
              <User className="w-8 h-8 mx-auto mb-2 text-secondary" />
              <p className="text-2xl font-bold text-white">
                {stats.totalDocumentos}
              </p>
              <p className="text-sm text-secondary-300">Documentos</p>
            </CardBody>
          </Card>
          <Card className="border border-success/20 bg-gradient-to-br from-success/10 to-success/5 backdrop-blur-xl">
            <CardBody className="text-center p-4">
              <Settings className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold text-white">
                {stats.totalEventos}
              </p>
              <p className="text-sm text-success-300">Eventos</p>
            </CardBody>
          </Card>
          <Card className="border border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5 backdrop-blur-xl">
            <CardBody className="text-center p-4">
              <Shield className="w-8 h-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold text-white">
                {stats.totalTarefas}
              </p>
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
                  onChange={(e) =>
                    setProfileData({ ...profileData, phone: e.target.value })
                  }
                />

                <Divider />

                <div className="flex justify-end">
                  <Button
                    color="primary"
                    disabled={saving}
                    isLoading={saving}
                    onPress={handleUpdateProfile}
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </Tab>

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
                  <Button
                    color="primary"
                    disabled={saving}
                    isLoading={saving}
                    onPress={handleChangePassword}
                  >
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
                  <h3 className="text-lg font-semibold">
                    Informações da Conta
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <p className="text-sm font-medium text-primary-300">
                          Função
                        </p>
                      </div>
                      <Chip color="primary" size="sm" variant="flat">
                        {getRoleLabel(profile.role)}
                      </Chip>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-success/10 to-success/5 border border-success/20">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCheck className="w-4 h-4 text-success" />
                        <p className="text-sm font-medium text-success-300">
                          Status
                        </p>
                      </div>
                      <Chip
                        color={profile.active ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                      >
                        {profile.active ? "Ativo" : "Inativo"}
                      </Chip>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings className="w-4 h-4 text-warning" />
                        <p className="text-sm font-medium text-warning-300">
                          Último Login
                        </p>
                      </div>
                      <p className="text-white font-medium">
                        {formatDate(profile.lastLoginAt)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-secondary" />
                        <p className="text-sm font-medium text-secondary-300">
                          Membro desde
                        </p>
                      </div>
                      <p className="text-white font-medium">
                        {formatDate(profile.createdAt)}
                      </p>
                    </div>

                    {profile.tenant && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-info/10 to-info/5 border border-info/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-info" />
                          <p className="text-sm font-medium text-info-300">
                            Escritório
                          </p>
                        </div>
                        <Chip color="secondary" size="sm" variant="flat">
                          {profile.tenant.name}
                        </Chip>
                      </div>
                    )}

                    <div className="p-4 rounded-lg bg-gradient-to-r from-default/10 to-default/5 border border-default/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-default-400" />
                        <p className="text-sm font-medium text-default-400">
                          ID do Usuário
                        </p>
                        <button
                          className="ml-2 p-1 rounded hover:bg-default-200 transition cursor-pointer"
                          title="Copiar ID"
                          type="button"
                          onClick={handleCopyId}
                        >
                          {copied ? (
                            <CopyCheck className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4 text-default-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-white font-mono text-xs">
                        {profile.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informações de Permissões */}
                <UserPermissionsInfo />
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
