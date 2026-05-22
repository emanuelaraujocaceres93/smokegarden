
const Card = ({ children, title, className = '', onClick }) => {
  return (
    <div className={`panel ${className}`} onClick={onClick}>
      {title && <h3 className="panel-title">{title}</h3>}
      {children}
    </div>
  )
}

export default Card