# Cron Jobs - Magic Lawyer

## 📋 **Visão Geral**

O Magic Lawyer utiliza cron jobs do Vercel para automatizar tarefas de manutenção e limpeza do sistema.

## 🧹 **Limpeza de Documentos Órfãos**

### **Funcionalidade**
- **Objetivo**: Remover documentos que existem no banco mas não existem mais no Cloudinary
- **Frequência**: Diariamente às 2:00 UTC
- **Endpoint**: `/api/cron/cleanup-documents`

### **Como Funciona**
1. **Busca** todos os documentos no banco de dados
2. **Verifica** se cada arquivo ainda existe no Cloudinary
3. **Remove** registros órfãos do banco de dados
4. **Registra** estatísticas da operação

### **Logs de Execução**
```
🧹 Iniciando limpeza de documentos órfãos...
📊 Encontrados 150 documentos no banco
⏳ Processados: 10/150
⏳ Processados: 20/150
🗑️ Documento órfão encontrado: contrato_assinado.pdf (cm123...)
✅ Limpeza concluída: { totalProcessed: 150, totalDeleted: 3, totalErrors: 0 }
```

## ⚙️ **Configuração**

### **1. Variáveis de Ambiente**
Adicione ao seu `.env`:
```bash
# Cron Jobs
CRON_SECRET="sua-chave-secreta-super-segura"
```

### **2. Arquivo vercel.json**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/cleanup-documents",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### **3. Deploy**
```bash
vercel deploy --prod
```

## 🔒 **Segurança**

### **Autenticação**
- Cron jobs são protegidos por `CRON_SECRET`
- Apenas chamadas com `Authorization: Bearer {CRON_SECRET}` são aceitas
- Sem autenticação, retorna erro 401

### **Execução**
- **Produção**: Executa automaticamente conforme cronograma
- **Preview**: Não executa (apenas produção)
- **Local**: Pode ser testado manualmente

## 🧪 **Teste Manual**

### **Via cURL**
```bash
curl -X GET "https://seu-dominio.vercel.app/api/cron/cleanup-documents" \
  -H "Authorization: Bearer sua-chave-secreta"
```

### **Via Vercel Dashboard**
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Functions** → **Cron Jobs**
3. Clique em **"Run Now"** para executar manualmente

## 📊 **Monitoramento**

### **Logs do Vercel**
- Acesse **Functions** → **Logs**
- Filtre por `cleanup-documents`
- Monitore execuções e erros

### **Métricas Importantes**
- **totalProcessed**: Documentos verificados
- **totalDeleted**: Documentos órfãos removidos
- **totalErrors**: Erros durante a execução

## 🚨 **Troubleshooting**

### **Erro 401 - Unauthorized**
```bash
# Verifique se CRON_SECRET está configurado
echo $CRON_SECRET

# Verifique se está passando o header correto
curl -H "Authorization: Bearer $CRON_SECRET" ...
```

### **Erro 500 - Internal Server Error**
```bash
# Verifique logs do Vercel
# Pode ser erro de conexão com banco ou Cloudinary
```

### **Cron Job Não Executa**
1. Verifique se está em **produção** (não preview)
2. Confirme configuração no `vercel.json`
3. Aguarde até 24h para primeira execução

## 📅 **Horários de Execução**

### **Cronograma Atual**
- **Limpeza de Documentos**: `0 2 * * *` (2:00 UTC diariamente)

### **Fuso Horário**
- **UTC**: Horário de referência
- **Brasil (UTC-3)**: 23:00 do dia anterior
- **Brasil (UTC-2)**: 00:00 do mesmo dia

## 🔧 **Adicionando Novos Cron Jobs**

### **1. Criar API Route**
```typescript
// app/api/cron/novo-job/route.ts
export async function GET(request: NextRequest) {
  // Implementar lógica do cron job
}
```

### **2. Adicionar ao vercel.json**
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-documents",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/novo-job",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### **3. Deploy**
```bash
vercel deploy --prod
```

## 📚 **Recursos Adicionais**

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Expression Generator](https://crontab.guru/)
- [Vercel Functions Logs](https://vercel.com/docs/functions/logs)
