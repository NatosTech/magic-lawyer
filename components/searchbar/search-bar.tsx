"use client";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";

import { useSearchResults } from "./use-search-results";

import { SearchIcon } from "@/components/icons";
import { Modal } from "@/components/ui/modal";

export type SearchResult = {
  id: string;
  type: "processo" | "cliente" | "documento" | "usuario" | "juiz";
  title: string;
  description?: string;
  href: string;
  avatar?: string;
  status?: string;
  statusColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
};

type SearchBarProps = {
  className?: string;
};

export function SearchBar({ className }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading, mutate } = useSearchResults(query, isOpen);

  // Open modal with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown as any);

    return () => document.removeEventListener("keydown", handleKeyDown as any);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close modal with Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(0);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape as any);

      return () => document.removeEventListener("keydown", handleEscape as any);
    }
  }, [isOpen]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
    if (value.length > 0) {
      mutate();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!results || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          window.location.href = results[selectedIndex].href;
          setIsOpen(false);
          setQuery("");
        }
        break;
    }
  };

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "processo":
        return "⚖️";
      case "cliente":
        return "👤";
      case "documento":
        return "📄";
      case "usuario":
        return "👥";
      case "juiz":
        return "👨‍⚖️";
      default:
        return "🔍";
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "processo":
        return "Processo";
      case "cliente":
        return "Cliente";
      case "documento":
        return "Documento";
      case "usuario":
        return "Usuário";
      case "juiz":
        return "Juiz";
      default:
        return "Resultado";
    }
  };

  return (
    <>
      {/* Search Input Field */}
      <Button
        className={`h-10 px-3 ${className}`}
        color="secondary"
        endContent={
          <Kbd className="hidden sm:flex" keys={["command"]}>
            K
          </Kbd>
        }
        startContent={<SearchIcon className="h-4 w-4" />}
        variant="bordered"
        onPress={() => setIsOpen(true)}
      >
        <span className="hidden sm:inline">Search</span>
        <span className="sm:hidden">Buscar</span>
      </Button>

      {/* Search Modal */}
      <Modal backdrop="blur" closeOnEscape={true} closeOnOverlayClick={true} isOpen={isOpen} showCloseButton={false} size="2xl" onClose={() => setIsOpen(false)}>
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4">
            <SearchIcon className="h-5 w-5" />
            <Input
              ref={inputRef}
              className="flex-1"
              endContent={
                <div className="flex items-center gap-2">
                  {query && (
                    <Button
                      isIconOnly
                      color="default"
                      size="sm"
                      variant="light"
                      onPress={() => {
                        setQuery("");
                        setSelectedIndex(0);
                      }}
                    >
                      ×
                    </Button>
                  )}
                  <Kbd keys={["escape"]}>ESC</Kbd>
                </div>
              }
              placeholder="Buscar processos, clientes, documentos..."
              size="lg"
              value={query}
              variant="flat"
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="sm" />
                <span className="ml-2 text-sm">Buscando...</span>
              </div>
            ) : query.length === 0 ? (
              <div className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Kbd keys={["command"]}>K</Kbd>
                  <span className="mx-2 text-sm">ou</span>
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                </div>
                <p className="text-sm">Digite para buscar processos, clientes, documentos...</p>
              </div>
            ) : results && results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <div key={result.id}>
                    <Button
                      className="w-full justify-start p-4 h-auto"
                      color={index === selectedIndex ? "primary" : "default"}
                      variant={index === selectedIndex ? "flat" : "light"}
                      onPress={() => {
                        window.location.href = result.href;
                        setIsOpen(false);
                        setQuery("");
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-shrink-0">
                          {result.avatar ? (
                            <Avatar className="flex-shrink-0" size="sm" src={result.avatar} />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-default-100 flex items-center justify-center text-lg">{getResultIcon(result.type)}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{result.title}</span>
                            <Chip color={result.statusColor || "default"} size="sm" variant="flat">
                              {getTypeLabel(result.type)}
                            </Chip>
                          </div>
                          {result.description && <p className="text-sm truncate">{result.description}</p>}
                          {result.status && (
                            <div className="mt-1">
                              <Chip color={result.statusColor || "default"} size="sm" variant="flat">
                                {result.status}
                              </Chip>
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                    {index < results.length - 1 && <Divider className="mx-4" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm">Nenhum resultado encontrado para "{query}"</p>
                <p className="text-xs mt-2">Tente termos diferentes ou mais específicos</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {query && (
            <div className="border-t p-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Kbd keys={["up"]} />
                    <Kbd keys={["down"]} />
                    <span>navegar</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Kbd keys={["enter"]} />
                    <span>selecionar</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Kbd keys={["escape"]} />
                  <span>fechar</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
