#!/usr/bin/env node

/**
 * Script para validar variáveis de ambiente necessárias para CI/CD
 * 
 * Uso:
 *   node scripts/validate-ci-env.js
 * 
 * Retorna código 0 se tudo estiver OK, 1 se houver problemas
 */

const requiredEnvVars = {
  // Essenciais
  DATABASE_URL: 'URL do banco de dados PostgreSQL',
  REDIS_URL: 'URL do Redis (opcional se usando service)',
  NEXTAUTH_SECRET: 'Secret para NextAuth.js',
  NEXTAUTH_URL: 'URL base da aplicação',
};

const optionalEnvVars = {
  // Para testes E2E
  TEST_MODE: 'Modo de teste ativado',
  TEST_ADMIN_EMAIL: 'Email do admin de teste',
  TEST_ADMIN_PASSWORD: 'Senha do admin de teste',
  TEST_ADVOGADO_EMAIL: 'Email do advogado de teste',
  TEST_ADVOGADO_PASSWORD: 'Senha do advogado de teste',
  TEST_SECRETARIA_EMAIL: 'Email da secretaria de teste',
  TEST_SECRETARIA_PASSWORD: 'Senha da secretaria de teste',
  TEST_FINANCEIRO_EMAIL: 'Email do financeiro de teste',
  TEST_FINANCEIRO_PASSWORD: 'Senha do financeiro de teste',
  TEST_CLIENTE_EMAIL: 'Email do cliente de teste',
  TEST_CLIENTE_PASSWORD: 'Senha do cliente de teste',
  // Para Codecov
  CODECOV_TOKEN: 'Token do Codecov (opcional)',
};

const errors = [];
const warnings = [];

// Verificar variáveis essenciais
console.log('🔍 Validando variáveis de ambiente essenciais...\n');

Object.entries(requiredEnvVars).forEach(([key, description]) => {
  const value = process.env[key];
  if (!value) {
    errors.push(`❌ ${key}: ${description} - OBRIGATÓRIA mas não configurada`);
  } else {
    // Mascarar valores sensíveis na saída
    const masked = key.includes('SECRET') || key.includes('PASSWORD') 
      ? '***' 
      : value.length > 50 
        ? `${value.substring(0, 20)}...` 
        : value;
    console.log(`✅ ${key}: ${description}`);
    console.log(`   Valor: ${masked}\n`);
  }
});

// Verificar variáveis opcionais (apenas avisar)
console.log('\n📋 Verificando variáveis opcionais...\n');

Object.entries(optionalEnvVars).forEach(([key, description]) => {
  const value = process.env[key];
  if (!value) {
    warnings.push(`⚠️  ${key}: ${description} - Não configurada (opcional)`);
  } else {
    const masked = key.includes('PASSWORD') || key.includes('TOKEN')
      ? '***'
      : value;
    console.log(`✅ ${key}: ${description}`);
    console.log(`   Valor: ${masked}\n`);
  }
});

// Verificar se está em ambiente CI
if (process.env.CI) {
  console.log('✅ Ambiente CI detectado\n');
  
  // Verificar se serviços estão disponíveis (se configurados)
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      warnings.push('⚠️  DATABASE_URL aponta para localhost - certifique-se de que o service está rodando');
    }
  }
  
  if (process.env.REDIS_URL) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1')) {
      warnings.push('⚠️  REDIS_URL aponta para localhost - certifique-se de que o service está rodando');
    }
  }
} else {
  console.log('ℹ️  Executando fora do ambiente CI\n');
}

// Exibir resumo
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO');
console.log('='.repeat(60));

if (errors.length === 0) {
  console.log('✅ Todas as variáveis essenciais estão configuradas!\n');
} else {
  console.log(`❌ ${errors.length} erro(s) encontrado(s):\n`);
  errors.forEach((error) => console.log(`   ${error}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} aviso(s):\n`);
  warnings.forEach((warning) => console.log(`   ${warning}`));
  console.log('');
}

// Retornar código de saída apropriado
if (errors.length > 0) {
  console.log('💡 DICA: Configure as variáveis no GitHub:');
  console.log('   Settings > Secrets and variables > Actions\n');
  process.exit(1);
} else {
  console.log('✨ Validação concluída com sucesso!\n');
  process.exit(0);
}

