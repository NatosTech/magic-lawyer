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
import { Mail } from "lucide-react";

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
      addToast({
        title: res.success ? "Conexão OK" : "Falha na conexão",
        description: res.success
          ? `${type} verificado com sucesso`
          : `Verifique as credenciais ${type}`,
        color: res.success ? "success" : "danger",
      });
    } catch (error) {
      addToast({
        title: "Erro ao testar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        color: "danger",
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
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">
              Credenciais SMTP
            </h2>
          </div>
          <p className="text-sm text-default-400">
            Configure as credenciais de email para envio de notificações,
            convites e comunicações do escritório.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Select
              label="Tipo de credencial"
              selectedKeys={new Set([formType])}
              onSelectionChange={(keys) => {
                const [v] = Array.from(keys);
                if (typeof v === "string") setFormType(v as "DEFAULT" | "ADMIN");
              }}
            >
              <SelectItem key="DEFAULT" value="DEFAULT">
                DEFAULT
              </SelectItem>
              <SelectItem key="ADMIN" value="ADMIN">
                ADMIN
              </SelectItem>
            </Select>
            <Input
              label="Nome do remetente (From Name)"
              value={formFromName}
              onValueChange={setFormFromName}
              placeholder="Ex.: Sandra Advocacia"
            />
            <Input
              isRequired
              label="Email"
              type="email"
              value={formEmail}
              onValueChange={setFormEmail}
              placeholder="email@provedor.com"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-1">
            <Input
              isRequired
              label="Senha de App"
              type="password"
              value={formAppPassword}
              onValueChange={setFormAppPassword}
              placeholder="Senha de app do provedor"
              description="Para Gmail, use uma senha de app gerada em Segurança da Conta"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              color="primary"
              radius="full"
              isLoading={isSaving}
              onPress={handleSave}
            >
              Salvar credenciais
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            Credenciais cadastradas
          </h2>
          <p className="text-sm text-default-400">
            Visualize, teste e remova credenciais existentes.
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          {isLoading ? (
            <p className="text-sm text-default-400">Carregando...</p>
          ) : data && data.length ? (
            <Table removeWrapper aria-label="Credenciais SMTP">
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
                      <Chip
                        color={c.type === "DEFAULT" ? "primary" : "secondary"}
                        size="sm"
                        variant="flat"
                      >
                        {c.type}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-default-500">{c.email}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-default-500">
                        {c.fromName ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(c.updatedAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          radius="full"
                          variant="bordered"
                          color="success"
                          isLoading={isTesting === c.type}
                          onPress={() => handleTest(c.type)}
                        >
                          Testar
                        </Button>
                        <Button
                          size="sm"
                          radius="full"
                          variant="bordered"
                          color="danger"
                          onPress={() => handleDelete(c.type)}
                        >
                          Remover
                        </Button>
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

