"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider";
import { ArrowLeft, Save, Scale, User, Building2, MapPin, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { title } from "@/components/primitives";
import { createProcesso, type ProcessoCreateInput } from "@/app/actions/processos";
import { ProcessoStatus } from "@/app/generated/prisma";
import { Spinner } from "@heroui/spinner";

export default function NovoProcessoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get("clienteId");

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProcessoCreateInput>({
    numero: "",
    titulo: "",
    descricao: "",
    status: ProcessoStatus.RASCUNHO,
    classeProcessual: "",
    vara: "",
    comarca: "",
    foro: "",
    rito: "",
    numeroInterno: "",
    clienteId: clienteIdParam || "",
    segredoJustica: false,
  });

  // Buscar dados necessários para os selects
  const [clientes, setClientes] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [advogados, setAdvogados] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Buscar clientes, áreas e advogados
    async function loadData() {
      try {
        // TODO: Criar Server Actions para buscar esses dados
        // Por enquanto, vou deixar vazio e você pode implementar depois
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

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
      const result = await createProcesso(formData);

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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
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
        <Button as={Link} href={clienteIdParam ? `/clientes/${clienteIdParam}` : "/processos"} variant="light" startContent={<ArrowLeft className="h-4 w-4" />}>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Número do Processo *"
                placeholder="0000000-00.0000.0.00.0000"
                value={formData.numero}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, numero: value }))}
                isRequired
                description="Número CNJ do processo"
              />

              <Input
                label="Número Interno"
                placeholder="Ex: 2024/001"
                value={formData.numeroInterno || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, numeroInterno: value }))}
                description="Número interno do escritório"
              />
            </div>

            <Input label="Título" placeholder="Ex: Ação de Despejo, Divórcio, etc." value={formData.titulo || ""} onValueChange={(value) => setFormData((prev) => ({ ...prev, titulo: value }))} />

            <Textarea
              label="Descrição"
              placeholder="Resumo do caso..."
              value={formData.descricao || ""}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, descricao: value }))}
              minRows={3}
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
                onSelectionChange={(keys) => setFormData((prev) => ({ ...prev, status: Array.from(keys)[0] as ProcessoStatus }))}
              >
                <SelectItem key={ProcessoStatus.RASCUNHO} value={ProcessoStatus.RASCUNHO}>
                  Rascunho
                </SelectItem>
                <SelectItem key={ProcessoStatus.EM_ANDAMENTO} value={ProcessoStatus.EM_ANDAMENTO}>
                  Em Andamento
                </SelectItem>
                <SelectItem key={ProcessoStatus.SUSPENSO} value={ProcessoStatus.SUSPENSO}>
                  Suspenso
                </SelectItem>
                <SelectItem key={ProcessoStatus.FINALIZADO} value={ProcessoStatus.FINALIZADO}>
                  Finalizado
                </SelectItem>
                <SelectItem key={ProcessoStatus.ARQUIVADO} value={ProcessoStatus.ARQUIVADO}>
                  Arquivado
                </SelectItem>
              </Select>

              <Input
                label="Classe Processual"
                placeholder="Ex: Procedimento Comum"
                value={formData.classeProcessual || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, classeProcessual: value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Rito" placeholder="Ex: Ordinário, Sumário" value={formData.rito || ""} onValueChange={(value) => setFormData((prev) => ({ ...prev, rito: value }))} />

              <Input
                type="number"
                label="Valor da Causa (R$)"
                placeholder="0,00"
                value={formData.valorCausa?.toString() || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, valorCausa: parseFloat(value) || undefined }))}
                startContent={<DollarSign className="h-4 w-4 text-default-400" />}
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
                value={formData.comarca || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, comarca: value }))}
                startContent={<MapPin className="h-4 w-4 text-default-400" />}
              />

              <Input label="Foro" placeholder="Ex: Foro Central" value={formData.foro || ""} onValueChange={(value) => setFormData((prev) => ({ ...prev, foro: value }))} />
            </div>

            <Input label="Vara" placeholder="Ex: 1ª Vara Cível" value={formData.vara || ""} onValueChange={(value) => setFormData((prev) => ({ ...prev, vara: value }))} />
          </div>

          <Divider />

          {/* Seção: Outras Informações */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-default-600">📅 Outras Informações</h3>

            <Input
              type="date"
              label="Data de Distribuição"
              value={formData.dataDistribuicao ? new Date(formData.dataDistribuicao).toISOString().split("T")[0] : ""}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, dataDistribuicao: value ? new Date(value) : undefined }))}
              startContent={<Calendar className="h-4 w-4 text-default-400" />}
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
            <Button color="primary" onPress={handleSubmit} isLoading={isSaving} startContent={!isSaving ? <Save className="h-4 w-4" /> : undefined}>
              Criar Processo
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
