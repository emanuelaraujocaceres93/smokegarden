
const variantMap = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning'
}

export default function Alert({ variant = 'success', children, className = '' }) {
  const variantClass = variantMap[variant] || variantMap.success
  return <div className={`alert ${variantClass} ${className}`.trim()}>{children}</div>
}
