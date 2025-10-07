"use client";

import React from "react";
import { Button } from "@heroui/button";

import { Modal, useModal } from "./modal";

// Exemplo de uso básico do Modal
export function BasicModalExample() {
  const { isOpen, openModal, closeModal } = useModal();

  return (
    <>
      <Button onPress={openModal}>Abrir Modal Básico</Button>

      <Modal
        backdrop="blur"
        isOpen={isOpen}
        title="Modal Básico"
        onClose={closeModal}
      >
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
        backdrop="blur"
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
        isOpen={isOpen}
        showFooter={true}
        title="Modal com Footer"
        onClose={closeModal}
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
        backdrop="blur"
        footerContent={
          <Button color="primary" onPress={closeModal}>
            Fechar
          </Button>
        }
        isOpen={isOpen}
        showCloseButton={false}
        showFooter={true}
        title="Modal Sem Botão X"
        onClose={closeModal}
      >
        <p>Este modal não tem botão X no header.</p>
        <p>Só pode ser fechado com ESC, clicando fora ou no botão do footer.</p>
      </Modal>
    </>
  );
}

// Exemplo de modal com diferentes backdrops
export function ModalBackdropExample() {
  const {
    isOpen: isOpaqueOpen,
    openModal: openOpaque,
    closeModal: closeOpaque,
  } = useModal();
  const {
    isOpen: isBlurOpen,
    openModal: openBlur,
    closeModal: closeBlur,
  } = useModal();
  const {
    isOpen: isTransparentOpen,
    openModal: openTransparent,
    closeModal: closeTransparent,
  } = useModal();

  return (
    <div className="flex gap-3">
      <Button onPress={openOpaque}>Opaque</Button>
      <Button onPress={openBlur}>Blur</Button>
      <Button onPress={openTransparent}>Transparent</Button>

      <Modal
        backdrop="opaque"
        isOpen={isOpaqueOpen}
        title="Modal Opaque"
        onClose={closeOpaque}
      >
        <p>Backdrop opaco (padrão).</p>
      </Modal>

      <Modal
        backdrop="blur"
        isOpen={isBlurOpen}
        title="Modal Blur"
        onClose={closeBlur}
      >
        <p>Backdrop com efeito blur.</p>
      </Modal>

      <Modal
        backdrop="transparent"
        isOpen={isTransparentOpen}
        title="Modal Transparent"
        onClose={closeTransparent}
      >
        <p>Backdrop transparente.</p>
      </Modal>
    </div>
  );
}

// Exemplo de modal com diferentes tamanhos
export function ModalSizeExample() {
  const {
    isOpen: isSmOpen,
    openModal: openSm,
    closeModal: closeSm,
  } = useModal();
  const {
    isOpen: isMdOpen,
    openModal: openMd,
    closeModal: closeMd,
  } = useModal();
  const {
    isOpen: isLgOpen,
    openModal: openLg,
    closeModal: closeLg,
  } = useModal();
  const {
    isOpen: isXlOpen,
    openModal: openXl,
    closeModal: closeXl,
  } = useModal();

  return (
    <div className="flex gap-3">
      <Button onPress={openSm}>Small</Button>
      <Button onPress={openMd}>Medium</Button>
      <Button onPress={openLg}>Large</Button>
      <Button onPress={openXl}>Extra Large</Button>

      <Modal
        backdrop="blur"
        isOpen={isSmOpen}
        size="sm"
        title="Modal Small"
        onClose={closeSm}
      >
        <p>Modal pequeno.</p>
      </Modal>

      <Modal
        backdrop="blur"
        isOpen={isMdOpen}
        size="md"
        title="Modal Medium"
        onClose={closeMd}
      >
        <p>Modal médio (padrão).</p>
      </Modal>

      <Modal
        backdrop="blur"
        isOpen={isLgOpen}
        size="lg"
        title="Modal Large"
        onClose={closeLg}
      >
        <p>Modal grande.</p>
      </Modal>

      <Modal
        backdrop="blur"
        isOpen={isXlOpen}
        size="xl"
        title="Modal Extra Large"
        onClose={closeXl}
      >
        <p>Modal extra grande.</p>
      </Modal>
    </div>
  );
}
