const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo arquivos JSX...');

function corrigirArquivos(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`❌ Pasta não encontrada: ${dir}`);
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      corrigirArquivos(fullPath);
    } else if (file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/\?\?/g, '📊');
      content = content.replace(/\?/g, '⚠️');
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Corrigido: ${file}`);
    }
  });
}

corrigirArquivos('./frontend/src/pages');
console.log('🎉 Correção finalizada!');
