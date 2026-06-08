import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ShoppingBag, MapPin, Plus, Minus, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicMenu() {
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todos');
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [avaliacaoNota, setAvaliacaoNota] = useState(5);
  const [avaliacaoNome, setAvaliacaoNome] = useState('');
  const [avaliacaoComentario, setAvaliacaoComentario] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [showAvaliacaoForm, setShowAvaliacaoForm] = useState(false);

  const calcularTotalItens = (carrinho) => {
    return carrinho.reduce((sum, item) => sum + (item.quantidade || 1), 0);
  };

  const forceRerender = () => setRefreshKey(prev => prev + 1);

  async function carregarAvaliacoes() {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('aprovado', true)
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (!error && data) {
      setAvaliacoes(data);
    }
  }

  useEffect(() => {
    carregarDados();
    carregarAvaliacoes();
    const cartSaved = localStorage.getItem('public_cart');
    if (cartSaved) {
      try {
        const parsedCart = JSON.parse(cartSaved);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
          setCartCount(calcularTotalItens(parsedCart));
        }
      } catch (e) {
        console.error('Erro ao carregar carrinho:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('public_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('public_cart');
    }
    setCartCount(calcularTotalItens(cart));
  }, [cart]);

  async function carregarDados() {
    try {
      const { data: configData, error: configError } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', configError);
      }

      setEmpresa(configData || {
        endereco_loja: 'R. Luís Nunes, 116A - Bairro Jacaré, Cabreúva - SP, 13315-023',
        whatsapp_admin: '5511999999999'
      });

      const { data: produtosData, error: produtosError } = await supabase
        .from('estoque')
        .select('*')
        .eq('tipo', 'produto')
        .eq('ativo', true)
        .order('nome');

      if (produtosError) {
        console.error('Erro ao carregar produtos:', produtosError);
      }
      setProdutos(produtosData || []);

      const { data: servicosData, error: servicosError } = await supabase
        .from('estoque')
        .select('*')
        .eq('tipo', 'servico')
        .eq('ativo', true)
        .order('nome');

      if (servicosError) {
        console.error('Erro ao carregar serviços:', servicosError);
      }
      setServicos(servicosData || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar os dados. Recarregue a página.');
    }
  }

  async function enviarAvaliacao() {
    if (!avaliacaoNome.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }
    if (!avaliacaoComentario.trim()) {
      toast.error('Por favor, escreva um comentário');
      return;
    }

    setEnviandoAvaliacao(true);

    try {
      const { error } = await supabase
        .from('avaliacoes')
        .insert([{
          nome_cliente: avaliacaoNome,
          nota: avaliacaoNota,
          comentario: avaliacaoComentario,
          aprovado: false,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Avaliação enviada! Aguarde aprovação.');
      setAvaliacaoNome('');
      setAvaliacaoComentario('');
      setAvaliacaoNota(5);
      setShowAvaliacaoForm(false);
      
      carregarAvaliacoes();
      
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast.error('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setEnviandoAvaliacao(false);
    }
  }

  function renderStars(nota) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= nota) {
        stars.push(<Star key={i} size={16} fill="#FFD700" color="#FFD700" />);
      } else {
        stars.push(<Star key={i} size={16} color="#555" />);
      }
    }
    return stars;
  }

  function adicionarAoCarrinho(item) {
    const existingIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    let novoCart;
    
    if (existingIndex !== -1) {
      novoCart = [...cart];
      novoCart[existingIndex] = {
        ...novoCart[existingIndex],
        quantidade: (novoCart[existingIndex].quantidade || 1) + 1
      };
    } else {
      novoCart = [...cart, { ...item, quantidade: 1 }];
    }
    
    const novoTotal = calcularTotalItens(novoCart);
    
    setCart(novoCart);
    setCartCount(novoTotal);
    forceRerender();
    
    toast.success(`${item.nome} adicionado ao carrinho! (Total: ${novoTotal} itens)`, {
      duration: 1500,
      position: 'bottom-center'
    });
  }

  function removerDoCarrinho(itemId) {
    const novoCart = cart.filter(item => item.id !== itemId);
    const novoTotal = calcularTotalItens(novoCart);
    setCart(novoCart);
    setCartCount(novoTotal);
    forceRerender();
    toast.success('Item removido do carrinho');
  }

  function atualizarQuantidade(itemId, quantidade) {
    if (quantidade <= 0) {
      removerDoCarrinho(itemId);
      return;
    }
    const novoCart = cart.map(item =>
      item.id === itemId ? { ...item, quantidade: quantidade } : item
    );
    const novoTotal = calcularTotalItens(novoCart);
    setCart(novoCart);
    setCartCount(novoTotal);
    forceRerender();
  }

  const totalCarrinho = cart.reduce((sum, item) => sum + (item.valor * (item.quantidade || 1)), 0);

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

      const numeroLimpo = whatsappNumber.replace(/\D/g, '');
      
      if (!numeroLimpo || numeroLimpo.length < 10) {
        toast.error('Número de WhatsApp não configurado corretamente');
        setEnviando(false);
        return;
      }

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
        mensagem += `   📦 Quantidade: ${item.quantidade || 1}\n`;
        mensagem += `   💰 Valor unitário: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}\n`;
        mensagem += `   📊 Subtotal: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor * (item.quantidade || 1))}\n\n`;
      });
      
      mensagem += `━━━━━━━━━━━━━━━━━━━━\n`;
      mensagem += `💰 *TOTAL DO PEDIDO:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCarrinho)}\n`;
      mensagem += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      mensagem += `📍 *Retirar em:*\n${enderecoLoja}\n\n`;
      mensagem += `💬 *Mensagem automática - Por favor, responder o cliente o mais breve possível*`;

      const mensagemCodificada = encodeURIComponent(mensagem);
      const whatsappUrl = `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`;
      
      window.open(whatsappUrl, '_blank');
      
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
              quantidade: item.quantidade || 1
            }))
          }]);
      } catch (dbError) {
        console.log('Não foi possível salvar no banco');
      }
      
      setCart([]);
      setCartCount(0);
      localStorage.removeItem('public_cart');
      setClienteNome('');
      setClienteEmail('');
      setClienteTelefone('');
      setShowCart(false);
      forceRerender();
      
      toast.success('Pedido enviado para o WhatsApp com sucesso!');
      
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      toast.error('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  const itensExibir = categoriaSelecionada === 'todos' 
    ? [...produtos, ...servicos].sort((a, b) => a.nome.localeCompare(b.nome))
    : categoriaSelecionada === 'produtos' 
      ? produtos 
      : servicos;

  return (
    <div key={refreshKey} style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
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
          📦 Todos
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
          🛒 Produtos
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
          🔧 Serviços
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
          🛒 Carrinho ({cartCount})
        </button>
      </div>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {itensExibir.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: '#aaa', fontSize: '18px' }}>Nenhum item encontrado no catálogo.</p>
          </div>
        ) : (
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
                      🛒 Adicionar ao Carrinho
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#2a2a2a', marginTop: '40px', padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ color: '#D95A1A', fontSize: '28px', textAlign: 'center', marginBottom: '30px' }}>
            ⭐ Avaliações dos Clientes
          </h2>

          {avaliacoes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {avaliacoes.map((avaliacao) => (
                <div key={avaliacao.id} style={{ backgroundColor: '#333', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    {renderStars(avaliacao.nota)}
                  </div>
                  <p style={{ color: '#ddd', fontSize: '14px', marginBottom: '10px' }}>"{avaliacao.comentario}"</p>
                  <p style={{ color: '#D95A1A', fontWeight: 'bold', fontSize: '14px' }}>— {avaliacao.nome_cliente}</p>
                  <p style={{ color: '#666', fontSize: '11px', marginTop: '8px' }}>
                    {new Date(avaliacao.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#888', marginBottom: '30px' }}>
              Seja o primeiro a avaliar nossa loja!
            </p>
          )}

          {!showAvaliacaoForm ? (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowAvaliacaoForm(true)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#D95A1A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                ✍️ Deixe sua avaliação
              </button>
            </div>
          ) : (
            <div style={{ backgroundColor: '#333', borderRadius: '12px', padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>Deixe sua opinião</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Seu nome *</label>
                <input
                  type="text"
                  value={avaliacaoNome}
                  onChange={(e) => setAvaliacaoNome(e.target.value)}
                  placeholder="Digite seu nome"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Nota *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((nota) => (
                    <button
                      key={nota}
                      onClick={() => setAvaliacaoNota(nota)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: avaliacaoNota === nota ? '#D95A1A' : '#444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      {nota} ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Comentário *</label>
                <textarea
                  value={avaliacaoComentario}
                  onChange={(e) => setAvaliacaoComentario(e.target.value)}
                  placeholder="Compartilhe sua experiência..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    color: 'white',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={enviarAvaliacao}
                  disabled={enviandoAvaliacao}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: enviandoAvaliacao ? '#666' : '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: enviandoAvaliacao ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {enviandoAvaliacao ? 'Enviando...' : '📨 Enviar Avaliação'}
                </button>
                <button
                  onClick={() => setShowAvaliacaoForm(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#555',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCart && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
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
              <h2 style={{ color: 'white', margin: 0 }}>🛒 Seu Carrinho ({cartCount})</h2>
              <button
                onClick={() => setShowCart(false)}
                style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                ✕ Fechar
              </button>
            </div>

            {cart.length === 0 ? (
              <p style={{ color: '#aaa', textAlign: 'center', padding: '40px' }}>Carrinho vazio</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} style={{ backgroundColor: '#333', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>{item.nome}</p>
                        <p style={{ color: '#4ade80', margin: '5px 0 0' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => atualizarQuantidade(item.id, (item.quantidade || 1) - 1)}
                          style={{ padding: '5px 10px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ color: 'white', minWidth: '30px', textAlign: 'center' }}>{item.quantidade || 1}</span>
                        <button
                          onClick={() => atualizarQuantidade(item.id, (item.quantidade || 1) + 1)}
                          style={{ padding: '5px 10px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => removerDoCarrinho(item.id)}
                          style={{ padding: '5px 10px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
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
                    placeholder="WhatsApp para contato"
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
                    {enviando ? '📤 Enviando...' : '📱 Enviar Pedido via WhatsApp'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <footer style={{ backgroundColor: '#111', padding: '20px', textAlign: 'center', marginTop: '40px' }}>
        <p style={{ color: '#666', fontSize: '12px' }}>
          © {new Date().getFullYear()} Smoke Garden - Todos os direitos reservados
        </p>
        <p style={{ color: '#555', fontSize: '10px', marginTop: '10px' }}>
          Retire seu pedido em nossa loja física
        </p>
      </footer>
    </div>
  );
}