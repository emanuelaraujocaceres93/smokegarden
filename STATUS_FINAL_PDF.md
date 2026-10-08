=== STATUS FINAL DO PDF ===

1. pdfGenerator.js: OK (generatePDF, doc.save, empresa_config_id, logo_url, supabase)
2. .env.local: OK (credenciais Supabase criadas)
3. Orcamentos.jsx: OK (gerarPDF passa dadosCompletos com empresa_config_id)
4. Settings.jsx: OK (lista empresas, criar, selecionar, logo, endereço)
5. Layout.jsx: OK (sidebar desktop aberta, margem 280px)
6. Botões de lixeira: OK (PublicMenu, NovoOrcamento ampliados)
7. Encoding: OK (Clients, Suppliers, Products, PendingPayments corrigidos)
8. Modal Stock.jsx: OK (maxHeight 90vh, overflowY auto)
9. Commit: 9f540b3 (local) / 260eb82 (remoto após push --force)
10. Push: feito no VS Code (git push origin main --force)

Se o botão PDF ainda não funciona no navegador:
- Verifique o console do navegador (F12) para ver se há erro do supabase
- Verifique se o orçamento selecionado tem empresa_config_id
- Verifique se o navegador bloqueia o download automático (doc.save)
