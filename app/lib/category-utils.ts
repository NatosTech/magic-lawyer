/**
 * Utilitários dinâmicos para categorias de módulos
 * Sistema 100% baseado no banco de dados - ZERO hardcode
 */

import {
  ShieldIcon,
  ZapIcon,
  ScaleIcon,
  DollarSignIcon,
  FileTextIcon,
  SettingsIcon,
  WebhookIcon,
  MessageSquareIcon,
  LockIcon,
  BarChartIcon,
  BotIcon,
  StoreIcon,
  FlaskConicalIcon,
  PuzzleIcon,
  UsersIcon,
  FileIcon,
  CalendarIcon,
  CheckSquareIcon,
  ReceiptIcon,
  CreditCardIcon,
  FileSignatureIcon,
  ClockIcon,
  ClipboardIcon,
  BuildingIcon,
  LayoutDashboardIcon,
  ListIcon,
  ActivityIcon,
  DatabaseIcon,
  KeyIcon,
  TargetIcon,
  LightbulbIcon,
  HelpCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  BookOpenIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  RouteIcon,
  GavelIcon,
} from "lucide-react";

/**
 * Mapeamento dinâmico de ícones do Lucide React
 * Adicione novos ícones aqui conforme necessário
 */
export const ICON_MAP: Record<string, any> = {
  // Ícones principais
  Shield: ShieldIcon,
  Zap: ZapIcon,
  Scale: ScaleIcon,
  DollarSign: DollarSignIcon,
  FileText: FileTextIcon,
  Settings: SettingsIcon,
  Webhook: WebhookIcon,
  MessageSquare: MessageSquareIcon,
  Lock: LockIcon,
  BarChart: BarChartIcon,
  Bot: BotIcon,
  Store: StoreIcon,
  FlaskConical: FlaskConicalIcon,
  Puzzle: PuzzleIcon,

  // Ícones adicionais
  Users: UsersIcon,
  File: FileIcon,
  Calendar: CalendarIcon,
  CheckSquare: CheckSquareIcon,
  Receipt: ReceiptIcon,
  CreditCard: CreditCardIcon,
  FileSignature: FileSignatureIcon,
  Clock: ClockIcon,
  Clipboard: ClipboardIcon,
  Building: BuildingIcon,
  LayoutDashboard: LayoutDashboardIcon,
  List: ListIcon,
  Activity: ActivityIcon,
  Database: DatabaseIcon,
  Key: KeyIcon,
  Target: TargetIcon,
  Lightbulb: LightbulbIcon,
  HelpCircle: HelpCircleIcon,
  CheckCircle: CheckCircleIcon,
  XCircle: XCircleIcon,
  AlertTriangle: AlertTriangleIcon,
  BookOpen: BookOpenIcon,
  ArrowRight: ArrowRightIcon,
  RefreshCw: RefreshCwIcon,
  Route: RouteIcon,
  Gavel: GavelIcon,
};

/**
 * Mapeamento dinâmico de cores hex para cores do HeroUI
 * Adicione novas cores aqui conforme necessário
 */
export const COLOR_MAP: Record<string, string> = {
  // Cores principais
  "#3B82F6": "primary", // blue-500
  "#10B981": "success", // emerald-500
  "#8B5CF6": "secondary", // violet-500
  "#F59E0B": "warning", // amber-500
  "#EF4444": "danger", // red-500
  "#6B7280": "default", // gray-500

  // Cores adicionais
  "#EC4899": "danger", // pink-500
  "#14B8A6": "success", // teal-500
  "#F97316": "warning", // orange-500
  "#6366F1": "primary", // indigo-500
  "#84CC16": "success", // lime-500
  "#F43F5E": "danger", // rose-500
  "#8B5A2B": "warning", // brown-500
  "#1F2937": "default", // gray-800
  "#7C3AED": "secondary", // violet-600
  "#059669": "success", // emerald-600
};

/**
 * Mapeamento dinâmico de cores hex para classes CSS do Tailwind
 * Adicione novas cores aqui conforme necessário
 */
export const CSS_CLASS_MAP: Record<string, { bg: string; text: string }> = {
  // Cores principais
  "#3B82F6": { bg: "bg-blue-100 dark:bg-blue-800", text: "text-blue-600" },
  "#10B981": {
    bg: "bg-emerald-100 dark:bg-emerald-800",
    text: "text-emerald-600",
  },
  "#8B5CF6": {
    bg: "bg-violet-100 dark:bg-violet-800",
    text: "text-violet-600",
  },
  "#F59E0B": { bg: "bg-amber-100 dark:bg-amber-800", text: "text-amber-600" },
  "#EF4444": { bg: "bg-red-100 dark:bg-red-800", text: "text-red-600" },
  "#6B7280": { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600" },

  // Cores adicionais
  "#EC4899": { bg: "bg-pink-100 dark:bg-pink-800", text: "text-pink-600" },
  "#14B8A6": { bg: "bg-teal-100 dark:bg-teal-800", text: "text-teal-600" },
  "#F97316": {
    bg: "bg-orange-100 dark:bg-orange-800",
    text: "text-orange-600",
  },
  "#6366F1": {
    bg: "bg-indigo-100 dark:bg-indigo-800",
    text: "text-indigo-600",
  },
  "#84CC16": { bg: "bg-lime-100 dark:bg-lime-800", text: "text-lime-600" },
  "#F43F5E": { bg: "bg-rose-100 dark:bg-rose-800", text: "text-rose-600" },
  "#8B5A2B": { bg: "bg-amber-100 dark:bg-amber-800", text: "text-amber-600" },
  "#1F2937": { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600" },
  "#7C3AED": {
    bg: "bg-violet-100 dark:bg-violet-800",
    text: "text-violet-600",
  },
  "#059669": {
    bg: "bg-emerald-100 dark:bg-emerald-800",
    text: "text-emerald-600",
  },
};

/**
 * Obtém o ícone da categoria baseado nas informações do banco
 * @param categoriaInfo - Informações da categoria do banco de dados
 * @returns Componente de ícone do Lucide React
 */
export function getCategoryIcon(categoriaInfo?: any) {
  if (categoriaInfo?.icone && ICON_MAP[categoriaInfo.icone]) {
    return ICON_MAP[categoriaInfo.icone];
  }

  // Fallback genérico - sempre PuzzleIcon se não houver categoria ou ícone inválido
  return PuzzleIcon;
}

/**
 * Obtém a cor da categoria baseada nas informações do banco
 * @param categoriaInfo - Informações da categoria do banco de dados
 * @returns Cor do HeroUI (primary, success, warning, danger, secondary, default)
 */
export function getCategoryColor(categoriaInfo?: any) {
  if (categoriaInfo?.cor && COLOR_MAP[categoriaInfo.cor]) {
    return COLOR_MAP[categoriaInfo.cor];
  }

  // Fallback genérico - sempre "default" se não houver categoria ou cor inválida
  return "default";
}

/**
 * Obtém as classes CSS da categoria baseadas nas informações do banco
 * @param categoriaInfo - Informações da categoria do banco de dados
 * @returns Objeto com classes de background e texto
 */
export function getCategoryClasses(categoriaInfo?: any) {
  if (categoriaInfo?.cor && CSS_CLASS_MAP[categoriaInfo.cor]) {
    return CSS_CLASS_MAP[categoriaInfo.cor];
  }

  // Fallback genérico - sempre cinza se não houver categoria ou cor inválida
  return { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600" };
}

/**
 * Lista todos os ícones disponíveis para seleção
 * @returns Array com nomes dos ícones disponíveis
 */
export function getAvailableIcons(): string[] {
  return Object.keys(ICON_MAP).sort();
}

/**
 * Lista todas as cores disponíveis para seleção
 * @returns Array com cores hex disponíveis
 */
export function getAvailableColors(): string[] {
  return Object.keys(COLOR_MAP).sort();
}

/**
 * Valida se um ícone existe no mapeamento
 * @param iconName - Nome do ícone
 * @returns true se o ícone existe, false caso contrário
 */
export function isValidIcon(iconName: string): boolean {
  return iconName in ICON_MAP;
}

/**
 * Valida se uma cor existe no mapeamento
 * @param colorHex - Cor em formato hex
 * @returns true se a cor existe, false caso contrário
 */
export function isValidColor(colorHex: string): boolean {
  return colorHex in COLOR_MAP;
}
