import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ShoppingBag, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicMenu() {
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todos');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    carregarDados();
    carregarCarrinho();
  }, []);

  async function carregarDados() {
    try {
      // Carregar configurações da empresa
      const { data: configData } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1)
        .single();

      setEmpresa(configData);

      // Carregar categorias
      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      setCategorias(categoriasData || []);

      // Carregar produtos
      const { data: produtosData } = await supabase
        .from('estoque')
        .select('*')
        .eq('tipo', 'produto')
        .eq('ativo', true)
        .order('nome');

      setProdutos(produtosData || []);

      // Carregar serviços
      const { data: servicosData } = await supabase
        .from('estoque')
        .select('*')
        .eq('tipo', 'servico')
        .eq('ativo', true)
        .order('nome');

      setServicos(servicosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }

  function carregarCarrinho() {
    const cartSaved = localStorage.getItem('public_cart');
    if (cartSaved) {
      setCart(JSON.parse(cartSaved));
    }
  }

  function salvarCarrinho(novoCart) {
    setCart(novoCart);
    localStorage.setItem('public_cart', JSON.stringify(novoCart));
  }

  function adicionarAoCarrinho(item) {
    const existing = cart.find(cartItem => cartItem.id === item.id);
    if (existing) {
      const updatedCart = cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantidade: cartItem.quantidade + 1 }
          : cartItem
      );
      salvarCarrinho(updatedCart);
    } else {
      salvarCarrinho([...cart, { ...item, quantidade: 1 }]);
    }
    toast.success(`${item.nome} adicionado ao carrinho!`);
  }

  function removerDoCarrinho(itemId) {
    const updatedCart = cart.filter(item => item.id !== itemId);
    salvarCarrinho(updatedCart);
    toast.success('Item removido do carrinho');
  }

  function atualizarQuantidade(itemId, quantidade) {
    if (quantidade <= 0) {
      removerDoCarrinho(itemId);
      return;
    }
    const updatedCart = cart.map(item =>
      item.id === itemId ? { ...item, quantidade } : item
    );
    salvarCarrinho(updatedCart);
  }

  const totalCarrinho = cart.reduce((sum, item) => sum + (item.valor * item.quantidade), 0);

  async function enviarPedido() {
    if (!clienteNome.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    setEnviando(true);

    try {
      // Buscar o número do WhatsApp das configurações (usando whatsapp_admin)
      let whatsappNumber = "5511999999999";
      let enderecoLoja = "R. Luís Nunes, 116A - Bairro Jacaré, Cabreúva - SP, 13315-023";
      
      const { data: configData } = await supabase
        .from('configuracoes')
        .select('whatsapp_admin, endereco_loja')
        .limit(1)
        .single();
      
      if (configData) {
        if (configData.whatsapp_admin) {
          whatsappNumber = configData.whatsapp_admin;
        }
        if (configData.endereco_loja) {
          enderecoLoja = configData.endereco_loja;
        }
      }

      // Formatar o número (remover caracteres não numéricos)
      const numeroLimpo = whatsappNumber.replace(/\D/g, '');
      
      // Validar número
      if (!numeroLimpo || numeroLimpo.length < 10) {
        toast.error('Número de WhatsApp não configurado corretamente');
        setEnviando(false);
        return;
      }

      // Montar a mensagem do pedido
      let mensagem = `🍃 *SMOKE GARDEN* 🍃\n`;
      mensagem += `*Mecânica Especializada 2 Tempos*\n\n`;
      mensagem += `━━━━━━━━━━━━━━━━━━━━\n`;
      mensagem += `*🆕 NOVO PEDIDO DE ORÇAMENTO*\n`;
      mensagem += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      mensagem += `👤 *Cliente:* ${clienteNome}\n`;
      mensagem += `📧 *E-mail:* ${clienteEmail || 'Não informado'}\n`;
      mensagem += `📱 *Telefone:* ${clienteTelefone || 'Não informado'}\n\n`;
      mensagem += `━━━━━━━━━━━━━━━━━━━━\n`;
      mensagem += `*🛒 ITENS DO PEDIDO:*\n`;
      mensagem += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      cart.forEach((item, index) => {
        mensagem += `${index + 1}️⃣ *${item.nome}*\n`;
        mensagem += `   📦 Quantidade: ${item.quantidade}\n`;
        mensagem += `   💰 Valor unitário: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}\n`;
        mensagem += `   📊 Subtotal: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor * item.quantidade)}\n\n`;
      });
      
      mensagem += `━━━━━━━━━━━━━━━━━━━━\n`;
      mensagem += `💰 *TOTAL DO PEDIDO:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCarrinho)}\n`;
      mensagem += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      mensagem += `📍 *Retirar em:*\n${enderecoLoja}\n\n`;
      mensagem += `💬 *Mensagem automática - Por favor, responder o cliente o mais breve possível*`;

      // Codificar a mensagem para URL
      const mensagemCodificada = encodeURIComponent(mensagem);
      
      // Criar link do WhatsApp
      const whatsappUrl = `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`;
      
      // Abrir WhatsApp em nova aba
      window.open(whatsappUrl, '_blank');
      
      // Salvar pedido no banco como backup
      try {
        await supabase
          .from('pedidos_publicos')
          .insert([{
            cliente_nome: clienteNome,
            cliente_email: clienteEmail || null,
            cliente_telefone: clienteTelefone || null,
            status: 'enviado_whatsapp',
            total: totalCarrinho,
            itens: cart.map(item => ({
              id: item.id,
              nome: item.nome,
              valor: item.valor,
              quantidade: item.quantidade
            }))
          }]);
      } catch (dbError) {
        console.log('Não foi possível salvar no banco, mas WhatsApp foi enviado');
      }
      
      // Limpar carrinho e fechar modal
      salvarCarrinho([]);
      setClienteNome('');
      setClienteEmail('');
      setClienteTelefone('');
      setShowCart(false);
      
      toast.success('Pedido enviado para o WhatsApp com sucesso!');
      
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      toast.error('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  const itensExibir = categoriaSelecionada === 'todos' 
    ? [...produtos, ...servicos]
    : categoriaSelecionada === 'produtos' 
      ? produtos 
      : servicos;

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#D95A1A', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '28px', margin: 0 }}>Smoke Garden</h1>
        <p style={{ color: '#FFD700', margin: '5px 0 0' }}>Mecânica Especializada 2 Tempos</p>
        {empresa?.endereco_loja && (
          <p style={{ color: 'white', fontSize: '12px', margin: '10px 0 0' }}>
            <MapPin size={14} style={{ display: 'inline', marginRight: '5px' }} />
            {empresa.endereco_loja}
          </p>
        )}
      </header>

      {/* Navegação */}
      <div style={{ backgroundColor: '#2a2a2a', padding: '10px', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setCategoriaSelecionada('todos')}
          style={{
            padding: '8px 16px',
            backgroundColor: categoriaSelecionada === 'todos' ? '#D95A1A' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Catálogo
        </button>
        <button
          onClick={() => setCategoriaSelecionada('produtos')}
          style={{
            padding: '8px 16px',
            backgroundColor: categoriaSelecionada === 'produtos' ? '#D95A1A' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Produtos
        </button>
        <button
          onClick={() => setCategoriaSelecionada('servicos')}
          style={{
            padding: '8px 16px',
            backgroundColor: categoriaSelecionada === 'servicos' ? '#D95A1A' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Serviços
        </button>
        <button
          onClick={() => setShowCart(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShoppingBag size={18} />
          Carrinho ({cart.length})
        </button>
      </div>

      {/* Itens */}
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {itensExibir.map((item) => (
            <div key={item.id} style={{ backgroundColor: '#2a2a2a', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
              {item.imagem_url && (
                <img 
                  src={item.imagem_url} 
                  alt={item.nome}
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div style={{ padding: '16px' }}>
                <h3 style={{ color: 'white', fontSize: '18px', margin: '0 0 8px 0' }}>{item.nome}</h3>
                {item.descricao && (
                  <p style={{ color: '#aaa', fontSize: '14px', margin: '0 0 12px 0' }}>{item.descricao}</p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#4ade80', fontSize: '20px', fontWeight: 'bold' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                  </span>
                  <button
                    onClick={() => adicionarAoCarrinho(item)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#D95A1A',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Pedir Orçamento
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal do Carrinho */}
      {showCart && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'white', margin: 0 }}>Seu Carrinho</h2>
              <button
                onClick={() => setShowCart(false)}
                style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Fechar
              </button>
            </div>

            {cart.length === 0 ? (
              <p style={{ color: '#aaa', textAlign: 'center', padding: '40px' }}>Carrinho vazio</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} style={{ backgroundColor: '#333', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>{item.nome}</p>
                        <p style={{ color: '#4ade80', margin: '5px 0 0' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) => atualizarQuantidade(item.id, parseInt(e.target.value) || 1)}
                          style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', textAlign: 'center' }}
                        />
                        <button
                          onClick={() => removerDoCarrinho(item.id)}
                          style={{ padding: '5px 10px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #444', paddingTop: '15px', marginTop: '10px' }}>
                  <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                    Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCarrinho)}
                  </p>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <input
                    type="text"
                    placeholder="Seu nome *"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#333', color: 'white' }}
                  />
                  <input
                    type="email"
                    placeholder="Seu email"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#333', color: 'white' }}
                  />
                  <input
                    type="tel"
                    placeholder="Seu telefone"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#333', color: 'white' }}
                  />
                  <button
                    onClick={enviarPedido}
                    disabled={enviando}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: enviando ? '#666' : '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: enviando ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >
                    {enviando ? 'Enviando...' : '📱 Enviar Pedido via WhatsApp'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ backgroundColor: '#111', padding: '20px', textAlign: 'center', marginTop: '40px' }}>
        <p style={{ color: '#666', fontSize: '12px' }}>
          © {new Date().getFullYear()} Smoke Garden - Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}