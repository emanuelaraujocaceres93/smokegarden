#!/usr/bin/env node

/**
 * Script de pré-build para CI/CD ou execução direta
 * Garante que todos os arquivos JSX estejam em UTF-8 antes de fazer build
 * 
 * Uso:
 *   npm run prebuild
 *   node prebuild.js
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Arquivos a verificar e corrigir
const filesToCheck = [
  'frontend/src/pages/dashboard/Dashboard.jsx',
  'frontend/src/pages/accounts/Accounts.jsx'
];

console.log('\n🔧 Verificando e corrigindo encoding UTF-8...\n');

let fixedCount = 0;
let errorCount = 0;

filesToCheck.forEach(relativePath => {
  const fullPath = path.join(projectRoot, relativePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⊘ ${relativePath} (não encontrado)`);
    return;
  }
  
  try {
    const buffer = fs.readFileSync(fullPath);
    let content = '';
    let needsFix = false;
    
    // Detectar e converter encoding
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      content = buffer.toString('utf16le');
      needsFix = true;
    } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      content = buffer.toString('utf16be');
      needsFix = true;
    } else if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      content = buffer.toString('utf8');
      needsFix = true;
    } else {
      // Tentar UTF-8 normal
      content = buffer.toString('utf8');
      
      // Verificar se já está ok
      if (!content.includes('\uFFFD')) {
        console.log(`  ✓ ${relativePath}`);
        return;
      } else {
        // Caracteres inválidos encontrados
        needsFix = true;
      }
    }
    
    if (needsFix) {
      // Remover BOM se existir
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      
      // Salvar como UTF-8 puro
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`  🔄 ${relativePath} (corrigido)`);
      fixedCount++;
    }
    
  } catch (err) {
    console.error(`  ✗ ${relativePath} - Erro: ${err.message}`);
    errorCount++;
  }
});

console.log(`\n${'─'.repeat(50)}`);

if (errorCount > 0) {
  console.log(`✗ ${errorCount} erro(s) encontrado(s)`);
  process.exit(1);
} else {
  console.log(`✓ Verificação completa`);
  if (fixedCount > 0) {
    console.log(`✓ ${fixedCount} arquivo(s) corrigido(s)`);
  } else {
    console.log(`✓ Todos os arquivos estão OK`);
  }
  console.log(`${'─'.repeat(50)}\n`);
  process.exit(0);
}
