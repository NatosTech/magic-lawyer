import { v2 as cloudinary } from "cloudinary";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
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
    this.useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  }

  static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  async uploadAvatar(file: Buffer, userId: string, originalName: string, tenantSlug?: string): Promise<UploadResult> {
    try {
      if (this.useCloudinary) {
        return await this.uploadToCloudinary(file, userId, originalName, tenantSlug);
      } else {
        return await this.uploadLocally(file, userId, originalName, tenantSlug);
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      return {
        success: false,
        error: "Erro interno do servidor",
      };
    }
  }

  private async uploadToCloudinary(file: Buffer, userId: string, originalName: string, tenantSlug?: string): Promise<UploadResult> {
    try {
      // Otimizar imagem com Sharp
      const optimizedBuffer = await sharp(file)
        .resize(200, 200, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Criar estrutura de pastas hierárquica: magiclawyer/tenant/user
      const folderPath = tenantSlug ? `magiclawyer/${tenantSlug}/${userId}` : `magiclawyer/avatars/${userId}`;

      // Upload para Cloudinary
      const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`, {
        folder: folderPath,
        public_id: `avatar_${Date.now()}`,
        resource_type: "image",
        transformation: [
          { width: 200, height: 200, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      });

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

  private async uploadLocally(file: Buffer, userId: string, originalName: string, tenantSlug?: string): Promise<UploadResult> {
    try {
      // Criar estrutura de diretórios hierárquica: magiclawyer/tenant/user
      const uploadDir = tenantSlug ? join(process.cwd(), "public", "uploads", "magiclawyer", tenantSlug, userId) : join(process.cwd(), "public", "uploads", "magiclawyer", "avatars", userId);

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
      const avatarUrl = tenantSlug ? `/uploads/magiclawyer/${tenantSlug}/${userId}/${fileName}` : `/uploads/magiclawyer/avatars/${userId}/${fileName}`;

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
      if (this.useCloudinary) {
        return await this.deleteFromCloudinary(avatarUrl);
      } else {
        return await this.deleteLocally(avatarUrl, userId);
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

  private async deleteLocally(avatarUrl: string, userId: string): Promise<UploadResult> {
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
      const filePath = join(process.cwd(), "public", ...urlParts.slice(uploadsIndex + 1));

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
}
