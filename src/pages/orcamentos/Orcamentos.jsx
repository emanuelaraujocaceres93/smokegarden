import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Eye, Plus, FileText, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'
import { generatePDF } from '../../utils/pdfGenerator';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export default function Orcamentos() {
  const location = useLocation()
  const [orcamentos, setOrcamentos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [aprovando, setAprovando] = useState(null)

  useEffect(() => {
    carregarOrcamentos()
  }, [location.key])

  async function carregarOrcamentos() {
    setLoading(true)
    try {
      const [{ data: orcamentosData, error }, { data: clientesData }] = await Promise.all([
        supabase.from('orcamentos').select('*').order('created_at', { ascending: false }),
        supabase.from('pessoas').select('id,nome')
      ])
      if (error) throw error
      setOrcamentos(orcamentosData || [])
      setClientes(clientesData || [])
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar orçamentos')
    } finally {
      setLoading(false)
    }
  }

  async function aprovarOrcamento(orcamento) {
    console.log('=== INICIANDO APROVAÇÃO ===')
    console.log('Orçamento:', orcamento)
    
    setAprovando(orcamento.id)
    
    try {
      // 1. Buscar itens do orçamento
      const { data: itensOrcamento, error: itensError } = await supabase
        .from('orcamento_itens')
        .select('*')
        .eq('orcamento_id', orcamento.id)
      
      if (itensError) {
        console.error('Erro ao buscar itens:', itensError)
        toast.error('Erro ao verificar itens do orçamento')
        setAprovando(null)
        return
      }
      
      console.log('Itens encontrados:', itensOrcamento?.length || 0)
      
      // 2. Se não tem itens, apenas aprovar o orçamento sem criar venda
      if (!itensOrcamento || itensOrcamento.length === 0) {
        console.log('Orçamento sem itens - aprovando apenas o status')
        
        const { error: updateError } = await supabase
          .from('orcamentos')
          .update({ 
            status: 'aprovado',
            data_aprovacao: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', orcamento.id)
        
        if (updateError) {
          console.error('Erro ao aprovar:', updateError)
          throw updateError
        }
        
        toast.success(`Orçamento #${orcamento.numero_orcamento || orcamento.id?.slice(0, 8)} aprovado com sucesso!`)
        carregarOrcamentos()
        setAprovando(null)
        return
      }
      
      // 3. Tem itens - confirmar aprovação
      if (!window.confirm(`Aprovar orçamento #${orcamento.numero_orcamento || orcamento.id?.slice(0, 8)}? Isso criará uma venda e atualizará o estoque.`)) {
        setAprovando(null)
        return
      }
      
      // 4. Verificar estoque disponível
      for (const item of itensOrcamento) {
        if (item.produto_id) {
          const { data: produto, error: produtoError } = await supabase
            .from('estoque')
            .select('quantidade, nome')
            .eq('id', item.produto_id)
            .maybeSingle()
          
          if (produtoError) {
            console.error('Erro ao buscar produto:', produtoError)
            console.log(`Produto não encontrado: ${item.produto_id}, continuando...`)
            continue
          }
          
          if (produto && (produto.quantidade || 0) < item.quantidade) {
            toast.error(`Estoque insuficiente para ${produto.nome}. Disponível: ${produto.quantidade || 0}, Necessário: ${item.quantidade}`)
            setAprovando(null)
            return
          }
        }
      }
      
      // 5. Gerar número da venda
      const numeroVenda = `VENDA-${Date.now().toString(36).toUpperCase()}`
      
      // 6. Criar a venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert([{
          numero_venda: numeroVenda,
          cliente_id: orcamento.cliente_id,
          cliente_nome: orcamento.cliente_nome || 'Cliente',
          cliente_email: orcamento.cliente_email || null,
          cliente_telefone: orcamento.cliente_telefone || null,
          valor_total: orcamento.total || 0,
          status: 'concluida',
          tipo: 'orcamento_aprovado',
          orcamento_id: orcamento.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (vendaError) {
        console.error('Erro ao criar venda:', vendaError)
        throw vendaError
      }
      
      console.log('Venda criada:', venda)
      
      // 7. Criar itens da venda e atualizar estoque
      for (const item of itensOrcamento) {
        // Inserir item da venda
        const { error: itemVendaError } = await supabase
          .from('venda_itens')
          .insert([{
            venda_id: venda.id,
            produto_id: item.produto_id,
            nome_produto: item.produto_nome,
            quantidade: item.quantidade,
            valor_unitario: item.preco_unitario,
            valor_total: item.preco_total,
            tipo: 'produto'
          }])
        
        if (itemVendaError) {
          console.error('Erro ao criar item venda:', itemVendaError)
          throw itemVendaError
        }
        
        // Atualizar estoque
        if (item.produto_id) {
          const { data: produto } = await supabase
            .from('estoque')
            .select('quantidade')
            .eq('id', item.produto_id)
            .maybeSingle()
          
          if (produto && produto.quantidade !== undefined) {
            const novaQuantidade = (produto.quantidade || 0) - item.quantidade
            console.log(`Atualizando estoque do produto ${item.produto_id}: ${produto.quantidade} -> ${novaQuantidade}`)
            await supabase
              .from('estoque')
              .update({ quantidade: novaQuantidade >= 0 ? novaQuantidade : 0 })
              .eq('id', item.produto_id)
          } else {
            console.log(`Produto ${item.produto_id} não encontrado no estoque, pulando atualização`)
          }
        }
      }
      
      // 8. Atualizar status do orçamento
      const { error: updateError } = await supabase
        .from('orcamentos')
        .update({ 
          status: 'aprovado',
          data_aprovacao: new Date().toISOString(),
          venda_id: venda.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', orcamento.id)

      if (updateError) {
        console.error('Erro ao atualizar orçamento:', updateError)
        throw updateError
      }

      toast.success(`Orçamento aprovado! Venda #${numeroVenda} criada.`)
      carregarOrcamentos()
      
    } catch (error) {
      console.error('Erro ao aprovar:', error)
      toast.error('Erro ao aprovar orçamento: ' + error.message)
    } finally {
      setAprovando(null)
    }
  }

  async function gerarPDF(orcamento) {
    try {
      const { data: itens } = await supabase
        .from('orcamento_itens')
        .select('*')
        .eq('orcamento_id', orcamento.id)

      const itensFormatados = (itens || []).map(item => ({
        nome: item.produto_nome,
        descricao: item.produto_descricao,
        quantidade: item.quantidade,
        valor_unitario: item.preco_unitario,
        valor_total: item.preco_total
      }))

      const dadosCompletos = {
        ...orcamento,
        itens: itensFormatados
      }
      
      await generatePDF(dadosCompletos, 'orcamento')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF')
    }
  }

  const clientesMap = useMemo(() => Object.fromEntries(clientes.map((cliente) => [cliente.id, cliente.nome])), [clientes])

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: window.innerWidth <= 768 ? 'flex-start' : 'center',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ color: 'white', fontSize: window.innerWidth <= 768 ? '24px' : '28px', margin: 0 }}>Orçamentos</h1>
            <p style={{ color: '#888', margin: '5px 0 0', fontSize: window.innerWidth <= 768 ? '13px' : '14px' }}>
              Gerencie propostas criadas a partir do estoque.
            </p>
          </div>
          <Link 
            to="/orcamentos/novo" 
            style={{ 
              padding: '10px 16px', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              width: window.innerWidth <= 768 ? '100%' : 'auto',
              justifyContent: 'center'
            }}
          >
            <Plus size={16} /> Novo Orçamento
          </Link>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#2a2a2a', 
        borderRadius: '12px', 
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Carregando orçamentos...</div>
        ) : orcamentos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Nenhum orçamento encontrado.</div>
        ) : (
          <table style={{ 
            width: '100%', 
            minWidth: '700px', 
            borderCollapse: 'collapse',
            fontSize: window.innerWidth <= 768 ? '12px' : '14px'
          }}>
            <thead style={{ backgroundColor: '#333' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Número</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Cliente</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Data</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#aaa' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#aaa' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#aaa' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((orcamento) => (
                <tr key={orcamento.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '12px', color: 'white' }}>#{orcamento.numero_orcamento || orcamento.id?.slice(0, 8)}</td>
                  <td style={{ padding: '12px', color: 'white' }}>
                    {orcamento.cliente_nome || clientesMap[orcamento.cliente_id] || 'Cliente avulso'}
                  </td>
                  <td style={{ padding: '12px', color: '#aaa' }}>
                    {orcamento.data_criacao ? new Date(orcamento.data_criacao).toLocaleDateString('pt-BR') : 
                     orcamento.created_at ? new Date(orcamento.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#4ade80' }}>
                    {formatCurrency(orcamento.total || 0)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '20px', 
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      backgroundColor: orcamento.status === 'aprovado' ? '#22c55e20' : '#f59e0b20',
                      color: orcamento.status === 'aprovado' ? '#4ade80' : '#fbbf24'
                    }}>
                      {orcamento.status === 'aprovado' ? '✓ Aprovado' : '📝 Rascunho'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: '6px', 
                      justifyContent: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <Link 
                        to={`/orcamentos/${orcamento.id}`} 
                        style={{ 
                          padding: '6px 10px', 
                          backgroundColor: '#333', 
                          color: '#60a5fa', 
                          borderRadius: '6px', 
                          textDecoration: 'none', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <Eye size={12} /> Ver
                      </Link>
                      <button 
                        onClick={() => gerarPDF(orcamento)} 
                        style={{ 
                          padding: '6px 10px', 
                          backgroundColor: '#333', 
                          color: '#fbbf24', 
                          border: 'none', 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <FileText size={12} /> PDF
                      </button>
                      {orcamento.status !== 'aprovado' && (
                        <button 
                          onClick={() => aprovarOrcamento(orcamento)} 
                          disabled={aprovando === orcamento.id} 
                          style={{ 
                            padding: '6px 10px', 
                            backgroundColor: aprovando === orcamento.id ? '#555' : '#22c55e20', 
                            color: aprovando === orcamento.id ? '#aaa' : '#4ade80', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: aprovando === orcamento.id ? 'not-allowed' : 'pointer', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            fontSize: '12px'
                          }}
                        >
                          <CheckCircle size={12} /> {aprovando === orcamento.id ? 'Aprovando...' : 'Aprovar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}