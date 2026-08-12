#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = [
  'C:\\Users\\Emanuel\\OneDrive\\Área de Trabalho\\smoke-garden\\frontend\\src\\pages\\dashboard\\Dashboard.jsx',
  'C:\\Users\\Emanuel\\OneDrive\\Área de Trabalho\\smoke-garden\\frontend\\src\\pages\\accounts\\Accounts.jsx'
];

files.forEach(file => {
  console.log(`Processando: ${file}`);
  
  try {
    // Ler como diferentes encodings e encontrar o válido
    const buffer = fs.readFileSync(file);
    
    let content = null;
    
    // UTF-16 LE (Little Endian) - BOM FF FE
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      console.log('  → Detectado UTF-16 LE');
      content = buffer.toString('utf16le');
    } 
    // UTF-16 BE (Big Endian) - BOM FE FF
    else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      console.log('  → Detectado UTF-16 BE');
      content = buffer.toString('utf16be');
    } 
    // UTF-8 com BOM
    else if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      console.log('  → Detectado UTF-8 com BOM');
      content = buffer.toString('utf8');
    }
    else {
      console.log('  → Tentando UTF-8 normal');
      content = buffer.toString('utf8');
    }
    
    // Remover BOM se existir
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    // Salvar como UTF-8 puro
    fs.writeFileSync(file, content, 'utf8');
    console.log('  ✓ Convertido e salvo como UTF-8');
    
  } catch (err) {
    console.error(`  ✗ Erro: ${err.message}`);
    process.exit(1);
  }
});

console.log('\n✓ Todos os arquivos foram corrigidos!');
