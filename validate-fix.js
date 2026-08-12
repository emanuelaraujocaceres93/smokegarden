#!/usr/bin/env node

/**
 * Script de validação - Verifica se a correção funcionou
 * Execute após instalar: node validate-fix.js
 */

const fs = require('fs');
const path = require('path');

console.log(`\n${'═'.repeat(60)}`);
console.log('  ✓ VALIDADOR DE ENCODING UTF-8');
console.log(`${'═'.repeat(60)}\n`);

const filesToCheck = [
  'frontend/src/pages/dashboard/Dashboard.jsx',
  'frontend/src/pages/accounts/Accounts.jsx',
  'frontend/vite.config.js'
];

let allValid = true;
let results = [];

filesToCheck.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  
  if (!fs.existsSync(fullPath)) {
    results.push({
      file: filePath,
      status: 'NOT_FOUND',
      message: 'Arquivo não encontrado'
    });
    return;
  }
  
  try {
    const buffer = fs.readFileSync(fullPath);
    
    // Verificar BOM
    const hasBOM = (
      (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) ||
      (buffer[0] === 0xFF && buffer[1] === 0xFE) ||
      (buffer[0] === 0xFE && buffer[1] === 0xFF)
    );
    
    // Tentar ler como UTF-8
    let content = null;
    try {
      content = buffer.toString('utf8');
      
      // Verificar se há caracteres inválidos
      const invalidChars = content.includes('\uFFFD');
      
      if (invalidChars) {
        results.push({
          file: filePath,
          status: 'INVALID_UTF8',
          message: 'Contém caracteres UTF-8 inválidos'
        });
        allValid = false;
      } else if (hasBOM) {
        results.push({
          file: filePath,
          status: 'HAS_BOM',
          message: 'Arquivo tem BOM (Byte Order Mark)'
        });
        allValid = false;
      } else {
        results.push({
          file: filePath,
          status: 'OK',
          message: 'UTF-8 válido ✓'
        });
      }
    } catch (e) {
      results.push({
        file: filePath,
        status: 'ERROR',
        message: `Erro ao decodificar: ${e.message}`
      });
      allValid = false;
    }
    
  } catch (err) {
    results.push({
      file: filePath,
      status: 'ERROR',
      message: `Erro ao ler: ${err.message}`
    });
    allValid = false;
  }
});

// Exibir resultados
console.log('Resultados:\n');

results.forEach(result => {
  const icon = {
    'OK': '✓',
    'NOT_FOUND': '⊘',
    'HAS_BOM': '⚠',
    'INVALID_UTF8': '✗',
    'ERROR': '✗'
  }[result.status] || '?';
  
  const color = {
    'OK': '\x1b[32m',        // Verde
    'NOT_FOUND': '\x1b[33m', // Amarelo
    'HAS_BOM': '\x1b[33m',   // Amarelo
    'INVALID_UTF8': '\x1b[31m', // Vermelho
    'ERROR': '\x1b[31m'      // Vermelho
  }[result.status] || '\x1b[0m';
  
  const reset = '\x1b[0m';
  
  console.log(`  ${icon} ${color}${result.file}${reset}`);
  console.log(`     ${result.message}\n`);
});

// Resultado final
console.log(`${'═'.repeat(60)}`);

if (allValid) {
  console.log('✅ TUDO OK! Seus arquivos estão em UTF-8 válido.');
  console.log('\nVocê pode fazer o build agora:\n');
  console.log('  cd frontend');
  console.log('  npm run build\n');
} else {
  console.log('⚠️  Alguns arquivos ainda precisam ser corrigidos.');
  console.log('\nExecute:\n');
  console.log('  node install-fix.js\n');
  console.log('E depois rodeo validador novamente.\n');
}

console.log(`${'═'.repeat(60)}\n`);

process.exit(allValid ? 0 : 1);
