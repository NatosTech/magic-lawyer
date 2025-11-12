# 🕷️ Implementação de Web Scraping - Guia Completo

**Data:** 05/11/2024  
**Status:** 🚧 **EM IMPLEMENTAÇÃO**

---

## 📋 **O QUE É NECESSÁRIO**

### **1. Bibliotecas**

Para implementar scraping real, você precisa de uma biblioteca para fazer parsing de HTML:

**Opção 1: Cheerio (Recomendado para HTML estático)**
```bash
npm install cheerio
npm install --save-dev @types/cheerio
```

**Opção 2: Puppeteer (Para JavaScript dinâmico)**
```bash
npm install puppeteer
```

**Opção 3: Playwright (Já instalado, mas para testes)**
- Não recomendado para produção (muito pesado)

### **2. Estrutura dos Sites**

Precisa entender a estrutura HTML dos sites:
- **TJBA**: `https://www5.tjba.jus.br/esaj/consultas/consulta_processual`
- **TJSP**: `https://esaj.tjsp.jus.br/cjsg/consultaCompleta.do`

### **3. Como Funciona**

1. **Fazer requisição HTTP** para o site do tribunal
2. **Parsear o HTML** retornado
3. **Extrair dados** usando seletores CSS ou XPath
4. **Normalizar** os dados para o formato unificado

---

## 🎯 **IMPLEMENTAÇÃO**

### **Estratégia Recomendada: Cheerio**

**Por quê?**
- ✅ Mais leve que Puppeteer
- ✅ Mais rápido (não precisa de browser)
- ✅ Funciona bem para HTML estático
- ✅ API similar a jQuery

**Quando usar Puppeteer?**
- ❌ Site usa JavaScript pesado para carregar dados
- ❌ Site tem proteções anti-scraping
- ❌ Site requer interação (cliques, formulários)

---

## 📝 **PASSOS PARA IMPLEMENTAR**

### **Passo 1: Instalar Dependências**

```bash
npm install cheerio
npm install --save-dev @types/cheerio
```

### **Passo 2: Analisar Estrutura do Site**

1. Acesse o site do tribunal
2. Inspecione o HTML (F12)
3. Identifique os seletores CSS dos dados:
   - Número do processo
   - Partes
   - Movimentações
   - Vara/Comarca
   - etc.

### **Passo 3: Implementar Função de Scraping**

```typescript
import * as cheerio from 'cheerio';
import { ProcessoJuridico, MovimentacaoProcesso } from './types';

async function consultarTJBA(numeroProcesso: string) {
  // 1. Fazer requisição
  const response = await fetch('https://www5.tjba.jus.br/esaj/...', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `numeroProcesso=${numeroProcesso}`
  });
  
  const html = await response.text();
  
  // 2. Parsear HTML
  const $ = cheerio.load(html);
  
  // 3. Extrair dados
  const processo: ProcessoJuridico = {
    numeroProcesso: $('.numero-processo').text(),
    tribunalNome: 'Tribunal de Justiça da Bahia',
    // ... outros campos
  };
  
  return processo;
}
```

### **Passo 4: Tratar Erros e Edge Cases**

- ✅ Timeout de requisições
- ✅ Retry em caso de falha
- ✅ Validação de dados extraídos
- ✅ Rate limiting (não sobrecarregar servidor)

---

## ⚠️ **CONSIDERAÇÕES IMPORTANTES**

### **1. Termos de Uso**
- ⚠️ Verificar se o site permite scraping
- ⚠️ Respeitar robots.txt
- ⚠️ Não sobrecarregar o servidor

### **2. Rate Limiting**
- Implementar delays entre requisições
- Não fazer muitas requisições simultâneas
- Usar cache quando possível

### **3. Mudanças no Site**
- Sites podem mudar estrutura HTML
- Implementar testes para detectar quebras
- Manter código robusto com fallbacks

### **4. Dados Sensíveis**
- Não fazer scraping de dados sigilosos
- Respeitar privacidade
- Validar que processo é público

---

## 🚀 **PRÓXIMOS PASSOS**

1. ✅ Instalar Cheerio
2. ✅ Analisar estrutura HTML do TJBA/TJSP
3. ✅ Implementar funções de scraping
4. ✅ Testar com processos reais
5. ✅ Implementar tratamento de erros
6. ✅ Adicionar cache para evitar requisições desnecessárias

---

**Última Atualização:** 05/11/2024




