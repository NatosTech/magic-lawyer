# 📋 Regras de Negócio - Magic Lawyer

Este documento define as regras de negócio e visões específicas por perfil de usuário.

## 🏗️ **Arquitetura de Perfis**

### **Hierarquia de Usuários:**
```
SUPER_ADMIN (Sistema)
├── ADMIN (Escritório)
├── ADVOGADO
├── SECRETARIA
├── FINANCEIRO
└── CLIENTE
```

## 💰 **Sistema Financeiro**

### **1. CLIENTE - O que deve pagar**

#### **Visão do Cliente:**
- **Total Devido**: Soma de todas as faturas em aberto
- **Total Pago**: Soma de todos os pagamentos confirmados
- **Próximos Vencimentos**: Faturas com vencimento em até 30 dias
- **Histórico**: Todas as faturas e pagamentos do cliente

#### **Regras:**
- Cliente vê apenas **suas próprias faturas** vinculadas aos **seus contratos**
- Faturas podem ser de:
  - **Contratos de Honorários** (valor fixo ou percentual)
  - **Custas Processuais** (taxas, emolumentos)
  - **Despesas Extras** (perícias, viagens, etc.)

#### **Fluxo:**
```
Contrato → Fatura → Pagamento → Confirmação
```

### **2. ADVOGADO - O que deve receber**

#### **Visão do Advogado:**
- **Total a Receber**: Soma de faturas não pagas dos seus clientes
- **Total Recebido**: Soma de pagamentos confirmados
- **Comissão por Ação Ganha**: Percentual sobre resultados
- **Performance**: Métricas de recebimento por período

#### **Regras:**
- Advogado vê apenas **faturas dos seus clientes** (onde é responsável)
- **Comissão de Ação Ganha**: Percentual configurável por processo
- **Honorários Contratuais**: Valor acordado no contrato
- **Custas Reembolsáveis**: Valores pagos pelo advogado que serão reembolsados

#### **Tipos de Recebimento:**
1. **Honorários Contratuais** (valor fixo)
2. **Percentual sobre Resultado** (ação ganha)
3. **Custas Reembolsáveis** (despesas do processo)
4. **Despesas Extras** (perícias, viagens, etc.)

### **3. ESCRITÓRIO/ADMIN - Visão Geral**

#### **Visão do Escritório:**
- **Receita Total**: Soma de todos os recebimentos
- **Receita Pendente**: Faturas não pagas
- **Despesas**: Custas, salários, infraestrutura
- **Lucro Líquido**: Receita - Despesas
- **Inadimplência**: Clientes em atraso

#### **Regras:**
- **Controle Total**: Vê todas as movimentações financeiras
- **Gestão de Comissões**: Define percentuais para advogados
- **Controle de Custas**: Aprova despesas extras
- **Relatórios**: Análise de performance e rentabilidade

#### **Fluxo Financeiro:**
```
Cliente Paga → Escritório Recebe → Advogado Recebe Comissão
```

## 📅 **Sistema de Agenda**

### **1. ADMIN/ESCRITÓRIO - Visão Completa**

#### **O que vê:**
- **Todos os eventos** do escritório
- **Eventos por advogado** (filtros)
- **Eventos por cliente** (filtros)
- **Eventos por processo** (filtros)
- **Calendário geral** com todos os compromissos
- **Relatórios de agenda** (ocupação, produtividade)

#### **Funcionalidades:**
- **Criar eventos** para qualquer advogado
- **Reagendar eventos** de qualquer advogado
- **Visualizar conflitos** de horários
- **Gerar relatórios** de ocupação
- **Configurar lembretes** automáticos

### **2. ADVOGADO - Visão Pessoal**

#### **O que vê:**
- **Apenas seus eventos** (onde é responsável)
- **Eventos dos seus clientes** (se configurado)
- **Lembretes pessoais** e prazos
- **Calendário pessoal** otimizado

#### **Funcionalidades:**
- **Criar eventos** pessoais
- **Editar seus eventos**
- **Visualizar agenda** dos clientes
- **Configurar lembretes** pessoais

### **3. SECRETARIA - Visão Operacional**

#### **O que vê:**
- **Eventos de todos os advogados** (para organização)
- **Eventos por cliente** (para atendimento)
- **Prazos processuais** (para controle)
- **Calendário operacional** (para logística)

#### **Funcionalidades:**
- **Criar eventos** para advogados
- **Reagendar eventos** (com permissão)
- **Confirmar presença** de clientes
- **Organizar logística** (salas, equipamentos)

### **4. CLIENTE - Visão Limitada**

#### **O que vê:**
- **Apenas eventos relacionados** ao seu processo
- **Audiências** e reuniões agendadas
- **Prazos importantes** do processo
- **Lembretes** de compromissos

#### **Funcionalidades:**
- **Visualizar agenda** do seu processo
- **Confirmar presença** em eventos
- **Receber lembretes** por email
- **Solicitar reagendamento** (via contato)

## 🎯 **Regras de Acesso por Perfil**

### **ADMIN/ESCRITÓRIO:**
- ✅ **Acesso total** a todos os módulos
- ✅ **Criar/editar/excluir** qualquer registro
- ✅ **Relatórios completos** e analytics
- ✅ **Configurações** do sistema
- ✅ **Gestão de usuários** e permissões

### **ADVOGADO:**
- ✅ **Acesso aos seus clientes** e processos
- ✅ **Criar/editar** eventos pessoais
- ✅ **Visualizar** agenda dos clientes
- ❌ **Não pode** ver dados de outros advogados
- ❌ **Não pode** acessar relatórios gerais

### **SECRETARIA:**
- ✅ **Acesso operacional** a agenda
- ✅ **Criar eventos** para advogados
- ✅ **Visualizar** todos os eventos
- ❌ **Não pode** acessar dados financeiros
- ❌ **Não pode** modificar contratos

### **FINANCEIRO:**
- ✅ **Acesso total** ao módulo financeiro
- ✅ **Criar/editar** faturas e pagamentos
- ✅ **Relatórios financeiros** completos
- ❌ **Não pode** acessar dados processuais
- ❌ **Não pode** modificar contratos

### **CLIENTE:**
- ✅ **Acesso apenas** aos seus dados
- ✅ **Visualizar** status do processo
- ✅ **Baixar** documentos autorizados
- ❌ **Não pode** ver dados de outros clientes
- ❌ **Não pode** acessar dados internos

## 🔄 **Fluxos de Trabalho**

### **Fluxo Financeiro:**
1. **Contrato** é criado com valor definido
2. **Fatura** é gerada automaticamente ou manualmente
3. **Cliente** recebe notificação de vencimento
4. **Pagamento** é processado
5. **Comissão** é calculada para o advogado
6. **Relatório** é atualizado automaticamente

### **Fluxo de Agenda:**
1. **Evento** é criado (por admin, advogado ou secretaria)
2. **Participantes** são notificados
3. **Lembretes** são enviados automaticamente
4. **Confirmação** é registrada
5. **Relatório** de ocupação é atualizado

## 📊 **Métricas e KPIs**

### **Financeiro:**
- **Receita Total** por período
- **Taxa de Inadimplência**
- **Ticket Médio** por cliente
- **Performance** por advogado
- **Custas vs Honorários**

### **Agenda:**
- **Ocupação** por advogado
- **Produtividade** por período
- **Conflitos** de horários
- **Taxa de Comparecimento**
- **Tempo Médio** de reuniões

## 🚀 **Próximos Passos**

1. **Implementar** regras de acesso por perfil
2. **Criar** dashboards específicos por usuário
3. **Desenvolver** relatórios personalizados
4. **Configurar** notificações automáticas
5. **Implementar** auditoria de ações

---

**Nota**: Este documento deve ser atualizado conforme novas funcionalidades são implementadas e regras de negócio evoluem.
