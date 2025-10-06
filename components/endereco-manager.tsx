"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { toast } from "sonner";
import { MapPin, Plus, Edit3, Trash2, Star, StarOff, Home, Building2, Briefcase, Mail } from "lucide-react";
import { getEnderecosUsuario, criarEndereco, atualizarEndereco, deletarEndereco, definirEnderecoPrincipal, EnderecoData, EnderecoWithId } from "@/app/actions/enderecos";
import { TipoEndereco } from "@/app/generated/prisma";

const tipoEnderecoOptions = [
  { key: "MATRIZ", label: "Matriz", icon: Home },
  { key: "FILIAL", label: "Filial", icon: Building2 },
  { key: "ESCRITORIO", label: "Escritório", icon: Briefcase },
];

const estadosBrasil = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

interface EnderecoManagerProps {
  className?: string;
}

export function EnderecoManager({ className }: EnderecoManagerProps) {
  const [enderecos, setEnderecos] = useState<EnderecoWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEndereco, setEditingEndereco] = useState<EnderecoWithId | null>(null);
  const [formData, setFormData] = useState<EnderecoData>({
    apelido: "",
    tipo: "MATRIZ" as TipoEndereco,
    principal: false,
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    pais: "Brasil",
    telefone: "",
    observacoes: "",
  });

  // Carregar endereços
  useEffect(() => {
    loadEnderecos();
  }, []);

  const loadEnderecos = async () => {
    try {
      setLoading(true);
      const result = await getEnderecosUsuario();

      if (result.success && result.enderecos) {
        setEnderecos(result.enderecos);
      } else {
        toast.error(result.error || "Erro ao carregar endereços");
      }
    } catch (error) {
      toast.error("Erro ao carregar endereços");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (endereco?: EnderecoWithId) => {
    if (endereco) {
      setEditingEndereco(endereco);
      setFormData({
        apelido: endereco.apelido,
        tipo: endereco.tipo,
        principal: endereco.principal,
        logradouro: endereco.logradouro,
        numero: endereco.numero || "",
        complemento: endereco.complemento || "",
        bairro: endereco.bairro || "",
        cidade: endereco.cidade,
        estado: endereco.estado,
        cep: endereco.cep || "",
        pais: endereco.pais || "Brasil",
        telefone: endereco.telefone || "",
        observacoes: endereco.observacoes || "",
      });
    } else {
      setEditingEndereco(null);
      setFormData({
        apelido: "",
        tipo: "MATRIZ" as TipoEndereco,
        principal: false,
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
        pais: "Brasil",
        telefone: "",
        observacoes: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEndereco(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      let result;
      if (editingEndereco) {
        result = await atualizarEndereco(editingEndereco.id, formData);
      } else {
        result = await criarEndereco(formData);
      }

      if (result.success) {
        toast.success(editingEndereco ? "Endereço atualizado!" : "Endereço criado!");
        await loadEnderecos();
        handleCloseModal();
      } else {
        toast.error(result.error || "Erro ao salvar endereço");
      }
    } catch (error) {
      toast.error("Erro ao salvar endereço");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (enderecoId: string) => {
    if (!confirm("Tem certeza que deseja deletar este endereço?")) return;

    try {
      setSaving(true);
      const result = await deletarEndereco(enderecoId);

      if (result.success) {
        toast.success("Endereço deletado!");
        await loadEnderecos();
      } else {
        toast.error(result.error || "Erro ao deletar endereço");
      }
    } catch (error) {
      toast.error("Erro ao deletar endereço");
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrincipal = async (enderecoId: string) => {
    try {
      setSaving(true);
      const result = await definirEnderecoPrincipal(enderecoId);

      if (result.success) {
        toast.success("Endereço definido como principal!");
        await loadEnderecos();
      } else {
        toast.error(result.error || "Erro ao definir endereço principal");
      }
    } catch (error) {
      toast.error("Erro ao definir endereço principal");
    } finally {
      setSaving(false);
    }
  };

  const getTipoIcon = (tipo: TipoEndereco) => {
    const tipoOption = tipoEnderecoOptions.find((opt) => opt.key === tipo);
    return tipoOption ? tipoOption.icon : Home;
  };

  const getTipoLabel = (tipo: TipoEndereco) => {
    const tipoOption = tipoEnderecoOptions.find((opt) => opt.key === tipo);
    return tipoOption ? tipoOption.label : tipo;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardBody className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Meus Endereços</h3>
              <p className="text-sm text-default-400">Gerencie seus endereços</p>
            </div>
          </div>
          <Button color="primary" variant="bordered" startContent={<Plus className="w-4 h-4" />} onPress={() => handleOpenModal()} isDisabled={saving}>
            Adicionar
          </Button>
        </CardHeader>

        <CardBody className="space-y-4">
          {enderecos.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-default-400 mx-auto mb-4" />
              <p className="text-default-400">Nenhum endereço cadastrado</p>
              <p className="text-sm text-default-500">Adicione seu primeiro endereço</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {enderecos.map((endereco) => {
                const TipoIcon = getTipoIcon(endereco.tipo);
                return (
                  <Card key={endereco.id} className="border border-white/10 bg-background/50">
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <TipoIcon className="w-5 h-5 text-primary" />
                            <h4 className="font-semibold text-white">{endereco.apelido}</h4>
                            {endereco.principal && (
                              <Chip size="sm" color="primary" variant="flat">
                                <Star className="w-3 h-3 mr-1" />
                                Principal
                              </Chip>
                            )}
                            <Chip size="sm" color="secondary" variant="flat">
                              {getTipoLabel(endereco.tipo)}
                            </Chip>
                          </div>

                          <div className="text-sm text-default-300 space-y-1">
                            <p>
                              {endereco.logradouro}
                              {endereco.numero && `, ${endereco.numero}`}
                              {endereco.complemento && `, ${endereco.complemento}`}
                            </p>
                            <p>
                              {endereco.bairro && `${endereco.bairro}, `}
                              {endereco.cidade} - {endereco.estado}
                              {endereco.cep && `, ${endereco.cep}`}
                            </p>
                            {endereco.telefone && <p>📞 {endereco.telefone}</p>}
                            {endereco.observacoes && <p className="text-default-400 italic">💬 {endereco.observacoes}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {!endereco.principal && (
                            <Button size="sm" variant="ghost" color="warning" startContent={<Star className="w-4 h-4" />} onPress={() => handleSetPrincipal(endereco.id)} isDisabled={saving}>
                              Principal
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" color="primary" startContent={<Edit3 className="w-4 h-4" />} onPress={() => handleOpenModal(endereco)} isDisabled={saving}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            color="danger"
                            startContent={<Trash2 className="w-4 h-4" />}
                            onPress={() => handleDelete(endereco.id)}
                            isDisabled={saving || enderecos.length <= 1}
                          >
                            Deletar
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Edição/Criação */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-semibold">{editingEndereco ? "Editar Endereço" : "Novo Endereço"}</h2>
          </ModalHeader>

          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Apelido" placeholder="Ex: Casa, Trabalho, Escritório" value={formData.apelido} onChange={(e) => setFormData({ ...formData, apelido: e.target.value })} isRequired />

              <Select
                label="Tipo"
                selectedKeys={[formData.tipo]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as TipoEndereco;
                  setFormData({ ...formData, tipo: selected });
                }}
                isRequired
              >
                {tipoEnderecoOptions.map((option) => (
                  <SelectItem key={option.key}>
                    <div className="flex items-center gap-2">
                      <option.icon className="w-4 h-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Input label="Logradouro" placeholder="Rua, Avenida, etc." value={formData.logradouro} onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })} isRequired />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Número" placeholder="123" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} />

              <Input label="Complemento" placeholder="Apto, Sala, etc." value={formData.complemento} onChange={(e) => setFormData({ ...formData, complemento: e.target.value })} />

              <Input label="CEP" placeholder="00000-000" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Bairro" placeholder="Centro, Vila, etc." value={formData.bairro} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })} />

              <Input label="Cidade" placeholder="São Paulo" value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} isRequired />

              <Select
                label="Estado"
                selectedKeys={[formData.estado]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFormData({ ...formData, estado: selected });
                }}
                isRequired
              >
                {estadosBrasil.map((estado) => (
                  <SelectItem key={estado}>{estado}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="País" placeholder="Brasil" value={formData.pais} onChange={(e) => setFormData({ ...formData, pais: e.target.value })} />

              <Input label="Telefone" placeholder="(11) 99999-9999" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
            </div>

            <Input label="Observações" placeholder="Informações adicionais..." value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} />

            <div className="flex items-center gap-2">
              <input type="checkbox" id="principal" checked={formData.principal} onChange={(e) => setFormData({ ...formData, principal: e.target.checked })} className="rounded" />
              <label htmlFor="principal" className="text-sm text-default-600">
                Definir como endereço principal
              </label>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onPress={handleCloseModal}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSave} isLoading={saving} isDisabled={!formData.apelido || !formData.logradouro || !formData.cidade || !formData.estado}>
              {editingEndereco ? "Atualizar" : "Criar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
