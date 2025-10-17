# Configuração do Google Calendar Integration

## 🚨 **Erro Atual: "Missing required parameter: client_id"**

O erro que você está vendo indica que as variáveis de ambiente do Google Calendar não estão configuradas. Siga os passos abaixo para resolver:

## 📋 **Passo 1: Criar Credenciais do Google**

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para **APIs & Services** > **Credentials**
4. Clique em **+ CREATE CREDENTIALS** > **OAuth 2.0 Client IDs**
5. Configure:
   - **Application type**: Web application
   - **Name**: Magic Lawyer Calendar
   - **Authorized JavaScript origins**:
     - `http://localhost:9192` (desenvolvimento)
     - `https://magiclawyer.vercel.app` (produção)
   - **Authorized redirect URIs**:
     - `http://localhost:9192/api/google-calendar/callback` (desenvolvimento)
     - `https://magiclawyer.vercel.app/api/google-calendar/callback` (produção)

> **💡 Modo Desenvolvimento Simplificado**: Em desenvolvimento local, todos os tenants usam `localhost:9192` para OAuth, evitando problemas com subdomínios `.localhost` que o Google não aceita.

**✅ Solução Inteligente**: O sistema detecta automaticamente o domínio atual e redireciona corretamente para cada subdomínio (sandra.magiclawyer.vercel.app, joao.magiclawyer.vercel.app, etc.) sem precisar configurar cada um individualmente no Google Cloud Console.

6. Ative a **Google Calendar API**:
   - Vá para **APIs & Services** > **Library**
   - Procure por "Google Calendar API"
   - Clique em **Enable**

## 📋 **Passo 2: Configurar Variáveis de Ambiente**

Crie um arquivo `.env.local` na raiz do projeto com:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:9192/api/google-calendar/callback

# Database (se não estiver configurado)
DATABASE_URL=postgresql://postgres:password@localhost:8567/magic_lawyer?schema=magiclawyer

# NextAuth (se não estiver configurado)
NEXTAUTH_URL=http://localhost:9192
NEXTAUTH_SECRET=sua_chave_secreta_aqui
```

## 📋 **Passo 3: Reiniciar o Servidor**

Após configurar as variáveis de ambiente:

```bash
# Parar o servidor (Ctrl+C)
# Reiniciar
npm run dev
```

## 🎯 **Como Usar**

1. Acesse a página de **Agenda**
2. Você verá o card **"Google Calendar"**
3. Clique em **"Conectar com Google Calendar"**
4. Autorize o acesso na página do Google
5. Pronto! A sincronização estará ativa

## 🔧 **Funcionalidades Disponíveis**

- ✅ **Sincronização Automática**: Eventos criados/alterados são automaticamente sincronizados
- ✅ **Importação**: Importar eventos existentes do Google Calendar
- ✅ **Sincronização Manual**: Botão para sincronizar todos os eventos pendentes
- ✅ **Controle**: Ligar/desligar sincronização automática
- ✅ **Desconexão**: Remover integração quando necessário

## 🚨 **Troubleshooting**

### Erro "invalid_request" ou "Missing client_id"
- Verifique se as variáveis de ambiente estão configuradas corretamente
- Reinicie o servidor após configurar as variáveis
- Verifique se o `GOOGLE_CLIENT_ID` está correto

### Erro "redirect_uri_mismatch"
- Verifique se a URL de callback está configurada corretamente no Google Cloud Console
- Certifique-se que está usando a mesma URL em desenvolvimento e produção

### Erro "access_denied"
- O usuário cancelou a autorização
- Verifique se a Google Calendar API está habilitada no projeto

## 🏢 **Configuração para Múltiplos Tenants (Subdomínios)**

Para o Magic Lawyer com múltiplos tenants como `sandra.magiclawyer.vercel.app`, implementamos uma **solução inteligente**:

### ✅ **Solução Automática (Implementada)**
- ✅ **Apenas 2 URLs configuradas**: Domínio principal + localhost
- ✅ **Detecção automática**: Sistema detecta o subdomínio atual
- ✅ **Redirecionamento inteligente**: OAuth usa domínio principal, callback redireciona para o subdomínio correto
- ✅ **Funciona para todos**: Qualquer subdomínio novo funciona automaticamente

### 🔧 **Variáveis de Ambiente para Produção**
```env
# Para produção no Vercel
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=https://magiclawyer.vercel.app/api/google-calendar/callback

# O sistema detecta automaticamente o subdomínio atual
VERCEL_URL=magiclawyer.vercel.app
NEXTAUTH_URL=https://magiclawyer.vercel.app
```

### 📝 **Como Funciona (Fluxo Automático)**
1. **Usuário em `sandra.magiclawyer.vercel.app`** clica em "Conectar"
2. **Sistema detecta** o domínio atual automaticamente
3. **OAuth redireciona** para `magiclawyer.vercel.app/api/google-calendar/callback` (domínio autorizado)
4. **Callback processa** a autorização e redireciona de volta para `sandra.magiclawyer.vercel.app/agenda`
5. **Sincronização funciona** perfeitamente para o usuário no subdomínio correto

### 🎯 **Vantagens**
- ✅ **Zero configuração adicional** para novos subdomínios
- ✅ **Uma única configuração** no Google Cloud Console
- ✅ **Funciona automaticamente** para todos os tenants
- ✅ **Isolamento total** entre tenants
- ✅ **Escalabilidade infinita** para novos subdomínios

## 📚 **Recursos Adicionais**

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Nota**: Substitua `seu_client_id_aqui` e `seu_client_secret_aqui` pelos valores reais obtidos no Google Cloud Console.
