import React from 'react'

export default function Card({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`.trim()}>
      {title && (
        <div className="card-header">
          <h2 className="card-title">{title}</h2>
        </div>
      )}
      {children}
    </div>
  )
}
