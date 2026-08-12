import React from 'react'

const Card = ({ children, title, className = '', onClick }) => {
  return (
    <div
      style={{
        backgroundColor: '#1A1A1A',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '20px',
        transition: 'all 0.2s ease'
      }}
      className={className}
      onClick={onClick}
    >
      {title && <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#D95A1A', marginBottom: '12px' }}>{title}</h3>}
      {children}
    </div>
  )
}

export default Card