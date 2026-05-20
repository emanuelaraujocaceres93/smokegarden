import React from 'react'

const variantMap = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  warning: 'btn-warning'
}

const sizeMap = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const variantClass = variantMap[variant] || variantMap.primary
  const sizeClass = sizeMap[size] || sizeMap.md
  const isDisabled = disabled || loading

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <span className="btn-spinner" /> : null}
      <span>{children}</span>
    </button>
  )
}
