"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Textarea,
} from "@heroui/react";
import { Check, X, HelpCircle, AlertCircle, Users } from "lucide-react";
import { toast } from "@/lib/toast";

import { confirmarParticipacaoEvento } from "@/app/actions/eventos";
import { Evento, EventoConfirmacaoStatus } from "@/generated/prisma";

interface EventoConfirmacaoProps {
  isOpen: boolean;
  onClose: () => void;
  evento: Evento & {
    confirmacoes?: Array<{
      participanteEmail: string;
      status: EventoConfirmacaoStatus;
    }>;
  };
  participanteEmail: string;
  onSuccess?: () => void;
}

const statusConfirmacao = {
  PENDENTE: { label: "Pendente", color: "warning" as const, icon: AlertCircle },
  CONFIRMADO: { label: "Confirmado", color: "success" as const, icon: Check },
  RECUSADO: { label: "Recusado", color: "danger" as const, icon: X },
  TALVEZ: { label: "Talvez", color: "secondary" as const, icon: HelpCircle },
};

export default function EventoConfirmacao({
  isOpen,
  onClose,
  evento,
  participanteEmail,
  onSuccess,
}: EventoConfirmacaoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  // Encontrar a confirmação atual do participante
  const confirmacaoAtual = evento.confirmacoes?.find(
    (c) => c.participanteEmail === participanteEmail,
  );
  const statusAtual = confirmacaoAtual?.status || "PENDENTE";

  const handleConfirmar = async (status: EventoConfirmacaoStatus) => {
    setIsLoading(true);

    try {
      const result = await confirmarParticipacaoEvento(
        evento.id,
        participanteEmail,
        status,
        observacoes || undefined,
      );

      if (result.success) {
        toast.success("Confirmação atualizada com sucesso!");
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "Erro ao confirmar participação");
      }
    } catch (error) {
      toast.error("Erro interno do servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      classNames={{
        base: "max-h-[90vh]",
        body: "max-h-[65vh] overflow-y-auto py-6",
        footer: "border-t border-default-200 mt-4",
      }}
      isOpen={isOpen}
      size="md"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Confirmar Participação
          </div>
          <div className="text-sm text-default-500">
            Evento: {evento.titulo}
          </div>
        </ModalHeader>

        <ModalBody className="gap-4">
          {/* Informações do Evento */}
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Data:</strong>{" "}
              {formatarData(evento.dataInicio.toString())}
            </div>
            {evento.local && (
              <div className="text-sm">
                <strong>Local:</strong> {evento.local}
              </div>
            )}
            {evento.descricao && (
              <div className="text-sm">
                <strong>Descrição:</strong> {evento.descricao}
              </div>
            )}
          </div>

          {/* Status Atual */}
          <div>
            <div className="text-sm font-medium mb-2">Status Atual:</div>
            {(() => {
              const statusInfo =
                statusConfirmacao[
                  statusAtual as keyof typeof statusConfirmacao
                ];
              const IconComponent = statusInfo?.icon || AlertCircle;

              return (
                <Chip
                  color={statusInfo?.color || "default"}
                  startContent={<IconComponent className="w-4 h-4" />}
                  variant="flat"
                >
                  {statusInfo?.label || statusAtual}
                </Chip>
              );
            })()}
          </div>

          {/* Observações */}
          <div>
            <Textarea
              color="default"
              label="Observações (opcional)"
              maxRows={4}
              minRows={2}
              placeholder="Adicione observações sobre sua participação..."
              value={observacoes}
              variant="bordered"
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </ModalBody>

        <ModalFooter className="gap-3 px-6 py-4">
          <Button isDisabled={isLoading} variant="light" onPress={onClose}>
            Cancelar
          </Button>

          <div className="flex gap-2">
            <Button
              color="danger"
              isLoading={isLoading}
              startContent={<X className="w-4 h-4" />}
              variant="flat"
              onPress={() => handleConfirmar("RECUSADO")}
            >
              Recusar
            </Button>

            <Button
              color="secondary"
              isLoading={isLoading}
              startContent={<HelpCircle className="w-4 h-4" />}
              variant="flat"
              onPress={() => handleConfirmar("TALVEZ")}
            >
              Talvez
            </Button>

            <Button
              color="success"
              isLoading={isLoading}
              startContent={<Check className="w-4 h-4" />}
              onPress={() => handleConfirmar("CONFIRMADO")}
            >
              Confirmar
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
