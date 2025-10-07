"use client";

import React from "react";
import {
  Modal as HeroUIModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import clsx from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
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
  footer?: React.ReactNode; // Alias para footerContent
}

export function Modal({
  isOpen,
  onClose,
  onOpenChange,
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
  showFooter,
  footerContent,
  footer, // Suporte para alias
}: ModalProps) {
  // Usar footer ou footerContent
  const actualFooter = footer || footerContent;
  const shouldShowFooter =
    showFooter !== undefined ? showFooter : !!actualFooter;

  // Handler para mudança de estado
  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    }
    if (!open && onClose) {
      onClose();
    }
  };

  return (
    <HeroUIModal
      backdrop={backdrop}
      classNames={{
        base: clsx("border border-default-200 shadow-2xl", className),
        header: clsx("flex flex-col gap-1", headerClassName),
        body: clsx(bodyClassName),
        footer: clsx(footerClassName),
      }}
      hideCloseButton={!showCloseButton}
      isDismissable={closeOnOverlayClick}
      isKeyboardDismissDisabled={!closeOnEscape}
      isOpen={isOpen}
      scrollBehavior="inside"
      size={size}
      onOpenChange={handleOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {/* Header */}
            {title && <ModalHeader>{title}</ModalHeader>}

            {/* Body */}
            <ModalBody>{children}</ModalBody>

            {/* Footer */}
            {shouldShowFooter && <ModalFooter>{actualFooter}</ModalFooter>}
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
