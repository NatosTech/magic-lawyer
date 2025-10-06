import { v2 as cloudinary } from 'cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

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
    originalName: string
  ): Promise<UploadResult> {
    try {
      if (this.useCloudinary) {
        return await this.uploadToCloudinary(file, userId, originalName);
      } else {
        return await this.uploadLocally(file, userId, originalName);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  private async uploadToCloudinary(
    file: Buffer,
    userId: string,
    originalName: string
  ): Promise<UploadResult> {
    try {
      // Otimizar imagem com Sharp
      const optimizedBuffer = await sharp(file)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Upload para Cloudinary
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`,
        {
          folder: 'magic-lawyer/avatars',
          public_id: `avatar_${userId}_${Date.now()}`,
          resource_type: 'image',
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        }
      );

      return {
        success: true,
        url: result.secure_url
      };
    } catch (error) {
      console.error('Erro no upload para Cloudinary:', error);
      return {
        success: false,
        error: 'Erro ao fazer upload para Cloudinary'
      };
    }
  }

  private async uploadLocally(
    file: Buffer,
    userId: string,
    originalName: string
  ): Promise<UploadResult> {
    try {
      // Criar diretório se não existir
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Otimizar imagem com Sharp
      const optimizedBuffer = await sharp(file)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileExtension = originalName.split('.').pop() || 'jpg';
      const fileName = `avatar_${userId}_${timestamp}.${fileExtension}`;
      const filePath = join(uploadDir, fileName);

      // Salvar arquivo
      await writeFile(filePath, optimizedBuffer);

      // Retornar URL pública
      const avatarUrl = `/uploads/avatars/${fileName}`;

      return {
        success: true,
        url: avatarUrl
      };
    } catch (error) {
      console.error('Erro no upload local:', error);
      return {
        success: false,
        error: 'Erro ao fazer upload local'
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
      console.error('Erro ao deletar avatar:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  private async deleteFromCloudinary(avatarUrl: string): Promise<UploadResult> {
    try {
      // Extrair public_id da URL do Cloudinary
      const publicId = avatarUrl.split('/').pop()?.split('.')[0];
      if (!publicId) {
        return {
          success: false,
          error: 'URL inválida'
        };
      }

      await cloudinary.uploader.destroy(`magic-lawyer/avatars/${publicId}`);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Erro ao deletar do Cloudinary:', error);
      return {
        success: false,
        error: 'Erro ao deletar do Cloudinary'
      };
    }
  }

  private async deleteLocally(avatarUrl: string, userId: string): Promise<UploadResult> {
    try {
      // Extrair nome do arquivo da URL
      const fileName = avatarUrl.split('/').pop();
      if (!fileName) {
        return {
          success: false,
          error: 'URL inválida'
        };
      }

      // Verificar se o arquivo pertence ao usuário
      if (!fileName.startsWith(`avatar_${userId}_`)) {
        return {
          success: false,
          error: 'Não autorizado para deletar este arquivo'
        };
      }

      // Deletar arquivo
      const filePath = join(process.cwd(), 'public', 'uploads', 'avatars', fileName);
      if (existsSync(filePath)) {
        await writeFile(filePath, ''); // Limpar arquivo
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Erro ao deletar localmente:', error);
      return {
        success: false,
        error: 'Erro ao deletar localmente'
      };
    }
  }

  getUploadMethod(): string {
    return this.useCloudinary ? 'Cloudinary' : 'Local';
  }
}
