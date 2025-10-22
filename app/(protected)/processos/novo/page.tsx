"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider";
import { ArrowLeft, Save, Scale, User, Building2, MapPin, Calendar, DollarSign, Flag, Layers, Landmark, Link2, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@heroui/spinner";

import { title } from "@/components/primitives";
import { createProcesso, type ProcessoCreateInput } from "@/app/actions/processos";
import { ProcessoStatus, ProcessoFase, ProcessoGrau } from "@/app/generated/prisma";
import { useClientesParaSelect } from "@/app/hooks/use-clientes";
import { useAdvogadosParaSelect } from "@/app/hooks/use-advogados-select";

export default function NovoProcessoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get("clienteId");

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProcessoCreateInput>({
    numero: "",
    numeroCnj: "",
    titulo: "",
    descricao: "",
    status: ProcessoStatus.RASCUNHO,
    classeProcessual: "",
    orgaoJulgador: "",
    vara: "",
    comarca: "",
    foro: "",
    rito: "",
    numeroInterno: "",
    pastaCompartilhadaUrl: "",
    clienteId: clienteIdParam || "",
    segredoJustica: false,
    advogadoResponsavelId: "",
  });

  // Buscar clientes para o select (apenas se não veio de um cliente)
  const { clientes, isLoading: isLoadingClientes } = useClientesParaSelect();
  const { advogados, isLoading: isLoadingAdvogados } = useAdvogadosParaSelect();

  const fases = Object.values(ProcessoFase);
  const graus = Object.values(ProcessoGrau);

  const getFaseLabel = (fase: ProcessoFase) => {
    switch (fase) {
      case ProcessoFase.PETICAO_INICIAL:
        return "Petição Inicial";
      case ProcessoFase.CITACAO:
        return "Citação";
      case ProcessoFase.INSTRUCAO:
        return "Instrução";
      case ProcessoFase.SENTENCA:
        return "Sentença";
      case ProcessoFase.RECURSO:
        return "Recurso";
      case ProcessoFase.EXECUCAO:
        return "Execução";
      default:
        return fase;
    }
  };

  const getGrauLabel = (grau: ProcessoGrau) => {
    switch (grau) {
      case ProcessoGrau.PRIMEIRO:
        return "1º Grau";
      case ProcessoGrau.SEGUNDO:
        return "2º Grau";
      case ProcessoGrau.SUPERIOR:
        return "Tribunal Superior";
      default:
        return grau;
    }
  };

  const handleSubmit = async () => {
    if (!formData.numero.trim()) {
      toast.error("Número do processo é obrigatório");

      return;
    }

    if (!formData.clienteId) {
      toast.error("Selecione um cliente");

      return;
    }

    setIsSaving(true);

    try {
      const payload: ProcessoCreateInput = {
        numero: formData.numero.trim(),
        clienteId: formData.clienteId,
        status: formData.status,
        segredoJustica: formData.segredoJustica,
      };

      if (formData.numeroCnj?.trim()) payload.numeroCnj = formData.numeroCnj.trim();
      if (formData.titulo?.trim()) payload.titulo = formData.titulo.trim();
      if (formData.descricao?.trim()) payload.descricao = formData.descricao.trim();
      if (formData.classeProcessual?.trim()) payload.classeProcessual = formData.classeProcessual.trim();
      if (formData.rito?.trim()) payload.rito = formData.rito.trim();
      if (formData.vara?.trim()) payload.vara = formData.vara.trim();
      if (formData.comarca?.trim()) payload.comarca = formData.comarca.trim();
      if (formData.foro?.trim()) payload.foro = formData.foro.trim();
      if (formData.orgaoJulgador?.trim()) payload.orgaoJulgador = formData.orgaoJulgador.trim();
      if (formData.numeroInterno?.trim()) payload.numeroInterno = formData.numeroInterno.trim();
      if (formData.pastaCompartilhadaUrl?.trim()) payload.pastaCompartilhadaUrl = formData.pastaCompartilhadaUrl.trim();
      if (formData.dataDistribuicao) payload.dataDistribuicao = formData.dataDistribuicao;
      if (formData.prazoPrincipal) payload.prazoPrincipal = formData.prazoPrincipal;
      if (formData.valorCausa !== undefined && !Number.isNaN(formData.valorCausa)) payload.valorCausa = formData.valorCausa;
      if (formData.areaId) payload.areaId = formData.areaId;
      if (formData.fase) payload.fase = formData.fase;
      if (formData.grau) payload.grau = formData.grau;
      if (formData.advogadoResponsavelId) payload.advogadoResponsavelId = formData.advogadoResponsavelId;

      const result = await createProcesso(payload);

      if (result.success) {
        toast.success("Processo criado com sucesso!");

        // Redirecionar baseado em onde veio
        if (clienteIdParam) {
          router.push(`/clientes/${clienteIdParam}`);
        } else {
          router.push("/processos");
        }
      } else {
        toast.error(result.error || "Erro ao criar processo");
      }
    } catch (error) {
      console.error("Erro ao criar processo:", error);
      toast.error("Erro ao criar processo");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingClientes && !clienteIdParam) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner label="Carregando dados..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={title()}>Novo Processo</h1>
          <p className="text-sm text-default-500 mt-1">Cadastrar novo processo jurídico</p>
        </div>
        <Button as={Link} href={clienteIdParam ? `/clientes/${clienteIdParam}` : "/processos"} startContent={<ArrowLeft className="h-4 w-4" />} variant="light">
          Voltar
        </Button>
      </div>

      {/* Aviso se veio de um cliente */}
      {clienteIdParam && (
        <Card className="border border-primary/20 bg-primary/5">
          <CardBody className="flex flex-row items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <p className="text-sm text-primary">Este processo será vinculado ao cliente selecionado</p>
          </CardBody>
        </Card>
      )}

      {/* Formulário */}
      <Card className="border border-default-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Informações do Processo</h2>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-6">
          {/* Seção: Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600">📋 Dados Básicos</h3>

            {/* Select de Cliente (se não veio de um cliente) */}
            {!clienteIdParam && (
              <Select
                isRequired
                description="Selecione o cliente vinculado a este processo"
                label="Cliente *"
                placeholder="Selecione um cliente"
                selectedKeys={formData.clienteId ? [formData.clienteId] : []}
                startContent={<User className="h-4 w-4 text-default-400" />}
                onSelectionChange={(keys) =>
                  setFormData((prev) => ({
                    ...prev,
                    clienteId: Array.from(keys)[0] as string,
                  }))
                }
              >
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} textValue={cliente.nome}>
                    <div className="flex items-center gap-2">
                      {cliente.tipoPessoa === "JURIDICA" ? <Building2 className="h-4 w-4 text-default-400" /> : <User className="h-4 w-4 text-default-400" />}
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{cliente.nome}</span>
                        {cliente.email && <span className="text-xs text-default-400">{cliente.email}</span>}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            )}

            {/* Select de Advogado Responsável */}
            <Select
              description="Selecione o advogado responsável por este processo"
              label="Advogado Responsável"
              placeholder="Selecione um advogado (opcional)"
              selectedKeys={formData.advogadoResponsavelId ? [formData.advogadoResponsavelId] : []}
              startContent={<Scale className="h-4 w-4 text-default-400" />}
              onSelectionChange={(keys) =>
                setFormData((prev) => ({
                  ...prev,
                  advogadoResponsavelId: (Array.from(keys)[0] as string) || "",
                }))
              }
            >
              {advogados?.map((advogado) => (
                <SelectItem key={advogado.id} textValue={advogado.label}>
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-default-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{advogado.label}</span>
                      {advogado.oab && <span className="text-xs text-default-400">OAB {advogado.oab}</span>}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </Select>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                isRequired
                description="Número CNJ do processo"
                label="Número do Processo *"
                placeholder="0000000-00.0000.0.00.0000"
                value={formData.numero}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, numero: value }))}
              />

              <Input
                description="Informe se houver diferença do número principal"
                label="Número CNJ (oficial)"
                placeholder="0000000-00.0000.0.00.0000"
                value={formData.numeroCnj || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, numeroCnj: value }))}
              />

              <Input
                description="Número interno do escritório"
                label="Número Interno"
                placeholder="Ex: 2024/001"
                value={formData.numeroInterno || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, numeroInterno: value }))}
              />
            </div>

            <Input label="Título" placeholder="Ex: Ação de Despejo, Divórcio, etc." value={formData.titulo || ""} onValueChange={(value) => setFormData((prev) => ({ ...prev, titulo: value }))} />

            <Textarea
              label="Descrição"
              minRows={3}
              placeholder="Resumo do caso..."
              value={formData.descricao || ""}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, descricao: value }))}
            />
          </div>

          <Divider />

          {/* Seção: Classificação */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600">⚖️ Classificação e Status</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                placeholder="Selecione o status"
                selectedKeys={formData.status ? [formData.status] : []}
                onSelectionChange={(keys) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: Array.from(keys)[0] as ProcessoStatus,
                  }))
                }
              >
                <SelectItem key={ProcessoStatus.RASCUNHO}>Rascunho</SelectItem>
                <SelectItem key={ProcessoStatus.EM_ANDAMENTO}>Em Andamento</SelectItem>
                <SelectItem key={ProcessoStatus.SUSPENSO}>Suspenso</SelectItem>
                <SelectItem key={ProcessoStatus.ENCERRADO}>Encerrado</SelectItem>
                <SelectItem key={ProcessoStatus.ARQUIVADO}>Arquivado</SelectItem>
              </Select>

              <Input
                label="Classe Processual"
                placeholder="Ex: Procedimento Comum"
                value={formData.classeProcessual || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, classeProcessual: value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Fase processual"
                placeholder="Selecione a fase"
                selectedKeys={formData.fase ? [formData.fase] : []}
                startContent={<Flag className="h-4 w-4 text-default-400" />}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0];

                  setFormData((prev) => ({
                    ...prev,
                    fase: key ? (key as ProcessoFase) : undefined,
                  }));
                }}
              >
                {fases.map((fase) => (
                  <SelectItem key={fase}>{getFaseLabel(fase)}</SelectItem>
                ))}
              </Select>

              <Select
                label="Grau"
                placeholder="Selecione o grau"
                selectedKeys={formData.grau ? [formData.grau] : []}
                startContent={<Layers className="h-4 w-4 text-default-400" />}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0];

                  setFormData((prev) => ({
                    ...prev,
                    grau: key ? (key as ProcessoGrau) : undefined,
                  }));
                }}
              >
                {graus.map((grau) => (
                  <SelectItem key={grau}>{getGrauLabel(grau)}</SelectItem>
                ))}
              </Select>
            </div>

            <Input
              label="Órgão Julgador"
              placeholder="Ex: 2ª Câmara de Direito Público"
              startContent={<Landmark className="h-4 w-4 text-default-400" />}
              value={formData.orgaoJulgador || ""}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, orgaoJulgador: value }))}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Rito" placeholder="Ex: Ordinário, Sumário" value={formData.rito || ""} onValueChange={(value) => setFormData((prev) => ({ ...prev, rito: value }))} />

              <Input
                label="Valor da Causa (R$)"
                placeholder="0,00"
                startContent={<DollarSign className="h-4 w-4 text-default-400" />}
                type="number"
                value={formData.valorCausa !== undefined && !Number.isNaN(formData.valorCausa) ? String(formData.valorCausa) : ""}
                onValueChange={(value) => {
                  const normalized = value.replace(/,/g, ".");
                  const numericValue = normalized.trim() === "" ? undefined : Number(normalized);

                  setFormData((prev) => ({
                    ...prev,
                    valorCausa: numericValue !== undefined && !Number.isNaN(numericValue) ? numericValue : undefined,
                  }));
                }}
              />
            </div>
          </div>

          <Divider />

          {/* Seção: Localização */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600">📍 Localização</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Comarca"
                placeholder="Ex: São Paulo"
                startContent={<MapPin className="h-4 w-4 text-default-400" />}
                value={formData.comarca || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, comarca: value }))}
              />

              <Input label="Foro" placeholder="Ex: Foro Central" value={formData.foro || ""} onValueChange={(value) => setFormData((prev) => ({ ...prev, foro: value }))} />
            </div>

            <Input label="Vara" placeholder="Ex: 1ª Vara Cível" value={formData.vara || ""} onValueChange={(value) => setFormData((prev) => ({ ...prev, vara: value }))} />
          </div>

          <Divider />

          {/* Seção: Outras Informações */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600">📅 Outras Informações</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Data de Distribuição"
                startContent={<Calendar className="h-4 w-4 text-default-400" />}
                type="date"
                value={formData.dataDistribuicao ? new Date(formData.dataDistribuicao).toISOString().split("T")[0] : ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    dataDistribuicao: value ? new Date(value) : undefined,
                  }))
                }
              />

              <Input
                label="Prazo Principal"
                startContent={<Clock className="h-4 w-4 text-default-400" />}
                type="date"
                value={formData.prazoPrincipal ? new Date(formData.prazoPrincipal).toISOString().split("T")[0] : ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    prazoPrincipal: value ? new Date(value) : undefined,
                  }))
                }
              />
            </div>

            <Input
              label="Pasta Compartilhada"
              placeholder="URL da pasta compartilhada com o cliente"
              startContent={<Link2 className="h-4 w-4 text-default-400" />}
              value={formData.pastaCompartilhadaUrl || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  pastaCompartilhadaUrl: value,
                }))
              }
            />

            <Checkbox isSelected={formData.segredoJustica} onValueChange={(checked) => setFormData((prev) => ({ ...prev, segredoJustica: checked }))}>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Segredo de Justiça</span>
                <span className="text-xs text-default-400">Marque se este processo corre em segredo de justiça</span>
              </div>
            </Checkbox>
          </div>

          {/* Informação */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-xs text-primary-600">💡 Após criar o processo, você poderá adicionar documentos, eventos, movimentações e vincular procurações.</p>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end">
            <Button variant="light" onPress={() => router.push(clienteIdParam ? `/clientes/${clienteIdParam}` : "/processos")}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={isSaving} startContent={!isSaving ? <Save className="h-4 w-4" /> : undefined} onPress={handleSubmit}>
              Criar Processo
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
