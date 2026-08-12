#!/bin/bash
# Script bash para corrigir encoding em Linux/Mac

cd "$(dirname "$0")" || exit 1

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🔧 Corretor de Encoding UTF-8"
echo "═══════════════════════════════════════════════════════════"
echo ""

FRONTEND_PATH="frontend"
VITE_OLD="$FRONTEND_PATH/vite.config.js"
VITE_NEW="$FRONTEND_PATH/vite-new.config.js"
FIX_PLUGIN="$FRONTEND_PATH/fix-encoding-plugin.js"

# Verificar arquivos
if [ ! -f "$VITE_OLD" ]; then
    echo "❌ Erro: $VITE_OLD não encontrado!"
    exit 1
fi

if [ ! -f "$FIX_PLUGIN" ]; then
    echo "❌ Erro: $FIX_PLUGIN não encontrado!"
    exit 1
fi

if [ ! -f "$VITE_NEW" ]; then
    echo "❌ Erro: $VITE_NEW não encontrado!"
    exit 1
fi

echo "✓ Arquivos verificados"
echo ""

# Backup
TIMESTAMP=$(date +%Y%m%d)
BACKUP="$FRONTEND_PATH/vite.config.js.backup.$TIMESTAMP"
cp "$VITE_OLD" "$BACKUP"
echo "✓ Backup criado: $(basename $BACKUP)"
echo ""

# Substituir vite.config.js
cp "$VITE_NEW" "$VITE_OLD"
echo "✓ vite.config.js atualizado"
echo ""

# Corrigir arquivos JSX
echo "Corrigindo encoding dos arquivos JSX..."
echo ""

FILES=(
  "$FRONTEND_PATH/src/pages/dashboard/Dashboard.jsx"
  "$FRONTEND_PATH/src/pages/accounts/Accounts.jsx"
)

FIXED=0

for FILE in "${FILES[@]}"; do
    if [ ! -f "$FILE" ]; then
        echo "  ⊘ $(basename $FILE) (não encontrado)"
        continue
    fi
    
    # Usar iconv se disponível
    if command -v iconv &> /dev/null; then
        # Tentar converter de UTF-16 LE
        if file "$FILE" | grep -q "UTF-16"; then
            echo "  🔄 $(basename $FILE) (UTF-16)"
            iconv -f UTF-16LE -t UTF-8 "$FILE" > "$FILE.tmp"
            mv "$FILE.tmp" "$FILE"
            echo "    ✓ Corrigido!"
            ((FIXED++))
        else
            echo "  ✓ $(basename $FILE) (UTF-8 ok)"
        fi
    else
        echo "  ℹ $(basename $FILE) - iconv não disponível"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Instalação concluída!"
echo "   Arquivo(s) corrigido(s): $FIXED"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🚀 Próximas etapas:"
echo "  1. cd frontend"
echo "  2. npm run build"
echo ""
