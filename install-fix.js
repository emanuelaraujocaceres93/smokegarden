#!/usr/bin/env node

/**
 * Script de instalação automática para corrigir encoding UTF-8
 * Execute com: node install-fix.js
 */

const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const projectRoot = path.dirname(__filename);
const frontendPath = path.join(projectRoot, 'frontend');

console.log(`\n${'═'.repeat(60)}`);
console.log('  🔧 INSTALADOR - Correção de Encoding UTF-8');
console.log(`${'═'.repeat(60)}\n`);

try {
  // Etapa 1: Verificar arquivos
  console.log('📋 Etapa 1: Verificando estrutura...\n');
  
  const viteOldPath = path.join(frontendPath, 'vite.config.js');
  const viteNewPath = path.join(frontendPath, 'vite-new.config.js');
  const fixPluginPath = path.join(frontendPath, 'fix-encoding-plugin.js');
  
  if (!fs.existsSync(viteOldPath)) {
    throw new Error(`❌ ${viteOldPath} não encontrado!`);
  }
  
  if (!fs.existsSync(fixPluginPath)) {
    throw new Error(`❌ ${fixPluginPath} não encontrado!`);
  }
  
  if (!fs.existsSync(viteNewPath)) {
    throw new Error(`❌ ${viteNewPath} não encontrado!`);
  }
  
  console.log('  ✓ vite.config.js encontrado');
  console.log('  ✓ fix-encoding-plugin.js encontrado');
  console.log('  ✓ vite-new.config.js encontrado\n');
  
  // Etapa 2: Backup do vite.config.js
  console.log('💾 Etapa 2: Criando backup...\n');
  
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const backupPath = path.join(frontendPath, `vite.config.js.backup.${timestamp}`);
  
  fs.copyFileSync(viteOldPath, backupPath);
  console.log(`  ✓ Backup criado: vite.config.js.backup.${timestamp}\n`);
  
  // Etapa 3: Substituir vite.config.js
  console.log('🔄 Etapa 3: Atualizando vite.config.js...\n');
  
  const newConfig = fs.readFileSync(viteNewPath, 'utf8');
  fs.writeFileSync(viteOldPath, newConfig, 'utf8');
  console.log('  ✓ vite.config.js atualizado com sucesso\n');
  
  // Etapa 4: Executar correção de encoding
  console.log('🔧 Etapa 4: Corrigindo encoding dos arquivos...\n');
  
  const filesToFix = [
    'src/pages/dashboard/Dashboard.jsx',
    'src/pages/accounts/Accounts.jsx'
  ];
  
  let fixedCount = 0;
  
  filesToFix.forEach(relativePath => {
    const fullPath = path.join(frontendPath, relativePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`  ⊘ ${relativePath} (não encontrado)`);
      return;
    }
    
    try {
      const buffer = fs.readFileSync(fullPath);
      let content = '';
      let wasFixed = false;
      
      // Detectar encoding
      if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        console.log(`  🔄 ${relativePath} (UTF-16 LE)`);
        content = buffer.toString('utf16le');
        wasFixed = true;
      } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
        console.log(`  🔄 ${relativePath} (UTF-16 BE)`);
        content = buffer.toString('utf16be');
        wasFixed = true;
      } else if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        console.log(`  🔄 ${relativePath} (UTF-8 com BOM)`);
        content = buffer.toString('utf8');
        wasFixed = true;
      } else {
        console.log(`  ✓ ${relativePath} (UTF-8 correto)`);
        return;
      }
      
      // Remover BOM
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      
      // Salvar
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`    ✓ Corrigido!\n`);
      fixedCount++;
      
    } catch (err) {
      console.error(`  ✗ Erro: ${err.message}\n`);
    }
  });
  
  // Resultado final
  console.log(`${'═'.repeat(60)}`);
  console.log(`✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!\n`);
  console.log(`  Arquivo(s) corrigido(s): ${fixedCount}`);
  console.log(`  Backup: vite.config.js.backup.${timestamp}\n`);
  console.log(`${'═'.repeat(60)}\n`);
  
  // Instruções finais
  console.log('🚀 Próximos passos:\n');
  console.log('  1. Abra um terminal na pasta "frontend"');
  console.log('  2. Execute: npm run build\n');
  console.log('  Se tudo der certo, o build será bem-sucedido!\n');
  
  console.log('💡 Dica: O plugin agora corrige automaticamente no próximo build.\n');
  
} catch (err) {
  console.error(`\n❌ ERRO: ${err.message}\n`);
  process.exit(1);
}
