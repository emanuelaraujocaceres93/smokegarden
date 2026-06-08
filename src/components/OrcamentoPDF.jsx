import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 30, 
    backgroundColor: '#fff',
    fontFamily: 'Helvetica'
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20, 
    textAlign: 'center',
    color: '#D95A1A'
  },
  section: { 
    marginBottom: 15,
    padding: 10,
    borderBottom: '1px solid #e0e0e0'
  },
  label: { 
    fontSize: 12, 
    fontWeight: 'bold',
    marginBottom: 4
  },
  value: { 
    fontSize: 12, 
    marginBottom: 6 
  },
  table: { 
    display: 'table', 
    width: 'auto', 
    marginTop: 15 
  },
  tableRow: { 
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderBottomStyle: 'solid'
  },
  tableHeader: { 
    backgroundColor: '#f5f5f5', 
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#D95A1A'
  },
  tableCell: { 
    flex: 1, 
    padding: 8, 
    fontSize: 10 
  },
  tableCellSmall: { 
    flex: 0.5, 
    padding: 8, 
    fontSize: 10 
  },
  totalRow: { 
    marginTop: 20, 
    flexDirection: 'row', 
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTop: '2px solid #D95A1A'
  },
  totalText: { 
    fontSize: 16, 
    fontWeight: 'bold',
    color: '#D95A1A'
  },
  footer: { 
    marginTop: 40, 
    borderTop: '1px solid #ccc', 
    paddingTop: 10,
    alignItems: 'center'
  },
  footerText: { 
    fontSize: 9, 
    textAlign: 'center', 
    color: '#666' 
  }
});

export const orcamentoPDF = ({ orcamento, itens = [], empresa = {} }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>ORÇAMENTO</Text>
      <Text style={[styles.title, { fontSize: 18, marginTop: -10 }]}>
        #{orcamento.numero_orcamento || orcamento.id}
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>CLIENTE</Text>
        <Text style={styles.value}>Nome: {orcamento.cliente_nome || '—'}</Text>
        {orcamento.cliente_email && <Text style={styles.value}>E-mail: {orcamento.cliente_email}</Text>}
        {orcamento.cliente_telefone && <Text style={styles.value}>Telefone: {orcamento.cliente_telefone}</Text>}
        {orcamento.cliente_documento && <Text style={styles.value}>CPF/CNPJ: {orcamento.cliente_documento}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>DADOS DO ORÇAMENTO</Text>
        <Text style={styles.value}>Criação: {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}</Text>
        <Text style={styles.value}>Validade: {orcamento.valid_until ? new Date(orcamento.valid_until).toLocaleDateString('pt-BR') : '30 dias'}</Text>
        <Text style={styles.value}>Status: {orcamento.status === 'aprovado' ? 'APROVADO' : orcamento.status === 'recusado' ? 'RECUSADO' : 'RASCUNHO'}</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, { flex: 3 }]}>PRODUTO/SERVIÇO</Text>
          <Text style={styles.tableCellSmall}>QTD</Text>
          <Text style={styles.tableCellSmall}>UNITÁRIO</Text>
          <Text style={styles.tableCellSmall}>TOTAL</Text>
        </View>
        {(itens || []).map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 3 }]}>{item.produto_nome || item.Produto_nome || '—'}</Text>
            <Text style={styles.tableCellSmall}>{item.quantidade || 0}</Text>
            <Text style={styles.tableCellSmall}>R$ {(item.preco_unitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            <Text style={styles.tableCellSmall}>R$ {(item.preco_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalText}>
          TOTAL: R$ {(orcamento.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      {orcamento.observacoes && (
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.label}>OBSERVAÇÕES</Text>
          <Text style={styles.value}>{orcamento.observacoes}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{empresa?.nome || 'Smoke Garden - Mecânica 2 Tempos'}</Text>
        <Text style={styles.footerText}>Este documento é uma proposta comercial.</Text>
      </View>
    </Page>
  </Document>
);

export default orcamentoPDF;