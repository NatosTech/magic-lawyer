"use client";

import React, { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Divider,
  Spinner,
  Switch,
  Textarea,
  Tabs,
  Tab,
} from "@heroui/react";
import { PlusIcon, PencilIcon, TrashIcon, SettingsIcon, FileTextIcon, GlobeIcon } from "lucide-react";
import { toast } from "sonner";

import { listarTiposGlobais, configurarTiposGlobaisTenant, createTipoPeticao, updateTipoPeticao, deleteTipoPeticao, listTiposPeticao, getCategoriasTipoPeticao } from "@/app/actions/tipos-peticao";

interface TipoGlobal {
  id: string;
  nome: string;
  categoria: string;
  ordem: number;
  global: boolean;
  ativo: boolean;
}

interface TipoCustomizado {
  id: string;
  nome: string;
  categoria: string;
  ordem: number;
  global: boolean;
  ativo: boolean;
  tenantId: string;
}

interface TipoFormData {
  nome: string;
  categoria: string;
  ordem: number;
  descricao?: string;
}

export default function ConfiguracaoTiposPeticaoPage() {
  // Estados
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("globais");

  // Formulário
  const [formData, setFormData] = useState<TipoFormData>({
    nome: "",
    categoria: "OUTROS",
    ordem: 1000,
    descricao: "",
  });

  // Estados para categorias
  const [categorias, setCategorias] = useState<any[]>([]);

  // Estados para dados
  const [tiposGlobais, setTiposGlobais] = useState<TipoGlobal[]>([]);
  const [tiposCustomizados, setTiposCustomizados] = useState<TipoCustomizado[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(true);

  // Carregar dados
  const loadData = async () => {
    try {
      setLoadingTipos(true);

      // Carregar categorias
      const categoriasResult = await getCategoriasTipoPeticao();
      if (categoriasResult.success) {
        setCategorias(categoriasResult.data);
      }

      // Carregar tipos globais
      const globaisResult = await listarTiposGlobais();
      if (globaisResult.success) {
        setTiposGlobais(globaisResult.data);
      }

      // Carregar tipos customizados do tenant
      const customizadosResult = await listTiposPeticao();
      if (customizadosResult.success) {
        // Filtrar apenas os customizados (com tenantId)
        const customizados = customizadosResult.data.filter((tipo: any) => tipo.tenantId);
        setTiposCustomizados(customizados);
      }
    } catch (error) {
      toast.error("Erro ao carregar tipos de petição");
    } finally {
      setLoadingTipos(false);
    }
  };

  // Carregar dados na montagem
  React.useEffect(() => {
    loadData();
  }, []);

  // Funções
  const handleToggleGlobal = async (tipoId: string, ativo: boolean) => {
    try {
      setLoading(true);
      const result = await configurarTiposGlobaisTenant(tipoId, ativo);

      if (result.success) {
        toast.success(result.message || "Configuração atualizada!");
        loadData();
      } else {
        toast.error(result.error || "Erro ao atualizar configuração");
      }
    } catch (error) {
      toast.error("Erro inesperado ao atualizar configuração");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tipo?: TipoCustomizado) => {
    if (tipo) {
      setEditingId(tipo.id);
      setFormData({
        nome: tipo.nome,
        categoria: tipo.categoria || "OUTROS",
        ordem: tipo.ordem,
        descricao: "",
      });
    } else {
      setEditingId(null);
      setFormData({
        nome: "",
        categoria: "OUTROS",
        ordem: 1000,
        descricao: "",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({
      nome: "",
      categoria: "OUTROS",
      ordem: 1000,
      descricao: "",
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!formData.nome.trim()) {
        toast.error("Nome é obrigatório");
        return;
      }

      let result;
      if (editingId) {
        result = await updateTipoPeticao(editingId, formData);
      } else {
        result = await createTipoPeticao(formData);
      }

      if (result.success) {
        toast.success(result.message || "Tipo salvo com sucesso!");
        loadData();
        handleCloseModal();
      } else {
        toast.error(result.error || "Erro ao salvar tipo");
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar tipo");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      const result = await deleteTipoPeticao(id);

      if (result.success) {
        toast.success("Tipo removido com sucesso!");
        loadData();
      } else {
        toast.error(result.error || "Erro ao remover tipo");
      }
    } catch (error) {
      toast.error("Erro inesperado ao remover tipo");
    } finally {
      setLoading(false);
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    const cat = categorias.find((c) => c.value === categoria);
    return cat?.label || categoria;
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      INICIAL: "success",
      RESPOSTA: "warning",
      RECURSO: "danger",
      EXECUCAO: "primary",
      URGENTE: "secondary",
      PROCEDIMENTO: "default",
      OUTROS: "default",
    };
    return colors[categoria] || "default";
  };

  const formatCategoria = (categoria: string) => {
    const labels: Record<string, string> = {
      INICIAL: "Inicial",
      RESPOSTA: "Resposta",
      RECURSO: "Recurso",
      EXECUCAO: "Execução",
      URGENTE: "Urgente",
      PROCEDIMENTO: "Procedimento",
      OUTROS: "Outros",
    };
    return labels[categoria] || categoria;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon size={28} />
            Configuração de Tipos de Petição
          </h1>
          <p className="text-gray-600">Gerencie os tipos de petição disponíveis no sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tab key="globais" title="Tipos Globais" startContent={<GlobeIcon size={16} />}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center w-full">
                <h2 className="text-lg font-semibold">Tipos Globais do Sistema</h2>
                <p className="text-sm text-gray-500">29 tipos padrão disponíveis para todos os tenants</p>
              </div>
            </CardHeader>
            <CardBody>
              {loadingTipos ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  {tiposGlobais.map((tipo) => (
                    <div key={tipo.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <FileTextIcon size={20} className="text-gray-400" />
                        <div>
                          <p className="font-medium">{tipo.nome}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Chip size="sm" color={getCategoriaColor(tipo.categoria)} variant="flat">
                              {formatCategoria(tipo.categoria)}
                            </Chip>
                            <Chip size="sm" variant="flat" color="primary">
                              Ordem: {tipo.ordem}
                            </Chip>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Ativo para este tenant:</span>
                        <Switch size="sm" isSelected={tipo.ativo} onValueChange={(ativo) => handleToggleGlobal(tipo.id, ativo)} isDisabled={loading} />
                      </div>
                    </div>
                  ))}

                  {tiposGlobais.length === 0 && (
                    <div className="text-center py-8">
                      <GlobeIcon size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Nenhum tipo global encontrado</p>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab key="customizados" title="Tipos Customizados" startContent={<PlusIcon size={16} />}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center w-full">
                <h2 className="text-lg font-semibold">Tipos Customizados</h2>
                <Button color="primary" startContent={<PlusIcon size={16} />} onPress={() => handleOpenModal()}>
                  Novo Tipo
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {loadingTipos ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  {tiposCustomizados.map((tipo) => (
                    <div key={tipo.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <FileTextIcon size={20} className="text-gray-400" />
                        <div>
                          <p className="font-medium">{tipo.nome}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Chip size="sm" color={getCategoriaColor(tipo.categoria)} variant="flat">
                              {formatCategoria(tipo.categoria)}
                            </Chip>
                            <Chip size="sm" variant="flat" color="default">
                              Ordem: {tipo.ordem}
                            </Chip>
                            <Chip size="sm" color="success" variant="flat">
                              Customizado
                            </Chip>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="light" startContent={<PencilIcon size={14} />} onPress={() => handleOpenModal(tipo)}>
                          Editar
                        </Button>
                        <Button size="sm" color="danger" variant="light" startContent={<TrashIcon size={14} />} onPress={() => handleDelete(tipo.id)}>
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}

                  {tiposCustomizados.length === 0 && (
                    <div className="text-center py-8">
                      <PlusIcon size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Nenhum tipo customizado criado</p>
                      <Button color="primary" variant="light" className="mt-2" onPress={() => handleOpenModal()}>
                        Criar Primeiro Tipo
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal de Criação/Edição */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} size="lg">
        <ModalContent>
          <ModalHeader>{editingId ? "Editar Tipo Customizado" : "Novo Tipo Customizado"}</ModalHeader>
          <ModalBody className="space-y-4">
            <Input label="Nome do Tipo" placeholder="Ex: Petição de Prestação de Contas" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} isRequired />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Categoria"
                placeholder="Selecione a categoria"
                selectedKeys={[formData.categoria]}
                onSelectionChange={(keys) => {
                  const categoria = Array.from(keys)[0] as string;
                  setFormData({ ...formData, categoria });
                }}
                isRequired
              >
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.value} textValue={categoria.label}>
                    <div className="flex items-center gap-2">
                      <span>{categoria.icon}</span>
                      <span>{categoria.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              <Input
                label="Ordem"
                placeholder="1000"
                type="number"
                value={formData.ordem.toString()}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1000 })}
                description="Números menores aparecem primeiro"
              />
            </div>

            <Textarea
              label="Descrição"
              placeholder="Descrição opcional do tipo de petição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleCloseModal}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSubmit} isLoading={loading}>
              {editingId ? "Atualizar" : "Criar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
