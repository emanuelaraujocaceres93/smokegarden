import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function Sales() {
  const [estoque, setEstoque] = useState([])
  const [clientes, setClientes] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [clienteId, setClienteId] = useState('')
  const [novoCliente, setNovoCliente] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [activeType, setActiveType] = useState('produto')
  const [searchTerm, setSearchTerm] = useState('')
  const [insumo, setInsumo] = useState({ descricao: '', quantidade: 1, valor_unitario: '' })
  const [novoClienteEmail, setNovoClienteEmail] = useState('')
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('')
  const [novoClienteNome, setNovoClienteNome] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: estoqueData, error: estoqueError }, { data: clientesData }] = await Promise.all([
      supabase.from('estoque').select('*').eq('ativo', true).order('nome'),
      supabase.from('pessoas').select('*').eq('tipo', 'cliente').order('nome')
    ])

    if (estoqueError) toast.error('Erro ao carregar estoque')
    setEstoque(estoqueData || [])
    setClientes(clientesData || [])
    setLoading(false)
  }

  const currentItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return estoque.filter((item) => {
      const matchesType = item.tipo === activeType
      return matchesType && (!term || item.nome.toLowerCase().includes(term))
    })
  }, [estoque, activeType, searchTerm])

  const total = cart.reduce((sum, item) => sum + item.valor_total, 0)

  function addToCart(item) {
    const existing = cart.find((cartItem) => cartItem.estoque_id === item.id)
    if (existing) {
      setCart(cart.map((cartItem) =>
        cartItem.estoque_id === item.id
          ? { ...cartItem, quantidade: cartItem.quantidade + 1, valor_total: (cartItem.quantidade + 1) * cartItem.valor_unitario }
          : cartItem
      ))
    } else {
      setCart([...cart, {
        tipo_item: item.tipo,
        estoque_id: item.id,
        descricao: item.nome,
        quantidade: 1,
        valor_unitario: Number(item.valor) || 0,
        valor_total: Number(item.valor) || 0
      }])
    }
  }

  function updateQuantity(index, quantidade) {
    if (quantidade <= 0) {
      setCart(cart.filter((_, itemIndex) => itemIndex !== index))
      return
    }
    setCart(cart.map((item, itemIndex) =>
      itemIndex === index ? { ...item, quantidade, valor_total: quantidade * item.valor_unitario } : item
    ))
  }

  function addInsumo() {
    if (!insumo.descricao.trim()) return toast.error('Descreva o insumo')
    const quantidade = Number(insumo.quantidade) || 1
    const valorUnitario = Number(insumo.valor_unitario) || 0
    setCart([...cart, {
      tipo_item: 'insumo',
      estoque_id: null,
      descricao: insumo.descricao.trim(),
      quantidade,
      valor_unitario: valorUnitario,
      valor_total: quantidade * valorUnitario
    }])
    setInsumo({ descricao: '', quantidade: 1, valor_unitario: '' })
  }

  async function resolveCliente() {
    if (clienteId) {
      const cliente = clientes.find(c => c.id === clienteId)
      return { id: clienteId, nome: cliente?.nome, email: cliente?.email, telefone: cliente?.telefone }
    }
    
    if (novoClienteNome.trim()) {
      const { data, error } = await supabase
        .from('pessoas')
        .insert([{ 
          tipo: 'cliente', 
          nome: novoClienteNome.trim(),
          email: novoClienteEmail || null,
          telefone: novoClienteTelefone || null
        }])
        .select()
        .single()

      if (error) throw error
      return { id: data.id, nome: data.nome, email: data.email, telefone: data.telefone }
    }
    
    return { id: null, nome: 'Cliente avulso', email: null, telefone: null }
  }

  async function finalizeSale() {
    if (cart.length === 0) return toast.error('Adicione itens ao carrinho')

    try {
      setLoading(true)
      
      // Resolver cliente
      const cliente = await resolveCliente()

      // Calcular total
      const totalVenda = cart.reduce((sum, item) => sum + item.valor_total, 0)

      // Inserir venda - usando os campos corretos da tabela
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert([{
          cliente_id: cliente.id || null,
          valor_total: totalVenda,
          forma_pagamento: paymentMethod,
          status: 'concluida',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (vendaError) throw vendaError

      // Inserir itens da venda (se existir tabela venda_itens)
      if (cart.length > 0) {
        const itens = cart.map((item) => ({ 
          venda_id: venda.id, 
          estoque_id: item.estoque_id,
          tipo_item: item.tipo_item,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total
        }))
        
        const { error: itensError } = await supabase.from('venda_itens').insert(itens)
        if (itensError) console.error('Erro ao inserir itens:', itensError)
      }

      toast.success(`Venda finalizada com sucesso!`)
      setCart([])
      setClienteId('')
      setNovoClienteNome('')
      setNovoClienteEmail('')
      setNovoClienteTelefone('')
      
      // Recarregar dados
      fetchData()
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error.message || 'Erro ao finalizar venda')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#ccc' }}>Carregando...</div>

  return (
    <div style={{ padding: '24px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'white', fontSize: '28px', margin: 0 }}>Vendas</h1>
        <p style={{ color: '#888', margin: '5px 0 0' }}>Carrinho com produtos, serviços e insumos.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* Esquerda - Produtos */}
        <div style={{ backgroundColor: '#2a2a2a', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button onClick={() => setActiveType('produto')} style={{ padding: '8px 16px', backgroundColor: activeType === 'produto' ? '#2563eb' : '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Produtos</button>
            <button onClick={() => setActiveType('servico')} style={{ padding: '8px 16px', backgroundColor: activeType === 'servico' ? '#2563eb' : '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Serviços</button>
          </div>
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar..." style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white', marginBottom: '16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentItems.map((item) => (
              <button key={item.id} onClick={() => addToCart(item)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                <strong style={{ color: 'white' }}>{item.nome}</strong>
                <small style={{ color: '#4ade80' }}>{formatCurrency(item.valor)}</small>
              </button>
            ))}
          </div>
        </div>

        {/* Direita - Carrinho */}
        <div style={{ backgroundColor: '#2a2a2a', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>Carrinho</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Cliente existente</label>
            <select value={clienteId} onChange={(e) => { setClienteId(e.target.value); setNovoClienteNome('') }} style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }}>
              <option value="">Cliente avulso</option>
              {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
            </select>
          </div>

          {!clienteId && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Novo cliente</label>
                <input type="text" value={novoClienteNome} onChange={(e) => setNovoClienteNome(e.target.value)} placeholder="Nome" style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Email</label>
                <input type="email" value={novoClienteEmail} onChange={(e) => setNovoClienteEmail(e.target.value)} placeholder="email@exemplo.com" style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Telefone</label>
                <input type="text" value={novoClienteTelefone} onChange={(e) => setNovoClienteTelefone(e.target.value)} placeholder="(11) 99999-9999" style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }} />
              </div>
            </>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Forma de pagamento</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }}>
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="debito">Cartão débito</option>
              <option value="credito">Cartão crédito</option>
            </select>
          </div>

          {/* Itens do carrinho */}
          {cart.map((item, index) => (
            <div key={index} style={{ backgroundColor: '#333', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'white' }}>{item.descricao}</strong>
                <button onClick={() => updateQuantity(index, 0)} style={{ padding: '4px 8px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Remover</button>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <input type="number" min="1" value={item.quantidade} onChange={(e) => updateQuantity(index, Number(e.target.value) || 1)} style={{ width: '80px', padding: '4px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '4px', color: 'white' }} />
                <span style={{ color: '#4ade80' }}>{formatCurrency(item.valor_total)}</span>
              </div>
            </div>
          ))}

          {/* Insumo */}
          <div style={{ backgroundColor: '#333', padding: '12px', borderRadius: '8px', marginTop: '16px' }}>
            <h3 style={{ color: 'white', fontSize: '14px', marginBottom: '8px' }}>Insumo</h3>
            <input type="text" value={insumo.descricao} onChange={(e) => setInsumo({ ...insumo, descricao: e.target.value })} placeholder="Descrição" style={{ width: '100%', padding: '6px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '4px', color: 'white', marginBottom: '8px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="number" min="1" value={insumo.quantidade} onChange={(e) => setInsumo({ ...insumo, quantidade: e.target.value })} placeholder="Qtd" style={{ width: '60px', padding: '6px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '4px', color: 'white' }} />
              <input type="number" step="0.01" value={insumo.valor_unitario} onChange={(e) => setInsumo({ ...insumo, valor_unitario: e.target.value })} placeholder="Valor" style={{ flex: 1, padding: '6px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '4px', color: 'white' }} />
              <button onClick={addInsumo} style={{ padding: '6px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+</button>
            </div>
          </div>

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #444' }}>
            <span style={{ color: 'white', fontWeight: 'bold' }}>Total</span>
            <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '20px' }}>{formatCurrency(total)}</span>
          </div>

          <button onClick={finalizeSale} disabled={loading} style={{ width: '100%', marginTop: '16px', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Finalizando...' : 'Finalizar Venda'}
          </button>
        </div>
      </div>
    </div>
  )
}