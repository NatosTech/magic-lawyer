import CryptoJS from "crypto-js";

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-key-change-in-production";

/**
 * Criptografa uma string usando AES
 */
export function encrypt(text: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();

    return encrypted;
  } catch (error) {
    console.error("Erro ao criptografar:", error);
    throw new Error("Falha na criptografia");
  }
}

/**
 * Descriptografa uma string usando AES
 */
export function decrypt(encryptedText: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) {
      throw new Error("Falha na descriptografia - chave inválida");
    }

    return decryptedString;
  } catch (error) {
    console.error("Erro ao descriptografar:", error);
    throw new Error("Falha na descriptografia");
  }
}

/**
 * Gera uma chave de criptografia segura
 */
export function generateEncryptionKey(): string {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
}

/**
 * Valida se uma string está criptografada
 */
export function isEncrypted(text: string): boolean {
  try {
    // Tenta descriptografar - se funcionar, está criptografada
    const decrypted = CryptoJS.AES.decrypt(text, ENCRYPTION_KEY);

    return decrypted.toString(CryptoJS.enc.Utf8) !== "";
  } catch {
    return false;
  }
}
