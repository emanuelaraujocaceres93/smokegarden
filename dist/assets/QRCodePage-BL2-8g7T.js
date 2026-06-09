import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{E as t,L as n,T as r,t as i}from"./vendor-react-DPcV1OcH.js";import"./index-EeliWgz-.js";var a=e(n(),1),o=r();function s(){let[e,n]=(0,a.useState)(!1),r=(0,a.useRef)(null),s=`https://smokegarden.vercel.app/public`;return e?(0,o.jsxs)(`div`,{className:`loading-root`,children:[(0,o.jsx)(`div`,{className:`spinner`}),(0,o.jsx)(`p`,{children:`Carregando...`})]}):(0,o.jsxs)(`div`,{className:`qrcode-page`,children:[(0,o.jsxs)(`div`,{className:`qrcode-container`,ref:r,children:[(0,o.jsx)(`h1`,{className:`qrcode-title`,children:`QR Code do Catálogo`}),(0,o.jsx)(`p`,{className:`qrcode-subtitle`,children:`Escaneie o QR Code para acessar nosso catálogo de produtos e serviços`}),(0,o.jsx)(`div`,{className:`qrcode-box`,children:(0,o.jsx)(i,{value:s,size:200,level:`H`,includeMargin:!0})}),(0,o.jsx)(`div`,{className:`qrcode-url`,children:(0,o.jsx)(`p`,{children:s})}),(0,o.jsxs)(`div`,{className:`qrcode-buttons`,children:[(0,o.jsx)(`button`,{onClick:()=>{try{let e=r.current?.querySelector(`canvas`);if(!e){t.error(`Não foi possível gerar o QR Code`);return}let n=document.createElement(`a`);n.download=`qrcode-smokegarden.png`,n.href=e.toDataURL(`image/png`),n.click(),t.success(`QR Code baixado com sucesso!`)}catch(e){console.error(`Erro ao baixar:`,e),t.error(`Erro ao baixar o QR Code`)}},className:`btn-qrcode btn-primary`,children:`📥 Baixar QR Code`}),(0,o.jsx)(`button`,{onClick:async()=>{let e={title:`Smoke Garden - Catálogo`,text:`Escaneie o QR Code para acessar nosso catálogo de produtos e serviços!`,url:s};try{navigator.share&&window.innerWidth<=768?(await navigator.share(e),t.success(`Compartilhado com sucesso!`)):(await navigator.clipboard.writeText(s),t.success(`Link copiado para a área de transferência!`))}catch(e){e.name!==`AbortError`&&(console.error(`Erro ao compartilhar:`,e),await navigator.clipboard.writeText(s),t.success(`Link copiado para a área de transferência!`))}},className:`btn-qrcode btn-share`,children:`📤 Compartilhar`}),(0,o.jsx)(`button`,{onClick:async()=>{try{await navigator.clipboard.writeText(s),t.success(`Link copiado para a área de transferência!`)}catch(e){console.error(`Erro ao copiar:`,e),t.error(`Erro ao copiar o link`)}},className:`btn-qrcode btn-secondary`,children:`🔗 Copiar Link`})]}),(0,o.jsx)(`p`,{className:`qrcode-footer`,children:`Escaneie com a câmera do seu celular ou compartilhe o link`})]}),(0,o.jsx)(`style`,{jsx:!0,children:`
        .qrcode-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .qrcode-container {
          background-color: #2a2a2a;
          border-radius: 24px;
          padding: 40px;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }

        .qrcode-title {
          color: #D95A1A;
          font-size: 28px;
          margin-bottom: 12px;
        }

        .qrcode-subtitle {
          color: #FFD700;
          font-size: 14px;
          margin-bottom: 30px;
        }

        .qrcode-box {
          background-color: white;
          padding: 20px;
          border-radius: 16px;
          display: inline-block;
          margin-bottom: 30px;
        }

        .qrcode-url {
          background-color: #1a1a1a;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .qrcode-url p {
          color: #888;
          font-size: 12px;
          word-break: break-all;
          margin: 0;
        }

        .qrcode-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 20px;
        }

        .btn-qrcode {
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background-color: #D95A1A;
          color: white;
        }

        .btn-primary:hover {
          background-color: #b84a14;
          transform: translateY(-2px);
        }

        .btn-share {
          background-color: #25D366;
          color: white;
        }

        .btn-share:hover {
          background-color: #128C7E;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background-color: #333;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #444;
          transform: translateY(-2px);
        }

        .qrcode-footer {
          color: #666;
          font-size: 11px;
          margin: 0;
        }

        /* Responsividade */
        @media (max-width: 480px) {
          .qrcode-container {
            padding: 24px;
          }

          .qrcode-title {
            font-size: 24px;
          }

          .qrcode-subtitle {
            font-size: 12px;
          }

          .qrcode-box {
            padding: 15px;
          }

          .qrcode-box canvas {
            width: 160px;
            height: 160px;
          }

          .btn-qrcode {
            padding: 10px 16px;
            font-size: 12px;
          }

          .qrcode-buttons {
            gap: 8px;
          }
        }

        @media (max-width: 380px) {
          .qrcode-buttons {
            flex-direction: column;
          }

          .btn-qrcode {
            justify-content: center;
            width: 100%;
          }
        }
      `})]})}export{s as default};