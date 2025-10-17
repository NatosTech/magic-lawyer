# Configuração de Notificações - WhatsApp e Email

Este documento explica como configurar as integrações de WhatsApp e Email para o sistema de notificações de andamentos.

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env`:

### WhatsApp Integration

#### Whapi.Cloud (Recomendado para desenvolvimento)
```env
# Plano gratuito: 5 conversas/mês, 150 mensagens/dia, 1000 API calls/mês
WHAPI_CLOUD_API_KEY="your-whapi-cloud-api-key"
WHAPI_CLOUD_BASE_URL="https://gate.whapi.cloud"
```

#### Maytapi (Para produção)
```env
# Plano: $24/mês por número, mensagens ilimitadas
MAYTAPI_API_KEY="your-maytapi-api-key"
MAYTAPI_BASE_URL="https://api.maytapi.com/api"
MAYTAPI_INSTANCE_ID="your-instance-id"
```

### Email Integration

#### Resend (Recomendado)
```env
# Plano gratuito: 3.000 emails/mês, 100 emails/dia
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

#### SendGrid (Alternativa)
```env
# Plano gratuito: 100 emails/dia
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
```

#### SMTP (Para provedores próprios)
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM_EMAIL="noreply@yourdomain.com"
```

## Como Configurar

### 1. WhatsApp - Whapi.Cloud

1. Acesse [whapi.cloud](https://whapi.cloud)
2. Crie uma conta gratuita
3. Obtenha sua API Key no dashboard
4. Adicione a variável `WHAPI_CLOUD_API_KEY` ao `.env.local`

### 2. WhatsApp - Maytapi

1. Acesse [maytapi.com](https://maytapi.com)
2. Crie uma conta e configure um número
3. Obtenha sua API Key e Instance ID
4. Adicione as variáveis ao `.env.local`

### 3. Email - Resend

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Verifique seu domínio (ou use o domínio de teste)
4. Obtenha sua API Key
5. Adicione a variável `RESEND_API_KEY` ao `.env.local`

### 4. Email - SendGrid

1. Acesse [sendgrid.com](https://sendgrid.com)
2. Crie uma conta gratuita
3. Crie uma API Key
4. Adicione a variável `SENDGRID_API_KEY` ao `.env.local`

## Testando as Integrações

### Teste de WhatsApp

1. Acesse a página de andamentos
2. Crie um novo andamento
3. Marque "Notificar cliente" e "Enviar notificação por WhatsApp"
4. Use um número de teste (seu número ou o número fornecido)

### Teste de Email

1. Acesse a página de andamentos
2. Crie um novo andamento
3. Marque "Notificar cliente" e "Enviar notificação por email"
4. Use um email de teste

## Funcionalidades Implementadas

### ✅ Estrutura Completa

- [x] Schema do banco atualizado com campos de notificação
- [x] Bibliotecas de integração (WhatsApp e Email)
- [x] Server Actions para envio de notificações
- [x] Interface atualizada com campos de notificação
- [x] Suporte a múltiplos provedores
- [x] Isolamento por tenant
- [x] Validação de dados
- [x] Tratamento de erros

### ✅ Provedores Suportados

**WhatsApp:**
- Whapi.Cloud (gratuito)
- Maytapi (pago)
- Mock (desenvolvimento)

**Email:**
- Resend (gratuito)
- SendGrid (gratuito)
- SMTP (configurável)
- Mock (desenvolvimento)

### ✅ Recursos

- Envio individual de notificações
- Envio em lote
- Mensagens personalizadas
- Templates de email responsivos
- Formatação automática de números de telefone
- Estatísticas de notificações
- Teste de integrações

## Próximos Passos

1. **Configurar as variáveis de ambiente** conforme este documento
2. **Testar as integrações** usando os números/emails fornecidos
3. **Configurar domínios** para produção (email)
4. **Monitorar uso** dos planos gratuitos
5. **Implementar logs** de notificações (opcional)

## Troubleshooting

### WhatsApp não funciona
- Verifique se a API Key está correta
- Confirme se o número está no formato correto (55XXXXXXXXXXX)
- Teste com o provedor Mock primeiro

### Email não funciona
- Verifique se a API Key está correta
- Confirme se o domínio está verificado (Resend/SendGrid)
- Teste com o provedor Mock primeiro

### Erro de tenant
- Verifique se o usuário está logado
- Confirme se o tenantId está sendo passado corretamente

## Suporte

Para dúvidas sobre a implementação, consulte:
- Documentação das APIs dos provedores
- Logs do sistema
- Testes com provedores Mock
