import { jsPDF } from 'jspdf'

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

export async function generatePDF(orcamento, type = 'orcamento') {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let y = 20

    // Cabeçalho - Linha decorativa
    doc.setFillColor(217, 90, 26)
    doc.rect(0, 0, pageWidth, 5, 'F')
    
    // Logo texto
    doc.setFontSize(22)
    doc.setTextColor(217, 90, 26)
    doc.text('SMOKE GARDEN', pageWidth / 2, 20, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Mecânica Especializada 2 Tempos', pageWidth / 2, 28, { align: 'center' })
    
    // Site
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text('smokegarden.vercel.app/public', pageWidth / 2, 35, { align: 'center' })
    
    y = 48
    
    // Linha separadora
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
    
    y += 8

    // Tabela de Itens
    const itens = orcamento.itens || []
    
    if (itens.length > 0) {
      // Cabeçalho da tabela
      doc.setFillColor(217, 90, 26)
      doc.rect(15, y, pageWidth - 30, 10, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      
      doc.text('DESCRIÇÃO', 20, y + 7)
      doc.text('QTD', 110, y + 7)
      doc.text('UNITÁRIO', 140, y + 7)
      doc.text('TOTAL', 180, y + 7)
      
      y += 10
      doc.setTextColor(60, 60, 60)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      let rowNum = 0
      for (const item of itens) {
        // Verificar se precisa de nova página
        if (y > pageHeight - 50) {
          doc.addPage()
          y = 20
          
          // Recriar cabeçalho na nova página
          doc.setFillColor(217, 90, 26)
          doc.rect(15, y, pageWidth - 30, 10, 'F')
          doc.setTextColor(255, 255, 255)
          doc.text('DESCRIÇÃO', 20, y + 7)
          doc.text('QTD', 110, y + 7)
          doc.text('UNITÁRIO', 140, y + 7)
          doc.text('TOTAL', 180, y + 7)
          y += 10
          doc.setTextColor(60, 60, 60)
        }
        
        // Alternar cor de fundo das linhas
        if (rowNum % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(15, y - 4, pageWidth - 30, 8, 'F')
        }
        
        const descricao = item.nome || item.produto_nome || item.descricao || '-'
        const descricaoCurtada = descricao.length > 40 ? descricao.substring(0, 37) + '...' : descricao
        doc.text(descricaoCurtada, 20, y + 2)
        doc.text(String(item.quantidade || 1), 110, y + 2)
        doc.text(formatCurrency(item.valor_unitario || item.preco_unitario || 0), 140, y + 2)
        doc.text(formatCurrency(item.valor_total || item.preco_total || 0), 180, y + 2)
        
        y += 8
        rowNum++
      }
      
      y += 8
    }

    // Totais
    doc.setDrawColor(200, 200, 200)
    doc.line(15, y, pageWidth - 15, y)
    y += 10

    const totalX = pageWidth - 50
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Subtotal:', totalX - 35, y)
    doc.setTextColor(60, 60, 60)
    doc.text(formatCurrency(orcamento.subtotal || 0), totalX, y)
    y += 8
    
    if (orcamento.desconto && orcamento.desconto > 0) {
      doc.setTextColor(100, 100, 100)
      doc.text('Desconto:', totalX - 35, y)
      doc.setTextColor(220, 38, 38)
      const descontoText = orcamento.tipo_desconto === 'percentual' 
        ? `${orcamento.desconto}%` 
        : formatCurrency(orcamento.desconto)
      doc.text(`- ${descontoText}`, totalX, y)
      y += 8
    }
    
    // Linha separadora antes do total
    doc.setDrawColor(217, 90, 26)
    doc.setLineWidth(0.5)
    doc.line(totalX - 45, y - 3, pageWidth - 15, y - 3)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(34, 197, 94)
    doc.text('VALOR TOTAL:', totalX - 40, y + 2)
    doc.text(formatCurrency(orcamento.total || 0), totalX, y + 2)
    
    y += 20

    // Observações
    if (orcamento.observacoes) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 60, 60)
      doc.text('Observações:', 15, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const splitObs = doc.splitTextToSize(orcamento.observacoes, pageWidth - 30)
      doc.text(splitObs, 15, y)
      y += splitObs.length * 5 + 5
    }

    // Rodapé
    const footerY = pageHeight - 12
    doc.setDrawColor(217, 90, 26)
    doc.setLineWidth(0.5)
    doc.line(15, footerY - 8, pageWidth - 15, footerY - 8)
    
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.setFont('helvetica', 'normal')
    doc.text('Smoke Garden - Mecânica Especializada 2 Tempos', pageWidth / 2, footerY - 2, { align: 'center' })
    doc.text('Este documento é uma proposta comercial.', pageWidth / 2, footerY + 3, { align: 'center' })

    // Salvar PDF
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