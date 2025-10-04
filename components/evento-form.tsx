"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Select, SelectItem, DatePicker, TimeInput, Chip, Spinner } from "@heroui/react";
import { Calendar, Clock, MapPin, Users, FileText, AlertCircle } from "lucide-react";
import { createEvento, updateEvento, type EventoFormData } from "@/app/actions/eventos";
import { useEventoFormData } from "@/app/hooks/use-eventos";
import { toast } from "sonner";

interface EventoFormProps {
  isOpen: boolean;
  onClose: () => void;
  evento?: any; // Evento existente para edição
  onSuccess?: () => void;
}

const tiposEvento = [
  { key: "REUNIAO", label: "Reunião" },
  { key: "AUDIENCIA", label: "Audiência" },
  { key: "CONSULTA", label: "Consulta" },
  { key: "PRAZO", label: "Prazo" },
  { key: "LEMBRETE", label: "Lembrete" },
];

const statusEvento = [
  { key: "AGENDADO", label: "Agendado" },
  { key: "CONFIRMADO", label: "Confirmado" },
  { key: "REALIZADO", label: "Realizado" },
  { key: "CANCELADO", label: "Cancelado" },
];

const lembretes = [
  { key: 0, label: "Sem lembrete" },
  { key: 15, label: "15 minutos antes" },
  { key: 30, label: "30 minutos antes" },
  { key: 60, label: "1 hora antes" },
  { key: 120, label: "2 horas antes" },
  { key: 1440, label: "1 dia antes" },
];

export default function EventoForm({ isOpen, onClose, evento, onSuccess }: EventoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [novoParticipante, setNovoParticipante] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado inicial baseado no evento (se houver)
  const [formData, setFormData] = useState<any>(() => {
    if (evento) {
      return {
        titulo: evento.titulo || "",
        descricao: evento.descricao || "",
        tipo: evento.tipo || "REUNIAO",
        dataInicio: evento.dataInicio ? new Date(evento.dataInicio).toISOString().slice(0, 16) : "",
        dataFim: evento.dataFim ? new Date(evento.dataFim).toISOString().slice(0, 16) : "",
        local: evento.local || "",
        processoId: evento.processoId || null,
        clienteId: evento.clienteId || null,
        advogadoResponsavelId: evento.advogadoResponsavelId || null,
        status: evento.status || "AGENDADO",
        lembreteMinutos: evento.lembreteMinutos || 30,
        observacoes: evento.observacoes || "",
      };
    }
    return {
      titulo: "",
      descricao: "",
      tipo: "REUNIAO",
      dataInicio: "",
      dataFim: "",
      local: "",
      processoId: null,
      clienteId: null,
      advogadoResponsavelId: null,
      status: "AGENDADO",
      lembreteMinutos: 30,
      observacoes: "",
    };
  });

  const { formData: selectData, isLoading: isLoadingFormData } = useEventoFormData();

  // Filtrar processos baseado no cliente selecionado
  const processosFiltrados =
    selectData?.processos?.filter((processo: any) => {
      if (!formData.clienteId) return true; // Se não há cliente selecionado, mostrar todos
      return processo.clienteId === formData.clienteId;
    }) || [];

  // Inicializar participantes baseado no evento
  const [participantesIniciais] = useState(() => evento?.participantes || []);

  // Limpar erros quando o modal abre
  if (isOpen && Object.keys(errors).length > 0) {
    setErrors({});
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo?.trim()) {
      newErrors.titulo = "Título é obrigatório";
    } else if (formData.titulo.length > 200) {
      newErrors.titulo = "Título deve ter no máximo 200 caracteres";
    }

    if (!formData.dataInicio) {
      newErrors.dataInicio = "Data de início é obrigatória";
    }

    if (!formData.dataFim) {
      newErrors.dataFim = "Data de fim é obrigatória";
    }

    if (formData.dataInicio && formData.dataFim) {
      const inicio = new Date(formData.dataInicio);
      const fim = new Date(formData.dataFim);
      if (fim <= inicio) {
        newErrors.dataFim = "Data de fim deve ser posterior à data de início";
      }
    }

    if (formData.descricao && formData.descricao.length > 1000) {
      newErrors.descricao = "Descrição deve ter no máximo 1000 caracteres";
    }

    if (formData.local && formData.local.length > 200) {
      newErrors.local = "Local deve ter no máximo 200 caracteres";
    }

    if (formData.observacoes && formData.observacoes.length > 500) {
      newErrors.observacoes = "Observações devem ter no máximo 500 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const dataToSubmit = {
        ...formData,
        participantes,
        dataInicio: formData.dataInicio ? new Date(formData.dataInicio).toISOString() : "",
        dataFim: formData.dataFim ? new Date(formData.dataFim).toISOString() : "",
      } as EventoFormData;

      let result;
      if (evento) {
        result = await updateEvento(evento.id, dataToSubmit);
      } else {
        result = await createEvento(dataToSubmit);
      }

      if (result.success) {
        toast.success(evento ? "Evento atualizado com sucesso!" : "Evento criado com sucesso!");
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "Erro ao salvar evento");
      }
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      toast.error("Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const adicionarParticipante = () => {
    if (novoParticipante && !participantes.includes(novoParticipante)) {
      setParticipantes([...participantes, novoParticipante]);
      setNovoParticipante("");
    }
  };

  const removerParticipante = (email: string) => {
    setParticipantes(participantes.filter((p) => p !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarParticipante();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
        body: "py-6",
      }}
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {evento ? "Editar Evento" : "Novo Evento"}
            </div>
            <div className="text-sm text-default-500 mt-2">
              <p>
                Campos obrigatórios: <span className="text-danger">*</span>
              </p>
              <p className="text-xs">Título, Tipo, Data de Início e Data de Fim são obrigatórios.</p>
            </div>
          </ModalHeader>

          <ModalBody className="gap-4">
            {isLoadingFormData ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                {/* Título */}
                <Input
                  label="Título do Evento"
                  placeholder="Ex: Audiência de Conciliação"
                  value={formData.titulo}
                  onChange={(e) => {
                    setFormData({ ...formData, titulo: e.target.value });
                    if (errors.titulo) {
                      setErrors({ ...errors, titulo: "" });
                    }
                  }}
                  isRequired
                  isInvalid={!!errors.titulo}
                  errorMessage={errors.titulo}
                  startContent={<FileText className="w-4 h-4 text-primary" />}
                  color="primary"
                  variant="bordered"
                />

                {/* Descrição */}
                <Textarea
                  label="Descrição"
                  placeholder="Descrição detalhada do evento..."
                  value={formData.descricao}
                  onChange={(e) => {
                    setFormData({ ...formData, descricao: e.target.value });
                    if (errors.descricao) {
                      setErrors({ ...errors, descricao: "" });
                    }
                  }}
                  minRows={2}
                  isInvalid={!!errors.descricao}
                  errorMessage={errors.descricao}
                  color="secondary"
                  variant="bordered"
                />

                {/* Tipo e Status */}
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Tipo"
                    placeholder="Selecione o tipo"
                    selectedKeys={formData.tipo ? [formData.tipo] : []}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                    isRequired
                    color="primary"
                  >
                    {tiposEvento.map((tipo) => (
                      <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Status"
                    placeholder="Selecione o status"
                    selectedKeys={formData.status ? [formData.status] : []}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    color="default"
                  >
                    {statusEvento.map((status) => (
                      <SelectItem key={status.key}>{status.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Data e Hora */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="datetime-local"
                    label="Data e Hora de Início"
                    value={formData.dataInicio}
                    onChange={(e) => {
                      setFormData({ ...formData, dataInicio: e.target.value });
                      if (errors.dataInicio) {
                        setErrors({ ...errors, dataInicio: "" });
                      }
                    }}
                    isRequired
                    isInvalid={!!errors.dataInicio}
                    errorMessage={errors.dataInicio}
                    startContent={<Calendar className="w-4 h-4 text-success" />}
                    color="success"
                    variant="bordered"
                  />

                  <Input
                    type="datetime-local"
                    label="Data e Hora de Fim"
                    value={formData.dataFim}
                    onChange={(e) => {
                      setFormData({ ...formData, dataFim: e.target.value });
                      if (errors.dataFim) {
                        setErrors({ ...errors, dataFim: "" });
                      }
                    }}
                    isRequired
                    isInvalid={!!errors.dataFim}
                    errorMessage={errors.dataFim}
                    startContent={<Clock className="w-4 h-4 text-warning" />}
                    color="warning"
                    variant="bordered"
                  />
                </div>

                {/* Local */}
                <Input
                  label="Local"
                  placeholder="Ex: Fórum Central - Sala 101"
                  value={formData.local}
                  onChange={(e) => {
                    setFormData({ ...formData, local: e.target.value });
                    if (errors.local) {
                      setErrors({ ...errors, local: "" });
                    }
                  }}
                  isInvalid={!!errors.local}
                  errorMessage={errors.local}
                  startContent={<MapPin className="w-4 h-4 text-danger" />}
                  color="danger"
                  variant="bordered"
                />

                {/* Relacionamentos */}
                <div className="grid grid-cols-3 gap-4">
                  <Select
                    label="Cliente"
                    placeholder="Selecione um cliente"
                    selectedKeys={formData.clienteId ? [formData.clienteId.toString()] : []}
                    onChange={(e) => {
                      const novoClienteId = e.target.value;
                      setFormData({
                        ...formData,
                        clienteId: novoClienteId,
                        processoId: null, // Limpar processo quando cliente muda
                      });
                    }}
                    color="secondary"
                  >
                    {selectData?.clientes?.map((cliente) => <SelectItem key={cliente.id}>{cliente.nome}</SelectItem>) || []}
                  </Select>

                  <Select
                    label="Processo"
                    placeholder={formData.clienteId ? "Selecione um processo" : "Primeiro selecione um cliente"}
                    selectedKeys={formData.processoId ? [formData.processoId.toString()] : []}
                    onChange={(e) => setFormData({ ...formData, processoId: e.target.value })}
                    isDisabled={!formData.clienteId}
                    color="warning"
                  >
                    {processosFiltrados.map((processo) => (
                      <SelectItem key={processo.id}>{processo.numero}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Advogado Responsável"
                    placeholder="Selecione um advogado"
                    selectedKeys={formData.advogadoResponsavelId ? [formData.advogadoResponsavelId.toString()] : []}
                    onChange={(e) => setFormData({ ...formData, advogadoResponsavelId: e.target.value })}
                    color="success"
                  >
                    {selectData?.advogados?.map((advogado) => (
                      <SelectItem key={advogado.id}>{`${advogado.usuario.firstName || ""} ${advogado.usuario.lastName || ""}`.trim() || advogado.usuario.email}</SelectItem>
                    )) || []}
                  </Select>
                </div>

                {/* Participantes */}
                <div>
                  <label className="text-sm font-medium text-default-700 mb-2 block">
                    <Users className="w-4 h-4 inline mr-1" />
                    Participantes
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Digite o email do participante"
                      value={novoParticipante}
                      onChange={(e) => setNovoParticipante(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                      color="primary"
                      variant="bordered"
                      startContent={<Users className="w-4 h-4 text-primary" />}
                    />
                    <Button type="button" onPress={adicionarParticipante} isDisabled={!novoParticipante} size="sm">
                      Adicionar
                    </Button>
                  </div>
                  {participantes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {participantes.map((email) => (
                        <Chip key={email} onClose={() => removerParticipante(email)} variant="flat" color="primary">
                          {email}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lembrete */}
                <Select
                  label="Lembrete"
                  placeholder="Selecione quando receber o lembrete"
                  selectedKeys={formData.lembreteMinutos !== undefined && formData.lembreteMinutos !== null ? [formData.lembreteMinutos.toString()] : []}
                  onChange={(e) => setFormData({ ...formData, lembreteMinutos: parseInt(e.target.value) })}
                  startContent={<AlertCircle className="w-4 h-4 text-warning" />}
                  color="warning"
                >
                  {lembretes.map((lembrete) => (
                    <SelectItem key={lembrete.key.toString()}>{lembrete.label}</SelectItem>
                  ))}
                </Select>

                {/* Observações */}
                <Textarea
                  label="Observações"
                  placeholder="Observações adicionais..."
                  value={formData.observacoes}
                  onChange={(e) => {
                    setFormData({ ...formData, observacoes: e.target.value });
                    if (errors.observacoes) {
                      setErrors({ ...errors, observacoes: "" });
                    }
                  }}
                  minRows={2}
                  isInvalid={!!errors.observacoes}
                  errorMessage={errors.observacoes}
                  color="default"
                  variant="bordered"
                />
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="light" onPress={onClose} isDisabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" color="primary" isLoading={isLoading} isDisabled={!formData.titulo || !formData.dataInicio || !formData.dataFim}>
              {evento ? "Atualizar" : "Criar"} Evento
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
