# APIs Jurídicas - Magic Lawyer

Sistema de integração com APIs e web scraping de tribunais brasileiros.

## 📋 Estrutura

```
lib/api/juridical/
├── types.ts          # Tipos TypeScript comuns
├── config.ts         # Configuração de tribunais
├── scraping.ts       # Web scraping (e-SAJ, consultas públicas)
├── pje.ts            # Integração PJe (requer certificado A1)
├── normalization.ts  # Normalização de dados
└── index.ts          # Exportações centralizadas
```

## 🚀 Como Usar

### 1. Web Scraping (Sem Certificado)

```typescript
import { consultarProcesso } from "@/lib/api/juridical/scraping";

// Consultar processo no TJBA
const resultado = await consultarProcesso(
  "0000123-45.2024.8.05.0001",
  "TJBA"
);

if (resultado.success) {
  console.log("Processo:", resultado.processo);
}
```

### 2. Integração PJe (Com Certificado)

```typescript
import { consultarPJe } from "@/lib/api/juridical/pje";

// Consultar processo no PJe (requer certificado ativo)
const resultado = await consultarPJe({
  numeroProcesso: "0000123-45.2024.8.05.0001",
  tribunalId: "tribunal-id",
  certificadoId: "certificado-id"
});
```

### 3. Server Actions (Recomendado)

```typescript
import { capturarProcessoAction } from "@/app/actions/juridical-capture";

// Captura processo via Server Action
const resultado = await capturarProcessoAction({
  numeroProcesso: "0000123-45.2024.8.05.0001",
  tribunalId: "tribunal-id",
  certificadoId: "certificado-id" // Opcional para scraping
});
```

## 📊 Status de Implementação

### ✅ Implementado
- ✅ Estrutura base completa
- ✅ Tipos TypeScript
- ✅ Configuração de tribunais
- ✅ Normalização de dados
- ✅ Serviço de captura
- ✅ Server actions
- ✅ Cron job para captura automática

### 🚧 Em Desenvolvimento
- 🚧 Web scraping real (TJBA, TJSP)
- 🚧 Autenticação PJe real
- 🚧 Salvamento de dados capturados no banco

### 📝 Próximos Passos
1. Implementar scraping real com Cheerio/Puppeteer
2. Implementar autenticação PJe quando certificado estiver disponível
3. Integrar com banco de dados (criar/atualizar Processo)
4. Criar interface de usuário para testar captura

## 🔐 Certificado Digital

Para usar integrações PJe, é necessário:
1. Upload de certificado A1 no painel de configurações
2. Certificado ativo e não expirado
3. Certificado do tipo PJE

**Aguardando certificado da Doutora Sandra para testes.**

## 🔄 Cron Jobs

O sistema possui endpoint para captura automática:

```
POST /api/cron/capture-processos
Authorization: Bearer {INTERNAL_API_TOKEN}
```

Configurar no Vercel Cron ou similar para executar diariamente.

## 📝 Notas

- Web scraping funciona sem certificado (TJBA, TJSP)
- PJe requer certificado A1 ativo
- Dados são normalizados automaticamente
- Sistema preparado para quando certificado estiver disponível




