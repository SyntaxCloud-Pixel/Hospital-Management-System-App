export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h2>
          <button className="secondary" onClick={onClose} style={{ padding: '4px 10px' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
