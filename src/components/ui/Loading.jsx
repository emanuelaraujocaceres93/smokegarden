
export default function Loading({ message = 'Carregando...' }) {
  return (
    <div className="loading-root">
      <div className="spinner" />
      <div>{message}</div>
    </div>
  )
}
