"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { ArrowLeft, Save, FileText, Plus, Trash2, Info, Code } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { title } from "@/components/primitives";
import { createModeloPeticao, type ModeloPeticaoCreateInput } from "@/app/actions/modelos-peticao";
import { useCategoriasModeloPeticao, useTiposModeloPeticao } from "@/app/hooks/use-modelos-peticao";

// Categorias padrão sugeridas
const CATEGORIAS_PADRAO = ["INICIAL", "CONTESTACAO", "RECURSO", "MANIFESTACAO", "AGRAVO", "APELACAO", "EMBARGOS", "PETICAO_SIMPLES"];

// Tipos padrão sugeridos
const TIPOS_PADRAO = ["CIVEL", "TRABALHISTA", "CRIMINAL", "TRIBUTARIO", "FAMILIA"];

// Variáveis padrão disponíveis
const VARIAVEIS_PADRAO = [
  { nome: "processo_numero", tipo: "texto", descricao: "Número do processo" },
  { nome: "processo_titulo", tipo: "texto", descricao: "Título do processo" },
  { nome: "cliente_nome", tipo: "texto", descricao: "Nome do cliente" },
  {
    nome: "cliente_documento",
    tipo: "texto",
    descricao: "CPF/CNPJ do cliente",
  },
  { nome: "advogado_nome", tipo: "texto", descricao: "Nome do advogado" },
  { nome: "advogado_oab", tipo: "texto", descricao: "OAB do advogado" },
  { nome: "tribunal_nome", tipo: "texto", descricao: "Nome do tribunal" },
  { nome: "data_atual", tipo: "data", descricao: "Data atual" },
  { nome: "valor", tipo: "numero", descricao: "Valor da causa" },
];

interface Variavel {
  nome: string;
  tipo: string;
  descricao: string;
  obrigatorio: boolean;
}

export default function NovoModeloPeticaoPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { categorias: categoriasExistentes } = useCategoriasModeloPeticao();
  const { tipos: tiposExistentes } = useTiposModeloPeticao();

  const [formData, setFormData] = useState<ModeloPeticaoCreateInput>({
    nome: "",
    descricao: "",
    conteudo: "",
    categoria: "",
    tipo: "",
    publico: false,
    ativo: true,
  });

  const [variaveis, setVariaveis] = useState<Variavel[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novoTipo, setNovoTipo] = useState("");

  const todasCategorias = [...new Set([...CATEGORIAS_PADRAO, ...categoriasExistentes])];
  const todosTipos = [...new Set([...TIPOS_PADRAO, ...tiposExistentes])];

  const handleAdicionarVariavel = (variavel: (typeof VARIAVEIS_PADRAO)[0]) => {
    if (variaveis.some((v) => v.nome === variavel.nome)) {
      toast.warning("Esta variável já foi adicionada");

      return;
    }

    setVariaveis([
      ...variaveis,
      {
        ...variavel,
        obrigatorio: false,
      },
    ]);

    // Adicionar placeholder no conteúdo
    setFormData((prev) => ({
      ...prev,
      conteudo: prev.conteudo + `{{${variavel.nome}}} `,
    }));

    toast.success(`Variável {{${variavel.nome}}} adicionada`);
  };

  const handleRemoverVariavel = (nome: string) => {
    setVariaveis(variaveis.filter((v) => v.nome !== nome));
  };

  const handleToggleObrigatorio = (nome: string) => {
    setVariaveis(variaveis.map((v) => (v.nome === nome ? { ...v, obrigatorio: !v.obrigatorio } : v)));
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome do modelo é obrigatório");

      return;
    }

    if (!formData.conteudo.trim()) {
      toast.error("Conteúdo do modelo é obrigatório");

      return;
    }

    startTransition(async () => {
      const payload: ModeloPeticaoCreateInput = {
        ...formData,
        categoria: novaCategoria || formData.categoria || undefined,
        tipo: novoTipo || formData.tipo || undefined,
        variaveis: variaveis.length > 0 ? variaveis : undefined,
      };

      const result = await createModeloPeticao(payload);

      if (result.success) {
        toast.success("Modelo criado com sucesso!");
        router.push("/modelos-peticao");
      } else {
        toast.error(result.error || "Erro ao criar modelo");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={title()}>Novo Modelo de Petição</h1>
          <p className="text-sm text-default-500 mt-1">Crie um modelo reutilizável com variáveis dinâmicas</p>
        </div>
        <Button as={Link} href="/modelos-peticao" startContent={<ArrowLeft className="h-4 w-4" />} variant="light">
          Voltar
        </Button>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Informações Básicas</h2>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          <Input isRequired label="Nome do Modelo" placeholder="Ex: Petição Inicial - Ação de Cobrança" value={formData.nome} onValueChange={(value) => setFormData({ ...formData, nome: value })} />

          <Textarea
            label="Descrição"
            minRows={3}
            placeholder="Descreva o propósito e uso deste modelo..."
            value={formData.descricao}
            onValueChange={(value) => setFormData({ ...formData, descricao: value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Select
                label="Categoria"
                placeholder="Selecione ou digite nova"
                selectedKeys={formData.categoria ? [formData.categoria] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;

                  setFormData({ ...formData, categoria: value });
                  setNovaCategoria("");
                }}
              >
                {todasCategorias.map((cat) => (
                  <SelectItem key={cat} textValue={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </Select>
              <Input placeholder="Ou digite nova categoria" size="sm" value={novaCategoria} onValueChange={setNovaCategoria} />
            </div>

            <div className="space-y-2">
              <Select
                label="Tipo"
                placeholder="Selecione ou digite novo"
                selectedKeys={formData.tipo ? [formData.tipo] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;

                  setFormData({ ...formData, tipo: value });
                  setNovoTipo("");
                }}
              >
                {todosTipos.map((tipo) => (
                  <SelectItem key={tipo} textValue={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </Select>
              <Input placeholder="Ou digite novo tipo" size="sm" value={novoTipo} onValueChange={setNovoTipo} />
            </div>
          </div>

          <div className="flex gap-4">
            <Checkbox isSelected={formData.ativo} onValueChange={(checked) => setFormData({ ...formData, ativo: checked })}>
              Modelo ativo
            </Checkbox>
            <Checkbox isSelected={formData.publico} onValueChange={(checked) => setFormData({ ...formData, publico: checked })}>
              Modelo público (compartilhado)
            </Checkbox>
          </div>
        </CardBody>
      </Card>

      {/* Variáveis Disponíveis */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-semibold">Variáveis Disponíveis</h2>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">Como usar variáveis</p>
              <p className="text-default-600">
                Clique nas variáveis abaixo para adicioná-las ao template. Elas serão substituídas automaticamente ao gerar uma petição. Use o formato{" "}
                <code className="bg-default-100 px-1 rounded">
                  {"{{"} variavel {"}}"}
                </code>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Variáveis Padrão:</p>
            <div className="flex flex-wrap gap-2">
              {VARIAVEIS_PADRAO.map((variavel) => (
                <Chip
                  key={variavel.nome}
                  color={variaveis.some((v) => v.nome === variavel.nome) ? "success" : "default"}
                  startContent={variaveis.some((v) => v.nome === variavel.nome) ? <span>✓</span> : <Plus className="h-3 w-3" />}
                  variant="flat"
                  onClick={() => handleAdicionarVariavel(variavel)}
                >
                  {variavel.nome}
                </Chip>
              ))}
            </div>
          </div>

          {variaveis.length > 0 && (
            <>
              <Divider />
              <div className="space-y-3">
                <p className="text-sm font-medium">Variáveis Adicionadas:</p>
                <div className="space-y-2">
                  {variaveis.map((variavel) => (
                    <div key={variavel.nome} className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {"{{"} {variavel.nome} {"}}"}
                        </p>
                        <p className="text-xs text-default-500">{variavel.descricao}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox isSelected={variavel.obrigatorio} size="sm" onValueChange={() => handleToggleObrigatorio(variavel.nome)}>
                          <span className="text-xs">Obrigatório</span>
                        </Checkbox>
                        <Button isIconOnly color="danger" size="sm" variant="light" onPress={() => handleRemoverVariavel(variavel.nome)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Conteúdo do Template */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold">Conteúdo do Template</h2>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <Textarea
            isRequired
            classNames={{
              input: "font-mono text-sm",
            }}
            label="Template"
            minRows={15}
            placeholder="Digite o conteúdo do modelo aqui. Use {{variavel}} para inserir variáveis dinâmicas."
            value={formData.conteudo}
            onValueChange={(value) => setFormData({ ...formData, conteudo: value })}
          />
        </CardBody>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <Button variant="light" onPress={() => router.push("/modelos-peticao")}>
          Cancelar
        </Button>
        <Button color="primary" isLoading={isPending} startContent={<Save className="h-4 w-4" />} onPress={handleSubmit}>
          Criar Modelo
        </Button>
      </div>
    </div>
  );
}
