import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeGenerator({ url, size = 150 }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '12px', border: '1px solid #333' }}>
      <h3 style={{ color: '#D95A1A', marginBottom: '10px' }}>Catálogo Online</h3>
      <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '15px' }}>Escaneie o QR Code para acessar nosso catálogo</p>
      <QRCodeSVG 
        value={url} 
        size={size}
        bgColor="#ffffff"
        fgColor="#D95A1A"
        level="H"
        includeMargin={true}
      />
      <p style={{ color: '#888', fontSize: '11px', marginTop: '15px', wordBreak: 'break-all' }}>
        {url}
      </p>
    </div>
  );
}