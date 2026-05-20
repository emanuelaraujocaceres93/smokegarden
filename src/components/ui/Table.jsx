import React from 'react'

export default function Table({ headers = [], data = [], renderRow, emptyMessage = 'Nenhum registro encontrado.', className = '', children }) {
  const hasRowRenderer = typeof renderRow === 'function' && Array.isArray(data)
  const hasChildren = React.Children.count(children) > 0

  return (
    <div className={`table-container ${className}`.trim()}>
      <table className="table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasRowRenderer ? (
            data.length > 0 ? (
              data.map((row, index) => renderRow(row, index))
            ) : (
              <tr>
                <td colSpan={headers.length} style={{ padding: 18, color: 'rgba(224,224,224,.72)' }}>
                  {emptyMessage}
                </td>
              </tr>
            )
          ) : hasChildren ? (
            children
          ) : (
            <tr>
              <td colSpan={headers.length} style={{ padding: 18, color: 'rgba(224,224,224,.72)' }}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
