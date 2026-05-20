import React from 'react'

const PageHeader = ({ title, description, actions }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '16px',
      marginBottom: '24px'
    }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#D95A1A', margin: 0 }}>{title}</h1>
        {description && <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>{description}</p>}
      </div>
      {actions && <div style={{ width: '100%' }}>{actions}</div>}
    </div>
  )
}

export default PageHeader
