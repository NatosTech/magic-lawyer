"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Tabs, Tab } from "@heroui/tabs";
import { Spinner } from "@heroui/spinner";
import { toast } from "sonner";
import { User, Mail, Phone, Shield, Settings, BarChart3, Camera } from "lucide-react";

import {
  getCurrentUserProfile,
  updateUserProfile,
  changePassword,
  getUserStats,
  uploadAvatar,
  deleteAvatar,
  type UserProfile,
  type UpdateProfileData,
  type ChangePasswordData,
} from "@/app/actions/profile";
import { RoleSpecificInfo } from "./role-specific-info";
import { AvatarUpload } from "@/components/avatar-upload";

export function ProfileContent() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dados-pessoais");

  // Estados dos formulários
  const [profileData, setProfileData] = useState<UpdateProfileData>({});
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Carregar dados do perfil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileResult, statsResult] = await Promise.all([getCurrentUserProfile(), getUserStats()]);

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
          currentPassword: "",
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
              <Chip size="sm" color="primary" variant="flat">
                {getRoleLabel(profile.role)}
              </Chip>
              {profile.tenant && (
                <Chip size="sm" color="secondary" variant="flat">
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
          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardBody className="text-center p-4">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-white">{stats.totalProcessos}</p>
              <p className="text-sm text-default-400">Processos</p>
            </CardBody>
          </Card>
          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardBody className="text-center p-4">
              <User className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-white">{stats.totalDocumentos}</p>
              <p className="text-sm text-default-400">Documentos</p>
            </CardBody>
          </Card>
          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardBody className="text-center p-4">
              <Settings className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-white">{stats.totalEventos}</p>
              <p className="text-sm text-default-400">Eventos</p>
            </CardBody>
          </Card>
          <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
            <CardBody className="text-center p-4">
              <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-white">{stats.totalTarefas}</p>
              <p className="text-sm text-default-400">Tarefas</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tabs de Configuração */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardBody className="p-0">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
            classNames={{
              tabList: "bg-default-100/50",
              tab: "data-[selected=true]:bg-background",
            }}
          >
            <Tab key="dados-pessoais" title="Dados Pessoais">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Informações Básicas</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome"
                    placeholder="Seu nome"
                    value={profileData.firstName || ""}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    startContent={<User className="w-4 h-4 text-default-400" />}
                  />
                  <Input
                    label="Sobrenome"
                    placeholder="Seu sobrenome"
                    value={profileData.lastName || ""}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    startContent={<User className="w-4 h-4 text-default-400" />}
                  />
                </div>

                <Input
                  label="E-mail"
                  value={profile.email}
                  disabled
                  startContent={<Mail className="w-4 h-4 text-default-400" />}
                  description="O e-mail não pode ser alterado. Entre em contato com o suporte se necessário."
                />

                <Input
                  label="Telefone"
                  placeholder="(11) 99999-9999"
                  value={profileData.phone || ""}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  startContent={<Phone className="w-4 h-4 text-default-400" />}
                />

                <Divider />

                <div className="flex justify-end">
                  <Button color="primary" onPress={handleUpdateProfile} isLoading={saving} disabled={saving}>
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </Tab>

            <Tab key="seguranca" title="Segurança">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Alterar Senha</h3>
                </div>

                <Input
                  label="Senha Atual"
                  type="password"
                  placeholder="Digite sua senha atual"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />

                <Input
                  label="Nova Senha"
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />

                <Input
                  label="Confirmar Nova Senha"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />

                <Divider />

                <div className="flex justify-end">
                  <Button color="primary" onPress={handleChangePassword} isLoading={saving} disabled={saving}>
                    Alterar Senha
                  </Button>
                </div>
              </div>
            </Tab>

            <Tab key="informacoes" title="Informações">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Informações da Conta</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-default-600">Função</label>
                    <p className="text-white">{getRoleLabel(profile.role)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-default-600">Status</label>
                    <p className="text-white">{profile.active ? "Ativo" : "Inativo"}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-default-600">Último Login</label>
                    <p className="text-white">{formatDate(profile.lastLoginAt)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-default-600">Membro desde</label>
                    <p className="text-white">{formatDate(profile.createdAt)}</p>
                  </div>

                  {profile.tenant && (
                    <div>
                      <label className="text-sm font-medium text-default-600">Escritório</label>
                      <p className="text-white">{profile.tenant.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
