"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
// import { Textarea } from "@heroui/textarea"; // Não existe no HeroUI

import { title, subtitle } from "@/components/primitives";

export function SuporteContent() {
  const [ticketForm, setTicketForm] = React.useState({
    assunto: "",
    categoria: "",
    prioridade: "Média",
    descricao: "",
  });

  const categorias = ["Bug/Erro", "Solicitação de Feature", "Problema de Performance", "Questão de Segurança", "Integração", "Outro"];

  const prioridades = ["Baixa", "Média", "Alta", "Crítica"];

  const handleSubmit = () => {
    // TODO: Implementar envio do ticket
    console.log("Enviando ticket:", ticketForm);
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-12 px-3 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Administração</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className={title({ size: "lg", color: "blue" })}>Central de Suporte</h1>
            <p className={subtitle({ fullWidth: true })}>Suporte técnico e ajuda para administradores do sistema</p>
          </div>
        </div>
      </header>

      {/* Informações de Contato */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-blue-600 mr-4">📧</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Email de Suporte</p>
              <p className="text-sm font-bold text-blue-600">admin@magiclawyer.com</p>
              <p className="text-xs text-gray-600">Resposta em 24h</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-green-600 mr-4">💬</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Chat Online</p>
              <p className="text-sm font-bold text-green-600">Disponível 24/7</p>
              <p className="text-xs text-gray-600">Suporte prioritário</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="flex items-center">
            <span className="text-3xl text-purple-600 mr-4">📞</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Telefone</p>
              <p className="text-sm font-bold text-purple-600">+55 11 99999-9999</p>
              <p className="text-xs text-gray-600">Seg-Sex 9h-18h</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Formulário de Ticket */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">🎫 Criar Ticket de Suporte</h2>
          <p className="text-sm text-default-400">Descreva sua solicitação ou problema</p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Assunto"
              placeholder="Resumo do problema ou solicitação"
              value={ticketForm.assunto}
              onChange={(e) =>
                setTicketForm({
                  ...ticketForm,
                  assunto: e.target.value,
                })
              }
            />
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Categoria</label>
              <select
                className="w-full px-3 py-2 bg-default-100 border border-default-200 rounded-lg text-white"
                value={ticketForm.categoria}
                onChange={(e) =>
                  setTicketForm({
                    ...ticketForm,
                    categoria: e.target.value,
                  })
                }
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat} className="bg-background text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Prioridade</label>
              <select
                className="w-full px-3 py-2 bg-default-100 border border-default-200 rounded-lg text-white"
                value={ticketForm.prioridade}
                onChange={(e) =>
                  setTicketForm({
                    ...ticketForm,
                    prioridade: e.target.value,
                  })
                }
              >
                {prioridades.map((pri) => (
                  <option key={pri} value={pri} className="bg-background text-white">
                    {pri}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Descrição Detalhada</label>
              <textarea
                className="w-full px-3 py-2 bg-default-100 border border-default-200 rounded-lg text-white min-h-[100px] resize-y"
                placeholder="Descreva o problema ou solicitação com o máximo de detalhes possível..."
                value={ticketForm.descricao}
                onChange={(e) =>
                  setTicketForm({
                    ...ticketForm,
                    descricao: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button color="primary" variant="solid" onPress={handleSubmit}>
              📤 Enviar Ticket
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Documentação */}
      <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2 pb-2">
          <h2 className="text-lg font-semibold text-white">📚 Documentação e Recursos</h2>
          <p className="text-sm text-default-400">Links úteis e documentação do sistema</p>
        </CardHeader>
        <Divider className="border-white/10" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-md font-semibold text-white">Documentação</h3>
              <div className="space-y-2">
                <Button variant="light" className="w-full justify-start">
                  📖 Guia de Administração
                </Button>
                <Button variant="light" className="w-full justify-start">
                  🔧 API Documentation
                </Button>
                <Button variant="light" className="w-full justify-start">
                  🏗️ Arquitetura do Sistema
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-md font-semibold text-white">Recursos</h3>
              <div className="space-y-2">
                <Button variant="light" className="w-full justify-start">
                  🎥 Vídeos Tutoriais
                </Button>
                <Button variant="light" className="w-full justify-start">
                  💡 Melhores Práticas
                </Button>
                <Button variant="light" className="w-full justify-start">
                  🔄 Changelog
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
