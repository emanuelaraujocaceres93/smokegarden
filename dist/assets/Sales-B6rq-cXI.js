import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{E as t,L as n,T as r}from"./vendor-react-DPcV1OcH.js";import{t as i}from"./index-EeliWgz-.js";var a=e(n(),1),o=r(),s=e=>new Intl.NumberFormat(`pt-BR`,{style:`currency`,currency:`BRL`}).format(e||0);function c(){let[e,n]=(0,a.useState)([]),[r,c]=(0,a.useState)([]),[l,u]=(0,a.useState)([]),[d,f]=(0,a.useState)(!0),[p,m]=(0,a.useState)(``),[h,g]=(0,a.useState)(``),[_,v]=(0,a.useState)(`pix`),[y,b]=(0,a.useState)(`produto`),[x,S]=(0,a.useState)(``),[C,w]=(0,a.useState)({descricao:``,quantidade:1,valor_unitario:``}),[T,E]=(0,a.useState)(``),[D,O]=(0,a.useState)(``),[k,A]=(0,a.useState)(``);(0,a.useEffect)(()=>{j()},[]);async function j(){f(!0);let[{data:e,error:r},{data:a}]=await Promise.all([i.from(`estoque`).select(`*`).eq(`ativo`,!0).order(`nome`),i.from(`pessoas`).select(`*`).eq(`tipo`,`cliente`).order(`nome`)]);r&&t.error(`Erro ao carregar estoque`),n(e||[]),c(a||[]),f(!1)}let M=(0,a.useMemo)(()=>{let t=x.trim().toLowerCase();return e.filter(e=>e.tipo===y&&(!t||e.nome.toLowerCase().includes(t)))},[e,y,x]),N=l.reduce((e,t)=>e+t.valor_total,0);function P(e){l.find(t=>t.estoque_id===e.id)?u(l.map(t=>t.estoque_id===e.id?{...t,quantidade:t.quantidade+1,valor_total:(t.quantidade+1)*t.valor_unitario}:t)):u([...l,{tipo_item:e.tipo,estoque_id:e.id,descricao:e.nome,quantidade:1,valor_unitario:Number(e.valor)||0,valor_total:Number(e.valor)||0}])}function F(e,t){if(t<=0){u(l.filter((t,n)=>n!==e));return}u(l.map((n,r)=>r===e?{...n,quantidade:t,valor_total:t*n.valor_unitario}:n))}function I(){if(!C.descricao.trim())return t.error(`Descreva o insumo`);let e=Number(C.quantidade)||1,n=Number(C.valor_unitario)||0;u([...l,{tipo_item:`insumo`,estoque_id:null,descricao:C.descricao.trim(),quantidade:e,valor_unitario:n,valor_total:e*n}]),w({descricao:``,quantidade:1,valor_unitario:``})}async function L(){if(p){let e=r.find(e=>e.id===p);return{id:p,nome:e?.nome,email:e?.email,telefone:e?.telefone}}if(k.trim()){let{data:e,error:t}=await i.from(`pessoas`).insert([{tipo:`cliente`,nome:k.trim(),email:T||null,telefone:D||null}]).select().single();if(t)throw t;return{id:e.id,nome:e.nome,email:e.email,telefone:e.telefone}}return{id:null,nome:`Cliente avulso`,email:null,telefone:null}}async function R(){if(l.length===0)return t.error(`Adicione itens ao carrinho`);try{f(!0);let e=await L(),n=l.reduce((e,t)=>e+t.valor_total,0),{data:r,error:a}=await i.from(`vendas`).insert([{cliente_id:e.id||null,valor_total:n,forma_pagamento:_,status:`concluida`,created_at:new Date().toISOString()}]).select().single();if(a)throw a;if(l.length>0){let e=l.map(e=>({venda_id:r.id,estoque_id:e.estoque_id,tipo_item:e.tipo_item,descricao:e.descricao,quantidade:e.quantidade,valor_unitario:e.valor_unitario,valor_total:e.valor_total})),{error:t}=await i.from(`venda_itens`).insert(e);t&&console.error(`Erro ao inserir itens:`,t)}t.success(`Venda finalizada com sucesso!`),u([]),m(``),A(``),E(``),O(``),j()}catch(e){console.error(`Erro:`,e),t.error(e.message||`Erro ao finalizar venda`)}finally{f(!1)}}return d?(0,o.jsxs)(`div`,{className:`loading-root`,children:[(0,o.jsx)(`div`,{className:`spinner`}),(0,o.jsx)(`p`,{children:`Carregando...`})]}):(0,o.jsxs)(`div`,{className:`sales-container`,children:[(0,o.jsxs)(`div`,{className:`sales-header`,children:[(0,o.jsx)(`h1`,{className:`sales-title`,children:`Vendas`}),(0,o.jsx)(`p`,{className:`sales-description`,children:`Carrinho com produtos, serviços e insumos.`})]}),(0,o.jsxs)(`div`,{className:`sales-grid`,children:[(0,o.jsxs)(`div`,{className:`sales-products-panel`,children:[(0,o.jsxs)(`div`,{className:`sales-type-buttons`,children:[(0,o.jsx)(`button`,{onClick:()=>b(`produto`),className:`sales-type-btn ${y===`produto`?`active`:``}`,children:`Produtos`}),(0,o.jsx)(`button`,{onClick:()=>b(`servico`),className:`sales-type-btn ${y===`servico`?`active`:``}`,children:`Serviços`})]}),(0,o.jsx)(`input`,{type:`text`,value:x,onChange:e=>S(e.target.value),placeholder:`Buscar...`,className:`sales-search-input`}),(0,o.jsx)(`div`,{className:`sales-items-list`,children:M.map(e=>(0,o.jsxs)(`button`,{onClick:()=>P(e),className:`sales-item-btn`,children:[(0,o.jsx)(`strong`,{children:e.nome}),(0,o.jsx)(`small`,{children:s(e.valor)})]},e.id))})]}),(0,o.jsxs)(`div`,{className:`sales-cart-panel`,children:[(0,o.jsx)(`h2`,{className:`sales-cart-title`,children:`Carrinho`}),(0,o.jsxs)(`div`,{className:`sales-form-group`,children:[(0,o.jsx)(`label`,{children:`Cliente existente`}),(0,o.jsxs)(`select`,{value:p,onChange:e=>{m(e.target.value),A(``)},className:`sales-select`,children:[(0,o.jsx)(`option`,{value:``,children:`Cliente avulso`}),r.map(e=>(0,o.jsx)(`option`,{value:e.id,children:e.nome},e.id))]})]}),!p&&(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)(`div`,{className:`sales-form-group`,children:[(0,o.jsx)(`label`,{children:`Novo cliente`}),(0,o.jsx)(`input`,{type:`text`,value:k,onChange:e=>A(e.target.value),placeholder:`Nome`,className:`sales-input`})]}),(0,o.jsxs)(`div`,{className:`sales-form-group`,children:[(0,o.jsx)(`label`,{children:`Email`}),(0,o.jsx)(`input`,{type:`email`,value:T,onChange:e=>E(e.target.value),placeholder:`email@exemplo.com`,className:`sales-input`})]}),(0,o.jsxs)(`div`,{className:`sales-form-group`,children:[(0,o.jsx)(`label`,{children:`Telefone`}),(0,o.jsx)(`input`,{type:`text`,value:D,onChange:e=>O(e.target.value),placeholder:`(11) 99999-9999`,className:`sales-input`})]})]}),(0,o.jsxs)(`div`,{className:`sales-form-group`,children:[(0,o.jsx)(`label`,{children:`Forma de pagamento`}),(0,o.jsxs)(`select`,{value:_,onChange:e=>v(e.target.value),className:`sales-select`,children:[(0,o.jsx)(`option`,{value:`pix`,children:`Pix`}),(0,o.jsx)(`option`,{value:`dinheiro`,children:`Dinheiro`}),(0,o.jsx)(`option`,{value:`debito`,children:`Cartão débito`}),(0,o.jsx)(`option`,{value:`credito`,children:`Cartão crédito`})]})]}),(0,o.jsx)(`div`,{className:`sales-cart-items`,children:l.map((e,t)=>(0,o.jsxs)(`div`,{className:`sales-cart-item`,children:[(0,o.jsxs)(`div`,{className:`sales-cart-item-header`,children:[(0,o.jsx)(`strong`,{children:e.descricao}),(0,o.jsx)(`button`,{onClick:()=>F(t,0),className:`sales-remove-btn`,children:`Remover`})]}),(0,o.jsxs)(`div`,{className:`sales-cart-item-controls`,children:[(0,o.jsx)(`input`,{type:`number`,min:`1`,value:e.quantidade,onChange:e=>F(t,Number(e.target.value)||1),className:`sales-quantity-input`}),(0,o.jsx)(`span`,{className:`sales-item-total`,children:s(e.valor_total)})]})]},t))}),(0,o.jsxs)(`div`,{className:`sales-insumo-panel`,children:[(0,o.jsx)(`h3`,{children:`Insumo`}),(0,o.jsx)(`input`,{type:`text`,value:C.descricao,onChange:e=>w({...C,descricao:e.target.value}),placeholder:`Descrição`,className:`sales-input`}),(0,o.jsxs)(`div`,{className:`sales-insumo-controls`,children:[(0,o.jsx)(`input`,{type:`number`,min:`1`,value:C.quantidade,onChange:e=>w({...C,quantidade:e.target.value}),placeholder:`Qtd`,className:`sales-insumo-qtd`}),(0,o.jsx)(`input`,{type:`number`,step:`0.01`,value:C.valor_unitario,onChange:e=>w({...C,valor_unitario:e.target.value}),placeholder:`Valor`,className:`sales-insumo-valor`}),(0,o.jsx)(`button`,{onClick:I,className:`sales-insumo-add`,children:`+`})]})]}),(0,o.jsxs)(`div`,{className:`sales-total`,children:[(0,o.jsx)(`span`,{children:`Total`}),(0,o.jsx)(`span`,{children:s(N)})]}),(0,o.jsx)(`button`,{onClick:R,disabled:d,className:`sales-finalize-btn`,children:d?`Finalizando...`:`Finalizar Venda`})]})]}),(0,o.jsx)(`style`,{jsx:!0,children:`
        .sales-container {
          padding: 24px;
          background-color: #1a1a1a;
          min-height: 100vh;
        }

        .sales-header {
          margin-bottom: 24px;
        }

        .sales-title {
          color: white;
          font-size: 28px;
          margin: 0;
        }

        .sales-description {
          color: #888;
          margin: 5px 0 0;
        }

        .sales-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
        }

        .sales-products-panel {
          background-color: #2a2a2a;
          border-radius: 12px;
          padding: 20px;
        }

        .sales-type-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .sales-type-btn {
          padding: 8px 16px;
          background-color: #333;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .sales-type-btn.active {
          background-color: #2563eb;
        }

        .sales-search-input {
          width: 100%;
          padding: 8px;
          background-color: #333;
          border: 1px solid #444;
          border-radius: 8px;
          color: white;
          margin-bottom: 16px;
        }

        .sales-items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sales-item-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background-color: #333;
          border: 1px solid #444;
          border-radius: 8px;
          cursor: pointer;
          width: 100%;
          text-align: left;
          color: white;
        }

        .sales-item-btn small {
          color: #4ade80;
        }

        .sales-cart-panel {
          background-color: #2a2a2a;
          border-radius: 12px;
          padding: 20px;
        }

        .sales-cart-title {
          color: white;
          font-size: 18px;
          margin-bottom: 16px;
        }

        .sales-form-group {
          margin-bottom: 16px;
        }

        .sales-form-group label {
          color: #aaa;
          display: block;
          margin-bottom: 5px;
        }

        .sales-select, .sales-input {
          width: 100%;
          padding: 8px;
          background-color: #333;
          border: 1px solid #444;
          border-radius: 8px;
          color: white;
        }

        .sales-cart-items {
          margin-bottom: 16px;
        }

        .sales-cart-item {
          background-color: #333;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .sales-cart-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .sales-cart-item-header strong {
          color: white;
        }

        .sales-remove-btn {
          padding: 4px 8px;
          background-color: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .sales-cart-item-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .sales-quantity-input {
          width: 80px;
          padding: 4px;
          background-color: #1a1a1a;
          border: 1px solid #444;
          border-radius: 4px;
          color: white;
        }

        .sales-item-total {
          color: #4ade80;
        }

        .sales-insumo-panel {
          background-color: #333;
          padding: 12px;
          border-radius: 8px;
          margin-top: 16px;
        }

        .sales-insumo-panel h3 {
          color: white;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .sales-insumo-controls {
          display: flex;
          gap: 8px;
        }

        .sales-insumo-qtd {
          width: 60px;
          padding: 6px;
          background-color: #1a1a1a;
          border: 1px solid #444;
          border-radius: 4px;
          color: white;
        }

        .sales-insumo-valor {
          flex: 1;
          padding: 6px;
          background-color: #1a1a1a;
          border: 1px solid #444;
          border-radius: 4px;
          color: white;
        }

        .sales-insumo-add {
          padding: 6px 12px;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .sales-total {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #444;
          font-weight: bold;
        }

        .sales-total span:first-child {
          color: white;
        }

        .sales-total span:last-child {
          color: #4ade80;
          font-size: 20px;
        }

        .sales-finalize-btn {
          width: 100%;
          margin-top: 16px;
          padding: 12px;
          background-color: #22c55e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .sales-finalize-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .sales-container {
            padding: 16px;
          }

          .sales-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .sales-title {
            font-size: 24px;
          }

          .sales-products-panel,
          .sales-cart-panel {
            padding: 16px;
          }

          .sales-item-btn {
            padding: 10px;
          }

          .sales-cart-item-header {
            flex-wrap: wrap;
            gap: 8px;
          }

          .sales-insumo-controls {
            flex-wrap: wrap;
          }

          .sales-insumo-qtd {
            width: 80px;
          }
        }

        @media (max-width: 480px) {
          .sales-type-buttons {
            flex-direction: column;
          }

          .sales-type-btn {
            width: 100%;
          }

          .sales-cart-item-controls {
            flex-wrap: wrap;
          }

          .sales-quantity-input {
            width: 100%;
          }
        }
      `})]})}export{c as default};