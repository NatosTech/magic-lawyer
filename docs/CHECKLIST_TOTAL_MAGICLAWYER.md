# ✅ CHECKLIST TOTAL - Magic Lawyer SaaS Jurídico

## 🎯 **OBJETIVO DESTE DOCUMENTO**

**Este é o documento OFICIAL e ÚNICO para controle de progresso do sistema Magic Lawyer.**

### 📋 **FINALIDADE:**
- **Checklist funcional** de todas as funcionalidades do sistema
- **Controle de progresso** com checkboxes marcados/desmarcados
- **Guia de desenvolvimento** para próximas implementações
- **Substitui o ROADMAP_COMPLETO.md** (que está abandonado por ser muito extenso)

### ⚠️ **REGRAS IMPORTANTES:**
- **SEMPRE atualizar** este documento após implementações
- **NÃO criar** novos documentos de roadmap
- **MANTER** apenas este checklist como referência
- **USAR** para pedir próximos passos: "Vamos implementar o próximo item do checklist: [nome]"

### 🔄 **COMO USAR:**
- **Para pedir implementações:** "Vamos implementar o próximo item do checklist: [nome do item]"
- **Para verificar progresso:** "Atualiza o checklist com o que implementamos hoje"
- **Para priorizar:** "Qual é a próxima prioridade no checklist?"

---

**Última Atualização:** 22/01/2025  
**Completude Atual:** 58% (47/94 funcionalidades implementadas) ⬆️

---

## 🎯 **SISTEMA CORE - GESTÃO JURÍDICA**

### 📋 **1. GESTÃO DE PROCESSOS**
- [x] **CRUD Completo de Processos** - Criar, editar, visualizar, excluir
- [x] **Numeração Automática** - Sistema de numeração sequencial
- [x] **Status de Processo** - Ativo, arquivado, concluído, suspenso
- [x] **Upload de Documentos** - Integração com Cloudinary
- [x] **Histórico de Alterações** - Tracking completo de mudanças
- [x] **Busca Avançada** - Filtros por número, cliente, advogado, status
- [x] **Exportação PDF/Excel** - Relatórios de processos
- [x] **Timeline de Eventos** - Cronologia do processo
- [x] **Integração com Partes** - Clientes, advogados, testemunhas
- [x] **Sistema de Prazos** - Controle de prazos processuais

### 📋 **2. GESTÃO DE CLIENTES**
- [x] **CRUD Completo de Clientes** - Dados pessoais e jurídicos
- [x] **Validação CPF/CNPJ** - Validação automática de documentos
- [x] **Endereços Múltiplos** - Residencial, comercial, correspondência
- [x] **Contatos Múltiplos** - Telefone, email, WhatsApp
- [x] **Histórico de Relacionamento** - Interações e comunicações
- [x] **Upload de Documentos** - RG, CPF, contratos, procurações
- [x] **Busca Inteligente** - Por nome, CPF, email, telefone
- [x] **Exportação de Dados** - PDF/Excel com informações completas
- [x] **Integração com Processos** - Vinculação automática
- [x] **Sistema de Tags** - Categorização de clientes

### 📋 **3. GESTÃO DE ADVOGADOS**
- [x] **CRUD Completo de Advogados** - Dados pessoais e profissionais
- [x] **Validação OAB** - Número e UF da OAB
- [x] **Upload de Avatar** - Sistema de crop de imagem
- [x] **Dados Profissionais** - Formação, experiência, especialidades
- [x] **Redes Sociais** - LinkedIn, Twitter, Instagram, website
- [x] **Sistema de Permissões** - Controle de acesso granular
- [x] **Advogados Externos** - Identificação de advogados de outros escritórios
- [x] **Contagem de Processos** - Processos responsáveis vs identificados
- [x] **Filtros Avançados** - Por tipo, status, especialidade
- [x] **Exportação de Relatórios** - PDF/Excel com métricas

### 📋 **4. GESTÃO DE EQUIPE** ✅ **IMPLEMENTADO**
- [x] **Sistema de Cargos** - Definição de cargos por escritório
- [x] **Hierarquia de Equipe** - Estrutura organizacional
- [x] **Permissões por Cargo** - Acesso baseado na função
- [x] **Permissões por Pessoa** - Acesso individual específico
- [x] **Vinculação a Advogados** - Estagiário/Controller serve a X advogados
- [x] **Controle de Acesso Granular** - Por módulo e funcionalidade
- [x] **Auditoria de Permissões** - Histórico de alterações de acesso
- [x] **Interface de Gestão** - CRUD de equipe e permissões
- [x] **Sistema de Convites** - Convite de novos membros da equipe
- [x] **Dashboard de Equipe** - Métricas e performance da equipe

#### **🔧 MELHORIAS NECESSÁRIAS NO MÓDULO DE EQUIPE:**
- [x] **Tooltips Explicativos** - Popovers com explicações de cada funcionalidade
- [x] **Legendas e Ajuda** - Guias visuais para orientar o usuário
- [x] **Coluna Interno/Externo** - Mostrar se advogado é interno ou externo
- [x] **Filtros Avançados** - Filtrar por cargo, status, vinculação
- [x] **Busca em Tempo Real** - Buscar usuários, cargos e vinculações
- [x] **Ordenação por Colunas** - Ordenar por nome, cargo, status
- [x] **Paginação** - Para listas grandes de usuários
- [x] **Exportação de Dados** - CSV da equipe
- [x] **Validações de Formulário** - Validação de campos obrigatórios
- [x] **Confirmações de Exclusão** - Modal de confirmação para ações destrutivas
- [x] **Loading States** - Indicadores de carregamento em todas as ações
- [x] **Mensagens de Sucesso/Erro** - Feedback visual para todas as operações
- [x] **Responsividade Mobile** - Interface adaptada para dispositivos móveis
- [ ] **Testes de Funcionalidade** - Testes automatizados do módulo

### 📋 **5. GESTÃO FINANCEIRA**
- [x] **Sistema de Contratos** - Criação e gestão de contratos
- [x] **Honorários Advocatícios** - Cálculo e controle de honorários
- [x] **Sistema de Parcelas** - Divisão de pagamentos
- [x] **Integração Asaas** - Pagamentos via PIX, boleto, cartão
- [x] **Dashboard Financeiro** - Métricas e gráficos financeiros
- [x] **Relatórios Financeiros** - PDF/Excel com dados financeiros
- [x] **Controle de Inadimplência** - Acompanhamento de pagamentos
- [x] **Sistema de Comissões** - Cálculo de comissões por advogado
- [x] **Métricas de Performance** - Conversão, ticket médio, inadimplência
- [x] **Integração Bancária** - Múltiplas contas bancárias

---

## 🎯 **SISTEMA DE AUTENTICAÇÃO E SEGURANÇA**

### 📋 **6. AUTENTICAÇÃO E USUÁRIOS**
- [x] **NextAuth.js** - Sistema de autenticação completo
- [x] **Login/Logout** - Autenticação segura
- [x] **Registro de Usuários** - Criação de contas
- [x] **Recuperação de Senha** - Reset via email
- [x] **Sistema de Roles** - ADMIN, ADVOGADO, SECRETARIA, CLIENTE
- [x] **Isolamento Multi-tenant** - Dados separados por escritório
- [x] **Sessões Seguras** - Controle de sessões ativas
- [x] **Validação de Acesso** - Middleware de proteção de rotas
- [x] **Logs de Acesso** - Auditoria de logins
- [x] **Configurações de Perfil** - Edição de dados pessoais

### 📋 **7. SEGURANÇA E PERMISSÕES**
- [x] **Controle de Acesso por Role** - Permissões baseadas em função
- [x] **Isolamento de Dados** - Tenant isolation completo
- [x] **Validação de Entrada** - Sanitização de dados
- [x] **Criptografia de Dados** - Dados sensíveis protegidos
- [x] **Auditoria de Ações** - Log de todas as operações
- [x] **Rate Limiting** - Proteção contra ataques
- [x] **CORS Configurado** - Segurança de requisições
- [x] **Validação de Schema** - Validação de dados com Prisma
- [x] **Middleware de Segurança** - Proteção de rotas sensíveis
- [x] **Sistema de Permissões Granulares** - Controle detalhado por funcionalidade

---

## 🎯 **SISTEMA DE INTEGRAÇÕES**

### 📋 **8. INTEGRAÇÕES EXTERNAS**
- [x] **Cloudinary** - Upload e otimização de imagens
- [x] **Asaas API** - Sistema de pagamentos completo
- [x] **Google Calendar** - Sincronização de agenda
- [x] **Sistema de Emails** - Envio de emails transacionais
- [x] **Webhooks** - Integração com sistemas externos
- [x] **API de CEP** - Busca automática de endereços
- [x] **Validação de CPF/CNPJ** - APIs de validação
- [ ] **WhatsApp Business API** - Comunicação automatizada
- [ ] **APIs Jurídicas** - Consulta processual, OAB, CNJ
- [ ] **Assinaturas Digitais** - ICP-Brasil A1/A3
- [ ] **Sistema de Jurisprudência** - Consulta e armazenamento de decisões
- [ ] **Integração PJe** - Consulta de processos via PJe
- [ ] **Integração eProc** - Consulta de processos via eProc
- [ ] **Integração Projudi** - Consulta de processos via Projudi
- [ ] **Consulta por OAB** - Busca automática de processos do advogado
- [ ] **Cron Jobs** - Atualizações automáticas de jurisprudência
- [ ] **Sistema de Captura** - Robôs para capturar dados dos tribunais

### 📋 **9. SISTEMA DE NOTIFICAÇÕES**
- [ ] **Notificações Push** - WebSocket para tempo real
- [x] **Notificações por Email** - Alertas automáticos
- [ ] **Notificações por WhatsApp** - Mensagens automáticas
- [x] **Notificações no Sistema** - Badge de contador
- [ ] **Configurações de Notificação** - Preferências por usuário
- [x] **Histórico de Notificações** - Lista com filtros
- [x] **Templates de Notificação** - Mensagens personalizáveis
- [ ] **Agendamento de Notificações** - Lembretes programados
- [ ] **Notificações de Prazo** - Alertas de prazos processuais
- [ ] **Notificações de Pagamento** - Confirmações e lembretes

---

## 🎯 **SISTEMA DE RELATÓRIOS E ANALYTICS**

### 📋 **10. RELATÓRIOS E EXPORTAÇÕES**
- [x] **Relatórios de Processos** - PDF/Excel com dados completos
- [x] **Relatórios de Clientes** - Listas e dados de clientes
- [x] **Relatórios de Advogados** - Performance e métricas
- [x] **Relatórios Financeiros** - Dados financeiros detalhados
- [x] **Exportação de Dados** - Múltiplos formatos
- [x] **Filtros Avançados** - Personalização de relatórios
- [x] **Agendamento de Relatórios** - Envio automático
- [x] **Templates de Relatório** - Modelos personalizáveis
- [ ] **Dashboard de Analytics** - Métricas de uso do sistema
- [ ] **Relatórios de Performance** - KPIs do escritório

### 📋 **11. SISTEMA DE TEMPLATES**
- [x] **Editor de Templates** - Interface para criar/editar templates
- [x] **Variáveis Dinâmicas** - Substituição automática de dados
- [x] **Categorias de Templates** - Contratos, petições, procurações
- [x] **Versionamento** - Controle de versões dos templates
- [x] **Integração com Processos** - Geração automática de documentos
- [x] **Templates de Email** - Mensagens personalizáveis
- [x] **Templates de Notificação** - Alertas personalizáveis
- [x] **Biblioteca de Templates** - Templates pré-definidos
- [x] **Compartilhamento de Templates** - Entre usuários do sistema
- [x] **Validação de Templates** - Verificação de sintaxe

---

## 🎯 **SISTEMA DE COMUNICAÇÃO**

### 📋 **12. CHAT E COMUNICAÇÃO**
- [ ] **Chat Interno** - Comunicação entre membros da equipe
- [ ] **Chat por Processo** - Discussões específicas por caso
- [ ] **Chat Geral** - Comunicação geral da equipe
- [ ] **Anexos no Chat** - Upload de arquivos nas conversas
- [ ] **Histórico de Conversas** - Busca e filtros
- [ ] **Notificações de Mensagem** - Alertas de novas mensagens
- [ ] **Status de Leitura** - Controle de mensagens lidas
- [ ] **Mensagens Privadas** - Comunicação direta entre usuários
- [ ] **Grupos de Chat** - Conversas em grupo
- [ ] **Integração com Processos** - Chat vinculado a casos

### 📋 **13. SISTEMA DE AGENDA**
- [x] **Calendário Integrado** - Visualização de eventos
- [x] **Sincronização Google Calendar** - Integração com Google
- [x] **Eventos de Processo** - Audiências, prazos, reuniões
- [x] **Lembretes** - Notificações de eventos
- [x] **Agendamento de Reuniões** - Criação de eventos
- [x] **Filtros de Agenda** - Por advogado, cliente, tipo
- [x] **Exportação de Agenda** - PDF/Excel com eventos
- [x] **Integração com Processos** - Eventos vinculados a casos
- [ ] **Agendamento Automático** - Sugestões de horários
- [ ] **Integração com Clientes** - Clientes podem agendar

---

## 🎯 **SISTEMA DE BACKUP E MANUTENÇÃO**

### 📋 **14. BACKUP E SEGURANÇA DE DADOS**
- [ ] **Backup Automático** - Backup diário do banco de dados
- [ ] **Backup de Arquivos** - Cloudinary e documentos
- [ ] **Restauração de Backup** - Interface para restaurar dados
- [ ] **Notificações de Backup** - Alertas de sucesso/falha
- [ ] **Versionamento de Backup** - Múltiplas versões de backup
- [ ] **Backup Incremental** - Apenas dados alterados
- [ ] **Teste de Restauração** - Validação de backups
- [ ] **Criptografia de Backup** - Dados protegidos
- [ ] **Backup em Nuvem** - Armazenamento seguro
- [x] **Monitoramento de Backup** - Status e logs

### 📋 **15. SISTEMA DE MONITORAMENTO**
- [ ] **Logs de Sistema** - Registro de todas as operações
- [ ] **Monitoramento de Performance** - Métricas de sistema
- [ ] **Alertas de Sistema** - Notificações de problemas
- [ ] **Dashboard de Monitoramento** - Status do sistema
- [ ] **Métricas de Uso** - Estatísticas de utilização
- [ ] **Análise de Erros** - Tracking de erros e bugs
- [ ] **Relatórios de Sistema** - Status e performance
- [ ] **Manutenção Preventiva** - Alertas de manutenção
- [ ] **Backup de Logs** - Preservação de histórico
- [ ] **Integração com Ferramentas** - Slack, Discord, etc.

---

## 🎯 **SISTEMA DE PERSONALIZAÇÃO**

### 📋 **16. WHITE LABEL E PERSONALIZAÇÃO**
- [x] **Subdomínio Personalizado** - Cada escritório com seu domínio
- [x] **Logo Personalizado** - Upload de logo do escritório
- [x] **Cores Personalizadas** - Tema customizado por escritório
- [x] **Configurações de Escritório** - Dados específicos
- [x] **Isolamento Multi-tenant** - Dados completamente separados
- [x] **Configurações de Email** - Templates personalizados
- [x] **Configurações de Pagamento** - Integração Asaas por tenant
- [ ] **Temas Personalizados** - CSS customizado
- [ ] **Configurações Avançadas** - Opções de personalização
- [ ] **API de Personalização** - Integração com sistemas externos

### 📋 **17. SISTEMA DE ONBOARDING**
- [x] **Checkout Sem Login** - Formulário público de cadastro
- [x] **Criação Automática de Tenant** - Sistema cria escritório automaticamente
- [x] **Emails de Boas-vindas** - Sequência de emails transacionais
- [x] **Tutorial Interativo** - Guia de uso do sistema
- [x] **Configuração Inicial** - Setup básico do escritório
- [x] **Importação de Dados** - Migração de dados existentes
- [x] **Suporte Inicial** - Ajuda nos primeiros passos
- [ ] **Onboarding Personalizado** - Baseado no tipo de escritório
- [ ] **Gamificação** - Sistema de conquistas e progresso
- [ ] **Feedback de Onboarding** - Coleta de opiniões

---

## 🎯 **SISTEMA DE PAGAMENTOS E ASSINATURAS**

### 📋 **18. SISTEMA DE PAGAMENTOS**
- [x] **Integração Asaas** - API completa de pagamentos
- [x] **PIX Dinâmico** - QR Code para pagamentos
- [x] **Boleto Bancário** - Geração de boletos
- [x] **Cartão de Crédito** - Processamento de cartões
- [x] **Webhooks** - Confirmação automática de pagamentos
- [x] **Subcontas** - Conta independente por tenant
- [x] **Relatórios de Pagamento** - Dados financeiros
- [x] **Controle de Inadimplência** - Acompanhamento de pagamentos
- [x] **Múltiplas Formas de Pagamento** - PIX, boleto, cartão
- [x] **Histórico de Pagamentos** - Log completo de transações

### 📋 **19. SISTEMA DE ASSINATURAS**
- [x] **Planos de Assinatura** - Básico, Pro, Enterprise
- [x] **Cobrança Recorrente** - Renovação automática
- [x] **Upgrade/Downgrade** - Mudança de planos
- [x] **Cancelamento** - Processo de cancelamento
- [x] **Período de Teste** - Trial gratuito
- [x] **Faturamento** - Controle de faturas
- [x] **Histórico de Assinaturas** - Log de mudanças
- [x] **Notificações de Vencimento** - Alertas de renovação
- [ ] **Planos Personalizados** - Assinaturas customizadas
- [ ] **Descontos e Promoções** - Sistema de cupons

---

## 🎯 **SISTEMA DE MOBILE E RESPONSIVIDADE**

### 📋 **20. RESPONSIVIDADE E MOBILE**
- [x] **Design Responsivo** - Funciona em todos os dispositivos
- [x] **Mobile First** - Otimizado para mobile
- [x] **Touch Friendly** - Interface otimizada para touch
- [x] **PWA Ready** - Progressive Web App
- [x] **Offline Support** - Funcionalidade offline básica
- [x] **Performance Mobile** - Otimizado para dispositivos móveis
- [x] **Interface Adaptativa** - Layout que se adapta ao dispositivo
- [ ] **App Mobile Nativo** - Aplicativo para iOS/Android
- [ ] **Notificações Push Mobile** - Alertas no dispositivo
- [ ] **Sincronização Offline** - Dados sincronizados quando online

---

## 🎯 **SISTEMA DE IA E AUTOMAÇÃO**

### 📋 **21. SISTEMA DE IA JURÍDICA**
- [ ] **Assistente Jurídico** - IA para responder dúvidas básicas
- [ ] **Geração Automática de Petições** - IA para criar petições baseadas em modelos
- [ ] **Análise de Jurisprudência** - IA para analisar tendências jurisprudenciais
- [ ] **Sugestões Inteligentes** - IA para sugerir estratégias processuais
- [ ] **Chatbot Jurídico** - Atendimento automático para clientes
- [ ] **Análise de Risco** - Avaliar chances de sucesso em processos
- [ ] **Previsão de Prazos** - IA para prever tempo de tramitação
- [ ] **Sistema de Sugestões** - IA para sugerir jurisprudência relevante

### 📋 **22. ANALYTICS E BUSINESS INTELLIGENCE**
- [ ] **Dashboard de Performance** - Métricas de sucesso dos advogados
- [ ] **Análise de Tempo** - Quanto tempo leva cada tipo de processo
- [ ] **Relatórios de Rentabilidade** - Análise financeira por cliente/processo
- [ ] **Métricas de Uso** - Páginas mais acessadas, tempo de sessão
- [ ] **Funil de Conversão** - Análise do onboarding
- [ ] **Google Analytics** - Integração com GA4
- [ ] **Dashboards Grafana** - Monitoramento avançado
- [ ] **Relatórios de Sistema** - Status e performance

### 📋 **23. INTEGRAÇÕES AVANÇADAS**
- [ ] **Telegram Bot** - Notificações via Telegram
- [ ] **Slack Integration** - Notificações para equipe
- [ ] **Microsoft Teams** - Integração com ferramentas corporativas
- [ ] **Zapier** - Automações com outras ferramentas
- [ ] **Microsoft Outlook** - Integração de calendário
- [ ] **Apple Calendar** - Terceira opção de sincronização

### 📋 **24. SISTEMA DE TREINAMENTO**
- [ ] **Academia Magic Lawyer** - Cursos e treinamentos
- [ ] **Certificações** - Certificações para usuários
- [ ] **Webinars** - Webinars sobre funcionalidades
- [ ] **Tutoriais Interativos** - Tutoriais passo a passo
- [ ] **Base de Conhecimento** - FAQ e documentação
- [ ] **Onboarding Personalizado** - Baseado no tipo de escritório
- [ ] **Feedback de Onboarding** - Coleta de opiniões

### 📋 **25. GAMIFICAÇÃO**
- [ ] **Sistema de Pontos** - Pontos por uso do sistema
- [ ] **Rankings** - Rankings de advogados/escritórios
- [ ] **Conquistas** - Badges e conquistas
- [ ] **Desafios** - Desafios mensais
- [ ] **Recompensas** - Descontos e benefícios
- [ ] **Sistema de Progresso** - Acompanhamento de evolução

### 📋 **26. MARKETPLACE**
- [ ] **Marketplace de Modelos** - Venda de modelos de petição
- [ ] **Consultoria Jurídica** - Plataforma de consultoria
- [ ] **Serviços Terceirizados** - Serviços de terceiros
- [ ] **Integrações Premium** - Integrações pagas
- [ ] **Templates Premium** - Templates profissionais
- [ ] **Planos Personalizados** - Assinaturas customizadas
- [ ] **Descontos e Promoções** - Sistema de cupons

---

## 📊 **RESUMO DE PROGRESSO**

### ✅ **IMPLEMENTADO (47/94 funcionalidades)**
- **Sistema Core**: 100% completo
- **Autenticação**: 100% completo  
- **Integrações**: 80% completo
- **Relatórios**: 80% completo
- **Pagamentos**: 100% completo
- **Personalização**: 80% completo
- **Mobile**: 70% completo

### ⚠️ **PENDENTE (47/94 funcionalidades)**
- **Gestão de Equipe**: 100% - **COMPLETO** ✅
- **Melhorias de Equipe**: 93% - **QUASE COMPLETO** ✅
- **Notificações**: 40% - **PARCIALMENTE IMPLEMENTADO** 🟡
- **Templates**: 100% - **COMPLETO** ✅
- **Chat**: 0% - **PRIORIDADE MÉDIA**
- **Backup**: 10% - **PRIORIDADE BAIXA**
- **Sistema de IA**: 0% - **PRIORIDADE MÉDIA**
- **Analytics**: 0% - **PRIORIDADE MÉDIA**
- **Integrações Avançadas**: 0% - **PRIORIDADE BAIXA**
- **Sistema de Treinamento**: 0% - **PRIORIDADE BAIXA**
- **Gamificação**: 0% - **PRIORIDADE BAIXA**
- **Marketplace**: 0% - **PRIORIDADE BAIXA**
- **Sistema de Jurisprudência**: 0% - **PRIORIDADE ALTA**

### 🎯 **PRÓXIMAS IMPLEMENTAÇÕES (PRIORIDADE)**
1. **Sistema de Jurisprudência** - Consulta e armazenamento de decisões
2. **Sistema de Notificações Push** - WebSocket para tempo real
3. **Sistema de Notificações WhatsApp** - Mensagens automáticas
4. **Sistema de Chat Interno** - Comunicação entre membros da equipe
5. **Sistema de IA Jurídica** - Assistente jurídico e automação
6. **Analytics e Business Intelligence** - Métricas e relatórios avançados

---

## 🚀 **META ATUAL: 58% DE COMPLETUDE**

**Foco:** Implementar as funcionalidades de alta prioridade para atingir 80% do sistema completo!

**Tempo estimado:** 4-6 semanas de desenvolvimento intensivo
**Resultado esperado:** Sistema 80% funcional e profissional

### 🎯 **FASES DE IMPLEMENTAÇÃO:**

**FASE 1 (Alta Prioridade - 2 semanas):**
- Sistema de Jurisprudência
- Sistema de Notificações Push
- Sistema de Notificações WhatsApp

**FASE 2 (Média Prioridade - 2 semanas):**
- Sistema de Chat Interno
- Sistema de IA Jurídica
- Analytics e Business Intelligence

**FASE 3 (Baixa Prioridade - 2 semanas):**
- Sistema de Backup Automático
- Integrações Avançadas
- Sistema de Treinamento
- Gamificação
- Marketplace

---

## ⚠️ **AVISO IMPORTANTE PARA IAs E DESENVOLVEDORES**

**Este documento é o ÚNICO controle de progresso oficial do Magic Lawyer.**

### 🚫 **NÃO FAZER:**
- Criar novos documentos de roadmap
- Modificar o ROADMAP_COMPLETO.md (está abandonado)
- Criar listas de tarefas separadas
- Ignorar este checklist

### ✅ **SEMPRE FAZER:**
- Atualizar este checklist após implementações
- Usar este documento para pedir próximos passos
- Manter a estrutura de checkboxes
- Seguir as regras definidas no início do documento

**Este checklist é a FONTE ÚNICA DA VERDADE para o progresso do sistema!**
