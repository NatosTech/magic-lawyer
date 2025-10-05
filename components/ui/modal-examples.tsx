"use client";

import React from "react";
import { Modal, useModal } from "./modal";
import { Button } from "@heroui/button";

// Exemplo de uso básico do Modal
export function BasicModalExample() {
  const { isOpen, openModal, closeModal } = useModal();

  return (
    <>
      <Button onPress={openModal}>Abrir Modal Básico</Button>

      <Modal isOpen={isOpen} onClose={closeModal} title="Modal Básico" backdrop="blur">
        <p>Este é um modal básico com backdrop blur.</p>
        <p>Pode ser fechado com ESC, clicando fora ou no botão X.</p>
      </Modal>
    </>
  );
}

// Exemplo de modal com footer
export function ModalWithFooterExample() {
  const { isOpen, openModal, closeModal } = useModal();

  return (
    <>
      <Button onPress={openModal}>Abrir Modal com Footer</Button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title="Modal com Footer"
        backdrop="blur"
        showFooter={true}
        footerContent={
          <>
            <Button variant="light" onPress={closeModal}>
              Cancelar
            </Button>
            <Button color="primary" onPress={closeModal}>
              Confirmar
            </Button>
          </>
        }
      >
        <p>Este modal tem um footer com botões de ação.</p>
      </Modal>
    </>
  );
}

// Exemplo de modal sem botão de fechar
export function ModalWithoutCloseButtonExample() {
  const { isOpen, openModal, closeModal } = useModal();

  return (
    <>
      <Button onPress={openModal}>Abrir Modal Sem X</Button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title="Modal Sem Botão X"
        showCloseButton={false}
        backdrop="blur"
        showFooter={true}
        footerContent={
          <Button color="primary" onPress={closeModal}>
            Fechar
          </Button>
        }
      >
        <p>Este modal não tem botão X no header.</p>
        <p>Só pode ser fechado com ESC, clicando fora ou no botão do footer.</p>
      </Modal>
    </>
  );
}

// Exemplo de modal com diferentes backdrops
export function ModalBackdropExample() {
  const { isOpen: isOpaqueOpen, openModal: openOpaque, closeModal: closeOpaque } = useModal();
  const { isOpen: isBlurOpen, openModal: openBlur, closeModal: closeBlur } = useModal();
  const { isOpen: isTransparentOpen, openModal: openTransparent, closeModal: closeTransparent } = useModal();

  return (
    <div className="flex gap-3">
      <Button onPress={openOpaque}>Opaque</Button>
      <Button onPress={openBlur}>Blur</Button>
      <Button onPress={openTransparent}>Transparent</Button>

      <Modal isOpen={isOpaqueOpen} onClose={closeOpaque} title="Modal Opaque" backdrop="opaque">
        <p>Backdrop opaco (padrão).</p>
      </Modal>

      <Modal isOpen={isBlurOpen} onClose={closeBlur} title="Modal Blur" backdrop="blur">
        <p>Backdrop com efeito blur.</p>
      </Modal>

      <Modal isOpen={isTransparentOpen} onClose={closeTransparent} title="Modal Transparent" backdrop="transparent">
        <p>Backdrop transparente.</p>
      </Modal>
    </div>
  );
}

// Exemplo de modal com diferentes tamanhos
export function ModalSizeExample() {
  const { isOpen: isSmOpen, openModal: openSm, closeModal: closeSm } = useModal();
  const { isOpen: isMdOpen, openModal: openMd, closeModal: closeMd } = useModal();
  const { isOpen: isLgOpen, openModal: openLg, closeModal: closeLg } = useModal();
  const { isOpen: isXlOpen, openModal: openXl, closeModal: closeXl } = useModal();

  return (
    <div className="flex gap-3">
      <Button onPress={openSm}>Small</Button>
      <Button onPress={openMd}>Medium</Button>
      <Button onPress={openLg}>Large</Button>
      <Button onPress={openXl}>Extra Large</Button>

      <Modal isOpen={isSmOpen} onClose={closeSm} title="Modal Small" size="sm" backdrop="blur">
        <p>Modal pequeno.</p>
      </Modal>

      <Modal isOpen={isMdOpen} onClose={closeMd} title="Modal Medium" size="md" backdrop="blur">
        <p>Modal médio (padrão).</p>
      </Modal>

      <Modal isOpen={isLgOpen} onClose={closeLg} title="Modal Large" size="lg" backdrop="blur">
        <p>Modal grande.</p>
      </Modal>

      <Modal isOpen={isXlOpen} onClose={closeXl} title="Modal Extra Large" size="xl" backdrop="blur">
        <p>Modal extra grande.</p>
      </Modal>
    </div>
  );
}
