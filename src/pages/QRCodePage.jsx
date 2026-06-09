import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient'
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function QRCodePage() {
  const [loading, setLoading] = useState(false);
  const qrCodeRef = useRef(null);

  const url = 'https://smokegarden.vercel.app/public';

  const handleDownloadQRCode = () => {
    try {
      const canvas = qrCodeRef.current?.querySelector('canvas');
      if (!canvas) {
        toast.error('Não foi possível gerar o QR Code');
        return;
      }
      
      const link = document.createElement('a');
      link.download = 'qrcode-smokegarden.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('QR Code baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao baixar o QR Code');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Smoke Garden - Catálogo',
      text: 'Escaneie o QR Code para acessar nosso catálogo de produtos e serviços!',
      url: url
    };

    try {
      if (navigator.share && window.innerWidth <= 768) {
        await navigator.share(shareData);
        toast.success('Compartilhado com sucesso!');
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', error);
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência!');
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar o link');
    }
  };

  if (loading) {
    return (
      <div className="loading-root">
        <div className="spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="qrcode-page">
      <div className="qrcode-container" ref={qrCodeRef}>
        <h1 className="qrcode-title">QR Code do Catálogo</h1>
        
        <p className="qrcode-subtitle">
          Escaneie o QR Code para acessar nosso catálogo de produtos e serviços
        </p>

        {/* QR Code */}
        <div className="qrcode-box">
          <QRCodeCanvas 
            value={url} 
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* URL */}
        <div className="qrcode-url">
          <p>{url}</p>
        </div>

        {/* Botões */}
        <div className="qrcode-buttons">
          <button onClick={handleDownloadQRCode} className="btn-qrcode btn-primary">
            📥 Baixar QR Code
          </button>
          
          <button onClick={handleShare} className="btn-qrcode btn-share">
            📤 Compartilhar
          </button>
          
          <button onClick={handleCopyLink} className="btn-qrcode btn-secondary">
            🔗 Copiar Link
          </button>
        </div>

        {/* Footer */}
        <p className="qrcode-footer">
          Escaneie com a câmera do seu celular ou compartilhe o link
        </p>
      </div>

      <style jsx>{`
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
      `}</style>
    </div>
  );
}