"use client";

import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Badge } from "@heroui/badge";
import { UserRole } from "@/app/generated/prisma";
import { UserProfile } from "@/app/actions/profile";
import { Scale, Building2, FileText, Shield, Users, DollarSign, Phone, Mail, MapPin } from "lucide-react";

interface RoleSpecificInfoProps {
  profile: UserProfile;
}

export function RoleSpecificInfo({ profile }: RoleSpecificInfoProps) {
  const renderAdvogadoInfo = () => {
    if (!profile.advogado) return null;

    return (
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-0">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Informações Profissionais</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.advogado.oabNumero && (
              <div>
                <label className="text-sm font-medium text-default-600">OAB</label>
                <p className="text-white">
                  {profile.advogado.oabUf} {profile.advogado.oabNumero}
                </p>
              </div>
            )}

            {profile.advogado.telefone && (
              <div>
                <label className="text-sm font-medium text-default-600">Telefone Profissional</label>
                <p className="text-white">{profile.advogado.telefone}</p>
              </div>
            )}
          </div>

          {profile.advogado.especialidades.length > 0 && (
            <div>
              <label className="text-sm font-medium text-default-600 mb-2 block">Especialidades</label>
              <div className="flex flex-wrap gap-2">
                {profile.advogado.especialidades.map((especialidade) => (
                  <Chip key={especialidade} size="sm" color="secondary" variant="flat">
                    {especialidade}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {profile.advogado.bio && (
            <div>
              <label className="text-sm font-medium text-default-600">Biografia</label>
              <p className="text-white text-sm mt-1">{profile.advogado.bio}</p>
            </div>
          )}

          {profile.advogado.whatsapp && (
            <div>
              <label className="text-sm font-medium text-default-600">WhatsApp</label>
              <p className="text-white">{profile.advogado.whatsapp}</p>
            </div>
          )}
        </CardBody>
      </Card>
    );
  };

  const renderAdminInfo = () => {
    return (
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Informações Administrativas</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-default-600">Escritório</label>
              <p className="text-white">{profile.tenant?.name || "N/A"}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-default-600">Slug do Escritório</label>
              <p className="text-white font-mono text-sm">{profile.tenant?.slug || "N/A"}</p>
            </div>
          </div>

          <Divider />

          <div>
            <label className="text-sm font-medium text-default-600 mb-2 block">Permissões Administrativas</label>
            <div className="flex flex-wrap gap-2">
              <Badge color="success" variant="flat">
                <Shield className="w-3 h-3 mr-1" />
                Gerenciar Equipe
              </Badge>
              <Badge color="success" variant="flat">
                <FileText className="w-3 h-3 mr-1" />
                Configurações
              </Badge>
              <Badge color="success" variant="flat">
                <DollarSign className="w-3 h-3 mr-1" />
                Financeiro
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderClienteInfo = () => {
    return (
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-0">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Informações do Cliente</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-default-600">Escritório Vinculado</label>
              <p className="text-white">{profile.tenant?.name || "N/A"}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-default-600">Status da Conta</label>
              <Badge color={profile.active ? "success" : "danger"} variant="flat">
                {profile.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>

          <Divider />

          <div>
            <label className="text-sm font-medium text-default-600 mb-2 block">Acesso Permitido</label>
            <div className="flex flex-wrap gap-2">
              <Badge color="primary" variant="flat">
                <FileText className="w-3 h-3 mr-1" />
                Meus Documentos
              </Badge>
              <Badge color="primary" variant="flat">
                <Users className="w-3 h-3 mr-1" />
                Meus Processos
              </Badge>
              <Badge color="primary" variant="flat">
                <DollarSign className="w-3 h-3 mr-1" />
                Minhas Faturas
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderSuperAdminInfo = () => {
    return (
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Informações do Super Administrador</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-default-600">Nível de Acesso</label>
              <Badge color="warning" variant="flat">
                <Shield className="w-3 h-3 mr-1" />
                Super Administrador
              </Badge>
            </div>

            <div>
              <label className="text-sm font-medium text-default-600">Status da Conta</label>
              <Badge color={profile.active ? "success" : "danger"} variant="flat">
                {profile.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>

          <Divider />

          <div>
            <label className="text-sm font-medium text-default-600 mb-2 block">Permissões do Sistema</label>
            <div className="flex flex-wrap gap-2">
              <Badge color="warning" variant="flat">
                <Building2 className="w-3 h-3 mr-1" />
                Gerenciar Tenants
              </Badge>
              <Badge color="warning" variant="flat">
                <Users className="w-3 h-3 mr-1" />
                Gerenciar Usuários
              </Badge>
              <Badge color="warning" variant="flat">
                <Scale className="w-3 h-3 mr-1" />
                Gerenciar Juízes
              </Badge>
              <Badge color="warning" variant="flat">
                <DollarSign className="w-3 h-3 mr-1" />
                Configurações de Preço
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderRoleSpecificContent = () => {
    switch (profile.role) {
      case "ADVOGADO":
        return renderAdvogadoInfo();
      case "ADMIN":
        return renderAdminInfo();
      case "CLIENTE":
        return renderClienteInfo();
      case "SUPER_ADMIN":
        return renderSuperAdminInfo();
      default:
        return null;
    }
  };

  return <>{renderRoleSpecificContent()}</>;
}
