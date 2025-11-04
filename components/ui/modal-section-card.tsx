"use client";

import { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { motion } from "framer-motion";

import { cardMotionProps } from "./motion-presets";

interface ModalSectionCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export function ModalSectionCard({
  title,
  description,
  children,
  className = "",
  headerClassName = "",
  bodyClassName = "",
}: ModalSectionCardProps) {
  return (
    <motion.div {...cardMotionProps}>
      <Card className={`border border-default-200 ${className}`}>
        {title && (
          <CardHeader className={headerClassName}>
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold text-default-700">
                {title}
              </h4>
              {description && (
                <p className="text-xs text-default-500">{description}</p>
              )}
            </div>
          </CardHeader>
        )}
        <CardBody className={bodyClassName}>{children}</CardBody>
      </Card>
    </motion.div>
  );
}
