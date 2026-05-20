import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format, differenceInDays, addMonths, addDays, addYears } from 'date-fns'
import toast from 'react-hot-toast'

const Accounts = () => {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('receber')
  const [receivables, setReceivables] = useState([])
  const [payables, setPayables] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    category: 'outros',
    notes: '',
    is_recurring: false,
    recurring_type: 'monthly'
  })
  const [stats, setStats] = useState({
    totalSales: 0,
    totalToReceive: 0,
    totalToPay: 0,
    balance: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    // Buscar vendas (faturamento total)
    const { data: sales } = await supabase.from('sales').select('total_amount, paid_amount, status')
    
    const totalSales = (sales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0)
    const totalReceived = (sales || []).reduce((sum, s) => sum + (s.paid_amount || 0), 0)
    const totalToReceive = totalSales - totalReceived
    
    // Buscar parcelas a receber (clientes)
    const { data: installments } = await supabase
      .from('installments')
      .select('*, sales(customer_name)')
      .order('due_date', { ascending: true })
    
    // Buscar contas a pagar (não pagas)
    const { data: bills } = await supabase
      .from('bills_to_pay')
      .select('*')
      .eq('paid', false)
      .order('due_date', { ascending: true })
    
    // Buscar contas já pagas
    const { data: paidBills } = await supabase
      .from('bills_to_pay')
      .select('*')
      .eq('paid', true)
    
    const totalToPay = (bills || []).reduce((sum, b) => sum + b.amount, 0)
    const totalPaid = (paidBills || []).reduce((sum, b) => sum + b.amount, 0)
    
    setReceivables(installments || [])
    setPayables(bills || [])
    setStats({
      totalSales: totalSales,
      totalReceived: totalReceived,
      totalToReceive: totalToReceive,
      totalToPay: totalToPay,
      totalPaid: totalPaid,
      balance: totalReceived - totalPaid
    })
    setLoading(false)
  }

  const handlePayBill = async (bill) => {
    try {
      // Atualizar conta como paga
      const { error: updateError } = await supabase
        .from('bills_to_pay')
        .update({ 
          paid: true,
          status: 'paid',
          paid_amount: bill.amount,
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', bill.id)
      
      if (updateError) throw updateError
      
      // Se for recorrente, criar nova conta para o próximo mês
      if (bill.is_recurring) {
        let nextDueDate = new Date(bill.due_date)
        switch (bill.recurring_type) {
          case 'monthly':
            nextDueDate = addMonths(nextDueDate, 1)
            break
          case 'weekly':
            nextDueDate = addDays(nextDueDate, 7)
            break
          case 'yearly':
            nextDueDate = addYears(nextDueDate, 1)
            break
        }
        
        await supabase.from('bills_to_pay').insert([{
          description: bill.description,
          amount: bill.amount,
          due_date: nextDueDate.toISOString().split('T')[0],
          category: bill.category,
          notes: bill.notes,
          is_recurring: true,
          recurring_type: bill.recurring_type,
          status: 'pending',
          paid: false,
          paid_amount: 0
        }])
      }
      
      toast.success('Conta paga com sucesso!')
      fetchData()
    } catch (error) {
      toast.error('Erro ao pagar conta')
    }
  }

  const handleReceiveInstallment = async (installment) => {
    try {
      const newPaidAmount = (installment.paid_amount || 0) + installment.amount
      const isFullyPaid = newPaidAmount >= installment.amount

      const { error } = await supabase
        .from('installments')
        .update({
          paid_amount: newPaidAmount,
          status: isFullyPaid ? 'paid' : 'partial',
          paid_at: isFullyPaid ? new Date().toISOString() : null
        })
        .eq('id', installment.id)

      if (error) throw error
      
      // Atualizar status da venda se todas parcelas estiverem pagas
      if (isFullyPaid) {
        const saleInstallments = receivables.filter(i => i.sale_id === installment.sale_id)
        const allPaid = saleInstallments.every(i => i.id === installment.id || i.status === 'paid')
        
        if (allPaid) {
          await supabase.from('sales').update({ status: 'completed' }).eq('id', installment.sale_id)
        }
      }
      
      toast.success('Pagamento registrado!')
      fetchData()
    } catch (error) {
      toast.error('Erro ao registrar pagamento')
    }
  }

  const handleSubmitBill = async (e) => {
    e.preventDefault()
    
    const billData = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      due_date: formData.due_date,
      category: formData.category,
      notes: formData.notes || null,
      is_recurring: formData.is_recurring,
      recurring_type: formData.is_recurring ? formData.recurring_type : null,
      status: 'pending',
      paid: false,
      paid_amount: 0
    }

    if (editingBill) {
      const { error } = await supabase
        .from('bills_to_pay')
        .update(billData)
        .eq('id', editingBill.id)
      if (error) {
        toast.error('Erro ao atualizar')
      } else {
        toast.success('Conta atualizada!')
      }
    } else {
      const { error } = await supabase
        .from('bills_to_pay')
        .insert([billData])
      if (error) {
        toast.error('Erro ao adicionar conta')
      } else {
        toast.success('Conta adicionada!')
      }
    }

    setShowModal(false)
    setEditingBill(null)
    setFormData({ description: '', amount: '', due_date: '', category: 'outros', notes: '', is_recurring: false, recurring_type: 'monthly' })
    fetchData()
  }

  const handleDeleteBill = async (id) => {
    if (window.confirm('Excluir esta conta?')) {
      const { error } = await supabase.from('bills_to_pay').delete().eq('id', id)
      if (error) {
        toast.error('Erro ao excluir')
      } else {
        toast.success('Conta excluída!')
        fetchData()
      }
    }
  }

  const formatCurrency = (value) => {
    return 'R$ ' + (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  }

  const getStatusInfo = (item, type) => {
    const daysDiff = differenceInDays(new Date(item.due_date), new Date())
    const isOverdue = daysDiff < 0
    
    if (type === 'receivable') {
      if (item.status === 'paid') return { label: 'Pago', color: 'status-paid' }
      if (isOverdue) return { label: 'Vencido', color: 'status-overdue' }
      if (daysDiff <= 7) return { label: 'Vence em breve', color: 'status-warning' }
      return { label: 'Pendente', color: 'status-pending' }
    } else {
      if (item.paid) return { label: 'Pago', color: 'status-paid' }
      if (isOverdue) return { label: 'Vencido', color: 'status-overdue' }
      if (daysDiff <= 7) return { label: 'Vence em breve', color: 'status-warning' }
      return { label: 'Pendente', color: 'status-pending' }
    }
  }

  const categories = [
    { value: 'aluguel', label: 'Aluguel' },
    { value: 'energia', label: 'Energia Elétrica' },
    { value: 'agua', label: 'Água' },
    { value: 'internet', label: 'Internet/Telefone' },
    { value: 'funcionarios', label: 'Funcionários' },
    { value: 'impostos', label: 'Impostos' },
    { value: 'fornecedores', label: 'Fornecedores' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'outros', label: 'Outros' }
  ]

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Carregando...</div>
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>Contas</h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>Gerencie suas finanças</p>
      </div>

      {/* Cards de resumo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>💰 Faturamento</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#3A5F40' }}>{formatCurrency(stats.totalSales)}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>✅ Recebido</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#2E7D32' }}>{formatCurrency(stats.totalReceived)}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>📉 A Pagar</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#C62828' }}>{formatCurrency(stats.totalToPay)}</p>
        </div>
        <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}>⚖️ Saldo</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: stats.balance >= 0 ? '#2E7D32' : '#C62828' }}>
            {formatCurrency(stats.balance)}
          </p>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('receber')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'receber' ? '#3A5F40' : 'transparent',
            color: activeTab === 'receber' ? 'white' : '#E0E0E0',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          💵 Contas a Receber
        </button>
        <button
          onClick={() => setActiveTab('pagar')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'pagar' ? '#3A5F40' : 'transparent',
            color: activeTab === 'pagar' ? 'white' : '#E0E0E0',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🧾 Contas a Pagar
        </button>
      </div>

      {/* Contas a Receber */}
      {activeTab === 'receber' && (
        <div>
          {receivables.length === 0 ? (
            <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#9CA3AF' }}>Nenhum recebimento pendente</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {receivables.map(inst => {
                const status = getStatusInfo(inst, 'receivable')
                return (
                  <div key={inst.id} style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>Venda #{inst.sale_id?.slice(0, 8)}</p>
                        <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '0' }}>{inst.sales?.customer_name || 'Cliente não informado'}</p>
                        <p style={{ color: '#D95A1A', fontSize: '12px', margin: '4px 0 0 0' }}>Parcela {inst.installment_number}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#D95A1A', margin: '0' }}>{formatCurrency(inst.amount - (inst.paid_amount || 0))}</p>
                        <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#9CA3AF' }}>Vence: {format(new Date(inst.due_date), 'dd/MM/yyyy')}</p>
                        <span className={status.color} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>{status.label}</span>
                      </div>
                    </div>
                    {inst.status !== 'paid' && (
                      <button
                        onClick={() => handleReceiveInstallment(inst)}
                        style={{ marginTop: '12px', width: '100%', padding: '8px', backgroundColor: '#3A5F40', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Registrar Pagamento
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Contas a Pagar */}
      {activeTab === 'pagar' && (
        <div>
          <div style={{ marginBottom: '16px', textAlign: 'right' }}>
            <button
              onClick={() => {
                setEditingBill(null)
                setFormData({ description: '', amount: '', due_date: '', category: 'outros', notes: '', is_recurring: false, recurring_type: 'monthly' })
                setShowModal(true)
              }}
              style={{ padding: '10px 20px', backgroundColor: '#3A5F40', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              + Nova Conta
            </button>
          </div>

          {payables.length === 0 ? (
            <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#9CA3AF' }}>Nenhuma conta a pagar</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {payables.map(bill => {
                const status = getStatusInfo(bill, 'payable')
                return (
                  <div key={bill.id} style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{bill.description}</p>
                        <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '0' }}>{categories.find(c => c.value === bill.category)?.label || bill.category}</p>
                        {bill.is_recurring && <p style={{ color: '#F9A825', fontSize: '11px', margin: '4px 0 0 0' }}>🔄 Recorrente ({bill.recurring_type === 'monthly' ? 'Mensal' : bill.recurring_type === 'weekly' ? 'Semanal' : 'Anual'})</p>}
                        {bill.notes && <p style={{ color: '#9CA3AF', fontSize: '11px', margin: '4px 0 0 0' }}>📝 {bill.notes}</p>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#C62828', margin: '0' }}>{formatCurrency(bill.amount)}</p>
                        <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#9CA3AF' }}>Vence: {format(new Date(bill.due_date), 'dd/MM/yyyy')}</p>
                        <span className={status.color} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>{status.label}</span>
                      </div>
                    </div>
                    {!bill.paid && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button onClick={() => handlePayBill(bill)} style={{ flex: 1, padding: '8px', backgroundColor: '#2E7D32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Pagar</button>
                        <button onClick={() => { setEditingBill(bill); setFormData({ description: bill.description, amount: bill.amount, due_date: bill.due_date, category: bill.category, notes: bill.notes || '', is_recurring: bill.is_recurring, recurring_type: bill.recurring_type || 'monthly' }); setShowModal(true) }} style={{ padding: '8px', backgroundColor: '#D95A1A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Editar</button>
                        <button onClick={() => handleDeleteBill(bill.id)} style={{ padding: '8px', backgroundColor: '#C62828', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Excluir</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#D95A1A', marginBottom: '20px' }}>{editingBill ? 'Editar Conta' : 'Nova Conta'}</h2>
            <form onSubmit={handleSubmitBill}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Descrição *</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0' }} required />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Valor *</label>
                <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0' }} required />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Data de Vencimento *</label>
                <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0' }} required />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Categoria</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0' }}>
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.is_recurring} onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })} />
                  <span style={{ fontSize: '14px' }}>Conta recorrente (se repete automaticamente)</span>
                </label>
              </div>
              {formData.is_recurring && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Frequência</label>
                  <select value={formData.recurring_type} onChange={(e) => setFormData({ ...formData, recurring_type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0' }}>
                    <option value="monthly">Mensal</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              )}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Observações</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #3A5F40', backgroundColor: '#2C2C2C', color: '#E0E0E0', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#3A5F40', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Salvar</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid #9CA3AF', color: '#9CA3AF', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Accounts
