"use client";

import React from "react";
import { Modal as HeroUIModal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import clsx from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  backdrop?: "opaque" | "blur" | "transparent";
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  showFooter?: boolean;
  footerContent?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  backdrop = "blur",
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  showFooter = false,
  footerContent,
}: ModalProps) {
  return (
    <HeroUIModal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      backdrop={backdrop}
      hideCloseButton={!showCloseButton}
      isDismissable={closeOnOverlayClick}
      isKeyboardDismissDisabled={!closeOnEscape}
      scrollBehavior="inside"
      classNames={{
        base: clsx("border border-default-200 shadow-2xl", className),
        header: clsx("flex flex-col gap-1", headerClassName),
        body: clsx(bodyClassName),
        footer: clsx(footerClassName),
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {/* Header */}
            {title && <ModalHeader>{title}</ModalHeader>}

            {/* Body */}
            <ModalBody>{children}</ModalBody>

            {/* Footer */}
            {showFooter && <ModalFooter>{footerContent}</ModalFooter>}
          </>
        )}
      </ModalContent>
    </HeroUIModal>
  );
}

// Hook para facilitar o uso do modal (compatível com useDisclosure do HeroUI)
export function useModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const openModal = () => onOpen();
  const closeModal = () => onClose();
  const toggleModal = () => {
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  };

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    // Compatibilidade com HeroUI
    onOpen,
    onClose,
  };
}
