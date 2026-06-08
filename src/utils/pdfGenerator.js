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
    let y = 20

    // Cabeçalho - Linha decorativa
    doc.setFillColor(217, 90, 26)
    doc.rect(0, 0, pageWidth, 4, 'F')
    
    // Logo texto
    doc.setFontSize(22)
    doc.setTextColor(217, 90, 26)
    doc.text('SMOKE GARDEN', pageWidth / 2, 18, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setTextColor(102, 102, 102)
    doc.text('Mecanica Especializada 2 Tempos', pageWidth / 2, 26, { align: 'center' })
    
    // Site correto da página pública
    doc.setFontSize(9)
    doc.text('smokegarden.vercel.app/public', pageWidth / 2, 33, { align: 'center' })
    
    y = 45
    
    // Linha separadora
    doc.setDrawColor(217, 90, 26)
    doc.setLineWidth(0.5)
    doc.line(20, y, pageWidth - 20, y)
    y += 8

    // Título do documento
    doc.setFillColor(217, 90, 26)
    doc.roundedRect(20, y - 4, pageWidth - 40, 10, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    
    const titulo = type === 'orcamento' ? 'ORCAMENTO' : 'VENDA'
    const numero = orcamento.numero_orcamento || orcamento.numero_venda || orcamento.id?.slice(0, 8)
    doc.text(`${titulo} #${numero}`, pageWidth / 2, y + 2, { align: 'center' })
    
    y += 14

    // Informações do documento
    doc.setFillColor(248, 248, 248)
    doc.roundedRect(20, y - 4, pageWidth - 40, 20, 3, 3, 'F')
    doc.setTextColor(51, 51, 51)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    doc.text(`Data de criacao: ${formatDate(orcamento.data_criacao || orcamento.created_at)}`, 28, y + 2)
    doc.text(`Validade: ${formatDate(orcamento.data_validade)}`, 28, y + 10)
    
    y += 24

    // Dados do Cliente
    doc.setFillColor(44, 44, 44)
    doc.roundedRect(20, y - 4, pageWidth - 40, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('DADOS DO CLIENTE', 28, y)
    
    y += 10
    doc.setTextColor(51, 51, 51)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    doc.text(`Nome: ${orcamento.cliente_nome || 'Cliente nao informado'}`, 28, y)
    y += 7
    
    if (orcamento.cliente_telefone) {
      doc.text(`Telefone: ${orcamento.cliente_telefone}`, 28, y)
      y += 7
    }
    if (orcamento.cliente_email) {
      doc.text(`Email: ${orcamento.cliente_email}`, 28, y)
      y += 7
    }
    
    y += 8

    // Tabela de Itens
    const itens = orcamento.itens || []
    
    if (itens.length > 0) {
      // Cabeçalho da tabela
      doc.setFillColor(217, 90, 26)
      doc.rect(20, y, pageWidth - 40, 9, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      
      doc.text('DESCRICAO', 25, y + 6)
      doc.text('QTD', 110, y + 6)
      doc.text('UNITARIO', 140, y + 6)
      doc.text('TOTAL', 180, y + 6)
      
      y += 9
      doc.setTextColor(51, 51, 51)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      let rowNum = 0
      for (const item of itens) {
        // Verificar se precisa de nova página
        if (y > 250) {
          doc.addPage()
          y = 20
          // Recriar cabeçalho
          doc.setFillColor(217, 90, 26)
          doc.rect(20, y, pageWidth - 40, 9, 'F')
          doc.setTextColor(255, 255, 255)
          doc.text('DESCRICAO', 25, y + 6)
          doc.text('QTD', 110, y + 6)
          doc.text('UNITARIO', 140, y + 6)
          doc.text('TOTAL', 180, y + 6)
          y += 9
          doc.setTextColor(51, 51, 51)
        }
        
        // Alternar cor de fundo das linhas
        if (rowNum % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(20, y - 4, pageWidth - 40, 7, 'F')
        }
        
        const descricao = item.descricao?.substring(0, 45) || '-'
        doc.text(descricao, 25, y + 2)
        doc.text(String(item.quantidade), 110, y + 2)
        doc.text(formatCurrency(item.valor_unitario), 140, y + 2)
        doc.text(formatCurrency(item.valor_total), 180, y + 2)
        
        y += 7
        rowNum++
      }
      
      y += 5
    }

    // Totais
    doc.setDrawColor(200, 200, 200)
    doc.line(20, y, pageWidth - 20, y)
    y += 8

    const totalX = pageWidth - 55
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(102, 102, 102)
    doc.text('Subtotal:', totalX - 35, y)
    doc.setTextColor(51, 51, 51)
    doc.text(formatCurrency(orcamento.subtotal || 0), totalX, y)
    y += 7
    
    if (orcamento.desconto > 0) {
      doc.setTextColor(102, 102, 102)
      doc.text('Desconto:', totalX - 35, y)
      doc.setTextColor(220, 38, 38)
      const descontoText = orcamento.tipo_desconto === 'percentual' 
        ? `${orcamento.desconto}%` 
        : formatCurrency(orcamento.desconto)
      doc.text(`- ${descontoText}`, totalX, y)
      y += 7
    }
    
    // Linha separadora antes do total
    doc.setDrawColor(217, 90, 26)
    doc.setLineWidth(0.3)
    doc.line(totalX - 45, y, pageWidth - 20, y)
    y += 5
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(34, 197, 94)
    doc.text('VALOR TOTAL:', totalX - 35, y)
    doc.text(formatCurrency(orcamento.total || 0), totalX, y)
    
    y += 20

    // Observações
    if (orcamento.observacoes) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(51, 51, 51)
      doc.text('Observacoes:', 20, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const splitObs = doc.splitTextToSize(orcamento.observacoes, pageWidth - 40)
      doc.text(splitObs, 20, y)
    }

    // Rodapé simples - apenas linha e nome da empresa
    const footerY = doc.internal.pageSize.getHeight() - 15
    doc.setDrawColor(217, 90, 26)
    doc.setLineWidth(0.5)
    doc.line(20, footerY - 5, pageWidth - 20, footerY - 5)
    
    doc.setFontSize(8)
    doc.setTextColor(102, 102, 102)
    doc.text('Smoke Garden - Mecanica Especializada 2 Tempos', pageWidth / 2, footerY, { align: 'center' })

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