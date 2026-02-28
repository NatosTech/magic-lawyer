"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input } from "@heroui/react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Building2,
  User,
  Shield,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";

import {
  acceptConviteEquipe,
  rejectConviteEquipe,
  type ConviteEquipeData,
} from "@/app/actions/convites-equipe";

interface ConviteAcceptFormProps {
  convite: ConviteEquipeData;
}

export default function ConviteAcceptForm({ convite }: ConviteAcceptFormProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"accept" | "reject" | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const router = useRouter();

  function getStatusColor(status: string) {
    switch (status) {
      case "pendente":
        return "warning";
      case "aceito":
        return "success";
      case "rejeitado":
        return "danger";
      case "expirado":
        return "default";
      default:
        return "default";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "pendente":
        return <Clock className="w-5 h-5" />;
      case "aceito":
        return <CheckCircle className="w-5 h-5" />;
      case "rejeitado":
        return <XCircle className="w-5 h-5" />;
      case "expirado":
        return <Clock className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case "ADMIN":
        return "Administrador";
      case "ADVOGADO":
        return "Advogado";
      case "SECRETARIA":
        return "Secretária";
      case "CLIENTE":
        return "Cliente";
      default:
        return role;
    }
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  async function handleAccept() {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.password.trim()
    ) {
      toast.error("Preencha todos os campos obrigatórios");

      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");

      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");

      return;
    }

    try {
      setLoading(true);
      await acceptConviteEquipe(convite.token!, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
      });
      toast.success("Convite aceito com sucesso! Você pode fazer login agora.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Erro ao aceitar convite");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    try {
      setLoading(true);
      await rejectConviteEquipe(convite.token!);
      toast.success("Convite rejeitado");
      setAction("reject");
    } catch (error: any) {
      toast.error(error.message || "Erro ao rejeitar convite");
    } finally {
      setLoading(false);
    }
  }

  if (convite.status !== "pendente") {
    return (
      <Card className="shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div
              className={`p-3 rounded-full ${convite.status === "aceito" ? "bg-green-100" : convite.status === "rejeitado" ? "bg-red-100" : "bg-gray-100"}`}
            >
              {getStatusIcon(convite.status)}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {convite.status === "aceito"
              ? "Convite Aceito"
              : convite.status === "rejeitado"
                ? "Convite Rejeitado"
                : "Convite Expirado"}
          </h1>
        </CardHeader>
        <CardBody className="text-center">
          <p className="text-gray-600 mb-4">
            {convite.status === "aceito"
              ? "Este convite já foi aceito. Você pode fazer login no sistema."
              : convite.status === "rejeitado"
                ? "Este convite foi rejeitado."
                : "Este convite expirou. Solicite um novo convite se necessário."}
          </p>
          {convite.status === "aceito" && (
            <Button
              className="w-full"
              color="primary"
              size="lg"
              onPress={() => router.push("/login")}
            >
              Fazer Login
            </Button>
          )}
        </CardBody>
      </Card>
    );
  }

  if (action === "reject") {
    return (
      <Card className="shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-red-100">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Convite Rejeitado
          </h1>
        </CardHeader>
        <CardBody className="text-center">
          <p className="text-gray-600">
            Você rejeitou o convite para participar da equipe. Se mudar de
            ideia, solicite um novo convite.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-blue-100">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          Convite para Equipe
        </h1>
        <p className="text-gray-600">
          Você foi convidado para participar da equipe
        </p>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Informações do Convite */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Escritório</p>
              <p className="font-medium">
                {convite.enviadoPorUsuario?.firstName}{" "}
                {convite.enviadoPorUsuario?.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{convite.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Função</p>
              <p className="font-medium">{getRoleLabel(convite.role)}</p>
            </div>
          </div>

          {convite.cargo && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Cargo</p>
                <p className="font-medium">{convite.cargo.nome}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Expira em</p>
              <p className="font-medium">{formatDate(convite.expiraEm)}</p>
            </div>
          </div>
        </div>

        {convite.observacoes && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              Mensagem do convite:
            </h3>
            <p className="text-blue-800">{convite.observacoes}</p>
          </div>
        )}

        {/* Formulário de Aceitação */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">
            Complete seus dados para aceitar o convite:
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              isRequired
              label="Nome"
              placeholder="Seu nome"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
            <Input
              isRequired
              label="Sobrenome"
              placeholder="Seu sobrenome"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>

          <Input
            isRequired
            description="A senha deve ter pelo menos 6 caracteres"
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <Input
            isRequired
            label="Confirmar Senha"
            placeholder="Digite a senha novamente"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-4">
          <Button
            className="flex-1"
            color="danger"
            isLoading={loading}
            variant="light"
            onPress={handleReject}
          >
            Rejeitar
          </Button>
          <Button
            className="flex-1"
            color="primary"
            isLoading={loading}
            onPress={handleAccept}
          >
            Aceitar Convite
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
