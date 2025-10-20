/**
 * Serviço de integração com WhatsApp Business API
 * Suporta múltiplos provedores: Whapi.Cloud, Maytapi, etc.
 */

export interface WhatsAppMessage {
  to: string; // Número do destinatário (formato: 5511999999999)
  message: string;
  type?: "text" | "template" | "media";
  mediaUrl?: string;
  templateName?: string;
  templateParams?: string[];
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export interface WhatsAppProvider {
  name: string;
  sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse>;
  isConfigured(): boolean;
}

/**
 * Provedor Whapi.Cloud
 * Plano gratuito: 5 conversas/mês, 150 mensagens/dia, 1000 API calls/mês
 */
class WhapiCloudProvider implements WhatsAppProvider {
  name = "whapi-cloud";
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.WHAPI_CLOUD_API_KEY || "";
    this.baseUrl =
      process.env.WHAPI_CLOUD_BASE_URL || "https://gate.whapi.cloud";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "Whapi.Cloud não configurado. Verifique WHAPI_CLOUD_API_KEY",
        provider: this.name,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages/text`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: message.to,
          body: message.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Erro HTTP ${response.status}`,
          provider: this.name,
        };
      }

      return {
        success: true,
        messageId: data.id,
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        provider: this.name,
      };
    }
  }
}

/**
 * Provedor Maytapi
 * Plano: $24/mês por número, mensagens ilimitadas
 */
class MaytapiProvider implements WhatsAppProvider {
  name = "maytapi";
  private apiKey: string;
  private baseUrl: string;
  private instanceId: string;

  constructor() {
    this.apiKey = process.env.MAYTAPI_API_KEY || "";
    this.baseUrl =
      process.env.MAYTAPI_BASE_URL || "https://api.maytapi.com/api";
    this.instanceId = process.env.MAYTAPI_INSTANCE_ID || "";
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.instanceId);
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error:
          "Maytapi não configurado. Verifique MAYTAPI_API_KEY e MAYTAPI_INSTANCE_ID",
        provider: this.name,
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.instanceId}/sendMessage`,
        {
          method: "POST",
          headers: {
            "x-maytapi-key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to_number: message.to,
            type: "text",
            message: message.message,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `Erro HTTP ${response.status}`,
          provider: this.name,
        };
      }

      return {
        success: true,
        messageId: data.data?.message_id,
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        provider: this.name,
      };
    }
  }
}

/**
 * Provedor Mock para desenvolvimento/testes
 */
class MockProvider implements WhatsAppProvider {
  name = "mock";

  isConfigured(): boolean {
    return true;
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    // Simula delay de rede
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(
      `[MOCK WhatsApp] Enviando para ${message.to}: ${message.message}`,
    );

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: this.name,
    };
  }
}

/**
 * Serviço principal do WhatsApp
 */
export class WhatsAppService {
  private providers: WhatsAppProvider[] = [];
  private defaultProvider: WhatsAppProvider;

  constructor() {
    // Inicializa provedores disponíveis
    this.providers = [
      new WhapiCloudProvider(),
      new MaytapiProvider(),
      new MockProvider(), // Sempre disponível para desenvolvimento
    ];

    // Seleciona o primeiro provedor configurado
    this.defaultProvider =
      this.providers.find((p) => p.isConfigured()) ||
      this.providers[this.providers.length - 1];
  }

  /**
   * Envia mensagem usando o provedor padrão
   */
  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    return this.defaultProvider.sendMessage(message);
  }

  /**
   * Envia mensagem usando um provedor específico
   */
  async sendMessageWithProvider(
    providerName: string,
    message: WhatsAppMessage,
  ): Promise<WhatsAppResponse> {
    const provider = this.providers.find((p) => p.name === providerName);

    if (!provider) {
      return {
        success: false,
        error: `Provedor '${providerName}' não encontrado`,
      };
    }

    if (!provider.isConfigured()) {
      return {
        success: false,
        error: `Provedor '${providerName}' não configurado`,
        provider: providerName,
      };
    }

    return provider.sendMessage(message);
  }

  /**
   * Lista provedores disponíveis e seus status
   */
  getProvidersStatus(): Array<{ name: string; configured: boolean }> {
    return this.providers.map((provider) => ({
      name: provider.name,
      configured: provider.isConfigured(),
    }));
  }

  /**
   * Formata número de telefone para o padrão internacional
   */
  formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, "");

    // Se não tem código do país, adiciona +55 (Brasil)
    if (cleaned.length === 11 && cleaned.startsWith("11")) {
      return `55${cleaned}`;
    }

    // Se já tem código do país
    if (cleaned.length === 13 && cleaned.startsWith("55")) {
      return cleaned;
    }

    // Se tem +55, remove o +
    if (cleaned.startsWith("55") && cleaned.length === 13) {
      return cleaned;
    }

    return cleaned;
  }

  /**
   * Valida se o número está no formato correto
   */
  isValidPhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);

    return formatted.length === 13 && formatted.startsWith("55");
  }
}

// Instância singleton
export const whatsappService = new WhatsAppService();

/**
 * Função utilitária para enviar notificação de andamento
 */
export async function sendAndamentoNotification(
  phoneNumber: string,
  andamento: {
    titulo: string;
    descricao?: string;
    processo: { numero: string; titulo?: string };
    dataMovimentacao: Date;
    mensagemPersonalizada?: string;
  },
): Promise<WhatsAppResponse> {
  const message =
    andamento.mensagemPersonalizada ||
    `📋 *Nova movimentação processual*\n\n` +
      `*Processo:* ${andamento.processo.numero}\n` +
      `*Título:* ${andamento.titulo}\n` +
      (andamento.descricao ? `*Descrição:* ${andamento.descricao}\n` : "") +
      `*Data:* ${andamento.dataMovimentacao.toLocaleDateString("pt-BR")}\n\n` +
      `_Esta é uma mensagem automática do sistema._`;

  return whatsappService.sendMessage({
    to: whatsappService.formatPhoneNumber(phoneNumber),
    message,
    type: "text",
  });
}
