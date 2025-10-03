# Configuração de Variáveis de Ambiente

Este arquivo contém as variáveis de ambiente necessárias para o funcionamento completo do sistema Magic Lawyer.

## Variáveis Obrigatórias

### Database
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/magic_lawyer?schema=public"
```

### NextAuth
```env
NEXTAUTH_URL="http://localhost:9192"
NEXTAUTH_SECRET="your-secret-key-here"
```

## Variáveis para Novas Funcionalidades

### Email (Nodemailer)
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"
```

**Configuração do Gmail:**
1. Ative a verificação em 2 etapas na sua conta Google
2. Gere uma senha de app específica para aplicações
3. Use essa senha no campo `SMTP_PASS`

### Google Calendar Integration
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:9192/api/auth/google/callback"
```

**Configuração do Google Calendar:**
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google Calendar
4. Crie credenciais OAuth 2.0
5. Adicione `http://localhost:9192/api/auth/google/callback` como URI de redirecionamento

### ClickSign Integration
```env
CLICKSIGN_API_BASE="https://sandbox.clicksign.com/api/v1"
CLICKSIGN_ACCESS_TOKEN="your-clicksign-access-token"
```

**Configuração do ClickSign:**
1. Crie uma conta no [ClickSign](https://clicksign.com/)
2. Acesse o painel de desenvolvedor
3. Gere um token de acesso
4. Para produção, altere `CLICKSIGN_API_BASE` para `https://app.clicksign.com/api/v1`

## Exemplo de Arquivo .env Completo

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/magic_lawyer?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:9192"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Google Calendar Integration
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:9192/api/auth/google/callback"

# ClickSign Integration
CLICKSIGN_API_BASE="https://sandbox.clicksign.com/api/v1"
CLICKSIGN_ACCESS_TOKEN="your-clicksign-access-token"
```

## Verificação da Configuração

Após configurar as variáveis, você pode verificar se estão funcionando:

1. **Email**: O sistema tentará verificar a conexão SMTP na inicialização
2. **Google Calendar**: Teste a autenticação na página de agenda
3. **ClickSign**: Teste o envio de um documento para assinatura

## Troubleshooting

### Problemas com Email
- Verifique se a senha de app está correta
- Confirme se a verificação em 2 etapas está ativa
- Teste com outros provedores SMTP se necessário

### Problemas com Google Calendar
- Verifique se a API está ativada no Google Cloud Console
- Confirme se as credenciais OAuth estão corretas
- Verifique se o URI de redirecionamento está configurado

### Problemas com ClickSign
- Confirme se o token de acesso é válido
- Verifique se está usando a URL correta (sandbox vs produção)
- Teste a conectividade com a API do ClickSign
