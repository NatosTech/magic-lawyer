# 📁 Estrutura de Pastas no Cloudinary

## 🎯 **Organização Hierárquica Implementada**

### 📂 **Estrutura de Pastas**

```
magiclawyer/
├── sandra/                    # Tenant: Sandra Advocacia
│   ├── cmgec3pvm001dyr7n4ru8cbuj/    # User ID: Sandra
│   │   ├── avatar_1703123456789.jpg
│   │   └── avatar_1703123456790.jpg
│   └── cmgec3pvm001dyr7n4ru8cbuj/    # User ID: Advogado 1
│       └── avatar_1703123456788.jpg
├── salba/                     # Tenant: Salba Advocacia
│   ├── cmgec3pvm001dyr7n4ru8cbuj/    # User ID: Salba
│   │   └── avatar_1703123456787.jpg
│   └── cmgec3pvm001dyr7n4ru8cbuj/    # User ID: Advogado 2
│       └── avatar_1703123456786.jpg
└── avatars/                   # Fallback para usuários sem tenant
    └── cmgec3pvm001dyr7n4ru8cbuj/    # User ID genérico
        └── avatar_1703123456785.jpg
```

### 🏗️ **Padrão de Organização**

**Formato:** `magiclawyer/{tenantSlug}/{userId}/avatar_{timestamp}.jpg`

**Exemplos:**
- `magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/avatar_1703123456789.jpg`
- `magiclawyer/salba/cmgec3pvm001dyr7n4ru8cbuj/avatar_1703123456788.jpg`

## 🔧 **Implementação Técnica**

### **1. Upload Service Atualizado**

```typescript
// Estrutura de pastas hierárquica
const folderPath = tenantSlug 
  ? `magiclawyer/${tenantSlug}/${userId}`
  : `magiclawyer/avatars/${userId}`;

// Upload para Cloudinary
const result = await cloudinary.uploader.upload(
  imageData,
  {
    folder: folderPath,
    public_id: `avatar_${Date.now()}`,
    resource_type: 'image'
  }
);
```

### **2. Server Action Atualizada**

```typescript
// Passar tenantSlug para o serviço de upload
const result = await uploadService.uploadAvatar(
  buffer, 
  session.user.id, 
  file.name, 
  session.user.tenantSlug  // ← Novo parâmetro
);
```

### **3. Deletion Inteligente**

```typescript
// Extrair public_id completo da URL
const publicIdParts = urlParts.slice(uploadIndex + 2);
const publicId = publicIdParts.join('/').split('.')[0];

// Deletar com caminho completo
await cloudinary.uploader.destroy(publicId);
```

## 🎯 **Vantagens da Organização**

### **✅ Benefícios:**

1. **Organização Clara**: Cada tenant tem sua própria pasta
2. **Isolamento**: Usuários de diferentes tenants não se misturam
3. **Escalabilidade**: Fácil de gerenciar milhares de usuários
4. **Backup Seletivo**: Possível fazer backup por tenant
5. **Análise de Uso**: Fácil verificar uso por tenant
6. **Segurança**: Isolamento entre diferentes escritórios

### **📊 Estrutura de Dados:**

```typescript
interface CloudinaryStructure {
  magiclawyer: {
    [tenantSlug: string]: {
      [userId: string]: {
        avatar_timestamp: string;
        // Outros arquivos do usuário
      }
    }
  }
}
```

## 🚀 **Como Funciona**

### **Fluxo de Upload:**

1. **Usuário faz upload** → Server Action recebe arquivo
2. **Identifica tenant** → `session.user.tenantSlug`
3. **Cria pasta** → `magiclawyer/{tenantSlug}/{userId}`
4. **Upload para Cloudinary** → Com estrutura hierárquica
5. **Retorna URL** → Com caminho organizado

### **Fluxo de Deletion:**

1. **Usuário deleta avatar** → Server Action recebe URL
2. **Extrai public_id** → Com caminho completo
3. **Deleta do Cloudinary** → Usando public_id completo
4. **Confirma exclusão** → Retorna sucesso

## 📱 **Exemplos Práticos**

### **Upload de Avatar:**

```typescript
// Usuário: Sandra (sandra@adv.br)
// Tenant: sandra
// User ID: cmgec3pvm001dyr7n4ru8cbuj

// Resultado no Cloudinary:
// Pasta: magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/
// Arquivo: avatar_1703123456789.jpg
// URL: https://res.cloudinary.com/.../magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/avatar_1703123456789.jpg
```

### **Deletion de Avatar:**

```typescript
// URL: https://res.cloudinary.com/.../magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/avatar_1703123456789.jpg
// Public ID: magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/avatar_1703123456789
// Deletion: cloudinary.uploader.destroy(publicId)
```

## 🔒 **Segurança**

### **Validações Implementadas:**

- ✅ **Verificação de Tenant**: Apenas usuários do tenant correto
- ✅ **Verificação de User ID**: Apenas o próprio usuário
- ✅ **Validação de URL**: URLs malformadas são rejeitadas
- ✅ **Isolamento**: Usuários não podem acessar arquivos de outros tenants

### **Controle de Acesso:**

```typescript
// Verificar se o arquivo pertence ao usuário
if (!filePath.includes(userId)) {
  return {
    success: false,
    error: 'Não autorizado para deletar este arquivo'
  };
}
```

## 📈 **Monitoramento**

### **Métricas Disponíveis:**

- **Uso por Tenant**: Quantos arquivos cada tenant tem
- **Uso por Usuário**: Quantos arquivos cada usuário tem
- **Tamanho Total**: Espaço usado por tenant
- **Frequência de Upload**: Quantos uploads por dia/mês

### **Dashboard Cloudinary:**

```
magiclawyer/
├── sandra/ (2.3MB, 15 arquivos)
├── salba/ (1.8MB, 12 arquivos)
└── avatars/ (0.5MB, 3 arquivos)
```

---

**🎉 Agora o Cloudinary está perfeitamente organizado com estrutura hierárquica por tenant e usuário!**
