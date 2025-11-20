# 🧪 Guia de Testes - APIs Jurídicas

**Data:** 05/11/2024  
**Status:** ✅ **O QUE PODE SER TESTADO AGORA**

---

## 📋 **O QUE ESTÁ FUNCIONAL E PODE SER TESTADO**

### ✅ **1. Configuração de Tribunais**

**Status:** ✅ **100% Funcional**

**Como testar:**
1. Acesse: `/configuracoes/tribunais`
2. Crie um tribunal (ex: TJBA, TJSP)
3. Verifique se aparece na lista
4. Teste CRUD completo (criar, editar, excluir)

**O que funciona:**
- ✅ Listar tribunais
- ✅ Criar tribunal
- ✅ Editar tribunal
- ✅ Excluir tribunal
- ✅ Filtros por UF/esfera

---

### ✅ **2. Normalização de Movimentações**

**Status:** ✅ **100% Funcional**

**Como testar via código:**
```typescript
import { normalizarMovimentacao } from "@/lib/api/juridical/normalization";

const movimentacao = {
  data: new Date(),
  descricao: "Prazo de 15 dias para manifestação",
  tipo: "Intimação"
};

const normalizada = normalizarMovimentacao(movimentacao);
// Resultado: categoria será "PRAZO", tipoNormalizado será "PRAZO"
```

**O que funciona:**
- ✅ Normalização de tipos de movimentação
- ✅ Extração de prazos de vencimento
- ✅ Categorização automática (PRAZO, AUDIENCIA, SENTENCA, INTIMACAO, OUTRO)
- ✅ Ordenação por data
- ✅ Agrupamento por categoria

**Casos de teste:**
1. "Prazo de 15 dias" → categoria: "PRAZO"
2. "Audiência de conciliação" → categoria: "AUDIENCIA"
3. "Sentença proferida" → categoria: "SENTENCA"
4. "Intimação para manifestação" → categoria: "INTIMACAO"

---

### ✅ **3. Configuração de Tribunais (Config)**

**Status:** ✅ **100% Funcional**

**Como testar via código:**
```typescript
import { 
  getTribunalConfig, 
  getTribunaisScrapingDisponiveis,
  getTribunaisApiDisponiveis 
} from "@/lib/api/juridical/config";

// Buscar configuração de tribunal
const tjba = getTribunalConfig({ sigla: "TJBA" });
console.log(tjba?.scrapingDisponivel); // true

// Listar tribunais com scraping disponível
const scraping = getTribunaisScrapingDisponiveis();
console.log(scraping); // [TJBA, TJSP]

// Listar tribunais com API disponível
const apis = getTribunaisApiDisponiveis();
console.log(apis); // [TRF1, TRT5]
```

**O que funciona:**
- ✅ Busca de configuração por sigla/UF/esfera
- ✅ Lista de tribunais com scraping disponível
- ✅ Lista de tribunais com API disponível
- ✅ Verificação de requisitos (certificado, etc.)

---

### ✅ **4. Serviço de Captura (Estrutura)**

**Status:** ✅ **Estrutura Funcional** (retorna dados mockados)

**Como testar via Server Action:**
```typescript
import { capturarProcessoAction } from "@/app/actions/juridical-capture";

// No componente ou página
const resultado = await capturarProcessoAction({
  numeroProcesso: "0000123-45.2024.8.05.0001",
  tribunalId: "id-do-tribunal-tjba",
});

if (resultado.success) {
  console.log("Processo:", resultado.processo);
  console.log("Movimentações:", resultado.movimentacoes);
}
```

**O que funciona:**
- ✅ Autenticação e verificação de sessão
- ✅ Decisão de método (scraping vs PJe)
- ✅ Normalização de dados retornados
- ✅ Estrutura de resposta correta
- ⚠️ **Retorna dados mockados** (scraping/PJe ainda não implementados)

**O que retorna (mockado):**
```json
{
  "success": true,
  "processo": {
    "numeroProcesso": "0000123-45.2024.8.05.0001",
    "tribunalNome": "Tribunal de Justiça da Bahia",
    "tribunalSigla": "TJBA",
    "sistema": "ESAJ",
    "esfera": "ESTADUAL",
    "uf": "BA",
    "fonte": "SCRAPING",
    "capturadoEm": "2024-11-05T..."
  },
  "movimentacoes": []
}
```

---

### ✅ **5. Normalização de Número de Processo**

**Status:** ✅ **100% Funcional**

**Como testar:**
```typescript
import { normalizarNumeroProcesso } from "@/lib/api/juridical/scraping";

// Teste 1: Número sem formatação
normalizarNumeroProcesso("00001234520248050001");
// Retorna: "0000123-45.2024.8.05.0001"

// Teste 2: Número já formatado
normalizarNumeroProcesso("0000123-45.2024.8.05.0001");
// Retorna: "0000123-45.2024.8.05.0001"

// Teste 3: Número com caracteres especiais
normalizarNumeroProcesso("0000123-45.2024.8.05.0001");
// Retorna: "0000123-45.2024.8.05.0001"
```

---

### ✅ **6. Cron Job (Endpoint)**

**Status:** ✅ **Estrutura Funcional**

**Como testar:**
```bash
# Via curl ou Postman
curl -X POST http://localhost:3000/api/cron/capture-processos \
  -H "Authorization: Bearer SEU_INTERNAL_API_TOKEN" \
  -H "Content-Type: application/json"
```

**O que funciona:**
- ✅ Autenticação por token
- ✅ Busca de processos que precisam atualização
- ✅ Loop de processamento
- ✅ Estrutura de resposta
- ⚠️ **Não captura dados reais** (scraping/PJe ainda não implementados)

**O que retorna:**
```json
{
  "success": true,
  "processados": 10,
  "sucessos": 10,
  "falhas": 0,
  "resultados": [
    {
      "processoId": "...",
      "numeroProcesso": "...",
      "success": true
    }
  ]
}
```

---

## ⚠️ **O QUE NÃO PODE SER TESTADO AINDA**

### ❌ **1. Web Scraping Real**
- ❌ TJBA - Aguardando implementação com Cheerio/Puppeteer
- ❌ TJSP - Aguardando implementação com Cheerio/Puppeteer

### ❌ **2. Integração PJe Real**
- ❌ Autenticação PJe - Aguardando certificado da Doutora Sandra
- ❌ Consulta de processos - Aguardando certificado
- ❌ Captura de andamentos - Aguardando certificado

### ❌ **3. Salvamento no Banco**
- ❌ Criar/atualizar Processo com dados capturados
- ❌ Criar/atualizar MovimentacaoProcesso
- ❌ Criar ProcessoParte

---

## 🧪 **COMO TESTAR AGORA**

### **Opção 1: Teste via Server Action (Recomendado)**

Crie uma página de teste simples:

```typescript
// app/(protected)/teste-captura/page.tsx
"use client";

import { useState } from "react";
import { capturarProcessoAction } from "@/app/actions/juridical-capture";
import { Button } from "@nextui-org/react";

export default function TesteCapturaPage() {
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testar = async () => {
    setLoading(true);
    try {
      const resultado = await capturarProcessoAction({
        numeroProcesso: "0000123-45.2024.8.05.0001",
        tribunalId: undefined, // ou id do tribunal TJBA
      });
      setResultado(resultado);
    } catch (error) {
      setResultado({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1>Teste de Captura de Processos</h1>
      <Button onClick={testar} isLoading={loading}>
        Testar Captura
      </Button>
      {resultado && (
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {JSON.stringify(resultado, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

### **Opção 2: Teste via Terminal (Node.js)**

```typescript
// scripts/test-capture.ts
import { capturarProcesso } from "../app/lib/juridical/capture-service";

async function testar() {
  const resultado = await capturarProcesso({
    numeroProcesso: "0000123-45.2024.8.05.0001",
    tenantId: "seu-tenant-id",
    tribunalSigla: "TJBA",
  });

  console.log(JSON.stringify(resultado, null, 2));
}

testar();
```

### **Opção 3: Teste via API Route (Curl)**

```bash
# Testar cron job
curl -X POST http://localhost:3000/api/cron/capture-processos \
  -H "Authorization: Bearer ${INTERNAL_API_TOKEN}"
```

---

## 📊 **CHECKLIST DE TESTES**

### ✅ **Testes Funcionais**
- [x] Configuração de tribunais (CRUD)
- [x] Normalização de movimentações
- [x] Normalização de número de processo
- [x] Busca de configuração de tribunal
- [x] Serviço de captura (estrutura)
- [x] Server actions (estrutura)
- [x] Cron job (estrutura)

### ⚠️ **Testes Pendentes (Aguardando Implementação)**
- [ ] Web scraping TJBA (dados reais)
- [ ] Web scraping TJSP (dados reais)
- [ ] Autenticação PJe (com certificado)
- [ ] Consulta PJe (dados reais)
- [ ] Salvamento no banco de dados
- [ ] Atualização de processos existentes

---

## 🎯 **PRÓXIMOS PASSOS PARA TESTAR**

1. **Implementar scraping real** → Testar com processos reais do TJBA/TJSP
2. **Upload de certificado** → Testar autenticação PJe
3. **Implementar salvamento** → Testar criação/atualização no banco
4. **Criar interface de teste** → Página para testar captura manual

---

**Última Atualização:** 05/11/2024  
**Status:** ✅ Estrutura validada e pronta para testes básicos







