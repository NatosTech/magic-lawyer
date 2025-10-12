#!/usr/bin/env node

/**
 * Script para descobrir o domínio real do projeto na Vercel
 * Execute este script para encontrar o domínio correto do seu projeto
 */

const https = require('https');

async function discoverVercelDomain() {
  console.log('🔍 Descobrindo domínio do projeto na Vercel...\n');

  // Tentar diferentes padrões de domínio
  const possibleDomains = [
    'magic-lawyer-git-main-magic-track.vercel.app',
    'magic-lawyer.vercel.app',
    'magic-lawyer-magic-track.vercel.app',
    'magiclawyer.vercel.app',
    // Adicione outros padrões se necessário
  ];

  for (const domain of possibleDomains) {
    try {
      console.log(`Testando: https://${domain}`);
      
      const result = await testDomain(domain);
      
      if (result.exists) {
        console.log(`✅ Domínio encontrado: ${domain}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Título: ${result.title || 'N/A'}\n`);
        
        console.log('📝 Para configurar subdomínios, use:');
        console.log(`   sandra.${domain}`);
        console.log(`   joao.${domain}`);
        console.log(`   maria.${domain}\n`);
        
        console.log('🔧 Atualize o código com este domínio:');
        console.log(`   - Substitua "magic-lawyer-git-main-magic-track.vercel.app" por "${domain}"`);
        console.log(`   - Nos arquivos: middleware.ts, auth.ts, hooks/use-tenant-from-domain.ts, app/actions/tenant-domains.ts\n`);
        
        return domain;
      } else {
        console.log(`❌ Não encontrado: ${domain}\n`);
      }
    } catch (error) {
      console.log(`❌ Erro ao testar ${domain}: ${error.message}\n`);
    }
  }

  console.log('⚠️  Nenhum domínio padrão encontrado.');
  console.log('💡 Verifique manualmente no painel da Vercel:');
  console.log('   1. Vá em Settings → Domains');
  console.log('   2. Copie o domínio .vercel.app listado');
  console.log('   3. Use esse domínio para configurar subdomínios\n');
}

function testDomain(domain) {
  return new Promise((resolve) => {
    const req = https.get(`https://${domain}`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : null;
        
        resolve({
          exists: true,
          status: res.statusCode,
          title: title
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        exists: false,
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        exists: false,
        error: 'Timeout'
      });
    });
  });
}

// Executar o script
discoverVercelDomain().catch(console.error);
