import React, { useState } from 'react'

const Button = ({ children, onClick, type = 'button', variant = 'primary' }) => {
  const [hover, setHover] = useState(false)
  
  const colors = {
    primary: { bg: '#D95A1A', hover: '#b75419' },
    secondary: { bg: '#3A5F40', hover: '#2f6d3a' },
    danger: { bg: '#C62828', hover: '#a32220' }
  }
  
  const color = colors[variant] || colors.primary
  
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        backgroundColor: hover ? color.hover : color.bg,
        color: 'white',
        padding: '8px 16px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s ease'
      }}
    >
      {children}
    </button>
  )
}

export default Button
