import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format, differenceInDays, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Loading from '../../components/ui/Loading'
import Button from '../../components/ui/Button'

const PendingPayments = () => {
  const [loading, setLoading] = useState(true)
  const [pendingSales, setPendingSales] = useState([])
  const [payingInstallment, setPayingInstallment] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Buscar todas as vendas
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })

      if (salesError) throw salesError

      // Buscar todas as parcelas
      const { data: installments, error: installmentsError } = await supabase
        .from('installments')
        .select('*')
        .order('due_date', { ascending: true })

      if (installmentsError) throw installmentsError

      // Filtrar vendas com parcelas pendentes
      const salesWithPending = (sales || []).filter(sale => {
        const saleInstallments = (installments || []).filter(i => i.sale_id === sale.id)
        const hasPending = saleInstallments.some(i => i.status !== 'paid')
        return hasPending && saleInstallments.length > 0
      })

      // Adicionar parcelas a cada venda
      const formattedSales = salesWithPending.map(sale => ({
        ...sale,
        installments: (installments || [])
          .filter(i => i.sale_id === sale.id)
          .map(inst => {
            const dueDate = new Date(inst.due_date)
            const today = new Date()
            const daysDiff = differenceInDays(dueDate, today)
            
            let statusColor = 'text-yellow-400'
            if (inst.status === 'paid') statusColor = 'text-green-400'
            else if (daysDiff < 0 && daysDiff >= -15) statusColor = 'text-orange-400'
            else if (daysDiff < -15) statusColor = 'text-red-400'
            else if (daysDiff <= 7) statusColor = 'text-yellow-400'
            
            return {
              ...inst,
              daysDiff,
              statusColor,
              isOverdue: daysDiff < 0 && inst.status !== 'paid',
              dueDateFormatted: format(dueDate, 'dd/MM/yyyy', { locale: ptBR })
            }
          })
      }))

      setPendingSales(formattedSales)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar pagamentos pendentes')
    } finally {
      setLoading(false)
    }
  }

  const handlePayInstallment = async (installment, sale) => {
    try {
      const paidAmount = installment.amount
      const newPaidAmount = (installment.paid_amount || 0) + paidAmount
      const isFullyPaid = newPaidAmount >= installment.amount

      // Atualizar parcela
      const { error: updateError } = await supabase
        .from('installments')
        .update({
          paid_amount: newPaidAmount,
          status: isFullyPaid ? 'paid' : 'partial',
          paid_at: isFullyPaid ? new Date().toISOString() : null
        })
        .eq('id', installment.id)

      if (updateError) throw updateError

      // Se todas as parcelas estiverem pagas, atualizar status da venda
      if (isFullyPaid) {
        const saleInstallments = pendingSales
          .find(s => s.id === sale.id)
          ?.installments.filter(i => i.id !== installment.id) || []
        
        const allPaid = saleInstallments.every(i => i.status === 'paid' || i.id === installment.id)
        
        if (allPaid) {
          await supabase
            .from('sales')
            .update({ status: 'completed' })
            .eq('id', sale.id)
        }
      }

      toast.success(`Pagamento registrado! ${isFullyPaid ? 'Parcela quitada!' : 'Pagamento parcial registrado'}`)
      loadData()
      setPayingInstallment(null)
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      toast.error('Erro ao registrar pagamento')
    }
  }

  const getStatusInfo = (installment) => {
    if (installment.status === 'paid') {
      return { label: 'Pago', color: 'bg-success text-white' }
    }
    if (installment.isOverdue) {
      if (installment.daysDiff < -15) {
        return { label: 'Atrasado (Crítico)', color: 'bg-alertRed text-white' }
      }
      return { label: 'Vencido', color: 'bg-alertRed text-white' }
    }
    if (installment.daysDiff <= 7) {
      return { label: 'Vence em breve', color: 'bg-alertYellow text-carbon' }
    }
    return { label: 'Pendente', color: 'bg-garden text-white' }
  }

  if (loading) return <Loading />

  if (pendingSales.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-grayLight mb-2">Nenhum pagamento pendente</p>
          <p className="text-sm text-gray-500">Todas as parcelas estão em dia!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-burnt">Pagamentos Pendentes</h1>
        <p className="text-grayLight text-sm mt-1">Gerencie as parcelas e acompanhe os vencimentos</p>
      </div>

      <div className="space-y-4">
        {pendingSales.map((sale) => (
          <Card key={sale.id} className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-4 border-b border-gray-700">
              <div>
                <h3 className="font-semibold text-white">Venda #{sale.id.slice(0, 8)}</h3>
                <p className="text-sm text-grayLight">
                  Cliente: {sale.customer_name || 'Não informado'}
                </p>
                <p className="text-sm text-grayLight">
                  Data: {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div className="mt-2 md:mt-0 text-right">
                <p className="text-lg font-bold text-burnt">
                  Total: R$ {sale.total_amount.toFixed(2)}
                </p>
                <p className="text-sm text-grayLight">
                  Pago: R$ {sale.paid_amount?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-grayLight border-b border-gray-700">
                  <tr>
                    <th className="py-2 text-left">Parcela</th>
                    <th className="py-2 text-left">Vencimento</th>
                    <th className="py-2 text-left">Valor</th>
                    <th className="py-2 text-left">Pago</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.installments.map((inst) => {
                    const statusInfo = getStatusInfo(inst)
                    return (
                      <tr key={inst.id} className="border-b border-gray-800">
                        <td className="py-3">{inst.installment_number}ª</td>
                        <td className="py-3">{inst.dueDateFormatted}</td>
                        <td className="py-3">R$ {inst.amount.toFixed(2)}</td>
                        <td className="py-3">R$ {(inst.paid_amount || 0).toFixed(2)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3">
                          {inst.status !== 'paid' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setPayingInstallment({ installment: inst, sale })}
                            >
                              Pagar
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Barra de progresso */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-grayLight mb-1">
                <span>Progresso do pagamento</span>
                <span>
                  {((sale.paid_amount || 0) / sale.total_amount * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-garden h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(sale.paid_amount || 0) / sale.total_amount * 100}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de pagamento */}
      {payingInstallment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-burnt mb-4">Registrar Pagamento</h2>
            <p className="text-grayLight mb-2">
              Parcela {payingInstallment.installment.installment_number}ª
            </p>
            <p className="text-2xl font-bold text-white mb-4">
              R$ {payingInstallment.installment.amount.toFixed(2)}
            </p>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => handlePayInstallment(payingInstallment.installment, payingInstallment.sale)}
                className="flex-1"
              >
                Confirmar Pagamento
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPayingInstallment(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default PendingPayments