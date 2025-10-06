# 🚀 Configuração do Cloudinary

## 📋 Passo a Passo para Configurar

### 1. Criar Conta no Cloudinary
1. Acesse: https://cloudinary.com
2. Clique em "Sign Up For Free"
3. Preencha os dados (nome, email, senha)
4. Confirme o email
5. **IMPORTANTE**: Escolha o plano **FREE** (25GB grátis)

### 2. Pegar as Credenciais
Após criar a conta, você verá o **Dashboard** com:
- **Cloud Name**: Nome da sua nuvem (ex: `dme8hxq2p`)
- **API Key**: Chave da API (ex: `123456789012345`)
- **API Secret**: Segredo da API (ex: `abcdefghijklmnopqrstuvwxyz`)

### 3. Configurar Variáveis de Ambiente

Adicione no seu arquivo `.env`:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=seu-cloud-name-aqui
CLOUDINARY_API_KEY=sua-api-key-aqui
CLOUDINARY_API_SECRET=seu-api-secret-aqui
```

### 4. Testar o Upload

1. Faça login no sistema
2. Vá para `/usuario/perfil/editar`
3. Clique no avatar para fazer upload
4. Selecione uma imagem (JPG, PNG, WebP)
5. A imagem será enviada para o Cloudinary automaticamente!

## 🎯 Vantagens do Cloudinary

- ✅ **25GB grátis** por mês
- ✅ **Otimização automática** de imagens
- ✅ **CDN global** para carregamento rápido
- ✅ **Transformações em tempo real**
- ✅ **Interface amigável**
- ✅ **Sem configuração complexa**

## 🔧 Como Funciona

1. **Upload**: Imagem é enviada para o Cloudinary
2. **Otimização**: Automática (tamanho, qualidade, formato)
3. **Armazenamento**: URL é salva no banco de dados
4. **Exibição**: Imagem é carregada via CDN do Cloudinary

## 📊 Monitoramento

No dashboard do Cloudinary você pode ver:
- Uso de armazenamento
- Bandwidth consumido
- Número de transformações
- Estatísticas de uso

## 🚨 Limites do Plano Gratuito

- **Armazenamento**: 25GB
- **Bandwidth**: 25GB/mês
- **Transformações**: 25.000/mês
- **Uploads**: 500/mês

*Para um pequeno escritório, isso é mais que suficiente!*

## 🆘 Suporte

Se tiver problemas:
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme se a conta está ativa
3. Verifique os logs no console do navegador
4. Consulte a documentação: https://cloudinary.com/documentation
