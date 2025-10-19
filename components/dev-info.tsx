"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { ExternalLink, Copy, Globe, Users, Server, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { getDevInfo } from "@/app/actions/dev-info";

interface TenantInfo {
  slug: string;
  name: string;
  domain: string | null;
}

interface DevInfo {
  ngrok: string;
  tenants: TenantInfo[];
  dashboard: string;
  timestamp: string;
}

export function DevInfo() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // SWR para buscar dados com Server Action
  const {
    data: devInfo,
    error,
    isLoading,
  } = useSWR(process.env.NODE_ENV === "development" ? "dev-info" : null, getDevInfo, {
    refreshInterval: 10000, // Atualiza a cada 10 segundos
    revalidateOnFocus: true,
    onSuccess: () => setIsVisible(true),
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (!isVisible || !devInfo || isLoading) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 bg-black/90 backdrop-blur-md border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-green-400" />
          <h3 className="text-sm font-medium text-white">Desenvolvimento</h3>
        </div>
        <div className="flex items-center gap-2">
          <Chip size="sm" color="success" variant="flat">
            DEV
          </Chip>
          <Button isIconOnly size="sm" variant="light" className="text-white">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardBody className="space-y-3">
          {/* ngrok URL */}
          {devInfo.ngrok && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-default-400">ngrok</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-white/10 px-2 py-1 rounded text-green-400 flex-1 truncate">{devInfo.ngrok}</code>
                <Button isIconOnly size="sm" variant="light" onClick={() => copyToClipboard(devInfo.ngrok, "URL ngrok")}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Dashboard ngrok */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3 w-3 text-purple-400" />
              <span className="text-xs text-default-400">Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-white/10 px-2 py-1 rounded text-purple-400 flex-1">http://localhost:4040</code>
              <Button isIconOnly size="sm" variant="light" onClick={() => window.open("http://localhost:4040", "_blank")}>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Tenants */}
          {devInfo.tenants.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-orange-400" />
                <span className="text-xs text-default-400">Tenants Ativos</span>
              </div>
              <div className="space-y-1">
                {devInfo.tenants.map((tenant) => (
                  <div key={tenant.slug} className="flex items-center gap-2">
                    <code className="text-xs bg-white/10 px-2 py-1 rounded text-orange-400 flex-1">{tenant.slug}.localhost:9192</code>
                    <Button isIconOnly size="sm" variant="light" onClick={() => copyToClipboard(`${tenant.slug}.localhost:9192`, "URL tenant")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Webhook URL */}
          {devInfo.ngrok && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-default-400">Webhook</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-white/10 px-2 py-1 rounded text-red-400 flex-1 truncate">{devInfo.ngrok}/api/webhooks/asaas</code>
                <Button isIconOnly size="sm" variant="light" onClick={() => copyToClipboard(`${devInfo.ngrok}/api/webhooks/asaas`, "Webhook URL")}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      )}

      {/* Indicador de status quando recolhido */}
      {!isExpanded && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 text-xs text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>ngrok: {devInfo.ngrok ? "Ativo" : "Inativo"}</span>
            <span className="text-white/50">•</span>
            <span>{devInfo.tenants.length} tenants</span>
          </div>
        </div>
      )}
    </Card>
  );
}
