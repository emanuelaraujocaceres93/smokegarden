/**
 * Plugin Vite para corrigir arquivos com encoding inválido antes do build
 * Este plugin detecta e corrige arquivos com UTF-16 ou BOM inválido
 */

import fs from 'fs';
import path from 'path';

export function fixEncodingPlugin() {
  const filesToCheck = [
    'src/pages/dashboard/Dashboard.jsx',
    'src/pages/accounts/Accounts.jsx',
    'vite.config.js'
  ];

  return {
    name: 'fix-encoding-plugin',
    apply: 'build',
    enforce: 'pre',

    resolveId(id) {
      return null;
    },

    async buildStart() {
      console.log('\n🔧 Verificando encoding dos arquivos JSX...\n');

      for (const filePath of filesToCheck) {
        const fullPath = path.resolve(filePath);

        if (!fs.existsSync(fullPath)) {
          console.log(`  ⊘ ${filePath} (não encontrado)`);
          continue;
        }

        try {
          const buffer = fs.readFileSync(fullPath);
          let content = '';
          let needsFixing = false;

          if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
            console.log(`  🔄 ${filePath} (UTF-16 LE detectado)`);
            content = buffer.toString('utf16le');
            needsFixing = true;
          } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
            console.log(`  🔄 ${filePath} (UTF-16 BE detectado)`);
            content = buffer.toString('utf16be');
            needsFixing = true;
          } else if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            console.log(`  🔄 ${filePath} (UTF-8 com BOM detectado)`);
            content = buffer.toString('utf8');
            needsFixing = true;
          } else {
            console.log(`  ✓ ${filePath} (UTF-8 ok)`);
            continue;
          }

          if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
          }

          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`    ✓ Corrigido!`);
        } catch (err) {
          console.error(`  ✗ Erro ao processar ${filePath}: ${err.message}`);
        }
      }

      console.log('\n');
    }
  };
}
