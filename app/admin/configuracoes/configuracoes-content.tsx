"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Input } from "@heroui/input";

import { title, subtitle } from "@/components/primitives";

export function ConfiguracoesContent() {
  const [settings, setSettings] = React.useState({
    sistema: {
      nome: "Magic Lawyer",
      versao: "2025.3.0",
      ambiente: "Produção",
      manutencao: false,
    },
    email: {
      provider: "Resend",
      fromAddress: "noreply@magiclawyer.com",
      apiKey: "re_xxxxxxxxxxxxxxxxxx",
      ativo: true,
    },
    pagamentos: {
      stripeAtivo: true,
      pagarmeAtivo: false,
      webhookUrl: "https://api.magiclawyer.com/webhooks/pagamento",
    },
    seguranca: {
      loginDuploFator: true,
      sessoesSimultaneas: 3,
      tempoSessao: 8, // horas
    },
  });

  const handleSave = () => {
    // TODO: Implementar salvamento das configurações
  };

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Administração
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>
              Configurações do Sistema
            </h1>
            <p className={subtitle({ fullWidth: true })}>
              Gerencie as configurações gerais da plataforma
            </p>
          </div>
          <Button color="primary" variant="solid" onPress={handleSave}>
            💾 Salvar Configurações
          </Button>
        </div>
      </header>

      {/* Informações do Sistema */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            ℹ️ Informações do Sistema
          </h2>
          <p className="text-sm text-default-400">
            Configurações básicas da plataforma
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome do Sistema"
              value={settings.sistema.nome}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  sistema: { ...settings.sistema, nome: e.target.value },
                })
              }
            />
            <Input isReadOnly label="Versão" value={settings.sistema.versao} />
            <Input
              isReadOnly
              label="Ambiente"
              value={settings.sistema.ambiente}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Modo Manutenção
              </span>
              <Switch
                isSelected={settings.sistema.manutencao}
                onValueChange={(checked) =>
                  setSettings({
                    ...settings,
                    sistema: { ...settings.sistema, manutencao: checked },
                  })
                }
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Configurações de Email */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            📧 Configurações de Email
          </h2>
          <p className="text-sm text-default-400">
            Configuração do provedor Resend para envio de notificações
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Provedor"
              value={settings.email.provider}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  email: { ...settings.email, provider: e.target.value },
                })
              }
            />
            <Input
              label="Remetente (From Address)"
              value={settings.email.fromAddress}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  email: { ...settings.email, fromAddress: e.target.value },
                })
              }
            />
            <Input
              label="API Key"
              value={settings.email.apiKey}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  email: { ...settings.email, apiKey: e.target.value },
                })
              }
            />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Email Ativo
              </span>
              <Switch
                isSelected={settings.email.ativo}
                onValueChange={(checked) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, ativo: checked },
                  })
                }
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Configurações de Pagamento */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            💳 Configurações de Pagamento
          </h2>
          <p className="text-sm text-default-400">
            Integrações com gateways de pagamento
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Stripe Ativo
              </span>
              <Switch
                isSelected={settings.pagamentos.stripeAtivo}
                onValueChange={(checked) =>
                  setSettings({
                    ...settings,
                    pagamentos: {
                      ...settings.pagamentos,
                      stripeAtivo: checked,
                    },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Pagarme Ativo
              </span>
              <Switch
                isSelected={settings.pagamentos.pagarmeAtivo}
                onValueChange={(checked) =>
                  setSettings({
                    ...settings,
                    pagamentos: {
                      ...settings.pagamentos,
                      pagarmeAtivo: checked,
                    },
                  })
                }
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Webhook URL"
                value={settings.pagamentos.webhookUrl}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pagamentos: {
                      ...settings.pagamentos,
                      webhookUrl: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Configurações de Segurança */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">
            🔒 Configurações de Segurança
          </h2>
          <p className="text-sm text-default-400">
            Políticas de segurança e autenticação
          </p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Login Duplo Fator
              </span>
              <Switch
                isSelected={settings.seguranca.loginDuploFator}
                onValueChange={(checked) =>
                  setSettings({
                    ...settings,
                    seguranca: {
                      ...settings.seguranca,
                      loginDuploFator: checked,
                    },
                  })
                }
              />
            </div>
            <Input
              label="Sessões Simultâneas"
              type="number"
              value={settings.seguranca.sessoesSimultaneas.toString()}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  seguranca: {
                    ...settings.seguranca,
                    sessoesSimultaneas: parseInt(e.target.value) || 3,
                  },
                })
              }
            />
            <Input
              label="Tempo de Sessão (horas)"
              type="number"
              value={settings.seguranca.tempoSessao.toString()}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  seguranca: {
                    ...settings.seguranca,
                    tempoSessao: parseInt(e.target.value) || 8,
                  },
                })
              }
            />
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
