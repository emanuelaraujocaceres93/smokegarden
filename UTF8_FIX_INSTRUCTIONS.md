# 🔧 Instruções para Corrigir Erro de Encoding UTF-8

## 🐛 Problema
Seus arquivos JSX (`Dashboard.jsx` e `Accounts.jsx`) foram salvos com encoding **UTF-16 LE** ou **UTF-8 com BOM**, causando o erro:
```
stream did not contain valid UTF-8
```

## ✅ Solução Automática (Recomendado)

Implementei um **plugin Vite** que corrige automaticamente os arquivos durante o build.

### Passos:

1. **Substitua o arquivo vite.config.js:**
   ```bash
   cd frontend
   move vite.config.js vite.config.js.bak
   move vite-new.config.js vite.config.js
   ```

   Ou no Windows (GUI):
   - Delete `frontend/vite.config.js`
   - Renomeie `frontend/vite-new.config.js` para `vite.config.js`

2. **Execute o build normalmente:**
   ```bash
   cd frontend
   npm run build
   ```

O plugin detectará e corrigirá automaticamente os arquivos com encoding inválido.

---

## 🛠️ Solução Manual (Se Necessário)

Se preferir corrigir manualmente primeiro:

### Opção 1: Node.js Script
```bash
cd frontend && node ../fix-jsx-encoding.js
```

### Opção 2: Substituir com arquivo correto
Copie o Dashboard.jsx do backup:
```bash
cd frontend
copy src/pages/dashboard/Dashboard.jsx.bak src/pages/dashboard/Dashboard.jsx
```

### Opção 3: Usar um editor de texto
Abra cada arquivo em um editor (VS Code, Sublime, etc.) e resalve com UTF-8 sem BOM:
- Em VS Code: Canto inferior direito → clique em "UTF-8" → selecione "UTF-8 without BOM"

---

## 📝 O que foi alterado

### Arquivos modificados:
- ✏️ `frontend/vite.config.js` - Adicionado plugin para corrigir encoding
- ✏️ `frontend/fix-encoding-plugin.js` - Novo plugin Vite
- ✏️ `frontend/package.json` - Adicionado script `prebuild`

### Arquivos criados (para referência):
- 📄 `fix-jsx-encoding.js` - Script autônomo para correção
- 📄 `fix-encoding.js`, `fix-utf8.js` - Scripts alternativos
- 📄 `vite-new.config.js` - Versão limpa do config (sem BOM)

---

## 🚀 Próximos Passos

Após corrigir, o build deve funcionar normalmente:

```bash
cd frontend
npm run build
```

---

## 💡 Prevenção Futura

Para evitar este problema no futuro:

1. **Configure seu editor para salvar em UTF-8 sem BOM:**
   - VS Code: Adicione ao `.vscode/settings.json`:
     ```json
     {
       "files.encoding": "utf8",
       "[javascript]": {
         "files.encoding": "utf8",
         "files.insertFinalNewline": true
       }
     }
     ```

2. **Adicione um hook git** para verificar encoding:
   ```bash
   npm install --save-dev husky lint-staged
   ```

3. **Use o plugin permanentemente** no vite.config.js como uma camada extra de proteção.

---

## 🤔 FAQ

**P: Por que isso aconteceu?**  
R: Seu editor (ou um script) salvou os arquivos com encoding incorreto. Comum em editores Windows mal configurados.

**P: Perdi meu código?**  
R: Não! O código está intacto, apenas com encoding inválido. O plugin o recupera e o salva corretamente.

**P: Preciso fazer algo manualmente?**  
R: Não! O plugin faz tudo automaticamente. Basta rodar `npm run build`.

---

**Desenvolvido por:** Copilot  
**Status:** ✅ Pronto para uso
