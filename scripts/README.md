# 🚀 Scripts de Desenvolvimento - Magic Lawyer

> **🆕 Agora em TypeScript!** Todos os scripts foram convertidos para TypeScript com tipagem completa.

## 📋 Scripts Disponíveis

### 🎯 **npm run setup:dev** (Seu favorito!)
**O que faz:**
- Para todos os processos (Next.js, ngrok, Node)
- Reseta o banco de dados completamente
- Executa seeds
- **🆕 Limpa automaticamente o sandbox do Asaas**
- **🆕 Atualiza automaticamente o webhook com a nova URL do ngrok**
- Inicia Next.js + ngrok

**Quando usar:** Quando você quer começar do zero, resetar tudo.

---

### 🔄 **npm run restart:dev** (NOVO!)
**O que faz:**
- Para Next.js e ngrok
- Reinicia Next.js e ngrok
- **🆕 Atualiza automaticamente o webhook com a nova URL do ngrok**
- **NÃO reseta o banco de dados**

**Quando usar:** Quando você quer apenas reiniciar o servidor sem perder dados do banco.

---

### 🧹 **npm run cleanup:asaas** (NOVO!)
**O que faz:**
- Limpa o sandbox do Asaas
- Remove clientes órfãos (existem no Asaas mas não no banco)
- Remove cobranças órfãs
- Atualiza o webhook com a URL atual do ngrok

**Quando usar:** Quando você quer apenas limpar o Asaas sem reiniciar o servidor.

#### **🧪 Para testar webhook do Asaas:**
```bash
npm run notifications:webhook
```
- Lista webhooks existentes
- Testa atualização de webhook
- Testa criação de webhook
- Requer ASAAS_API_KEY configurada

**Quando usar:** Para testar se a funcionalidade de webhook está funcionando corretamente.

---

## 🎯 **Respostas às Suas Dúvidas:**

### 1️⃣ **"Quando parar o código e quiser rodar o ngrok e servidor next, parando o ngrok e iniciando novamente e parando o next e iniciando novamente sem resetar o banco, o que eu rodo?"**

**Resposta:** Use `npm run restart:dev`

```bash
npm run restart:dev
```

**O que acontece:**
- ✅ Para Next.js e ngrok
- ✅ Reinicia Next.js e ngrok
- ✅ Atualiza webhook automaticamente
- ❌ **NÃO reseta o banco** (mantém seus dados)

---

### 2️⃣ **"Quando eu apago tudo, está perfeito, quando quero, ai vou na asaas, coloco o webhook, o novo que o ngrok gera, perfeito!! ok ok, e ai, tenho que ir em clientes e apagar o cliente e todas as cobranças que nele existem manualmente, queria saber se é possível deletar tudo do sandbox de uma vez"**

**Resposta:** Agora é automático! 🎉

**O que foi implementado:**
- ✅ **Limpeza automática** quando você roda `npm run setup:dev`
- ✅ **Sincronização inteligente** - só remove clientes que não existem no banco
- ✅ **Atualização automática do webhook** com a nova URL do ngrok
- ✅ **Remoção de cobranças órfãs** automaticamente

---

## 🔧 **Como Funciona a Limpeza Automática:**

### 📊 **Sincronização Inteligente:**
1. **Busca clientes no banco** que têm `asaasCustomerId`
2. **Busca clientes no Asaas**
3. **Identifica órfãos** (existem no Asaas mas não no banco)
4. **Remove cobranças** dos clientes órfãos
5. **Remove clientes órfãos**

### 🎯 **Exemplo:**
```
Banco de Dados:
- Cliente A (asaasCustomerId: "cus_123")
- Cliente B (asaasCustomerId: "cus_456")

Asaas:
- Cliente A (id: "cus_123") ✅ Mantém
- Cliente B (id: "cus_456") ✅ Mantém  
- Cliente C (id: "cus_789") ❌ Remove (órfão)
- Cliente D (id: "cus_999") ❌ Remove (órfão)
```

---

## 🚀 **Fluxo de Trabalho Recomendado:**

### 🆕 **Para começar do zero:**
```bash
npm run setup:dev
```
- Reseta tudo
- Limpa Asaas automaticamente
- Atualiza webhook automaticamente

### 🔄 **Para reiniciar sem perder dados:**
```bash
npm run restart:dev
```
- Reinicia servidores
- Atualiza webhook automaticamente
- Mantém dados do banco

### 🧹 **Para limpar apenas o Asaas:**
```bash
npm run cleanup:asaas
```
- Limpa sandbox do Asaas
- Atualiza webhook
- Não mexe no servidor

---

## 🎉 **Benefícios:**

### ✅ **Automação Total:**
- Não precisa mais ir no Asaas manualmente
- Não precisa mais atualizar webhook manualmente
- Não precisa mais deletar clientes/cobranças manualmente

### ✅ **Segurança:**
- Só remove dados órfãos
- Preserva dados que existem no banco
- Sincronização inteligente

### ✅ **Produtividade:**
- Um comando resolve tudo
- Menos trabalho manual
- Mais tempo para desenvolver

---

## 🔧 **Configuração:**

### 📋 **Variáveis de Ambiente Necessárias:**
```env
ASAAS_API_KEY=your_api_key_here
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
```

### 📋 **Dependências:**
- `axios` - Para requisições HTTP
- `@prisma/client` - Para acesso ao banco (gerado automaticamente)
- `ts-node` - Para executar TypeScript diretamente
- `ngrok` - Para túneis (já instalado)

### 🔧 **Configuração TypeScript:**
- **✅ `scripts/tsconfig.json`** - Configuração específica para os scripts
- **✅ CommonJS** - Usa sintaxe CommonJS para compatibilidade
- **✅ Tipagem Completa** - Interfaces TypeScript para todas as APIs

---

## 🎯 **Resumo:**

**Antes:** 😤
- Resetar banco manualmente
- Ir no Asaas manualmente
- Deletar clientes manualmente
- Deletar cobranças manualmente
- Atualizar webhook manualmente

**Agora:** 🎉
- `npm run setup:dev` → Tudo automático!
- `npm run restart:dev` → Reinicia sem perder dados!
- `npm run cleanup:asaas` → Limpa só o Asaas!

**Muito mais produtivo e menos trabalho manual!** 🚀
