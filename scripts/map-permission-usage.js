#!/usr/bin/env node

/**
 * Script para mapear uso de permissões no código
 * 
 * Busca por:
 * - session.user.permissions
 * - user.permissions
 * - Verificações de permissão antigas
 * - Uso de hooks de permissão novos
 * 
 * Uso:
 *   node scripts/map-permission-usage.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const searchPatterns = [
  { pattern: 'session\\.user\\.permissions', description: 'Uso direto de session.user.permissions' },
  { pattern: 'user\\.permissions', description: 'Uso direto de user.permissions' },
  { pattern: '\\.permissions\\[', description: 'Acesso a array de permissões' },
  { pattern: 'includes\\(.*permission', description: 'Verificação com includes()' },
  { pattern: 'usePermissionCheck', description: 'Hook usePermissionCheck (novo)' },
  { pattern: 'usePermissionsCheck', description: 'Hook usePermissionsCheck (novo)' },
  { pattern: 'checkPermission', description: 'Server action checkPermission (novo)' },
  { pattern: 'checkPermissions', description: 'Server action checkPermissions (novo)' },
];

const directories = ['app', 'components'];
const results = {};

console.log('🔍 Mapeando uso de permissões no código...\n');
console.log('='.repeat(60));

searchPatterns.forEach(({ pattern, description }) => {
  results[pattern] = {
    description,
    files: [],
  };

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) return;

    try {
      const output = execSync(
        `grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "${pattern}" ${dir} 2>/dev/null || true`,
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
      );

      if (output.trim()) {
        const lines = output.trim().split('\n');
        lines.forEach((line) => {
          const match = line.match(/^([^:]+):(\d+):(.+)$/);
          if (match) {
            const [, file, lineNum, content] = match;
            results[pattern].files.push({
              file: file.trim(),
              line: parseInt(lineNum),
              content: content.trim(),
            });
          }
        });
      }
    } catch (error) {
      // Ignorar erros de grep
    }
  });
});

// Exibir resultados
let totalOldUsage = 0;
let totalNewUsage = 0;

Object.entries(results).forEach(([pattern, data]) => {
  const isNew = pattern.includes('usePermission') || pattern.includes('checkPermission');
  
  if (data.files.length > 0) {
    if (isNew) {
      console.log(`\n✅ ${data.description} (${data.files.length} ocorrências)`);
      totalNewUsage += data.files.length;
    } else {
      console.log(`\n⚠️  ${data.description} (${data.files.length} ocorrências)`);
      totalOldUsage += data.files.length;
    }

    // Agrupar por arquivo
    const byFile = {};
    data.files.forEach(({ file, line, content }) => {
      if (!byFile[file]) {
        byFile[file] = [];
      }
      byFile[file].push({ line, content });
    });

    // Exibir por arquivo (máximo 5 arquivos)
    Object.entries(byFile).slice(0, 5).forEach(([file, occurrences]) => {
      console.log(`   📄 ${file}`);
      occurrences.slice(0, 3).forEach(({ line, content }) => {
        const preview = content.length > 80 ? content.substring(0, 80) + '...' : content;
        console.log(`      Linha ${line}: ${preview}`);
      });
      if (occurrences.length > 3) {
        console.log(`      ... e mais ${occurrences.length - 3} ocorrências`);
      }
    });

    if (Object.keys(byFile).length > 5) {
      console.log(`   ... e mais ${Object.keys(byFile).length - 5} arquivos`);
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO');
console.log('='.repeat(60));

console.log(`\n⚠️  Uso antigo de permissões: ${totalOldUsage} ocorrências`);
console.log(`✅ Uso novo de permissões: ${totalNewUsage} ocorrências`);

if (totalOldUsage > 0) {
  console.log('\n💡 RECOMENDAÇÕES:');
  console.log('   - Substituir verificações antigas por hooks/actions novos');
  console.log('   - Verificar se as permissões antigas refletem override/cargo/role');
  console.log('   - Atualizar componentes para usar usePermissionCheck/usePermissionsCheck');
} else {
  console.log('\n✨ Nenhum uso antigo encontrado! Tudo migrado para o novo sistema.');
}

console.log('\n');

