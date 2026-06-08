import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function NovoOrcamento() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [estoque, setEstoque] = useState([])
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [clienteDocumento, setClienteDocumento] = useState('')
  const [novoCliente, setNovoCliente] = useState('')
  const [novoClienteEmail, setNovoClienteEmail] = useState('')
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [itens, setItens] = useState([])
  const [desconto, setDesconto] = useState(0)
  const [tipoDesconto, setTipoDesconto] = useState('valor')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const [{ data: estoqueData }, { data: clientesData }] = await Promise.all([
      supabase.from('estoque').select('*').eq('ativo', true).order('nome'),
      supabase.from('pessoas').select('*').eq('tipo', 'cliente').order('nome')
    ])
    setEstoque(estoqueData || [])
    setClientes(clientesData || [])
  }

  const itensFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return estoque.filter((item) => !term || item.nome.toLowerCase().includes(term) || item.descricao?.toLowerCase().includes(term))
  }, [estoque, searchTerm])

  const subtotal = itens.reduce((sum, item) => sum + item.valor_total, 0)
  
  const total = useMemo(() => {
    let valorTotal = subtotal
    if (desconto > 0) {
      if (tipoDesconto === 'percentual') {
        valorTotal = subtotal * (1 - desconto / 100)
      } else {
        valorTotal = subtotal - desconto
      }
    }
    return Math.max(0, valorTotal)
  }, [subtotal, desconto, tipoDesconto])

  function adicionarItem(item) {
    const existente = itens.find((orcItem) => orcItem.estoque_id === item.id)
    if (existente) {
      setItens(itens.map((orcItem) =>
        orcItem.estoque_id === item.id
          ? { ...orcItem, quantidade: orcItem.quantidade + 1, valor_total: (orcItem.quantidade + 1) * orcItem.valor_unitario }
          : orcItem
      ))
    } else {
      setItens([...itens, {
        tipo_item: item.tipo,
        estoque_id: item.id,
        descricao: item.nome,
        quantidade: 1,
        valor_unitario: Number(item.valor) || 0,
        valor_total: Number(item.valor) || 0
      }])
    }
    setShowModal(false)
    setSearchTerm('')
  }

  function atualizarQuantidade(index, quantidade) {
    if (quantidade <= 0) {
      setItens(itens.filter((_, itemIndex) => itemIndex !== index))
      return
    }
    setItens(itens.map((item, itemIndex) =>
      itemIndex === index ? { ...item, quantidade, valor_total: quantidade * item.valor_unitario } : item
    ))
  }

  async function resolveCliente() {
    if (clienteId) {
      const cliente = clientes.find(c => c.id === clienteId)
      return { id: clienteId, nome: cliente?.nome, email: cliente?.email, telefone: cliente?.telefone, documento: cliente?.documento }
    }
    
    if (novoCliente.trim()) {
      const { data, error } = await supabase
        .from('pessoas')
        .insert([{ 
          tipo: 'cliente', 
          nome: novoCliente.trim(),
          email: novoClienteEmail || null,
          telefone: novoClienteTelefone || null
        }])
        .select()
        .single()

      if (error) throw error
      return { id: data.id, nome: data.nome, email: data.email, telefone: data.telefone, documento: null }
    }
    
    return { id: null, nome: null, email: null, telefone: null, documento: null }
  }

  async function salvarOrcamento() {
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item')
      return
    }

    try {
      setLoading(true)
      
      // Buscar último número de orçamento
      const { data: lastOrcamento } = await supabase
        .from('orcamentos')
        .select('numero_orcamento')
        .order('numero_orcamento', { ascending: false })
        .limit(1)

      const novoNumero = (lastOrcamento?.[0]?.numero_orcamento || 0) + 1

      // Resolver cliente
      const cliente = await resolveCliente()

      // Inserir orçamento
      const { data: orcamento, error } = await supabase
        .from('orcamentos')
        .insert([{
          numero_orcamento: novoNumero,
          cliente_id: cliente.id,
          cliente_nome: cliente.nome || novoCliente || 'Cliente não informado',
          cliente_email: cliente.email || novoClienteEmail || null,
          cliente_telefone: cliente.telefone || novoClienteTelefone || null,
          cliente_documento: cliente.documento || null,
          data_criacao: new Date().toISOString(),
          data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'rascunho',
          subtotal: subtotal,
          desconto: desconto,
          tipo_desconto: tipoDesconto,
          total: total,
          observacoes: observacoes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      // Inserir itens do orçamento usando os campos corretos
      const itensData = itens.map((item) => ({
        orcamento_id: orcamento.id,
        produto_id: item.estoque_id,
        produto_nome: item.descricao,
        quantidade: item.quantidade,
        preco_unitario: item.valor_unitario,
        preco_total: item.valor_total,
        created_at: new Date().toISOString()
      }))

      const { error: itensError } = await supabase.from('orcamento_itens').insert(itensData)
      if (itensError) throw itensError

      toast.success(`Orçamento #${novoNumero} criado com sucesso!`)
      
      // Navegar e forçar recarregamento da página de orçamentos
      navigate('/orcamentos', { replace: true })
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error(error.message || 'Erro ao salvar orçamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '28px', margin: 0 }}>Novo Orçamento</h1>
          <p style={{ color: '#888', margin: '5px 0 0' }}>Crie um orçamento com itens do estoque unificado.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            onClick={salvarOrcamento} 
            disabled={loading}
            style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={16} /> {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Cliente Section */}
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '12px' }}>
          <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>Cliente</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Cliente existente</label>
            <select 
              className="form-select" 
              value={clienteId} 
              onChange={(e) => {
                setClienteId(e.target.value)
                setNovoCliente('')
              }}
              style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }}
            >
              <option value="">Selecionar depois</option>
              {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
            </select>
          </div>

          {!clienteId && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Novo cliente</label>
                <input 
                  style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }}
                  value={novoCliente} 
                  onChange={(e) => setNovoCliente(e.target.value)} 
                  placeholder="Nome do cliente"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Email</label>
                <input 
                  style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }}
                  value={novoClienteEmail} 
                  onChange={(e) => setNovoClienteEmail(e.target.value)} 
                  placeholder="email@exemplo.com"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Telefone</label>
                <input 
                  style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white' }}
                  value={novoClienteTelefone} 
                  onChange={(e) => setNovoClienteTelefone(e.target.value)} 
                  placeholder="(11) 99999-9999"
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>Observações</label>
            <textarea 
              style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white', minHeight: '80px' }}
              value={observacoes} 
              onChange={(e) => setObservacoes(e.target.value)} 
              placeholder="Observações do orçamento..."
            />
          </div>
        </div>

        {/* Itens Section */}
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ color: 'white', fontSize: '18px', margin: 0 }}>Itens</h2>
            <button 
              onClick={() => setShowModal(true)}
              style={{ padding: '6px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Adicionar
            </button>
          </div>

          {itens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Nenhum item adicionado.</div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #333' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Item</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#aaa' }}>Qtd</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#aaa' }}>Unitário</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#aaa' }}>Total</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#aaa' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item, index) => (
                      <tr key={`${item.estoque_id}-${index}`} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '12px', color: 'white' }}>{item.descricao}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input 
                            type="number" 
                            min="1" 
                            value={item.quantidade} 
                            onChange={(e) => atualizarQuantidade(index, Number(e.target.value) || 1)} 
                            style={{ width: '60px', padding: '4px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '4px', color: 'white', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#4ade80' }}>{formatCurrency(item.valor_unitario)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'white' }}>{formatCurrency(item.valor_total)}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button 
                            onClick={() => atualizarQuantidade(index, 0)}
                            style={{ padding: '4px 8px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} /> Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #444' }}>
                      <td colSpan="2" style={{ padding: '12px', textAlign: 'right', color: 'white', fontWeight: 'bold' }}>Subtotal:</td>
                      <td colSpan="2" style={{ padding: '12px', textAlign: 'right', color: '#4ade80', fontWeight: 'bold' }}>{formatCurrency(subtotal)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan="2" style={{ padding: '12px', textAlign: 'right', color: '#aaa' }}>Desconto:</td>
                      <td colSpan="2" style={{ padding: '12px', textAlign: 'right' }}>
                        <input 
                          type="number" 
                          min="0" 
                          value={desconto} 
                          onChange={(e) => setDesconto(Number(e.target.value) || 0)}
                          style={{ width: '100px', padding: '4px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '4px', color: 'white', textAlign: 'right' }}
                        />
                        <select 
                          value={tipoDesconto} 
                          onChange={(e) => setTipoDesconto(e.target.value)}
                          style={{ marginLeft: '8px', padding: '4px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '4px', color: 'white' }}
                        >
                          <option value="valor">R$</option>
                          <option value="percentual">%</option>
                        </select>
                      </td>
                      <td></td>
                    </tr>
                    <tr style={{ backgroundColor: '#1f2937' }}>
                      <td colSpan="2" style={{ padding: '12px', textAlign: 'right', color: 'white', fontWeight: 'bold', fontSize: '16px' }}>Total:</td>
                      <td colSpan="2" style={{ padding: '12px', textAlign: 'right', color: '#4ade80', fontWeight: 'bold', fontSize: '18px' }}>{formatCurrency(total)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#2a2a2a', borderRadius: '12px', width: '500px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #444' }}>
              <h3 style={{ color: 'white', margin: 0 }}>Adicionar item</h3>
              <button onClick={() => setShowModal(false)} style={{ padding: '4px 8px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Fechar</button>
            </div>
            <div style={{ padding: '16px' }}>
              <input 
                style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', color: 'white', marginBottom: '16px' }}
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Buscar no estoque..." 
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {itensFiltrados.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => adicionarItem(item)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#333', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                  >
                    <div>
                      <strong style={{ color: 'white' }}>{item.nome}</strong>
                      <span style={{ color: '#888', marginLeft: '8px' }}>({item.tipo})</span>
                    </div>
                    <small style={{ color: '#4ade80' }}>{formatCurrency(item.valor)}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}