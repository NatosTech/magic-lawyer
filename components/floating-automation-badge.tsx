"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { X } from "lucide-react";

export function FloatingAutomationBadge() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Verificar se já foi dispensado
    const dismissed = localStorage.getItem("automation-badge-dismissed");
    if (!dismissed) {
      // Mostrar após 2 segundos
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem("automation-badge-dismissed", "true");
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 duration-500">
      <div className="relative">
        <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-sm font-medium text-primary">Novas automações 2025.3</span>
          </div>
          <Button isIconOnly size="sm" variant="light" className="text-default-400 hover:text-default-600 min-w-6 w-6 h-6" onPress={handleDismiss}>
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Efeito de brilho */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 animate-pulse"></div>
      </div>
    </div>
  );
}
