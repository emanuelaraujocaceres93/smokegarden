import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

function Tooltip({ text, isOpen, onToggle }) {
  return (
    <span style={{ position: 'relative', marginLeft: '8px', cursor: 'help' }}>
      <button
        onClick={onToggle}
        style={{ background: '#3A5F40', border: 'none', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '12px', cursor: 'pointer' }}
      >?</button>
      {isOpen && (
        <div style={{ position: 'absolute', bottom: '25px', left: '0', background: '#1A1A1A', border: '1px solid #D95A1A', borderRadius: '6px', padding: '8px', width: '220px', fontSize: '12px', zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          {text}
        </div>
      )}
    </span>
  )
}

const Settings = () => {
  const [loading, setLoading] = useState(true)
  const [paymentFees, setPaymentFees] = useState([])
  const [taxes, setTaxes] = useState([])
  const [showTooltip, setShowTooltip] = useState(null)

  const paymentMethods = [
    { id: 'cash', label: 'Dinheiro' },
    { id: 'pix', label: 'Pix' },
    { id: 'card_debit', label: 'Cartão Débito' },
    { id: 'card_credit', label: 'Cartão Crédito' },
    { id: 'installment', label: 'Parcelado' }
  ]

  useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    setLoading(true)
    // Buscar taxas de pagamento
    const { data: feesData } = await supabase.from('payment_fees').select('*')
    // Buscar impostos
    const { data: taxesData } = await supabase.from('taxes').select('*')
    
    setPaymentFees(feesData || [])
    setTaxes(taxesData || [])
    setLoading(false)
  }

  const updatePaymentFee = async (method, fee) => {
    const { error } = await supabase
      .from('payment_fees')
      .upsert({ payment_method: method, fee_percent: fee }, { onConflict: 'payment_method' })
    if (error) toast.error('Erro ao salvar taxa')
    else toast.success('Taxa salva!')
    fetchConfigs()
  }

  const updateTax = async (name, rate) => {
    const { error } = await supabase
      .from('taxes')
      .upsert({ name, rate_percent: rate }, { onConflict: 'name' })
    if (error) toast.error('Erro ao salvar imposto')
    else toast.success('Imposto salvo!')
    fetchConfigs()
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Carregando...</div>

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A' }}>Configurações</h1>
      <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>Configure taxas, impostos e regras financeiras</p>

      {/* Taxas por forma de pagamento */}
      <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '16px' }}>
          💳 Taxas por Forma de Pagamento
          <Tooltip
            text="Taxas cobradas pelas operadoras (ex: cartão 2%). Aplicadas sobre o valor recebido."
            isOpen={showTooltip === 'paymentFees'}
            onToggle={() => setShowTooltip(showTooltip === 'paymentFees' ? null : 'paymentFees')}
          />
        </h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {paymentMethods.map(method => {
            const fee = paymentFees.find(f => f.payment_method === method.id)?.fee_percent || 0
            return (
              <div key={method.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ width: '120px' }}>{method.label}</span>
                <input
                  type="number"
                  step="0.1"
                  value={fee}
                  onChange={(e) => updatePaymentFee(method.id, parseFloat(e.target.value))}
                  style={{ width: '100px', padding: '6px', borderRadius: '6px', background: '#2C2C2C', border: '1px solid #3A5F40', color: '#E0E0E0' }}
                />
                <span>%</span>
                {fee > 0 && <span style={{ fontSize: '12px', color: '#F9A825' }}>Desconta {fee}% do recebido</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Impostos */}
      <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '16px' }}>
          📊 Impostos
          <Tooltip
            text="Impostos aplicados sobre o faturamento (DAS do MEI, ISS, ICMS, etc.)."
            isOpen={showTooltip === 'taxes'}
            onToggle={() => setShowTooltip(showTooltip === 'taxes' ? null : 'taxes')}
          />
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {taxes.map(tax => (
            <div key={tax.name} style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ width: '120px' }}>{tax.name}</span>
              <input
                type="number"
                step="0.1"
                value={tax.rate_percent}
                onChange={(e) => updateTax(tax.name, parseFloat(e.target.value))}
                style={{ width: '100px', padding: '6px', borderRadius: '6px', background: '#2C2C2C', border: '1px solid #3A5F40', color: '#E0E0E0' }}
              />
              <span>%</span>
            </div>
          ))}
          <button
            onClick={() => {
              const name = prompt('Nome do imposto (ex: DAS MEI):')
              if (name) updateTax(name, 0)
            }}
            style={{ alignSelf: 'flex-start', padding: '6px 12px', background: '#3A5F40', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
          >
            + Adicionar Imposto
          </button>
        </div>
      </div>

      {/* Ajuda sobre os conceitos */}
      <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '20px' }}>
        <h2 style={{ color: '#D95A1A', fontSize: '18px', marginBottom: '12px' }}>📘 Entenda os indicadores</h2>
        <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
          <p><strong>💰 Faturamento Bruto:</strong> Total vendido (preço de venda).</p>
          <p><strong>📦 CPV (Custo Produto Vendido):</strong> Soma do preço de compra dos produtos vendidos.</p>
          <p><strong>📈 Lucro Bruto:</strong> Faturamento - CPV.</p>
          <p><strong>💸 Taxas:</strong> Descontos de cartão/parcelamento sobre o recebido.</p>
          <p><strong>🏛️ Impostos:</strong> Percentuais aplicados sobre o faturamento.</p>
          <p><strong>📉 Despesas Pagas:</strong> Contas da loja (aluguel, luz, etc.).</p>
          <p><strong>⚖️ Lucro Líquido:</strong> Lucro Bruto - Taxas - Impostos - Despesas Pagas.</p>
          <p><strong>📊 Margem de Lucro:</strong> (Lucro Líquido / Faturamento) × 100.</p>
        </div>
      </div>
    </div>
  )
}

export default Settings
