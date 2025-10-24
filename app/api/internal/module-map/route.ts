import { NextResponse } from "next/server";

import { getModuleRouteMap } from "@/app/lib/module-map";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTH_HEADER = "x-internal-token";

export async function GET(request: Request) {
  const expectedToken = process.env.MODULE_MAP_API_TOKEN;

  if (expectedToken) {
    const providedToken = request.headers.get(AUTH_HEADER);

    if (providedToken !== expectedToken) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: {
          "cache-control": "no-store",
        },
      });
    }
  }

  try {
    const moduleMap = await getModuleRouteMap();

    return NextResponse.json(
      {
        success: true,
        data: moduleMap,
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Erro ao obter module map interno:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao obter module map",
      },
      {
        status: 500,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }
}
