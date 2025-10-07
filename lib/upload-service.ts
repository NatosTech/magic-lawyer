import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

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
      console.error("Erro no upload:", error);

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
      console.error("Erro no upload para Cloudinary:", error);

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
      await writeFile(filePath, optimizedBuffer);

      // Retornar URL pública
      const avatarUrl = tenantSlug
        ? `/uploads/magiclawyer/${tenantSlug}/${userFolder}/${fileName}`
        : `/uploads/magiclawyer/avatars/${userFolder}/${fileName}`;

      return {
        success: true,
        url: avatarUrl,
      };
    } catch (error) {
      console.error("Erro no upload local:", error);

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
      console.error("Erro ao deletar avatar:", error);

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
      console.error("Erro ao deletar do Cloudinary:", error);

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
      console.error("Erro ao deletar localmente:", error);

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
      console.error("Erro ao fazer upload da foto do juiz:", error);

      return {
        success: false,
        error: "Erro ao fazer upload",
      };
    }
  }
}
