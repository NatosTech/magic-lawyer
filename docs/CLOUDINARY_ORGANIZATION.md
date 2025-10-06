# ☁️ Organização de Arquivos no Cloudinary

## 📁 **Estrutura Hierárquica Completa**

O **Magic Lawyer** utiliza uma estrutura super organizada no Cloudinary para garantir **isolamento**, **escalabilidade** e **facilidade de gestão**.

### **🎯 Estrutura Principal**

```
magiclawyer/                                    # 🏢 Projeto principal
├── {tenant-slug}/                             # 🏛️ Escritório/Tenant
│   ├── {user-name}-{user-id}/                 # 👤 Usuário específico
│   │   ├── user-profile-pictures/             # 📸 Fotos de perfil
│   │   │   ├── avatar.jpg                     # Avatar principal
│   │   │   ├── avatar-backup.png              # Backup do avatar
│   │   │   └── profile-gallery/               # Galeria de fotos
│   │   │       ├── photo-1.jpg
│   │   │       └── photo-2.jpg
│   │   │
│   │   ├── documentos/                        # 📄 Documentos gerais
│   │   │   ├── contratos/                     # Contratos
│   │   │   │   ├── contrato-2024-001.pdf
│   │   │   │   ├── anexo-contrato.docx
│   │   │   │   └── assinaturas/
│   │   │   │       └── assinatura-digital.pdf
│   │   │   │
│   │   │   ├── procuracoes/                   # Procurações
│   │   │   │   ├── proc-2024-001.pdf
│   │   │   │   └── proc-2024-002.pdf
│   │   │   │
│   │   │   ├── identificacao/                 # Documentos pessoais
│   │   │   │   ├── rg.pdf
│   │   │   │   ├── cpf.pdf
│   │   │   │   ├── comprovante-residencia.pdf
│   │   │   │   └── outros/
│   │   │   │
│   │   │   └── outros/                        # Outros documentos
│   │   │       ├── certidoes/
│   │   │       └── comprovantes/
│   │   │
│   │   └── processos/                         # ⚖️ Processos jurídicos
│   │       ├── {numero-processo}/             # Processo específico
│   │       │   ├── peticoes/                  # Petições
│   │       │   │   ├── peticao-inicial.pdf
│   │       │   │   ├── contestacao.pdf
│   │       │   │   ├── recurso.pdf
│   │       │   │   └── memoriais/
│   │       │   │
│   │       │   ├── documentos-pessoais/       # Docs do cliente
│   │       │   │   ├── rg-cliente.pdf
│   │       │   │   ├── cpf-cliente.pdf
│   │       │   │   └── comprovantes/
│   │       │   │
│   │       │   ├── provas/                    # Evidências
│   │       │   │   ├── fotos/
│   │       │   │   │   ├── evidencia-1.jpg
│   │       │   │   │   └── evidencia-2.jpg
│   │       │   │   ├── videos/
│   │       │   │   │   └── gravacao.mp4
│   │       │   │   ├── audios/
│   │       │   │   │   └── depoimento.mp3
│   │       │   │   └── documentos/
│   │       │   │       └── contrato-disputa.pdf
│   │       │   │
│   │       │   ├── sentencas/                 # Decisões judiciais
│   │       │   │   ├── sentenca-2024.pdf
│   │       │   │   ├── acordao.pdf
│   │       │   │   └── despachos/
│   │       │   │
│   │       │   ├── comunicacoes/              # Comunicações
│   │       │   │   ├── emails/
│   │       │   │   ├── cartas/
│   │       │   │   └── notificacoes/
│   │       │   │
│   │       │   └── backup/                    # Backup do processo
│   │       │       └── backup-completo.zip
│   │       │
│   │       └── {outro-processo}/              # Outro processo
│   │           └── ...
│   │
│   └── {outro-usuario}-{user-id}/             # Outro usuário
│       └── ...
│
└── {outro-tenant}/                            # Outro escritório
    └── ...
```

## 🔧 **Implementação Técnica**

### **1. Geração de Paths**

```typescript
// Exemplo de como gerar o path no código
const generateCloudinaryPath = (
  tenantSlug: string,
  userName: string,
  userId: string,
  category: string,
  subcategory?: string,
  processNumber?: string,
  documentType?: string
) => {
  const basePath = `magiclawyer/${tenantSlug}/${userName}-${userId}`;
  
  switch (category) {
    case 'avatar':
      return `${basePath}/user-profile-pictures/avatar`;
    
    case 'documentos':
      return `${basePath}/documentos/${subcategory}`;
    
    case 'processos':
      return `${basePath}/processos/${processNumber}/${documentType}`;
    
    default:
      return basePath;
  }
};

// Exemplos de uso:
generateCloudinaryPath('sandra', 'ana-paula-oliveira', 'cm123', 'avatar');
// Resultado: magiclawyer/sandra/ana-paula-oliveira-cm123/user-profile-pictures/avatar

generateCloudinaryPath('sandra', 'ana-paula-oliveira', 'cm123', 'documentos', 'contratos');
// Resultado: magiclawyer/sandra/ana-paula-oliveira-cm123/documentos/contratos

generateCloudinaryPath('sandra', 'ana-paula-oliveira', 'cm123', 'processos', 'peticoes', '123456789', 'peticoes');
// Resultado: magiclawyer/sandra/ana-paula-oliveira-cm123/processos/123456789/peticoes
```

### **2. Upload Service Integration**

```typescript
// lib/upload-service.ts
export class UploadService {
  static async uploadDocument(
    file: File,
    options: {
      tenantSlug: string;
      userName: string;
      userId: string;
      category: 'documentos' | 'processos';
      subcategory?: string;
      processNumber?: string;
      documentType?: string;
    }
  ): Promise<UploadResult> {
    const folderPath = generateCloudinaryPath(
      options.tenantSlug,
      options.userName,
      options.userId,
      options.category,
      options.subcategory,
      options.processNumber,
      options.documentType
    );

    // Upload para Cloudinary com o path organizado
    return await this.uploadToCloudinary(file, folderPath);
  }
}
```

## 🎯 **Vantagens desta Estrutura**

### **1. Isolamento Total**
- ✅ **Por Tenant** - Escritórios completamente separados
- ✅ **Por Usuário** - Cada usuário tem sua área
- ✅ **Por Processo** - Processos organizados individualmente

### **2. Facilidade de Gestão**
- ✅ **Busca Rápida** - Paths previsíveis e organizados
- ✅ **Backup Seletivo** - Backup por processo ou usuário
- ✅ **Controle de Acesso** - Permissões granulares
- ✅ **Auditoria** - Rastreamento completo de arquivos

### **3. Escalabilidade**
- ✅ **Milhares de Processos** - Estrutura suporta crescimento
- ✅ **Múltiplos Tenants** - Isolamento garantido
- ✅ **Performance** - Organização otimiza busca

### **4. Manutenibilidade**
- ✅ **Estrutura Clara** - Fácil de entender e manter
- ✅ **Padrão Consistente** - Nomenclatura padronizada
- ✅ **Flexibilidade** - Fácil adicionar novas categorias

## 📋 **Exemplos Práticos**

### **Cenário 1: Upload de Avatar**
```
Path: magiclawyer/sandra/ana-paula-oliveira-cm123/user-profile-pictures/avatar
File: avatar.jpg
```

### **Cenário 2: Contrato de Cliente**
```
Path: magiclawyer/sandra/ana-paula-oliveira-cm123/documentos/contratos
File: contrato-2024-001.pdf
```

### **Cenário 3: Petição Inicial**
```
Path: magiclawyer/sandra/ana-paula-oliveira-cm123/processos/123456789/peticoes
File: peticao-inicial.pdf
```

### **Cenário 4: Evidência de Processo**
```
Path: magiclawyer/sandra/ana-paula-oliveira-cm123/processos/123456789/provas/fotos
File: evidencia-1.jpg
```

## 🚀 **Próximas Implementações**

### **1. Sistema de Tags**
- Tags automáticas baseadas no path
- Busca por tags no Cloudinary
- Filtros inteligentes

### **2. Versionamento**
- Controle de versões de documentos
- Histórico de alterações
- Rollback de versões

### **3. Compartilhamento**
- Links temporários para documentos
- Permissões de visualização
- Controle de acesso por tempo

### **4. Backup Automático**
- Backup automático por processo
- Sincronização com outros serviços
- Recuperação de desastres

---

Esta estrutura garante **organização profissional**, **escalabilidade** e **facilidade de gestão** para o **Magic Lawyer**! 🎯☁️
