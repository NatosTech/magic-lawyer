import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export const TENANT_PERMISSIONS = {
  manageOfficeSettings: "CONFIGURACOES_ESCRITORIO",
  manageTeam: "EQUIPE_GERENCIAR",
  manageFinance: "FINANCEIRO_GERENCIAR",
} as const;

export type TenantPermission = (typeof TENANT_PERMISSIONS)[keyof typeof TENANT_PERMISSIONS];
