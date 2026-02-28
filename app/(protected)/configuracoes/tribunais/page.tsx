"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";

import {
  Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure, } from "@heroui/modal";
import { Skeleton, Select, SelectItem } from "@heroui/react";
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Building2,
  MapPin,
} from "lucide-react";
import { toast } from "@/lib/toast";

import {
  listTribunais,
  createTribunal,
  updateTribunal,
  deleteTribunal,
} from "@/app/actions/tribunais";
import { getEstadosBrasilCached } from "@/lib/api/brazil-states";
import { title } from "@/components/primitives";

const ESFERAS = [
  { key: "Federal", label: "Federal" },
  { key: "Estadual", label: "Estadual" },
  { key: "Municipal", label: "Municipal" },
];

export default function TribunaisPage() {
  const [tribunalSelecionado, setTribunalSelecionado] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    sigla: "",
    esfera: "",
    uf: "",
    siteUrl: "",
  });
  const [salvando, setSalvando] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    data: tribunaisData,
    isLoading,
    mutate,
  } = useSWR("tribunais-list", () => listTribunais());

  const { data: estadosData } = useSWR("estados-brasil", () =>
    getEstadosBrasilCached(),
  );

  const tribunais = useMemo(
    () => (tribunaisData?.success ? tribunaisData.tribunais : []),
    [tribunaisData],
  );

  const estados = useMemo(() => estadosData || [], [estadosData]);

  const handleOpenNovo = useCallback(() => {
    setTribunalSelecionado(null);
    setFormData({ nome: "", sigla: "", esfera: "", uf: "", siteUrl: "" });
    onOpen();
  }, [onOpen]);

  const handleOpenEditar = useCallback(
    (tribunal: any) => {
      setTribunalSelecionado(tribunal);
      setFormData({
        nome: tribunal.nome,
        sigla: tribunal.sigla || "",
        esfera: tribunal.esfera || "",
        uf: tribunal.uf || "",
        siteUrl: tribunal.siteUrl || "",
      });
      onOpen();
    },
    [onOpen],
  );

  const handleSalvar = useCallback(async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");

      return;
    }

    setSalvando(true);

    try {
      const payload = {
        nome: formData.nome,
        sigla: formData.sigla || null,
        esfera: formData.esfera || null,
        uf: formData.uf || null,
        siteUrl: formData.siteUrl || null,
      };

      const result = tribunalSelecionado
        ? await updateTribunal(tribunalSelecionado.id, payload)
        : await createTribunal(payload);

      if (result.success) {
        toast.success(
          tribunalSelecionado
            ? "Tribunal atualizado com sucesso!"
            : "Tribunal criado com sucesso!",
        );
        mutate();
        onClose();
      } else {
        toast.error(result.error || "Erro ao salvar tribunal");
      }
    } catch (error) {
      toast.error("Erro ao salvar tribunal");
    } finally {
      setSalvando(false);
    }
  }, [formData, tribunalSelecionado, mutate, onClose]);

  const handleExcluir = useCallback(
    async (id: string) => {
      if (!confirm("Tem certeza que deseja excluir este tribunal?")) return;

      const result = await deleteTribunal(id);

      if (result.success) {
        toast.success("Tribunal excluído com sucesso!");
        mutate();
      } else {
        toast.error(result.error || "Erro ao excluir tribunal");
      }
    },
    [mutate],
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={title()}>Tribunais</h1>
          <p className="text-default-500">
            Gerencie os tribunais e órgãos judiciais
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="default"
            startContent={<RefreshCw size={18} />}
            variant="flat"
            onPress={() => mutate()}
          >
            Atualizar
          </Button>
          <Button
            color="primary"
            startContent={<Plus size={18} />}
            onPress={handleOpenNovo}
          >
            Novo Tribunal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardBody>
                  <Skeleton className="h-24 w-full rounded-lg" />
                </CardBody>
              </Card>
            ))
          : tribunais &&
            tribunais.map((tribunal: any) => (
              <Card key={tribunal.id}>
                <CardBody>
                  <div className="flex items-start gap-3 mb-3">
                    <Building2 className="text-primary mt-1" size={24} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-lg leading-tight">
                          {tribunal.nome}
                        </h3>
                        {tribunal.sigla && (
                          <Chip color="primary" size="sm" variant="flat">
                            {tribunal.sigla}
                          </Chip>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap text-xs text-default-400 mb-2">
                        {tribunal.esfera && (
                          <span className="flex items-center gap-1">
                            <Building2 size={12} />
                            {tribunal.esfera}
                          </span>
                        )}
                        {tribunal.uf && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {tribunal.uf}
                          </span>
                        )}
                      </div>

                      {tribunal.siteUrl && (
                        <a
                          className="text-xs text-primary hover:underline truncate block"
                          href={tribunal.siteUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {tribunal.siteUrl}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-default-400 pt-3 border-t border-divider">
                    <div className="flex gap-3">
                      <span>{tribunal._count?.processos || 0} processo(s)</span>
                      <span>{tribunal._count?.juizes || 0} juiz(es)</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onPress={() => handleOpenEditar(tribunal)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        variant="flat"
                        onPress={() => handleExcluir(tribunal.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
      </div>

      <Modal isOpen={isOpen} size="lg" onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {tribunalSelecionado ? "Editar Tribunal" : "Novo Tribunal"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                isRequired
                label="Nome"
                placeholder="Ex: Tribunal de Justiça de São Paulo"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Sigla"
                  placeholder="Ex: TJSP"
                  value={formData.sigla}
                  onChange={(e) =>
                    setFormData({ ...formData, sigla: e.target.value })
                  }
                />

                <Select
                  label="UF"
                  placeholder="Selecione"
                  selectedKeys={formData.uf ? [formData.uf] : []}
                  onChange={(e) =>
                    setFormData({ ...formData, uf: e.target.value })
                  }
                >
                  {estados.map((estado: any) => (
                    <SelectItem
                      key={estado.sigla}
                      textValue={`${estado.sigla} - ${estado.nome}`}
                    >
                      {estado.sigla} - {estado.nome}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <Select
                label="Esfera"
                placeholder="Selecione"
                selectedKeys={formData.esfera ? [formData.esfera] : []}
                onChange={(e) =>
                  setFormData({ ...formData, esfera: e.target.value })
                }
              >
                {ESFERAS.map((esfera) => (
                  <SelectItem key={esfera.key} textValue={esfera.label}>{esfera.label}</SelectItem>
                ))}
              </Select>

              <Input
                label="Site"
                placeholder="https://www.tjsp.jus.br"
                type="url"
                value={formData.siteUrl}
                onChange={(e) =>
                  setFormData({ ...formData, siteUrl: e.target.value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" isLoading={salvando} onPress={handleSalvar}>
              {tribunalSelecionado ? "Atualizar" : "Criar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
