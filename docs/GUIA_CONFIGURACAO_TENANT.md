# 🚀 Guia de Configuração - Novo Tenant

**Para:** Administradores do Magic Lawyer  
**Objetivo:** Configurar um novo tenant para receber pagamentos via Asaas

---

## ⚡ **Configuração Rápida (5 minutos)**

### **1. Criar Conta Asaas** ⏱️ 2 min
1. Acesse [https://www.asaas.com](https://www.asaas.com)
2. Clique em **"Criar Conta"**
3. Selecione **"Conta Empresarial"**
4. Preencha os dados da empresa
5. **Aguarde a verificação** (pode levar algumas horas)

### **2. Obter Credenciais** ⏱️ 1 min
1. Faça login no painel Asaas
2. Vá em **Configurações** → **Integrações**
3. Copie sua **API Key** (começa com `$aact_`)
4. Copie seu **Account ID**

### **3. Configurar no Magic Lawyer** ⏱️ 2 min
1. Faça login como **ADMIN** no Magic Lawyer
2. Acesse **Configurações** → **Asaas**
3. Preencha:
   - **API Key**: Cole a chave copiada
   - **Account ID**: Cole o ID copiado
   - **Ambiente**: Selecione **Sandbox** (para testes)
4. Clique em **"Testar Conexão"**
5. Se aparecer ✅ **"Conexão estabelecida"**, clique em **"Configurar"**

---

## 🔧 **Configuração de Webhooks**

### **No Painel Asaas:**
1. Vá em **Configurações** → **Webhooks**
2. Clique em **"Adicionar Webhook"**
3. Preencha:
   - **URL**: `https://seudominio.com/api/webhooks/asaas`
   - **Eventos**: Selecione todos os eventos de pagamento
4. Clique em **"Salvar"**

---

## 🧪 **Teste da Configuração**

### **1. Teste de PIX**
1. Acesse **Financeiro** → **Parcelas**
2. Clique em **"Pagar"** em uma parcela
3. Selecione **"PIX"**
4. Clique em **"Gerar Cobrança"**
5. ✅ **Sucesso**: QR Code deve aparecer

### **2. Teste de Boleto**
1. Repita o processo acima
2. Selecione **"Boleto Bancário"**
3. ✅ **Sucesso**: Código de barras deve aparecer

### **3. Teste de Webhook**
1. Faça um pagamento de teste
2. Verifique se o status da parcela mudou automaticamente
3. ✅ **Sucesso**: Parcela deve ficar como "Paga"

---

## 🚨 **Problemas Comuns**

### **❌ "Falha na conexão com Asaas"**
**Causa:** API Key incorreta ou conta não verificada  
**Solução:** 
1. Verifique se a API Key está correta
2. Aguarde a verificação da conta Asaas
3. Teste novamente

### **❌ "Webhook não funciona"**
**Causa:** URL incorreta ou eventos não configurados  
**Solução:**
1. Verifique se a URL está correta
2. Confirme se todos os eventos estão selecionados
3. Teste o webhook manualmente

### **❌ "Pagamento não confirma"**
**Causa:** Webhook não processado  
**Solução:**
1. Verifique os logs do sistema
2. Reprocesse o pagamento manualmente
3. Entre em contato com o suporte

---

## 📞 **Suporte**

### **Contato Técnico:**
- **Email**: suporte@magiclawyer.com
- **WhatsApp**: (11) 99999-9999
- **Horário**: Segunda a Sexta, 9h às 18h

### **Documentação Completa:**
- [Módulo Financeiro Asaas](./MODULO_FINANCEIRO_ASAAS.md)
- [Configuração de Ambiente](./ENV_SETUP.md)

---

## ✅ **Checklist Final**

- [ ] Conta Asaas criada e verificada
- [ ] API Key e Account ID obtidos
- [ ] Configuração salva no Magic Lawyer
- [ ] Teste de conexão realizado com sucesso
- [ ] Webhooks configurados
- [ ] PIX testado e funcionando
- [ ] Boleto testado e funcionando
- [ ] Webhook testado e funcionando
- [ ] Dashboard financeiro exibindo dados
- [ ] Tenant pronto para produção

---

**🎉 Configuração Concluída!**  
O tenant está pronto para receber pagamentos dos seus clientes.

**Próximo passo:** Alterar ambiente para **Produção** quando estiver pronto para receber pagamentos reais.
