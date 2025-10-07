"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { useDisclosure } from "@heroui/use-disclosure";
import { Spinner } from "@heroui/spinner";
import { toast } from "sonner";
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, FileText, Link as LinkIcon, Building2, User } from "lucide-react";
import Link from "next/link";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";

import { useClientesParaSelect, useProcuracoesDisponiveis } from "@/app/hooks/use-clientes";
import { useAllContratos } from "@/app/hooks/use-contratos";
import { vincularContratoProcuracao } from "@/app/actions/contratos";
import { DateUtils } from "@/app/lib/date-utils";

export default function ContratosContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContrato, setSelectedContrato] = useState<any>(null);
  const [selectedProcuracao, setSelectedProcuracao] = useState<string>("");
  const [isLinking, setIsLinking] = useState(false);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { clientes } = useClientesParaSelect();
  const { contratos, isLoading, isError, mutate } = useAllContratos();
  const { procuracoes, isLoading: isLoadingProcuracoes } = useProcuracoesDisponiveis(selectedContrato?.cliente?.id || null);

  const handleVincularProcuracao = async () => {
    if (!selectedContrato || !selectedProcuracao) {
      toast.error("Selecione uma procuração");

      return;
    }

    setIsLinking(true);
    try {
      await vincularContratoProcuracao(selectedContrato.id, selectedProcuracao);
      toast.success("Contrato vinculado à procuração com sucesso!");
      mutate(); // Atualizar lista de contratos
      onOpenChange();
      setSelectedContrato(null);
      setSelectedProcuracao("");
    } catch (error) {
      console.error("Erro ao vincular procuração:", error);
      toast.error("Erro ao vincular procuração");
    } finally {
      setIsLinking(false);
    }
  };

  const openVincularModal = (contrato: any) => {
    setSelectedContrato(contrato);
    setSelectedProcuracao("");
    onOpen();
  };

  const contratosFiltrados =
    contratos?.filter((contrato) => contrato.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || contrato.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner label="Carregando contratos..." size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FileText className="h-12 w-12 text-danger" />
        <p className="text-lg font-semibold text-danger">Erro ao carregar contratos</p>
        <Button color="primary" onPress={() => mutate()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contratos</h1>
          <p className="text-default-500">Gerencie todos os contratos do escritório</p>
        </div>
        <Button as={Link} color="primary" href="/contratos/novo" startContent={<Plus className="h-4 w-4" />}>
          Novo Contrato
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="flex gap-4">
            <Input
              className="flex-1"
              placeholder="Buscar contratos..."
              startContent={<Search className="h-4 w-4 text-default-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Lista de Contratos */}
      {contratosFiltrados.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-default-300" />
            <p className="mt-4 text-lg font-semibold text-default-600">{searchTerm ? "Nenhum contrato encontrado" : "Nenhum contrato cadastrado"}</p>
            <p className="mt-2 text-sm text-default-400">{searchTerm ? "Tente ajustar os filtros de busca" : "Comece criando seu primeiro contrato"}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contratosFiltrados.map((contrato) => (
            <Card key={contrato.id} className="border border-default-200">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{contrato.titulo}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${contrato.status === "ATIVO" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>{contrato.status}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-default-500 mb-2">
                      <div className="flex items-center gap-1">
                        {contrato.cliente.tipoPessoa === "JURIDICA" ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        <span>{contrato.cliente.nome}</span>
                      </div>
                      {contrato.valor && <span>R$ {contrato.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                      {contrato.dataInicio && <span>Início: {DateUtils.formatDate(contrato.dataInicio)}</span>}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-default-400">
                      {contrato.processo ? (
                        <span className="flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          Processo: {contrato.processo.numero}
                        </span>
                      ) : (
                        <span className="text-warning">Sem processo vinculado</span>
                      )}
                      {contrato.procuracao ? <span className="text-success">✓ Procuração vinculada</span> : <span className="text-default-400">Sem procuração</span>}
                    </div>
                  </div>

                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem key="view" startContent={<Eye className="h-4 w-4" />}>
                        Visualizar
                      </DropdownItem>
                      <DropdownItem key="edit" startContent={<Edit className="h-4 w-4" />}>
                        Editar
                      </DropdownItem>
                      {!contrato.procuracao ? (
                        <DropdownItem key="link" startContent={<LinkIcon className="h-4 w-4" />} onPress={() => openVincularModal(contrato)}>
                          Vincular Procuração
                        </DropdownItem>
                      ) : null}
                      <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="h-4 w-4" />}>
                        Excluir
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Vincular Procuração */}
      <Modal isOpen={isOpen} size="md" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Vincular Procuração</h3>
                <p className="text-sm text-default-500">Vincule o contrato "{selectedContrato?.titulo}" a uma procuração</p>
              </ModalHeader>
              <ModalBody>
                {isLoadingProcuracoes ? (
                  <div className="flex justify-center py-8">
                    <Spinner label="Carregando procurações..." size="lg" />
                  </div>
                ) : procuracoes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-default-500">Nenhuma procuração ativa encontrada para este cliente.</p>
                  </div>
                ) : (
                  <Select
                    label="Selecione uma procuração"
                    placeholder="Escolha uma procuração"
                    selectedKeys={selectedProcuracao ? [selectedProcuracao] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;

                      setSelectedProcuracao(selectedKey || "");
                    }}
                  >
                    {procuracoes.map((procuracao: any) => (
                      <SelectItem key={procuracao.id}>
                        <div className="flex flex-col">
                          <span className="font-semibold">{procuracao.numero || `Procuração ${procuracao.id.slice(-8)}`}</span>
                          <span className="text-xs text-default-400">{procuracao.processos.length} processo(s) vinculado(s)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="primary" isDisabled={!selectedProcuracao || isLoadingProcuracoes} isLoading={isLinking} onPress={handleVincularProcuracao}>
                  Vincular
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
