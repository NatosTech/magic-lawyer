// Teste para verificar se as variáveis de ambiente estão sendo carregadas
require("dotenv").config();

console.log("Verificando variáveis de ambiente:");
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "Configurado ✅" : "Não configurado ❌");
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "Não configurado");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Configurado ✅" : "Não configurado ❌");
