import React from 'react'

const Card = ({ children, title, className = '', onClick }) => {
  return (
    <div 
      className={g-carbon rounded-xl border border-border p-5 shadow-soft transition-all duration-200 hover:shadow-md }
      onClick={onClick}
    >
      {title && <h3 className="text-lg font-semibold text-burnt mb-3">{title}</h3>}
      {children}
    </div>
  )
}

export default Card
