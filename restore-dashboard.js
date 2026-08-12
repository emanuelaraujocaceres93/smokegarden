const fs = require('fs');
const path = require('path');

const dbPath = 'frontend/src/pages/dashboard/Dashboard.jsx';
const accPath = 'frontend/src/pages/accounts/Accounts.jsx';
const dbBakPath = 'frontend/src/pages/dashboard/Dashboard.jsx.bak';

try {
  // Ler o arquivo backup (que está correto)
  const buffer = fs.readFileSync(dbBakPath);
  
  let content = null;
  
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    content = buffer.toString('utf16le');
  } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    content = buffer.toString('utf16be');
  } else {
    content = buffer.toString('utf8');
  }
  
  // Remover BOM se existir
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  
  // Salvar como UTF-8 puro no arquivo original
  fs.writeFileSync(dbPath, content, 'utf8');
  console.log('✓ Dashboard.jsx restaurado com sucesso!');
  
} catch (err) {
  console.error('✗ Erro ao restaurar Dashboard.jsx:', err.message);
  process.exit(1);
}
