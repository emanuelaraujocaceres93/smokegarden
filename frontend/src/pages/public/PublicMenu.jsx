import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ShoppingBag, MapPin, Plus, Minus, Trash2, Star, X, User } from 'lucide-react';
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
  const [hoveredCard, setHoveredCard] = useState(null);

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

  function renderStars(nota, size = 16) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={size} 
          fill={i <= nota ? "#FFD700" : "none"} 
          color={i <= nota ? "#FFD700" : "#555"}
          style={{ cursor: 'default' }}
        />
      );
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
    
    toast.success(`${item.nome} adicionado ao carrinho!`, {
      duration: 1500,
      position: 'bottom-center',
      icon: '🛒'
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
        if (configData.whatsapp_admin) whatsappNumber = configData.whatsapp_admin;
        if (configData.endereco_loja) enderecoLoja = configData.endereco_loja;
      }

      const numeroLimpo = whatsappNumber.replace(/\D/g, '');
      
      if (!numeroLimpo || numeroLimpo.length < 10) {
        toast.error('Número de WhatsApp não configurado corretamente');
        setEnviando(false);
        return;
      }

      console.log('=== INICIANDO PEDIDO ===');
      console.log('Cliente:', clienteNome);
      console.log('Total do carrinho:', totalCarrinho);
      console.log('Itens no carrinho:', cart.length);

      // 1. SALVAR NO PEDIDOS_PUBLICOS
      const { data: pedidoPublico, error: pedidoError } = await supabase
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
        }])
        .select();

      if (pedidoError) {
        console.error('ERRO ao salvar pedido público:', pedidoError);
      } else {
        console.log('Pedido público salvo com sucesso:', pedidoPublico);
      }

      const pedidoPublicoId = pedidoPublico && pedidoPublico[0] ? pedidoPublico[0].id : null;

      // 2. CRIAR ORÇAMENTO NO SISTEMA
      const numeroOrcamento = `PUB-${Date.now().toString(36).toUpperCase()}`;
      
      console.log('Tentando criar orçamento com número:', numeroOrcamento);
      
      const orcamentoData = {
        numero_orcamento: numeroOrcamento,
        cliente_nome: clienteNome,
        cliente_email: clienteEmail || null,
        cliente_telefone: clienteTelefone || null,
        total: totalCarrinho,
        status: 'pendente',
        origem: 'publico',
        pedido_publico_id: pedidoPublicoId,
        data_criacao: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      console.log('Dados do orçamento:', orcamentoData);
      
      const { data: orcamento, error: orcamentoError } = await supabase
        .from('orcamentos')
        .insert([orcamentoData])
        .select();

      if (orcamentoError) {
        console.error('ERRO DETALHADO ao criar orçamento:', orcamentoError);
        toast.error(`Erro ao criar orçamento: ${orcamentoError.message}`);
        setEnviando(false);
        return;
      }
      
      if (!orcamento || orcamento.length === 0) {
        console.error('Orçamento não retornou dados após inserção');
        toast.error('Erro ao criar orçamento: nenhum dado retornado');
        setEnviando(false);
        return;
      }
      
      const orcamentoId = orcamento[0].id;
      console.log('Orçamento criado com ID:', orcamentoId);

      // 3. ADICIONAR ITENS AO ORÇAMENTO
      let itensAdicionados = 0;
      for (const item of cart) {
        const itemData = {
          orcamento_id: orcamentoId,
          produto_id: item.id,
          produto_nome: item.nome,
          produto_descricao: item.descricao || '',
          quantidade: item.quantidade || 1,
          preco_unitario: item.valor,
          preco_total: (item.valor * (item.quantidade || 1)),
          tipo: item.tipo === 'servico' ? 'servico' : 'produto'
        };
        
        const { error: itemError } = await supabase
          .from('orcamento_itens')
          .insert([itemData]);

        if (itemError) {
          console.error(`Erro ao adicionar item ${item.nome}:`, itemError);
        } else {
          itensAdicionados++;
        }
      }
      
      console.log(`${itensAdicionados} de ${cart.length} itens adicionados ao orçamento`);

      // 4. REGISTRAR CONVERSÃO
      if (pedidoPublicoId) {
        const { error: convError } = await supabase
          .from('pedidos_publicos_convertidos')
          .insert([{
            pedido_publico_id: pedidoPublicoId,
            orcamento_id: orcamentoId,
            convertido_em: new Date().toISOString()
          }]);
        
        if (convError) {
          console.error('Erro ao registrar conversão:', convError);
        } else {
          console.log('Conversão registrada com sucesso');
        }
      }

      toast.success(`Orçamento #${numeroOrcamento} criado! Aguardando aprovação.`);
      console.log('=== PEDIDO FINALIZADO COM SUCESSO ===');

      // 5. ENVIAR WHATSAPP
      let mensagem = "*SMOKE GARDEN*\n";
      mensagem += "Mecânica Especializada 2 Tempos\n\n";
      mensagem += "━━━━━━━━━━━━━━━━━━━━\n";
      mensagem += "NOVO PEDIDO DE ORÇAMENTO\n";
      mensagem += "━━━━━━━━━━━━━━━━━━━━\n\n";
      mensagem += `Cliente: ${clienteNome}\n`;
      if (clienteEmail) mensagem += `E-mail: ${clienteEmail}\n`;
      if (clienteTelefone) mensagem += `Telefone: ${clienteTelefone}\n`;
      mensagem += "\n━━━━━━━━━━━━━━━━━━━━\n";
      mensagem += "ITENS DO PEDIDO\n";
      mensagem += "━━━━━━━━━━━━━━━━━━━━\n\n";
      
      cart.forEach((item, index) => {
        mensagem += `${index + 1}. ${item.nome}\n`;
        mensagem += `   Quantidade: ${item.quantidade || 1}\n`;
        mensagem += `   Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}\n\n`;
      });
      
      mensagem += "━━━━━━━━━━━━━━━━━━━━\n";
      mensagem += `TOTAL: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCarrinho)}\n`;
      mensagem += "━━━━━━━━━━━━━━━━━━━━\n\n";
      mensagem += `Retirar em:\n${enderecoLoja}\n\n`;
      mensagem += "_Mensagem automática - Responder o cliente o mais breve possível_";

      const mensagemCodificada = encodeURIComponent(mensagem);
      const whatsappUrl = `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`;
      window.open(whatsappUrl, '_blank');
      
      // 6. LIMPAR CARRINHO
      setCart([]);
      setCartCount(0);
      localStorage.removeItem('public_cart');
      setClienteNome('');
      setClienteEmail('');
      setClienteTelefone('');
      setShowCart(false);
      forceRerender();
      
    } catch (error) {
      console.error('ERRO GERAL no enviarPedido:', error);
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

  const cardStyle = {
    backgroundColor: '#2a2a2a',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #333',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#D95A1A',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  return (
    <div key={refreshKey} style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <header style={{ 
        backgroundColor: '#D95A1A', 
        padding: '30px 20px', 
        textAlign: 'center',
        backgroundImage: 'linear-gradient(135deg, #D95A1A 0%, #b84a14 100%)'
      }}>
        <h1 style={{ color: 'white', fontSize: '32px', margin: 0, letterSpacing: '-0.5px' }}>SMOKE GARDEN</h1>
        <p style={{ color: '#FFD700', margin: '8px 0 0', fontSize: '14px', fontWeight: '500' }}>
          Mecânica Especializada 2 Tempos
        </p>
        {empresa?.endereco_loja && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '6px',
            marginTop: '12px',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '12px'
          }}>
            <MapPin size={14} />
            <span>{empresa.endereco_loja}</span>
          </div>
        )}
      </header>

      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '12px 20px',
        display: 'flex', 
        justifyContent: 'center', 
        gap: '12px', 
        flexWrap: 'wrap',
        borderBottom: '1px solid #333',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {['todos', 'produtos', 'servicos'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaSelecionada(cat)}
            style={{
              padding: '8px 20px',
              backgroundColor: categoriaSelecionada === cat ? '#D95A1A' : 'transparent',
              color: 'white',
              border: categoriaSelecionada === cat ? 'none' : '1px solid #444',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            {cat === 'todos' && '📦 Todos'}
            {cat === 'produtos' && '🛒 Produtos'}
            {cat === 'servicos' && '🔧 Serviços'}
          </button>
        ))}
        <button
          onClick={() => setShowCart(true)}
          style={{
            padding: '8px 20px',
            backgroundColor: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500'
          }}
        >
          <ShoppingBag size={18} />
          Carrinho {cartCount > 0 && `(${cartCount})`}
        </button>
      </div>

      <div style={{ padding: '40px 20px', maxWidth: '1280px', margin: '0 auto' }}>
        {itensExibir.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ color: '#888', fontSize: '18px' }}>Nenhum item encontrado no catálogo.</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '24px' 
          }}>
            {itensExibir.map((item) => (
              <div 
                key={item.id} 
                style={cardStyle}
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {item.imagem_url ? (
                  <img 
                    src={item.imagem_url} 
                    alt={item.nome}
                    style={{ 
                      width: '100%', 
                      height: '200px', 
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                      transform: hoveredCard === item.id ? 'scale(1.05)' : 'scale(1)'
                    }} 
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '200px', 
                    backgroundColor: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666'
                  }}>
                    📦 Sem imagem
                  </div>
                )}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ color: 'white', fontSize: '18px', margin: '0 0 8px 0', fontWeight: '600' }}>
                    {item.nome}
                  </h3>
                  {item.descricao && (
                    <p style={{ color: '#aaa', fontSize: '14px', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                      {item.descricao.length > 80 ? item.descricao.substring(0, 80) + '...' : item.descricao}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ 
                      color: '#4ade80', 
                      fontSize: '22px', 
                      fontWeight: 'bold',
                      fontFamily: 'monospace'
                    }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                    </span>
                    <button
                      onClick={() => adicionarAoCarrinho(item)}
                      style={buttonStyle}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b84a14'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D95A1A'}
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#2a2a2a', marginTop: '40px', padding: '60px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ color: '#D95A1A', fontSize: '32px', marginBottom: '8px' }}>
              O que nossos clientes dizem
            </h2>
            <p style={{ color: '#888', fontSize: '16px' }}>
              Avaliações reais de quem confia no nosso trabalho
            </p>
          </div>

          {avaliacoes.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '24px',
              marginBottom: '40px'
            }}>
              {avaliacoes.map((avaliacao) => (
                <div key={avaliacao.id} style={{ 
                  backgroundColor: '#333', 
                  borderRadius: '16px', 
                  padding: '24px',
                  transition: 'transform 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                    {renderStars(avaliacao.nota, 18)}
                  </div>
                  <p style={{ color: '#ddd', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
                    "{avaliacao.comentario}"
                  </p>
                  <div>
                    <p style={{ color: '#D95A1A', fontWeight: 'bold', fontSize: '14px' }}>
                      — {avaliacao.nome_cliente}
                    </p>
                    <p style={{ color: '#666', fontSize: '11px', marginTop: '8px' }}>
                      {new Date(avaliacao.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#888', marginBottom: '40px' }}>
              Seja o primeiro a avaliar nossa loja!
            </p>
          )}

          {!showAvaliacaoForm ? (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowAvaliacaoForm(true)}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#D95A1A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b84a14'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D95A1A'}
              >
                ✍️ Deixe sua avaliação
              </button>
            </div>
          ) : (
            <div style={{ 
              backgroundColor: '#333', 
              borderRadius: '16px', 
              padding: '32px', 
              maxWidth: '520px', 
              margin: '0 auto' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '20px' }}>Compartilhe sua experiência</h3>
                <button 
                  onClick={() => setShowAvaliacaoForm(false)}
                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                  Seu nome *
                </label>
                <input
                  type="text"
                  value={avaliacaoNome}
                  onChange={(e) => setAvaliacaoNome(e.target.value)}
                  placeholder="Digite seu nome"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                  Nota *
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[1, 2, 3, 4, 5].map((nota) => (
                    <button
                      key={nota}
                      onClick={() => setAvaliacaoNota(nota)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: avaliacaoNota === nota ? '#D95A1A' : '#444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {nota} ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                  Comentário *
                </label>
                <textarea
                  value={avaliacaoComentario}
                  onChange={(e) => setAvaliacaoComentario(e.target.value)}
                  placeholder="Conte como foi sua experiência..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    color: 'white',
                    resize: 'vertical',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={enviarAvaliacao}
                  disabled={enviandoAvaliacao}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: enviandoAvaliacao ? '#666' : '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: enviandoAvaliacao ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {enviandoAvaliacao ? 'Enviando...' : 'Enviar Avaliação'}
                </button>
                <button
                  onClick={() => setShowAvaliacaoForm(false)}
                  style={{
                    padding: '12px 24px',
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
          backgroundColor: 'rgba(0,0,0,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '520px',
            maxHeight: '85vh',
            overflow: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
                🛒 Seu Carrinho ({cartCount})
              </h2>
              <button
                onClick={() => setShowCart(false)}
                style={{ padding: '8px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <ShoppingBag size={48} style={{ color: '#666', marginBottom: '16px' }} />
                <p style={{ color: '#888', fontSize: '16px' }}>Seu carrinho está vazio</p>
              </div>
            ) : (
              <>
                <div style={{ maxHeight: '400px', overflow: 'auto', marginBottom: '20px' }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ 
                      backgroundColor: '#333', 
                      padding: '16px', 
                      borderRadius: '12px', 
                      marginBottom: '12px' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>{item.nome}</p>
                          <p style={{ color: '#4ade80', margin: '4px 0 0', fontSize: '14px' }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button
                            onClick={() => atualizarQuantidade(item.id, (item.quantidade || 1) - 1)}
                            style={{ padding: '6px 12px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <Minus size={14} />
                          </button>
                          <span style={{ color: 'white', minWidth: '32px', textAlign: 'center', fontWeight: 'bold' }}>
                            {item.quantidade || 1}
                          </span>
                          <button
                            onClick={() => atualizarQuantidade(item.id, (item.quantidade || 1) + 1)}
                            style={{ padding: '6px 12px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => removerDoCarrinho(item.id)}
                            style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ borderTop: '1px solid #444', paddingTop: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#aaa', fontSize: '16px' }}>Total:</span>
                    <span style={{ color: '#4ade80', fontSize: '24px', fontWeight: 'bold' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCarrinho)}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <User size={16} color="#aaa" />
                      <span style={{ color: '#aaa', fontSize: '13px' }}>Seus dados para contato</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Seu nome completo *"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', fontSize: '14px' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input
                        type="email"
                        placeholder="Seu e-mail"
                        value={clienteEmail}
                        onChange={(e) => setClienteEmail(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', fontSize: '14px' }}
                      />
                      <input
                        type="tel"
                        placeholder="WhatsApp"
                        value={clienteTelefone}
                        onChange={(e) => setClienteTelefone(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: 'white', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={enviarPedido}
                    disabled={enviando}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: enviando ? '#666' : '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: enviando ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
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

      <footer style={{ backgroundColor: '#0f0f0f', padding: '32px 20px', textAlign: 'center', borderTop: '1px solid #333' }}>
        <p style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>
          © {new Date().getFullYear()} Smoke Garden - Mecânica Especializada 2 Tempos
        </p>
        <p style={{ color: '#555', fontSize: '11px' }}>
          Retire seu pedido em nossa loja física
        </p>
        {empresa?.endereco_loja && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
            <MapPin size={12} color="#555" />
            <span style={{ color: '#555', fontSize: '11px' }}>{empresa.endereco_loja}</span>
          </div>
        )}
      </footer>
    </div>
  );
}