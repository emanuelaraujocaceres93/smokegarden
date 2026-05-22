
const Container = ({ children, className = '', fluid = false }) => {
  return (
    <div 
      style={{
        width: fluid ? '100%' : 'min(100%, 1180px)',
        margin: '0 auto',
        padding: '0 16px'
      }}
      className={className}
    >
      {children}
    </div>
  )
}

export default Container
