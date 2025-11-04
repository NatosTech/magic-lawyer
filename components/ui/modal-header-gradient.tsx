"use client";

import { ReactNode } from "react";
import { ModalHeader } from "@heroui/react";
import { LucideIcon } from "lucide-react";

interface ModalHeaderGradientProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  iconBg?: string;
  className?: string;
  children?: ReactNode;
}

export function ModalHeaderGradient({
  icon: Icon,
  title,
  description,
  iconBg = "bg-primary/10",
  className = "",
  children,
}: ModalHeaderGradientProps) {
  return (
    <ModalHeader className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className="text-primary" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-default-900">{title}</h3>
          {description && (
            <p className="text-sm text-default-500">{description}</p>
          )}
        </div>
        {children}
      </div>
    </ModalHeader>
  );
}
