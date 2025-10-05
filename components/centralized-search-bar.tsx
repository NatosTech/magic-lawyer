"use client";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { Modal, ModalContent, ModalBody } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { Search, X } from "lucide-react";
import clsx from "clsx";

import { useSearchResults } from "@/components/searchbar/use-search-results";

interface CentralizedSearchBarProps {
  className?: string;
}

export function CentralizedSearchBar({ className = "" }: CentralizedSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  const { data: results, isLoading, mutate } = useSearchResults(query, isOpen);

  useEffect(() => {
    // Detectar se é Mac
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K ou Cmd+K para abrir
      if ((isMac ? event.metaKey : event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
      }

      // Escape para fechar
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(0);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMac, isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleHeaderInputClick = () => {
    setIsOpen(true);
  };

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

  const getResultIcon = (type: string) => {
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

  const getTypeLabel = (type: string) => {
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

  const handleSearch = () => {
    // TODO: Implementar lógica de busca
    console.log("Buscar...");
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Bar Principal */}
      <div className="relative">
        <Input
          ref={headerInputRef}
          placeholder="Buscar processos, clientes, documentos, juízes..."
          className="w-full h-10 text-sm"
          classNames={{
            input: "text-sm cursor-pointer",
            inputWrapper: "h-10 bg-background/70 backdrop-blur-xl border border-default-200 hover:border-primary/50 focus-within:border-primary shadow-sm transition-all duration-200",
          }}
          startContent={<Search className="w-4 h-4 text-default-400" />}
          endContent={
            <div className="flex items-center gap-2">
              <Kbd keys={[isMac ? "command" : "ctrl"]} className="hidden sm:flex">
                K
              </Kbd>
              <Button isIconOnly size="sm" variant="light" className="text-default-400 hover:text-default-600 min-w-6 w-6 h-6" onPress={handleSearch}>
                <Search className="w-3 h-3" />
              </Button>
            </div>
          }
          onClick={handleHeaderInputClick}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          readOnly
        />
      </div>

      {/* Modal de Busca Avançada com Blur */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setQuery("");
          setSelectedIndex(0);
        }}
        placement="center"
        size="2xl"
        hideCloseButton
        scrollBehavior="inside"
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "border border-default-200 shadow-2xl",
        }}
      >
        <ModalContent>
          <ModalBody className="p-0">
            <div className="flex flex-col">
              {/* Header do Modal */}
              <div className="flex items-center justify-between p-4 border-b border-default-200">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-default-400" />
                  <span className="text-lg font-semibold">Busca Avançada</span>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => {
                    setIsOpen(false);
                    setQuery("");
                    setSelectedIndex(0);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Search Input */}
              <div className="flex items-center gap-3 p-4">
                <Input
                  ref={inputRef}
                  value={query}
                  placeholder="Buscar processos, clientes, documentos..."
                  variant="flat"
                  size="lg"
                  className="flex-1"
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  endContent={
                    <div className="flex items-center gap-2">
                      {query && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="default"
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
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center mb-4">
                        <Kbd keys={["command"]}>K</Kbd>
                        <span className="mx-2 text-sm">ou</span>
                        <Kbd>↑</Kbd>
                        <Kbd>↓</Kbd>
                      </div>
                      <p className="text-sm text-default-500">Digite para buscar processos, clientes, documentos...</p>
                    </div>

                    {/* Filtros Rápidos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button variant="bordered" className="h-10 justify-start">
                        <Search className="w-4 h-4 mr-2" />
                        Processos
                      </Button>
                      <Button variant="bordered" className="h-10 justify-start">
                        <Search className="w-4 h-4 mr-2" />
                        Clientes
                      </Button>
                      <Button variant="bordered" className="h-10 justify-start">
                        <Search className="w-4 h-4 mr-2" />
                        Documentos
                      </Button>
                      <Button variant="bordered" className="h-10 justify-start">
                        <Search className="w-4 h-4 mr-2" />
                        Juízes
                      </Button>
                    </div>
                  </div>
                ) : results && results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result, index) => (
                      <div key={result.id}>
                        <Button
                          className="w-full justify-start p-4 h-auto"
                          variant={index === selectedIndex ? "flat" : "light"}
                          color={index === selectedIndex ? "primary" : "default"}
                          onPress={() => {
                            window.location.href = result.href;
                            setIsOpen(false);
                            setQuery("");
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex-shrink-0">
                              {result.avatar ? (
                                <Avatar src={result.avatar} size="sm" className="flex-shrink-0" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-default-100 flex items-center justify-center text-lg">{getResultIcon(result.type)}</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">{result.title}</span>
                                <Chip size="sm" variant="flat" color={result.statusColor || "default"}>
                                  {getTypeLabel(result.type)}
                                </Chip>
                              </div>
                              {result.description && <p className="text-sm truncate text-default-500">{result.description}</p>}
                              {result.status && (
                                <div className="mt-1">
                                  <Chip size="sm" variant="flat" color={result.statusColor || "default"}>
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
                    <p className="text-xs mt-2 text-default-500">Tente termos diferentes ou mais específicos</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {query && (
                <div className="border-t border-default-200 p-3">
                  <div className="flex items-center justify-between text-xs text-default-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Kbd keys={["arrowup"]} />
                        <Kbd keys={["arrowdown"]} />
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
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
