import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabaseClient';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

// Cache para o logo
let cachedLogoUrl = null
let logoPromise = null

async function getLogoUrl() {
  if (cachedLogoUrl) return cachedLogoUrl
  if (logoPromise) return logoPromise
  
  logoPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('logo_url')
        .limit(1)
        .maybeSingle()
      
      if (error) throw error
      cachedLogoUrl = data?.logo_url || null
      return cachedLogoUrl
    } catch (err) {
      console.log('Erro ao buscar logo:', err)
      return null
    }
  })()
  
  return logoPromise
}

async function loadImageAsDataUrl(url) {
  if (!url) return null
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Falha ao carregar imagem')
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.log('Erro ao carregar imagem:', err)
    return null
  }
}

export async function generatePDF(orcamento, type = 'orcamento') {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let y = 20

    // ===== CABEÇALHO =====
    doc.setFillColor(217, 90, 26)
    doc.rect(0, 0, pageWidth, 5, 'F')

    // Texto principal
    doc.setFontSize(22)
    doc.setTextColor(217, 90, 26)
    doc.text('SMOKE GARDEN', pageWidth / 2, 20, { align: 'center' })
    y = 30

    // Tentar adicionar o logo
    const logoUrl = await getLogoUrl()

    if (logoUrl) {
      try {
        const imgData = await loadImageAsDataUrl(logoUrl)
        if (imgData) {
          doc.addImage(imgData, 'JPEG', 15, 8, 35, 25)
        }
      } catch (err) {
        console.log('Erro ao adicionar logo:', err)
      }
    }

    // Subtítulo
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Mecânica Especializada 2 Tempos', pageWidth / 2, y + 3, { align: 'center' })

    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text('www.smokegarden.com.br', pageWidth / 2, y + 10, { align: 'center' })

    y = y + 25

    doc.setDrawColor(217, 90, 26)
    doc.setLineWidth(0.5)
    doc.line(15, y, pageWidth - 15, y)
    y += 10

    // Título do documento
    doc.setFillColor(217, 90, 26)
    doc.roundedRect(15, y - 4, pageWidth - 30, 12, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    
    const titulo = type === 'orcamento' ? 'ORÇAMENTO' : 'VENDA'
    const numero = orcamento.numero_orcamento || orcamento.numero_venda || orcamento.id?.slice(0, 8)
    doc.text(`${titulo} #${numero}`, pageWidth / 2, y + 3, { align: 'center' })
    
    y += 16

    // Informações do documento
    doc.setFillColor(245, 245, 245)
    doc.roundedRect(15, y - 4, pageWidth - 30, 18, 3, 3, 'F')
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    doc.text(`Data de criação: ${formatDate(orcamento.data_criacao || orcamento.created_at)}`, 22, y + 3)
    doc.text(`Validade: ${formatDate(orcamento.data_validade) || '30 dias'}`, 22, y + 11)
    
    y += 22

    // Dados do Cliente
    doc.setFillColor(60, 60, 60)
    doc.roundedRect(15, y - 4, pageWidth - 30, 10, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('DADOS DO CLIENTE', 22, y + 2)
    
    y += 12
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    doc.text(`Nome: ${orcamento.cliente_nome || 'Cliente não informado'}`, 22, y)
    y += 8
    
    if (orcamento.cliente_telefone) {
      doc.text(`Telefone: ${orcamento.cliente_telefone}`, 22, y)
      y += 8
    }
    if (orcamento.cliente_email) {
      doc.text(`E-mail: ${orcamento.cliente_email}`, 22, y)
      y += 8
    }
    
    y += 10

    // Preparar itens para a tabela
    const itens = orcamento.itens || []
    
    const tableBody = itens.map(item => {
      const nome = item.nome || item.produto_nome || item.descricao || item.nome_produto || 'Produto'
      const qtd = item.quantidade || 1
      const unitario = item.valor_unitario || item.preco_unitario || item.valor || 0
      const total = item.valor_total || item.preco_total || (unitario * qtd) || 0
      
      return [nome, qtd.toString(), formatCurrency(unitario), formatCurrency(total)]
    })

    if (tableBody.length === 0) {
      tableBody.push(['Nenhum item adicionado', '-', '-', '-'])
    }

    // Tabela
    autoTable(doc, {
      startY: y,
      head: [['DESCRIÇÃO', 'QTD', 'UNITÁRIO', 'TOTAL']],
      body: tableBody,
      margin: { left: 15, right: 15 },
      theme: 'striped',
      headStyles: {
        fillColor: [217, 90, 26],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60]
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      }
    })

    const finalY = doc.lastAutoTable.finalY + 10

    // Calcular totais
    const subtotal = itens.reduce((sum, item) => {
      const val = item.valor_total || item.preco_total || 
                  (item.valor_unitario || item.preco_unitario || 0) * (item.quantidade || 1)
      return sum + val
    }, 0)
    
    const desconto = orcamento.desconto || 0
    const total = (orcamento.total || subtotal) - desconto

    const totalX = pageWidth - 50
    
    // SÓ mostra Subtotal se houver desconto
    let currentY = finalY
    
    if (desconto > 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text('Subtotal:', totalX - 35, currentY)
      doc.setTextColor(60, 60, 60)
      doc.text(formatCurrency(subtotal), totalX, currentY)
      
      currentY += 8
      
      doc.setTextColor(100, 100, 100)
      doc.text('Desconto:', totalX - 35, currentY)
      doc.setTextColor(220, 38, 38)
      const descontoText = orcamento.tipo_desconto === 'percentual' ? `${desconto}%` : formatCurrency(desconto)
      doc.text(`- ${descontoText}`, totalX, currentY)
      currentY += 8
    }
    
    // Linha separadora (só se houver desconto, ou sempre para destacar)
    doc.setDrawColor(217, 90, 26)
    doc.setLineWidth(0.5)
    doc.line(totalX - 45, currentY - 3, pageWidth - 15, currentY - 3)
    
    // VALOR TOTAL (sempre mostra)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(34, 197, 94)
    doc.text('VALOR TOTAL:', totalX - 40, currentY + 2)
    doc.text(formatCurrency(total), totalX, currentY + 2)
    
    currentY += 20

    if (orcamento.observacoes) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 60, 60)
      doc.text('Observações:', 15, currentY)
      currentY += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const splitObs = doc.splitTextToSize(orcamento.observacoes, pageWidth - 30)
      doc.text(splitObs, 15, currentY)
    }

    const footerY = pageHeight - 12
    doc.setDrawColor(217, 90, 26)
    doc.setLineWidth(0.5)
    doc.line(15, footerY - 8, pageWidth - 15, footerY - 8)
    
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.setFont('helvetica', 'normal')
    doc.text('Smoke Garden - Mecânica Especializada 2 Tempos', pageWidth / 2, footerY - 2, { align: 'center' })
    doc.text('Este documento é uma proposta comercial.', pageWidth / 2, footerY + 3, { align: 'center' })

    const nomeArquivo = type === 'orcamento' 
      ? `orcamento_${orcamento.numero_orcamento || Date.now()}.pdf`
      : `venda_${orcamento.numero_venda || Date.now()}.pdf`
    
    doc.save(nomeArquivo)
    
    return true
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return false
  }
}