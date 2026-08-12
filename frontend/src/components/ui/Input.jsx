
export default function Input({ label, id, textarea = false, error, className = '', ...props }) {
  const controlClass = textarea ? 'form-textarea' : 'form-input'

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      {textarea ? (
        <textarea id={id} className={controlClass} {...props} />
      ) : (
        <input id={id} className={controlClass} {...props} />
      )}
      {error && <small className="text-alertRed">{error}</small>}
    </div>
  )
}
