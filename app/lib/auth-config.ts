// Configuração dinâmica do NextAuth baseada no domínio
export function getNextAuthConfig(host: string) {
  // Remove porta se existir
  const cleanHost = host.split(":")[0];
  
  // Para desenvolvimento local
  if (cleanHost.includes("localhost")) {
    return {
      url: `http://${cleanHost}`,
      useSecureCookies: false,
    };
  }
  
  // Para preview deployments do Vercel (branches que não são main)
  if (cleanHost.includes("vercel.app") && !cleanHost.includes("magiclawyer.vercel.app")) {
    return {
      url: `https://${cleanHost}`,
      useSecureCookies: true,
    };
  }
  
  // Para domínio principal de produção
  if (cleanHost.includes("magiclawyer.vercel.app")) {
    return {
      url: "https://magiclawyer.vercel.app",
      useSecureCookies: true,
    };
  }
  
  // Para domínios customizados
  return {
    url: `https://${cleanHost}`,
    useSecureCookies: true,
  };
}

// Função para detectar se é um preview deployment do Vercel
export function isVercelPreviewDeployment(host: string): boolean {
  const cleanHost = host.split(":")[0];
  return cleanHost.includes("vercel.app") && !cleanHost.includes("magiclawyer.vercel.app");
}

// Função para detectar se é desenvolvimento local
export function isLocalDevelopment(host: string): boolean {
  const cleanHost = host.split(":")[0];
  return cleanHost.includes("localhost") || cleanHost.includes("127.0.0.1");
}

// Função para detectar se é produção
export function isProduction(host: string): boolean {
  const cleanHost = host.split(":")[0];
  return cleanHost.includes("magiclawyer.vercel.app") || 
         (!cleanHost.includes("vercel.app") && !cleanHost.includes("localhost"));
}
