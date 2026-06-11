import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Trash2, Edit2, Save, X, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function OrcamentoDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isEditMode = new URLSearchParams(location.search).get('edit') === 'true'
  
  const [orcamento, setOrcamento] = useState(null)
  const [itens, setItens] = useState([])
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState(isEditMode)
  const [produtos, setProdutos] = useState([])

  useEffect(() => {
    carregarDados()
    carregarProdutos()
  }, [id])

  async function carregarProdutos() {
    console.log('=== CARREGANDO PRODUTOS DO ESTOQUE ===')
    try {
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .order('nome', { ascending: true })
      
      if (error) {
        console.error('Erro ao buscar produtos:', error)
        toast.error('Erro ao carregar produtos do estoque')
        return
      }
      
      console.log('Produtos encontrados:', data?.length || 0)
      setProdutos(data || [])
      
      if (data?.length === 0) {
        toast.error('Nenhum produto cadastrado no estoque')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar produtos')
    }
  }

  async function carregarDados() {
    setLoading(true)
    try {
      const { data: orcamentoData, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      
      if (error) throw error
      setOrcamento(orcamentoData)

      // Usando os campos corretos da tabela orcamento_itens
      const { data: itensData } = await supabase
        .from('orcamento_itens')
        .select('*')
        .eq('orcamento_id', id)
      
      setItens(itensData || [])

      if (orcamentoData?.cliente_id) {
        const { data: clienteData } = await supabase
          .from('pessoas')
          .select('*')
          .eq('id', orcamentoData.cliente_id)
          .maybeSingle()
        setCliente(clienteData || null)
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar orçamento')
    } finally {
      setLoading(false)
    }
  }

  function adicionarItem() {
    setItens([...itens, {
      id: `novo-${Date.now()}`,
      orcamento_id: id,
      produto_id: null,
      produto_nome: '',
      quantidade: 1,
      preco_unitario: 0,
      preco_total: 0,
      tipo: 'produto',
      isNew: true
    }])
  }

  function atualizarItem(index, campo, valor) {
    const novosItens = [...itens]
    const item = novosItens[index]
    
    if (campo === 'produto_id') {
      const produto = produtos.find(p => p.id === valor)
      if (produto) {
        item.produto_id = produto.id
        item.produto_nome = produto.nome || 'Produto'
        item.preco_unitario = produto.preco_venda || produto.preco || 0
        item.quantidade = item.quantidade || 1
        item.preco_total = item.quantidade * item.preco_unitario
      }
    } else if (campo === 'produto_nome') {
      item.produto_nome = valor
    } else if (campo === 'quantidade') {
      item.quantidade = parseFloat(valor) || 0
      item.preco_total = item.quantidade * item.preco_unitario
    } else if (campo === 'preco_unitario') {
      item.preco_unitario = parseFloat(valor) || 0
      item.preco_total = item.quantidade * item.preco_unitario
    } else if (campo === 'tipo') {
      item.tipo = valor
    }
    
    novosItens[index] = item
    setItens(novosItens)
  }

  function removerItem(index) {
    if (!window.confirm('Remover este item?')) return
    const novosItens = itens.filter((_, i) => i !== index)
    setItens(novosItens)
  }

  function calcularTotal() {
    const total = itens.reduce((sum, item) => sum + (item.preco_total || 0), 0)
    return total
  }

  async function salvarAlteracoes() {
    if (!editando) return
    
    setSalvando(true)
    try {
      // Validar itens
      const itensInvalidos = itens.filter(item => !item.produto_nome || item.quantidade <= 0)
      if (itensInvalidos.length > 0) {
        toast.error('Preencha todos os itens corretamente')
        setSalvando(false)
        return
      }

      const totalGeral = calcularTotal()

      // Atualizar orçamento
      const { error: orcamentoError } = await supabase
        .from('orcamentos')
        .update({
          total: totalGeral,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (orcamentoError) throw orcamentoError

      // Remover itens antigos
      const { error: deleteError } = await supabase
        .from('orcamento_itens')
        .delete()
        .eq('orcamento_id', id)

      if (deleteError) throw deleteError

      // Inserir itens atualizados com os campos corretos
      const itensParaInserir = itens.map(item => ({
        orcamento_id: id,
        produto_id: item.produto_id || null,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        preco_total: item.preco_total,
        tipo: item.tipo || 'produto',
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('orcamento_itens')
        .insert(itensParaInserir)

      if (insertError) throw insertError

      toast.success('Orçamento atualizado com sucesso!')
      setEditando(false)
      navigate(`/orcamentos/${id}`)
      carregarDados()
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar alterações: ' + error.message)
    } finally {
      setSalvando(false)
    }
  }

  function cancelarEdicao() {
    setEditando(false)
    navigate(`/orcamentos/${id}`)
    carregarDados()
  }

  async function excluirOrcamento() {
    if (!window.confirm('Excluir este orçamento?')) return
    const { error } = await supabase.from('orcamentos').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Orçamento excluído!')
      navigate('/orcamentos')
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#ccc' }}>Carregando orçamento...</div>
  if (!orcamento) return <div style={{ textAlign: 'center', padding: '50px', color: '#ccc' }}>Orçamento não encontrado.</div>

  return (
    <div style={{ padding: '24px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <button onClick={() => navigate('/orcamentos')} style={{ padding: '6px 12px', backgroundColor: '#333', color: '#aaa', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1 style={{ color: 'white', fontSize: '28px', margin: 0 }}>
            {editando ? 'Editar Orçamento' : 'Orçamento'} #{orcamento.numero_orcamento || orcamento.id?.slice(0, 8)}
          </h1>
          <p style={{ color: '#888', margin: '5px 0 0' }}>Criado em {new Date(orcamento.data_criacao || orcamento.created_at).toLocaleString('pt-BR')}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!editando ? (
            <>
              <button onClick={() => setEditando(true)} style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={16} /> Editar
              </button>
              <button onClick={excluirOrcamento} style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={16} /> Excluir
              </button>
            </>
          ) : (
            <>
              <button onClick={cancelarEdicao} disabled={salvando} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <X size={16} /> Cancelar
              </button>
              <button onClick={salvarAlteracoes} disabled={salvando} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Informações do Cliente */}
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '12px' }}>
          <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>Cliente</h2>
          <p style={{ color: 'white' }}><strong>{cliente?.nome || orcamento.cliente_nome || 'Cliente avulso'}</strong></p>
          {(cliente?.telefone || orcamento.cliente_telefone) && <p style={{ color: '#aaa' }}>{cliente?.telefone || orcamento.cliente_telefone}</p>}
          {(cliente?.email || orcamento.cliente_email) && <p style={{ color: '#aaa' }}>{cliente?.email || orcamento.cliente_email}</p>}
          {(cliente?.documento) && <p style={{ color: '#aaa' }}>{cliente.documento}</p>}
          {orcamento.observacoes && (
            <>
              <h3 style={{ color: 'white', fontSize: '14px', marginTop: '16px', marginBottom: '8px' }}>Observações</h3>
              <p style={{ color: '#aaa' }}>{orcamento.observacoes}</p>
            </>
          )}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #444' }}>
            <p style={{ color: '#888', fontSize: '12px' }}>Origem: {orcamento.origem === 'publico' ? '🌐 Site' : '📋 Interno'}</p>
            <p style={{ color: '#888', fontSize: '12px' }}>Status: {orcamento.status === 'aprovado' ? '✓ Aprovado' : '⏳ Pendente'}</p>
          </div>
        </div>

        {/* Itens do orçamento */}
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ color: 'white', fontSize: '18px', margin: 0 }}>Itens</h2>
            {editando && (
              <button onClick={adicionarItem} style={{ padding: '6px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <Plus size={14} /> Adicionar Item
              </button>
            )}
          </div>
          
          {itens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              {editando ? 'Clique em "Adicionar Item" para começar' : 'Nenhum item encontrado.'}
            </div>
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
                      {editando && <th style={{ padding: '12px', textAlign: 'center', color: '#aaa' }}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item, index) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '12px' }}>
                          {editando ? (
                            <select
                              value={item.produto_id || ''}
                              onChange={(e) => atualizarItem(index, 'produto_id', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                color: 'white'
                              }}
                            >
                              <option value="">Selecione um produto</option>
                              {produtos.map(produto => (
                                <option key={produto.id} value={produto.id}>
                                  {produto.nome} - {formatCurrency(produto.preco_venda || 0)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ color: 'white' }}>{item.produto_nome}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {editando ? (
                            <input
                              type="number"
                              value={item.quantidade}
                              onChange={(e) => atualizarItem(index, 'quantidade', e.target.value)}
                              min="0.001"
                              step="0.001"
                              style={{
                                width: '80px',
                                padding: '8px',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                color: 'white',
                                textAlign: 'center'
                              }}
                            />
                          ) : (
                            <span style={{ color: 'white' }}>{item.quantidade}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {editando ? (
                            <input
                              type="number"
                              value={item.preco_unitario}
                              onChange={(e) => atualizarItem(index, 'preco_unitario', e.target.value)}
                              min="0"
                              step="0.01"
                              style={{
                                width: '120px',
                                padding: '8px',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                color: 'white',
                                textAlign: 'right'
                              }}
                            />
                          ) : (
                            <span style={{ color: '#4ade80' }}>{formatCurrency(item.preco_unitario)}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <span style={{ color: 'white', fontWeight: 'bold' }}>{formatCurrency(item.preco_total)}</span>
                        </td>
                        {editando && (
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => removerItem(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #444' }}>
                      <td colSpan={editando ? 3 : 3} style={{ padding: '12px', textAlign: 'right', color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                        TOTAL
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#4ade80', fontWeight: 'bold', fontSize: '18px' }}>
                        {formatCurrency(calcularTotal())}
                      </td>
                      {editando && <td style={{ padding: '12px' }}></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}