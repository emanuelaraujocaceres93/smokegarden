#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const files = [
  'frontend/src/pages/dashboard/Dashboard.jsx',
  'frontend/src/pages/accounts/Accounts.jsx'
];

files.forEach(file => {
  const fullPath = path.resolve(file);
  console.log(`\n=== ${file} ===`);
  
  try {
    // Ler arquivo como bytes
    const buffer = fs.readFileSync(fullPath);
    console.log(`Tamanho: ${buffer.length} bytes`);
    console.log(`Primeiros 4 bytes: ${Array.from(buffer.slice(0, 4)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
    
    // Detectar BOM
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      console.log('Detectado: UTF-16 LE (Little Endian)');
      const utf8Content = iconv.decode(buffer, 'UTF16LE');
      // Remover BOM se existir
      const cleaned = utf8Content.replace(/^\uFEFF/, '');
      fs.writeFileSync(fullPath, cleaned, 'utf8');
      console.log('✓ Convertido para UTF-8');
    } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      console.log('Detectado: UTF-16 BE (Big Endian)');
      const utf8Content = iconv.decode(buffer, 'UTF16BE');
      const cleaned = utf8Content.replace(/^\uFEFF/, '');
      fs.writeFileSync(fullPath, cleaned, 'utf8');
      console.log('✓ Convertido para UTF-8');
    } else if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      console.log('Detectado: UTF-8 com BOM');
      const cleaned = buffer.toString('utf8').replace(/^\uFEFF/, '');
      fs.writeFileSync(fullPath, cleaned, 'utf8');
      console.log('✓ BOM removido');
    } else {
      console.log('Tentando detectar encoding automaticamente...');
      // Tentar diferentes encodings
      const encodings = ['utf8', 'ascii', 'utf16le', 'utf16be', 'latin1', 'cp1252'];
      let found = false;
      
      for (const enc of encodings) {
        try {
          const decoded = iconv.decode(buffer, enc);
          if (decoded && !decoded.includes('\uFFFD')) { // Sem caracteres inválidos
            console.log(`Detectado: ${enc}`);
            const cleaned = decoded.replace(/^\uFEFF/, '');
            fs.writeFileSync(fullPath, cleaned, 'utf8');
            console.log('✓ Convertido para UTF-8');
            found = true;
            break;
          }
        } catch (e) {}
      }
      
      if (!found) {
        console.log('⚠ Não conseguiu detectar o encoding');
      }
    }
  } catch (err) {
    console.error(`✗ Erro: ${err.message}`);
  }
});
