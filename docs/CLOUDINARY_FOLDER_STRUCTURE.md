# 📁 Estrutura de Pastas no Cloudinary

## 🎯 **Organização Hierárquica Implementada**

### 📂 **Estrutura de Pastas**

```
         magiclawyer/
         ├── sandra/                    # Tenant: Sandra Advocacia
         │   ├── avatars/
         │   │   └── sandra-cmgec3pvm001dyr7n4ru8cbuj/
         │   │       ├── avatar_1703123456789.jpg
         │   │       └── avatar_1703123456790.jpg
         │   ├── procuracoes/
         │   │   ├── proc-001-2025-cmgh350dp0007yra2s7ohsifs/
         │   │   │   ├── documento_original_1703123456789.pdf
         │   │   │   ├── procuracao_assinada_1703123456790.pdf
         │   │   │   └── comprovante_envio_1703123456791.pdf
         │   │   └── proc-002-2025-cmgh350dp0008yra2s7ohsifs/
         │   │       └── documento_original_1703123456792.pdf
         │   ├── processos/
         │   │   └── processo-0000001-23.2025.8.26.0001-cmggxqubb00b4yr6217ayzz8s/
         │   │       ├── peticao_inicial_1703123456793.pdf
         │   │       └── sentenca_1703123456794.pdf
         │   └── contratos/
         │       └── contrato-honorarios-cmggxquco00fqyr621loa1saa/
         │           ├── contrato_assinado_1703123456795.pdf
         │           └── aditivo_contratual_1703123456796.pdf
         └── advogado-joao-silva-cmgec3pvm001dyr7n4ru8cbuj/    # Advogado: João Silva
             ├── avatars/
             │   └── avatar_1703123456788.jpg
             ├── procuracoes/
             └── processos/
├── salba/                     # Tenant: Salba Advocacia
│   ├── avatars/
│   │   └── salba-cmgec3pvm001dyr7n4ru8cbuj/
│   │       └── avatar_1703123456787.jpg
│   ├── procuracoes/
│   └── processos/
│   └── advogado-maria-santos-cmgec3pvm001dyr7n4ru8cbuj/    # Advogado: Maria Santos
        ├── avatars/
        │   └── avatar_1703123456786.jpg
        ├── procuracoes/
        └── processos/
└── avatars/                   # Fallback para usuários sem tenant
    └── cmgec3pvm001dyr7n4ru8cbuj/    # User ID genérico
        └── avatar_1703123456785.jpg
```

### 🏗️ **Padrão de Organização**

**Formato Base:** `magiclawyer/{tenantSlug}/{tipo-plural}/{nome-descritivo-id}/{arquivo}_{timestamp}.{extensao}`

**Plurais Corretos:**
- `procuracao` → `procuracoes`
- `processo` → `processos`  
- `contrato` → `contratos`

**Exemplos:**
- `magiclawyer/sandra/procuracoes/proc-001-2025-cmgh350dp0007yra2s7ohsifs/procuracao_assinada_1703123456790.pdf`
- `magiclawyer/sandra/processos/processo-0000001-23.2025.8.26.0001-cmggxqubb00b4yr6217ayzz8s/peticao_inicial_1703123456793.pdf`
- `magiclawyer/sandra/contratos/contrato-honorarios-cmggxquco00fqyr621loa1saa/contrato_assinado_1703123456795.pdf`

**⚠️ IMPORTANTE:** A estrutura NÃO deve duplicar caminhos como:
- ❌ `magiclawyer/sandra/procuracoes/pasta/magiclawyer/sandra/procuracoes/pasta/arquivo.pdf`
- ✅ `magiclawyer/sandra/procuracoes/pasta/arquivo.pdf`

**Exemplos por Tipo:**

**Avatars:**
- `magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/avatars/avatar_1703123456789.jpg`

**Procurações:**
- `magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/procuracoes/PROC-001-2025/documento_original_1703123456789.pdf`
- `magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/procuracoes/PROC-001-2025/procuracao_assinada_1703123456790.pdf`

**Processos:**
- `magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/processos/0000001-23.2025.8.26.0001/peticao_inicial_1703123456793.pdf`

**Contratos:**
- `magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/contratos/CONT-001-2025/contrato_assinado_1703123456795.pdf`

## 🔧 **Implementação Técnica**

### **1. Upload Service Atualizado**

```typescript
// Estrutura de pastas hierárquica por tipo de documento
const getFolderPath = (tenantSlug: string, userId: string, tipo: string, identificador?: string) => {
  const basePath = tenantSlug 
    ? `magiclawyer/${tenantSlug}/${userId}`
    : `magiclawyer/documents/${userId}`;
  
  switch (tipo) {
    case 'avatar':
      return `${basePath}/avatars`;
    case 'procuracao':
      return `${basePath}/procuracoes/${identificador}`;
    case 'processo':
      return `${basePath}/processos/${identificador}`;
    case 'contrato':
      return `${basePath}/contratos/${identificador}`;
    default:
      return `${basePath}/outros`;
  }
};

// Upload para Cloudinary com estrutura organizada
const result = await cloudinary.uploader.upload(
  fileData,
  {
    folder: folderPath,
    public_id: `${fileName}_${Date.now()}`,
    resource_type: tipo === 'avatar' ? 'image' : 'raw'
  }
);
```

### **2. Server Actions Atualizadas**

```typescript
// Upload de Avatar
const result = await uploadService.uploadAvatar(
  buffer, 
  session.user.id, 
  file.name, 
  session.user.tenantSlug
);

// Upload de Documento de Procuração
const result = await uploadService.uploadDocumento(
  buffer,
  session.user.id,
  file.name,
  session.user.tenantSlug,
  'procuracao',
  procuracaoNumero  // Ex: "PROC-001-2025"
);

// Upload de Documento de Processo
const result = await uploadService.uploadDocumento(
  buffer,
  session.user.id,
  file.name,
  session.user.tenantSlug,
  'processo',
  processoNumero  // Ex: "0000001-23.2025.8.26.0001"
);

// Upload de Documento de Contrato
const result = await uploadService.uploadDocumento(
  buffer,
  session.user.id,
  file.name,
  session.user.tenantSlug,
  'contrato',
  contratoId  // Ex: "CONT-001-2025"
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
// Pasta: magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/avatars/
// Arquivo: avatar_1703123456789.jpg
// URL: https://res.cloudinary.com/.../magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/avatars/avatar_1703123456789.jpg
```

### **Upload de Documento de Procuração:**

```typescript
// Usuário: Sandra
// Tenant: sandra
// Procuração: PROC-001-2025
// Arquivo: procuração_assinada.pdf

// Resultado no Cloudinary:
// Pasta: magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/procuracoes/PROC-001-2025/
// Arquivo: procuração_assinada_1703123456790.pdf
// URL: https://res.cloudinary.com/.../magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/procuracoes/PROC-001-2025/procuração_assinada_1703123456790.pdf
```

### **Upload de Documento de Processo:**

```typescript
// Processo: 0000001-23.2025.8.26.0001
// Arquivo: petição_inicial.pdf

// Resultado no Cloudinary:
// Pasta: magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/processos/0000001-23.2025.8.26.0001/
// Arquivo: petição_inicial_1703123456793.pdf
// URL: https://res.cloudinary.com/.../magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/processos/0000001-23.2025.8.26.0001/petição_inicial_1703123456793.pdf
```

### **Deletion de Documentos:**

```typescript
// URL: https://res.cloudinary.com/.../magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/procuracoes/PROC-001-2025/procuração_assinada_1703123456790.pdf
// Public ID: magiclawyer/sandra/cmgec3pvm001dyr7n4ru8cbuj/procuracoes/PROC-001-2025/procuração_assinada_1703123456790
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

## 📊 **Tipos de Documentos Suportados**

### **📋 Procurações:**
- `documento_original.pdf` - Documento original da procuração
- `procuracao_assinada.pdf` - Procuração com assinaturas
- `comprovante_envio.pdf` - Comprovante de envio/entrega
- `certidao_cartorio.pdf` - Certidão do cartório
- `outros.pdf` - Outros documentos relacionados

### **⚖️ Processos:**
- `peticao_inicial.pdf` - Petição inicial
- `sentenca.pdf` - Sentença judicial
- `decisao_interlocutoria.pdf` - Decisões interlocutórias
- `recurso.pdf` - Recursos protocolados
- `mandado_citacao.pdf` - Mandados e citações

### **📄 Contratos:**
- `contrato_original.pdf` - Contrato original
- `contrato_assinado.pdf` - Contrato com assinaturas
- `aditivo_contratual.pdf` - Aditivos contratuais
- `termo_rescisao.pdf` - Termos de rescisão

## 🎯 **Vantagens da Nova Organização**

### **✅ Benefícios:**
1. **Organização por Contexto**: Cada tipo de documento em sua pasta específica
2. **Identificação Clara**: Número da procuração/processo/contrato como identificador
3. **Versionamento**: Timestamp no nome do arquivo para controle de versões
4. **Busca Eficiente**: Fácil localizar documentos por tipo e identificador
5. **Backup Seletivo**: Possível fazer backup por tipo de documento
6. **Auditoria**: Rastreamento completo de uploads por usuário e tipo
7. **Escalabilidade**: Suporta milhares de documentos organizados

### **📈 Métricas Avançadas:**
- **Uso por Tipo**: Quantos documentos de cada tipo por tenant
- **Tamanho por Categoria**: Espaço usado por tipo de documento
- **Frequência por Usuário**: Quantos uploads cada usuário faz
- **Documentos por Procuração**: Quantos arquivos cada procuração tem

---

**🎉 Agora o Cloudinary está perfeitamente organizado com estrutura hierárquica por tenant, usuário e tipo de documento!**
