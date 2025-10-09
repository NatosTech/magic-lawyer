import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

import logger from "@/lib/logger";

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  publicId?: string;
}

export interface DocumentUploadOptions {
  tipo: "procuracao" | "processo" | "contrato";
  identificador: string;
  fileName: string;
  description?: string;
}

export class UploadService {
  private static instance: UploadService;
  private useCloudinary: boolean;

  constructor() {
    // Verificar se Cloudinary está configurado
    this.useCloudinary = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }

    return UploadService.instance;
  }

  async uploadAvatar(
    file: Buffer,
    userId: string,
    originalName: string,
    tenantSlug?: string,
    userName?: string,
  ): Promise<UploadResult> {
    try {
      if (this.useCloudinary) {
        return await this.uploadToCloudinary(
          file,
          userId,
          originalName,
          tenantSlug,
          userName,
        );
      } else {
        return await this.uploadLocally(
          file,
          userId,
          originalName,
          tenantSlug,
          userName,
        );
      }
    } catch (error) {
      logger.error("Erro no upload:", error);

      return {
        success: false,
        error: "Erro interno do servidor",
      };
    }
  }

  private async uploadToCloudinary(
    file: Buffer,
    userId: string,
    originalName: string,
    tenantSlug?: string,
    userName?: string,
  ): Promise<UploadResult> {
    try {
      // Otimizar imagem com Sharp
      const optimizedBuffer = await sharp(file)
        .resize(200, 200, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Criar nome de usuário limpo para pasta
      const cleanUserName = userName
        ? userName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
        : "user";

      // Criar estrutura de pastas hierárquica: magiclawyer/tenant/nome-id
      const userFolder = `${cleanUserName}-${userId}`;
      const folderPath = tenantSlug
        ? `magiclawyer/${tenantSlug}/${userFolder}`
        : `magiclawyer/avatars/${userFolder}`;

      // Upload para Cloudinary
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`,
        {
          folder: folderPath,
          public_id: `avatar_${Date.now()}`,
          resource_type: "image",
          transformation: [
            { width: 200, height: 200, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
      );

      return {
        success: true,
        url: result.secure_url,
      };
    } catch (error) {
      logger.error("Erro no upload para Cloudinary:", error);

      return {
        success: false,
        error: "Erro ao fazer upload para Cloudinary",
      };
    }
  }

  private async uploadLocally(
    file: Buffer,
    userId: string,
    originalName: string,
    tenantSlug?: string,
    userName?: string,
  ): Promise<UploadResult> {
    try {
      // Criar nome de usuário limpo para pasta
      const cleanUserName = userName
        ? userName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
        : "user";

      // Criar estrutura de diretórios hierárquica: magiclawyer/tenant/nome-id
      const userFolder = `${cleanUserName}-${userId}`;
      const uploadDir = tenantSlug
        ? join(
            process.cwd(),
            "public",
            "uploads",
            "magiclawyer",
            tenantSlug,
            userFolder,
          )
        : join(
            process.cwd(),
            "public",
            "uploads",
            "magiclawyer",
            "avatars",
            userFolder,
          );

      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Otimizar imagem com Sharp
      const optimizedBuffer = await sharp(file)
        .resize(200, 200, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileExtension = originalName.split(".").pop() || "jpg";
      const fileName = `avatar_${timestamp}.${fileExtension}`;
      const filePath = join(uploadDir, fileName);

      // Salvar arquivo
      await writeFile(filePath, new Uint8Array(optimizedBuffer));

      // Retornar URL pública
      const avatarUrl = tenantSlug
        ? `/uploads/magiclawyer/${tenantSlug}/${userFolder}/${fileName}`
        : `/uploads/magiclawyer/avatars/${userFolder}/${fileName}`;

      return {
        success: true,
        url: avatarUrl,
      };
    } catch (error) {
      logger.error("Erro no upload local:", error);

      return {
        success: false,
        error: "Erro ao fazer upload local",
      };
    }
  }

  async deleteAvatar(avatarUrl: string, userId: string): Promise<UploadResult> {
    try {
      if (!avatarUrl || typeof avatarUrl !== "string") {
        return {
          success: false,
          error: "URL inválida",
        };
      }

      // Verificar se é uma URL do Cloudinary
      if (this.isCloudinaryUrl(avatarUrl)) {
        if (this.useCloudinary) {
          return await this.deleteFromCloudinary(avatarUrl);
        } else {
          // Se não está usando Cloudinary mas a URL é do Cloudinary, não pode deletar
          return {
            success: false,
            error:
              "Não é possível deletar imagem do Cloudinary quando usando armazenamento local",
          };
        }
      } else {
        // É uma URL externa, não pode ser deletada
        return {
          success: false,
          error: "Não é possível deletar imagens de URLs externas",
        };
      }
    } catch (error) {
      logger.error("Erro ao deletar avatar:", error);

      return {
        success: false,
        error: "Erro interno do servidor",
      };
    }
  }

  private async deleteFromCloudinary(avatarUrl: string): Promise<UploadResult> {
    try {
      if (!avatarUrl || typeof avatarUrl !== "string") {
        return {
          success: false,
          error: "URL inválida",
        };
      }

      // Extrair public_id completo da URL do Cloudinary
      // A URL do Cloudinary tem formato: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/subfolder/public_id.jpg
      const urlParts = avatarUrl.split("/");
      const uploadIndex = urlParts.findIndex((part) => part === "upload");

      if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) {
        return {
          success: false,
          error: "URL inválida",
        };
      }

      // Construir o public_id completo (incluindo pasta)
      const publicIdParts = urlParts.slice(uploadIndex + 2); // Pular 'upload' e 'v1234567890'
      const publicId = publicIdParts.join("/").split(".")[0]; // Remover extensão

      await cloudinary.uploader.destroy(publicId);

      return {
        success: true,
      };
    } catch (error) {
      logger.error("Erro ao deletar do Cloudinary:", error);

      return {
        success: false,
        error: "Erro ao deletar do Cloudinary",
      };
    }
  }

  private async deleteLocally(
    avatarUrl: string,
    userId: string,
  ): Promise<UploadResult> {
    try {
      // Extrair caminho completo do arquivo da URL
      // URL format: /uploads/magiclawyer/tenant/user/avatar_timestamp.jpg
      const urlParts = avatarUrl.split("/");
      const uploadsIndex = urlParts.findIndex((part) => part === "uploads");

      if (uploadsIndex === -1 || uploadsIndex + 1 >= urlParts.length) {
        return {
          success: false,
          error: "URL inválida",
        };
      }

      // Construir caminho completo do arquivo
      const filePath = join(
        process.cwd(),
        "public",
        ...urlParts.slice(uploadsIndex + 1),
      );

      // Verificar se o arquivo existe e pertence ao usuário
      if (!existsSync(filePath)) {
        return {
          success: false,
          error: "Arquivo não encontrado",
        };
      }

      // Verificar se o caminho contém o userId (segurança)
      if (!filePath.includes(userId)) {
        return {
          success: false,
          error: "Não autorizado para deletar este arquivo",
        };
      }

      // Deletar arquivo
      await writeFile(filePath, ""); // Limpar arquivo

      return {
        success: true,
      };
    } catch (error) {
      logger.error("Erro ao deletar localmente:", error);

      return {
        success: false,
        error: "Erro ao deletar localmente",
      };
    }
  }

  getUploadMethod(): string {
    return this.useCloudinary ? "Cloudinary" : "Local";
  }

  private isCloudinaryUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      return (
        urlObj.hostname.includes("cloudinary.com") ||
        urlObj.hostname.includes("res.cloudinary.com")
      );
    } catch {
      return false;
    }
  }

  /**
   * Upload de documento para Cloudinary
   * Estrutura: magiclawyer/{tenantSlug}/{userId}/{tipo}/{identificador}/{fileName}_{timestamp}
   */
  async uploadDocumento(
    file: Buffer,
    userId: string,
    originalName: string,
    tenantSlug: string,
    options: DocumentUploadOptions,
  ): Promise<UploadResult> {
    try {
      if (!this.useCloudinary) {
        return {
          success: false,
          error: "Upload de documentos requer Cloudinary configurado",
        };
      }

      // Validar tipo de arquivo (apenas PDFs para documentos)
      const fileExtension = originalName.split(".").pop()?.toLowerCase();

      if (fileExtension !== "pdf") {
        return {
          success: false,
          error: "Apenas arquivos PDF são permitidos para documentos",
        };
      }

      // Criar estrutura de pastas hierárquica
      const folderPath = this.getDocumentFolderPath(
        tenantSlug,
        userId,
        options.tipo,
        options.identificador,
      );

      // Criar nome do arquivo limpo
      const cleanFileName = this.cleanFileName(options.fileName);
      const timestamp = Date.now();
      const publicId = `${cleanFileName}_${timestamp}`;

      // Upload para Cloudinary
      const result = await cloudinary.uploader.upload(
        `data:application/pdf;base64,${file.toString("base64")}`,
        {
          folder: folderPath,
          public_id: publicId,
          resource_type: "raw",
          tags: [options.tipo, options.identificador, userId],
        },
      );

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      logger.error("Erro ao fazer upload do documento:", error);

      return {
        success: false,
        error: "Erro ao fazer upload do documento",
      };
    }
  }

  /**
   * Upload de foto de juiz para Cloudinary
   * Estrutura: magiclawyer/juizes/{nome-juiz}-{juiz-id}/foto_{timestamp}
   */
  async uploadJuizFoto(
    file: Buffer,
    juizId: string,
    juizNome: string,
    originalName: string,
  ): Promise<UploadResult> {
    try {
      if (!this.useCloudinary) {
        return {
          success: false,
          error: "Upload de fotos de juízes requer Cloudinary configurado",
        };
      }

      // Otimizar imagem com Sharp (mesmo que avatar)
      const optimizedBuffer = await sharp(file)
        .resize(500, 500, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      const base64Image = `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`;

      // Criar nome limpo para a pasta
      const cleanJuizNome = juizNome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9]+/g, "-") // Substitui caracteres especiais por hífen
        .replace(/^-+|-+$/g, ""); // Remove hífens do início e fim

      // Estrutura de pasta para juízes com nome
      // Exemplo: magiclawyer/juizes/joao-silva-cmxyz123/foto_1234567890
      const folderPath = `magiclawyer/juizes/${cleanJuizNome}-${juizId}`;
      const publicId = `${folderPath}/foto_${Date.now()}`;

      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        public_id: publicId,
        folder: folderPath,
        resource_type: "image",
        transformation: [
          {
            width: 500,
            height: 500,
            crop: "fill",
            gravity: "face",
            quality: "auto:good",
          },
        ],
        tags: ["juiz", "foto", juizId, cleanJuizNome],
      });

      return {
        success: true,
        url: uploadResult.secure_url,
      };
    } catch (error) {
      logger.error("Erro ao fazer upload da foto do juiz:", error);

      return {
        success: false,
        error: "Erro ao fazer upload",
      };
    }
  }

  /**
   * Deletar documento do Cloudinary
   */
  async deleteDocumento(
    documentUrl: string,
    userId: string,
  ): Promise<UploadResult> {
    try {
      if (!this.useCloudinary) {
        return {
          success: false,
          error: "Deleção de documentos requer Cloudinary configurado",
        };
      }

      if (!this.isCloudinaryUrl(documentUrl)) {
        return {
          success: false,
          error: "URL inválida ou não é do Cloudinary",
        };
      }

      return await this.deleteFromCloudinary(documentUrl);
    } catch (error) {
      logger.error("Erro ao deletar documento:", error);

      return {
        success: false,
        error: "Erro ao deletar documento",
      };
    }
  }

  /**
   * Criar caminho de pasta para documentos
   */
  private getDocumentFolderPath(
    tenantSlug: string,
    userId: string,
    tipo: string,
    identificador: string,
  ): string {
    // Usar apenas o tenantSlug, sem duplicar a estrutura
    const basePath = tenantSlug
      ? `magiclawyer/${tenantSlug}`
      : `magiclawyer/documents`;

    // Criar nome descritivo para o identificador (nome-id)
    const cleanIdentificador = this.cleanFileName(identificador);

    // Corrigir plural de procuração
    const tipoPlural = tipo === "procuracao" ? "procuracoes" : `${tipo}s`;

    return `${basePath}/${tipoPlural}/${cleanIdentificador}`;
  }

  /**
   * Verificar se arquivo existe no Cloudinary
   */
  async checkFileExists(
    url: string,
  ): Promise<{ success: boolean; exists: boolean; error?: string }> {
    try {
      if (!this.useCloudinary) {
        return {
          success: false,
          exists: false,
          error: "Cloudinary não configurado",
        };
      }

      if (!this.isCloudinaryUrl(url)) {
        return {
          success: false,
          exists: false,
          error: "URL não é do Cloudinary",
        };
      }

      // Extrair public_id da URL
      const urlParts = url.split("/");
      const uploadIndex = urlParts.findIndex((part) => part === "upload");

      if (uploadIndex === -1) {
        return { success: false, exists: false, error: "URL inválida" };
      }

      const publicIdParts = urlParts.slice(uploadIndex + 2); // Pular 'upload' e versão
      const publicId = publicIdParts.join("/").split(".")[0]; // Remover extensão

      // Verificar se arquivo existe
      const result = await cloudinary.api.resource(publicId);

      return {
        success: true,
        exists: !!result,
      };
    } catch (error: any) {
      // Se erro 404, arquivo não existe
      if (error.http_code === 404) {
        return {
          success: true,
          exists: false,
        };
      }

      return {
        success: false,
        exists: false,
        error: error.message,
      };
    }
  }

  /**
   * Limpar nome do arquivo para ser compatível com Cloudinary
   */
  private cleanFileName(fileName: string): string {
    return fileName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\-_]/g, "_") // Substitui caracteres especiais por underscore
      .replace(/_+/g, "_") // Remove underscores duplicados
      .replace(/^_|_$/g, ""); // Remove underscores do início e fim
  }
}
