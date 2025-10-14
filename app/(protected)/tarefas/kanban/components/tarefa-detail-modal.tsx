"use client";

import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import { toast } from "sonner";
import dayjs from "dayjs";

interface TarefaDetailModalProps {
  tarefa: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const statusConfig = {
  PENDENTE: { label: "Pendente", color: "default" as const },
  EM_ANDAMENTO: { label: "Em Andamento", color: "primary" as const },
  CONCLUIDA: { label: "Concluída", color: "success" as const },
  CANCELADA: { label: "Cancelada", color: "danger" as const },
};

const prioridadeConfig = {
  BAIXA: { label: "Baixa", color: "default" as const },
  MEDIA: { label: "Média", color: "primary" as const },
  ALTA: { label: "Alta", color: "warning" as const },
  CRITICA: { label: "Crítica", color: "danger" as const },
};

export function TarefaDetailModal({ tarefa, isOpen, onClose, onUpdate }: TarefaDetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-start justify-between gap-4 w-full pr-8">
            <div className="flex-1">
              <h2 className="text-xl font-bold">{tarefa.titulo}</h2>
              {tarefa.numeroSequencial && <p className="text-sm text-default-400">#{tarefa.numeroSequencial}</p>}
            </div>
              <div className="flex gap-2">
                <Chip color={statusConfig[tarefa.status as keyof typeof statusConfig].color}>{statusConfig[tarefa.status as keyof typeof statusConfig].label}</Chip>
                <Chip color={prioridadeConfig[tarefa.prioridade as keyof typeof prioridadeConfig].color}>{prioridadeConfig[tarefa.prioridade as keyof typeof prioridadeConfig].label}</Chip>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <Tabs aria-label="Detalhes da tarefa" variant="underlined">
            {/* Tab: Informações */}
            <Tab key="info" title="Informações">
              <div className="space-y-4 py-4">
                {tarefa.descricao && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Descrição</p>
                    <p className="text-sm text-default-600">{tarefa.descricao}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {tarefa.responsavel && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Responsável</p>
                      <p className="text-sm text-default-600">
                        {tarefa.responsavel.firstName} {tarefa.responsavel.lastName}
                      </p>
                    </div>
                  )}

                  {tarefa.dataLimite && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Data Limite</p>
                      <p className="text-sm text-default-600">{dayjs(tarefa.dataLimite).format("DD/MM/YYYY HH:mm")}</p>
                    </div>
                  )}

                  {tarefa.categoria && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Categoria</p>
                      <Chip size="sm" style={{ backgroundColor: tarefa.categoria.corHex + "20", color: tarefa.categoria.corHex }}>
                        {tarefa.categoria.nome}
                      </Chip>
                    </div>
                  )}

                  {tarefa.estimativaHoras && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Tempo Estimado</p>
                      <p className="text-sm text-default-600">
                        {tarefa.estimativaHoras}h{tarefa.horasGastas && <span className="text-primary"> / {tarefa.horasGastas}h gastos</span>}
                      </p>
                    </div>
                  )}
                </div>

                {tarefa.processo && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Processo</p>
                    <p className="text-sm text-default-600">
                      {tarefa.processo.numero} - {tarefa.processo.titulo}
                    </p>
                  </div>
                )}

                {tarefa.cliente && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Cliente</p>
                    <p className="text-sm text-default-600">{tarefa.cliente.nome}</p>
                  </div>
                )}
              </div>
            </Tab>

            {/* Tab: Checklist */}
            <Tab key="checklist" title={`Checklist (${tarefa._count?.checklists || 0})`}>
              <div className="py-4">
                <p className="text-sm text-default-400">Checklist - Em desenvolvimento</p>
              </div>
            </Tab>

            {/* Tab: Anexos */}
            <Tab key="anexos" title={`Anexos (${tarefa._count?.anexos || 0})`}>
              <div className="py-4">
                <p className="text-sm text-default-400">Anexos - Em desenvolvimento</p>
              </div>
            </Tab>

            {/* Tab: Comentários */}
            <Tab key="comentarios" title={`Comentários (${tarefa._count?.comentarios || 0})`}>
              <div className="py-4">
                <p className="text-sm text-default-400">Comentários - Em desenvolvimento</p>
              </div>
            </Tab>

            {/* Tab: Atividades */}
            <Tab key="atividades" title="Atividades">
              <div className="py-4">
                <p className="text-sm text-default-400">Histórico de atividades - Em desenvolvimento</p>
              </div>
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Fechar
          </Button>
          <Button
            color="primary"
            onPress={() => {
              // TODO: Abrir modal de edição
              toast.info("Editar - Em desenvolvimento");
            }}
          >
            Editar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
