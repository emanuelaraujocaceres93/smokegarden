#!/usr/bin/env python3
import sys
import os

# Caminhos dos arquivos
files_to_fix = [
    'frontend/src/pages/dashboard/Dashboard.jsx',
    'frontend/src/pages/accounts/Accounts.jsx'
]

# Tenta restaurar o Dashboard do backup primeiro
try:
    backup_file = 'frontend/src/pages/dashboard/Dashboard.jsx.bak'
    if os.path.exists(backup_file):
        with open(backup_file, 'rb') as f:
            buffer = f.read()
        
        # Detectar e converter encoding
        if buffer[0:2] == b'\xff\xfe':  # UTF-16 LE
            content = buffer.decode('utf-16le')
        elif buffer[0:2] == b'\xfe\xff':  # UTF-16 BE
            content = buffer.decode('utf-16be')
        else:
            content = buffer.decode('utf-8', errors='replace')
        
        # Remover BOM
        if content.startswith('\ufeff'):
            content = content[1:]
        
        # Salvar como UTF-8 puro
        with open('frontend/src/pages/dashboard/Dashboard.jsx', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✓ Dashboard.jsx restaurado com sucesso!")
except Exception as e:
    print(f"✗ Erro ao restaurar Dashboard.jsx: {e}")
    sys.exit(1)

# Tentar corrigir Accounts.jsx
try:
    accounts_file = 'frontend/src/pages/accounts/Accounts.jsx'
    with open(accounts_file, 'rb') as f:
        buffer = f.read()
    
    if buffer[0:2] == b'\xff\xfe':  # UTF-16 LE
        content = buffer.decode('utf-16le')
    elif buffer[0:2] == b'\xfe\xff':  # UTF-16 BE
        content = buffer.decode('utf-16be')
    else:
        content = buffer.decode('utf-8', errors='replace')
    
    if content.startswith('\ufeff'):
        content = content[1:]
    
    with open(accounts_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✓ Accounts.jsx corrigido com sucesso!")
except Exception as e:
    print(f"⚠ Aviso ao corrigir Accounts.jsx: {e}")

print("\n✓ Todos os arquivos foram processados!")
