"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { addToast } from "@heroui/toast";
import { Tooltip } from "@heroui/react";
import {
  Mail,
  Server,
  Info,
  CheckCircle2,
  XCircle,
  KeyRound,
  Eye,
  EyeOff,
  Plus,
  Send,
  Bell,
  Shield,
  Clock,
  Users,
  Zap,
} from "lucide-react";

import {
  listTenantEmailCredentials,
  upsertTenantEmailCredential,
  deleteTenantEmailCredential,
  testTenantEmailConnection,
} from "@/app/actions/tenant-email-credentials";
import { useSession } from "next-auth/react";

export function EmailCredentialsCard() {
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;

  const { data, mutate, isLoading } = useSWR(
    tenantId ? ["tenant-email-creds", tenantId] : null,
    async () => {
      if (!tenantId) return [];
      const res = await listTenantEmailCredentials(tenantId);
      if (!res.success) throw new Error("Falha ao carregar credenciais");
      return res.data as Array<{
        id: string;
        type: "DEFAULT" | "ADMIN";
        email: string;
        fromName: string | null;
        createdAt: string;
        updatedAt: string;
      }>;
    },
  );

  const [formType, setFormType] = useState<"DEFAULT" | "ADMIN">("DEFAULT");
  const [formEmail, setFormEmail] = useState("");
  const [formFromName, setFormFromName] = useState("");
  const [formAppPassword, setFormAppPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState<"DEFAULT" | "ADMIN" | null>(null);

  useEffect(() => {
    if (!data) return;
    const existing = data.find((c) => c.type === formType);
    setFormEmail(existing?.email ?? "");
    setFormFromName(existing?.fromName ?? "");
  }, [data, formType]);

  const handleSave = async () => {
    if (!tenantId) {
      addToast({
        title: "Erro",
        description: "Tenant ID não encontrado",
        color: "danger",
      });
      return;
    }

    if (!formEmail || !formAppPassword) {
      addToast({
        title: "Campos obrigatórios",
        description: "Informe email e senha de app",
        color: "warning",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await upsertTenantEmailCredential({
        tenantId,
        type: formType,
        email: formEmail,
        appPassword: formAppPassword,
        fromName: formFromName || null,
      });
      if (!res.success) throw new Error("Falha ao salvar credenciais");
      addToast({
        title: "Credenciais salvas",
        description: `${formType} atualizado com sucesso`,
        color: "success",
      });
      setFormAppPassword("");
      await mutate();
    } catch (error) {
      addToast({
        title: "Erro ao salvar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (type: "DEFAULT" | "ADMIN") => {
    if (!tenantId) {
      addToast({
        title: "Erro",
        description: "Tenant ID não encontrado",
        color: "danger",
      });
      return;
    }
    try {
      await deleteTenantEmailCredential(tenantId, type);
      addToast({
        title: "Removido",
        description: `${type} excluído com sucesso`,
        color: "success",
      });
      await mutate();
    } catch (error) {
      addToast({
        title: "Erro ao remover",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        color: "danger",
      });
    }
  };

  const handleTest = async (type: "DEFAULT" | "ADMIN") => {
    if (!tenantId) {
      addToast({
        title: "Erro",
        description: "Tenant ID não encontrado",
        color: "danger",
      });
      return;
    }
    setIsTesting(type);
    try {
      const res = await testTenantEmailConnection(tenantId, type);
      if (res.success) {
        addToast({
          title: "✅ Conexão verificada com sucesso",
          description: `As credenciais ${type} foram validadas. O sistema pode enviar emails usando esta conta.`,
          color: "success",
          timeout: 6000,
        });
      } else {
        addToast({
          title: "❌ Falha na verificação",
          description: `Não foi possível conectar com as credenciais ${type}. Verifique se o email e senha de app estão corretos.`,
          color: "danger",
          timeout: 8000,
        });
      }
    } catch (error) {
      addToast({
        title: "❌ Erro ao testar conexão",
          description:
          error instanceof Error ? error.message : "Erro desconhecido ao verificar conexão",
        color: "danger",
        timeout: 8000,
      });
    } finally {
      setIsTesting(null);
    }
  };

  if (!tenantId) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Card Informativo */}
      <Card className="border border-warning/20 bg-warning/5 backdrop-blur">
        <CardBody>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-warning/20 p-2">
              <Info className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold text-warning">📧 Configuração de Envio de Emails</h3>
              <p className="text-sm text-default-300">
                Esta seção configura as <strong>credenciais de envio</strong> que o sistema utiliza para <strong>enviar emails automaticamente</strong> (notificações, convites, faturas, lembretes, etc.). Os emails que você encontra em outras seções são apenas <strong>informações de contato</strong> e não são usados para envio.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Card de Configuração */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-default/20 p-2">
              <Server className="h-5 w-5 text-default-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Credenciais de Envio de Email
              </h2>
              <p className="text-sm text-default-400">
                Configure as credenciais de email para envio de notificações,
                convites e comunicações do escritório.
              </p>
            </div>
          </div>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Select
              label="Tipo de credencial"
              description={formType === "DEFAULT" ? "Uso geral (notificações, agenda, etc.)" : "Comunicações administrativas"}
              selectedKeys={formType ? [formType] : []}
              startContent={
                formType === "DEFAULT" ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : formType === "ADMIN" ? (
                  <Shield className="h-4 w-4 text-secondary" />
                ) : null
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                if (typeof value === "string") setFormType(value as "DEFAULT" | "ADMIN");
              }}
            >
              <SelectItem 
                key="DEFAULT" 
                textValue="DEFAULT - Uso Geral"
                description="Usado para envio de notificações automáticas (andamentos, lembretes, convites, faturas), emails da agenda e outras comunicações gerais do sistema."
                startContent={<Bell className="h-4 w-4 text-primary" />}
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <span>DEFAULT</span>
                  <Chip size="sm" color="primary" variant="flat">Uso Geral</Chip>
                </div>
              </SelectItem>
              <SelectItem 
                key="ADMIN" 
                textValue="ADMIN - Administrativo"
                description="Usado exclusivamente para comunicações administrativas importantes, como boas-vindas de novos advogados, credenciais iniciais e notificações críticas do sistema."
                startContent={<Shield className="h-4 w-4 text-secondary" />}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-secondary" />
                  <span>ADMIN</span>
                  <Chip size="sm" color="secondary" variant="flat">Administrativo</Chip>
                </div>
              </SelectItem>
            </Select>
            <Input
              label="De (From Name)"
              description="Nome que aparece como remetente"
              value={formFromName}
              onValueChange={setFormFromName}
              placeholder="Ex.: Sandra Advocacia"
              startContent={<Mail className="h-4 w-4 text-primary" />}
            />
            <Input
              isRequired
              label="Email do Provedor"
              description="Email da conta de envio (Gmail, Outlook, etc.)"
              type="email"
              value={formEmail}
              onValueChange={setFormEmail}
              placeholder="email@provedor.com"
              startContent={<Mail className="h-4 w-4 text-success" />}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-1">
            <Input
              isRequired
              label="Senha de App"
              description="Senha de aplicativo do provedor (não a senha da conta)"
              type={isPasswordVisible ? "text" : "password"}
              value={formAppPassword}
              onValueChange={setFormAppPassword}
              placeholder="senha de app/provedor"
              startContent={<KeyRound className="h-4 w-4 text-warning" />}
              endContent={
                formAppPassword ? (
                  <Button
                    isIconOnly
                    className="min-w-6 w-6 h-6 text-default-400 hover:text-default-600"
                    size="sm"
                    variant="light"
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                ) : null
              }
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              color="primary"
              radius="full"
              isLoading={isSaving}
              startContent={!isSaving ? <Plus className="h-4 w-4" /> : null}
              endContent={!isSaving ? <CheckCircle2 className="h-4 w-4" /> : null}
              onPress={handleSave}
            >
              {isSaving ? "Salvando..." : "Salvar credenciais"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Card de Credenciais Cadastradas */}
      <Card className="border border-success/20 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-success/20 p-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Credenciais cadastradas
              </h2>
              <p className="text-sm text-default-400">
                Visualize, teste e remova credenciais existentes.
              </p>
            </div>
          </div>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          {isLoading ? (
            <p className="text-sm text-default-400">Carregando...</p>
          ) : data && data.length ? (
            <Table removeWrapper aria-label="Credenciais de Envio">
              <TableHeader>
                <TableColumn>Tipo</TableColumn>
                <TableColumn>Email</TableColumn>
                <TableColumn>From Name</TableColumn>
                <TableColumn>Atualizado</TableColumn>
                <TableColumn className="text-right">Ações</TableColumn>
              </TableHeader>
              <TableBody>
                {data.map((c) => (
                  <TableRow key={c.type}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {c.type === "DEFAULT" ? (
                          <Chip 
                            color="primary" 
                            size="sm" 
                            variant="flat"
                            startContent={<Bell className="h-3 w-3" />}
                          >
                            DEFAULT
                          </Chip>
                        ) : (
                          <Chip 
                            color="secondary" 
                            size="sm" 
                            variant="flat"
                            startContent={<Shield className="h-3 w-3" />}
                          >
                            ADMIN
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-success" />
                        <span className="text-default-500">{c.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-default-500">
                          {c.fromName ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-default-400" />
                        <span className="text-default-500">{new Date(c.updatedAt).toLocaleString("pt-BR")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Tooltip content="Testa a conexão com o servidor de email do provedor (Gmail, Outlook, etc.) sem enviar email. Verifica se as credenciais estão corretas.">
                          <Button
                            size="sm"
                            radius="full"
                            variant="solid"
                            color="success"
                            isLoading={isTesting === c.type}
                            startContent={!isTesting ? <Zap className="h-4 w-4" /> : null}
                            onPress={() => handleTest(c.type)}
                          >
                            {isTesting === c.type ? "Testando..." : "Testar"}
                          </Button>
                        </Tooltip>
                        <Tooltip content="Remove permanentemente esta credencial. O sistema não poderá mais enviar emails usando este tipo.">
                          <Button
                            size="sm"
                            radius="full"
                            variant="bordered"
                            color="danger"
                            startContent={<XCircle className="h-4 w-4" />}
                            onPress={() => handleDelete(c.type)}
                          >
                            Remover
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-default-400">
              Nenhuma credencial cadastrada. Configure uma credencial acima.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

