"use server";

import { execSync } from "child_process";

import prisma from "@/app/lib/prisma";

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

export async function getDevInfo(): Promise<DevInfo> {
  // Só funcionar em desenvolvimento
  if (process.env.NODE_ENV !== "development") {
    return {
      ngrok: "",
      tenants: [],
      dashboard: "http://localhost:4040",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    // Obter URL do ngrok
    let ngrokUrl = "";

    try {
      const result = execSync("curl -s http://localhost:4040/api/tunnels", {
        encoding: "utf8",
        timeout: 2000,
      });
      const tunnels = JSON.parse(result);

      if (tunnels.tunnels && tunnels.tunnels.length > 0) {
        ngrokUrl = tunnels.tunnels[0].public_url;
      }
    } catch (error) {
      console.log("ngrok não disponível");
    }

    // Obter informações dos tenants
    let tenants: TenantInfo[] = [];

    try {
      tenants = await prisma.tenant.findMany({
        select: {
          slug: true,
          name: true,
          domain: true,
        },
        where: {
          status: "ACTIVE",
        },
        take: 5,
      });
    } catch (error) {
      console.log("Erro ao buscar tenants:", error);
    }

    return {
      ngrok: ngrokUrl,
      tenants: tenants,
      dashboard: "http://localhost:4040",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ngrok: "",
      tenants: [],
      dashboard: "http://localhost:4040",
      timestamp: new Date().toISOString(),
    };
  }
}
