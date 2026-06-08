import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient'
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function QRCodePage() {
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const qrCodeRef = useRef(null);

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  async function carregarConfiguracoes() {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setEmpresa(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  }

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
        // Fallback: copiar link
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
      <div style={{ textAlign: 'center', padding: '50px', color: '#ccc' }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div ref={qrCodeRef} style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        {/* Logo ou Título */}
        {empresa?.logo_url ? (
          <img 
            src={empresa.logo_url} 
            alt="Logo" 
            style={{ 
              maxWidth: '150px', 
              maxHeight: '80px', 
              marginBottom: '20px',
              objectFit: 'contain'
            }} 
          />
        ) : (
          <h1 style={{ color: '#D95A1A', fontSize: '28px', marginBottom: '20px' }}>
            Smoke Garden
          </h1>
        )}
        
        <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '8px' }}>
          Mecânica Especializada 2 Tempos
        </h2>
        
        <p style={{ color: '#FFD700', fontSize: '14px', marginBottom: '30px' }}>
          Escaneie o QR Code para acessar nosso catálogo
        </p>

        {/* QR Code */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '16px',
          display: 'inline-block',
          marginBottom: '30px'
        }}>
          <QRCodeCanvas 
            value={url} 
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* URL */}
        <p style={{ 
          color: '#888', 
          fontSize: '12px', 
          marginBottom: '30px',
          wordBreak: 'break-all',
          backgroundColor: '#1a1a1a',
          padding: '10px',
          borderRadius: '8px'
        }}>
          {url}
        </p>

        {/* Botões */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button
            onClick={handleDownloadQRCode}
            style={{
              padding: '12px 24px',
              backgroundColor: '#D95A1A',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b84a14'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D95A1A'}
          >
            📥 Baixar QR Code
          </button>
          
          <button
            onClick={handleShare}
            style={{
              padding: '12px 24px',
              backgroundColor: '#25D366',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#128C7E'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#25D366'}
          >
            📤 Compartilhar
          </button>
          
          <button
            onClick={handleCopyLink}
            style={{
              padding: '12px 24px',
              backgroundColor: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#333'}
          >
            🔗 Copiar Link
          </button>
        </div>

        {/* Footer */}
        <p style={{ color: '#666', fontSize: '11px', marginTop: '30px' }}>
          Escaneie com a câmera do seu celular ou compartilhe o link
        </p>
      </div>
    </div>
  );
}