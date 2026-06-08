# Smoke Garden Frontend

Frontend web da aplicação Smoke Garden, construído com React + Vite.

## Visão geral

Esta pasta contém a aplicação React que consome a API do Supabase e oferece os módulos principais do sistema:

- Dashboard
- Vendas
- Relatórios
- Contas (clientes/fornecedores)
- Serviços
- Produtos
- Configurações

## Pré-requisitos

É necessário ter instalado:

- Node.js 18 ou superior
- npm 10 ou superior

## Instalação

1. Abra um terminal em `frontend`
2. Execute:

```bash
npm install
```

## Comandos úteis

No diretório `frontend`:

- `npm run dev` — inicia o servidor de desenvolvimento com HMR
- `npm run build` — gera a versão de produção
- `npm run preview` — visualiza o build de produção localmente
- `npm run lint` — executa o ESLint em todo o código

## Estrutura principal

- `src/main.jsx` — ponto de entrada da aplicação
- `src/App.jsx` — roteamento e layout principal
- `src/pages/` — páginas principais da aplicação
- `src/components/` — componentes reutilizáveis da interface
- `src/contexts/` — providers de contexto como autenticação e carrinho
- `src/lib/supabase.js` — configuração do cliente Supabase
- `src/styles/` — estilos globais e tema

## Boas práticas

- Mantenha componentes funcionais leves e com hooks bem definidos.
- Use `useEffect` apenas para efeitos laterais e carregamento de dados.
- Centralize chamadas ao Supabase em `src/lib/supabase.js` ou hooks próprios.
- Execute `npm run lint` antes de commits para evitar avisos de ESLint.

## Notas importantes

- O projeto usa o React moderno com `jsx` sem necessidade de `import React` em cada arquivo.
- O frontend está integrado ao Supabase e depende da configuração de ambiente definida na raiz do projeto.

## Contato

Para dúvidas sobre este frontend, consulte a equipe de desenvolvimento ou os arquivos de configuração do projeto.
