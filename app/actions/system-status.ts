"use server";

import { getServerSession } from "next-auth";
import Ably from "ably";
import Redis from "ioredis";
import { v2 as cloudinary } from "cloudinary";

import prisma from "@/app/lib/prisma";
import { authOptions } from "@/auth";
import { AsaasClient } from "@/lib/asaas";
import { getModuleRouteMap } from "@/app/lib/module-map";

export type ExternalServiceStatus = {
  id: string;
  name: string;
  ok: boolean;
  message?: string;
};

async function checkDatabase(): Promise<ExternalServiceStatus> {
  try {
    await prisma.tenant.count();

    return { id: "neon", name: "Neon (Postgres)", ok: true };
  } catch (error) {
    return {
      id: "neon",
      name: "Neon (Postgres)",
      ok: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function checkAbly(): Promise<ExternalServiceStatus> {
  if (!process.env.ABLY_API_KEY) {
    return {
      id: "ably",
      name: "Ably Realtime",
      ok: false,
      message: "ABLY_API_KEY não configurada",
    };
  }

  try {
    const client = new Ably.Rest({ key: process.env.ABLY_API_KEY });
    await client.time();

    return { id: "ably", name: "Ably Realtime", ok: true };
  } catch (error) {
    return {
      id: "ably",
      name: "Ably Realtime",
      ok: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function checkCloudinary(): Promise<ExternalServiceStatus> {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return {
      id: "cloudinary",
      name: "Cloudinary",
      ok: false,
      message: "Credenciais do Cloudinary não configuradas",
    };
  }

  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    await cloudinary.api.ping();

    return { id: "cloudinary", name: "Cloudinary", ok: true };
  } catch (error) {
    return {
      id: "cloudinary",
      name: "Cloudinary",
      ok: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function checkAsaas(): Promise<ExternalServiceStatus> {
  if (!process.env.ASAAS_API_KEY) {
    return {
      id: "asaas",
      name: "Asaas",
      ok: false,
      message: "ASAAS_API_KEY não configurada",
    };
  }

  try {
    const env =
      process.env.ASAAS_ENVIRONMENT?.toLowerCase() === "production"
        ? "production"
        : "sandbox";
    const client = new AsaasClient(process.env.ASAAS_API_KEY, env);
    const ok = await client.testConnection();

    return {
      id: "asaas",
      name: "Asaas",
      ok,
      message: ok ? undefined : "Falha ao consultar API",
    };
  } catch (error) {
    return {
      id: "asaas",
      name: "Asaas",
      ok: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function checkModuleMap(): Promise<ExternalServiceStatus> {
  try {
    await getModuleRouteMap();

    return { id: "module_map", name: "Module Map", ok: true };
  } catch (error) {
    return {
      id: "module_map",
      name: "Module Map",
      ok: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function checkRedis(): Promise<ExternalServiceStatus> {
  if (!process.env.REDIS_URL) {
    return {
      id: "redis",
      name: "Upstash Redis",
      ok: false,
      message: "REDIS_URL não configurada",
    };
  }

  const redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });

  try {
    await redis.connect();
    await redis.ping();

    return { id: "redis", name: "Upstash Redis", ok: true };
  } catch (error) {
    return {
      id: "redis",
      name: "Upstash Redis",
      ok: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  } finally {
    redis.disconnect();
  }
}

export async function fetchSystemStatus() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any)?.role !== "SUPER_ADMIN") {
    return {
      success: false,
      error: "Sem permissão para consultar status",
      services: [],
    };
  }

  const services = await Promise.all([
    checkDatabase(),
    checkAbly(),
    checkCloudinary(),
    checkAsaas(),
    checkModuleMap(),
    checkRedis(),
  ]);

  return {
    success: true,
    services,
  };
}
