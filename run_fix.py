import subprocess
import os
import sys

# Navegar para o diretório
os.chdir(r'C:\Users\Emanuel\OneDrive\Área de Trabalho\smoke-garden')

# Executar o script de instalação via Node.js
try:
    result = subprocess.run(['node', 'install-fix.js'], capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    sys.exit(result.returncode)
except Exception as e:
    print(f"Erro: {e}")
    sys.exit(1)
