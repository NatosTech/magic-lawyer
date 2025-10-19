# 💰 Módulo Financeiro Asaas - Magic Lawyer

**Última Atualização:** 17/01/2025  
**Versão:** 1.0.0  
**Status:** ✅ **PRODUÇÃO**

---

## 📋 **Visão Geral**

O Módulo Financeiro Asaas é um sistema completo de pagamentos que permite:

- **Magic Lawyer** receber assinaturas recorrentes dos tenants
- **Tenants** receberem pagamentos dos seus clientes via PIX, Boleto e Cartão
- **Conciliação automática** de pagamentos via webhooks
- **Multi-tenant** com isolamento total de dados

---

## 🏗️ **Arquitetura do Sistema**

### **Fluxo de Recebimento (Magic Lawyer → Tenants)**
```
Tenant → Página /precos → Checkout Asaas → Assinatura Recorrente → Magic Lawyer recebe
```

### **Fluxo de Cobrança (Tenants → Clientes)**
```
Tenant → Configura Asaas → Gera Cobrança → Cliente paga → Tenant recebe
```

---

## 🔧 **Configuração para Novos Tenants**

### **1. Configuração Inicial do Tenant**

#### **Passo 1: Criar Conta Asaas**
1. Acesse [https://www.asaas.com](https://www.asaas.com)
2. Crie uma conta empresarial
3. Complete a verificação de documentos
4. Ative a conta para receber pagamentos

#### **Passo 2: Obter Credenciais**
1. Acesse o painel do Asaas
2. Vá em **Configurações** → **Integrações**
3. Copie sua **API Key** (começa com `$aact_`)
4. Copie seu **Account ID**

#### **Passo 3: Configurar no Magic Lawyer**
1. Faça login como **ADMIN** no Magic Lawyer
2. Acesse **Configurações** → **Asaas**
3. Preencha os dados:
   - **API Key**: Sua chave do Asaas
   - **Account ID**: ID da sua conta
   - **Ambiente**: Sandbox (teste) ou Produção
4. Clique em **Testar Conexão**
5. Salve a configuração

### **2. Configuração de Webhooks**

#### **No Painel Asaas:**
1. Vá em **Configurações** → **Webhooks**
2. Adicione a URL: `https://seudominio.com/api/webhooks/asaas`
3. Selecione os eventos:
   - `PAYMENT_CREATED`
   - `PAYMENT_RECEIVED`
   - `PAYMENT_OVERDUE`
   - `SUBSCRIPTION_CREATED`
   - `SUBSCRIPTION_UPDATED`
   - `SUBSCRIPTION_DELETED`
4. Salve a configuração

---

## 💳 **Sistema de Cobrança**

### **Tipos de Pagamento Suportados**

#### **1. PIX Dinâmico**
- **Geração**: QR Code em tempo real
- **Vencimento**: Configurável por parcela
- **Confirmação**: Automática via webhook
- **Tempo**: Instantâneo

#### **2. Boleto Bancário**
- **Geração**: Código de barras real
- **Vencimento**: Configurável por parcela
- **Confirmação**: Automática via webhook
- **Tempo**: 1-3 dias úteis

#### **3. Cartão de Crédito**
- **Processamento**: Imediato
- **Confirmação**: Automática
- **Tempo**: Instantâneo

### **Como Gerar Cobrança**

#### **Via Interface:**
1. Acesse **Financeiro** → **Parcelas**
2. Clique em **Pagar** na parcela desejada
3. Selecione a forma de pagamento
4. Clique em **Gerar Cobrança**
5. Compartilhe com o cliente

#### **Via API (Desenvolvedores):**
```typescript
// PIX
const pix = await gerarPixDinamico({
  parcelaId: "parcela_id",
  valor: 1000.00,
  descricao: "Parcela 1 - Contrato XYZ",
  vencimento: new Date("2025-02-01")
});

// Boleto
const boleto = await gerarBoletoAsaas({
  parcelaId: "parcela_id",
  valor: 1000.00,
  descricao: "Parcela 1 - Contrato XYZ",
  vencimento: new Date("2025-02-01")
});

// Cartão
const cartao = await gerarCobrancaCartao({
  parcelaId: "parcela_id",
  valor: 1000.00,
  dadosCartao: {
    numero: "4111111111111111",
    nome: "João Silva",
    cvv: "123",
    mes: "12",
    ano: "2025"
  }
});
```

---

## 📊 **Sistema de Assinaturas**

### **Planos Disponíveis**

#### **Básico - R$ 99/mês**
- Até 3 usuários
- Até 50 processos
- 1GB de armazenamento
- Suporte por email

#### **Pro - R$ 299/mês**
- Até 10 usuários
- Até 200 processos
- 5GB de armazenamento
- Integração Asaas
- Suporte prioritário

#### **Enterprise - R$ 499/mês**
- Até 50 usuários
- Até 1000 processos
- 20GB de armazenamento
- API personalizada
- Suporte dedicado

### **Período de Teste**
- **14 dias grátis** para todos os planos
- Sem compromisso
- Cancele a qualquer momento

### **Como Assinar**

#### **Via Interface:**
1. Acesse `/precos`
2. Escolha o plano desejado
3. Clique em **Começar teste grátis**
4. Preencha os dados de faturamento
5. Selecione a forma de pagamento
6. Confirme a assinatura

---

## 🔄 **Webhooks e Conciliação**

### **Eventos Processados**

#### **Pagamentos:**
- `PAYMENT_CREATED` - Pagamento criado
- `PAYMENT_RECEIVED` - Pagamento confirmado
- `PAYMENT_OVERDUE` - Pagamento em atraso
- `PAYMENT_DELETED` - Pagamento cancelado

#### **Assinaturas:**
- `SUBSCRIPTION_CREATED` - Assinatura criada
- `SUBSCRIPTION_UPDATED` - Assinatura atualizada
- `SUBSCRIPTION_DELETED` - Assinatura cancelada

### **Conciliação Automática**

O sistema processa automaticamente:

1. **Recebimento de pagamento** → Atualiza status da parcela
2. **Confirmação de assinatura** → Ativa plano do tenant
3. **Inadimplência** → Marca como em atraso
4. **Cancelamento** → Desativa funcionalidades

---

## 🛡️ **Segurança e Criptografia**

### **Proteção de Dados**
- **API Keys criptografadas** no banco de dados
- **Chave de criptografia** única por instalação
- **Isolamento total** entre tenants
- **Logs de auditoria** para todas as operações

### **Validação de Webhooks**
- **Assinatura HMAC-SHA256** obrigatória
- **Validação de origem** do Asaas
- **Rate limiting** para prevenir ataques

---

## 📈 **Relatórios e Analytics**

### **Dashboard Financeiro**
- **Métricas em tempo real** de recebimentos
- **Gráficos de evolução** de parcelas
- **Honorários por advogado** com controle de privacidade
- **Filtros avançados** por período, cliente, advogado

### **Controle de Acesso**
- **ADMIN**: Acesso total aos dados financeiros
- **ADVOGADO**: Vê apenas seus honorários e parcelas
- **SECRETARIA**: Acesso limitado a dados públicos
- **FINANCEIRO**: Acesso a dados financeiros com restrições
- **CLIENTE**: Vê apenas suas próprias parcelas

---

## 🔧 **Configuração Técnica**

### **Variáveis de Ambiente**

```env
# Asaas - Conta Principal (Magic Lawyer)
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmQ0YjE4Y2FiLWE3OWQtNDEzOC04OTJlLTQ1ZDE5MzA4MWJjYzo6JGFhY2hfMjk3NDk0OWMtZjJkZS00ODlhLWJlYjMtNTg5ODViYjJkYWM4
ASAAS_ENVIRONMENT=sandbox
ASAAS_WEBHOOK_SECRET=your_webhook_secret_here

# Criptografia
ENCRYPTION_KEY=your_encryption_key_for_tenant_credentials
```

### **Dependências**

```json
{
  "asaas": "^1.0.0",
  "crypto-js": "^4.1.1",
  "qrcode": "^1.5.3"
}
```

---

## 🚨 **Troubleshooting**

### **Problemas Comuns**

#### **1. Erro de Conexão Asaas**
- **Causa**: API Key inválida ou ambiente incorreto
- **Solução**: Verificar credenciais e testar conexão

#### **2. Webhook não funciona**
- **Causa**: URL incorreta ou eventos não configurados
- **Solução**: Verificar configuração no painel Asaas

#### **3. Pagamento não confirma**
- **Causa**: Webhook não processado ou erro na conciliação
- **Solução**: Consultar status manualmente e reprocessar

#### **4. Criptografia falha**
- **Causa**: Chave de criptografia incorreta
- **Solução**: Verificar variável `ENCRYPTION_KEY`

### **Logs e Monitoramento**

#### **Logs do Sistema:**
- **Webhooks**: `/api/webhooks/asaas`
- **Cobranças**: `app/actions/cobranca-asaas.ts`
- **Assinaturas**: `app/actions/asaas.ts`

#### **Monitoramento:**
- **Status de pagamentos** em tempo real
- **Logs de erro** com stack trace
- **Métricas de performance** das APIs

---

## 📞 **Suporte**

### **Documentação Oficial**
- [Asaas API](https://docs.asaas.com/)
- [Webhooks Asaas](https://docs.asaas.com/webhooks)

### **Contato Técnico**
- **Email**: suporte@magiclawyer.com
- **Discord**: [Link do servidor]
- **Documentação**: [Link da documentação]

---

## 🎯 **Próximas Funcionalidades**

### **Em Desenvolvimento:**
- [ ] **PIX Copia e Cola** - Chave PIX para transferência manual
- [ ] **Cartão de Débito** - Integração com débito automático
- [ ] **Split de Pagamento** - Divisão automática entre advogados
- [ ] **Relatórios Avançados** - Exportação em PDF/Excel
- [ ] **Notificações Push** - Alertas em tempo real

### **Planejado:**
- [ ] **Integração WhatsApp** - Envio automático de cobranças
- [ ] **Assinatura Digital** - Contratos assinados digitalmente
- [ ] **API Pública** - Integração com sistemas externos
- [ ] **Multi-moeda** - Suporte a outras moedas

---

## ✅ **Checklist de Implementação**

### **Para Novos Tenants:**

#### **Configuração Inicial:**
- [ ] Conta Asaas criada e verificada
- [ ] API Key e Account ID obtidos
- [ ] Configuração salva no Magic Lawyer
- [ ] Teste de conexão realizado
- [ ] Webhooks configurados
- [ ] Primeira cobrança testada

#### **Validação:**
- [ ] PIX gerado com sucesso
- [ ] Boleto gerado com sucesso
- [ ] Cartão processado com sucesso
- [ ] Webhook recebido e processado
- [ ] Conciliação automática funcionando
- [ ] Dashboard financeiro exibindo dados

#### **Produção:**
- [ ] Ambiente alterado para produção
- [ ] Webhooks apontando para produção
- [ ] Testes finais realizados
- [ ] Monitoramento ativo
- [ ] Suporte configurado

---

**🎉 Sistema Financeiro Asaas - Magic Lawyer**  
**Versão 1.0.0 - Janeiro 2025**
