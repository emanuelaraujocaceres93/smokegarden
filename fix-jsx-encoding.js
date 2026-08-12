#!/usr/bin/env node

/**
 * Script para corrigir problemas de encoding UTF-8 nos arquivos JSX
 * Uso: node fix-jsx-encoding.js
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.dirname(__filename);

// Arquivos para corrigir
const filesToFix = [
  'frontend/src/pages/dashboard/Dashboard.jsx',
  'frontend/src/pages/accounts/Accounts.jsx'
];

let fixedCount = 0;

filesToFix.forEach(relativePath => {
  const fullPath = path.join(projectRoot, relativePath);
  
  // Pular se o arquivo não existe
  if (!fs.existsSync(fullPath)) {
    console.log(`⊘ ${relativePath} - Arquivo não encontrado, pulando...`);
    return;
  }

  try {
    console.log(`\nProcessando: ${relativePath}`);
    
    // Ler como buffer
    const buffer = fs.readFileSync(fullPath);
    let content = '';
    
    // Detectar encoding pelo BOM
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      console.log('  Detectado: UTF-16 LE');
      content = buffer.toString('utf16le');
    } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      console.log('  Detectado: UTF-16 BE');
      content = buffer.toString('utf16be');
    } else if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      console.log('  Detectado: UTF-8 com BOM');
      content = buffer.toString('utf8');
    } else {
      console.log('  Detectado: UTF-8 normal');
      content = buffer.toString('utf8');
    }
    
    // Remover BOM se existir
    if (content.charCodeAt(0) === 0xFEFF) {
      console.log('  Removendo BOM...');
      content = content.slice(1);
    }
    
    // Verificar se realmente precisa ser salvo
    const currentContent = fs.readFileSync(fullPath, 'utf8');
    if (currentContent === content) {
      console.log('  ℹ Arquivo já está em UTF-8 correto');
      return;
    }
    
    // Salvar como UTF-8 puro
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  ✓ Corrigido com sucesso!`);
    fixedCount++;
    
  } catch (err) {
    console.error(`  ✗ ERRO: ${err.message}`);
  }
});

console.log(`\n${'─'.repeat(50)}`);
console.log(`✓ Processamento completo!`);
console.log(`  ${fixedCount} arquivo(s) corrigido(s)`);
console.log(`${'─'.repeat(50)}\n`);

if (fixedCount > 0) {
  console.log('Agora você pode fazer o build normalmente com:\n');
  console.log('  cd frontend');
  console.log('  npm run build\n');
}
